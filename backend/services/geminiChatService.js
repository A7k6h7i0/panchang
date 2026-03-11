/**
 * geminiChatService.js
 * Panchang Chatbot powered by Google Gemini 2.5 Flash.
 *
 * KEY DESIGN DECISIONS:
 * - Injects BOTH "today's real date" AND "selected calendar date" so Gemini
 *   never confuses them — "today" questions always use the real server date.
 * - Strict anti-hallucination rules: Gemini must NOT invent specific tithi/
 *   festival dates it doesn't have. It should say it doesn't know.
 */

import { createRequire } from "node:module";

// @google/genai ships a CJS entry we can load via createRequire in ESM.
const require = createRequire(import.meta.url);
const { GoogleGenAI } = require("@google/genai");

// Lazy singleton — created on first use so dotenv has already run by then
let _ai = null;
function getAI() {
    if (!_ai) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env");
        _ai = new GoogleGenAI({ apiKey });
    }
    return _ai;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Format a JS Date as "Monday, 23 February 2026" */
function formatDate(d) {
    return d.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

function buildSystemPrompt(language, friendMode, todayStr) {
    const langName = {
        en: "English",
        te: "Telugu",
        hi: "Hindi",
        ml: "Malayalam",
        kn: "Kannada",
        ta: "Tamil",
    }[language] || "English";

    const tone = friendMode
        ? "You are a friendly, casual assistant — like a knowledgeable friend. Use warm language and a conversational tone."
        : "You are a polite and helpful expert assistant. Be respectful, clear, and thorough.";

    return `You are **PanchangBot**, an expert AI assistant for Hindu Panchang, Vedic astrology, and Indian spirituality.

## YOUR ROLE (Critical — read carefully)
You are the **knowledge and explanation** layer of a hybrid chatbot system. A separate rule-based engine handles all direct data lookups (today's tithi, nakshatra, timings, "when is next Ekadashi", festival dates, etc.) using an authoritative local database.

**You will ONLY be called for questions that need deep explanation, contextual knowledge, or concepts — NOT for specific date lookups.**

Your expertise covers:
- Deep explanations of Panchang concepts (Tithi, Nakshatra, Yoga, Karanam, Paksha — their meaning, significance, calculation)
- Hindu festivals and vratas — spiritual significance, stories, how to observe them, traditions
- Vedic astrology concepts (Navagrahas, Rashifal/horoscope concepts, Lagna, Dasha systems, birth chart basics)
- Regional Hindu calendars (Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali traditions)
- Muhurta concepts — what makes a time auspicious, how to choose muhurta for events
- Hindu spirituality, dharma, karma, pilgrimage, puja vidhi, mantra significance
- Hindu months (Chaitra, Vaishakha, Magha etc.) — their significance and observances
- General Hindu culture and traditions

## DATE GROUNDING (Always follow)
- **Today is: ${todayStr}**
- If the user's message includes "Panchang Context Data" below, use those values ONLY for that specific date.
- When the user says "today", "aaj", "ఈ రోజు" or equivalent, they mean **${todayStr}**.
- "Selected Calendar Date" data is NOT today unless the date matches ${todayStr}.

## STRICT ANTI-HALLUCINATION RULES
- **NEVER invent or calculate specific calendar dates** for upcoming tithis, nakshatras, festivals, or Ekadashi dates.
- If someone asks "when is Ekadashi?" or "when is Diwali?", do NOT give a specific date unless it appears in the provided Panchang Context Data. Instead explain what it is and tell the user the app's calendar can show exact dates.
- You MAY explain WHAT a festival/tithi is, its significance, which lunar month it generally falls in — without specifying a Gregorian date.
- If context data provides a date, you may reference it. Otherwise, acknowledge you don't have calendar data for that query.

## RESPONSE RULES
1. **Language:** Always respond in ${langName}.
2. **Tone:** ${tone}
3. **Formatting:** Use relevant emojis (🙏 🌙 ⭐ 🕉️ 🎉 🌅 ⚠️ ✅), clear headings, and bullet points for clarity.
4. **Accuracy:** Only use provided panchang context for date-specific values. Don't guess numbers.
5. **Depth:** Give rich, educational, engaging answers. Don't be shallow — users want to learn.
6. **Scope:** For topics completely unrelated to Hindu culture, panchang, or Indian traditions, politely say: "I specialize in panchang and Hindu topics. Please ask me about those! 🙏"
7. **Typos:** If the user makes spelling mistakes (example: "thithi", "ekadahi"), infer the most likely panchang term and answer. If ambiguous, ask one short clarification question.`;
}

// ─── CONTEXT BUILDER ──────────────────────────────────────────────────────────

function buildDayBlock(label, day) {
    if (!day) return "";

    const formatValue = (value) => {
        if (value == null) return "";
        if (Array.isArray(value)) return value.filter(Boolean).join(", ");
        if (typeof value === "string" || typeof value === "number") return String(value).trim();
        if (typeof value === "object") {
            const name = value?.name || value?.title || value?.label || value?.value || value?.display_name || "";
            const start = value?.start || value?.begin || value?.from || "";
            const end = value?.end || value?.to || "";
            const timeRange = start && end ? `${start} to ${end}` : start || end;
            if (name && timeRange) return `${name} (${timeRange})`;
            if (name) return String(name).trim();
        }
        return String(value || "").trim();
    };

    const fields = [
        ["Date", formatValue(day.date)],
        ["Day of Week", formatValue(day.day)],
        ["Paksha", formatValue(day.Paksha)],
        ["Tithi", formatValue(day.Tithi)],
        ["Nakshatra", formatValue(day.Nakshatra)],
        ["Yoga", formatValue(day.Yoga)],
        ["Karanam", formatValue(day.Karanam || day.Karana)],
        ["Sunrise", formatValue(day.Sunrise)],
        ["Sunset", formatValue(day.Sunset)],
        ["Rahu Kalam", formatValue(day["Rahu Kalam"])],
        ["Yamaganda", formatValue(day.Yamaganda)],
        ["Gulikai Kalam", formatValue(day["Gulikai Kalam"])],
        ["Abhijit Muhurtham", formatValue(day.Abhijit)],
        ["Amrit Kalam", formatValue(day["Amrit Kalam"] || day["Amritha Kalam"])],
        ["Dur Muhurtam", formatValue(day["Dur Muhurtam"])],
        ["Varjyam", formatValue(day.Varjyam)],
        ["Lunar Month", formatValue(day["Lunar Month"])],
        ["Shaka Samvat", formatValue(day["Shaka Samvat"])],
        ["Festivals", formatValue(day.Festivals)],
    ];

    const lines = fields
        .filter(([, v]) => v && v !== "—" && v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n");

    if (!lines) return "";

    return `\n### ${label}\n${lines}\n`;
}

function buildContext(selectedDay, todayDay) {
    let ctx = "";

    // Today's panchang (if available and if selectedDay is actually today)
    if (todayDay) {
        ctx += buildDayBlock("📅 Today's Panchang Data", todayDay);
    }

    // Selected calendar day (always included if different from today)
    if (selectedDay) {
        const isToday = todayDay && selectedDay.date === todayDay.date;
        const label = isToday
            ? "📅 Today's Panchang Data"
            : "📆 Selected Calendar Date Panchang Data (NOT today — only use this when user asks about this specific date)";

        if (!todayDay) {
            ctx += buildDayBlock(label, selectedDay);
        } else if (!isToday) {
            ctx += buildDayBlock(label, selectedDay);
        }
    }

    if (!ctx) return "";

    return `\n\n---\n## Panchang Context Data\n${ctx}---\n`;
}

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

/**
 * Ask Gemini a panchang-related question.
 * @param {object} params
 * @param {string}      params.message      User's message
 * @param {object|null} params.selectedDay  Panchang data for the calendar-selected day
 * @param {object|null} params.todayDay     Panchang data for actual today (optional, same shape)
 * @param {string}      params.language     Language code: en | te | hi | ml | kn | ta
 * @param {boolean}     params.friendMode   Casual (true) or formal (false) tone
 * @returns {Promise<string>} Bot response text
 */
export async function askGemini({
    message,
    selectedDay = null,
    todayDay = null,
    language = "en",
    friendMode = false,
    horoscopeContext = "",
}) {
    // Always use real server time for today's date string
    const todayStr = formatDate(new Date());

    const systemPrompt = buildSystemPrompt(language, friendMode, todayStr);
    const context = buildContext(selectedDay, todayDay);

    const blocks = [String(message || "").trim()];
    if (context) blocks.push(context);
    if (horoscopeContext) {
        blocks.push(`\n## Horoscope Context Data\n${horoscopeContext}\n`);
    }
    const userContent = blocks.filter(Boolean).join("\n\n");

    const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [{ text: userContent }],
            },
        ],
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,   // Lower = more factual, less hallucination
            maxOutputTokens: 1500,
        },
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from Gemini");
    return text;
}

