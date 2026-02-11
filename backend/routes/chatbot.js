import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

const MISSING_INFO =
  "This information is currently unavailable in the Panchang data.";
const ONLY_PANCHANG =
  "I can answer only Panchang-related questions. Please ask about tithi, nakshatra, yogam, karanam, auspicious or inauspicious timings, or whether the day is good for starting new work.";

// ========== LOCAL DATA ACCESS ==========

const dataCache = new Map();
const festivalCache = new Map();
let dataRootCache = null;

const readJsonFile = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const getDataRoot = async () => {
  if (dataRootCache) return dataRootCache;
  const candidates = [
    path.join(process.cwd(), "frontend", "public", "data"),
    path.join(process.cwd(), "..", "frontend", "public", "data"),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      dataRootCache = candidate;
      return dataRootCache;
    } catch (error) {
      // try next
    }
  }
  dataRootCache = candidates[0];
  return dataRootCache;
};

const getYearData = async (year) => {
  if (dataCache.has(year)) return dataCache.get(year);
  const root = await getDataRoot();
  const filePath = path.join(root, `${year}.json`);
  const data = await readJsonFile(filePath);
  if (data) dataCache.set(year, data);
  return data || [];
};

const fetchFestivalData = async (year) => {
  if (festivalCache.has(year)) return festivalCache.get(year);
  const root = await getDataRoot();
  const filePath = path.join(root, "festivals", `${year}.json`);
  const data = await readJsonFile(filePath);
  if (data) festivalCache.set(year, data);
  return data || {};
};

// ========== HELPER FUNCTIONS ==========

const containsWord = (text, word) =>
  new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCompact = (text) =>
  normalizeText(text).replace(/\s+/g, "");

const tokenize = (text) => normalizeText(text).split(" ").filter(Boolean);

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

const fuzzyTokenMatch = (token, candidate) => {
  if (!token || !candidate) return false;
  if (token === candidate) return true;
  const dist = levenshtein(token, candidate);
  const len = Math.max(token.length, candidate.length);
  const maxDist = len <= 4 ? 1 : len <= 7 ? 2 : 3;
  return dist <= maxDist;
};

const hasKeyword = (tokens, compact, keywords) => {
  for (const keyword of keywords) {
    const kw = String(keyword || "").toLowerCase();
    if (!kw) continue;
    if (kw.includes(" ")) {
      if (compact.includes(normalizeCompact(kw))) return true;
      continue;
    }
    if (tokens.some((token) => fuzzyTokenMatch(token, kw))) return true;
  }
  return false;
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

const MONTHS = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12
};

const parseDayNumber = (token) => {
  const match = String(token || "").match(/\d{1,2}/);
  if (!match) return null;
  const day = Number(match[0]);
  if (day >= 1 && day <= 31) return day;
  return null;
};

