import { useEffect, useState } from "react";
import type { Verdict } from "./types";

export type Lang = "en" | "fr";

const EN = {
  nav: {
    how: "how it works",
    verdicts: "verdicts",
    pricing: "pricing",
    getApp: "get the app",
    check: "check a claim",
    menu: "menu",
  },
  hero: {
    line1: "Keep scrolling.",
    line2: "Start growing.",
    sub: "Bloomscroll checks the health and looks claims in your feed against real scientific research — and shows how strong the evidence actually is.",
    placeholder: "Paste a link, or paste the claim itself",
    check: "check",
    tryOne: "try one",
    disclaimer: "Bloomscroll explains evidence. It doesn't diagnose or give medical advice.",
    demoTag: "what results look like",
    demoNote: "Small observational studies on tongue posture exist — none measured lasting jaw-shape change in adults.",
    demoCite: "⧉ real, clickable citations land here",
  },
  status: {
    checking: "checking…",
    error: "Something broke on our end — try again in a moment.",
    couldntRead: "couldn't read that",
    read: "read",
    chars: "chars",
    sample: "sample verdicts — the live literature pipeline lands in the next phase",
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
    mixed: "Real studies exist — and they disagree with each other.",
    weak: "Something exists, but it's thin: tiny samples, animal studies, or no control groups.",
    no_evidence: "We searched the literature and found nothing that backs the claim.",
    not_empirical: "An opinion or a vibe, not a checkable fact — that's allowed, it's just not science.",
  } as Record<Verdict, string>,
  verdictDetails: {
    supported: {
      evidence: "Several independent studies — ideally trials or large reviews — agree, and higher-quality work hasn't overturned them.",
      example: "Sunscreen lowering skin-cancer risk: decades of trials and large cohorts line up.",
    },
    mixed: {
      evidence: "The research genuinely conflicts — some studies find an effect, others find none, and neither side has clearly won.",
      example: "Diet and acne: some studies link them, plenty don't.",
    },
    weak: {
      evidence: "The only evidence is thin — a few small studies, animal or lab work, or no control group to rule out coincidence.",
      example: "Mewing and the jawline: a handful of small observational papers, no controlled trials in adults.",
    },
    no_evidence: {
      evidence: "We searched the literature and found nothing that actually tests the claim. Absence of evidence isn't proof it's false — just that no one has shown it.",
      example: "Fringe looksmaxxing hacks that never made it into a study.",
    },
    not_empirical: {
      evidence: "There's nothing to measure — it's an opinion, an aesthetic preference, or a definition. Science can't grade it, and that's fine.",
      example: "“This jaw looks better” is taste, not a testable fact.",
    },
  } as Record<Verdict, { evidence: string; example: string }>,
  verdictExtra: { looksLike: "Why it lands here", forExample: "For example" },
  stages: {
    reading: "reading the source…",
    claims: "found {n} claim(s) — reading them closely…",
    searching: "searching the literature…",
    grading: "weighing the evidence…",
  },
  ui: {
    clear: "clear",
    installApp: "install app",
    installed: "installed ✓",
    howToInstall: "how to install",
    installTitle: "Get it on your phone",
    installBody: "Install Bloomscroll like an app, then check any claim straight from your Share menu — no App Store, no account.",
  },
  stats: [
    { value: "45M+", label: "papers searchable via Europe PMC" },
    { value: "5", label: "evidence grades — never a bare true/false" },
    { value: "0", label: "fabricated citations, blocked by design" },
    { value: "3+", label: "platforms readable, plus any article" },
  ],
  how: {
    title: "How it works",
    steps: [
      {
        title: "Paste anything",
        body: "A YouTube, TikTok, or Reddit link, an article — or just type the claim you saw. Hit check.",
      },
      {
        title: "It finds the real claims",
        body: "Bloomscroll pulls out what's actually checkable and searches Europe PMC — a free index of 45+ million biomedical papers.",
      },
      {
        title: "Evidence, graded",
        body: "Each claim gets a verdict on a five-step scale, a plain-language summary, and real citations you can click. Never a bare true/false.",
      },
    ],
  },
  verdictsTitle: "What the verdicts mean",
  pricing: {
    title: "Plans that grow with you",
    sub: "Bloomscroll is free while in beta. Paid plans are coming — here's the shape of them.",
    soon: "coming soon",
    freeBeta: "free during beta",
    plans: [
      {
        name: "Seed",
        price: "$0",
        tagline: "For the scroller",
        features: ["Checks every day", "All five verdict grades", "Real, clickable citations"],
        live: true,
      },
      {
        name: "Sprout",
        price: "—",
        tagline: "For the curious",
        features: ["Unlimited checks", "Check history", "Shareable verdict cards"],
        live: false,
      },
      {
        name: "Canopy",
        price: "—",
        tagline: "For classrooms & communities",
        features: ["Shared team space", "Bulk link checking", "API access"],
        live: false,
      },
    ],
  },
  faq: {
    title: "Questions, answered",
    items: [
      {
        q: "Is this medical advice?",
        a: "No. Bloomscroll explains what published research says about a claim and how strong that research is. It doesn't diagnose, treat, or replace a clinician — and it says so right next to the input box.",
      },
      {
        q: "Where do the citations come from?",
        a: "Europe PMC, a free public index of 45+ million biomedical papers. Every citation links to a real paper, and the pipeline validates every reference against the retrieved set before rendering — a fabricated citation can't reach your screen by design.",
      },
      {
        q: "What can I paste?",
        a: "YouTube links (we read the captions), TikTok links (the caption), Reddit posts, most articles — or just type the claim yourself. Instagram blocks this kind of access for every third-party tool, so for IG, paste the caption.",
      },
      {
        q: "Why does it say 'not a testable claim'?",
        a: "Because a lot of what you scroll past is opinion, aesthetics, or vibes — and that's fine. Bloomscroll flags it as its own first-class result instead of pretending science has a verdict on it.",
      },
      {
        q: "Is it free?",
        a: "Yes, completely free while in beta. Paid plans (Sprout and Canopy) come later — checking a claim will always stay free.",
      },
    ],
  },
  contact: {
    title: "Reach the creator",
    body: "Bloomscroll is built by a high-school student for the TKS Prompt → Product challenge. Questions, feedback, bug reports, or feature ideas — email goes straight to the person who built it.",
    button: "email the creator",
    subject: "Bloomscroll — feedback",
  },
  cta: {
    title: "Your feed says a lot. Check it.",
    button: "check a claim",
  },
  access: {
    title: "Put Bloomscroll in your share menu",
    sub: "Check claims without leaving the app you saw them in. Pick your device — each setup takes under a minute.",
    androidTitle: "Android",
    androidLede: "Install once, then Bloomscroll shows up in your Share menu next to Messages and WhatsApp.",
    androidSteps: [
      "Open bloomscroll in Chrome",
      "Tap the ⋮ menu → \"Add to Home screen\" → Install",
      "In any app, hit Share → Bloomscroll",
      "The check runs automatically",
    ],
    iphoneTitle: "iPhone",
    iphoneLede: "Add this once — it'll show up under Share → Shortcuts.",
    iphoneSteps: [
      "Open the Shortcuts app → tap +",
      "Add action: \"Open URLs\"",
      "Set the URL to: bloomscroll…/?q= followed by the Shortcut Input variable",
      "In the shortcut's settings, enable \"Show in Share Sheet\"",
      "Name it Bloomscroll — done",
    ],
    iphoneNote: "An official one-tap iCloud shortcut link from the creator will land here soon — until then, the five steps above build the same thing.",
    desktopTitle: "Desktop",
    desktopLede: "Drag this to your bookmarks bar. Click it on any page to check that page.",
    bookmarklet: "✓ check with bloomscroll",
    desktopNote: "Works in Chrome, Edge, Firefox, and Safari.",
    igNote: "Instagram blocks this kind of access for every third-party tool — not just this one. For IG posts, copy the caption and paste it.",
    back: "back to bloomscroll",
  },
  footer: {
    product: "Product",
    about: "About",
    contactLink: "contact the creator",
    tks: "TKS prompt → product challenge",
    disclaimer: "Bloomscroll explains published evidence. It is not medical advice and never diagnoses.",
    rights: "© 2026 bloomscroll",
  },
};

