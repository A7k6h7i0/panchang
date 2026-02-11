import express from "express";

const router = express.Router();

const MISSING_INFO =
  "This information is currently unavailable in the Panchang data.";
const ONLY_PANCHANG =
  "I can answer only Panchang-related questions. Please ask about tithi, nakshatra, yogam, karanam, auspicious or inauspicious timings, or whether the day is good for starting new work.";

// ========== FETCH FESTIVAL DATA ==========

const fetchFestivalData = async (year) => {
  try {
    const response = await fetch(`${process.cwd()}/frontend/public/data/festivals/${year}.json`);
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    console.error("Error fetching festival data:", error);
    return {};
  }
};

// ========== HELPER FUNCTIONS ==========

const containsWord = (text, word) =>
  new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);

const normalizeCompact = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const containsAny = (text, checks) =>
  checks.some((check) =>
    check instanceof RegExp ? check.test(text) : containsWord(text, check)
  );

const readField = (data, keys) => {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (
        trimmed &&
        trimmed !== "-" &&
        trimmed.toLowerCase() !== "not available"
      ) {
        return trimmed;
      }
    }
  }
  return null;
};

const parseSlashDate = (dateText) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(dateText || "").trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const formatDateLabel = (dateText, weekdayText) => {
  if (!dateText) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(dateText).trim());
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  return weekdayText
    ? `${weekdayText}, ${day}-${month}`
    : `${day}-${month}`;
};

const levenshtein = (a, b) => {
  const s = String(a || "");
  const t = String(b || "");
  const dp = Array.from({ length: s.length + 1 }, () =>
    new Array(t.length + 1).fill(0)
  );
  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[s.length][t.length];
};

const getMonthFestivalEntries = async (calendarData, year) => {
  const rows = Array.isArray(calendarData) ? calendarData.filter(Boolean) : [];
  
  // Fetch festival data from the festivals file
  const festivalData = await fetchFestivalData(year);
  
  const entries = [];
  
  for (const day of rows) {
    const [dayPart, monthPart] = (day?.date || "").split("/");
    if (!dayPart || !monthPart) continue;
    
    // Create date key for festival lookup
    const dateKey = `${year}-${monthPart}-${dayPart}`;
    const dayFestivals = festivalData[dateKey] || [];
    
    if (!dayFestivals.length) continue;
    
    const label = formatDateLabel(day?.date, day?.Weekday);
    for (const name of dayFestivals) {
      if (typeof name !== "string" || !name.trim()) continue;
      entries.push({ festival: name.trim(), dateLabel: label, dateObj: parseSlashDate(day?.date) });
    }
  }
  return entries;
};

// ========== DATE REFERENCE ==========

const getReferenceDate = (selectedDay) => {
  const selected = parseSlashDate(selectedDay?.date);
  if (selected) return selected;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const getTargetDate = (referenceDate, message) => {
  const lowerMsg = message.toLowerCase();
  
  // Tomorrow
  if (lowerMsg.includes("tomorrow") || lowerMsg.includes("next day")) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: tomorrow, label: "tomorrow" };
  }
  
  // Today
  if (lowerMsg.includes("today") || lowerMsg.includes("current") || lowerMsg.includes("now")) {
    return { date: referenceDate, label: "today" };
  }
  
  // Yesterday
  if (lowerMsg.includes("yesterday")) {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return { date: yesterday, label: "yesterday" };
  }
  
  // Next week
  if (lowerMsg.includes("next week")) {
    const nextWeek = new Date(referenceDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return { date: nextWeek, label: "next week" };
  }
  
  // Default to today
  return { date: referenceDate, label: "today" };
};

const findDayData = (calendarData, targetDate) => {
  const calendarArray = Array.isArray(calendarData) ? calendarData.filter(Boolean) : [];
  for (const day of calendarArray) {
    const dateObj = parseSlashDate(day?.date);
    if (dateObj && dateObj.getTime() === targetDate.getTime()) {
      return day;
    }
  }
  return null;
};

// ========== TITHI MATCHING ==========