/**
 * Use Gemini to classify a user message into a Panchang intent.
 * The model MUST return ONLY the intent name (plain text).
 */
export async function detectPanchangIntent({ message, language = "en" }) {
    const systemPrompt = `
You are a strict intent classifier for a Panchang chatbot.

Return ONLY the intent name (no JSON, no markdown, no extra text).
Valid intents:
  ["tithi","nakshatra","yoga","karana","rahukalam","sunrise","sunset","panchang_today","festival_today","festival_month","muhurat","unknown"]

Rules:
- Handle spelling mistakes and broken English.
- If uncertain, use "unknown".
- If the user asks for festivals in a month (e.g., "this month festivals"), use "festival_month".
- If the user asks for a date-specific tithi (e.g., "tithi on 20th March" or "next Ekadashi"), use "tithi".

User language: ${language}
`;

    const userContent = String(message || "").trim();
    const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            maxOutputTokens: 100,
        },
    });

    const raw = response.text?.trim() || "";
    if (!raw) throw new Error("Empty response from Gemini intent classifier");

    const firstLine = raw.split("\n")[0]?.trim() || raw.trim();
    const cleaned = firstLine
        .split("")
        .filter((ch) => {
            const code = ch.charCodeAt(0);
            const isUpper = code >= 65 && code <= 90;
            const isLower = code >= 97 && code <= 122;
            return isUpper || isLower || ch === "_";
        })
        .join("")
        .toLowerCase();

    const aliases = new Map([
        ["rahu_kalam", "rahukalam"],
        ["rahukalam", "rahukalam"],
        ["rahukalamtime", "rahukalam"],
        ["panchang", "panchang_today"],
        ["panchangtoday", "panchang_today"],
        ["todaypanchang", "panchang_today"],
        ["festival", "festival_today"],
        ["festivals", "festival_today"],
        ["todayfestival", "festival_today"],
        ["todayfestivals", "festival_today"],
        ["festivalmonth", "festival_month"],
        ["monthfestival", "festival_month"],
        ["monthfestivals", "festival_month"],
        ["thismonthfestival", "festival_month"],
        ["thismonthfestivals", "festival_month"],
        ["abhijitmuhurat", "muhurat"],
        ["muhurat", "muhurat"],
        ["muhurta", "muhurat"],
    ]);

    const normalized = aliases.get(cleaned) || cleaned;
    const allowed = new Set([
        "tithi",
        "nakshatra",
        "yoga",
        "karana",
        "rahukalam",
        "sunrise",
        "sunset",
        "panchang_today",
        "festival_today",
        "muhurat",
        "festival_month",
        "unknown",
    ]);

    if (allowed.has(normalized)) return { intent: normalized };

    const rawLower = raw.toLowerCase();
    for (const [alias, intent] of aliases.entries()) {
        if (rawLower.includes(alias)) return { intent };
    }
    for (const intent of allowed) {
        if (rawLower.includes(intent)) return { intent };
    }

    return { intent: "unknown" };
}

