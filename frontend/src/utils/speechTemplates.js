export function getSpeechText({
  language,
  isToday,
  dateText,
  tithi,
  nakshatra,
  rahu,
  yama,
}) {
  switch (language) {
    // 🌍 ENGLISH
    case "en":
      return isToday
        ? `
Today's Panchang details are as follows.
Today's Tithi is ${tithi}.
Today's Nakshatra is ${nakshatra}.
Rahu Kalam timings are ${rahu}.
Yamaganda timings are ${yama}.
`
        : `
On ${dateText}, the Panchang details are as follows.
Tithi is ${tithi}.
Nakshatra is ${nakshatra}.
Rahu Kalam timings are ${rahu}.
Yamaganda timings are ${yama}.
`;

    // 🌍 TELUGU
    case "te":
      return isToday
        ? `
ఈ రోజు పంచాంగ వివరాలు ఈ విధంగా ఉన్నాయి.
ఈ రోజు తిథి ${tithi}.
ఈ రోజు నక్షత్రం ${nakshatra}.
రాహుకాలం సమయం ${rahu}.
యమగండం సమయం ${yama}.
`
        : `
${dateText} నాటి పంచాంగ వివరాలు ఈ విధంగా ఉన్నాయి.
తిథి ${tithi}.
నక్షత్రం ${nakshatra}.
రాహుకాలం సమయం ${rahu}.
యమగండం సమయం ${yama}.
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
നക്ഷത്രം ${nakshatra}.
രാഹുകാലം ${rahu}.
യമഗണ്ഡം ${yama}.
`;

    default:
      return "";
  }
}

