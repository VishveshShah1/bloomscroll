import type { Lang } from "./i18n";

// Phase 7: the safety override layer. A small, static, human-maintained list —
// never model-decided. If a claim or input matches, the UI always shows an
// explicit warning, so a "no evidence" or "weak" verdict can never sit
// unqualified on something dangerous.

interface SafetyRule {
  match: RegExp;
  label: { en: string; fr: string };
}

const RULES: SafetyRule[] = [
  {
    match: /bone\s*smash|hammer.{0,12}(face|jaw|cheek)|smash.{0,12}(face|jaw|cheek)bone/i,
    label: {
      en: "deliberately striking bones (“bone smashing”)",
      fr: "se frapper volontairement les os (« bone smashing »)",
    },
  },
  {
    match: /(?:drink|ingest|consum|swallow|take)[\s\S]{0,40}(?:bleach|chlorine\s*dioxide|miracle\s*mineral)|miracle\s*mineral\s*solution|chlorine\s*dioxide/i,
    label: {
      en: "ingesting bleach or “miracle mineral solution”",
      fr: "l'ingestion d'eau de Javel ou de « solution minérale miracle »",
    },
  },
  {
    match: /dry\s*fast|water\s*fast(?:ing)?\s*(?:for)?\s*(?:\d{2,}|week|month)|starv(?:e|ation)\s*(?:diet|yourself)|\b(?:eat|eating)\s*under\s*\d{3}\s*calories/i,
    label: {
      en: "dry fasting or extreme calorie restriction",
      fr: "le jeûne sec ou la restriction calorique extrême",
    },
  },
  {
    match: /diy\s*(?:filler|botox|injection)|inject(?:ing)?\s*(?:yourself|at\s*home|silicone|saline\s*(?:into|in))|home\s*(?:filler|botox)/i,
    label: {
      en: "DIY injections or fillers",
      fr: "les injections ou fillers faits maison",
    },
  },
  {
    match: /sun\s*gaz|star(?:e|ing)\s*(?:at|into)\s*the\s*sun/i,
    label: {
      en: "staring at the sun",
      fr: "fixer le soleil",
    },
  },
  {
    match: /eye\s*(?:color|colour)\s*(?:chang(?:e|ing)\s*)?drops|chang(?:e|ing)\s*(?:your\s*)?eye\s*(?:color|colour)\s*(?:with|using|drops)/i,
    label: {
      en: "eye-color-changing drops",
      fr: "les gouttes pour changer la couleur des yeux",
    },
  },
  {
    match: /bonesmash|mewing\s*with\s*(?:force|pressure|thumb)|thumb\s*pulling|face\s*pulling/i,
    label: {
      en: "applying force to facial bones",
      fr: "l'application de force sur les os du visage",
    },
  },
];

const MESSAGE = {
  en: (label: string) =>
    `This is related to ${label}. Even when strong evidence is missing either way, missing evidence is not permission — this practice can cause real, lasting harm. Talk to an actual clinician before trying anything like it.`,
  fr: (label: string) =>
    `Cela touche à ${label}. Même quand les preuves manquent dans un sens comme dans l'autre, l'absence de preuve n'est pas une permission — cette pratique peut causer de vrais dégâts durables. Parle à un vrai professionnel de santé avant d'essayer quoi que ce soit.`,
};

export interface SafetyWarning {
  label: string;
  message: string;
}

export function checkSafety(text: string, lang: Lang = "en"): SafetyWarning | null {
  for (const rule of RULES) {
    if (rule.match.test(text)) {
      const label = rule.label[lang];
      return { label, message: MESSAGE[lang](label) };
    }
  }
  return null;
}