/**
 * Parse a Panchang user query into structured parameters using Gemini.
 * The model MUST return ONLY JSON.
 */
export async function parsePanchangQuery({ message, language = "en" }) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayIso = `${yyyy}-${mm}-${dd}`;

    const systemPrompt = `
You are a strict query parser for a Panchang chatbot.

Return ONLY a JSON object with these fields (no markdown, no extra text):
{
  "intent": "tithi|nakshatra|yoga|karana|rahukalam|sunrise|sunset|panchang_today|festival_today|festival_month|muhurat|unknown",
  "date": "YYYY-MM-DD or null",
  "relative": "today|tomorrow|yesterday|null",
  "week_day": "sunday|monday|tuesday|wednesday|thursday|friday|saturday|null",
  "week_scope": "this|next|null",
  "wants_next_tithi": true|false,
  "tithi_name": "Ekadashi|Dwadashi|Purnima|Amavasya|etc or null"
}

Rules:
- Today is ${todayIso}.
- If user asks for a specific date like "20th March" or "Sept 1st", set date in YYYY-MM-DD.
- If user says "today/tomorrow/yesterday", set relative.
- If user says "this week Friday" or "next Friday", set week_day and week_scope.
- If user asks "when is next Ekadashi", set wants_next_tithi=true and tithi_name="Ekadashi".
- If user asks for month festivals like "this month festivals", set intent="festival_month".
- If unsure, use nulls and intent="unknown".

User language: ${language}
`;

    const userContent = String(message || "").trim();
    const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            maxOutputTokens: 120,
        },
    });

    const text = response.text?.trim() || "";
    if (!text) throw new Error("Empty response from Gemini query parser");

    let parsed = null;
    try {
        parsed = JSON.parse(text);
    } catch {
        parsed = null;
    }

    const safe = parsed && typeof parsed === "object" ? parsed : {};
    return {
        intent: String(safe.intent || "unknown"),
        date: safe.date || null,
        relative: safe.relative || null,
        week_day: safe.week_day || null,
        week_scope: safe.week_scope || null,
        wants_next_tithi: Boolean(safe.wants_next_tithi),
        tithi_name: safe.tithi_name || null,
    };
}

