import { useEffect, useState } from "react";
import type { Verdict } from "./types";

export type Lang = "en" | "fr";

const EN = {
  nav: {
    how: "How it works",
    verdicts: "Verdicts",
    pricing: "Pricing",
    getApp: "Get the app",
    check: "Open the checker",
    menu: "Menu",
    signIn: "Sign in",
    startFree: "Start free",
    faq: "FAQ",
  },
  hero: {
    tagline: "the anti-doomscroll",
    line1: "Keep scrolling.",
    line2: "Start growing.",
    sub: "Check the health claims in your feed against real peer reviewed research.",
    primaryCta: "Get started",
    secondaryCta: "See how it works",
    placeholder: "Paste a link, or paste the claim itself",
    check: "check",
    tryOne: "try one",
    disclaimer: "Bloomscroll explains evidence. It doesn't diagnose or give medical advice.",
    demoTag: "what results look like",
    demoNote:
      "Small observational studies on tongue posture exist. None measured a lasting change in jaw shape in adults.",
    demoCite: "⧉ real, clickable citations land here",
  },
  bloom: {
    tag: "the bloom",
    title: "Scrolling, but growing.",
    body:
      "Doomscrolling numbs you. This does the opposite. Every claim you check leaves you knowing what the evidence actually says, instead of absorbing another confident stranger.",
  },
  status: {
    checking: "checking…",
    error: "Something broke on our end. Try again in a moment.",
    couldntRead: "couldn't read that",
    read: "read",
    chars: "chars",
    sample:
      "sample verdicts. The live literature pipeline runs once your API credits are set.",
  },
  verdictLabels: {
    supported: "Supported",
    mixed: "Mixed evidence",
    weak: "Weak evidence",
    no_evidence: "No evidence found",
    not_empirical: "Not a testable claim",
  } as Record<Verdict, string>,
  verdictMeanings: {
    supported: "Multiple decent studies point the same way.",
    mixed: "Real studies exist, and they disagree.",
    weak: "Something exists, but it's thin. Tiny samples, animal studies, or no control groups.",
    no_evidence: "We searched the literature and found nothing that backs the claim.",
    not_empirical:
      "An opinion or a vibe, not a checkable fact. That's fine. It just isn't science.",
  } as Record<Verdict, string>,
  verdictDetails: {
    // These lines used to restate the heading above them almost word for
    // word, which padded every card and said nothing new. Each one now adds
    // information the heading doesn't — and being shorter, the tallest card
    // no longer forces a wall of empty space into the other four.
    supported: {
      evidence: "Ideally trials or large reviews, and better work hasn't overturned them.",
      example:
        "Sunscreen lowering skin cancer risk. Decades of trials and large cohorts line up.",
    },
    mixed: {
      evidence: "The honest answer is \"it depends\" — so we say so instead of picking a side.",
      example: "Diet and acne. Some studies link them, plenty don't.",
    },
    weak: {
      evidence: "Promising enough to notice, not solid enough to act on.",
      example:
        "Mewing and the jawline. A handful of small observational papers, no controlled trials in adults.",
    },
    no_evidence: {
      evidence: "Absence of evidence isn't proof it's false — only that no one has shown it.",
      example: "Fringe looksmaxxing hacks that never made it into a study.",
    },
    not_empirical: {
      evidence: "No study could settle it either way, and that's fine.",
      example: "\"This jaw looks better\" is taste, not a testable fact.",
    },
  } as Record<Verdict, { evidence: string; example: string }>,
  verdictExtra: { looksLike: "Why it lands here", forExample: "For example" },
  stages: {
    reading: "reading the source…",
    claims: "found {n} claim(s). Reading them closely…",
    searching: "searching the literature…",
    grading: "weighing the evidence…",
  },
  ui: {
    clear: "clear",
    installApp: "install app",
    installed: "installed ✓",
    howToInstall: "how to install",
    installTitle: "Wherever you scroll",
    installBody:
      "Bloomscroll works from the same apps you already scroll in. Install once on your phone or desktop, then check any claim in a couple of taps.",
  },
  results: {
    citedTitle: "Cited in the answer",
    poolTitle: "All papers we found",
    poolEmpty: "Europe PMC returned no matching papers.",
    poolHint:
      "These abstracts came back from Europe PMC. The grader read them, then chose the ones above to cite.",
    showPool: "Show all papers",
    hidePool: "Hide papers",
    cited: "cited",
    read: "read the paper",
    verdictWhy: "Why this verdict",
    claimLabel: "The claim",
  },
  useCases: {
    title: "What to check with it",
    sub: "Anything you'd normally scroll past uncritically. Bloomscroll works on:",
    items: [
      {
        tag: "TikTok",
        title: "Health advice from creators",
        body:
          "Supplement claims, hormone hacks, \"5 things I did to fix my acne.\" Paste the link or the caption.",
      },
      {
        tag: "YouTube",
        title: "Wellness and looksmaxxing videos",
        body:
          "Mewing, cold plunges, biohacking routines, jaw-training gadgets. We read the captions and check the claims.",
      },
      {
        tag: "Reddit",
        title: "Supplement and fitness threads",
        body:
          "Anything from r/Nootropics, r/Fitness, r/SkincareAddiction. Paste the post link and we pull the text.",
      },
      {
        tag: "Articles",
        title: "\"A new study says…\" posts",
        body:
          "Wellness sites, blog posts, screenshotted headlines. Paste the URL or the text you saw.",
      },
      {
        tag: "Diet",
        title: "Calorie and macro rules",
        body:
          "\"Never eat carbs after 6pm,\" seed-oil takes, fasting claims. Check what the actual trials show.",
      },
      {
        tag: "Skincare",
        title: "Routines and ingredient hype",
        body:
          "Retinol, snail mucin, red-light masks. See what has real trials behind it and what doesn't.",
      },
    ],
  },
  how: {
    title: "How it works",
    sub: "Three steps. About twelve seconds from claim to verdict.",
    steps: [
      {
        title: "Paste anything",
        body:
          "A YouTube, TikTok, or Reddit link, an article, or just type the claim you saw. Hit check.",
      },
      {
        title: "It finds the real claims",
        body:
          "Bloomscroll pulls out what's actually checkable and searches Europe PMC, a free index of over 45 million peer reviewed biomedical papers.",
      },
      {
        title: "Evidence, graded",
        body:
          "Each claim gets a verdict on a five step scale, a plain language answer, and real citations you can click. Never a bare true or false.",
      },
    ],
  },
  verdictsTitle: "What the verdicts mean",
  stats: [
    { value: "45M+", label: "peer reviewed papers searchable via Europe PMC" },
    { value: "5", label: "evidence grades. Never a bare true or false" },
    { value: "0", label: "fabricated citations. Blocked by design" },
    { value: "3+", label: "platforms readable, plus any article" },
  ],
  pricing: {
    title: "Stay clear-headed while you scroll.",
    sub:
      "Free covers a few checks a month. Sprout gives you 150 for daily use. Canopy is the one that removes the cap entirely.",
    soon: "coming soon",
    freeBeta: "free forever",
    get: "Get",
    opening: "opening checkout…",
    stripeError: "Checkout couldn't open. Try again in a moment.",
    perMonth: "/mo",
    perYear: "/year",
    monthly: "Monthly",
    annual: "Annual",
    saveHint: "save ~50%",
    mostPopular: "most popular",
    unlimited: "Unlimited",
    plans: [
      {
        name: "Seed",
        price: "$0",
        priceAnnual: "$0",
        tagline: "For the casual scroller",
        features: [
          "5 checks a month",
          "All five verdict grades",
          "Real, clickable citations",
        ],
        live: true,
      },
      {
        name: "Sprout",
        price: "$4.99",
        priceAnnual: "$29.99",
        tagline: "For the daily scroller",
        features: [
          "150 checks a month",
          "Saved check history",
          "Shareable verdict cards",
          "Priority pipeline",
        ],
        live: false,
      },
      {
        name: "Canopy",
        price: "$19.99",
        priceAnnual: "$119.99",
        tagline: "For the completionist",
        features: [
          "Unlimited checks — no monthly cap",
          "Everything in Sprout",
          "Faster processing",
          "Deeper citation detail and export",
          "Early access to new features",
        ],
        live: false,
      },
    ],
  },
  faq: {
    title: "Questions, answered",
    items: [
      {
        q: "What is Bloomscroll?",
        a:
          "A tool that checks the health and appearance claims you see in your feed against real scientific literature. Paste a link, a caption, or a claim you saw. It pulls out what's actually checkable, searches Europe PMC for evidence, and shows what the research says with real, clickable citations.",
      },
      {
        q: "How is this different from asking an AI chatbot?",
        a:
          "Chatbots invent sources when they don't know. Bloomscroll only cites papers it actually retrieved from Europe PMC, and every citation is validated against the retrieved set before it renders. A fabricated source can't reach your screen. You also get a graded verdict, not a yes or no.",
      },
      {
        q: "Does it store what I check?",
        a:
          "Not right now. The free tier needs no account, and we cache results in memory only. Paid plans will add a private history you can turn off at any time.",
      },
      {
        q: "Is this medical advice?",
        a:
          "No. Bloomscroll explains what published research says about a claim and how strong that research is. It doesn't diagnose, treat, or replace a clinician. If you're deciding on a treatment, talk to an actual professional.",
      },
      {
        q: "What platforms does it work on right now?",
        a:
          "YouTube (we read the captions), TikTok (the caption), Reddit posts, and any web article we can load. Instagram blocks this kind of access for every third-party tool. For IG, paste the caption yourself.",
      },
    ],
  },
  contact: {
    title: "Reach the creator",
    body:
      "Bloomscroll is built by one person. Questions, feedback, bug reports, or feature ideas go straight to them.",
    button: "email the creator",
    subject: "Bloomscroll: feedback",
  },
  cta: {
    title: "Your feed says a lot. Check it.",
    button: "start free",
  },
  access: {
    title: "Wherever you scroll",
    sub:
      "Bloomscroll works from your phone's share menu and your desktop browser. Pick your device. Each setup takes under a minute.",
    androidTitle: "Android",
    androidLede:
      "Two taps to add Bloomscroll to your home screen, then it shows up in every Share menu.",
    androidSteps: [
      "Open bloomscroll.com in Chrome, tap the ⋮ menu, then \"Add to Home screen\".",
      "Share anything from any app → pick Bloomscroll. The check runs automatically.",
    ],
    androidCta: "install as app",
    iphoneTitle: "iPhone",
    iphoneLede:
      "One tap using the shortcut link below (fastest). Or build it yourself with the manual steps.",
    iphoneSteps: [
      "Tap the shortcut link and hit \"Add Shortcut\" when iOS asks.",
      "In any app, use Share → Bloomscroll. The check runs automatically.",
    ],
    iphoneNote:
      "Prefer to build it yourself? Open Shortcuts → +, add \"Open URLs\" set to bloomscroll.com/?q= plus the Shortcut Input variable, enable \"Show in Share Sheet\", name it Bloomscroll.",
    iphoneCta: "add to iPhone",
    desktopTitle: "Desktop",
    desktopLede:
      "Right-click any text or link and pick \"Check with Bloomscroll\". Works in Chrome, Edge, Brave.",
    desktopSteps: [
      "Install the Bloomscroll extension from the Chrome Web Store.",
      "Pin it to the toolbar so it's one click away.",
      "Right-click anything → \"Check with Bloomscroll\".",
    ],
    desktopCta: "get the extension",
    walkthroughLabel: "watch a 30-second walkthrough",
    // TODO: real YouTube URLs — leaving as empty strings so the "watch"
    // link is hidden until a real video is up. Set these per platform
    // once the walkthrough videos are recorded.
    walkthroughUrls: {
      android: "",
      iphone: "",
      desktop: "",
    },
    // TODO: real Chrome Web Store listing URL once the extension is
    // published. Also the iOS Shortcut iCloud link when it exists.
    extensionUrl: "",
    iphoneShortcutUrl: "",
    bookmarkletTitle: "or a bookmarklet (any browser)",
    bookmarkletLede:
      "For Firefox, Safari, or when you can't install anything. Drag this to your bookmarks bar.",
    bookmarklet: "✓ check with bloomscroll",
    igNote:
      "Instagram blocks this kind of access for every third-party tool, not just this one. For IG posts, copy the caption and paste it.",
    back: "back to bloomscroll",
  },
  footer: {
    product: "Product",
    about: "About",
    contactLink: "contact the creator",
    tks: "built by a solo dev",
    disclaimer:
      "Bloomscroll explains published evidence. It is not medical advice and never diagnoses.",
    rights: "© 2026 bloomscroll",
  },
  signin: {
    title: "Sign in to Bloomscroll",
    sub: "One account. Google only, no passwords to manage.",
    google: "Continue with Google",
    terms: "By continuing you agree to Bloomscroll's beta terms and privacy note.",
    signedInAs: "Signed in as",
    signOut: "sign out",
  },
  check: {
    signInTitle: "Sign in to run a check",
    signInBody:
      "Bloomscroll uses your Google account to track your free checks and remember your plan. No password to set up.",
    used: "{used} of {limit} free checks used",
    unlimited: "Unlimited",
    resetsOn: "resets {date}",
    limitTitle: "You've used your free checks for this month",
    limitBody: "Upgrade to Sprout for 150 checks a month, or Canopy for no cap at all. Or wait until {date}.",
    upgradeCta: "See plans",
  },
};

