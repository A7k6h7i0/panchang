/**
 * geminiChatService.js
 * Panchang Chatbot powered by Google Gemini 2.5 Flash.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { GoogleGenAI } = require("@google/genai");

let _ai = null;
function getAI() {
    if (!_ai) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env");
        _ai = new GoogleGenAI({ apiKey });
    }
    return _ai;
}

function formatDate(d) {
    return d.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

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

## YOUR ROLE (Critical)
You act as the main brain. You MUST use the provided function tools to fetch local database information (e.g., today's tithi, next ekadashi, festivals) to ensure 100% accurate responses.

Your expertise covers:
- Core panchang parameters (Tithi, Nakshatra, Yoga, Karana, Timings)
- Hindu festivals, vratas, traditions, and spirituality
- Vedic astrology and Muhurat recommendations

## DATE GROUNDING
- **Today is: ${todayStr}**
- When the user says "today", they mean **${todayStr}**.
- If context data is provided below, you can use it, but prefer calling tools if the exact data isn't in the context.

## RESPONSE RULES
1. **Language:** ALWAYS respond in ${langName}. If you fetch data from tools in English, translate the response to ${langName} before giving it to the user.
2. **Formatting:** Answer naturally first, then provide the data! Use rich **Markdown** (bolding, lists, clean spacing) and elegant emojis. Do NOT output plain messy text.
3. **Tone:** ${tone}
4. **Tool Priority:** If the user asks for information like "When is the next Ekadashi?", immediately call the \`findNextTithi\` tool. NEVER GUESS dates. If the user asks if tomorrow is good for business, use the \`getPanchangByDate\` tool for tomorrow to find timings.
5. **No Hallucinations:** Do not invent calendar dates if a tool fails to find them.`;
}

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
    if (todayDay) ctx += buildDayBlock("📅 Today's Panchang Data", todayDay);
    if (selectedDay) {
        const isToday = todayDay && selectedDay.date === todayDay.date;
        if (!isToday) ctx += buildDayBlock("📆 Selected Date Panchang Data", selectedDay);
    }
    if (!ctx) return "";
    return `\n\n---\n## Pre-loaded Context Data\n${ctx}---\n`;
}

export async function askGemini({
    message,
    selectedDay = null,
    todayDay = null,
    language = "en",
    friendMode = false,
    horoscopeContext = "",
    tools = [],
    toolExecuter = null,
}) {
    const todayStr = formatDate(new Date());

    const systemInstruction = buildSystemPrompt(language, friendMode, todayStr);
    const context = buildContext(selectedDay, todayDay);

    const blocks = [String(message || "").trim()];
    if (context) blocks.push(context);
    if (horoscopeContext) blocks.push(`\n## Horoscope Context Data\n${horoscopeContext}\n`);
    
    const userContent = blocks.filter(Boolean).join("\\n\\n");
    const contents = [{ role: "user", parts: [{ text: userContent }] }];

    const config = {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 1500,
        tools: tools && tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
    };

    let response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config,
    });

    let loopCount = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 3) {
        loopCount++;
        contents.push(response.candidates[0].content);
        
        const toolResponses = [];
        for (const call of response.functionCalls) {
            console.log(`[Gemini] Calling Tool: ${call.name} with args`, call.args);
            try {
                const rawResult = await toolExecuter(call.name, call.args);
                toolResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { result: rawResult }
                    }
                });
            } catch (err) {
                console.error(`[Gemini] Tool ${call.name} failed:`, err.message);
                toolResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { error: err.message }
                    }
                });
            }
        }
        contents.push({ role: "user", parts: toolResponses });
        
        response = await getAI().models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config,
        });
    }

    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from Gemini");
    return text;
}
