function resolveSpeechLanguage(language) {
  // Route newly added languages to the closest existing speech templates.
  if (language === "mrw") return "hi";
  if (language === "gu") return "hi";
  if (language === "bn") return "hi";
  return language;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const localizedPeriodWords = {
  te: ["ఉదయం", "మధ్యాహ్నం", "సాయంత్రం", "రాత్రి", "రేయి", "పూర్వాహ్నం", "అపరాహ్నం"],
  hi: ["सुबह", "पूर्वाह्न", "दोपहर", "अपराह्न", "शाम", "रात"],
  kn: ["ಬೆಳಗ್ಗೆ", "ಮಧ್ಯಾಹ್ನ", "ಸಂಜೆ", "ರಾತ್ರಿ"],
  ta: ["காலை", "மதியம்", "மாலை", "இரவு"],
  ml: ["രാവിലെ", "ഉച്ചയ്ക്ക്", "വൈകുന്നേരം", "രാത്രി"],
};

const fallbackPeriodWords = {
  te: { am: "ఉదయం", pm: "సాయంత్రం" },
  hi: { am: "सुबह", pm: "शाम" },
  kn: { am: "ಬೆಳಗ್ಗೆ", pm: "ಸಂಜೆ" },
  ta: { am: "காலை", pm: "மாலை" },
  ml: { am: "രാവിലെ", pm: "വൈകുന്നേരം" },
  en: { am: "AM", pm: "PM" },
};

function hasLocalizedPeriodWord(text, language) {
  const words = localizedPeriodWords[language] || [];
  return words.some((word) => new RegExp(escapeRegExp(word), "i").test(text));
}

export function normalizeSpeechTimeText({ language, timeText, amToken, pmToken }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const rawText = String(timeText || "").trim();
  if (!rawText) return "";

  const text = rawText.replace(/\s+/g, " ");
  if (resolvedLanguage === "en") return text;

  // Telugu speech should keep the original time tokens without injecting
  // extra period words such as "ఉదయం" or "సాయంత్రం".
  // To prevent Google TTS from auto-expanding "09:57" into phrases that duplicate
  // "ఉదయం", we explicitly format it to "9 గంటల 57 నిమిషాలు".
  if (resolvedLanguage === "te") {
    return text.replace(/(\d{1,2})[:.](\d{2})/g, (match, h, m) => {
      const hours = parseInt(h, 10);
      const mins = parseInt(m, 10);
      return mins === 0
        ? `${hours} గంటల`
        : `${hours} గంటల ${mins} నిమిషాలు`;
    });
  }

  const fallback = fallbackPeriodWords[resolvedLanguage] || fallbackPeriodWords.en;
  const amWord = amToken || fallback.am;
  const pmWord = pmToken || fallback.pm;
  const hasEnglishPeriod = /\b(?:AM|PM)\b/i.test(text);
  const hasLocalPeriod = hasLocalizedPeriodWord(text, resolvedLanguage);

  if (hasLocalPeriod) {
    return text;
  }

  if (hasEnglishPeriod) {
    return text.replace(/\bAM\b/gi, amWord).replace(/\bPM\b/gi, pmWord);
  }

  return text;
}

function splitSpeechTimeRange(timeText) {
  const text = String(timeText || "").replace(/\s+/g, " ").trim();
  if (!text) return { start: "", end: "" };

  const separatorPattern =
    /\s*(?:to|upto|up\s*to|from|నుండి|వరకు|->|[-–—]|→)\s*/i;
  const parts = text.split(separatorPattern).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { start: parts[0], end: parts[1] };
  }

  const matches = text.match(/\d{1,2}:\d{2}(?:\s*[^\s,.;:]+)?/g);
  if (matches && matches.length >= 2) {
    return { start: matches[0].trim(), end: matches[1].trim() };
  }

  return { start: text, end: "" };
}

