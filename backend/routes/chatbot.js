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

const normalizeCompact = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const containsAny = (text, checks) =>
  checks.some((check) =>
    check instanceof RegExp ? check.test(text) : containsWord(text, check)
  );

const containsAnyCompact = (compactText, compactChecks) =>
  compactChecks.some((entry) => compactText.includes(normalizeCompact(entry)));

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

const parseSlashDate = (dateText) => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(dateText || "").trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getReferenceDate = (selectedDay) => {
  const selected = parseSlashDate(selectedDay?.date);
  if (selected) return selected;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const getMonthGoodDays = (monthData, selectedDay) => {
  const rows = Array.isArray(monthData) ? monthData.filter(Boolean) : [];
  if (!rows.length) return [];

  const referenceDate = getReferenceDate(selectedDay);

  return rows
    .filter((day) => {
      const dateObj = parseSlashDate(day?.date);
      if (!dateObj || dateObj < referenceDate) return false;

      const tithi = readField(day, ["Tithi"]);
      if (!tithi) return false;
      if (isInauspiciousForBeginnings(tithi)) return false;

      // Keep only days where core inauspicious timing windows are available.
      const rahu = readField(day, ["Rahu Kalam", "Rahu"]);
      const yama = readField(day, ["Yamaganda"]);
      const gulikai = readField(day, ["Gulikai Kalam"]);
      return Boolean(rahu && yama && gulikai);
    })
    .map((day) => {
      const label = formatDateLabel(day?.date, day?.Weekday);
      const tithi = readField(day, ["Tithi"]);
      const hasAbhijit = Boolean(readField(day, ["Abhijit"]));
      const hasAmrit = Boolean(readField(day, ["Amrit Kalam"]));
      const score = (hasAbhijit ? 1 : 0) + (hasAmrit ? 1 : 0);

      if (!label || !tithi) return null;
      return {
        label: `${label} (${tithi})`,
        dateObj: parseSlashDate(day?.date),
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.dateObj - b.dateObj;
    })
    .slice(0, 3)
    .map((d) => d.label);
};

const getMonthFestivalEntries = (monthData) => {
  const rows = Array.isArray(monthData) ? monthData.filter(Boolean) : [];
  const entries = [];

  for (const day of rows) {
    const list = Array.isArray(day?.Festivals) ? day.Festivals : [];
    if (!list.length) continue;
    const label = formatDateLabel(day?.date, day?.Weekday);
    for (const name of list) {
      if (typeof name !== "string" || !name.trim()) continue;
      entries.push({
        festival: name.trim(),
        compactFestival: normalizeCompact(name),
        dateLabel: label,
      });
    }
  }
  return entries;
};

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
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[s.length][t.length];
};

const findFestivalMatch = (compactQuery, festivalEntries) => {
  if (!compactQuery || !festivalEntries.length) return null;

  let best = null;
  for (const item of festivalEntries) {
    const f = item.compactFestival;
    if (!f) continue;

    if (compactQuery.includes(f) || f.includes(compactQuery)) {
      return item;
    }

    const dist = levenshtein(compactQuery, f);
    const limit = Math.max(2, Math.floor(f.length * 0.25));
    if (dist <= limit && (!best || dist < best.dist)) {
      best = { ...item, dist };
    }
  }

  return best;
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
    const compactMessage = normalizeCompact(lowerMessage);
    const monthFestivalEntries = getMonthFestivalEntries(calendarData);

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
      "rahukalam",
      "rahu kaalam",
      "yamaganda",
      "yamagandam",
      "gulikai",
      "gulika",
      "dur muhurtam",
      "durmuhurtham",
      "muhurta",
      "muhurtam",
      "varjyam",
      "abhijit",
      "abhijeet",
      "amrit",
      "amrith",
      "auspicious",
      "inauspicious",
      "good day",
      "new work",
      "start work",
      "new beginning",
      "festival list",
    ];

    const isPanchangQuestion =
      panchangKeywords.some((k) => containsWord(lowerMessage, k)) ||
      containsAnyCompact(compactMessage, [
        "rahukalam",
        "yamagandam",
        "gulikaikalam",
        "durmuhurtham",
        "abhijeet",
        "amrithkalam",
        "festival",
      ]) ||
      containsAny(lowerMessage, [
        /th+i+th+i+/i,
        /ti?thi/i,
        /naksh?at?r?a?/i,
        /nakshtra/i,
        /naksatra/i,
        /yo+g(a|am)?/i,
        /kara?na?m?/i,
        /muhur?t?a?m?/i,
      ]) ||
      Boolean(findFestivalMatch(compactMessage, monthFestivalEntries));

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
      containsWord(lowerMessage, "muhurtham");

    const askAuspiciousOnly =
      containsAny(lowerMessage, [
        "auspicious",
        "shubha",
        "good time",
        "best time",
      ]) && !containsAny(lowerMessage, ["inauspicious", "bad time", "ashubha"]);

    const askInauspiciousOnly = containsAny(lowerMessage, [
      "inauspicious",
      "bad time",
      "ashubha",
    ]);

    const askRahu =
      containsAny(lowerMessage, ["rahu", "rahu kalam", "rahukalam"]) ||
      containsAnyCompact(compactMessage, ["rahukalam", "rahukaalam", "raahukalam"]);
    const askYamaganda = containsAny(lowerMessage, [
      "yamaganda",
      "yamagandam",
      "yamagand",
    ]) || containsAnyCompact(compactMessage, ["yamagandam", "yamagand"]);
    const askGulikai =
      containsAny(lowerMessage, ["gulikai", "gulikai kalam", "kuligai", "gulika"]) ||
      containsAnyCompact(compactMessage, ["gulikaikalam", "gulikakalam", "kuligai"]);
    const askDurMuhurtam = containsAny(lowerMessage, [
      "dur muhurtam",
      "durmuhurtam",
      "durmuhurtham",
      "dur muhurtham",
    ]) || containsAnyCompact(compactMessage, ["durmuhurtham", "durmuhurtam", "durmuhuratam"]);
    const askVarjyam =
      containsAny(lowerMessage, ["varjyam", "varjam"]) ||
      containsAnyCompact(compactMessage, ["varjyam", "varjam", "varjyam"]);
    const askAbhijit =
      containsAny(lowerMessage, ["abhijit", "abhijeet"]) ||
      containsAnyCompact(compactMessage, ["abhijit", "abhijeet", "abhijith"]);
    const askAmrit = containsAny(lowerMessage, [
      "amrit",
      "amrith",
      "amrit kalam",
      "amrith kalam",
    ]) || containsAnyCompact(compactMessage, ["amritkalam", "amrithkalam", "amrutha"]);

    const askGoodDay =
      lowerMessage.includes("good day") ||
      lowerMessage.includes("start work") ||
      lowerMessage.includes("new work") ||
      lowerMessage.includes("new beginning") ||
      lowerMessage.includes("auspicious day") ||
      lowerMessage.includes("join") ||
      lowerMessage.includes("joining") ||
      lowerMessage.includes("job");

    const askFestival =
      containsWord(lowerMessage, "festival") ||
      containsAnyCompact(compactMessage, ["festival", "festivals", "utsav"]);
    const askMonthLevel =
      containsWord(lowerMessage, "month") || containsAnyCompact(compactMessage, ["thismonth", "month"]);
    const askFestivalMonthList =
      (askFestival &&
        askMonthLevel &&
        containsAny(lowerMessage, ["all", "list", "give", "show"])) ||
      containsAnyCompact(compactMessage, ["allfestivals", "festivalsinthismonth"]);
    const askFestivalDate =
      containsAny(lowerMessage, ["which day", "what day", "when is", "date"]) &&
      (askFestival || Boolean(findFestivalMatch(compactMessage, monthFestivalEntries)));

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
        !askAuspiciousOnly &&
        !askInauspiciousOnly &&
        !askRahu &&
        !askYamaganda &&
        !askGulikai &&
        !askDurMuhurtam &&
        !askVarjyam &&
        !askAbhijit &&
        !askAmrit &&
        !askGoodDay &&
        !askFestival);

    if (askMonthLevel && askGoodDay) {
      const monthGoodDays = getMonthGoodDays(calendarData, selectedDay);
      if (!monthGoodDays.length) {
        return res.json({ response: MISSING_INFO });
      }

      return res.json({
        response: `Based on the available Panchang data for this month, the next suitable dates from the current date are:\n\n${monthGoodDays
          .map((d, i) => `${i + 1}. ${d}`)
          .join("\n")}\n\nThese recommendations prioritize dates that are not already passed, avoid Ashtami/Navami/Amavasya, and consider timing availability. On the selected day, please still avoid Rahu Kalam, Yamaganda, Gulikai Kalam, Dur Muhurtam, and Varjyam.`,
      });
    }

    if (askFestivalMonthList) {
      if (!monthFestivalEntries.length) {
        return res.json({ response: MISSING_INFO });
      }

      const grouped = new Map();
      monthFestivalEntries.forEach((item) => {
        const key = `${item.festival}|${item.dateLabel}`;
        grouped.set(key, item);
      });

      const list = Array.from(grouped.values()).map(
        (x) => `${x.festival} - ${x.dateLabel || MISSING_INFO}`
      );

      return res.json({
        response: `Festivals in this month from the available Panchang data:\n\n${list
          .map((row, i) => `${i + 1}. ${row}`)
          .join("\n")}`,
      });
    }

    if (askFestivalDate) {
      const match = findFestivalMatch(compactMessage, monthFestivalEntries);
      if (!match) {
        return res.json({ response: MISSING_INFO });
      }
      return res.json({
        response: `${match.festival} is observed on ${match.dateLabel || MISSING_INFO}.`,
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

    if (askOverview) {
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

    if (askAuspiciousOnly) {
      parts.push("Auspicious timings:");
      pushField("Abhijit", abhijit);
      pushField("Amrit Kalam", amrit);
    }

    if (askInauspiciousOnly) {
      parts.push("Inauspicious timings:");
      pushField("Rahu Kalam", rahuKalam);
      pushField("Yamaganda", yamaganda);
      pushField("Gulikai Kalam", gulikai);
      pushField("Dur Muhurtam", durMuhurtam);
      pushField("Varjyam", varjyam);
    }

    if (askTimings && !askAuspiciousOnly && !askInauspiciousOnly) {
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

    if (askRahu) pushField("Rahu Kalam", rahuKalam);
    if (askYamaganda) pushField("Yamaganda", yamaganda);
    if (askGulikai) pushField("Gulikai Kalam", gulikai);
    if (askDurMuhurtam) pushField("Dur Muhurtam", durMuhurtam);
    if (askVarjyam) pushField("Varjyam", varjyam);
    if (askAbhijit) pushField("Abhijit", abhijit);
    if (askAmrit) pushField("Amrit Kalam", amrit);

    if (askOverview || askFestival) {
      if (festivals.length) {
        parts.push(`Festivals: ${festivals.join(", ")}`);
      } else if (monthFestivalEntries.length && askFestival) {
        const uniqueNames = Array.from(
          new Set(monthFestivalEntries.map((x) => x.festival))
        ).slice(0, 10);
        parts.push(`Festivals this month: ${uniqueNames.join(", ")}`);
      } else {
        parts.push(`Festivals: ${MISSING_INFO}`);
      }
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
