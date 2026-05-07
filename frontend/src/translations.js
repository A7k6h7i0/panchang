import en from "./locales/en.json";
import { storageGet } from "./utils/storage";

const LANGUAGE_KEY = "panchang:selected-language";

const localeLoaders = {
  en: () => Promise.resolve({ default: en }),
  te: () => import("./locales/te.json"),
  hi: () => import("./locales/hi.json"),
  ml: () => import("./locales/ml.json"),
  kn: () => import("./locales/kn.json"),
  ta: () => import("./locales/ta.json"),
};

export const translations = {
  en: { ...en },
};

// Ensure critical labels are available even if locale JSONs are cached/old.
const translationOverrides = {
  en: {
    karana: "Karana",
    purohith: "Purohith",
    astrologers: "Astrologers",
    astrologersSubtitle: "Nearby astrologers and search",
    addAstrologerButton: "Add Astrologer",
    gita: "Bhagavad Gita",
    temples: "Temples",
    guideOnPhone: "Guide on Phone",
    Bava: "Bava",
    Balava: "Balava",
    Kaulava: "Kaulava",
    Taitila: "Taitila",
    Garaja: "Garaja",
    Vanija: "Vanija",
    Vishti: "Vishti",
    Shakuni: "Shakuni",
    Chatushpada: "Chatushpada",
    Naga: "Naga",
    Kimstughna: "Kimstughna",
  },
  te: {
    karana: "\u0c15\u0c30\u0c23",
    purohith: "\u0c2a\u0c41\u0c30\u0c4b\u0c39\u0c3f\u0c24\u0c4d",
    astrologers: "\u0c1c\u0c4d\u0c2f\u0c4b\u0c24\u0c3f\u0c37\u0c41\u0c15\u0c41\u0c32\u0c41",
    astrologersSubtitle: "\u0c24\u0c1f\u0c4d\u0c1f\u0c3f\u0c32\u0c4b \u0c1c\u0c4d\u0c2f\u0c4b\u0c24\u0c3f\u0c37\u0c41\u0c15\u0c41\u0c32\u0c41 \u0c2e\u0c30\u0c3f\u0c2f\u0c41 \u0c35\u0c47\u0c1f",
    addAstrologerButton: "\u0c1c\u0c4d\u0c2f\u0c4b\u0c24\u0c3f\u0c37\u0c41\u0c15\u0c41\u0c28\u0c3f \u0c1c\u0c4b\u0c21\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f",
    gita: "\u0c17\u0c40\u0c24",
    temples: "\u0c26\u0c47\u0c35\u0c3e\u0c32\u0c2f\u0c3e\u0c32\u0c41",
    guideOnPhone: "\u0c2b\u0c4b\u0c28\u0c4d\u200c\u0c32\u0c4b \u0c2e\u0c3e\u0c30\u0c4d\u0c17\u0c26\u0c30\u0c4d\u0c36\u0c15\u0c02",
    Bava: "\u0c2c\u0c35",
    Balava: "\u0c2c\u0c3e\u0c32\u0c35",
    Kaulava: "\u0c15\u0c4c\u0c32\u0c35",
    Taitila: "\u0c24\u0c48\u0c24\u0c3f\u0c32",
    Garaja: "\u0c17\u0c30\u0c1c",
    Vanija: "\u0c35\u0c23\u0c3f\u0c1c",
    Vishti: "\u0c35\u0c3f\u0c37\u0c4d\u0c1f\u0c3f",
    Shakuni: "\u0c36\u0c15\u0c41\u0c28\u0c3f",
    Chatushpada: "\u0c1a\u0c24\u0c41\u0c37\u0c4d\u0c2a\u0c3e\u0c26",
    Naga: "\u0c28\u0c3e\u0c17",
    Kimstughna: "\u0c15\u0c3f\u0c02\u0c38\u0c4d\u0c24\u0c41\u0c18\u0c4d\u0c28",
  },
  hi: {
    karana: "\u0915\u0930\u0923",
    purohith: "\u092a\u0941\u0930\u094b\u0939\u093f\u0924",
    astrologers: "\u091c\u094d\u092f\u094b\u0924\u093f\u0937\u0940",
    astrologersSubtitle: "\u0928\u091c\u0926\u0940\u0915\u0940 \u091c\u094d\u092f\u094b\u0924\u093f\u0937\u0940 \u0914\u0930 \u0916\u094b\u091c",
    addAstrologerButton: "\u091c\u094d\u092f\u094b\u0924\u093f\u0937\u0940 \u091c\u094b\u0921\u093c\u0947\u0902",
    gita: "\u092d\u0917\u0935\u0926\u094d\u0917\u0940\u0924\u093e",
    temples: "\u092e\u0902\u0926\u093f\u0930",
    guideOnPhone: "\u092b\u093c\u094b\u0928 \u092a\u0930 \u092e\u093e\u0930\u094d\u0917\u0926\u0930\u094d\u0936\u0915",
    Bava: "\u092c\u0935",
    Balava: "\u092c\u093e\u0932\u0935",
    Kaulava: "\u0915\u094c\u0932\u0935",
    Taitila: "\u0924\u0948\u0924\u093f\u0932",
    Garaja: "\u0917\u0930\u091c",
    Vanija: "\u0935\u0923\u093f\u091c",
    Vishti: "\u0935\u093f\u0937\u094d\u091f\u093f",
    Shakuni: "\u0936\u0915\u0941\u0928\u093f",
    Chatushpada: "\u091a\u0924\u0941\u0937\u094d\u092a\u093e\u0926",
    Naga: "\u0928\u093e\u0917",
    Kimstughna: "\u0915\u093f\u0902\u0938\u094d\u0924\u0941\u0918\u094d\u0928",
  },
  ml: {
    karana: "\u0d15\u0d30\u0d23\u0d02",
    purohith: "\u0d2a\u0d41\u0d30\u0d4b\u0d39\u0d3f\u0d24",
    astrologers: "\u0d1c\u0d4d\u0d2f\u0d4b\u0d24\u0d3f\u0d37\u0d28\u0d4d\u0d2e\u0d3e\u0d31\u0d4d",
    astrologersSubtitle: "\u0d0a\u0d2f\u0d3e \u0d1c\u0d4d\u0d2f\u0d4b\u0d24\u0d3f\u0d37\u0d28\u0d4d\u0d2e\u0d3e\u0d31\u0d4d \u0d1b\u0d30\u0d4d\u0d23\u0d4d\u0d28\u0d41\u0d31\u0d32\u0d41\u0d02 \u0d2e\u0d4b\u0d02",
    addAstrologerButton: "\u0d1c\u0d4d\u0d2f\u0d4b\u0d24\u0d3f\u0d37\u0d28\u0d4d\u0d2e\u0d3e\u0d31\u0d4d \u0d1c\u0d4b\u0d21\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d15",
    gita: "\u0d2d\u0d17\u0d35\u0d26\u0d4d\u0d17\u0d40\u0d24",
    temples: "\u0d15\u0d4d\u0d37\u0d47\u0d24\u0d4d\u0d30\u0d19\u0d4d\u0d19\u0d7e",
    guideOnPhone: "\u0d2b\u0d4b\u0d23\u0d3f\u0d7d \u0d17\u0d48\u0d21\u0d4d",
    Bava: "\u0d2c\u0d35",
    Balava: "\u0d2c\u0d3e\u0d32\u0d35",
    Kaulava: "\u0d15\u0d4c\u0d32\u0d35",
    Taitila: "\u0d24\u0d48\u0d24\u0d3f\u0d32",
    Garaja: "\u0d17\u0d30\u0d1c",
    Vanija: "\u0d35\u0d23\u0d3f\u0d1c",
    Vishti: "\u0d35\u0d3f\u0d37\u0d4d\u0d1f\u0d3f",
    Shakuni: "\u0d36\u0d15\u0d41\u0d28\u0d3f",
    Chatushpada: "\u0d1a\u0d24\u0d41\u0d37\u0d4d\u0d2a\u0d3e\u0d26",
    Naga: "\u0d28\u0d3e\u0d17",
    Kimstughna: "\u0d15\u0d3f\u0d02\u0d38\u0d4d\u0d24\u0d41\u0d18\u0d4d\u0d28",
  },
  kn: {
    karana: "\u0c95\u0cb0\u0ca3",
    purohith: "\u0caa\u0cc1\u0cb0\u0ccb\u0cb9\u0cbf\u0ca4",
    astrologers: "\u0c9c\u0ccd\u0caf\u0ccb\u0ca4\u0cbf\u0cb7\u0cbf\u0c97\u0cb3\u0cc1",
    astrologersSubtitle: "\u0ca8\u0cae\u0ccd\u0cae\u0cbf\u0ca8\u0cbf\u0c82\u0ca6 \u0c9c\u0ccd\u0caf\u0ccb\u0ca4\u0cbf\u0cb7\u0cbf\u0c97\u0cb3\u0cc1 \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0ca8\u0cbf\u0cb0\u0ccd\u0cb5\u0cb9\u0ca3\u0cc6",
    addAstrologerButton: "\u0c9c\u0ccd\u0caf\u0ccb\u0ca4\u0cbf\u0cb7\u0cbf\u0c97\u0ca8\u0cbf \u0c9c\u0ccb\u0ca1\u0cbf\u0cb8\u0cbf",
    gita: "\u0cad\u0c97\u0cb5\u0ca6\u0ccd\u0c97\u0cc0\u0ca4\u0cbe",
    temples: "\u0ca6\u0cc7\u0cb5\u0cbe\u0cb2\u0caf\u0c97\u0cb3\u0cc1",
    guideOnPhone: "\u0cab\u0ccb\u0ca8\u0ccd\u200c\u0ca8\u0cb2\u0ccd\u0cb2\u0cbf \u0cae\u0cbe\u0cb0\u0ccd\u0c97\u0ca6\u0cb0\u0ccd\u0cb6\u0cbf",
    Bava: "\u0cac\u0cb5",
    Balava: "\u0cac\u0cbe\u0cb2\u0cb5",
    Kaulava: "\u0c95\u0ccc\u0cb2\u0cb5",
    Taitila: "\u0ca4\u0cc8\u0ca4\u0cbf\u0cb2",
    Garaja: "\u0c97\u0cb0\u0c9c",
    Vanija: "\u0cb5\u0ca3\u0cbf\u0c9c",
    Vishti: "\u0cb5\u0cbf\u0cb7\u0ccd\u0c9f\u0cbf",
    Shakuni: "\u0cb6\u0c95\u0cc1\u0ca8\u0cbf",
    Chatushpada: "\u0c9a\u0ca4\u0cc1\u0cb7\u0ccd\u0caa\u0cbe\u0ca6",
    Naga: "\u0ca8\u0cbe\u0c97",
    Kimstughna: "\u0c95\u0cbf\u0c82\u0cb8\u0ccd\u0ca4\u0cc1\u0c98\u0ccd\u0ca8",
  },
  ta: {
    karana: "\u0b95\u0bb0\u0ba3",
    purohith: "\u0baa\u0bc1\u0bb0\u0bcb\u0bb9\u0bbf\u0ba4\u0bcd",
    astrologers: "\u0b9c\u0bcb\u0ba4\u0bbf\u0b9f\u0bb0\u0bcd\u0b95\u0bb3\u0bcd",
    astrologersSubtitle: "\u0b85\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0ba4\u0bcd\u0ba4\u0bbf\u0bb2\u0bc1\u0bb3\u0bcd\u0b9f \u0b9c\u0bcb\u0ba4\u0bbf\u0b9f\u0bb0\u0bcd\u0b95\u0bb3\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0ba4\u0bc7\u0b9f\u0bb2\u0bcd",
    addAstrologerButton: "\u0b9c\u0bcb\u0ba4\u0bbf\u0b9f\u0bb0\u0bcd \u0b9a\u0bc7\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd",
    gita: "\u0baa\u0b95\u0bb5\u0ba4\u0bcd\u0b95\u0bc0\u0ba4\u0bbe",
    temples: "\u0b95\u0bcb\u0bb5\u0bbf\u0bb2\u0bcd\u0b95\u0bb3\u0bcd",
    guideOnPhone: "\u0ba4\u0bca\u0bb2\u0bc8\u0baa\u0bc7\u0b9a\u0bbf \u0bb5\u0bb4\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf",
    Bava: "\u0baa\u0bb5",
    Balava: "\u0baa\u0bbe\u0bb2\u0bb5",
    Kaulava: "\u0b95\u0b94\u0bb2\u0bb5",
    Taitila: "\u0ba4\u0bc8\u0ba4\u0bbf\u0bb2",
    Garaja: "\u0b95\u0bb0\u0b9c",
    Vanija: "\u0bb5\u0ba3\u0bbf\u0b9c",
    Vishti: "\u0bb5\u0bbf\u0bb7\u0bcd\u0b9f\u0bbf",
    Shakuni: "\u0b9a\u0b95\u0bc1\u0ba9\u0bbf",
    Chatushpada: "\u0b9a\u0ba4\u0bc1\u0bb7\u0bcd\u0baa\u0bbe\u0ba4",
    Naga: "\u0ba8\u0bbe\u0b95",
    Kimstughna: "\u0b95\u0bbf\u0bae\u0bcd\u0bb8\u0bcd\u0ba4\u0bc1\u0b95\u0bcd\u0ba9",
  },
};

