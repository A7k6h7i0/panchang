import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

// ========== CONSTANTS ==========
const MISSING_INFO = "This information is currently unavailable in the Panchang data.";
const FESTIVAL_2026_ONLY = "Festival data is available only for 2026.";
const RASHIPHALALU_MODE_MSG = "Please switch to Rashiphalalu mode to ask zodiac-related questions.";
const PANCHANG_MODE_MSG = "Please switch to Panchang mode to ask Panchang-related questions.";

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
    path.join(process.cwd(), "public", "data"),
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
const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeCompact = (text) =>
  normalizeText(text).replace(/\s+/g, "");

const tokenize = (text) => normalizeText(text).split(" ").filter(Boolean);

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

const fuzzyMatch = (input, target, threshold = 0.3) => {
  if (!input || !target) return false;
  const inputNorm = normalizeText(input);
  const targetNorm = normalizeText(target);

  if (inputNorm === targetNorm) return true;
  if (targetNorm.includes(inputNorm) || inputNorm.includes(targetNorm)) return true;

  const dist = levenshtein(inputNorm, targetNorm);
  const maxLen = Math.max(inputNorm.length, targetNorm.length);
  return (dist / maxLen) <= threshold;
};

// ========== TITHI/NAKSHATRA VARIATIONS ==========
const TITHI_VARIATIONS = {
  "ekadashi": ["ekadashi", "ekadasi", "ekdashi", "ekdasi", "11"],
  "amavasya": ["amavasya", "amavasy", "amavas", "new moon"],
  "purnima": ["purnima", "pournima", "poornima", "full moon"],
  "dashami": ["dashami", "dasami", "10"],
  "navami": ["navami", "navmi", "9"],
  "ashtami": ["ashtami", "astami", "8"],
  "saptami": ["saptami", "7"],
  "shashthi": ["shashthi", "shasti", "sashti", "6"],
  "panchami": ["panchami", "panchmi", "5"],
  "chaturthi": ["chaturthi", "chaturth", "4"],
  "tritiya": ["tritiya", "3"],
  "dvitiya": ["dvitiya", "dwitiya", "2"],
  "prathama": ["prathama", "pratham", "padyami", "1"],
  "chaturdashi": ["chaturdashi", "14"],
  "trayodashi": ["trayodashi", "13"],
  "dwadashi": ["dwadashi", "dvadashi", "12"]
};

const NAKSHATRA_VARIATIONS = {
  "ashwini": ["ashwini", "aswini", "ashwani"],
  "bharani": ["bharani", "bharni"],
  "krittika": ["krittika", "kritika", "krithika"],
  "rohini": ["rohini", "rohni"],
  "mrigashira": ["mrigashira", "mrigasira", "mrigshira"],
  "ardra": ["ardra", "arudra"],
  "punarvasu": ["punarvasu", "punarvas"],
  "pushya": ["pushya", "pushyami"],
  "ashlesha": ["ashlesha", "aslesha"],
  "magha": ["magha", "magah"],
  "purva phalguni": ["purva phalguni", "poorva phalguni", "purvaphalguni"],
  "uttara phalguni": ["uttara phalguni", "uthara phalguni", "uttaraphalguni"],
  "hasta": ["hasta", "hastha"],
  "chitra": ["chitra", "chitta"],
  "swati": ["swati", "svati"],
  "vishakha": ["vishakha", "visakha"],
  "anuradha": ["anuradha", "anurrada"],
  "jyeshtha": ["jyeshtha", "jyestha", "jyeshta"],
  "moola": ["moola", "mula", "mool"],
  "purva ashadha": ["purva ashadha", "poorvashadha", "purvaashadha"],
  "uttara ashadha": ["uttara ashadha", "uttarashadha", "utharashadha"],
  "shravana": ["shravana", "sravana", "shravan"],
  "dhanishta": ["dhanishta", "dhanishtha"],
  "shatabhisha": ["shatabhisha", "shatabhish", "satabhisha"],
  "purva bhadrapada": ["purva bhadrapada", "purvabhadra", "purvabhadrapada"],
  "uttara bhadrapada": ["uttara bhadrapada", "uttarabhadra", "uttarabhadrapada"],
  "revati": ["revati", "revathi"]
};

const TIMING_VARIATIONS = {
  "rahukalam": ["rahukalam", "rahu kalam", "rahu", "rahukaal"],
  "yamaganda": ["yamaganda", "yamagandam", "yama ganda"],
  "gulikai": ["gulikai", "gulik", "gulika", "gulika kalam"],
  "abhijit": ["abhijit", "abhijith", "abhijit muhurtham"],
  "amrita": ["amrita", "amrit", "amritha", "amrit kalam"],
  "varjyam": ["varjyam", "varjya", "varjyam"],
  "durmuhurtam": ["durmuhurtam", "dur muhurtam", "durmuhurta"]
};