export function normalizeSpeechTimeRange({ language, timeText, amToken, pmToken }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const rawText = String(timeText || "").trim();
  if (!rawText) return "";

  const { start, end } = splitSpeechTimeRange(rawText);
  if (!end) {
    return normalizeSpeechTimeText({ language: resolvedLanguage, timeText: start, amToken, pmToken });
  }

  const normalizedStart = normalizeSpeechTimeText({
    language: resolvedLanguage,
    timeText: start,
    amToken,
    pmToken,
  });
  const normalizedEnd = normalizeSpeechTimeText({
    language: resolvedLanguage,
    timeText: end,
    amToken,
    pmToken,
  });

  if (resolvedLanguage === "te") {
    return `${normalizedStart} నుండి ${normalizedEnd} వరకు`;
  }

  const rangeWords = {
    en: { to: "to", upto: "upto" },
    hi: { to: "से", upto: "तक" },
    kn: { to: "ರಿಂದ", upto: "ವರೆಗೆ" },
    ta: { to: "முதல்", upto: "வரை" },
    ml: { to: "മുതൽ", upto: "വരെ" },
    te: { to: "నుండి", upto: "వరకు" },
  };
  const rangeWord = rangeWords[resolvedLanguage] || rangeWords.en;
  const toWord = rangeWord.to;
  const uptoWord = rangeWord.upto;

  if (rawText.toLowerCase().includes("upto") || rawText.includes(uptoWord)) {
    return `${normalizedStart} ${uptoWord} ${normalizedEnd}`.trim();
  }

  return `${normalizedStart} ${toWord} ${normalizedEnd}`.trim();
}

export function stripSpeechPeriodWords({ language, timeText }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const rawText = String(timeText || "").trim();
  if (!rawText) return "";

  const text = rawText.replace(/\s+/g, " ");
  const words = localizedPeriodWords[resolvedLanguage] || [];
  const stripped = words.reduce((acc, word) => {
    const pattern = new RegExp(escapeRegExp(word), "gi");
    return acc.replace(pattern, "");
  }, text);

  return stripped
    .replace(/\b(?:AM|PM)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([:.,])/g, "$1")
    .replace(/\s+(నుండి|से|ರಿಂದ|முதல்|മുതൽ|to)\s+/gi, " $1 ")
    .trim();
}

export function getSpeechText({
  language,
  isToday,
  dateText,
  tithi,
  nakshatra,
  rahu,
  yama,
}) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  switch (resolvedLanguage) {
    // 🌍 ENGLISH
    case "en":
      return isToday
        ? `
Today's Panchang details are as follows.
Today's Tithi is ${tithi}.
Today's Nakshatra is ${nakshatra}.
Rahu Kalam is ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: rahu })}.
Yamaganda is ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: yama })}.
`
        : `
On ${dateText}, the Panchang details are as follows.
Tithi is ${tithi}.
Nakshatra is ${nakshatra}.
Rahu Kalam is ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: rahu })}.
Yamaganda is ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: yama })}.
`;

    // 🌍 TELUGU
    case "te":
      return isToday
        ? `
ఈ రోజు పంచాంగ వివరాలు ఈ విధంగా ఉన్నాయి.
ఈ రోజు తిథి ${tithi}.
ఈ రోజు నక్షత్రం ${nakshatra}.
రాహుకాలం ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: rahu })}.
యమగండం ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: yama })}.
`
        : `
${dateText} నాటి పంచాంగ వివరాలు ఈ విధంగా ఉన్నాయి.
తిథి ${tithi}.
నక్షత్రం ${nakshatra}.
రాహుకాలం ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: rahu })}.
యమగండం ${normalizeSpeechTimeText({ language: resolvedLanguage, timeText: yama })}.
`;

    // 🌍 HINDI
    case "hi":
      return isToday
        ? `
आज के पंचांग विवरण इस प्रकार हैं।
आज की तिथि ${tithi} है।
आज का नक्षत्र ${nakshatra} है।
राहुकाल का समय ${rahu} है।
यमगंड का समय ${yama} है।
`
        : `
${dateText} के पंचांग विवरण इस प्रकार हैं।
तिथि ${tithi} है।
नक्षत्र ${nakshatra} है।
राहुकाल का समय ${rahu} है।
यमगंड का समय ${yama} है।
`;

    // 🌍 KANNADA
    case "kn":
      return isToday
        ? `
ಇಂದಿನ ಪಂಚಾಂಗ ವಿವರಗಳು ಈ ಕೆಳಗಿನಂತಿವೆ.
ಇಂದಿನ ತಿಥಿ ${tithi}.
ಇಂದಿನ ನಕ್ಷತ್ರ ${nakshatra}.
ರಾಹುಕಾಲ ಸಮಯ ${rahu}.
ಯಮಗಂಡ ಸಮಯ ${yama}.
`
        : `
${dateText} ದಿನದ ಪಂಚಾಂಗ ವಿವರಗಳು ಈ ಕೆಳಗಿನಂತಿವೆ.
ತಿಥಿ ${tithi}.
ನಕ್ಷತ್ರ ${nakshatra}.
ರಾಹುಕಾಲ ಸಮಯ ${rahu}.
ಯಮಗಂಡ ಸಮಯ ${yama}.
`;

    // 🌍 TAMIL
    case "ta":
      return isToday
        ? `
இன்றைய பஞ்சாங்க விவரங்கள் பின்வருமாறு.
இன்றைய திதி ${tithi}.
இன்றைய நட்சத்திரம் ${nakshatra}.
ராகு காலம் ${rahu}.
யமகண்டம் ${yama}.
`
        : `
${dateText}日の பஞ்சாங்க விவரங்கள் பின்வருமாறு.
திதி ${tithi}.
நட்சத்திரம் ${nakshatra}.
ராகு காலம் ${rahu}.
யமகண்டம் ${yama}.
`;

    // 🌍 MALAYALAM
    case "ml":
      return isToday
        ? `
ഇന്നത്തെ പഞ്ചാംഗ വിവരങ്ങൾ ഇങ്ങനെ ആണ്.
ഇന്നത്തെ തിഥി ${tithi}.
ഇന്നത്തെ നക്ഷത്രം ${nakshatra}.
രാഹുകാലം ${rahu}.
യമഗണ്ഡം ${yama}.
`
        : `
${dateText}日の പഞ്ചാംഗ വിവരങ്ങൾ ഇങ്ങനെ ആണ്.
തിഥി ${tithi}.
നക్�ഷത್ರಂ ${nakshatra}.
രാഹുകാಲಂ ${rahu}.
യമഗണ്ಡം ${yama}.
`;

    default:
      return "";
  }
}

