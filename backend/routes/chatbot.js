/**
 * chatbot.js - Panchang-only Chatbot Router
 *
 * Requirements:
 *  - ALWAYS use provided Panchang JSON data
 *  - NEVER generate Panchang values
 *  - Answer only Panchang-related questions
 */
import express from "express";

const router = express.Router();

const OUT_OF_SCOPE_MESSAGE =
  "I'm sorry, I currently provide information only about today's Panchang such as Tithi, Nakshatra, Karana, Sunrise, Sunset, and Muhurat timings.";

const GREETING_WORDS = new Set([
  "hi",
  "hello",
  "hey",
  "namaste",
  "namaskar",
  "greetings",
  "good",
  "morning",
  "afternoon",
  "evening",
  "day",
]);

const PANCHANG_KEYWORDS = [
  "tithi",
  "nakshatra",
  "karana",
  "karanam",
  "yoga",
  "sunrise",
  "sunset",
  "moonrise",
  "moonset",
  "rahu",
  "rahukalam",
  "rahu kalam",
  "muhurat",
  "muhurt",
  "abhijit",
  "samvat",
  "shaka",
  "panchang",
];

function normalizeMessage(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStandaloneGreeting(message) {
  const normalized = normalizeMessage(message);
  if (!normalized) return false;
  const words = normalized.split(" ");
  return words.every((w) => GREETING_WORDS.has(w));
}

function hasPanchangKeyword(message) {
  const normalized = normalizeMessage(message);
  return PANCHANG_KEYWORDS.some((k) => normalized.includes(k));
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      String(
        value?.name ??
          value?.vedic_name ??
          value?.title ??
          value?.value ??
          value?.label ??
          value?.display_name ??
          ""
      ).trim()
    );
  }
  return "";
}

function firstText(...values) {
  for (const v of values) {
    const t = textOf(v);
    if (t) return t;
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
  };
}

function buildFullPanchangReply(p) {
  const lines = [];
  if (p.tithi) lines.push(`🌙 **Tithi:** ${p.tithi}`);
  if (p.nakshatra) lines.push(`⭐ **Nakshatra:** ${p.nakshatra}`);
  if (p.karana) lines.push(`🔷 **Karana:** ${p.karana}`);
  if (p.yoga) lines.push(`🕉️ **Yoga:** ${p.yoga}`);
  if (p.sunrise) lines.push(`🌅 **Sunrise:** ${p.sunrise}`);
  if (p.sunset) lines.push(`🌇 **Sunset:** ${p.sunset}`);
  if (p.moonrise) lines.push(`🌙 **Moonrise:** ${p.moonrise}`);
  if (p.moonset) lines.push(`🌘 **Moonset:** ${p.moonset}`);
  if (p.rahuKalam) lines.push(`⚠️ **Rahu Kalam:** ${p.rahuKalam}`);
  if (p.abhijitMuhurat) lines.push(`✅ **Abhijit Muhurat:** ${p.abhijitMuhurat}`);
  if (p.shakaSamvat) lines.push(`📜 **Shaka Samvat:** ${p.shakaSamvat}`);
  if (!lines.length) return "I couldn't find Panchang data for today.";
  return lines.join("\n");
}

function buildSingleFieldReply(icon, label, value) {
  if (!value) return "I don't have that value in today's Panchang data.";
  return `${icon} Today's ${label} is **${value}**`;
}

function detectIntent(msg) {
  const m = normalizeMessage(msg);
  if (isStandaloneGreeting(m)) return "greeting";
  if (/\b(tithi|thithi)\b/.test(m)) return "tithi";
  if (/\b(nakshatra|nakshatram)\b/.test(m)) return "nakshatra";
  if (/\b(karana|karanam)\b/.test(m)) return "karana";
  if (/\b(yoga)\b/.test(m)) return "yoga";
  if (/\b(sunrise|sun rise)\b/.test(m)) return "sunrise";
  if (/\b(sunset|sun set)\b/.test(m)) return "sunset";
  if (/\b(moonrise|moon rise)\b/.test(m)) return "moonrise";
  if (/\b(moonset|moon set)\b/.test(m)) return "moonset";
  if (/\b(rahu|rahukalam|rahu kalam)\b/.test(m)) return "rahu";
  if (/\b(abhijit|muhurat|muhurt)\b/.test(m)) return "abhijit";
  if (/\b(shaka|samvat)\b/.test(m)) return "shaka";
  if (/\b(good time|auspicious)\b/.test(m)) return "good_time";
  if (/\b(inauspicious|bad time|avoid)\b/.test(m)) return "bad_time";
  if (/\b(panchang|panchanga|today)\b/.test(m)) return "full";
  return "unknown";
}

const handleChatbot = (req, res) => {
  const { message, panchangData, selectedDay, todayDay } = req.body || {};

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

  const intent = detectIntent(msg);

  if (intent === "greeting") {
    return res.json({ response: "🙏 Hello! Ask me about today's Panchang." });
  }

  if (!hasPanchangKeyword(msg) && intent === "unknown") {
    return res.json({ response: OUT_OF_SCOPE_MESSAGE });
  }

  switch (intent) {
    case "tithi":
      return res.json({ response: buildSingleFieldReply("🌙", "Tithi", panchang.tithi) });
    case "nakshatra":
      return res.json({ response: buildSingleFieldReply("⭐", "Nakshatra", panchang.nakshatra) });
    case "karana":
      return res.json({ response: buildSingleFieldReply("🔷", "Karana", panchang.karana) });
    case "yoga":
      return res.json({ response: buildSingleFieldReply("🕉️", "Yoga", panchang.yoga) });
    case "sunrise":
      return res.json({ response: buildSingleFieldReply("🌅", "Sunrise", panchang.sunrise) });
    case "sunset":
      return res.json({ response: buildSingleFieldReply("🌇", "Sunset", panchang.sunset) });
    case "moonrise":
      return res.json({ response: buildSingleFieldReply("🌙", "Moonrise", panchang.moonrise) });
    case "moonset":
      return res.json({ response: buildSingleFieldReply("🌘", "Moonset", panchang.moonset) });
    case "rahu":
      return res.json({
        response: buildSingleFieldReply("⚠️", "Rahu Kalam", panchang.rahuKalam),
      });
    case "abhijit":
      return res.json({
        response: buildSingleFieldReply("✅", "Abhijit Muhurat", panchang.abhijitMuhurat),
      });
    case "shaka":
      return res.json({
        response: buildSingleFieldReply("📜", "Shaka Samvat", panchang.shakaSamvat),
      });
    case "good_time":
      return res.json({
        response: buildSingleFieldReply("✅", "Good time", panchang.abhijitMuhurat),
      });
    case "bad_time":
      return res.json({
        response: buildSingleFieldReply("⚠️", "Inauspicious time", panchang.rahuKalam),
      });
    case "full":
      return res.json({ response: buildFullPanchangReply(panchang) });
    default:
      return res.json({ response: OUT_OF_SCOPE_MESSAGE });
  }
};

router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;

