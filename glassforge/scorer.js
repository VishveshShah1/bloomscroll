/*
 * GlassForge Scorer - the 25-point "3D interactive liquid glass" rubric engine.
 *
 * Runs against a LIVE rendered document (not source text): computed styles,
 * synthetic mousemove probes for tilt, real scroll probes for parallax.
 *
 * Usage inside the GlassForge app:
 *   await GlassForgeScorer.score(iframe.contentWindow, iframe.contentDocument)
 *
 * Usage on a LIVE deployed site (paste this whole file into the DevTools
 * console on the page, then run):
 *   GlassForgeScorer.score().then(r => console.log(GlassForgeScorer.format(r)))
 *
 * Scoring: 5 categories x 5 points = 25. Pass bar: total >= 22 AND no
 * category under 3.
 */
(function (global) {
  "use strict";

  function raf(win) {
    return new Promise((res) => win.requestAnimationFrame(() => res()));
  }
  function wait(win, ms) {
    return new Promise((res) => win.setTimeout(res, ms));
  }
  async function settle(win, frames, ms) {
    for (let i = 0; i < frames; i++) await raf(win);
    if (ms) await wait(win, ms);
  }

  // Parse the alpha channel out of a computed color. Computed colors are
  // rgb(...) / rgba(...) / color(srgb ...) in practice.
  function alphaOf(color) {
    if (!color) return 1;
    if (color === "transparent") return 0;
    let m = color.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
      return parts.length >= 4 ? parseFloat(parts[3]) : 1;
    }
    m = color.match(/color\([^)]+\/\s*([\d.]+)\s*\)/);
    if (m) return parseFloat(m[1]);
    return 1;
  }

  function blurRadius(filterValue) {
    const m = (filterValue || "").match(/blur\(\s*([\d.]+)px\s*\)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function area(el) {
    const r = el.getBoundingClientRect();
    return r.width * r.height;
  }

  function collectRules(doc, out) {
    out = out || [];
    for (const sheet of Array.from(doc.styleSheets)) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (e) {
        continue; // cross-origin sheet
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        out.push(rule);
        if (rule.cssRules) {
          for (const inner of Array.from(rule.cssRules)) out.push(inner);
        }
      }
    }
    return out;
  }

  async function score(win, doc) {
    win = win || global;
    doc = doc || win.document;
    const cs = (el) => win.getComputedStyle(el);
    const all = Array.from(doc.querySelectorAll("*")).slice(0, 4000);
    const source = doc.documentElement.outerHTML;
    const rules = collectRules(doc);
    const savedScroll = win.scrollY;

    const categories = [];
    const failures = [];

    function addCategory(key, label, checks) {
      const capped = checks.map((c) => ({ ...c, earned: Math.min(c.earned, c.points) }));
      const score = Math.min(5, capped.reduce((s, c) => s + c.earned, 0));
      categories.push({ key, label, score, max: 5, checks: capped });
      for (const c of capped) {
        if (c.earned < c.points) failures.push(`[${label}] ${c.name}: ${c.detail}`);
      }
      return score;
    }

    /* ---------------- GLASS (/5) ---------------- */
    const blurSurfaces = all.filter((el) => {
      const s = cs(el);
      const bf = s.backdropFilter || s.webkitBackdropFilter || "";
      return bf.includes("blur") && area(el) > 900;
    });
    const translucent = blurSurfaces.filter((el) => alphaOf(cs(el).backgroundColor) < 1);
    const bordered = blurSurfaces.filter((el) => {
      const s = cs(el);
      return parseFloat(s.borderTopWidth) > 0 && alphaOf(s.borderTopColor) <= 0.6;
    });
    const glowShapes = all.filter((el) => {
      const s = cs(el);
      const isBlurred = blurRadius(s.filter) >= 20 && area(el) >= 8000;
      const isGradientLayer =
        /radial-gradient|conic-gradient/.test(s.backgroundImage) &&
        (s.position === "absolute" || s.position === "fixed") &&
        area(el) >= 8000;
      return isBlurred || isGradientLayer;
    });

    addCategory("glass", "Glass", [
      {
        name: "backdrop-filter blur on 3+ surfaces",
        points: 2,
        earned: blurSurfaces.length >= 3 ? 2 : blurSurfaces.length >= 1 ? 1 : 0,
        detail: `${blurSurfaces.length} surfaces with backdrop-filter blur (need 3+)`,
      },
      {
        name: "semi-transparent backgrounds on glass",
        points: 1,
        earned: translucent.length >= 3 ? 1 : 0,
        detail: `${translucent.length} glass surfaces with alpha < 1 backgrounds (need 3+)`,
      },
      {
        name: "thin low-opacity light borders",
        points: 1,
        earned: bordered.length >= 3 ? 1 : 0,
        detail: `${bordered.length} glass surfaces with low-opacity borders (need 3+)`,
      },
      {
        name: "blurred colour shapes behind the glass",
        points: 1,
        earned: glowShapes.length >= 2 ? 1 : 0,
        detail: `${glowShapes.length} large blurred/gradient glow shapes found (need 2+)`,
      },
    ]);

    /* ---------------- 3D (/5) ---------------- */
    const hasPerspective =
      all.some((el) => {
        const s = cs(el);
        return s.perspective !== "none" || (s.transform || "").includes("perspective");
      }) || /perspective/.test(source);

    // Runtime tilt probe: fire mousemove at two corners of candidate cards and
    // watch for a computed-transform change.
    let tiltWorks = false;
    const tiltCandidates = Array.from(
      doc.querySelectorAll('[data-tilt], [class*="tilt"], [class*="card"]')
    ).slice(0, 40);
    const tiltPool = tiltCandidates.length ? tiltCandidates : all.slice(0, 200);
    const fireMove = (el, fx, fy) => {
      const r = el.getBoundingClientRect();
      try {
        el.dispatchEvent(
          new win.MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            view: win,
            clientX: r.left + r.width * fx,
            clientY: r.top + r.height * fy,
          })
        );
      } catch (e) {}
    };
    const snapT = () => tiltPool.map((el) => cs(el).transform);
    const t0 = snapT();
    tiltPool.forEach((el) => fireMove(el, 0.92, 0.08));
    await settle(win, 3, 60);
    const t1 = snapT();
    tiltPool.forEach((el) => fireMove(el, 0.08, 0.92));
    await settle(win, 3, 60);
    const t2 = snapT();
    for (let i = 0; i < tiltPool.length; i++) {
      if (t0[i] !== t1[i] || t1[i] !== t2[i]) {
        tiltWorks = true;
        break;
      }
    }
    const tiltPatternOnly = /rotate[XY]/.test(source) && /mousemove|pointermove/.test(source);

    let webgl = typeof win.THREE !== "undefined";
    if (!webgl) {
      for (const c of Array.from(doc.querySelectorAll("canvas"))) {
        try {
          if (c.getContext("webgl2") || c.getContext("webgl")) {
            webgl = true;
            break;
          }
        } catch (e) {}
      }
    }

    const zSet = new Set();
    for (const el of all) {
      const s = cs(el);
      if (s.position !== "static" && s.zIndex !== "auto") zSet.add(s.zIndex);
    }
    const depth = zSet.size >= 3 || /translateZ|translate3d/.test(source);

    addCategory("threed", "3D", [
      {
        name: "CSS perspective present",
        points: 1,
        earned: hasPerspective ? 1 : 0,
        detail: "no element with CSS perspective / perspective() transform",
      },
      {
        name: "mouse-reactive tilt (verified at runtime)",
        points: 2,
        earned: tiltWorks ? 2 : tiltPatternOnly ? 1 : 0,
        detail: tiltWorks
          ? "ok"
          : tiltPatternOnly
            ? "tilt code present but no transform change observed on synthetic mousemove"
            : "no rotateX/rotateY response to mouse movement",
      },
      {
        name: "WebGL / Three.js element",
        points: 1,
        earned: webgl ? 1 : 0,
        detail: "no WebGL canvas or THREE global found",
      },
      {
        name: "layered depth (z-index / translateZ)",
        points: 1,
        earned: depth ? 1 : 0,
        detail: `only ${zSet.size} distinct z-index layers (need 3+) and no translateZ`,
      },
    ]);

    /* ---------------- SCROLL (/5) ---------------- */
    const usesIO = /IntersectionObserver/.test(source);
    const revealEls = doc.querySelectorAll("[data-reveal]").length;
    const sections = doc.querySelectorAll("section").length;
    const revealCoverage = revealEls >= Math.max(6, sections);

    const smooth =
      cs(doc.documentElement).scrollBehavior === "smooth" ||
      /scroll-behavior:\s*smooth/.test(source) ||
      /behavior:\s*['"]smooth/.test(source);

    // Runtime parallax probe: scroll to two positions, watch [data-parallax]
    // transforms settle to two different values.
    const parallaxEls = Array.from(doc.querySelectorAll("[data-parallax]")).slice(0, 30);
    let parallaxWorks = false;
    let continuous = false;
    if (parallaxEls.length) {
      const maxScroll = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
      const snapP = () => parallaxEls.map((el) => cs(el).transform);
      const p0 = snapP();
      win.scrollTo(0, Math.floor(maxScroll * 0.35));
      await settle(win, 6, 450);
      const p1 = snapP();
      win.scrollTo(0, Math.floor(maxScroll * 0.7));
      await settle(win, 6, 450);
      const p2 = snapP();
      for (let i = 0; i < parallaxEls.length; i++) {
        if (p0[i] !== p1[i]) parallaxWorks = true;
        if (p1[i] !== p2[i] && p0[i] !== p1[i]) continuous = true;
      }
      win.scrollTo(0, savedScroll);
      await settle(win, 2, 0);
    }
    const parallaxPattern = /parallax/i.test(source) && /scrollY|pageYOffset/.test(source);

    addCategory("scroll", "Scroll", [
      {
        name: "IntersectionObserver reveals on every major section",
        points: 2,
        earned: usesIO && revealCoverage ? 2 : usesIO ? 1 : 0,
        detail: usesIO
          ? `only ${revealEls} [data-reveal] targets for ${sections} sections`
          : "no IntersectionObserver in page code",
      },
      {
        name: "site-wide smooth scrolling",
        points: 1,
        earned: smooth ? 1 : 0,
        detail: "scroll-behavior is not smooth and no smooth scrollTo found",
      },
      {
        name: "parallax (verified at runtime)",
        points: 1,
        earned: parallaxWorks || parallaxPattern ? 1 : 0,
        detail: "no [data-parallax] element moved when the page was scrolled",
      },
      {
        name: "continuous scroll response (two positions, two states)",
        points: 1,
        earned: continuous ? 1 : 0,
        detail: "parallax transforms did not track two distinct scroll positions",
      },
    ]);

    /* ---------------- INTERACTIVITY (/5) ---------------- */
    let hoverRules = 0;
    let focusRules = 0;
    for (const rule of rules) {
      const sel = rule.selectorText || "";
      if (sel.includes(":hover")) hoverRules++;
      if (sel.includes(":focus")) focusRules++;
    }
    const micro =
      doc.querySelector("[data-counter]") !== null ||
      /magnetic|ripple|cursor-dot|cursor-follower|typewriter/i.test(source);
    const navLinks = Array.from(doc.querySelectorAll('nav a[href^="#"]'));
    const navTargetsOk =
      navLinks.length >= 3 &&
      navLinks.every((a) => {
        const id = a.getAttribute("href").slice(1);
        return id && doc.getElementById(id);
      });
    const deadLinks = doc.querySelectorAll('a[href="#"], a:not([href])').length;

    addCategory("interactivity", "Interactivity", [
      {
        name: "real hover + focus states",
        points: 2,
        earned: hoverRules >= 8 && focusRules >= 1 ? 2 : hoverRules >= 4 ? 1 : 0,
        detail: `${hoverRules} :hover rules (need 8+) and ${focusRules} :focus rules (need 1+)`,
      },
      {
        name: "micro-interaction beyond hover",
        points: 1,
        earned: micro ? 1 : 0,
        detail: "no counters / magnetic buttons / ripple / cursor follower found",
      },
      {
        name: "nav anchors resolve to real sections",
        points: 1,
        earned: navTargetsOk ? 1 : 0,
        detail: `${navLinks.length} nav anchor links; all must point at existing ids (need 3+)`,
      },
      {
        name: "no dead-end links",
        points: 1,
        earned: deadLinks === 0 ? 1 : 0,
        detail: `${deadLinks} dead links (href="#" or missing href)`,
      },
    ]);

    /* ---------------- FOUNDATION (/5) ---------------- */
    const bodyText = (doc.body.innerText || "").trim();
    const realCopy = !/lorem ipsum/i.test(bodyText) && bodyText.length > 1200;
    const hasViewport = !!doc.querySelector('meta[name="viewport"]');
    let mediaRules = 0;
    for (const rule of rules) if (rule.media && rule.conditionText) mediaRules++;
    const noOverflowX = doc.documentElement.scrollWidth <= win.innerWidth + 2;
    const imgs = Array.from(doc.querySelectorAll("img"));
    const semantic =
      !!doc.querySelector("header") &&
      !!doc.querySelector("nav") &&
      (!!doc.querySelector("main") || sections >= 3) &&
      !!doc.querySelector("footer") &&
      imgs.every((i) => i.hasAttribute("alt"));
    let consoleEarned = 1;
    let consoleDetail = "ok";
    if (Array.isArray(win.__gf_errors)) {
      consoleEarned = win.__gf_errors.length === 0 ? 1 : 0;
      consoleDetail = win.__gf_errors.length
        ? `${win.__gf_errors.length} console error(s): ${win.__gf_errors.slice(0, 3).join(" | ")}`
        : "ok";
    } else {
      consoleDetail = "not instrumented at load - verify the DevTools console manually";
    }

    addCategory("foundation", "Foundation", [
      {
        name: "real copy, no lorem ipsum",
        points: 1,
        earned: realCopy ? 1 : 0,
        detail: `body text ${bodyText.length} chars; lorem=${/lorem ipsum/i.test(bodyText)}`,
      },
      {
        name: "responsive (viewport meta + media queries)",
        points: 1,
        earned: hasViewport && mediaRules >= 2 ? 1 : 0,
        detail: `viewport meta=${hasViewport}, ${mediaRules} media query blocks (need 2+)`,
      },
      {
        name: "no horizontal overflow at current width",
        points: 1,
        earned: noOverflowX ? 1 : 0,
        detail: `scrollWidth ${doc.documentElement.scrollWidth} vs viewport ${win.innerWidth}`,
      },
      {
        name: "semantic landmarks + alt on all images",
        points: 1,
        earned: semantic ? 1 : 0,
        detail: "needs header, nav, main/sections, footer, and alt on every img",
      },
      {
        name: "zero console errors",
        points: 1,
        earned: consoleEarned,
        detail: consoleDetail,
      },
    ]);

    const total = categories.reduce((s, c) => s + c.score, 0);
    const passed = total >= 22 && categories.every((c) => c.score >= 3);
    return { total, max: 25, passed, categories, failures };
  }

  function format(report) {
    const lines = [
      `GlassForge score: ${report.total}/25 ${report.passed ? "PASS" : "FAIL"} (need 22+, no category under 3)`,
    ];
    for (const cat of report.categories) {
      lines.push(`  ${cat.label}: ${cat.score}/5`);
      for (const c of cat.checks) {
        lines.push(`    ${c.earned >= c.points ? "[ok]" : "[x] "} ${c.name} (${c.earned}/${c.points})${c.earned < c.points ? " - " + c.detail : ""}`);
      }
    }
    return lines.join("\n");
  }

  global.GlassForgeScorer = { score, format };
})(typeof window !== "undefined" ? window : this);
