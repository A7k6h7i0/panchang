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
import { askGemini, detectPanchangIntent, parsePanchangQuery } from "../services/geminiChatService.js";

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

function dateFromParser(parsed) {
  if (parsed?.date) {
    const d = new Date(`${parsed.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  if (parsed?.relative) {
    const now = new Date();
    const t = new Date(now);
    if (parsed.relative === "tomorrow") t.setDate(now.getDate() + 1);
    if (parsed.relative === "yesterday") t.setDate(now.getDate() - 1);
    return t;
  }

  if (parsed?.week_day) {
    const idx = WEEKDAYS[String(parsed.week_day || "").toLowerCase()];
    if (Number.isInteger(idx)) return getThisWeekWeekdayDate(idx, parsed.week_scope);
  }

  return null;
}

const handleChatbot = async (req, res) => {
  const { message, panchangData, selectedDay, todayDay } = req.body || {};
  const language = String(req.body?.language || "en").trim().toLowerCase();
  const friendMode = Boolean(req.body?.friendMode);

  if (!message || !String(message).trim()) {
    return res.json({ response: "Please ask a question." });
  }

  const msg = String(message).trim();
  const panchang = normalizePanchangData(panchangData || todayDay || selectedDay);
  const hasData = Object.values(panchang).some((v) => Boolean(v));

  if (!hasData) {
    return res.json({
      response: "Panchang data is not available right now. Please refresh and try again.",
    });
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  if (!hasGeminiKey) {
    return res.json({
      response: "Chatbot intent detection is unavailable. Please set GEMINI_API_KEY.",
    });
  }

  let intent = "unknown";
  let parsed = { intent: "unknown" };
  try {
    const classified = await detectPanchangIntent({ message: msg, language });
    intent = classified.intent || "unknown";
    parsed = await parsePanchangQuery({ message: msg, language });
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err || "unknown error");
    console.error(`[Chatbot] Gemini intent error: ${errMsg}`);
    return res.json({
      response:
        "I'm having trouble contacting the Gemini intent service. Please try again later.",
    });
  }

  if (parsed?.intent && parsed.intent !== "unknown") intent = parsed.intent;

  const contextDate = getContextDate(selectedDay, todayDay);
  const dateFromMessage = dateFromParser(parsed);
  if (intent === "unknown" && dateFromMessage) intent = "panchang_today";

  const handlers = {
    panchang_today: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        if (!record) return { response: "I don't have Panchang data for that date." };
        const normalized = normalizePanchangData(record);
        return { response: buildFullPanchangReply(normalized) };
      }
      return { response: buildFullPanchangReply(panchang) };
    },
    tithi: async () => {
      if (parsed?.wants_next_tithi && parsed?.tithi_name) {
        const nextDate = await findNextTithiDate(parsed.tithi_name);
        if (!nextDate) return { response: `I couldn't find the next ${parsed.tithi_name} in the available data.` };
        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
        const dd = String(nextDate.getDate()).padStart(2, "0");
        return { response: `Next ${parsed.tithi_name} is on **${yyyy}-${mm}-${dd}**` };
      }
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = normalizeTithiName(record?.Tithi);
        const reply = buildSingleFieldReplyForDate("Tithi", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Tithi", panchang.tithi) };
    },
    nakshatra: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.Nakshatra);
        const reply = buildSingleFieldReplyForDate("Nakshatra", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Nakshatra", panchang.nakshatra) };
    },
    karana: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.Karanam || record?.Karana);
        const reply = buildSingleFieldReplyForDate("Karana", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Karana", panchang.karana) };
    },
    yoga: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.Yoga);
        const reply = buildSingleFieldReplyForDate("Yoga", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Yoga", panchang.yoga) };
    },
    sunrise: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.Sunrise || record?.SunriseIso);
        const reply = buildSingleFieldReplyForDate("Sunrise", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Sunrise", panchang.sunrise) };
    },
    sunset: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.Sunset || record?.SunsetIso);
        const reply = buildSingleFieldReplyForDate("Sunset", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Sunset", panchang.sunset) };
    },
    rahukalam: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.["Rahu Kalam"] || record?.RahuKalam || record?.rahuKalam);
        const reply = buildSingleFieldReplyForDate("Rahu Kalam", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Rahu Kalam", panchang.rahuKalam) };
    },
    muhurat: async () => {
      if (dateFromMessage) {
        const record = await getRecordForDate(dateFromMessage);
        const value = textOf(record?.Abhijit || record?.abhijit || record?.["Abhijit Muhurta"]);
        const reply = buildSingleFieldReplyForDate("Muhurat", value, dateFromMessage);
        if (reply) return { response: reply };
        return { response: "I don't have Panchang data for that date." };
      }
      return { response: buildSingleFieldReply("Muhurat", panchang.abhijitMuhurat) };
    },
    festival_today: async () => {
      const dateForFest = dateFromMessage
        ? { day: dateFromMessage.getDate(), month: dateFromMessage.getMonth() + 1, year: dateFromMessage.getFullYear() }
        : contextDate;

      let festivals = panchang.festivals;
      if (!festivals?.length) {
        festivals = await getFestivalForDate(dateForFest);
      }
      if (!festivals?.length) {
        return { response: "No festivals listed for today." };
      }
      if (dateFromMessage) {
        const yyyy = dateFromMessage.getFullYear();
        const mm = String(dateFromMessage.getMonth() + 1).padStart(2, "0");
        const dd = String(dateFromMessage.getDate()).padStart(2, "0");
        return { response: `Festivals on **${yyyy}-${mm}-${dd}** are **${festivals.join(", ")}**` };
      }
      return { response: `Today's festivals are **${festivals.join(", ")}**` };
    },
    festival_month: async () => {
      const source = dateFromMessage
        ? { year: dateFromMessage.getFullYear(), month: dateFromMessage.getMonth() + 1 }
        : contextDate;
      const items = await getMonthFestivals(source);
      return { response: buildMonthFestivalReply(items, source.year, source.month) };
    },
  };

  const handler = handlers[intent];
  if (handler) {
    const out = await handler();
    if (out?.response) return res.json(out);
  }

  try {
    const response = await askGemini({
      message: msg,
      selectedDay: selectedDay || null,
      todayDay: todayDay || null,
      language,
      friendMode,
    });
    return res.json({ response });
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err || "unknown error");
    console.error(`[Chatbot] Gemini response error: ${errMsg}`);
    return res.json({ response: OUT_OF_SCOPE_MESSAGE });
  }
};

router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;
