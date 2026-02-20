/**
 * chatbot.js — Chatbot router
 * Now powered by the self-contained panchangBotEngine (no external AI API needed)
 */
import express from "express";
import { processMessage } from "../services/panchangBotEngine.js";

const router = express.Router();

const handleChatbot = async (req, res) => {
  try {
    const { message, selectedDay, mode, language = "en", friendMode = false } = req.body;

    if (!message || !String(message).trim()) {
      return res.json({ response: "Please ask a question." });
    }

    if (mode === "rashiphalalu") {
      return res.json({ response: "Please switch to Panchang mode to ask Panchang questions." });
    }

    const result = await processMessage({
      message: String(message).trim(),
      selectedDay,
      language,
      friendMode,
    });

    return res.json({ response: result.response });

  } catch (error) {
    console.error("Chatbot error:", error.message || error);
    return res.status(500).json({ response: "I'm having trouble processing that. Please try again!" });
  }
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────
router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;