function applyOverrides(lang, dict) {
  return { ...dict, ...(translationOverrides[lang] || {}) };
}

translations.en = applyOverrides("en", translations.en);

const loadingPromises = new Map();

export function ensureLanguageLoaded(languageCode) {
  const code = String(languageCode || "en").trim() || "en";
  if (translations[code]) return Promise.resolve(translations[code]);

  if (!localeLoaders[code]) return Promise.resolve(translations.en);
  if (loadingPromises.has(code)) return loadingPromises.get(code);

  const loader = localeLoaders[code];
  const promise = loader()
    .then((module) => {
      const dict = applyOverrides(code, module?.default || {});
      translations[code] = dict;
      loadingPromises.delete(code);
      return dict;
    })
    .catch(() => {
      loadingPromises.delete(code);
      return translations.en;
    });

  loadingPromises.set(code, promise);
  return promise;
}

const savedInitialLanguage =
  typeof window !== "undefined" ? String(storageGet(LANGUAGE_KEY) || "en").trim() || "en" : "en";

export const initialLanguageReady = ensureLanguageLoaded(savedInitialLanguage);

export const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
];

function translateTime(timeStr, t) {
  if (!timeStr || timeStr === "—" || timeStr === "-") return timeStr;
  return timeStr.replace(/\bAM\b/g, t.am).replace(/\bPM\b/g, t.pm);
}