export function getDateClickSpeech({ language, tithi, amrit }) {
  const resolvedLanguage = resolveSpeechLanguage(language);

  switch (resolvedLanguage) {
    case "te":
      return amrit && amrit !== "-"
        ? `ఈ రోజు తిథి ${tithi}. అమృతకాలం సమయం ${amrit}.`
        : `ఈ రోజు తిథి ${tithi}.`;
    case "hi":
      return amrit && amrit !== "-"
        ? `आज की तिथि ${tithi} है. अमृत काल का समय ${amrit} है.`
        : `आज की तिथि ${tithi} है.`;
    case "kn":
      return amrit && amrit !== "-"
        ? `ಇಂದಿನ ತಿಥಿ ${tithi}. ಅಮೃತ ಕಾಲದ ಸಮಯ ${amrit}.`
        : `ಇಂದಿನ ತಿಥಿ ${tithi}.`;
    case "ta":
      return amrit && amrit !== "-"
        ? `இன்றைய திதி ${tithi}. அமிர்த காலம் ${amrit}.`
        : `இன்றைய திதி ${tithi}.`;
    case "ml":
      return amrit && amrit !== "-"
        ? `ഇന്നത്തെ തിഥി ${tithi}. അമൃതകാലം ${amrit} ആണ്.`
        : `ഇന്നത്തെ തിഥി ${tithi} ആണ്.`;
    case "en":
    default:
      return amrit && amrit !== "-"
        ? `Today's Tithi is ${tithi}. Amrit Kalam is from ${amrit}.`
        : `Today's Tithi is ${tithi}.`;
  }
}


