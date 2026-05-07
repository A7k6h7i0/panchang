import cron from "node-cron";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir, readFile, writeFile } from "fs/promises";
import logger from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TIME_ZONE = "Asia/Kolkata";
const LOCAL_DATA_DIR = path.resolve(__dirname, "../../frontend/public/data");
const STATE_FILE = path.resolve(__dirname, "../data/muhurta_notification_state.json");

const ALERT_WINDOW_MS = 75_000;
const STATE_TTL_MS = 4 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const yearCache = new Map();

let cronStarted = false;

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getIstParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      parts[part.type] = part.value;
    }
  }

  return parts;
}

function getIstDateYmd(date = new Date()) {
  const parts = getIstParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function ymdToSlashDate(ymd) {
  const [year, month, day] = String(ymd || "").split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function parseClockTimeToMinutes(timeStr) {
  const match = String(timeStr || "")
    .trim()
    .match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const marker = String(match[3] || "").toUpperCase();
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  if (marker === "AM" && hours === 12) hours = 0;
  if (marker === "PM" && hours !== 12) hours += 12;
  return hours * 60 + minutes;
}

function minutesToClockText(minuteValue) {
  const total = ((Math.floor(Number(minuteValue)) % 1440) + 1440) % 1440;
  let hours = Math.floor(total / 60);
  const minutes = total % 60;
  const marker = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${pad2(minutes)} ${marker}`;
}

function minutesToUtcMs(dateYmd, minuteValue, dayShift = 0) {
  const [year, month, day] = String(dateYmd || "").split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;

  const totalMinutes = Number(minuteValue);
  if (!Number.isFinite(totalMinutes)) return null;

  const overflowShift = Math.floor(totalMinutes / 1440);
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const utcMillis = Date.UTC(year, month - 1, day + dayShift + overflowShift, hours, minutes, 0);
  return utcMillis - 330 * 60 * 1000;
}

function localIsoFromMinutes(dateYmd, minuteValue, dayShift = 0) {
  const ms = minutesToUtcMs(dateYmd, minuteValue, dayShift);
  if (ms == null) return null;

  const dt = new Date(ms);
  return dt.toLocaleString("sv-SE", {
    timeZone: TIME_ZONE,
    hour12: false,
  }).replace(" ", "T");
}

function isoRangeFromTimes(dateYmd, startTime, endTime) {
  const startMinutes = parseClockTimeToMinutes(startTime);
  const endMinutes = parseClockTimeToMinutes(endTime);
  if (startMinutes == null || endMinutes == null) {
    return { startMs: null, endMs: null, startText: null, endText: null };
  }

  const startMs = minutesToUtcMs(dateYmd, startMinutes, 0);
  let endMs = minutesToUtcMs(dateYmd, endMinutes, 0);
  if (startMs == null || endMs == null) {
    return { startMs: null, endMs: null, startText: null, endText: null };
  }

  if (endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }

  return {
    startMs,
    endMs,
    startText: minutesToClockText(startMinutes),
    endText: minutesToClockText(endMinutes),
  };
}

function splitRanges(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getBrahmaMuhurta(dateYmd, sunriseText) {
  const sunriseMinutes = parseClockTimeToMinutes(sunriseText);
  if (sunriseMinutes == null) return null;

  const startMinutes = sunriseMinutes - 84;
  const startMs = minutesToUtcMs(dateYmd, startMinutes, 0);
  const endMs = minutesToUtcMs(dateYmd, sunriseMinutes, 0);
  if (startMs == null || endMs == null) return null;

  return {
    name: "Brahma Muhurta",
    category: "auspicious",
    startMs,
    endMs,
    startText: minutesToClockText(startMinutes),
    endText: minutesToClockText(sunriseMinutes),
  };
}

function buildPeriods(day) {
  const dateYmd = slashDateToYmd(day?.date);
  if (!dateYmd) return [];

  const periods = [];

  const groups = [
    ["Rahu Kalam", day?.["Rahu Kalam"], "inauspicious"],
    ["Yamaganda", day?.Yamaganda, "inauspicious"],
    ["Gulikai Kalam", day?.["Gulikai Kalam"], "inauspicious"],
    ["Dur Muhurtam", day?.["Dur Muhurtam"], "inauspicious"],
    ["Varjyam", day?.Varjyam, "inauspicious"],
    ["Abhijit", day?.Abhijit, "auspicious"],
    ["Amrit Kalam", day?.["Amrit Kalam"], "auspicious"],
  ];

  for (const [name, value, category] of groups) {
    for (const rangeText of splitRanges(value)) {
      const [startRaw, endRaw] = rangeText.split(/\s*(?:to|-|->)\s*/i);
      if (!startRaw || !endRaw) continue;
      const range = isoRangeFromTimes(dateYmd, startRaw, endRaw);
      if (range.startMs == null || range.endMs == null) continue;

      periods.push({
        name,
        category,
        dateYmd,
        startMs: range.startMs,
        endMs: range.endMs,
        startText: range.startText,
        endText: range.endText,
      });
    }
  }

  const brahmaMuhurta = getBrahmaMuhurta(dateYmd, day?.Sunrise);
  if (brahmaMuhurta) {
    periods.push({
      ...brahmaMuhurta,
      dateYmd,
    });
  }

  return periods;
}

function slashDateToYmd(dateStr) {
  const [day, month, year] = String(dateStr || "").split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month}-${day}`;
}

async function loadYearDays(year) {
  const yr = Number(year);
  if (!Number.isFinite(yr)) return [];
  if (yearCache.has(yr)) return yearCache.get(yr);

  try {
    const raw = await readFile(path.join(LOCAL_DATA_DIR, `${yr}.json`), "utf8");
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    yearCache.set(yr, list);
    return list;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      logger.warn(`[MuhurtaCron] Failed to load local year data for ${yr}: ${error.message}`);
    }
    yearCache.set(yr, []);
    return [];
  }
}

async function loadDayRecord(dateYmd) {
  const year = Number(String(dateYmd || "").slice(0, 4));
  if (!Number.isFinite(year)) return null;

  const days = await loadYearDays(year);
  const slash = ymdToSlashDate(dateYmd);
  return days.find((item) => item?.date === slash) || null;
}

async function readState() {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      updatedAt: parsed?.updatedAt || null,
      sent: parsed?.sent && typeof parsed.sent === "object" ? parsed.sent : {},
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      logger.warn(`[MuhurtaCron] Failed to read state file: ${error.message}`);
    }
    return { updatedAt: null, sent: {} };
  }
}