const TITHI_PATTERNS = [
  // Shukla Paksha
  { patterns: [/prathama/i, /padya/i, /first/i, /padyami/i], paksha: "Shukla Paksha", name: "Prathama" },
  { patterns: [/dvitiya/i, /dwithiya/i, /dwitiya/i, /second/i], paksha: "Shukla Paksha", name: "Dvitiya" },
  { patterns: [/tritiya/i, /trithiya/i, /third/i, /tadive/i], paksha: "Shukla Paksha", name: "Tritiya" },
  { patterns: [/chaturthi/i, /chavithi/i, /fourth/i, /chaturt/i], paksha: "Shukla Paksha", name: "Chaturthi" },
  { patterns: [/panchami/i, /panchami/i, /fifth/i, /panch/i], paksha: "Shukla Paksha", name: "Panchami" },
  { patterns: [/shashthi/i, /shashti/i, /sixth/i, /sashti/i], paksha: "Shukla Paksha", name: "Shashthi" },
  { patterns: [/saptami/i, /sapthami/i, /seventh/i, /sapt/i], paksha: "Shukla Paksha", name: "Saptami" },
  { patterns: [/ashtami/i, /ashtami/i, /eighth/i, /ashta/i], paksha: "Shukla Paksha", name: "Ashtami" },
  { patterns: [/navami/i, /navami/i, /ninth/i, /nava/i], paksha: "Shukla Paksha", name: "Navami" },
  { patterns: [/dashami/i, /dasami/i, /tenth/i, /dasha/i], paksha: "Shukla Paksha", name: "Dashami" },
  { patterns: [/ekadashi/i, /ekadasi/i, /ekaadashi/i, /ekadashi/i], paksha: null, name: "Ekadashi" },
  { patterns: [/dwadashi/i, /dwadasi/i, /twelfth/i, /dwa/i], paksha: "Shukla Paksha", name: "Dwadashi" },
  { patterns: [/trayodashi/i, /trayodasi/i, /thirteenth/i, /traya/i], paksha: "Shukla Paksha", name: "Trayodashi" },
  { patterns: [/chaturdashi/i, /chaturdasi/i, /fourteenth/i, /chat/i], paksha: "Shukla Paksha", name: "Chaturdashi" },
  { patterns: [/purnima/i, /poornima/i, /full moon/i, /pournima/i], paksha: null, name: "Purnima" },
  // Krishna Paksha
  { patterns: [/krishna.*prathama/i, /krishna.*padya/i], paksha: "Krishna Paksha", name: "Prathama" },
  { patterns: [/krishna.*dvitiya/i, /krishna.*dwithiya/i], paksha: "Krishna Paksha", name: "Dvitiya" },
  { patterns: [/krishna.*tritiya/i, /krishna.*trithiya/i], paksha: "Krishna Paksha", name: "Tritiya" },
  { patterns: [/krishna.*chaturthi/i, /krishna.*chavithi/i], paksha: "Krishna Paksha", name: "Chaturthi" },
  { patterns: [/krishna.*panchami/i], paksha: "Krishna Paksha", name: "Panchami" },
  { patterns: [/krishna.*shashthi/i, /krishna.*shashti/i], paksha: "Krishna Paksha", name: "Shashthi" },
  { patterns: [/krishna.*saptami/i, /krishna.*sapthami/i], paksha: "Krishna Paksha", name: "Saptami" },
  { patterns: [/krishna.*ashtami/i], paksha: "Krishna Paksha", name: "Ashtami" },
  { patterns: [/krishna.*navami/i], paksha: "Krishna Paksha", name: "Navami" },
  { patterns: [/krishna.*dashami/i, /krishna.*dasami/i], paksha: "Krishna Paksha", name: "Dashami" },
  { patterns: [/krishna.*ekadashi/i, /krishna.*ekadasi/i], paksha: "Krishna Paksha", name: "Ekadashi" },
  { patterns: [/krishna.*dwadashi/i, /krishna.*dwadasi/i], paksha: "Krishna Paksha", name: "Dwadashi" },
  { patterns: [/krishna.*trayodashi/i, /krishna.*trayodasi/i], paksha: "Krishna Paksha", name: "Trayodashi" },
  { patterns: [/krishna.*chaturdashi/i, /krishna.*chaturdasi/i], paksha: "Krishna Paksha", name: "Chaturdashi" },
  { patterns: [/amavasya/i, /amavasya/i, /new moon/i, /amava/i], paksha: null, name: "Amavasya" },
];

const findTithiName = (query) => {
  for (const { patterns, name, paksha } of TITHI_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return { name, paksha };
      }
    }
  }
  return null;
};