// Helper function for Tithi speech only
export function getTithiSpeech({ language, tithi, amToken, pmToken }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  // Parse tithi string to extract name and timing
  // Format varies by language:
  // English: "TithiName upto HH:MM AM/PM"
  // Other languages: "TithiName HH:MM AM/PM uptoWord"
  
  // Try to find time pattern in the string (e.g., "10:22 PM", "5:21 AM",
  // or localized AM/PM strings after HH:MM)
  const timeMatch = tithi?.match(/(\d{1,2}:\d{2}(?:\s*[^\s,.;:]+)?)/i);
  
  if (!timeMatch) {
    // Fallback for unformatted tithi
    switch (resolvedLanguage) {
      case "te":
        return `ఈ రోజు తిథి ${tithi}`;
      case "hi":
        return `आज की तिथि ${tithi} है`;
      case "kn":
        return `ಇಂದಿನ ತಿಥಿ ${tithi}`;
      case "ta":
        return `இன்றைய திதி ${tithi}`;
      case "ml":
        return `ഇന്നത്തെ തിഥി ${tithi}`;
      case "en":
      default:
        return `Today's Tithi is ${tithi}`;
    }
  }
  
  const timeStr = timeMatch[0].trim(); // e.g., "10:22 PM"
  const spokenTime = getSpokenTimeString({ language: resolvedLanguage, timeStr, amToken, pmToken });
  
  // Remove the time from the tithi string to get just the tithi name
  let tithiName = tithi
    ?.replace(timeMatch[0], "")
    .replace(/\s*upto\s*/i, "")
    .replace(/\s+upto\s+/i, "")
    .trim() || tithi;
  
  // Also remove any trailing translated "upto" words (Telugu: వరకు, Hindi: तक, etc.)
  const uptoWords = {
    te: "వరకు",
    hi: "तक",
    kn: "ವರೆಗೆ",
    ta: "வரை",
    ml: "വരെ"
  };
  const uptoWord = uptoWords[resolvedLanguage];
  if (uptoWord) {
    const parts = tithiName.split(uptoWord);
    tithiName = parts[0].trim();
  }
  
  // Determine if the time is today or tomorrow
  const isTodayTime = isTimeInCurrentDay(spokenTime.dayCheckTime, { amToken, pmToken });
  
  // Build the speech text based on language with native phrasing
  switch (resolvedLanguage) {
    case "te":
      return isTodayTime 
        ? `ఈ రోజు తిథి ${tithiName}. ${spokenTime.text} వరకు.`
        : `ఈ రోజు తిథి ${tithiName}. రేపు ${spokenTime.text} వరకు.`;
    case "hi":
      return isTodayTime 
        ? `आज की तिथि ${tithiName}. ${spokenTime.text} तक.`
        : `आज की तिथि ${tithiName}. कल ${spokenTime.text} तक.`;
    case "kn":
      return isTodayTime 
        ? `ಇಂದಿನ ತಿಥಿ ${tithiName}. ${spokenTime.text} ವರೆಗೆ.`
        : `ಇಂದಿನ ತಿಥಿ ${tithiName}. ನಾಳೆ ${spokenTime.text} ವರೆಗೆ.`;
    case "ta":
      return isTodayTime 
        ? `இன்றைய திதி ${tithiName}. ${spokenTime.text} வரை.`
        : `இன்றைய திதி ${tithiName}. நாளை ${spokenTime.text} வரை.`;
    case "ml":
      return isTodayTime 
        ? `ഇന്നത്തെ തിഥി ${tithiName}. ${spokenTime.text} വരെ.`
        : `ഇന്നത്തെ തിഥി ${tithiName}. നാളെ ${spokenTime.text} വരെ.`;
    case "en":
    default:
      return isTodayTime 
        ? `Today's Tithi is ${tithiName}. Valid up to ${spokenTime.text}.`
        : `Today's Tithi is ${tithiName}. Valid up to tomorrow ${spokenTime.text}.`;
  }
}