const parseNumericDate = (message, referenceYear) => {
  const match = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/.exec(message);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  let year = match[3] ? Number(match[3]) : referenceYear;
  if (year < 100) year += 2000;

  let month = first;
  let day = second;
  if (first > 12 && second <= 12) {
    day = first;
    month = second;
  } else if (second > 12 && first <= 12) {
    month = first;
    day = second;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const findMonthNumber = (token) => {
  if (!token) return null;
  const direct = MONTHS[token];
  if (direct) return direct;
  const keys = Object.keys(MONTHS);
  for (const key of keys) {
    if (fuzzyTokenMatch(token, key)) return MONTHS[key];
  }
  return null;
};

const extractDateFromText = (message, referenceDate) => {
  const lower = normalizeText(message);
  const compact = normalizeCompact(message);
  const tokens = tokenize(message);
  const referenceYear = referenceDate.getFullYear();

  if (lower.includes("day after tomorrow")) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 2);
    return { date, label: "day after tomorrow" };
  }
  if (lower.includes("tomorrow") || lower.includes("next day")) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 1);
    return { date, label: "tomorrow" };
  }
  if (lower.includes("yesterday")) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - 1);
    return { date, label: "yesterday" };
  }
  if (lower.includes("today") || lower.includes("current") || lower.includes("now")) {
    return { date: referenceDate, label: "today" };
  }

  const numericDate = parseNumericDate(message, referenceYear);
  if (numericDate) return { date: numericDate, label: "numeric" };

  for (let i = 0; i < tokens.length; i++) {
    const month = findMonthNumber(tokens[i]);
    if (!month) continue;

    const nextDay = parseDayNumber(tokens[i + 1]);
    const prevDay = parseDayNumber(tokens[i - 1]);
    let day = nextDay || prevDay;
    if (!day) continue;

    let year = referenceYear;
    const yearToken = tokens[i + 2];
    if (yearToken && /^\d{4}$/.test(yearToken)) year = Number(yearToken);

    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    return { date, label: "explicit" };
  }

  if (compact) {
    for (const [name, monthNum] of Object.entries(MONTHS)) {
      const key = normalizeCompact(name);
      if (!compact.includes(key)) continue;
      const dayMatch = compact.match(/\d{1,2}/);
      if (!dayMatch) continue;
      const day = Number(dayMatch[0]);
      if (day < 1 || day > 31) continue;
      const date = new Date(referenceYear, monthNum - 1, day, 0, 0, 0, 0);
      return { date, label: "compact" };
    }
  }

  return null;
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

