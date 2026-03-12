/**
 * chatbot.js - Panchang-only Chatbot Router
 *
 * Requirements:
 *  - ALWAYS use provided Panchang JSON data
 *  - NEVER generate Panchang values
 *  - Answer only Panchang-related questions
 */
import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { askGemini } from "../services/geminiChatService.js";

const router = express.Router();

const OUT_OF_SCOPE_MESSAGE =
  "I can only answer questions about today's Panchang (tithi, nakshatra, yoga, karana, sunrise, sunset, rahu kalam, festivals, and muhurat).";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DATA_DIR = path.resolve(__dirname, "../../frontend/public/data");
const LOCAL_FESTIVALS_DIR = path.resolve(LOCAL_DATA_DIR, "festivals");
const festivalCache = new Map();
const yearCache = new Map();

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const TITHI_NAMES = [
  "Pratipada",
  "Padyami",
  "Prathama",
  "Dvitiya",
  "Vidiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
  "Amavasya",
];

async function loadFestivalMap(year) {
  if (!Number.isInteger(year) || year < 1) return {};
  if (festivalCache.has(year)) return festivalCache.get(year);
  try {
    const raw = await readFile(path.join(LOCAL_FESTIVALS_DIR, `${year}.json`), "utf8");
    const parsed = JSON.parse(raw);
    const safe = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    festivalCache.set(year, safe);
    return safe;
  } catch {
    const empty = {};
    festivalCache.set(year, empty);
    return empty;
  }
}

async function loadYearData(year) {
  if (!Number.isInteger(year) || year < 1) return [];
  if (yearCache.has(year)) return yearCache.get(year);
  try {
    const raw = await readFile(path.join(LOCAL_DATA_DIR, `${year}.json`), "utf8");
    const parsed = JSON.parse(raw);
    const safe = Array.isArray(parsed) ? parsed : [];
    yearCache.set(year, safe);
    return safe;
  } catch {
    const empty = [];
    yearCache.set(year, empty);
    return empty;
  }
}

function parseSlashDate(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

function getContextDate(selectedDay, todayDay) {
  const fromToday = parseSlashDate(todayDay?.date);
  if (fromToday) return fromToday;
  const fromSelected = parseSlashDate(selectedDay?.date);
  if (fromSelected) return fromSelected;
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return textOf(value[0]);
  if (typeof value === "object") {
    const pick = (val) => {
      if (val == null) return "";
      if (typeof val === "string" || typeof val === "number") return String(val).trim();
      if (Array.isArray(val)) return pick(val[0]);
      if (typeof val === "object") {
        return pick(
          val?.en ??
            val?.name ??
            val?.vedic_name ??
            val?.title ??
            val?.value ??
            val?.label ??
            val?.display_name
        );
      }
      return "";
    };

    return pick(
      value?.name ??
        value?.vedic_name ??
        value?.title ??
        value?.value ??
        value?.label ??
        value?.display_name ??
        value
    );
  }
  return "";
}

function getValue(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const key of keys) {
    if (key in obj) {
      const val = obj[key];
      const text = textOf(val);
      if (text) return text;
    }
  }
  return "";
}

function normalizePanchangData(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  return {
    tithi: getValue(data, ["tithi", "Tithi"]),
    nakshatra: getValue(data, ["nakshatra", "Nakshatra"]),
    karana: getValue(data, ["karana", "karanam", "Karana", "Karanam"]),
    yoga: getValue(data, ["yoga", "Yoga"]),
    shakaSamvat: getValue(data, ["shakaSamvat", "Shaka Samvat", "samvat", "samvatsara"]),
    sunrise: getValue(data, ["sunrise", "Sunrise", "SunriseIso"]),
    sunset: getValue(data, ["sunset", "Sunset", "SunsetIso"]),
    moonrise: getValue(data, ["moonrise", "Moonrise", "MoonriseIso"]),
    moonset: getValue(data, ["moonset", "Moonset", "MoonsetIso"]),
    rahuKalam: getValue(data, ["rahuKalam", "Rahu Kalam", "RahuKalam", "rahu_kalam"]),
    abhijitMuhurat: getValue(data, [
      "abhijitMuhurat",
      "abhijitMuhurtam",
      "abhijit",
      "Abhijit",
      "Abhijit Muhurta",
      "Abhijit Muhurtam",
    ]),
    festivals: Array.isArray(data.Festivals)
      ? data.Festivals.filter(Boolean)
      : Array.isArray(data.festivals)
        ? data.festivals.filter(Boolean)
        : [],
  };
}