function getSpokenTimeString({ language, timeStr, amToken, pmToken }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const clockMatch = (timeStr || "").match(/(\d{1,2}:\d{2})/);
  if (!clockMatch) {
    return { text: timeStr || "", dayCheckTime: timeStr || "" };
  }

  const hhmm = clockMatch[1];
  const normalized = (timeStr || "").replace(/\s+/g, " ").trim();
  const lowerNormalized = normalized.toLowerCase();
  const amNorm = (amToken || "").toLowerCase();
  const pmNorm = (pmToken || "").toLowerCase();

  const hasEnglishAM = /\bam\b/i.test(normalized);
  const hasEnglishPM = /\bpm\b/i.test(normalized);
  const hasLocalAM = !!amNorm && lowerNormalized.includes(amNorm);
  const hasLocalPM = !!pmNorm && lowerNormalized.includes(pmNorm);
  const hasAM = hasEnglishAM || hasLocalAM;
  const hasPM = hasEnglishPM || hasLocalPM;

  if (resolvedLanguage === "en") {
    if (hasAM) return { text: `${hhmm} AM`, dayCheckTime: `${hhmm} AM` };
    if (hasPM) return { text: `${hhmm} PM`, dayCheckTime: `${hhmm} PM` };
    return { text: hhmm, dayCheckTime: hhmm };
  }

  if (resolvedLanguage === "te") {
    const formattedText = normalized.replace(/(\d{1,2})[:.](\d{2})/g, (match, h, m) => {
      const hours = parseInt(h, 10);
      const mins = parseInt(m, 10);
      return mins === 0
        ? `${hours} గంటల`
        : `${hours} గంటల ${mins} నిమిషాలు`;
    });
    return {
      text: formattedText,
      dayCheckTime: hasAM ? `${hhmm} AM` : hasPM ? `${hhmm} PM` : hhmm,
    };
  }

  const hasLocalPeriod = hasLocalizedPeriodWord(normalized, resolvedLanguage);
  const fallback = fallbackPeriodWords[resolvedLanguage] || fallbackPeriodWords.en;
  const amWord = amToken || fallback.am;
  const pmWord = pmToken || fallback.pm;

  if (hasLocalPeriod) {
    return {
      text: normalized,
      dayCheckTime: hasAM ? `${hhmm} AM` : hasPM ? `${hhmm} PM` : hhmm,
    };
  }

  if (hasAM) return { text: `${hhmm} ${amWord}`, dayCheckTime: `${hhmm} AM` };
  if (hasPM) return { text: `${hhmm} ${pmWord}`, dayCheckTime: `${hhmm} PM` };

  return { text: hhmm, dayCheckTime: hhmm };
}

// Helper function to determine if a time string belongs to today or tomorrow
// Returns true if the time is today, false if it's tomorrow
function isTimeInCurrentDay(timeStr, { amToken, pmToken } = {}) {
  // Parse the numeric time first
  const timeMatch = timeStr?.match(/(\d{1,2}):(\d{2})/);
  
  if (!timeMatch) {
    return true; // Default to today if can't parse
  }
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const normalized = (timeStr || "").toLowerCase();
  const amNorm = (amToken || "").toLowerCase();
  const pmNorm = (pmToken || "").toLowerCase();
  const hasEnglishAM = /\bam\b/i.test(timeStr || "");
  const hasEnglishPM = /\bpm\b/i.test(timeStr || "");
  const hasLocalAM = !!amNorm && normalized.includes(amNorm);
  const hasLocalPM = !!pmNorm && normalized.includes(pmNorm);
  const isAM = hasEnglishAM || hasLocalAM;
  const isPM = hasEnglishPM || hasLocalPM;
  const period = isPM ? "PM" : "AM";
  
  // Convert to 24-hour format
  if (period === "AM") {
    if (hours === 12) {
      hours = 0; // 12 AM is midnight
    }
  } else {
    // PM
    if (hours !== 12) {
      hours += 12; // Convert PM hours to 24-hour
    }
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // If the time is AM, it may refer to tomorrow in Panchang format.
  // For unrecognized markers, keep previous behavior (treat as today).
  if (isAM || (!isPM && hours < 12)) {
    // If AM time has already passed today (current time is later), it belongs to tomorrow
    if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
      return false; // Tomorrow
    }
    return true; // Today
  }
  
  // PM times are always today
  return true;
}


