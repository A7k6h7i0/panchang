import express from "express";
import { askGemini } from "../services/geminiChatService.js";
import {
  buildExplainFallback,
  getDailyGita,
  getGitaChapter,
  getGitaIndex,
  getGitaVerse,
  getRecommendations,
  searchGitaVerses,
} from "../services/gitaService.js";

const router = express.Router();

router.get("/index", async (req, res) => {
  try {
    const index = await getGitaIndex();
    res.json({ success: true, data: index });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to load Gita index" });
  }
});

router.get("/daily", async (req, res) => {
  try {
    const data = await getDailyGita({
      date: req.query.date,
      time: req.query.time,
      mood: req.query.mood,
      mode: req.query.mode,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to load daily Gita sloka" });
  }
});

router.get("/recommend", async (req, res) => {
  try {
    const data = await getRecommendations({
      date: req.query.date,
      time: req.query.time,
      mood: req.query.mood,
      count: req.query.count,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to load recommendations" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const data = await searchGitaVerses(req.query.q || "");
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to search Gita slokas" });
  }
});

router.get("/chapter/:chapter", async (req, res) => {
  try {
    const chapter = Number(req.params.chapter);
    if (!Number.isFinite(chapter)) {
      return res.status(400).json({ success: false, error: "Invalid chapter" });
    }

    const data = await getGitaChapter(chapter);
    if (!data) {
      return res.status(404).json({ success: false, error: "Chapter not found" });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to load chapter" });
  }
});

router.get("/:chapter/:verse", async (req, res) => {
  try {
    const chapter = Number(req.params.chapter);
    const verse = Number(req.params.verse);
    if (!Number.isFinite(chapter) || !Number.isFinite(verse)) {
      return res.status(400).json({ success: false, error: "Invalid chapter or verse" });
    }

    const data = await getGitaVerse(chapter, verse);
    if (!data) {
      return res.status(404).json({ success: false, error: "Sloka not found" });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to load sloka" });
  }
});

router.post("/explain", async (req, res) => {
  try {
    const verse = req.body?.verse || {};
    const mood = String(req.body?.mood || "").trim();
    const supportedLanguages = new Set(["en", "te", "hi", "ta", "kn", "ml"]);
    const language = supportedLanguages.has(String(req.body?.language || "").trim().toLowerCase())
      ? String(req.body.language).trim().toLowerCase()
      : "te";

    const languageGuide = {
      en: {
        name: "English",
        sections: ["1. Verse", "2. Word Meaning", "3. Simple Meaning", "4. Detailed Explanation", "5. Key Message"],
        instruction: "Write in simple, natural English.",
      },
      te: {
        name: "Telugu",
        sections: ["1. శ్లోకం", "2. పదార్థం", "3. సరళమైన అర్థం", "4. వివరణ", "5. ముఖ్య సందేశం"],
        instruction: "Write in simple, natural Telugu.",
      },
      hi: {
        name: "Hindi",
        sections: ["1. श्लोक", "2. शब्दार्थ", "3. सरल अर्थ", "4. विस्तृत व्याख्या", "5. मुख्य संदेश"],
        instruction: "Write in simple, natural Hindi.",
      },
      ta: {
        name: "Tamil",
        sections: ["1. ஸ்லோகம்", "2. சொற்பொருள்", "3. எளிய பொருள்", "4. விரிவான விளக்கம்", "5. முக்கிய செய்தி"],
        instruction: "Write in simple, natural Tamil.",
      },
      kn: {
        name: "Kannada",
        sections: ["1. ಶ್ಲೋಕ", "2. ಪದಾರ್ಥ", "3. ಸರಳ ಅರ್ಥ", "4. ವಿವರವಾದ ವಿವರಣೆ", "5. ಮುಖ್ಯ ಸಂದೇಶ"],
        instruction: "Write in simple, natural Kannada.",
      },
      ml: {
        name: "Malayalam",
        sections: ["1. ശ്ലോകം", "2. പദാർത്ഥം", "3. ലളിതമായ അർത്ഥം", "4. വിശദമായ വിശദീകരണം", "5. പ്രധാന സന്ദേശം"],
        instruction: "Write in simple, natural Malayalam.",
      },
    };

    const guide = languageGuide[language] || languageGuide.te;

    const prompt = `
You are a Bhagavad Gita expert.

STRICT RULES:
- Always give COMPLETE answers, never stop mid sentence
- Keep the response within 300-400 words
- Use clear structured format
- Always finish with a proper conclusion
- Adapt the explanation to the given mood when relevant
- Respond fully in ${guide.name}

RESPONSE FORMAT:
${guide.sections.join("\n")}

${guide.instruction} Keep each section short and clear.
If the response is long, summarize carefully but do not cut abruptly.

Verse:
Chapter ${verse.chapter}, Verse ${verse.verse}
Sanskrit: ${verse.slok || ""}
Transliteration: ${verse.transliteration || ""}
Meaning: ${verse.meaning || ""}
Mood: ${mood || "neutral"}
Language: ${language}
`.trim();

    try {
      const text = await askGemini({
        message: prompt,
        language,
        friendMode: true,
      });

      res.json({ success: true, data: { explanation: text } });
    } catch (error) {
      res.json({
        success: true,
        data: { explanation: buildExplainFallback({ verse, mood, language }) },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to explain sloka" });
  }
});

export default router;