const findDayDataWithFallback = async (calendarData, targetDate) => {
  const inMemory = findDayData(calendarData, targetDate);
  if (inMemory) return inMemory;
  const yearData = await getYearData(targetDate.getFullYear());
  return findDayData(yearData, targetDate);
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

const TITHI_TERMS = [
  "prathama", "dvitiya", "tritiya", "chaturthi", "panchami", "shashthi",
  "saptami", "ashtami", "navami", "dashami", "ekadashi", "dwadashi",
  "trayodashi", "chaturdashi", "purnima", "amavasya"
];

const findTithiNameFuzzy = (message) => {
  const direct = findTithiName(message);
  if (direct) return direct;
  const tokens = tokenize(message);
  const compact = normalizeCompact(message);

  for (const term of TITHI_TERMS) {
    if (compact.includes(normalizeCompact(term))) {
      return { name: term.charAt(0).toUpperCase() + term.slice(1), paksha: null };
    }
    if (tokens.some((token) => fuzzyTokenMatch(token, term))) {
      return { name: term.charAt(0).toUpperCase() + term.slice(1), paksha: null };
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
    } else if (!tithiInfo.paksha) {
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
  "Maha Shivarathri": [/maha.*shivarathri/i, /maha.*shivaratri/i, /shivarathri/i, /shivaratri/i, /shivratri/i, /shiv.*rathri/i, /mahashivratri/i, /maha.*shivratri/i, /shiv\s*ratri/i],
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

const FESTIVAL_ALIAS_STRINGS = {
  "Maha Shivarathri": ["maha shivarathri", "maha shivaratri", "maha shivratri", "shivarathri", "shivaratri", "shivratri", "shiv ratri"],
  "Ganesh Chaturthi": ["ganesh chaturthi", "ganesha chaturthi", "vinayaka chaturthi", "ganeshotsav"],
  "Navratri": ["navratri", "navarathri", "navaratri", "nine nights"],
  "Dussehra": ["dussehra", "dasara", "vijayadashami", "dassera"],
  "Diwali": ["diwali", "deepavali", "divali", "festival of lights"],
  "Holi": ["holi", "phagwah"],
  "Janmashtami": ["janmashtami", "janmastami", "krishna janmashtami"],
  "Ram Navami": ["ram navami", "rama navami"],
  "Hanuman Jayanti": ["hanuman jayanti"],
  "Pongal": ["pongal", "thai pongal"],
  "Onam": ["onam"],
  "Vishu": ["vishu"],
  "Guru Purnima": ["guru purnima", "vyasa purnima"],
  "Makar Sankranti": ["makar sankranti", "sankranti", "uttarayan"],
  "Baisakhi": ["baisakhi", "vaisakhi", "vasakhi"],
  "Rath Yatra": ["rath yatra", "jagannath yatra"]
};

const findFestivalNameFuzzy = (message) => {
  const direct = findFestivalName(message);
  if (direct) return direct;
  const tokens = tokenize(message);
  const compact = normalizeCompact(message);

  for (const [name, aliases] of Object.entries(FESTIVAL_ALIAS_STRINGS)) {
    for (const alias of aliases) {
      const aliasCompact = normalizeCompact(alias);
      if (compact.includes(aliasCompact)) return name;
      if (tokens.some((token) => fuzzyTokenMatch(token, aliasCompact))) return name;
    }
  }
  return null;
};

const findNextFestival = async (calendarData, year, referenceDate, festivalName) => {
  const festivalData = await fetchFestivalData(year);
  const yearData = await getYearData(year);
  const calendarArray = Array.isArray(yearData) && yearData.length
    ? yearData.filter(Boolean)
    : Array.isArray(calendarData)
      ? calendarData.filter(Boolean)
      : [];

  const results = [];
  const normalizedQuery = normalizeCompact(festivalName);

  for (const day of calendarArray) {
    const dateObj = parseSlashDate(day?.date);
    if (!dateObj || dateObj < referenceDate) continue;

    const [dayPart, monthPart] = (day?.date || "").split("/");
    if (!dayPart || !monthPart) continue;

    const dateKey = `${year}-${monthPart}-${dayPart}`;
    const dayFestivals = festivalData[dateKey] || [];

    for (const fest of dayFestivals) {
      const normalizedFest = normalizeCompact(fest);
      if (normalizedFest.includes(normalizedQuery) || normalizedQuery.includes(normalizedFest)) {
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

const findFestivalInMonth = async (calendarData, year, festivalName) => {
  const festivalData = await fetchFestivalData(year);
  const yearData = await getYearData(year);
  const calendarArray = Array.isArray(yearData) && yearData.length
    ? yearData.filter(Boolean)
    : Array.isArray(calendarData)
      ? calendarData.filter(Boolean)
      : [];

  const results = [];
  const normalizedQuery = normalizeCompact(festivalName);

  for (const day of calendarArray) {
    const [dayPart, monthPart] = (day?.date || "").split("/");
    if (!dayPart || !monthPart) continue;

    const dateKey = `${year}-${monthPart}-${dayPart}`;
    const dayFestivals = festivalData[dateKey] || [];

    for (const fest of dayFestivals) {
      const normalizedFest = normalizeCompact(fest);
      if (normalizedFest.includes(normalizedQuery) || normalizedQuery.includes(normalizedFest)) {
        results.push({
          festival: fest,
          dateLabel: formatDateLabel(day?.date, day?.Weekday)
        });
      }
    }
  }

  return results;
};

const getFestivalsForDate = async (year, dateObj) => {
  const festivalData = await fetchFestivalData(year);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;
  const festivals = festivalData[dateKey] || [];
  return Array.isArray(festivals) ? festivals.filter(Boolean) : [];
};

// ========== GREETING PATTERNS ==========

const isGreeting = (msg) => {
  return /^(hello|hi|hey|namaste|vanakkam|good\s*morning|good\s*afternoon|good\s*evening|hari\s*om|om)\W*$/i.test(msg.trim());
};

// Check if message contains any panchang-related keywords
const isPanchangRelated = (msg) => {
  const tokens = tokenize(msg);
  const compact = normalizeCompact(msg);

  const festivalKeywords = [
    "festival", "festivals", "utsav", "shivarathri", "shivaratri", "shivratri",
    "diwali", "deepavali", "holi", "navratri", "navaratri", "dussehra",
    "dasara", "ganesh", "chaturthi", "janmashtami", "ram navami",
    "pongal", "onam", "vishu", "sankranti", "baisakhi", "rath yatra",
    "mahadev", "shiva"
  ];

  const tithiKeywords = ["tithi", "thithi", "paksha", "shukla", "krishna", ...TITHI_TERMS];
  const nakshatraKeywords = ["nakshatra", "nakshatr"];
  const muhurtaKeywords = ["muhurta", "muhurtam", "muhurtham", "timing", "timings", "time"];
  const rahuKeywords = ["rahu", "rahukalam", "rahu kalam"];
  const yogaKeywords = ["yoga", "yogam", "yog"];
  const karanaKeywords = ["karana", "karanam"];

  if (hasKeyword(tokens, compact, festivalKeywords)) return true;
  if (hasKeyword(tokens, compact, tithiKeywords)) return true;
  if (hasKeyword(tokens, compact, nakshatraKeywords)) return true;
  if (hasKeyword(tokens, compact, muhurtaKeywords)) return true;
  if (hasKeyword(tokens, compact, rahuKeywords)) return true;
  if (hasKeyword(tokens, compact, yogaKeywords)) return true;
  if (hasKeyword(tokens, compact, karanaKeywords)) return true;

  const questionPatterns = [
    /when\s+(is|does|will)/i,
    /what\s+(is|was|will)/i,
    /which\s+day/i,
    /next\s+(tithi|festival|day)/i,
    /upcoming/i,
    /tomorrow/i,
    /today/i
  ];

  if (questionPatterns.some((p) => p.test(msg))) return true;
  return false;
};

const classifyIntent = (message) => {
  const tokens = tokenize(message);
  const compact = normalizeCompact(message);

  const festivalName = findFestivalNameFuzzy(message);
  const tithiInfo = findTithiNameFuzzy(message);

  const hasRahu = hasKeyword(tokens, compact, ["rahu", "rahukalam", "rahu kalam"]);
  const hasNakshatra = hasKeyword(tokens, compact, ["nakshatra", "nakshatr"]);
  const hasTithi = hasKeyword(tokens, compact, ["tithi", "thithi"]) || !!tithiInfo;
  const hasFestival = hasKeyword(tokens, compact, ["festival", "festivals", "utsav"]) || !!festivalName;
  const hasMuhurta = hasKeyword(tokens, compact, ["muhurta", "muhurtam", "muhurtham", "timing", "timings"]);

  if (hasFestival) return { intent: "festival", festivalName };
  if (hasTithi) return { intent: "tithi", tithiInfo };
  if (hasRahu) return { intent: "rahukalam" };
  if (hasNakshatra) return { intent: "nakshatra" };
  if (hasMuhurta) return { intent: "muhurtha" };

  return { intent: "unknown" };
};

const formatDateFromData = (dayData, targetDate) => {
  const weekday = dayData?.Weekday || "";
  const label = formatDateLabel(dayData?.date, weekday);
  if (label) return label;
  const day = String(targetDate.getDate()).padStart(2, "0");
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}`;
};

const buildDateResponse = (label, fieldLabel, fieldValue) => {
  if (!fieldValue) return MISSING_INFO;
  return label
    ? `${fieldLabel} on ${label} is ${fieldValue}.`
    : `${fieldLabel} is ${fieldValue}.`;
};

const buildMuhurthaResponse = (label, dayData) => {
  const abhijit = readField(dayData, ["Abhijit"]);
  const amrit = readField(dayData, ["Amrit Kalam"]);
  const rahu = readField(dayData, ["Rahu Kalam", "Rahu"]);
  const yamaganda = readField(dayData, ["Yamaganda"]);
  const gulikai = readField(dayData, ["Gulikai Kalam"]);
  const durMuhurtam = readField(dayData, ["Dur Muhurtam"]);
  const varjyam = readField(dayData, ["Varjyam"]);

  if (!abhijit && !amrit && !rahu && !yamaganda && !gulikai && !durMuhurtam && !varjyam) {
    return MISSING_INFO;
  }

  let response = label ? `Muhurta timings for ${label}:\n\n` : "Muhurta timings:\n\n";
  response += "Auspicious:\n";
  if (abhijit) response += `  Abhijit: ${abhijit}\n`;
  if (amrit) response += `  Amrit Kalam: ${amrit}\n`;

  response += "\nInauspicious:\n";
  if (rahu) response += `  Rahu Kalam: ${rahu}\n`;
  if (yamaganda) response += `  Yamaganda: ${yamaganda}\n`;
  if (gulikai) response += `  Gulikai Kalam: ${gulikai}\n`;
  if (durMuhurtam) response += `  Dur Muhurtam: ${durMuhurtam}\n`;
  if (varjyam) response += `  Varjyam: ${varjyam}`;

  return response.trim();
};

const buildFullPanchangResponse = (dayData, targetDate) => {
  const tithi = readField(dayData, ["Tithi"]) || MISSING_INFO;
  const nakshatra = readField(dayData, ["Nakshatra"]) || MISSING_INFO;
  const yoga = readField(dayData, ["Yoga", "Yogam"]) || MISSING_INFO;
  const karanam = readField(dayData, ["Karanam", "Karana"]) || MISSING_INFO;
  const paksha = readField(dayData, ["Paksha"]) || "";
  const festivals = Array.isArray(dayData?.Festivals) ? dayData.Festivals : [];
  const sunrise = readField(dayData, ["Sunrise"]);
  const sunset = readField(dayData, ["Sunset"]);
  const abhijit = readField(dayData, ["Abhijit"]);
  const amrit = readField(dayData, ["Amrit Kalam"]);
  const rahu = readField(dayData, ["Rahu Kalam", "Rahu"]);
  const yamaganda = readField(dayData, ["Yamaganda"]);
  const gulikai = readField(dayData, ["Gulikai Kalam"]);
  const durMuhurtam = readField(dayData, ["Dur Muhurtam"]);
  const varjyam = readField(dayData, ["Varjyam"]);

  const dateLabel = formatDateFromData(dayData, targetDate);

  let response = `Date: ${dateLabel}\n\n`;
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

  return response.trim();
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
    
    // Extract year from selectedDay
    const year = selectedDay?.date ? parseInt(selectedDay.date.split("/")[2], 10) : new Date().getFullYear();

    const intentInfo = classifyIntent(lowerMessage);
    const extractedDate = extractDateFromText(lowerMessage, referenceDate);
    const targetDate = extractedDate?.date || referenceDate;
    
    // ========== 1. SPECIFIC TITHI DATE QUERY ==========
    // "when is ekadashi", "next ekadashi", "when is Purnima", "when is Amavasya"
    const tithiQueryPatterns = [
      /when\s*(is|is\s*the|will|comes|occur)/i,
      /next/i,
      /upcoming/i,
      /date\s*(of|for)/i,
    ];
    const isTithiDateQuery = tithiQueryPatterns.some(p => p.test(lowerMessage)) &&
      (containsWord(lowerMessage, "tithi") || findTithiNameFuzzy(lowerMessage));
    
    if (isTithiDateQuery) {
      const tithiInfo = findTithiNameFuzzy(lowerMessage);
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
    const directFestivalName = findFestivalNameFuzzy(lowerMessage);
    if (directFestivalName) {
      const result = await findNextFestival(calendarData, year, referenceDate, directFestivalName);
      if (result) {
        return res.json({
          response: `${result.festival} is observed on ${result.dateLabel}.`
        });
      }
      // Check if festival exists in calendar at all
      const festivalResults = await findFestivalInMonth(calendarData, year, directFestivalName);
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
    const festivalName = findFestivalNameFuzzy(lowerMessage);
    const isFestivalDateQuery = 
      (containsWord(lowerMessage, "when") || containsWord(lowerMessage, "which") || 
       containsWord(lowerMessage, "what") || containsWord(lowerMessage, "date")) &&
      (containsWord(lowerMessage, "festival") || festivalName);
    
    if (isFestivalDateQuery) {
      // Use the found festival name or search for it
      const nameToFind = festivalName || findFestivalName(lowerMessage);
      if (nameToFind) {
        const result = await findNextFestival(calendarData, year, referenceDate, nameToFind);
        if (result) {
          return res.json({
            response: `${result.festival} is observed on ${result.dateLabel}.`
          });
        }
        // Check if festival exists in calendar at all
        const festivalResults = await findFestivalInMonth(calendarData, year, nameToFind);
        if (festivalResults.length > 0) {
          const dates = festivalResults.map(r => r.dateLabel).join(", ");
          return res.json({
            response: `${nameToFind} is observed on: ${dates}.`
          });
        }
      }
      return res.json({ response: MISSING_INFO });
    }

    // ========== 3. DATE-SPECIFIC INTENT QUERIES ==========
    if (extractedDate && intentInfo.intent !== "unknown") {
      const dayData = await findDayDataWithFallback(calendarData, targetDate);
      if (!dayData) {
        return res.json({ response: MISSING_INFO });
      }

      const dateLabel = formatDateFromData(dayData, targetDate);

      if (intentInfo.intent === "festival") {
        const festivals = await getFestivalsForDate(targetDate.getFullYear(), targetDate);
        if (festivals.length) {
          return res.json({ response: `Festivals on ${dateLabel}: ${festivals.join(", ")}.` });
        }
        return res.json({ response: MISSING_INFO });
      }

      if (intentInfo.intent === "tithi") {
        const tithi = readField(dayData, ["Tithi"]);
        return res.json({ response: buildDateResponse(dateLabel, "Tithi", tithi) });
      }

      if (intentInfo.intent === "nakshatra") {
        const nakshatra = readField(dayData, ["Nakshatra"]);
        return res.json({ response: buildDateResponse(dateLabel, "Nakshatra", nakshatra) });
      }

      if (intentInfo.intent === "rahukalam") {
        const rahu = readField(dayData, ["Rahu Kalam", "Rahu"]);
        return res.json({ response: buildDateResponse(dateLabel, "Rahu Kalam", rahu) });
      }

      if (intentInfo.intent === "muhurtha") {
        const response = buildMuhurthaResponse(dateLabel, dayData);
        return res.json({ response });
      }
    }

    if (extractedDate && intentInfo.intent === "unknown") {
      if (containsWord(lowerMessage, "panchang") || containsWord(lowerMessage, "full") ||
          containsWord(lowerMessage, "complete") || containsWord(lowerMessage, "details")) {
        const dayData = await findDayDataWithFallback(calendarData, targetDate);
        if (!dayData) return res.json({ response: MISSING_INFO });
        const response = buildFullPanchangResponse(dayData, targetDate);
        return res.json({ response });
      }
    }

    // ========== 3. DIRECT TITHI NAME QUERY ==========
    // "ekadashi", "purnima", "amavasya" - just the tithi name without question
    const directTithiInfo = findTithiNameFuzzy(lowerMessage);
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
    
    if (intentInfo.intent === "tithi" && !containsWord(lowerMessage, "tomorrow")) {
      const tithi = readField(currentData, ["Tithi"]);
      if (tithi) {
        return res.json({ response: `Today's tithi is ${tithi}.` });
      }
      return res.json({ response: MISSING_INFO });
    }
    
    if (intentInfo.intent === "nakshatra") {
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
    if (intentInfo.intent === "muhurtha") {
      const response = buildMuhurthaResponse("today", currentData);
      return res.json({ response });
    }

    // ========== 9. FESTIVAL LIST ==========
    if (containsWord(lowerMessage, "festival") && (containsWord(lowerMessage, "list") || 
        containsWord(lowerMessage, "all") || containsWord(lowerMessage, "month"))) {
      const monthEntries = await getMonthFestivalEntries(calendarData, year);
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
      
      const targetDate = referenceDate;
      const response = buildFullPanchangResponse(currentData, targetDate);
      return res.json({ response });
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