function buildFullPanchangReply(p) {
  const lines = [];
  if (p.tithi) lines.push(`Tithi: ${p.tithi}`);
  if (p.nakshatra) lines.push(`Nakshatra: ${p.nakshatra}`);
  if (p.karana) lines.push(`Karana: ${p.karana}`);
  if (p.yoga) lines.push(`Yoga: ${p.yoga}`);
  if (p.sunrise) lines.push(`Sunrise: ${p.sunrise}`);
  if (p.sunset) lines.push(`Sunset: ${p.sunset}`);
  if (p.moonrise) lines.push(`Moonrise: ${p.moonrise}`);
  if (p.moonset) lines.push(`Moonset: ${p.moonset}`);
  if (p.rahuKalam) lines.push(`Rahu Kalam: ${p.rahuKalam}`);
  if (p.abhijitMuhurat) lines.push(`Abhijit Muhurat: ${p.abhijitMuhurat}`);
  if (p.shakaSamvat) lines.push(`Shaka Samvat: ${p.shakaSamvat}`);
  if (p.festivals?.length) lines.push(`Festivals: ${p.festivals.join(", ")}`);
  if (!lines.length) return "I couldn't find Panchang data for today.";
  return lines.join("\n");
}

function buildSingleFieldReply(label, value) {
  if (!value) return null;
  return `Today's ${label} is **${value}**`;
}

function buildSingleFieldReplyForDate(label, value, dateObj) {
  if (!value) return null;
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${label} on **${yyyy}-${mm}-${dd}** is **${value}**`;
}

function buildMonthFestivalReply(items, year, month) {
  if (!items.length) return "No festivals listed for this month.";
  const header = `Festivals in ${String(month).padStart(2, "0")}/${year}`;
  const lines = items.map((item) => `- ${item.date}: ${item.name}`).join("\n");
  return `${header}\n\n${lines}`;
}

async function getMonthFestivals({ year, month }) {
  const map = await loadFestivalMap(year);
  const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-`;
  const out = [];
  for (const [dateKey, names] of Object.entries(map)) {
    if (!String(dateKey).startsWith(prefix) || !Array.isArray(names)) continue;
    names.forEach((name) => {
      if (name == null || name === "") return;
      out.push({ date: String(dateKey), name: String(name) });
    });
  }
  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}

async function getFestivalForDate({ year, month, day }) {
  const map = await loadFestivalMap(year);
  const key = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const list = map[key];
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function normalizeTithiName(text) {
  const base = textOf(text);
  return String(base || "").split(" upto ")[0].split(" Upto ")[0].trim();
}

function getNextWeekdayDate(targetDayIndex) {
  const today = new Date();
  const day = today.getDay();
  let diff = targetDayIndex - day;
  if (diff < 0) diff += 7;
  const date = new Date(today);
  date.setDate(today.getDate() + diff);
  return date;
}

function getThisWeekWeekdayDate(targetDayIndex, weekScope) {
  if (weekScope === "next") return getNextWeekdayDate(targetDayIndex);
  const today = new Date();
  const day = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - day);
  const target = new Date(weekStart);
  target.setDate(weekStart.getDate() + targetDayIndex);
  if (target < today) return getNextWeekdayDate(targetDayIndex);
  return target;
}

async function findNextTithiDate(tithiName) {
  const today = new Date();
  const limitDays = 180;
  for (let i = 0; i <= limitDays; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const yearData = await loadYearData(year);
    if (!yearData.length) continue;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const key = `${dd}/${mm}/${year}`;
    const record = yearData.find((r) => r?.date === key);
    if (!record) continue;
    const tithiText = normalizeTithiName(record?.Tithi);
    if (tithiText.toLowerCase() === String(tithiName || "").toLowerCase()) return date;
  }
  return null;
}