// 🔔 Generic Muhurta Alert - 1 hour before (Different wording for auspicious vs inauspicious)
export function getMuhurtaAlert({ language, names, timings, isAuspicious = false }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  // names and timings are arrays now to support multiple simultaneous muhurtas
  const nameList = Array.isArray(names) ? names : [names];
  const timingList = Array.isArray(timings) ? timings : [timings];
  
  // Get "and" word in each language
  const andWord = {
    en: "and",
    te: "మరియు",
    hi: "और",
    kn: "ಮತ್ತು",
    ta: "மற்றும்",
    ml: "ഒപ്പம்"
  };

  const and = andWord[resolvedLanguage] || andWord.en;
  
  // Join names with "and"
  const combinedNames = nameList.length > 1 
    ? nameList.slice(0, -1).join(", ") + " " + and + " " + nameList[nameList.length - 1]
    : nameList[0];

  // For timings, use the first one (they're usually the same or very close)
  const timing = timingList[0];
  const { start, end } = splitSpeechTimeRange(timing);
  const normalizedStart = normalizeSpeechTimeText({ language: resolvedLanguage, timeText: start });
  const normalizedEnd = normalizeSpeechTimeText({ language: resolvedLanguage, timeText: end });

  switch (resolvedLanguage) {
    case "te":
      if (isAuspicious) {
        return `
గమనిక! ఒక గంటలో ${combinedNames} ఉంది.
${normalizedStart} నుండి ${normalizedEnd} వరకు.
`;
      }
      return `
హెచ్చరిక! ఒక గంటలో ${combinedNames} ఘడియలు ప్రారంభం అవుతాయి.
${normalizedStart} నుండి ${normalizedEnd} వరకు.
`;
      
    case "hi":
      if (isAuspicious) {
        return `
सूचना! एक घंटे में ${combinedNames} है।
समय ${normalizedStart} से ${normalizedEnd} तक है।
`;
      }
      return `
सावधान! एक घंटे में ${combinedNames} है।
समय ${normalizedStart} से ${normalizedEnd} तक है।
`;
      
    case "kn":
      if (isAuspicious) {
        return `
ಗಮನಿಸಿ! ಒಂದು ಗಂಟೆಯಲ್ಲಿ ${combinedNames} ಇದೆ.
${normalizedStart} ರಿಂದ ${normalizedEnd} ವರೆಗೆ.
`;
      }
      return `
ಎಚ್ಚರಿಕೆ! ಒಂದು ಗಂಟೆಯಲ್ಲಿ ${combinedNames} ಇದೆ.
ಸಮಯ ${normalizedStart} ರಿಂದ ${normalizedEnd} ವರೆಗೆ.
`;
      
    case "ta":
      if (isAuspicious) {
        return `
கவனிக்க! ஒரு மணி நேரத்தில் ${combinedNames} உள்ளது.
நேரம் ${normalizedStart} முதல் ${normalizedEnd} வரை.
`;
      }
      return `
எச்சரிக்கை! ஒரு மணி நேரத்தில் ${combinedNames} உள்ளது.
நேரம் ${normalizedStart} முதல் ${normalizedEnd} வரை.
`;
      
    case "ml":
      if (isAuspicious) {
        return `
ശ്രദ്ധിക്കുക! ഒരു മണിക്കൂറിൽ ${combinedNames} ഉണ്ട്.
സമയം ${normalizedStart} മുതൽ ${normalizedEnd} വരೆ.
`;
      }
      return `
മുന്നറിയിപ്പ്! ഒരു മണിക്കൂറിൽ ${combinedNames} ഉണ്ട്.
സമയം ${normalizedStart} മുത೽ ${normalizedEnd} വരೆ.
`;
      
    case "en":
    default:
      if (isAuspicious) {
        return `
Reminder! In one hour there is ${combinedNames}.
The timing is from ${normalizedStart} to ${normalizedEnd}.
`;
      }
      return `
Alert! In one hour there is ${combinedNames}.
The timing is from ${normalizedStart} to ${normalizedEnd}.
`;
  }
}