export type Strings = typeof EN;

const FR: Strings = {
  nav: {
    how: "comment ça marche",
    verdicts: "verdicts",
    pricing: "tarifs",
    getApp: "l'appli",
    check: "ouvrir le checker",
    menu: "menu",
    signIn: "se connecter",
    startFree: "commencer",
    faq: "faq",
  },
  hero: {
    tagline: "l'anti-doomscroll",
    line1: "Continue à scroller.",
    line2: "Commence à grandir.",
    sub: "Vérifie les affirmations santé de ton feed contre la vraie recherche scientifique.",
    primaryCta: "Commencer",
    secondaryCta: "Voir comment ça marche",
    placeholder: "Colle un lien, ou l'affirmation elle-même",
    check: "vérifier",
    tryOne: "essaie",
    disclaimer: "Bloomscroll explique les preuves. Il ne diagnostique pas et ne donne pas d'avis médical.",
    demoTag: "à quoi ressemble un résultat",
    demoNote:
      "De petites études observationnelles sur la posture linguale existent. Aucune n'a mesuré de changement durable de la mâchoire chez l'adulte.",
    demoCite: "⧉ de vraies citations cliquables arrivent ici",
  },
  bloom: {
    tag: "le bloom",
    title: "Scroller, mais grandir.",
    body:
      "Le doomscrolling anesthésie. Ceci fait l'inverse. Chaque affirmation vérifiée te laisse avec ce que disent réellement les preuves, au lieu d'un énième inconnu très sûr de lui.",
  },
  status: {
    checking: "vérification…",
    error: "Un souci de notre côté. Réessaie dans un instant.",
    couldntRead: "lecture impossible",
    read: "lu",
    chars: "caractères",
    sample: "verdicts d'exemple. Le pipeline scientifique s'active dès que tes crédits API sont prêts.",
  },
  verdictLabels: {
    supported: "Étayé",
    mixed: "Preuves mitigées",
    weak: "Preuves faibles",
    no_evidence: "Aucune preuve trouvée",
    not_empirical: "Affirmation non testable",
  } as Record<Verdict, string>,
  verdictMeanings: {
    supported: "Plusieurs études sérieuses vont dans le même sens.",
    mixed: "De vraies études existent, et elles se contredisent.",
    weak:
      "Il existe quelque chose, mais c'est mince. Petits échantillons, études animales, pas de groupe témoin.",
    no_evidence: "Nous avons fouillé la littérature, rien ne soutient l'affirmation.",
    not_empirical:
      "Une opinion ou une vibe, pas un fait vérifiable. C'est permis, mais ce n'est pas de la science.",
  } as Record<Verdict, string>,
  verdictDetails: {
    supported: {
      evidence:
        "Plusieurs études indépendantes concordent, idéalement des essais ou de grandes revues, sans être renversées par des travaux de meilleure qualité.",
      example:
        "La crème solaire qui réduit le risque de cancer de la peau. Des décennies d'essais et de cohortes concordent.",
    },
    mixed: {
      evidence:
        "La recherche se contredit vraiment. Certaines études trouvent un effet, d'autres non, sans camp clairement gagnant.",
      example: "Alimentation et acné. Certaines études les relient, beaucoup non.",
    },
    weak: {
      evidence:
        "Les seules preuves sont minces. Quelques petites études, des travaux sur l'animal ou en labo, ou aucun groupe témoin pour écarter le hasard.",
      example:
        "Le mewing et la mâchoire. Quelques petites études observationnelles, aucun essai contrôlé chez l'adulte.",
    },
    no_evidence: {
      evidence:
        "Nous avons fouillé la littérature sans rien trouver qui teste vraiment l'affirmation. L'absence de preuve n'est pas une preuve du contraire, juste que personne ne l'a démontré.",
      example: "Des astuces looksmaxxing marginales jamais passées par une étude.",
    },
    not_empirical: {
      evidence:
        "Il n'y a rien à mesurer. C'est une opinion, une préférence esthétique ou une définition. La science ne peut pas la noter, et c'est très bien.",
      example: "« Cette mâchoire est plus belle », une question de goût, pas un fait testable.",
    },
  } as Record<Verdict, { evidence: string; example: string }>,
  verdictExtra: { looksLike: "Pourquoi ce verdict", forExample: "Par exemple" },
  stages: {
    reading: "lecture de la source…",
    claims: "{n} affirmation(s) trouvée(s). Lecture attentive…",
    searching: "recherche dans la littérature…",
    grading: "évaluation des preuves…",
  },
  ui: {
    clear: "effacer",
    installApp: "installer l'appli",
    installed: "installée ✓",
    howToInstall: "comment installer",
    installTitle: "Là où tu scrolles",
    installBody:
      "Bloomscroll fonctionne depuis les mêmes applis où tu scrolles déjà. Installe-le une fois sur mobile ou desktop, et vérifie n'importe quelle affirmation en deux touchers.",
  },
  results: {
    citedTitle: "Cités dans la réponse",
    poolTitle: "Tous les articles trouvés",
    poolEmpty: "Europe PMC n'a renvoyé aucun article correspondant.",
    poolHint:
      "Ces résumés viennent d'Europe PMC. Le noteur les a lus, puis a choisi ceux cités ci-dessus.",
    showPool: "Afficher tous les articles",
    hidePool: "Masquer les articles",
    cited: "cité",
    read: "lire l'article",
    verdictWhy: "Pourquoi ce verdict",
    claimLabel: "L'affirmation",
  },
  useCases: {
    title: "À utiliser pour",
    sub: "Tout ce que tu ferais défiler sans réfléchir. Bloomscroll fonctionne sur :",
    items: [
      {
        tag: "TikTok",
        title: "Conseils santé de créateurs",
        body:
          "Compléments, hacks hormonaux, « 5 trucs qui ont réglé mon acné ». Colle le lien ou la légende.",
      },
      {
        tag: "YouTube",
        title: "Wellness et looksmaxxing",
        body:
          "Mewing, bains froids, biohacking, gadgets pour la mâchoire. On lit les sous-titres et on vérifie.",
      },
      {
        tag: "Reddit",
        title: "Threads compléments et fitness",
        body:
          "r/Nootropics, r/Fitness, r/SkincareAddiction. Colle le lien du post, on récupère le texte.",
      },
      {
        tag: "Articles",
        title: "« Une nouvelle étude dit… »",
        body: "Sites bien-être, blogs, captures d'écran de titres. Colle l'URL ou le texte que tu as vu.",
      },
      {
        tag: "Régime",
        title: "Règles caloriques et macros",
        body:
          "« Pas de glucides après 18h », débats sur les huiles, jeûne. Voir ce que disent vraiment les essais.",
      },
      {
        tag: "Skincare",
        title: "Routines et ingrédients à la mode",
        body: "Rétinol, mucine d'escargot, masques LED. Vois lesquels ont de vrais essais derrière eux.",
      },
    ],
  },
  how: {
    title: "Comment ça marche",
    sub: "Trois étapes. Environ douze secondes de l'affirmation au verdict.",
    steps: [
      {
        title: "Colle n'importe quoi",
        body: "Un lien YouTube, TikTok ou Reddit, un article, ou tape l'affirmation toi-même. Appuie sur vérifier.",
      },
      {
        title: "Il trouve les vraies affirmations",
        body:
          "Bloomscroll extrait ce qui est vraiment vérifiable et interroge Europe PMC, un index gratuit de plus de 45 millions d'articles biomédicaux à comité de lecture.",
      },
      {
        title: "Des preuves, notées",
        body:
          "Chaque affirmation reçoit un verdict sur cinq niveaux, une réponse en langage clair et de vraies citations cliquables. Jamais un simple vrai ou faux.",
      },
    ],
  },
  verdictsTitle: "Ce que veulent dire les verdicts",
  stats: [
    { value: "45 M+", label: "articles à comité de lecture via Europe PMC" },
    { value: "5", label: "niveaux de preuve. Jamais un simple vrai ou faux" },
    { value: "0", label: "citation inventée. Bloqué par conception" },
    { value: "3+", label: "plateformes lisibles, plus tout article" },
  ],
  pricing: {
    title: "Reste lucide en scrollant.",
    sub:
      "Le forfait gratuit couvre quelques vérifications par mois. Sprout t'en donne 150 pour un usage quotidien. Canopy est celui qui supprime complètement la limite.",
    soon: "bientôt disponible",
    freeBeta: "gratuit à vie",
    get: "Prendre",
    opening: "ouverture du paiement…",
    stripeError: "Le paiement n'a pas pu s'ouvrir. Réessaie dans un instant.",
    perMonth: "/mois",
    perYear: "/an",
    monthly: "Mensuel",
    annual: "Annuel",
    saveHint: "économise ~50 %",
    mostPopular: "le plus populaire",
    unlimited: "Illimité",
    plans: [
      {
        name: "Seed",
        price: "0 $",
        priceAnnual: "0 $",
        tagline: "Pour scroller de temps en temps",
        features: [
          "5 vérifications par mois",
          "Les cinq niveaux de verdict",
          "De vraies citations cliquables",
        ],
        live: true,
      },
      {
        name: "Sprout",
        price: "4,99 $",
        priceAnnual: "29,99 $",
        tagline: "Pour scroller au quotidien",
        features: [
          "150 vérifications par mois",
          "Historique des vérifications",
          "Cartes de verdict à partager",
          "Pipeline prioritaire",
        ],
        live: false,
      },
      {
        name: "Canopy",
        price: "19,99 $",
        priceAnnual: "119,99 $",
        tagline: "Pour les complétistes",
        features: [
          "Vérifications illimitées — sans plafond mensuel",
          "Tout Sprout",
          "Traitement plus rapide",
          "Détails de citation approfondis et export",
          "Accès anticipé aux nouveautés",
        ],
        live: false,
      },
    ],
  },
  faq: {
    title: "Questions, réponses",
    items: [
      {
        q: "C'est quoi Bloomscroll ?",
        a:
          "Un outil qui vérifie les affirmations santé et physique de ton feed contre la vraie littérature scientifique. Colle un lien, une légende ou une affirmation. Il en extrait ce qui est vérifiable, interroge Europe PMC, et montre ce que dit la recherche avec de vraies citations cliquables.",
      },
      {
        q: "En quoi est-ce différent d'un chatbot IA ?",
        a:
          "Les chatbots inventent des sources quand ils ne savent pas. Bloomscroll ne cite que des articles réellement récupérés d'Europe PMC, et chaque citation est validée contre l'ensemble récupéré avant affichage. Une source inventée ne peut pas atteindre ton écran. Tu obtiens aussi un verdict noté, pas un oui ou non.",
      },
      {
        q: "Est-ce qu'il stocke ce que je vérifie ?",
        a:
          "Non, pas pour l'instant. Le forfait gratuit n'exige pas de compte, et les résultats sont mis en cache en mémoire seulement. Les forfaits payants ajouteront un historique privé, que tu peux désactiver à tout moment.",
      },
      {
        q: "Est-ce un avis médical ?",
        a:
          "Non. Bloomscroll explique ce que dit la recherche publiée et la force de cette recherche. Il ne diagnostique pas, ne traite pas, et ne remplace pas un professionnel. Pour décider d'un traitement, parle à un vrai professionnel.",
      },
      {
        q: "Ça marche sur quelles plateformes aujourd'hui ?",
        a:
          "YouTube (on lit les sous-titres), TikTok (la légende), les posts Reddit, et tout article web qu'on arrive à charger. Instagram bloque ce type d'accès pour tous les outils tiers. Pour IG, colle toi-même la légende.",
      },
    ],
  },
  contact: {
    title: "Écris au créateur",
    body:
      "Bloomscroll est construit par une seule personne. Questions, retours, bugs ou idées lui arrivent directement.",
    button: "écrire au créateur",
    subject: "Bloomscroll : retour",
  },
  cta: {
    title: "Ton feed raconte beaucoup de choses. Vérifie-les.",
    button: "commencer",
  },
  access: {
    title: "Là où tu scrolles",
    sub:
      "Bloomscroll fonctionne depuis le menu Partager de ton téléphone et depuis ton navigateur desktop. Choisis ton appareil. Chaque installation prend moins d'une minute.",
    androidTitle: "Android",
    androidLede:
      "Deux touches pour ajouter Bloomscroll à ton écran d'accueil, puis il apparaît dans tous les menus Partager.",
    androidSteps: [
      "Ouvre bloomscroll.com dans Chrome, touche le menu ⋮, puis « Ajouter à l'écran d'accueil ».",
      "Partage n'importe quoi depuis n'importe quelle appli → choisis Bloomscroll. La vérification se lance toute seule.",
    ],
    androidCta: "installer comme appli",
    iphoneTitle: "iPhone",
    iphoneLede:
      "Un tap avec le lien de raccourci ci-dessous (le plus rapide). Ou construis-le à la main avec les étapes manuelles.",
    iphoneSteps: [
      "Touche le lien du raccourci et « Ajouter le raccourci » quand iOS le demande.",
      "Dans n'importe quelle appli, Partager → Bloomscroll. La vérification se lance toute seule.",
    ],
    iphoneNote:
      "Tu préfères le construire toi-même ? Ouvre Raccourcis → +, ajoute « Ouvrir les URL » vers bloomscroll.com/?q= suivi de la variable Entrée du raccourci, active « Afficher dans la feuille de partage », nomme-le Bloomscroll.",
    iphoneCta: "ajouter à l'iPhone",
    desktopTitle: "Desktop",
    desktopLede:
      "Clic droit sur n'importe quel texte ou lien, puis « Vérifier avec Bloomscroll ». Chrome, Edge, Brave.",
    desktopSteps: [
      "Installe l'extension Bloomscroll depuis le Chrome Web Store.",
      "Épingle-la dans la barre d'outils pour qu'elle soit à un clic.",
      "Clic droit sur n'importe quoi → « Vérifier avec Bloomscroll ».",
    ],
    desktopCta: "obtenir l'extension",
    walkthroughLabel: "voir la démo de 30 secondes",
    walkthroughUrls: {
      android: "",
      iphone: "",
      desktop: "",
    },
    extensionUrl: "",
    iphoneShortcutUrl: "",
    bookmarkletTitle: "ou un bookmarklet (tous navigateurs)",
    bookmarkletLede:
      "Pour Firefox, Safari, ou quand tu ne peux rien installer. Glisse ce bouton dans ta barre de favoris.",
    bookmarklet: "✓ vérifier avec bloomscroll",
    igNote:
      "Instagram bloque ce type d'accès pour tous les outils tiers, pas seulement celui-ci. Pour un post IG, copie la légende et colle-la.",
    back: "retour à bloomscroll",
  },
  footer: {
    product: "Produit",
    about: "À propos",
    contactLink: "contacter le créateur",
    tks: "construit par un dev en solo",
    disclaimer: "Bloomscroll explique les preuves publiées. Ce n'est pas un avis médical et il ne diagnostique jamais.",
    rights: "© 2026 bloomscroll",
  },
  signin: {
    title: "Se connecter à Bloomscroll",
    sub: "Un compte. Google uniquement, aucun mot de passe à gérer.",
    google: "Continuer avec Google",
    terms: "En continuant tu acceptes les conditions bêta et la note vie privée de Bloomscroll.",
    signedInAs: "Connecté en tant que",
    signOut: "se déconnecter",
  },
  check: {
    signInTitle: "Connecte-toi pour lancer une vérification",
    signInBody:
      "Bloomscroll utilise ton compte Google pour suivre tes vérifications gratuites et retenir ton forfait. Aucun mot de passe à créer.",
    used: "{used} sur {limit} vérifications gratuites utilisées",
    unlimited: "Illimité",
    resetsOn: "réinitialise le {date}",
    limitTitle: "Tu as utilisé tes vérifications gratuites du mois",
    limitBody: "Passe à Sprout pour 150 vérifications par mois, ou à Canopy pour aucune limite. Ou attends jusqu'au {date}.",
    upgradeCta: "Voir les forfaits",
  },
};

export const STRINGS: Record<Lang, Strings> = { en: EN, fr: FR };

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const stored = localStorage.getItem("bloomscroll-lang");
    if (stored === "fr" || stored === "en") setLangState(stored);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("bloomscroll-lang", l);
  }
  return [lang, setLang];
}