export function getDateClickSpeech({ language, tithi, amrit }) {
  const amritPart =
    amrit && amrit !== "-" ? ` ${amrit} ` : ""; // allows missing Amrit Kalam

  switch (language) {
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
export function getTithiSpeech({ language, tithi }) {
  switch (language) {
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

// 🔔 Generic Muhurta Alert - 1 hour before (Different wording for auspicious vs inauspicious)
export function getMuhurtaAlert({ language, names, timings, isAuspicious = false }) {
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
    ml: "ഒപ്പം"
  };

  const and = andWord[language] || andWord.en;
  
  // Join names with "and"
  const combinedNames = nameList.length > 1 
    ? nameList.slice(0, -1).join(", ") + " " + and + " " + nameList[nameList.length - 1]
    : nameList[0];

  // For timings, use the first one (they're usually the same or very close)
  const timing = timingList[0];
  const times = timing.split(" to ");
  const start = times[0]?.trim() || "";
  const end = times[1]?.trim() || "";

  switch (language) {
    case "te":
      if (isAuspicious) {
        return `
గమనిక! ఒక గంటలో ${combinedNames} ఉంది.
సమయం ${start} నుండి ${end} వరకు.
`;
      }
      return `
హెచ్చరిక! ఒక గంటలో ${combinedNames} ఘడియలు ప్రారంభం అవుతాయి.
సమయం ${start} నుండి ${end} వరకు.
`;
    
    case "hi":
      if (isAuspicious) {
        return `
सूचना! एक घंटे में ${combinedNames} है।
समय ${start} से ${end} तक है।
`;
      }
      return `
सावधान! एक घंटे में ${combinedNames} है।
समय ${start} से ${end} तक है।
`;
    
    case "kn":
      if (isAuspicious) {
        return `
ಗಮನಿಸಿ! ಒಂದು ಗಂಟೆಯಲ್ಲಿ ${combinedNames} ಇದೆ.
ಸಮಯ ${start} ರಿಂದ ${end} ವರೆಗೆ.
`;
      }
      return `
ಎಚ್ಚರಿಕೆ! ಒಂದು ಗಂಟೆಯಲ್ಲಿ ${combinedNames} ಇದೆ.
ಸಮಯ ${start} ರಿಂದ ${end} ವರೆಗೆ.
`;
    
    case "ta":
      if (isAuspicious) {
        return `
கவனிக்க! ஒரு மணி நேரத்தில் ${combinedNames} உள்ளது.
நேரம் ${start} முதல் ${end} வரை.
`;
      }
      return `
எச்சரிக்கை! ஒரு மணி நேரத்தில் ${combinedNames} உள்ளது.
நேரம் ${start} முதல் ${end} வரை.
`;
    
    case "ml":
      if (isAuspicious) {
        return `
ശ്രദ്ധിക്കുക! ഒരു മണിക്കൂറിൽ ${combinedNames} ഉണ്ട്.
സമയം ${start} മുതൽ ${end} വരെ.
`;
      }
      return `
മുന്നറിയിപ്പ്! ഒരു മണിക്കൂറിൽ ${combinedNames} ഉണ്ട്.
സമയം ${start} മുതൽ ${end} വരെ.
`;
    
    case "en":
    default:
      if (isAuspicious) {
        return `
Reminder! In one hour there is ${combinedNames}.
The timing is from ${start} to ${end}.
`;
      }
      return `
Alert! In one hour there is ${combinedNames}.
The timing is from ${start} to ${end}.
`;
  }
}

// 🔔 Immediate Muhurta Alert - within 1 hour
export function getMuhurtaImmediateAlert({ language, names, timings, minutesLeft, isAuspicious = false }) {
  const nameList = Array.isArray(names) ? names : [names];
  const timingList = Array.isArray(timings) ? timings : [timings];
  
  const andWord = {
    en: "and",
    te: "మరియు",
    hi: "और",
    kn: "ಮತ್ತು",
    ta: "மற்றும்",
    ml: "ഒപ്പം"
  };

  const and = andWord[language] || andWord.en;
  
  const combinedNames = nameList.length > 1 
    ? nameList.slice(0, -1).join(", ") + " " + and + " " + nameList[nameList.length - 1]
    : nameList[0];

  const timing = timingList[0];
  const times = timing.split(" to ");
  const start = times[0]?.trim() || "";
  const end = times[1]?.trim() || "";

  switch (language) {
    case "te":
      if (isAuspicious) {
        return `
గమనిక! ${minutesLeft} నిమిషాల్లో ${combinedNames} ప్రారంభమవుతుంది.
సమయం ${start} నుండి ${end} వరకు.
`;
      }
      return `
హెచ్చరిక! ${minutesLeft} నిమిషాల్లో ${combinedNames} ప్రారంభమవుతుంది.
సమయం ${start} నుండి ${end} వరకు.
`;
    
    case "hi":
      if (isAuspicious) {
        return `
सूचना! ${minutesLeft} मिनट में ${combinedNames} शुरू होगा।
समय ${start} से ${end} तक है।
`;
      }
      return `
सावधान! ${minutesLeft} मिनट में ${combinedNames} शुरू होगा।
समय ${start} से ${end} तक है।
`;
    
    case "kn":
      if (isAuspicious) {
        return `
ಗಮನಿಸಿ! ${minutesLeft} ನಿಮಿಷಗಳಲ್ಲಿ ${combinedNames} ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.
ಸಮಯ ${start} ರಿಂದ ${end} ವರೆಗೆ.
`;
      }
      return `
ಎಚ್ಚರಿಕೆ! ${minutesLeft} ನಿಮಿಷಗಳಲ್ಲಿ ${combinedNames} ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.
ಸಮಯ ${start} ರಿಂದ ${end} ವರೆಗೆ.
`;
    
    case "ta":
      if (isAuspicious) {
        return `
கவனிக்க! ${minutesLeft} நிமிடங்களில் ${combinedNames} தொடங்கும்.
நேரம் ${start} முதல் ${end} வரை.
`;
      }
      return `
எச்சரிக்கை! ${minutesLeft} நிமிடங்களில் ${combinedNames} தொடங்கும்.
நேரம் ${start} முதல் ${end} வரை.
`;
    
    case "ml":
      if (isAuspicious) {
        return `
ശ്രദ്ധിക്കുക! ${minutesLeft} മിനിറ്റിൽ ${combinedNames} ആരംഭിക്കും.
സമയം ${start} മുതൽ ${end} വരെ.
`;
      }
      return `
മുന്നറിയിപ്പ്! ${minutesLeft} മിനിറ്റിൽ ${combinedNames} ആരംഭിക്കും.
സമയം ${start} മുതൽ ${end} വരെ.
`;
    
    case "en":
    default:
      if (isAuspicious) {
        return `
Reminder! ${combinedNames} will start in ${minutesLeft} minutes.
The timing is from ${start} to ${end}.
`;
      }
      return `
Alert! ${combinedNames} will start in ${minutesLeft} minutes.
The timing is from ${start} to ${end}.
`;
  }
}

// Helper to get localized muhurta names
export function getMuhurtaName(key, language) {
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
      ml: "യമഗണ്ഡം"
    },
    "Gulikai Kalam": {
      en: "Gulikai Kalam",
      te: "గుళిక కాలం",
      hi: "गुलिकाई काल",
      kn: "ಗುಳಿಕೈ ಕಾಲ",
      ta: "குலிகை காலம்",
      ml: "ഗുളിക കാലം"
    },
    "Dur Muhurtam": {
      en: "Durmuhurtham",
      te: "దుర్ముహూర్తం",
      hi: "दुर्मुहूर्त",
      kn: "ದುರ್ಮುಹೂರ್ತ",
      ta: "துர்முஹூர்த்தம்",
      ml: "ദുർമുഹൂർത്തം"
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
      ml: "അമൃത കാലം"
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

  return names[key]?.[language] || names[key]?.en || key;
}

// Helper to check if muhurta is auspicious
export function isAuspiciousMuhurta(key) {
  return key === "Abhijit" || key === "Amrit Kalam";
}

// Get speech for date selection (Tithi, Paksha, Year name)
export function getDateSelectionSpeech({ language, tithi, paksha, yearName }) {
  // Extract just the year name from Shaka Samvat if present
  const year = yearName ? yearName.trim().split(/\s+/).slice(1).join(" ") : "";

  switch (language) {
    case "te":
      return year
        ? `${tithi} ${paksha} ${year}`
        : `${tithi} ${paksha}`;
    case "hi":
      return year
        ? `${tithi} ${paksha} ${year}`
        : `${tithi} ${paksha}`;
    case "kn":
      return year
        ? `${tithi} ${paksha} ${year}`
        : `${tithi} ${paksha}`;
    case "ta":
      return year
        ? `${tithi} ${paksha} ${year}`
        : `${tithi} ${paksha}`;
    case "ml":
      return year
        ? `${tithi} ${paksha} ${year}`
        : `${tithi} ${paksha}`;
    case "en":
    default:
      return year
        ? `${tithi} ${paksha} ${year}`
        : `${tithi} ${paksha}`;
  }
}