// 🔔 Immediate Muhurta Alert - within 1 hour
export function getMuhurtaImmediateAlert({ language, names, timings, minutesLeft, isAuspicious = false }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const nameList = Array.isArray(names) ? names : [names];
  const timingList = Array.isArray(timings) ? timings : [timings];
  
  const andWord = {
    en: "and",
    te: "మరియు",
    hi: "और",
    kn: "ಮತ್ತು",
    ta: "மற்றும்",
    ml: "ഒപ്പம்"
  };

  const and = andWord[resolvedLanguage] || andWord.en;
  
  const combinedNames = nameList.length > 1 
    ? nameList.slice(0, -1).join(", ") + " " + and + " " + nameList[nameList.length - 1]
    : nameList[0];

  const timing = timingList[0];
  const { start, end } = splitSpeechTimeRange(timing);
  const normalizedStart = normalizeSpeechTimeText({ language: resolvedLanguage, timeText: start });
  const normalizedEnd = normalizeSpeechTimeText({ language: resolvedLanguage, timeText: end });

  switch (resolvedLanguage) {
    case "te":
      if (isAuspicious) {
        return `
గమనిక! ${minutesLeft} నిమిషాల్లో ${combinedNames} ప్రారంభమవుతుంది.
${normalizedStart} నుండి ${normalizedEnd} వరకు.
`;
      }
      return `
హెచ్చరిక! ${minutesLeft} నిమిషాల్లో ${combinedNames} ప్రారంభమవుతుంది.
${normalizedStart} నుండి ${normalizedEnd} వరకు.
`;
      
    case "hi":
      if (isAuspicious) {
        return `
सूचना! ${minutesLeft} मिनट में ${combinedNames} शुरू होगा।
समय ${normalizedStart} से ${normalizedEnd} तक है।
`;
      }
      return `
सावधान! ${minutesLeft} मिनट में ${combinedNames} शुरू होगा।
समय ${normalizedStart} से ${normalizedEnd} तक है।
`;
      
    case "kn":
      if (isAuspicious) {
        return `
ಗಮನಿಸಿ! ${minutesLeft} ನಿಮಿಷಗಳಲ್ಲಿ ${combinedNames} ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.
ಸಮಯ ${normalizedStart} ರಿಂದ ${normalizedEnd} ವರೆಗೆ.
`;
      }
      return `
ಎಚ್ಚರಿಕೆ! ${minutesLeft} ನಿಮಿಷಗಳಲ್ಲಿ ${combinedNames} ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.
ಸಮಯ ${normalizedStart} ರಿಂದ ${normalizedEnd} ವರೆಗೆ.
`;
      
    case "ta":
      if (isAuspicious) {
        return `
கவனிக்க! ${minutesLeft} நிமிடங்களில் ${combinedNames} தொடங்கும்.
நேரம் ${normalizedStart} முதல் ${normalizedEnd} வரை.
`;
      }
      return `
எச்சரிக்கை! ${minutesLeft} நிமிடங்களில் ${combinedNames} தொடங்கும்.
நேரம் ${normalizedStart} முதல் ${normalizedEnd} வரை.
`;
      
    case "ml":
      if (isAuspicious) {
        return `
ശ്രദ്ധിക്കുക! ${minutesLeft} മിനിറ്റിൽ ${combinedNames} ആരംഭിക്കും.
സമയം ${normalizedStart} മുത೽ ${normalizedEnd} വരೆ.
`;
      }
      return `
മുന്നറിയിപ്പ്! ${minutesLeft} മിനിറ്റിൽ ${combinedNames} ആരംഭിക്കും.
സമയം ${normalizedStart} മುತ೽ ${normalizedEnd} വരೆ.
`;
      
    case "en":
    default:
      if (isAuspicious) {
        return `
Reminder! ${combinedNames} will start in ${minutesLeft} minutes.
The timing is from ${normalizedStart} to ${normalizedEnd}.
`;
      }
      return `
Alert! ${combinedNames} will start in ${minutesLeft} minutes.
The timing is from ${normalizedStart} to ${normalizedEnd}.
`;
  }
}

// Helper to get localized muhurta names
export function getMuhurtaName(key, language) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const names = {
    "Rahu Kalam": {
      en: "Rahu Kalam",
      te: "రాహుకాలం",
      hi: "राहुकाल",
      kn: "ರಾಹುಕಾಲ",
      ta: "ராகு காலம்",
      ml: "രാഹുകാലം"
    },
    "Yamaganda": {
      en: "Yamaganda",
      te: "యమగండం",
      hi: "यमगंड",
      kn: "ಯಮಗಂಡ",
      ta: "யமகண்டம்",
      ml: "യമഗണ്ಡം"
    },
    "Gulikai Kalam": {
      en: "Gulikai Kalam",
      te: "గుళిక కాలం",
      hi: "गुलिकाई काल",
      kn: "ಗುಳಿಕೈ ಕಾಲ",
      ta: "குலிகை காலம்",
      ml: "ഗുളിക ಕಾಲಂ"
    },
    "Dur Muhurtam": {
      en: "Durmuhurtham",
      te: "దుర్ముహూర్తం",
      hi: "दुर्मुहूर्त",
      kn: "ದುರ್ಮುಹೂರ್ತ",
      ta: "துர்முஹூர்த்தம்",
      ml: "ദുർമுஹூர்த்தം"
    },
    "Abhijit": {
      en: "Abhijit",
      te: "అభిజిత్",
      hi: "अभिजित",
      kn: "ಅಭಿಜಿತ್",
      ta: "அபிஜித்",
      ml: "അഭിജിത്"
    },
    "Amrit Kalam": {
      en: "Amrit Kalam",
      te: "అమృత కాలం",
      hi: "अमृत काल",
      kn: "ಅಮೃತ ಕಾಲ",
      ta: "அம்ருத காலம்",
      ml: "അമೃತ ಕಾಲಂ"
    },
    "Varjyam": {
      en: "Varjyam",
      te: "వర్జ్యం",
      hi: "वर्ज्यम्",
      kn: "ವರ್ಜ್ಯಂ",
      ta: "வர்ஜ்யம்",
      ml: "വർജ്യം"
    }
  };

  return names[key]?.[resolvedLanguage] || names[key]?.en || key;
}

