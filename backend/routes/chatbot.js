/**
 * chatbot.js — Hybrid Chatbot Router
 *
 * Routing strategy (intent-first):
 *  1. Detect intent from the user message using panchangBotEngine's detectIntent.
 *  2. If intent is "unknown" → skip the engine entirely, go straight to Gemini.
 *     Gemini handles: general knowledge, significance/explanation, vrat stories,
 *     rashifal concepts, graha info, Hindu culture/spirituality.
 *  3. Otherwise → panchangBotEngine handles the query using REAL local JSON data.
 *     No hallucination possible for data queries.
 *
 * This prevents Gemini from ever inventing specific tithi/nakshatra/festival dates.
 */
import express from "express";
import { processMessage, detectIntent } from "../services/panchangBotEngine.js";
import { askGemini } from "../services/geminiChatService.js";

const router = express.Router();

/** Get today's date string in DD/MM/YYYY (matches panchang record format) */
function getTodayKey() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const handleChatbot = async (req, res) => {
  try {
    const {
      message,
      selectedDay,
      todayDay,          // frontend sends today's panchang data separately
      mode,
      language = "en",
      friendMode = false,
    } = req.body;

    if (!message || !String(message).trim()) {
      return res.json({ response: "Please ask a question." });
    }

    const msg = String(message).trim();
    const todayKey = getTodayKey();

    // Resolve todayDay: use explicit, or check if selectedDay IS today
    let resolvedTodayDay = todayDay || null;
    if (!resolvedTodayDay && selectedDay?.date === todayKey) {
      resolvedTodayDay = selectedDay;
    }

    // ── STEP 1: Detect intent (fast, synchronous) ─────────────────────────────
    const intent = detectIntent(msg);

    // ── STEP 2: Route based on intent ─────────────────────────────────────────
    if (intent === "unknown") {
      // "unknown" means the engine can't classify the query — it's likely a
      // general knowledge / explanation / cultural question.
      // Let Gemini handle this (it won't return a date since these questions
      // don't ask for specific date lookups, and the system prompt forbids it).
      const geminiResponse = await askGemini({
        message: msg,
        selectedDay: selectedDay || null,
        todayDay: resolvedTodayDay,
        language,
        friendMode,
      });
      return res.json({ response: geminiResponse });
    }

    // ── STEP 3: Rule-based engine — uses REAL local JSON data ─────────────────
    // For "today" queries, always pass today's actual record (not the selected date)
    // so "nakshatra today" returns today's data even if user selected another date.
    const engineSelectedDay = resolvedTodayDay || selectedDay;

    const engineResult = await processMessage({
      message: msg,
      selectedDay: engineSelectedDay,
      language,
      friendMode,
    });

    return res.json({ response: engineResult.response });

  } catch (error) {
    console.error("Chatbot error:", error.message || error);
    // Final safety net: try Gemini
    try {
      const { message, selectedDay, todayDay, language = "en", friendMode = false } = req.body;
      const fallback = await askGemini({ message: String(message).trim(), selectedDay, todayDay, language, friendMode });
      return res.json({ response: fallback });
    } catch {
      return res.status(500).json({
        response: "I'm having trouble right now. Please try again in a moment! 🙏",
      });
    }
  }
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────
router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;