async function writeState(state) {
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function pruneState(sent, now = Date.now()) {
  const pruned = {};
  for (const [key, meta] of Object.entries(sent || {})) {
    const sentAt = Date.parse(meta?.sentAt || "");
    if (!Number.isFinite(sentAt)) continue;
    if (now - sentAt <= STATE_TTL_MS) {
      pruned[key] = meta;
    }
  }
  return pruned;
}

function buildAlertGroups(periods, nowMs) {
  const groups = new Map();

  for (const period of periods) {
    const alertCandidates = [
      {
        alertType: "before",
        alertMs: period.startMs - ONE_HOUR_MS,
        title: "Panchang reminder",
        body: `${period.name} will begin in 1 hour. Timing: ${period.startText} to ${period.endText}.`,
      },
      {
        alertType: "completed",
        alertMs: period.endMs,
        title: "Panchang update",
        body: `${period.name} has completed. Timing: ${period.startText} to ${period.endText}.`,
      },
    ];

    for (const candidate of alertCandidates) {
      if (candidate.alertMs == null) continue;
      const diff = nowMs - candidate.alertMs;
      if (diff < 0 || diff > ALERT_WINDOW_MS) continue;

      const key = `${candidate.alertType}|${candidate.alertMs}|${period.category}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          alertType: candidate.alertType,
          category: period.category,
          alertMs: candidate.alertMs,
          title: candidate.title,
          periods: [],
        });
      }

      groups.get(key).periods.push(period);
    }
  }

  return groups;
}

function joinNames(names) {
  const clean = names.filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function buildNotificationPayload(group, todayYmd) {
  const sortedPeriods = [...group.periods].sort((a, b) => a.name.localeCompare(b.name));
  const names = sortedPeriods.map((item) => item.name);
  const timings = sortedPeriods.map((item) => `${item.startText} to ${item.endText}`);
  const label = joinNames(names);
  const timingLabel = joinNames(timings);
  const phaseLabel = group.alertType === "before" ? "will begin in 1 hour" : "has completed";
  const title = group.category === "auspicious" ? "Auspicious timing reminder" : "Inauspicious timing reminder";

  return {
    title,
    body: `${label} ${phaseLabel}. Timing: ${timingLabel}.`,
    data: {
      notificationType: "muhurta_alert",
      alertType: group.alertType,
      category: group.category,
      date: todayYmd,
      names: JSON.stringify(names),
      timings: JSON.stringify(timings),
      alertTime: String(group.alertMs),
    },
    stateKey: `${group.alertType}|${group.category}|${group.alertMs}|${names.join("|")}|${timings.join("|")}`,
  };
}

async function sendPushNotification(baseUrl, payload) {
  const response = await axios.post(`${baseUrl}/api/push/send`, payload, {
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function runMuhurtaNotificationPass(baseUrl) {
  const now = new Date();
  const nowMs = now.getTime();
  const todayYmd = getIstDateYmd(now);
  const today = await loadDayRecord(todayYmd);

  const tomorrowParts = getIstParts(new Date(nowMs + 24 * 60 * 60 * 1000));
  const tomorrowYmd = `${tomorrowParts.year}-${tomorrowParts.month}-${tomorrowParts.day}`;
  const tomorrow = await loadDayRecord(tomorrowYmd);

  const yesterdayParts = getIstParts(new Date(nowMs - 24 * 60 * 60 * 1000));
  const yesterdayYmd = `${yesterdayParts.year}-${yesterdayParts.month}-${yesterdayParts.day}`;
  const yesterday = await loadDayRecord(yesterdayYmd);

  const periods = [
    ...(yesterday ? buildPeriods(yesterday) : []),
    ...(today ? buildPeriods(today) : []),
    ...(tomorrow ? buildPeriods(tomorrow) : []),
  ];

  if (!periods.length) {
    logger.debug("[MuhurtaCron] No timings found for today/tomorrow.");
    return;
  }

  const alertGroups = buildAlertGroups(periods, nowMs);
  if (!alertGroups.size) {
    return;
  }

  const state = await readState();
  state.sent = pruneState(state.sent, nowMs);

  for (const group of alertGroups.values()) {
    const payload = buildNotificationPayload(group, todayYmd);
    if (state.sent[payload.stateKey]) {
      continue;
    }

    try {
      logger.info(
        `[MuhurtaCron] Sending ${group.alertType} alert for ${group.category}: ${payload.body}`
      );
      await sendPushNotification(baseUrl, {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      state.sent[payload.stateKey] = {
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(
        `[MuhurtaCron] Failed to send ${group.alertType} alert: ${error?.response?.data?.error || error.message}`
      );
    }
  }

  state.updatedAt = new Date().toISOString();
  await writeState(state);
}

export function startMuhurtaNotificationCron({ baseUrl } = {}) {
  if (cronStarted) return;
  cronStarted = true;

  const resolvedBaseUrl = baseUrl || `http://127.0.0.1:${process.env.SERVER_PORT || process.env.PORT || 5000}`;

  logger.info("[MuhurtaCron] Registering timing notification cron: every minute");
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await runMuhurtaNotificationPass(resolvedBaseUrl);
      } catch (error) {
        logger.error(`[MuhurtaCron] Notification pass failed: ${error.message}`);
      }
    },
    {
      timezone: TIME_ZONE,
    }
  );

  void runMuhurtaNotificationPass(resolvedBaseUrl).catch((error) => {
    logger.error(`[MuhurtaCron] Initial notification pass failed: ${error.message}`);
  });
}