// Helper to check if muhurta is auspicious
export function isAuspiciousMuhurta(key) {
  return key === "Abhijit" || key === "Amrit Kalam";
}

// Get speech for date selection (Tithi, Paksha, Year name)
function buildFestivalSpeech({ language, festivals }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  const list = (festivals || []).filter(Boolean);
  if (list.length === 0) return "";

  const joined = list.join(", ");
  const isSingle = list.length === 1;

  switch (resolvedLanguage) {
    case "te":
      return isSingle ? `, పండుగ ${joined}` : `, పండుగలు ${joined}`;
    case "hi":
      return isSingle ? `, त्योहार ${joined}` : `, त्योहार ${joined}`;
    case "kn":
      return isSingle ? `, ಹಬ್ಬ ${joined}` : `, ಹಬ್ಬಗಳು ${joined}`;
    case "ta":
      return isSingle ? `, திருவிழா ${joined}` : `, திருவிழாக்கள் ${joined}`;
    case "ml":
      return isSingle ? `, ഉത്സവം ${joined}` : `, ഉത്സവങ്ങൾ ${joined}`;
    case "en":
    default:
      return isSingle ? `, Festival is ${joined}` : `, Festivals are ${joined}`;
  }
}

export function getDateSelectionSpeech({ language, day, month, tithi, paksha, yearName, festivals = [] }) {
  const resolvedLanguage = resolveSpeechLanguage(language);
  // Extract just the year name from Shaka Samvat if present
  const year = yearName ? yearName.trim().split(/\s+/).slice(1).join(" ") : "";
  const monthName = month || "";
  const dayNum = day || "";
  const festivalPart = buildFestivalSpeech({ language: resolvedLanguage, festivals });

  switch (resolvedLanguage) {
    case "te":
      return year
        ? `${monthName} ${dayNum} తేదీ, తిథి ${tithi}, పక్షం ${paksha}, సంవత్సరం ${year}${festivalPart}`
        : `${monthName} ${dayNum} తేదీ, తిథి ${tithi}, పక్షం ${paksha}${festivalPart}`;
    case "hi":
      return year
        ? `${monthName} ${day} तारीख को, तिथि ${tithi}, पक्ष ${paksha}, वर्ष ${year}${festivalPart}`
        : `${monthName} ${day} तारीख को, तिथि ${tithi}, पक्ष ${paksha}${festivalPart}`;
    case "kn":
      return year
        ? `${monthName} ${dayNum} ದಿನ, ತಿಥಿ ${tithi}, ಪಕ್ಷ ${paksha}, ವರ್ಷ ${year}${festivalPart}`
        : `${monthName} ${dayNum} ದಿನ, ತಿಥಿ ${tithi}, ಪಕ್ಷ ${paksha}${festivalPart}`;
    case "ta":
      return year
        ? `${monthName} ${dayNum} நாள், திதி ${tithi}, பக்ஷம் ${paksha}, ஆண்டு ${year}${festivalPart}`
        : `${monthName} ${dayNum} நாள், திதி ${tithi}, பக்ஷம் ${paksha}${festivalPart}`;
    case "ml":
      return year
        ? `${monthName} ${dayNum} ദിവസം, തിഥി ${tithi}, പക്ഷം ${paksha}, വർഷം ${year}${festivalPart}`
        : `${monthName} ${dayNum} ദിവസം, തിഥി ${tithi}, പക്ഷം ${paksha}${festivalPart}`;
    case "en":
    default:
      return year
        ? `On ${monthName} ${dayNum}, Tithi is ${tithi}, Paksha is ${paksha}, Year is ${year}${festivalPart}`
        : `On ${monthName} ${dayNum}, Tithi is ${tithi}, Paksha is ${paksha}${festivalPart}`;
  }
}