const findNextTithiOccurrence = (calendarData, referenceDate, tithiInfo) => {
  const calendarArray = Array.isArray(calendarData) ? calendarData.filter(Boolean) : [];
  const results = [];
  
  for (const day of calendarArray) {
    const dateObj = parseSlashDate(day?.date);
    if (!dateObj || dateObj < referenceDate) continue;
    
    const dayTithi = readField(day, ["Tithi"]);
    if (!dayTithi) continue;
    
    const dayPaksha = readField(day, ["Paksha"]) || "";
    const normalizedTithi = normalizeCompact(dayTithi);
    
    // Check if this tithi matches
    let matches = false;
    if (tithiInfo.name === "Ekadashi" || tithiInfo.name === "Purnima" || tithiInfo.name === "Amavasya") {
      // These can be in either paksha
      if (normalizedTithi.includes(normalizeCompact(tithiInfo.name))) {
        matches = true;
      }
    } else if (tithiInfo.paksha) {
      // Match with specific paksha
      if (normalizedTithi.includes(normalizeCompact(tithiInfo.name)) &&
          (dayPaksha.toLowerCase().includes(tithiInfo.paksha.toLowerCase()) ||
           dayPaksha.toLowerCase().includes(tithiInfo.name.toLowerCase()))) {
        matches = true;
      }
    }
    
    if (matches) {
      results.push({
        day,
        dateObj,
        dateLabel: formatDateLabel(day?.date, day?.Weekday),
        tithi: dayTithi
      });
    }
  }
  
  if (results.length === 0) return null;
  results.sort((a, b) => a.dateObj - b.dateObj);
  return results[0];
};

// ========== FESTIVAL MATCHING ==========

const FESTIVAL_ALIASES = {
  // Shiva
  "Maha Shivarathri": [/maha.*shivarathri/i, /maha.*shivaratri/i, /shivarathri/i, /shivaratri/i, /shivratri/i, /shiv.*rathri/i, /mahashivratri/i, /maha.*shivratri/i],
  // Ganesha
  "Ganesh Chaturthi": [/ganesh.*chaturthi/i, /ganesh.*festival/i, /vinayaka.*chaturthi/i, /ganeshotsav/i],
  // Navratri
  "Navratri": [/navratri/i, /navaratri/i, /navarathri/i, /nine.*nights/i],
  // Dussehra
  "Dussehra": [/dussehra/i, /dasara/i, /vijayadashami/i, /dassera/i],
  // Diwali
  "Diwali": [/diwali/i, /deepavali/i, /deepavali/i, /divali/i, /festival.*lights/i],
  // Holi
  "Holi": [/holi/i, /holi.*festival/i, /phagwah/i],
  // Krishna Janmashtami
  "Janmashtami": [/janmashtami/i, /krishna.*janmashtami/i, /janmastami/i, /birth.*krishna/i],
  // Ram Navami
  "Ram Navami": [/ram.*navami/i, /rama.*navami/i, /birth.*rama/i],
  // Hanuman Jayanti
  "Hanuman Jayanti": [/hanuman.*jayanti/i, /hanuman.*festival/i],
  // Pongal
  "Pongal": [/pongal/i, /pongal.*festival/i, /thai.*pongal/i],
  // Onam
  "Onam": [/onam/i, /onam.*festival/i],
  // Vishu
  "Vishu": [/vishu/i, /vishu.*festival/i],
  // Guru Purnima
  "Guru Purnima": [/guru.*purnima/i, /guru.*purnima/i, /vyasa.*purnima/i],
  // Makar Sankranti
  "Makar Sankranti": [/makar.*sankranti/i, /sankranti/i, /uttarayan/i],
  // Baisakhi
  "Baisakhi": [/baisakhi/i, /vasakhi/i, /vaisakhi/i],
  // Rath Yatra
  "Rath Yatra": [/rath.*yatra/i, /jagannath.*yatra/i, /yatra/i],
};

const findFestivalName = (query) => {
  for (const [name, patterns] of Object.entries(FESTIVAL_ALIASES)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        return name;
      }
    }
  }
  return null;
};