async function getRecordForDate(dateObj) {
  const year = dateObj.getFullYear();
  const yearData = await loadYearData(year);
  if (!yearData.length) return null;
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const key = `${dd}/${mm}/${year}`;
  return yearData.find((r) => r?.date === key) || null;
}

const geminiTools = [
  {
    name: "getPanchangByDate",
    description: "Fetch detailed panchang data (tithi, nakshatra, yoga, karana, timings, etc.) for a specific date.",
    parameters: {
      type: "OBJECT",
      properties: {
        dateString: { type: "STRING", description: "Date in YYYY-MM-DD format" }
      },
      required: ["dateString"]
    }
  },
  {
    name: "findNextTithi",
    description: "Find the next upcoming date for a specific tithi (e.g., Ekadashi, Purnima, Amavasya).",
    parameters: {
      type: "OBJECT",
      properties: {
        tithiName: { type: "STRING", description: "Name of the tithi (e.g. Ekadashi, Pradosham)" }
      },
      required: ["tithiName"]
    }
  },
  {
    name: "getFestivalsForMonth",
    description: "Get all festivals in a specific month and year.",
    parameters: {
      type: "OBJECT",
      properties: {
        year: { type: "INTEGER", description: "Year (e.g. 2026)" },
        month: { type: "INTEGER", description: "Month number (1-12)" }
      },
      required: ["year", "month"]
    }
  }
];

const handleChatbot = async (req, res) => {
  const { message, panchangData, selectedDay, todayDay } = req.body || {};
  const language = String(req.body?.language || "en").trim().toLowerCase();
  const friendMode = Boolean(req.body?.friendMode);

  if (!message || !String(message).trim()) {
    return res.json({ response: "Please ask a question." });
  }

  const msg = String(message).trim();

  // Helper inside handleChatbot to execute tools requested by Gemini
  const toolExecuter = async (name, args) => {
    if (name === "getPanchangByDate") {
      const d = new Date(args.dateString + "T00:00:00");
      if (Number.isNaN(d.getTime())) return { error: "Invalid date format" };
      const record = await getRecordForDate(d);
      if (!record) return { error: "No data found for this date" };
      return normalizePanchangData(record);
    }
    if (name === "findNextTithi") {
      const nextDate = await findNextTithiDate(args.tithiName);
      if (!nextDate) return { error: "Could not find next date for this tithi" };
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
      const dd = String(nextDate.getDate()).padStart(2, "0");
      return { tithi: args.tithiName, nextDate: `${yyyy}-${mm}-${dd}` };
    }
    if (name === "getFestivalsForMonth") {
      const items = await getMonthFestivals({ year: args.year, month: args.month });
      return { year: args.year, month: args.month, festivals: items };
    }
    return { error: "Unknown tool" };
  };

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  if (!hasGeminiKey) {
    return res.json({
      response: "Chatbot is unavailable. Please set GEMINI_API_KEY.",
    });
  }

  try {
    const { buildHoroscopeContext } = await import("../services/rashiphalService.js");
    const horoscopeContext = buildHoroscopeContext({ message: msg, language });

    // Send to Gemini as primary brain
    const response = await askGemini({
      message: msg,
      selectedDay: selectedDay || panchangData || null,
      todayDay: todayDay || null,
      language,
      friendMode,
      horoscopeContext,
      tools: geminiTools,
      toolExecuter,
    });
    return res.json({ response });
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err || "unknown error");
    console.error(`[Chatbot] Gemini API error: ${errMsg}`);
    
    // Offline / Local engine fallback
    try {
      const { processMessage: fallbackProcessMessage } = await import("../services/panchangBotEngine.js");
      const fallbackResult = await fallbackProcessMessage({
         message: msg,
         selectedDay: selectedDay || todayDay || panchangData,
         language,
         friendMode
      });
      return res.json({ 
         response: `*(Offline Warning: Connecting to AI failed. Providing basic local result)*\n\n${fallbackResult.response}`
      });
    } catch (fallbackErr) {
       console.error(`[Chatbot] Fallback error:`, fallbackErr);
       return res.json({ response: OUT_OF_SCOPE_MESSAGE });
    }
  }
};

router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;
