export const GITA_THEME_LABELS = {
  all: "All",
  karma: "Karma",
  mind: "Mind",
  fear: "Fear",
  success: "Success",
  devotion: "Devotion",
};

export const GITA_MOOD_OPTIONS = [
  { value: "calm", label: "Calm" },
  { value: "stressed", label: "Stressed" },
  { value: "anxious", label: "Anxious" },
  { value: "motivated", label: "Motivated" },
  { value: "focused", label: "Focused" },
  { value: "tired", label: "Tired" },
  { value: "brave", label: "Brave" },
];

export const GITA_THEME_ORDER = ["karma", "mind", "fear", "success"];

export function labelForTheme(theme) {
  return GITA_THEME_LABELS[String(theme || "").toLowerCase()] || String(theme || "");
}

export function themeColor(theme) {
  switch (String(theme || "").toLowerCase()) {
    case "karma":
      return "var(--tc-label)";
    case "mind":
      return "var(--tc-sky)";
    case "fear":
      return "var(--tc-alert)";
    case "success":
      return "var(--tc-value)";
    case "devotion":
      return "var(--tc-base)";
    default:
      return "var(--tc-base)";
  }
}