const findNextFestival = (calendarData, referenceDate, festivalName) => {
  const calendarArray = Array.isArray(calendarData) ? calendarData.filter(Boolean) : [];
  const results = [];
  
  for (const day of calendarArray) {
    const dateObj = parseSlashDate(day?.date);
    if (!dateObj || dateObj < referenceDate) continue;
    
    const festivals = Array.isArray(day?.Festivals) ? day.Festivals : [];
    for (const fest of festivals) {
      const normalizedFest = normalizeCompact(fest);
      const normalizedQuery = normalizeCompact(festivalName);
      
      // Check for match
      if (normalizedFest.includes(normalizedQuery) || 
          normalizedQuery.includes(normalizedFest)) {
        results.push({
          festival: fest,
          dateObj,
          dateLabel: formatDateLabel(day?.date, day?.Weekday)
        });
      }
    }
  }
  
  if (results.length === 0) return null;
  results.sort((a, b) => a.dateObj - b.dateObj);
  return results[0];
};

const findFestivalInMonth = (calendarData, festivalName) => {
  const calendarArray = Array.isArray(calendarData) ? calendarData.filter(Boolean) : [];
  const results = [];
  
  for (const day of calendarArray) {
    const festivals = Array.isArray(day?.Festivals) ? day.Festivals : [];
    for (const fest of festivals) {
      const normalizedFest = normalizeCompact(fest);
      const normalizedQuery = normalizeCompact(festivalName);
      
      if (normalizedFest.includes(normalizedQuery) || 
          normalizedQuery.includes(normalizedFest)) {
        results.push({
          festival: fest,
          dateLabel: formatDateLabel(day?.date, day?.Weekday)
        });
      }
    }
  }
  
  return results;
};

// ========== GREETING PATTERNS ==========

const isGreeting = (msg) => {
  return /^(hello|hi|hey|namaste|vanakkam|good\s*morning|good\s*afternoon|good\s*evening|hari\s*om|om)\W*$/i.test(msg.trim());
};

