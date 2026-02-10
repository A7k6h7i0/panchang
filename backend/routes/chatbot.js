import express from "express";

const router = express.Router();

const MISSING_INFO =
  "This information is currently unavailable in the Panchang data. Our team is working to add this in an upcoming update.";
const ONLY_PANCHANG =
  "I can answer only Panchang-related questions. Please ask about tithi, nakshatra, yogam, karanam, auspicious or inauspicious timings, or whether the day is good for starting new work.";

const containsWord = (text, word) =>
  new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
    text
  );

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

const extractTithiName = (tithiText) => {
  if (!tithiText) return null;
  return tithiText
    .split(/[,(]/)[0]
    .trim()
    .toLowerCase();
};

const isInauspiciousForBeginnings = (tithiText) => {
  const name = extractTithiName(tithiText);
  if (!name) return null;
  return /(ashtami|navami|amavasya)/i.test(name);
};

const dayQualityMessage = (tithiText) => {
  if (!tithiText) return MISSING_INFO;

  if (isInauspiciousForBeginnings(tithiText)) {
    return "The day is not good for starting new work. Traditional Panchang rule: Ashtami, Navami, and Amavasya are avoided for new beginnings.";
  }

  return "The day is generally good for starting new work, while still avoiding inauspicious timings.";
};

const formatDateLabel = (dateText, weekdayText) => {
  if (!dateText) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(dateText).trim());
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  return weekdayText
    ? `${weekdayText}, ${day}-${month}-${year}`
    : `${day}-${month}-${year}`;
};

const getMonthGoodDays = (monthData) => {
  const rows = Array.isArray(monthData) ? monthData.filter(Boolean) : [];
  if (!rows.length) return [];

  return rows
    .filter((day) => {
      const tithi = readField(day, ["Tithi"]);
      if (!tithi) return false;
      return !isInauspiciousForBeginnings(tithi);
    })
    .map((day) => {
      const label = formatDateLabel(day?.date, day?.Weekday);
      const tithi = readField(day, ["Tithi"]);
      return label && tithi ? `${label} (${tithi})` : null;
    })
    .filter(Boolean);
};