export type Strings = typeof EN;

const FR: Strings = {
  nav: {
    how: "comment ça marche",
    verdicts: "verdicts",
    pricing: "tarifs",
    getApp: "l'appli",
    check: "vérifier",
    menu: "menu",
  },
  hero: {
    line1: "Scrolle encore.",
    line2: "Grandis enfin.",
    sub: "Bloomscroll confronte les affirmations santé et physique de ton feed à la vraie recherche scientifique — et montre la force réelle des preuves.",
    placeholder: "Colle un lien, ou l'affirmation elle-même",
    check: "vérifier",
    tryOne: "essaie",
    disclaimer: "Bloomscroll explique les preuves. Il ne diagnostique pas et ne donne pas d'avis médical.",
    demoTag: "à quoi ressemble un résultat",
    demoNote: "De petites études observationnelles sur la posture linguale existent — aucune n'a mesuré de changement durable de la mâchoire chez l'adulte.",
    demoCite: "⧉ de vraies citations cliquables arrivent ici",
  },
  status: {
    checking: "vérification…",
    error: "Un souci de notre côté — réessaie dans un instant.",
    couldntRead: "lecture impossible",
    read: "lu",
    chars: "caractères",
    sample: "verdicts d'exemple — le pipeline scientifique arrive à la prochaine phase",
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
    mixed: "De vraies études existent — et elles se contredisent.",
    weak: "Il existe quelque chose, mais c'est mince : petits échantillons, études animales, pas de groupe témoin.",
    no_evidence: "Nous avons fouillé la littérature et rien ne soutient l'affirmation.",
    not_empirical: "Une opinion ou une vibe, pas un fait vérifiable — c'est permis, mais ce n'est pas de la science.",
  } as Record<Verdict, string>,
  verdictDetails: {
    supported: {
      evidence: "Plusieurs études indépendantes — idéalement des essais ou de grandes revues — concordent, sans être renversées par des travaux de meilleure qualité.",
      example: "La crème solaire qui réduit le risque de cancer de la peau : des décennies d'essais et de cohortes concordent.",
    },
    mixed: {
      evidence: "La recherche se contredit vraiment — certaines études trouvent un effet, d'autres non, sans camp clairement gagnant.",
      example: "Alimentation et acné : certaines études les relient, beaucoup non.",
    },
    weak: {
      evidence: "Les seules preuves sont minces — quelques petites études, des travaux sur l'animal ou en labo, ou aucun groupe témoin pour écarter le hasard.",
      example: "Le mewing et la mâchoire : quelques petites études observationnelles, aucun essai contrôlé chez l'adulte.",
    },
    no_evidence: {
      evidence: "Nous avons fouillé la littérature sans rien trouver qui teste vraiment l'affirmation. L'absence de preuve n'est pas une preuve du contraire — juste que personne ne l'a démontré.",
      example: "Des astuces looksmaxxing marginales jamais passées par une étude.",
    },
    not_empirical: {
      evidence: "Il n'y a rien à mesurer — c'est une opinion, une préférence esthétique ou une définition. La science ne peut pas la noter, et c'est très bien.",
      example: "« Cette mâchoire est plus belle » : une question de goût, pas un fait testable.",
    },
  } as Record<Verdict, { evidence: string; example: string }>,
  verdictExtra: { looksLike: "Pourquoi ce verdict", forExample: "Par exemple" },
  stages: {
    reading: "lecture de la source…",
    claims: "{n} affirmation(s) trouvée(s) — lecture attentive…",
    searching: "recherche dans la littérature…",
    grading: "évaluation des preuves…",
  },
  ui: {
    clear: "effacer",
    installApp: "installer l'appli",
    installed: "installée ✓",
    howToInstall: "comment installer",
    installTitle: "Mets-la sur ton téléphone",
    installBody: "Installe Bloomscroll comme une appli, puis vérifie n'importe quelle affirmation depuis ton menu Partager — sans App Store, sans compte.",
  },
  stats: [
    { value: "45 M+", label: "articles interrogeables via Europe PMC" },
    { value: "5", label: "niveaux de preuve — jamais un simple vrai/faux" },
    { value: "0", label: "citation inventée, bloqué par conception" },
    { value: "3+", label: "plateformes lisibles, plus tout article" },
  ],
  how: {
    title: "Comment ça marche",
    steps: [
      {
        title: "Colle n'importe quoi",
        body: "Un lien YouTube, TikTok ou Reddit, un article — ou tape l'affirmation toi-même. Appuie sur vérifier.",
      },
      {
        title: "Il trouve les vraies affirmations",
        body: "Bloomscroll extrait ce qui est vraiment vérifiable et interroge Europe PMC — un index gratuit de plus de 45 millions d'articles biomédicaux.",
      },
      {
        title: "Des preuves, notées",
        body: "Chaque affirmation reçoit un verdict sur cinq niveaux, un résumé en langage clair et de vraies citations cliquables. Jamais un simple vrai/faux.",
      },
    ],
  },
  verdictsTitle: "Ce que veulent dire les verdicts",
  pricing: {
    title: "Des forfaits qui poussent avec toi",
    sub: "Bloomscroll est gratuit pendant la bêta. Les forfaits payants arrivent — voici leur forme.",
    soon: "bientôt disponible",
    freeBeta: "gratuit pendant la bêta",
    plans: [
      {
        name: "Seed",
        price: "0 $",
        tagline: "Pour scroller mieux",
        features: ["Des vérifications chaque jour", "Les cinq niveaux de verdict", "De vraies citations cliquables"],
        live: true,
      },
      {
        name: "Sprout",
        price: "—",
        tagline: "Pour les curieux",
        features: ["Vérifications illimitées", "Historique des vérifications", "Cartes de verdict à partager"],
        live: false,
      },
      {
        name: "Canopy",
        price: "—",
        tagline: "Pour les classes et les communautés",
        features: ["Espace d'équipe partagé", "Vérification de liens en masse", "Accès API"],
        live: false,
      },
    ],
  },
  faq: {
    title: "Questions, réponses",
    items: [
      {
        q: "Est-ce un avis médical ?",
        a: "Non. Bloomscroll explique ce que dit la recherche publiée sur une affirmation et la force de cette recherche. Il ne diagnostique pas, ne traite pas et ne remplace pas un professionnel de santé — et il le dit juste à côté du champ de saisie.",
      },
      {
        q: "D'où viennent les citations ?",
        a: "D'Europe PMC, un index public et gratuit de plus de 45 millions d'articles biomédicaux. Chaque citation renvoie à un vrai article, et le pipeline valide chaque référence avant affichage — une citation inventée ne peut pas atteindre ton écran, par conception.",
      },
      {
        q: "Qu'est-ce que je peux coller ?",
        a: "Des liens YouTube (on lit les sous-titres), TikTok (la légende), des posts Reddit, la plupart des articles — ou tape l'affirmation toi-même. Instagram bloque ce type d'accès pour tous les outils tiers : pour IG, colle la légende.",
      },
      {
        q: "Pourquoi « affirmation non testable » ?",
        a: "Parce que beaucoup de ce qui défile est de l'opinion, de l'esthétique ou des vibes — et c'est très bien. Bloomscroll le signale comme un résultat à part entière au lieu de prétendre que la science a un verdict dessus.",
      },
      {
        q: "C'est gratuit ?",
        a: "Oui, entièrement gratuit pendant la bêta. Les forfaits payants (Sprout et Canopy) viendront plus tard — vérifier une affirmation restera toujours gratuit.",
      },
    ],
  },
  contact: {
    title: "Écris au créateur",
    body: "Bloomscroll est construit par un lycéen pour le challenge TKS Prompt → Product. Questions, retours, bugs ou idées — le mail arrive directement chez celui qui l'a construit.",
    button: "écrire au créateur",
    subject: "Bloomscroll — retour",
  },
  cta: {
    title: "Ton feed raconte beaucoup de choses. Vérifie-les.",
    button: "vérifier une affirmation",
  },
  access: {
    title: "Mets Bloomscroll dans ton menu Partager",
    sub: "Vérifie les affirmations sans quitter l'appli où tu les as vues. Choisis ton appareil — chaque installation prend moins d'une minute.",
    androidTitle: "Android",
    androidLede: "Installe une fois, et Bloomscroll apparaît dans ton menu Partager à côté de Messages et WhatsApp.",
    androidSteps: [
      "Ouvre bloomscroll dans Chrome",
      "Menu ⋮ → « Ajouter à l'écran d'accueil » → Installer",
      "Dans n'importe quelle appli : Partager → Bloomscroll",
      "La vérification se lance toute seule",
    ],
    iphoneTitle: "iPhone",
    iphoneLede: "Ajoute-le une fois — il apparaîtra sous Partager → Raccourcis.",
    iphoneSteps: [
      "Ouvre l'appli Raccourcis → touche +",
      "Ajoute l'action « Ouvrir les URL »",
      "Mets l'URL : bloomscroll…/?q= suivi de la variable Entrée du raccourci",
      "Dans les réglages du raccourci, active « Afficher dans la feuille de partage »",
      "Nomme-le Bloomscroll — c'est fait",
    ],
    iphoneNote: "Un lien iCloud officiel en un clic arrivera ici bientôt — d'ici là, les cinq étapes ci-dessus construisent exactement la même chose.",
    desktopTitle: "Ordinateur",
    desktopLede: "Glisse ce bouton dans ta barre de favoris. Clique dessus sur n'importe quelle page pour la vérifier.",
    bookmarklet: "✓ vérifier avec bloomscroll",
    desktopNote: "Fonctionne sur Chrome, Edge, Firefox et Safari.",
    igNote: "Instagram bloque ce type d'accès pour tous les outils tiers — pas seulement celui-ci. Pour un post IG, copie la légende et colle-la.",
    back: "retour à bloomscroll",
  },
  footer: {
    product: "Produit",
    about: "À propos",
    contactLink: "contacter le créateur",
    tks: "challenge TKS prompt → product",
    disclaimer: "Bloomscroll explique les preuves publiées. Ce n'est pas un avis médical et il ne diagnostique jamais.",
    rights: "© 2026 bloomscroll",
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