// Check if message contains any panchang-related keywords
const isPanchangRelated = (msg) => {
  const msgLower = msg.toLowerCase();
  
  // Festival keywords
  const festivalKeywords = [
    "festival", "festivals", "utsav", "mahashivarathri", "shivarathri", "shivaratri", 
    "shivratri", "diwali", "deepavali", "holi", "navratri", "navaratri", 
    "dussehra", "dasara", "ganesh", "chaturthi", "janmashtami", "ram navami",
    "pongal", "onam", "vishu", "sankranti", "baisakhi", "rath yatra",
    "maha", "shivarathri", "mahadev", "shiva"
  ];
  
  if (festivalKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // Tithi keywords (all paksha and tithi names)
  const tithiKeywords = [
    "tithi", "prathama", "dvitiya", "tritiya", "chaturthi", "panchami", 
    "shashthi", "saptami", "ashtami", "navami", "dashami", "ekadashi", 
    "dwadashi", "trayodashi", "chaturdashi", "purnima", "amavasya",
    "shukla", "krishna", "paksha"
  ];
  
  if (tithiKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // Nakshatra keywords
  const nakshatraKeywords = [
    "nakshatra", "ashwini", "bharani", "krittika", "rohini", "mrigashirsha",
    "ardra", "punarvasu", "pushya", "ashlesha", "magha", "purva phalguni",
    "uttara", "phalguni", "hasta", "chitra", "swati", "vishakha",
    "anuradha", "jyeshtha", "mula", "purva ashadha", "uttara ashadha",
    "shravana", "dhanishta", "shatabhisha", "purva bhadrapada", "uttara bhadrapada",
    "revati"
  ];
  
  if (nakshatraKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // Yoga keywords
  const yogaKeywords = ["yoga", "yogam", "yog"];
  if (yogaKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // Karana keywords
  const karanaKeywords = ["karana", "karanam"];
  if (karanaKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // Muhurta/Timing keywords
  const muhurtaKeywords = [
    "sunrise", "sunset", "moonrise", "moonset",
    "muhurta", "muhurtam", "muhurtham", 
    "rahu", "rahukalam", "rahu kalam", 
    "yamaganda", "yamagandam", 
    "gulikai", "gulika", "gulikai kalam",
    "dur muhurtam", "durmuhurtham", "dur muhurtham",
    "varjyam", "abhijit", "abhijeet", "amrit", "amrith", "amrit kalam"
  ];
  
  if (muhurtaKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // General panchang keywords
  const generalKeywords = [
    "panchang", "hindu calendar", "panchangam", "panchangam",
    "auspicious", "inauspicious", "shubha", "ashubha", "good time", "bad time",
    "good day", "new work", "start work", "new beginning", "shukar vartham"
  ];
  
  if (generalKeywords.some(kw => msgLower.includes(kw))) return true;
  
  // Question patterns that indicate panchang queries
  const questionPatterns = [
    /when\s+(is|does|will)/i,  // "when is", "when does", "when will"
    /what\s+(is|was|will)/i,   // "what is", "what was", "what will"
    /which\s+day/i,            // "which day"
    /next\s+(tithi|festival|day)/i,  // "next tithi", "next festival"
    /upcoming/i,               // "upcoming"
    /tomorrow/i,               // "tomorrow"
    /today/i                   // "today"
  ];
  
  if (questionPatterns.some(p => p.test(msgLower))) return true;
  
  return false;
};

// ========== MAIN HANDLER ==========

const handleChatbot = async (req, res) => {
  try {
    const { message, selectedDay, calendarData } = req.body;
    const lowerMessage = String(message || "").toLowerCase().trim();
    
    if (!lowerMessage) {
      return res.json({ response: ONLY_PANCHANG });
    }

    // Greeting
    if (isGreeting(lowerMessage)) {
      return res.json({
        response: "Namaste! I am your Panchang assistant. You can ask me about:\n• Today's panchang details\n• Tithi, Nakshatra, Yoga, Karana\n• Festival dates (like Diwali, Maha Shivarathri, Navratri)\n• Muhurta timings (auspicious and inauspicious)\n• Good days for new beginnings\n\nWhat would you like to know?"
      });
    }

    // Only panchang questions
    if (!isPanchangRelated(lowerMessage)) {
      return res.json({ response: ONLY_PANCHANG });
    }

    // Get reference date
    const referenceDate = getReferenceDate(selectedDay);
    
    // ========== 1. SPECIFIC TITHI DATE QUERY ==========
    // "when is ekadashi", "next ekadashi", "when is Purnima", "when is Amavasya"
    const tithiQueryPatterns = [
      /when\s*(is|is\s*the|will|comes|occur)/i,
      /next/i,
      /upcoming/i,
      /date\s*(of|for)/i,
    ];
    const isTithiDateQuery = tithiQueryPatterns.some(p => p.test(lowerMessage)) &&
      (containsWord(lowerMessage, "tithi") || findTithiName(lowerMessage));
    
    if (isTithiDateQuery) {
      const tithiInfo = findTithiName(lowerMessage);
      if (tithiInfo) {
        const result = findNextTithiOccurrence(calendarData, referenceDate, tithiInfo);
        if (result) {
          return res.json({
            response: `${tithiInfo.name} occurs on ${result.dateLabel}.`
          });
        }
        return res.json({ response: MISSING_INFO });
      }
    }

    // ========== 1. DIRECT FESTIVAL NAME QUERY ==========
    // "maha shivarathri", "diwali", "shivarathri" - just the name without question
    const directFestivalName = findFestivalName(lowerMessage);
    if (directFestivalName) {
      const result = findNextFestival(calendarData, referenceDate, directFestivalName);
      if (result) {
        return res.json({
          response: `${result.festival} is observed on ${result.dateLabel}.`
        });
      }
      // Check if festival exists in calendar at all
      const festivalResults = findFestivalInMonth(calendarData, directFestivalName);
      if (festivalResults.length > 0) {
        const dates = festivalResults.map(r => r.dateLabel).join(", ");
        return res.json({
          response: `${directFestivalName} is observed on: ${dates}.`
        });
      }
      return res.json({ response: MISSING_INFO });
    }

    // ========== 2. SPECIFIC FESTIVAL DATE QUERY ==========
    // "when is Diwali", "Diwali date", "when is maha shivarathri", etc.
    const festivalName = findFestivalName(lowerMessage);
    const isFestivalDateQuery = 
      (containsWord(lowerMessage, "when") || containsWord(lowerMessage, "which") || 
       containsWord(lowerMessage, "what") || containsWord(lowerMessage, "date")) &&
      (containsWord(lowerMessage, "festival") || festivalName);
    
    if (isFestivalDateQuery) {
      // Use the found festival name or search for it
      const nameToFind = festivalName || findFestivalName(lowerMessage);
      if (nameToFind) {
        const result = findNextFestival(calendarData, referenceDate, nameToFind);
        if (result) {
          return res.json({
            response: `${result.festival} is observed on ${result.dateLabel}.`
          });
        }
        // Check if festival exists in calendar at all
        const festivalResults = findFestivalInMonth(calendarData, nameToFind);
        if (festivalResults.length > 0) {
          const dates = festivalResults.map(r => r.dateLabel).join(", ");
          return res.json({
            response: `${nameToFind} is observed on: ${dates}.`
          });
        }
      }
      return res.json({ response: MISSING_INFO });
    }

    // ========== 3. TOMORROW'S PANCHANG ==========
    if (lowerMessage.includes("tomorrow")) {
      const tomorrow = new Date(referenceDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowData = findDayData(calendarData, tomorrow);
      
      if (tomorrowData) {
        const tithi = readField(tomorrowData, ["Tithi"]) || MISSING_INFO;
        const nakshatra = readField(tomorrowData, ["Nakshatra"]) || MISSING_INFO;
        const yoga = readField(tomorrowData, ["Yoga", "Yogam"]) || MISSING_INFO;
        const paksha = readField(tomorrowData, ["Paksha"]) || "";
        const festivals = Array.isArray(tomorrowData.Festivals) ? tomorrowData.Festivals : [];
        
        let response = `Tomorrow's Panchang:\n`;
        response += `Tithi: ${tithi}\n`;
        response += `Nakshatra: ${nakshatra}\n`;
        response += `Yoga: ${yoga}\n`;
        if (paksha) response += `Paksha: ${paksha}\n`;
        if (festivals.length) response += `Festivals: ${festivals.join(", ")}\n`;
        
        return res.json({ response });
      }
      return res.json({ response: "Tomorrow's data is not available." });
    }

    // ========== 3. DIRECT TITHI NAME QUERY ==========
    // "ekadashi", "purnima", "amavasya" - just the tithi name without question
    const directTithiInfo = findTithiName(lowerMessage);
    const isDirectTithiQuery = directTithiInfo && 
      (containsWord(lowerMessage, "when") || containsWord(lowerMessage, "next") || 
       containsWord(lowerMessage, "upcoming") || !containsWord(lowerMessage, "today"));
    
    if (isDirectTithiQuery) {
      const result = findNextTithiOccurrence(calendarData, referenceDate, directTithiInfo);
      if (result) {
        return res.json({
          response: `${result.tithi} occurs on ${result.dateLabel}.`
        });
      }
      return res.json({ response: MISSING_INFO });
    }

    // ========== 4. TODAY'S SPECIFIC DETAIL ==========
    // "what is today's tithi", "today's nakshatra", etc.
    const currentData = selectedDay || {};
    
    if (containsWord(lowerMessage, "tithi") && !containsWord(lowerMessage, "tomorrow")) {
      const tithi = readField(currentData, ["Tithi"]);
      if (tithi) {
        return res.json({ response: `Today's tithi is ${tithi}.` });
      }
      return res.json({ response: MISSING_INFO });
    }
    
    if (containsWord(lowerMessage, "nakshatra")) {
      const nakshatra = readField(currentData, ["Nakshatra"]);
      if (nakshatra) {
        return res.json({ response: `Today's nakshatra is ${nakshatra}.` });
      }
      return res.json({ response: MISSING_INFO });
    }
    
    if (containsWord(lowerMessage, "yoga") || containsWord(lowerMessage, "yogam")) {
      const yoga = readField(currentData, ["Yoga", "Yogam"]);
      if (yoga) {
        return res.json({ response: `Today's yoga is ${yoga}.` });
      }
      return res.json({ response: MISSING_INFO });
    }
    
    if (containsWord(lowerMessage, "karana") || containsWord(lowerMessage, "karanam")) {
      const karana = readField(currentData, ["Karanam", "Karana"]);
      if (karana) {
        return res.json({ response: `Today's karana is ${karana}.` });
      }
      return res.json({ response: MISSING_INFO });
    }
    
    if (containsWord(lowerMessage, "paksha")) {
      const paksha = readField(currentData, ["Paksha"]);
      if (paksha) {
        return res.json({ response: `Current paksha is ${paksha}.` });
      }
      return res.json({ response: MISSING_INFO });
    }
    
    if (containsWord(lowerMessage, "festival") && !containsWord(lowerMessage, "when")) {
      const festivals = Array.isArray(currentData.Festivals) ? currentData.Festivals : [];
      if (festivals.length) {
        return res.json({ response: `Today's festivals: ${festivals.join(", ")}.` });
      }
      return res.json({ response: "No festivals today." });
    }

    // ========== 5. AUSPICIOUS TIMINGS ==========
    if (containsWord(lowerMessage, "auspicious") || containsWord(lowerMessage, "shubha") || 
        containsWord(lowerMessage, "good time") || containsWord(lowerMessage, "best time")) {
      const abhijit = readField(currentData, ["Abhijit"]);
      const amrit = readField(currentData, ["Amrit Kalam"]);
      
      let response = "Auspicious timings:\n";
      if (abhijit) response += `Abhijit: ${abhijit}\n`;
      if (amrit) response += `Amrit Kalam: ${amrit}`;
      if (!abhijit && !amrit) response = MISSING_INFO;
      
      return res.json({ response });
    }

    // ========== 6. INAUSPICIOUS TIMINGS ==========
    if (containsWord(lowerMessage, "inauspicious") || containsWord(lowerMessage, "ashubha") || 
        containsWord(lowerMessage, "bad time") || containsWord(lowerMessage, "rahu") ||
        containsWord(lowerMessage, "yamaganda") || containsWord(lowerMessage, "gulikai") ||
        containsWord(lowerMessage, "varjyam") || containsWord(lowerMessage, "dur muhurtam")) {
      
      const rahu = readField(currentData, ["Rahu Kalam", "Rahu"]);
      const yamaganda = readField(currentData, ["Yamaganda"]);
      const gulikai = readField(currentData, ["Gulikai Kalam"]);
      const durMuhurtam = readField(currentData, ["Dur Muhurtam"]);
      const varjyam = readField(currentData, ["Varjyam"]);
      
      let response = "Inauspicious timings:\n";
      if (rahu) response += `Rahu Kalam: ${rahu}\n`;
      if (yamaganda) response += `Yamaganda: ${yamaganda}\n`;
      if (gulikai) response += `Gulikai Kalam: ${gulikai}\n`;
      if (durMuhurtam) response += `Dur Muhurtam: ${durMuhurtam}\n`;
      if (varjyam) response += `Varjyam: ${varjyam}`;
      
      return res.json({ response: response.trim() || MISSING_INFO });
    }

    // ========== 7. GOOD DAY FOR NEW WORK ==========
    if (containsWord(lowerMessage, "good day") || containsWord(lowerMessage, "new work") ||
        containsWord(lowerMessage, "start work") || containsWord(lowerMessage, "new beginning") ||
        containsWord(lowerMessage, "auspicious day") || containsWord(lowerMessage, "shukar vartham")) {
      const tithi = readField(currentData, ["Tithi"]);
      const weekday = currentData?.Weekday || "";
      const dateLabel = formatDateLabel(currentData?.date, weekday);
      
      let quality = "";
      if (tithi) {
        const inauspicious = /(ashtami|navami|amavasya)/i.test(tithi);
        if (inauspicious) {
          quality = "The day is not good for starting new work. Traditional rule: Ashtami, Navami, and Amavasya are avoided.";
        } else {
          quality = "The day is generally good for starting new work, while still avoiding inauspicious timings.";
        }
      }
      
      let response = "";
      if (dateLabel) response += `Selected day: ${dateLabel}\n\n`;
      response += quality;
      
      return res.json({ response });
    }

    // ========== 8. ALL TIMINGS ==========
    if (containsWord(lowerMessage, "timing") || containsWord(lowerMessage, "muhurta") ||
        containsWord(lowerMessage, "muhurtam") || containsWord(lowerMessage, "muhurtham")) {
      const abhijit = readField(currentData, ["Abhijit"]);
      const amrit = readField(currentData, ["Amrit Kalam"]);
      const rahu = readField(currentData, ["Rahu Kalam", "Rahu"]);
      const yamaganda = readField(currentData, ["Yamaganda"]);
      const gulikai = readField(currentData, ["Gulikai Kalam"]);
      const durMuhurtam = readField(currentData, ["Dur Muhurtam"]);
      const varjyam = readField(currentData, ["Varjyam"]);
      
      let response = "Muhurta timings:\n\n";
      response += "Auspicious:\n";
      if (abhijit) response += `  Abhijit: ${abhijit}\n`;
      if (amrit) response += `  Amrit Kalam: ${amrit}\n`;
      
      response += "\nInauspicious:\n";
      if (rahu) response += `  Rahu Kalam: ${rahu}\n`;
      if (yamaganda) response += `  Yamaganda: ${yamaganda}\n`;
      if (gulikai) response += `  Gulikai Kalam: ${gulikai}\n`;
      if (durMuhurtam) response += `  Dur Muhurtam: ${durMuhurtam}\n`;
      if (varjyam) response += `  Varjyam: ${varjyam}`;
      
      return res.json({ response: response.trim() });
    }

    // ========== 9. FESTIVAL LIST ==========
    if (containsWord(lowerMessage, "festival") && (containsWord(lowerMessage, "list") || 
        containsWord(lowerMessage, "all") || containsWord(lowerMessage, "month"))) {
      const monthEntries = getMonthFestivalEntries(calendarData);
      if (monthEntries.length === 0) {
        return res.json({ response: "No festivals found in this month's data." });
      }
      
      const uniqueFestivals = [...new Set(monthEntries.map(e => `${e.festival} - ${e.dateLabel}`))];
      return res.json({
        response: `Festivals this month:\n\n${uniqueFestivals.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
      });
    }

    // ========== 10. FULL PANCHANG ==========
    if (containsWord(lowerMessage, "full") || containsWord(lowerMessage, "complete") ||
        containsWord(lowerMessage, "all") || containsWord(lowerMessage, "panchang details") ||
        containsWord(lowerMessage, "today panchang") || containsWord(lowerMessage, "show panchang")) {
      
      const tithi = readField(currentData, ["Tithi"]) || MISSING_INFO;
      const nakshatra = readField(currentData, ["Nakshatra"]) || MISSING_INFO;
      const yoga = readField(currentData, ["Yoga", "Yogam"]) || MISSING_INFO;
      const karanam = readField(currentData, ["Karanam", "Karana"]) || MISSING_INFO;
      const paksha = readField(currentData, ["Paksha"]) || "";
      const festivals = Array.isArray(currentData.Festivals) ? currentData.Festivals : [];
      const sunrise = readField(currentData, ["Sunrise"]);
      const sunset = readField(currentData, ["Sunset"]);
      const abhijit = readField(currentData, ["Abhijit"]);
      const amrit = readField(currentData, ["Amrit Kalam"]);
      const rahu = readField(currentData, ["Rahu Kalam", "Rahu"]);
      const yamaganda = readField(currentData, ["Yamaganda"]);
      const gulikai = readField(currentData, ["Gulikai Kalam"]);
      const durMuhurtam = readField(currentData, ["Dur Muhurtam"]);
      const varjyam = readField(currentData, ["Varjyam"]);
      
      const weekday = currentData?.Weekday || "";
      const dateLabel = formatDateLabel(currentData?.date, weekday);
      
      let response = "";
      if (dateLabel) response += `Date: ${dateLabel}\n\n`;
      response += `Tithi: ${tithi}\n`;
      response += `Nakshatra: ${nakshatra}\n`;
      response += `Yoga: ${yoga}\n`;
      response += `Karana: ${karanam}\n`;
      if (paksha) response += `Paksha: ${paksha}\n`;
      if (festivals.length) response += `Festivals: ${festivals.join(", ")}\n\n`;
      
      response += "Sun & Moon:\n";
      if (sunrise) response += `  Sunrise: ${sunrise}\n`;
      if (sunset) response += `  Sunset: ${sunset}\n\n`;
      
      response += "Auspicious:\n";
      if (abhijit) response += `  Abhijit: ${abhijit}\n`;
      if (amrit) response += `  Amrit Kalam: ${amrit}\n\n`;
      
      response += "Inauspicious:\n";
      if (rahu) response += `  Rahu Kalam: ${rahu}\n`;
      if (yamaganda) response += `  Yamaganda: ${yamaganda}\n`;
      if (gulikai) response += `  Gulikai Kalam: ${gulikai}\n`;
      if (durMuhurtam) response += `  Dur Muhurtam: ${durMuhurtam}\n`;
      if (varjyam) response += `  Varjyam: ${varjyam}`;
      
      return res.json({ response: response.trim() });
    }

    // ========== DEFAULT RESPONSE ==========
    return res.json({
      response: "I can provide information about:\n• Today's panchang (tithi, nakshatra, yoga, karana)\n• Festival dates\n• Auspicious and inauspicious muhurta timings\n• Good days for new beginnings\n\nPlease ask a specific question about the panchang."
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ response: MISSING_INFO });
  }
};

// ========== ROUTES ==========

router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;