const handleChatbot = async (req, res) => {
  try {
    const { message, selectedDay, calendarData } = req.body;
    const currentData = selectedDay || {};

    const tithi = readField(currentData, ["Tithi"]);
    const nakshatra = readField(currentData, ["Nakshatra"]);
    const paksha = readField(currentData, ["Paksha"]);
    const yoga = readField(currentData, ["Yoga", "Yogam"]);
    const karanam = readField(currentData, ["Karanam", "Karana"]);

    const festivals = Array.isArray(currentData.Festivals)
      ? currentData.Festivals
      : [];

    const sunrise = readField(currentData, ["Sunrise"]);
    const sunset = readField(currentData, ["Sunset"]);
    const moonrise = readField(currentData, ["Moonrise"]);
    const moonset = readField(currentData, ["Moonset"]);

    const abhijit = readField(currentData, ["Abhijit"]);
    const amrit = readField(currentData, ["Amrit Kalam"]);
    const rahuKalam = readField(currentData, ["Rahu Kalam", "Rahu"]);
    const yamaganda = readField(currentData, ["Yamaganda"]);
    const gulikai = readField(currentData, ["Gulikai Kalam"]);
    const durMuhurtam = readField(currentData, ["Dur Muhurtam"]);
    const varjyam = readField(currentData, ["Varjyam"]);

    const lowerMessage = String(message || "").toLowerCase().trim();

    if (!lowerMessage) {
      return res.json({ response: ONLY_PANCHANG });
    }

    const greetingOnlyRegex =
      /^(hello|hi|hey|namaste|vanakkam|good morning|good afternoon|good evening|hari om|om)\W*$/i;
    const isGreetingOnly = greetingOnlyRegex.test(lowerMessage);

    const panchangKeywords = [
      "panchang",
      "hindu calendar",
      "tithi",
      "nakshatra",
      "yoga",
      "yogam",
      "karana",
      "karanam",
      "paksha",
      "festival",
      "sunrise",
      "sunset",
      "moonrise",
      "moonset",
      "rahu",
      "yamaganda",
      "gulikai",
      "dur muhurtam",
      "muhurta",
      "muhurtam",
      "varjyam",
      "abhijit",
      "amrit",
      "auspicious",
      "inauspicious",
      "good day",
      "new work",
      "start work",
      "new beginning",
    ];

    const isPanchangQuestion =
      panchangKeywords.some((k) => containsWord(lowerMessage, k)) ||
      containsAny(lowerMessage, [
        /th+i+th+i+/i,
        /ti?thi/i,
        /naksh?at?r?a?/i,
        /nakshtra/i,
        /naksatra/i,
        /yo+g(a|am)?/i,
        /kara?na?m?/i,
        /muhur?t?a?m?/i,
      ]);

    if (!isGreetingOnly && !isPanchangQuestion) {
      return res.json({ response: ONLY_PANCHANG });
    }

    if (isGreetingOnly) {
      return res.json({
        response:
          "Namaste. I am your Panchang assistant. Ask me about tithi, nakshatra, yogam, karanam, auspicious and inauspicious timings, or whether this selected day is good for starting new work.",
      });
    }

    const askTithi = containsAny(lowerMessage, ["tithi", /th+i+th+i+/i, /ti?thi/i]);
    const askNakshatra = containsAny(lowerMessage, [
      "nakshatra",
      /naksh?at?r?a?/i,
      /nakshtra/i,
      /naksatra/i,
    ]);
    const askYoga =
      containsAny(lowerMessage, ["yoga", "yogam", /yo+g(a|am)?/i]);
    const askKaranam =
      containsAny(lowerMessage, ["karana", "karanam", /kara?na?m?/i]);

    const askTimings =
      containsWord(lowerMessage, "timing") ||
      containsWord(lowerMessage, "muhurta") ||
      containsWord(lowerMessage, "muhurtam") ||
      containsWord(lowerMessage, "rahu") ||
      containsWord(lowerMessage, "yamaganda") ||
      containsWord(lowerMessage, "gulikai") ||
      containsWord(lowerMessage, "dur muhurtam") ||
      containsWord(lowerMessage, "varjyam") ||
      containsWord(lowerMessage, "abhijit") ||
      containsWord(lowerMessage, "amrit");

    const askGoodDay =
      lowerMessage.includes("good day") ||
      lowerMessage.includes("start work") ||
      lowerMessage.includes("new work") ||
      lowerMessage.includes("new beginning") ||
      lowerMessage.includes("auspicious day") ||
      lowerMessage.includes("join") ||
      lowerMessage.includes("joining") ||
      lowerMessage.includes("job");

    const askFestival = containsWord(lowerMessage, "festival");
    const askMonthLevel = containsWord(lowerMessage, "month");

    const askOverview =
      lowerMessage.includes("full panchang") ||
      lowerMessage.includes("complete panchang") ||
      lowerMessage.includes("all panchang") ||
      lowerMessage.includes("panchang details") ||
      lowerMessage.includes("show panchang") ||
      lowerMessage.includes("today panchang") ||
      (!askTithi &&
        !askNakshatra &&
        !askYoga &&
        !askKaranam &&
        !askTimings &&
        !askGoodDay &&
        !askFestival);

    if (askMonthLevel && askGoodDay) {
      const monthGoodDays = getMonthGoodDays(calendarData);
      if (!monthGoodDays.length) {
        return res.json({ response: MISSING_INFO });
      }

      const topDays = monthGoodDays.slice(0, 8);
      return res.json({
        response: `Based on the available Panchang data for this month, these days are generally suitable for starting new work or joining a job:\n\n${topDays
          .map((d, i) => `${i + 1}. ${d}`)
          .join("\n")}\n\nPlease avoid inauspicious timings such as Rahu Kalam, Yamaganda, Gulikai Kalam, Dur Muhurtam, and Varjyam on the chosen day.`,
      });
    }

    const parts = [];

    const pushField = (title, value) => {
      parts.push(value ? `${title}: ${value}` : `${title}: ${MISSING_INFO}`);
    };

    if (askOverview || askTithi) {
      pushField("Tithi", tithi);
      parts.push(tithi ? "Tithi is the lunar day in Panchang." : MISSING_INFO);
    }

    if (askOverview || askNakshatra) {
      pushField("Nakshatra", nakshatra);
      parts.push(
        nakshatra
          ? "Nakshatra is the lunar mansion based on the Moon's position."
          : MISSING_INFO
      );
    }

    if (askOverview || askYoga) {
      pushField("Yogam", yoga);
      parts.push(
        yoga
          ? "Yogam is the Sun-Moon angular combination used in Panchang."
          : MISSING_INFO
      );
    }

    if (askOverview || askKaranam) {
      pushField("Karanam", karanam);
      parts.push(
        karanam
          ? "Karanam is half of a tithi and is used for muhurta judgement."
          : MISSING_INFO
      );
    }

    if (askOverview || askTimings) {
      parts.push("Auspicious timings:");
      pushField("Abhijit", abhijit);
      pushField("Amrit Kalam", amrit);
      parts.push("Inauspicious timings:");
      pushField("Rahu Kalam", rahuKalam);
      pushField("Yamaganda", yamaganda);
      pushField("Gulikai Kalam", gulikai);
      pushField("Dur Muhurtam", durMuhurtam);
      pushField("Varjyam", varjyam);
    }

    if (askOverview || askFestival) {
      parts.push(
        festivals.length
          ? `Festivals: ${festivals.join(", ")}`
          : `Festivals: ${MISSING_INFO}`
      );
    }

    if (askOverview) {
      pushField("Paksha", paksha);
      pushField("Sunrise", sunrise);
      pushField("Sunset", sunset);
      pushField("Moonrise", moonrise);
      pushField("Moonset", moonset);
    }

    if (askOverview || askGoodDay) {
      const dateLabel = formatDateLabel(currentData?.date, currentData?.Weekday);
      if (dateLabel) {
        parts.push(`Selected day: ${dateLabel}`);
      }
      parts.push(`Good for starting new work: ${dayQualityMessage(tithi)}`);
    }

    return res.json({ response: parts.join("\n\n") || ONLY_PANCHANG });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      response: MISSING_INFO,
    });
  }
};

// Support both endpoints:
// 1) POST /api/chatbot (current frontend)
// 2) POST /api         (legacy behavior)
router.post("/chatbot", handleChatbot);
router.post("/", handleChatbot);

export default router;