export function translateText(text, t) {
  if (!text || text === "—") return text;
  if (typeof text !== "string") return String(text);

  const timeRangePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s+to\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;

  if (timeRangePattern.test(text)) {
    return text.replace(timeRangePattern, (match, time1, time2) => {
      const translatedTime1 = translateTime(time1.trim(), t);
      const translatedTime2 = translateTime(time2.trim(), t);

      if (t.uptoPrefix) {
        return `${translatedTime1} ${t.to} ${translatedTime2}`;
      }

      return `${translatedTime1} ${t.to} ${translatedTime2} ${t.upto}`;
    });
  }

  if (text.includes(" upto ")) {
    const parts = text.split(" upto ");
    const tithiOrNakshatra = parts[0].trim();
    const time = parts[1].trim();
    const translatedName = t[tithiOrNakshatra] || tithiOrNakshatra;
    const translatedTime = translateTime(time, t);

    if (t.uptoPrefix) {
      return `${translatedName} ${t.upto} ${translatedTime}`;
    }

    return `${translatedName} ${translatedTime} ${t.upto}`;
  }

  if (text.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i)) {
    return translateTime(text, t);
  }

  return t[text] || text;
}

export function tr(key, fallback, languageCode) {
  const primaryDict = translations[languageCode] || {};
  return primaryDict[key] || translations.en[key] || fallback || key;
}

export function translateFirstWord(text, t) {
  if (!text || text === "—") return text;
  if (typeof text !== "string") return String(text);

  const firstWord = text.split(" ")[0].trim();
  return t[firstWord] || firstWord;
}

export function getTithiIndicator(tithiText) {
  if (!tithiText || typeof tithiText !== "string") return null;

  const tithiName = tithiText.split(" ")[0].trim();

  if (tithiName === "Purnima") {
    return { type: "purnima", symbol: "⚪", color: "white" };
  }

  if (tithiName === "Amavasya") {
    return { type: "amavasya", symbol: "⚫", color: "black" };
  }

  return null;
}
