import { preloadTTS } from "../../../utils/cloudSpeech";

function verseLanguage(language) {
  const normalized = String(language || "en").toLowerCase();
  if (normalized === "te") return "te";
  if (normalized === "hi") return "hi";
  if (normalized === "ta") return "ta";
  if (normalized === "kn") return "kn";
  if (normalized === "ml") return "ml";
  return "en";
}

export async function cacheAudio(verse, language = "en") {
  if (!verse) return [];

  const textEntries = [
    {
      key: `${verse.id}:sanskrit`,
      text: String(verse.slok || "").trim(),
      language: "hi",
    },
    {
      key: `${verse.id}:meaning:${language}`,
      text: String(verse.meaning || "").trim(),
      language: verseLanguage(language),
    },
  ].filter((entry) => entry.text);

  if (!textEntries.length) return [];
  return preloadTTS(textEntries);
}