const findMatchingTithi = (input) => {
  const inputNorm = normalizeText(input);
  for (const [canonical, variations] of Object.entries(TITHI_VARIATIONS)) {
    if (variations.some(v => fuzzyMatch(inputNorm, v, 0.25))) {
      return canonical;
    }
  }
  return null;
};

const findMatchingNakshatra = (input) => {
  const inputNorm = normalizeText(input);
  for (const [canonical, variations] of Object.entries(NAKSHATRA_VARIATIONS)) {
    if (variations.some(v => fuzzyMatch(inputNorm, v, 0.25))) {
      return canonical;
    }
  }
  return null;
};

// ========== DATE PARSING ==========
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
  const year = match[3];
  return weekdayText ? `${weekdayText}, ${day}-${month}-${year}` : `${day}-${month}-${year}`;
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

const extractDateFromMessage = (message, selectedDay) => {
  const lower = normalizeText(message);
  const tokens = tokenize(message);

  // Check for "today"
  if (lower.includes("today") || lower.includes("aaj")) {
    return parseSlashDate(selectedDay?.date) || new Date();
  }

  // Check for "tomorrow"
  if (lower.includes("tomorrow") || lower.includes("kal")) {
    const today = parseSlashDate(selectedDay?.date) || new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Parse numeric date (14/2, 14-2, 14/2/2026)
  const numMatch = /(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/.exec(message);
  if (numMatch) {
    const first = Number(numMatch[1]);
    const second = Number(numMatch[2]);
    let year = numMatch[3] ? Number(numMatch[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;

    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
  }

  // Parse "14 feb" or "feb 14"
  for (let i = 0; i < tokens.length - 1; i++) {
    const monthNum = MONTHS[tokens[i]];
    const dayNum = parseInt(tokens[i + 1]);

    if (monthNum && dayNum >= 1 && dayNum <= 31) {
      return new Date(new Date().getFullYear(), monthNum - 1, dayNum);
    }

    const dayNum2 = parseInt(tokens[i]);
    const monthNum2 = MONTHS[tokens[i + 1]];
    if (dayNum2 >= 1 && dayNum2 <= 31 && monthNum2) {
      return new Date(new Date().getFullYear(), monthNum2 - 1, dayNum2);
    }
  }

  return null;
};

// ========== FIND DATA FOR DATE ==========
const findDataForDate = async (targetDate, selectedDay) => {
  if (!targetDate) targetDate = parseSlashDate(selectedDay?.date) || new Date();

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();

  const dateStr = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

  const yearData = await getYearData(year);
  const dayData = yearData.find(d => d.date === dateStr);

  if (dayData) {
    // Attach festivals
    const festivalData = await fetchFestivalData(year);
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dayData.Festivals = festivalData[dateKey] || [];
  }

  return dayData;
};

// ========== SEARCH FUTURE TITHI ==========
const searchFutureTithi = async (tithiName, startDate, maxDays = 60) => {
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 1); // Start from next day

  for (let i = 0; i < maxDays; i++) {
    const dayData = await findDataForDate(currentDate);
    if (dayData && dayData.Tithi) {
      const tithiNorm = normalizeText(dayData.Tithi);
      if (tithiNorm.includes(tithiName) || fuzzyMatch(tithiNorm, tithiName, 0.3)) {
        return {
          date: currentDate,
          data: dayData
        };
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return null;
};

// ========== AUSPICIOUSNESS ASSESSMENT ==========
const assessDay = (dayData) => {
  if (!dayData) return { quality: "moderate", reason: "Data not available" };

  const tithi = normalizeText(dayData.Tithi || "");
  const nakshatra = normalizeText(dayData.Nakshatra || "");

  // Highly inauspicious tithis
  if (tithi.includes("amavasya")) {
    return {
      quality: "inauspicious",
      reason: "Amavasya (New Moon) is generally avoided for new beginnings."
    };
  }

  if (tithi.includes("ashtami") || tithi.includes("navami")) {
    return {
      quality: "moderate",
      reason: "Ashtami and Navami are moderately auspicious. Avoid inauspicious timings."
    };
  }

  if (tithi.includes("ekadashi") || tithi.includes("purnima") || tithi.includes("dvitiya")) {
    return {
      quality: "auspicious",
      reason: "This tithi is generally favorable for new beginnings."
    };
  }

  return {
    quality: "moderate",
    reason: "Generally favorable. Avoid Rahu Kalam and other inauspicious timings."
  };
};

// ========== BUILD RESPONSES ==========
const buildFullPanchangResponse = (dayData) => {
  if (!dayData) return MISSING_INFO;

  const dateLabel = formatDateLabel(dayData.date, dayData.Weekday);
  let response = `**Panchang for ${dateLabel}**\n\n`;

  response += `**Tithi:** ${dayData.Tithi || "-"}\n`;
  response += `**Nakshatra:** ${dayData.Nakshatra || "-"}\n`;
  response += `**Yoga:** ${dayData.Yoga || "-"}\n`;
  response += `**Karanam:** ${dayData.Karanam || "-"}\n`;
  response += `**Paksha:** ${dayData.Paksha || "-"}\n\n`;

  response += `**Sunrise:** ${dayData.Sunrise || "-"}\n`;
  response += `**Sunset:** ${dayData.Sunset || "-"}\n\n`;

  response += `**Auspicious Timings:**\n`;
  response += `Abhijit Muhurtham: ${dayData["Abhijit"] || dayData["Abhijit Muhurtham"] || "-"}\n`;
  response += `Amrit Kalam: ${dayData["Amrit Kalam"] || dayData["Amritha Kalam"] || "-"}\n\n`;

  response += `**Inauspicious Timings:**\n`;
  response += `Rahu Kalam: ${dayData["Rahu Kalam"] || dayData["Rahu"] || "-"}\n`;
  response += `Yamaganda: ${dayData["Yamaganda"] || "-"}\n`;
  response += `Gulikai: ${dayData["Gulikai Kalam"] || dayData["Gulikai"] || "-"}\n`;
  response += `Varjyam: ${dayData["Varjyam"] || "-"}`;

  if (dayData.Festivals && dayData.Festivals.length > 0) {
    response += `\n\n**Festivals:** ${dayData.Festivals.join(", ")}`;
  }

  return response;
};

// ========== MAIN CHATBOT HANDLER ==========
const handleChatbot = async (req, res) => {
  try {
    const { message, selectedDay, mode } = req.body;

    if (!message || !message.trim()) {
      return res.json({ response: "Please ask a question about the Panchang." });
    }

    const lower = normalizeText(message);
    const tokens = tokenize(message);
    const compact = normalizeCompact(message);

    // ========== MODE CHECKING ==========
    // Check if user is in Rashiphalalu mode
    if (mode === "rashiphalalu") {
      return res.json({ response: PANCHANG_MODE_MSG });
    }

    // ========== TODAY PANCHANG ==========
    if (lower.includes("today") || lower.includes("panchang") || lower.includes("details")) {
      const dayData = await findDataForDate(null, selectedDay);
      return res.json({ response: buildFullPanchangResponse(dayData) });
    }

    // ========== SPECIFIC DATE QUERY ==========
    const targetDate = extractDateFromMessage(message, selectedDay);
    if (targetDate && !lower.includes("next") && !lower.includes("when")) {
      const dayData = await findDataForDate(targetDate, selectedDay);
      return res.json({ response: buildFullPanchangResponse(dayData) });
    }

    // ========== TITHI QUERY ==========
    if (lower.includes("tithi")) {
      if (lower.includes("next") || lower.includes("when")) {
        const tithiMatch = findMatchingTithi(message);
        if (tithiMatch) {
          const startDate = parseSlashDate(selectedDay?.date) || new Date();
          const result = await searchFutureTithi(tithiMatch, startDate);

          if (result) {
            const dateLabel = formatDateLabel(result.data.date, result.data.Weekday);
            return res.json({
              response: `The next **${tithiMatch.charAt(0).toUpperCase() + tithiMatch.slice(1)}** is on **${dateLabel}**.`
            });
          } else {
            return res.json({
              response: `Could not find ${tithiMatch} in the next 60 days.`
            });
          }
        }
      }

      const dayData = await findDataForDate(targetDate, selectedDay);
      return res.json({
        response: `Tithi: **${dayData?.Tithi || "Data not available"}**`
      });
    }

    // ========== NAKSHATRA QUERY ==========
    if (lower.includes("nakshatra") || lower.includes("nakshtram")) {
      const dayData = await findDataForDate(targetDate, selectedDay);
      return res.json({
        response: `Nakshatra: **${dayData?.Nakshatra || "Data not available"}**`
      });
    }

    // ========== FESTIVAL QUERY ==========
    if (lower.includes("festival")) {
      // Check if asking for specific festival
      const festivalTokens = tokens.filter(t => t.length > 3 && !["when", "festival", "date"].includes(t));

      if (festivalTokens.length > 0) {
        const festivalData = await fetchFestivalData(2026);

        for (const [dateKey, festivals] of Object.entries(festivalData)) {
          for (const festival of festivals) {
            if (festivalTokens.some(token => fuzzyMatch(token, festival, 0.3))) {
              const [year, month, day] = dateKey.split("-");
              const date = new Date(year, month - 1, day);
              const dayData = await findDataForDate(date);
              const dateLabel = formatDateLabel(dayData?.date, dayData?.Weekday);
              return res.json({
                response: `**${festival}** is on **${dateLabel}**.`
              });
            }
          }
        }

        return res.json({ response: FESTIVAL_2026_ONLY });
      }

      // List all festivals in current month
      const currentDate = parseSlashDate(selectedDay?.date) || new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      if (year !== 2026) {
        return res.json({ response: FESTIVAL_2026_ONLY });
      }

      const festivalData = await fetchFestivalData(2026);
      const monthFestivals = [];

      for (const [dateKey, festivals] of Object.entries(festivalData)) {
        const [y, m] = dateKey.split("-");
        if (parseInt(y) === year && parseInt(m) === month) {
          const [, , day] = dateKey.split("-");
          monthFestivals.push({ day: parseInt(day), festivals });
        }
      }

      if (monthFestivals.length === 0) {
        return res.json({ response: "No festivals found in this month." });
      }

      monthFestivals.sort((a, b) => a.day - b.day);
      let response = "**Festivals this month:**\n\n";
      monthFestivals.forEach(({ day, festivals }) => {
        response += `**${day}:** ${festivals.join(", ")}\n`;
      });

      return res.json({ response });
    }

    // ========== AUSPICIOUS TIMING ==========
    if (lower.includes("auspicious") || lower.includes("shubh") || lower.includes("abhijit") || lower.includes("amrit")) {
      const dayData = await findDataForDate(targetDate, selectedDay);
      let response = "**Auspicious Timings:**\n\n";
      response += `Abhijit Muhurtham: ${dayData?.["Abhijit"] || dayData?.["Abhijit Muhurtham"] || "-"}\n`;
      response += `Amrit Kalam: ${dayData?.["Amrit Kalam"] || dayData?.["Amritha Kalam"] || "-"}`;
      return res.json({ response });
    }

    // ========== INAUSPICIOUS TIMING ==========
    if (lower.includes("inauspicious") || lower.includes("ashubh") || lower.includes("rahu") || 
        lower.includes("yamaganda") || lower.includes("gulikai") || lower.includes("varjyam")) {
      const dayData = await findDataForDate(targetDate, selectedDay);
      let response = "**Inauspicious Timings:**\n\n";
      response += `Rahu Kalam: ${dayData?.["Rahu Kalam"] || dayData?.["Rahu"] || "-"}\n`;
      response += `Yamaganda: ${dayData?.["Yamaganda"] || "-"}\n`;
      response += `Gulikai: ${dayData?.["Gulikai Kalam"] || dayData?.["Gulikai"] || "-"}\n`;
      response += `Varjyam: ${dayData?.["Varjyam"] || "-"}`;
      return res.json({ response });
    }

    // ========== GOOD DAY FOR NEW WORK ==========
    if (lower.includes("good day") || lower.includes("good for") || lower.includes("start") || 
        lower.includes("new work") || lower.includes("new beginning") || lower.includes("new business") ||
        lower.includes("new job")) {
      const dayData = await findDataForDate(targetDate, selectedDay);
      const assessment = assessDay(dayData);
      const dateLabel = formatDateLabel(dayData?.date, dayData?.Weekday);

      let response = `**Day Assessment for ${dateLabel}**\n\n`;
      response += `**Quality:** ${assessment.quality.charAt(0).toUpperCase() + assessment.quality.slice(1)}\n\n`;
      response += `**Reason:** ${assessment.reason}\n\n`;

      if (assessment.quality !== "inauspicious") {
        response += `**Recommendation:** Proceed while avoiding these timings:\n`;
        response += `- Rahu Kalam: ${dayData?.["Rahu Kalam"] || "-"}\n`;
        response += `- Yamaganda: ${dayData?.["Yamaganda"] || "-"}\n`;
        response += `- Gulikai: ${dayData?.["Gulikai Kalam"] || "-"}`;
      } else {
        response += `**Recommendation:** It is advisable to choose another day for important new beginnings.`;
      }

      return res.json({ response });
    }

    // ========== DEFAULT RESPONSE ==========
    return res.json({
      response: "I can help you with:\n\n• Today's Panchang details\n• Tithi, Nakshatra, Yoga, Karanam\n• Festival dates (2026 only)\n• Auspicious and inauspicious timings\n• Best days for new work\n• Future tithi dates\n\nPlease ask a specific question!"
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
