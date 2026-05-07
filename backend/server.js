import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { mkdir, readFile, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

import express from "express";
import axios from "axios";
import cors from "cors";
import rateLimit from "express-rate-limit";

import astrologyRoutes from "./routes/astrology.js";
import prokeralaRoutes from "./routes/prokerala.js";
import systemRoutes from "./routes/system.js";
import hinduSearchRoutes from "./routes/hinduSearch.js";
import purohithRoutes from "./routes/purohith.js";
import gitaRoutes from "./routes/gita.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initDatabase } from "./services/panchangCacheService.js";
import { warmGitaDataset } from "./services/gitaService.js";
import { startYearlyFetchCron } from "./cron/yearlyFetchCron.js";
import { startMuhurtaNotificationCron } from "./cron/muhurtaNotificationCron.js";
import logger from "./config/logger.js";

const HINDU_SEARCH_API_BASE_URL =
  process.env.HINDU_SEARCH_API_BASE_URL || "https://hindu-search.digitalleadpro.com";
const pushTokenStorePath = path.join(__dirname, "data", "fcm_tokens.json");
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  "secrets",
  "talking-calendar-47d98-firebase-adminsdk-fbsvc-cce183c3f6.json"
);
const FCM_LEGACY_SEND_URL = "https://fcm.googleapis.com/fcm/send";
const FCM_V1_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_V1_SEND_BASE = "https://fcm.googleapis.com/v1/projects";
const INVALID_FCM_ERRORS = new Set([
  "InvalidRegistration",
  "NotRegistered",
  "MismatchSenderId",
  "InvalidParameters",
  "MissingRegistration",
]);
let cachedServiceAccount = null;
let cachedAccessToken = null;

// ─── Initialize SQLite (existing panchang cache) ───────────────────
// This creates the database file and tables if they don't exist
initDatabase();
void warmGitaDataset().catch((error) => {
  logger.warn("Gita dataset warm-up failed:", error?.message || error);
});

// ─── MongoDB removed: Purohit/Temple data now fetched from Hindu Search API ───

// ─── Start Daily Cron Job (2 AM IST) ──────────────────────────────
startYearlyFetchCron();

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// ─── Rate Limiting: 60 requests per minute ──────────────────────────
// Applies to ALL routes globally. Protects the server from abuse.
// Each IP gets a maximum of 60 requests per 60-second window.
const limiter = rateLimit({
  windowMs: 60 * 1000,    // 60 second window
  max: 60,                // 60 requests per window
  standardHeaders: true,  // Return rate limit info in response headers
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. You are limited to 60 requests per minute. Please wait.",
  },
});
app.use(limiter);

// 🔑 Put API keys in backend/.env
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

// Hindu Search proxy (avoids CORS in the browser)
app.use("/api/hindu-search", async (req, res) => {
  try {
    const targetPath = req.originalUrl.replace(/^\/api\/hindu-search/, "");
    const url = `${HINDU_SEARCH_API_BASE_URL}${targetPath}`;
    const response = await axios.get(url, {
      params: req.query,
      timeout: 20000,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err?.response?.status || 502;
    const message =
      err?.response?.data ||
      err?.message ||
      "Failed to fetch data from Hindu Search API";
    res.status(status).json({ error: message });
  }
});

// Import chatbot route
import chatbotRoutes from "./routes/chatbot.js";
app.use("/api", chatbotRoutes);
app.use("/api/astrology", astrologyRoutes);

// ─── New MongoDB-backed Prokerala data routes ───────────────────────
app.use("/api/prokerala", prokeralaRoutes);

// ─── Hindu Search (Purohits & Temples) ───────────────────────────────────────
app.use("/api", hinduSearchRoutes);

// ─── Local MongoDB-backed Purohit Routes ───────────────────────────────────
// These routes provide pure purohit data from local MongoDB
app.use("/api/purohith", purohithRoutes);
app.use("/api/gita", gitaRoutes);

app.post("/api/push/register-token", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ success: false, error: "Token is required" });
    }

    const userId = String(req.body?.userId || "").trim();
    const userEmail = String(req.body?.userEmail || "").trim();
    const platform = String(req.body?.platform || "").trim();
    const source = String(req.body?.source || "").trim();
    const appVersion = String(req.body?.appVersion || "").trim();
    const appName = String(req.body?.appName || "").trim();
    const deviceModel = String(req.body?.deviceModel || "").trim();
    const deviceBrand = String(req.body?.deviceBrand || "").trim();
    const deviceManufacturer = String(req.body?.deviceManufacturer || "").trim();
    const osVersion = String(req.body?.osVersion || "").trim();
    const now = new Date().toISOString();
    const store = await readPushTokenStore();
    const existingIndex = store.tokens.findIndex((entry) => entry?.token === token);

    if (existingIndex >= 0) {
      store.tokens[existingIndex] = {
        ...store.tokens[existingIndex],
        userId: userId || store.tokens[existingIndex].userId || null,
        userEmail: userEmail || store.tokens[existingIndex].userEmail || null,
        platform: platform || store.tokens[existingIndex].platform || null,
        source: source || store.tokens[existingIndex].source || null,
        appVersion: appVersion || store.tokens[existingIndex].appVersion || null,
        appName: appName || store.tokens[existingIndex].appName || null,
        deviceModel: deviceModel || store.tokens[existingIndex].deviceModel || null,
        deviceBrand: deviceBrand || store.tokens[existingIndex].deviceBrand || null,
        deviceManufacturer:
          deviceManufacturer || store.tokens[existingIndex].deviceManufacturer || null,
        osVersion: osVersion || store.tokens[existingIndex].osVersion || null,
        lastSeenAt: now,
        updatedAt: now,
      };
    } else {
      store.tokens.push({
        token,
        userId: userId || null,
        userEmail: userEmail || null,
        platform: platform || null,
        source: source || null,
        appVersion: appVersion || null,
        appName: appName || null,
        deviceModel: deviceModel || null,
        deviceBrand: deviceBrand || null,
        deviceManufacturer: deviceManufacturer || null,
        osVersion: osVersion || null,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      });
    }

    store.updatedAt = now;
    await writePushTokenStore(store);

    return res.json({
      success: true,
      registered: true,
      totalTokens: store.tokens.length,
    });
  } catch (error) {
    logger.error("[PushTokens] Failed to register token:", error.message);
    return res.status(500).json({ success: false, error: "Failed to register token" });
  }
});

app.post("/api/push/send", async (req, res) => {
  try {
    const serviceAccount = await getServiceAccount();
    if (!FCM_SERVER_KEY && !serviceAccount) {
      return res.status(501).json({
        success: false,
        error:
          "No FCM credentials are configured. Add GOOGLE_APPLICATION_CREDENTIALS for HTTP v1 or FCM_SERVER_KEY for legacy sends.",
      });
    }

    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
    const userId = String(req.body?.userId || "").trim();
    const tokensFromBody = Array.isArray(req.body?.tokens)
      ? req.body.tokens.map((value) => String(value || "").trim()).filter(Boolean)
      : [];
    const singleToken = String(req.body?.token || "").trim();
    const data = normalizePushData(req.body?.data);

    let tokens = tokensFromBody;
    if (singleToken) {
      tokens = [singleToken];
    }

    if (!tokens.length) {
      const store = await readPushTokenStore();
      const eligibleTokens = userId
        ? store.tokens.filter((entry) => String(entry?.userId || "").trim() === userId)
        : store.tokens;
      tokens = eligibleTokens.map((entry) => String(entry?.token || "").trim()).filter(Boolean);
    }

    if (!tokens.length) {
      return res.status(400).json({
        success: false,
        error: "No push tokens found. Register a token first.",
      });
    }

    const notification = {};
    if (title) notification.title = title;
    if (body) notification.body = body;

    const results = [];
    const invalidTokens = new Set();

    if (serviceAccount) {
      const accessToken = await getServiceAccountAccessToken(serviceAccount);
      const endpoint = `${FCM_V1_SEND_BASE}/${serviceAccount.project_id}/messages:send`;

      for (const token of tokens) {
        try {
          const message = {
            token,
            ...(Object.keys(notification).length ? { notification } : {}),
            ...(Object.keys(data).length ? { data } : {}),
            android: {
              priority: "HIGH",
            },
          };

          const response = await axios.post(
            endpoint,
            { message },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              timeout: 15000,
            }
          );

          results.push({
            token,
            response: response.data,
          });
        } catch (error) {
          const fcmStatus = String(error?.response?.data?.error?.status || "").toUpperCase();
          const fcmMessage = String(error?.response?.data?.error?.message || error.message || "");
          const isInvalidToken =
            fcmStatus === "INVALID_ARGUMENT" &&
            /registration token/i.test(fcmMessage);

          if (fcmStatus === "UNREGISTERED" || isInvalidToken) {
            invalidTokens.add(token);
          }

          results.push({
            token,
            error: error?.response?.data || error.message || "Failed to send push notification",
          });
        }
      }
    } else {
      const chunks = chunkArray(tokens, 500);

      for (const chunk of chunks) {
        const payload = {
          registration_ids: chunk,
          priority: "high",
          ...(Object.keys(notification).length ? { notification } : {}),
          ...(Object.keys(data).length ? { data } : {}),
        };

        const response = await axios.post(FCM_LEGACY_SEND_URL, payload, {
          headers: {
            Authorization: `key=${FCM_SERVER_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });

        const responseResults = Array.isArray(response.data?.results)
          ? response.data.results
          : [];
        responseResults.forEach((result, index) => {
          if (!result?.error) return;
          if (!INVALID_FCM_ERRORS.has(result.error)) return;
          const token = chunk[index];
          if (token) {
            invalidTokens.add(token);
          }
        });

        results.push({
          sent: chunk.length,
          response: response.data,
        });
      }
    }

    if (invalidTokens.size > 0) {
      const store = await readPushTokenStore();
      const remainingTokens = store.tokens.filter(
        (entry) => !invalidTokens.has(String(entry?.token || "").trim())
      );

      if (remainingTokens.length !== store.tokens.length) {
        store.tokens = remainingTokens;
        store.updatedAt = new Date().toISOString();
        await writePushTokenStore(store);
      }
    }

    return res.json({
      success: true,
      requestedTokens: tokens.length,
      batches: results.length,
      results,
    });
  } catch (error) {
    logger.error("[PushTokens] Failed to send push notification:", error.message);
    return res.status(500).json({
      success: false,
      error: error?.response?.data || error.message || "Failed to send push notification",
    });
  }
});

// ─── System monitoring routes ────────────────────────────────────────
// GET /api/system/db-stats → storage usage, Atlas M0 limit check
app.use("/api/system", systemRoutes);



// Language → Google voice mapping
const voiceMap = {
  en: { languageCode: "en-IN", name: "en-IN-Neural2-D" },
  hi: { languageCode: "hi-IN", name: "hi-IN-Neural2-A" },
  te: { languageCode: "te-IN", name: "te-IN-Standard-A" },
  ta: { languageCode: "ta-IN", name: "ta-IN-Standard-A" },
  kn: { languageCode: "kn-IN", name: "kn-IN-Standard-A" },
  ml: { languageCode: "ml-IN", name: "ml-IN-Standard-A" },
  gu: { languageCode: "gu-IN", name: "gu-IN-Standard-A" },
  bn: { languageCode: "bn-IN", name: "bn-IN-Standard-A" },
  mrw: { languageCode: "hi-IN", name: "hi-IN-Neural2-A" },
};

// Store scheduled notifications
const scheduledNotifications = new Map();
const translateCache = new Map();
const translateBackoffUntil = { until: 0 };

async function readPushTokenStore() {
  try {
    const raw = await readFile(pushTokenStorePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      updatedAt: parsed?.updatedAt || null,
      tokens: Array.isArray(parsed?.tokens) ? parsed.tokens : [],
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      logger.warn("[PushTokens] Failed to read token store:", error.message);
    }
    return { updatedAt: null, tokens: [] };
  }
}

async function writePushTokenStore(store) {
  await mkdir(path.dirname(pushTokenStorePath), { recursive: true });
  await writeFile(pushTokenStorePath, JSON.stringify(store, null, 2), "utf8");
}

async function getServiceAccount() {
  if (cachedServiceAccount) {
    return cachedServiceAccount;
  }

  const configuredPath = GOOGLE_APPLICATION_CREDENTIALS || DEFAULT_SERVICE_ACCOUNT_PATH;
  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(__dirname, configuredPath);

  try {
    const raw = await readFile(resolvedPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed?.client_email || !parsed?.private_key || !parsed?.project_id) {
      throw new Error("Service account JSON is missing required fields.");
    }

    cachedServiceAccount = parsed;
    return parsed;
  } catch (error) {
    if (error?.code !== "ENOENT") {
      logger.warn("[PushTokens] Failed to load service account JSON:", error.message);
    }
    return null;
  }
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload, privateKey) {
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${header}.${body}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(privateKey, "base64");
  const encodedSignature = signature.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${unsignedToken}.${encodedSignature}`;
}

async function getServiceAccountAccessToken(serviceAccount) {
  const cachedToken = cachedAccessToken;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    {
      iss: serviceAccount.client_email,
      scope: FCM_V1_SCOPE,
      aud: OAUTH_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    serviceAccount.private_key
  );

  const form = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const { data } = await axios.post(OAUTH_TOKEN_URL, form.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 15000,
  });

  if (!data?.access_token) {
    throw new Error("Failed to obtain an FCM access token.");
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };

  return data.access_token;
}

function normalizePushData(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (entry === null || entry === undefined) continue;
    out[key] = String(entry);
  }

  return out;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const normalizeTranslateTarget = (language) => {
  const lang = String(language || "en").trim().toLowerCase();
  if (lang === "mrw") return "hi";
  return lang || "en";
};

const shouldSkipTranslation = (value) => {
  const text = String(value || "").trim();
  if (!text) return true;
  if (text.length < 2 || text.length > 500) return true;
  if (!/[A-Za-z\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F]/.test(text)) {
    return true;
  }
  return false;
};

const decodeHtmlEntities = (value) =>
  String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const logTranslateError = (label, err) => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  console.error(`${label}:`, status ? `HTTP ${status}` : "", err?.message || err);
  if (data) {
    console.error(`${label} response:`, typeof data === "string" ? data : JSON.stringify(data));
  }
};

const translateBatchViaFreeEndpoint = async (texts, target) => {
  const results = await Promise.all(
    texts.map(async (text) => {
      const { data } = await axios.get("https://translate.googleapis.com/translate_a/single", {
        params: {
          client: "gtx",
          sl: "auto",
          tl: target,
          dt: "t",
          q: text,
        },
        timeout: 12000,
      });

      if (!Array.isArray(data?.[0])) return text;
      const joined = data[0].map((part) => (Array.isArray(part) ? part[0] : "")).join("");
      return decodeHtmlEntities(joined || text);
    })
  );

  return results;
};

const translateBatchWithGoogle = async (texts, target) => {
  if (!texts.length) return [];

  if (Date.now() < translateBackoffUntil.until) {
    return texts;
  }

  try {
    if (GOOGLE_TRANSLATE_API_KEY) {
      const { data } = await axios.post(
        "https://translation.googleapis.com/language/translate/v2",
        {
          q: texts,
          target,
          format: "text",
        },
        {
          params: { key: GOOGLE_TRANSLATE_API_KEY },
          timeout: 12000,
        }
      );

      return (data?.data?.translations || []).map((item) =>
        decodeHtmlEntities(item?.translatedText || "")
      );
    }
    return await translateBatchViaFreeEndpoint(texts, target);
  } catch (err) {
    translateBackoffUntil.until = Date.now() + 60 * 1000;
    logTranslateError("Google translate batch failed", err);

    try {
      return await translateBatchViaFreeEndpoint(texts, target);
    } catch (fallbackErr) {
      logTranslateError("Google translate fallback failed", fallbackErr);
      return texts;
    }
  }
};

app.post("/api/translate/batch", async (req, res) => {
  try {
    const target = normalizeTranslateTarget(req.body?.target);
    const textsRaw = Array.isArray(req.body?.texts) ? req.body.texts : [];
    const texts = textsRaw.slice(0, 250).map((v) => String(v ?? ""));

    if (!texts.length) {
      return res.json({ target, translations: [] });
    }

    const uniqueNeeded = [];
    const seen = new Set();

    for (const text of texts) {
      if (shouldSkipTranslation(text)) continue;
      const key = `${target}::${text}`;
      if (!translateCache.has(key) && !seen.has(text)) {
        seen.add(text);
        uniqueNeeded.push(text);
      }
    }

    const chunkJobs = [];
    for (let i = 0; i < uniqueNeeded.length; i += 50) {
      const chunk = uniqueNeeded.slice(i, i + 50);
      chunkJobs.push(
        translateBatchWithGoogle(chunk, target).then((translatedChunk) => ({ chunk, translatedChunk }))
      );
    }

    const chunkResults = await Promise.all(chunkJobs);
    for (const { chunk, translatedChunk } of chunkResults) {
      chunk.forEach((src, index) => {
        const out = translatedChunk[index] || src;
        translateCache.set(`${target}::${src}`, out);
      });
    }

    const translations = texts.map((text) => {
      if (shouldSkipTranslation(text)) return text;
      const key = `${target}::${text}`;
      return translateCache.get(key) || text;
    });

    return res.json({ target, translations });
  } catch (err) {
    console.error("Batch translation failed:", err?.message || err);
    return res.status(500).json({ error: "Batch translation failed" });
  }
});

app.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const voice = voiceMap[language] || voiceMap.en;

    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        input: { text },
        voice,
        audioConfig: { audioEncoding: "MP3" },
      }
    );

    res.json({
      audio: response.data.audioContent,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "TTS failed" });
  }
});

// Helper function to parse 12-hour time to 24-hour
function parseTime12to24(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let [_, hours, minutes, period] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);

  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

// New endpoint to schedule Durmuhurtham notification
app.post("/schedule-notification", async (req, res) => {
  try {
    const { durMuhurtam, language, date } = req.body;

    if (!durMuhurtam) {
      return res.status(400).json({ error: "Dur Muhurtam time is required" });
    }

    // Parse time
    const timeMatch = durMuhurtam.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      return res.status(400).json({ error: "Invalid time format" });
    }

    let [_, hours, minutes, period] = timeMatch;
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    const now = new Date();
    const durTime = new Date(now);
    durTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, don't schedule
    if (durTime <= now) {
      return res.json({
        message: "Durmuhurtham time has already passed today",
        scheduled: false
      });
    }

    // Calculate 1 hour before
    const alertTime = new Date(durTime.getTime() - 60 * 60 * 1000);
    const timeUntilAlert = alertTime.getTime() - now.getTime();

    // If alert time is in the past but dur time is in future
    if (timeUntilAlert < 0) {
      return res.json({
        message: "Alert time has passed, but Durmuhurtham is upcoming",
        scheduled: false
      });
    }

    // Clear any existing timeout for this date
    const existingTimeout = scheduledNotifications.get(date);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule notification
    const timeoutId = setTimeout(() => {
      console.log(`🔔 Durmuhurtham alert triggered at ${new Date().toLocaleTimeString()}`);
      scheduledNotifications.delete(date);
    }, timeUntilAlert);

    scheduledNotifications.set(date, timeoutId);

    const alertTimeStr = alertTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    res.json({
      message: "Notification scheduled successfully",
      scheduled: true,
      alertTime: alertTimeStr,
      durMuhurtam: durMuhurtam,
      timeUntilAlert: Math.round(timeUntilAlert / 1000) + " seconds"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule notification" });
  }
});

// ✅ FIXED: Generic notification checker for ALL muhurtas (Rahu Kalam, Yamaganda, Gulikai, Abhijit, Amrit Kalam, Varjyam, Durmuhurtham)
app.post("/check-notification", async (req, res) => {
  try {
    // Accept BOTH durMuhurtam (for backward compatibility) AND timeString (for all muhurtas)
    const { durMuhurtam, timeString } = req.body;
    const timeToCheck = timeString || durMuhurtam;

    if (!timeToCheck) {
      return res.json({ shouldTrigger: false });
    }

    // Parse time - extract first time from string like "06:05 PM to 06:30 PM"
    const timeMatch = timeToCheck.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      return res.json({ shouldTrigger: false });
    }

    const parsedTime = parseTime12to24(timeMatch[0]);
    if (!parsedTime) {
      return res.json({ shouldTrigger: false });
    }

    const { hours, minutes } = parsedTime;

    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(hours, minutes, 0, 0);

    // Calculate 1 hour before
    const alertTime = new Date(targetTime.getTime() - 60 * 60 * 1000);

    // Check if we're within 30 seconds of alert time
    const diff = Math.abs(now - alertTime);
    const shouldTrigger = diff < 30000; // Within 30 seconds

    res.json({
      shouldTrigger,
      currentTime: now.toLocaleTimeString('en-IN'),
      alertTime: alertTime.toLocaleTimeString('en-IN'),
      targetTime: targetTime.toLocaleTimeString('en-IN'),
      diffSeconds: Math.round(diff / 1000)
    });

  } catch (err) {
    console.error(err);
    res.json({ shouldTrigger: false, error: err.message });
  }
});

// ✅ Check if muhurta is within 1 hour (for immediate alerts on language change)
app.post("/check-durmuhurtham-status", async (req, res) => {
  try {
    // Accept BOTH durMuhurtam AND timeString
    const { durMuhurtam, timeString } = req.body;
    const timeToCheck = timeString || durMuhurtam;

    if (!timeToCheck) {
      return res.json({
        isWithinOneHour: false,
        hasPassed: false
      });
    }

    const timeMatch = timeToCheck.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      return res.json({
        isWithinOneHour: false,
        hasPassed: false
      });
    }

    const parsedTime = parseTime12to24(timeMatch[0]);
    if (!parsedTime) {
      return res.json({
        isWithinOneHour: false,
        hasPassed: false
      });
    }

    const { hours, minutes } = parsedTime;

    const now = new Date();
    const muhurtaTime = new Date(now);
    muhurtaTime.setHours(hours, minutes, 0, 0);

    const hasPassed = now > muhurtaTime;
    const diffMs = muhurtaTime - now;
    const diffMinutes = Math.round(diffMs / 60000);
    const isWithinOneHour = diffMinutes > 0 && diffMinutes <= 60;

    res.json({
      isWithinOneHour,
      hasPassed,
      minutesUntilStart: diffMinutes,
      currentTime: now.toLocaleTimeString('en-IN'),
      muhurtaTime: muhurtaTime.toLocaleTimeString('en-IN')
    });

  } catch (err) {
    console.error(err);
    res.json({
      isWithinOneHour: false,
      hasPassed: false,
      error: err.message
    });
  }
});

const PORT = process.env.SERVER_PORT || process.env.PORT || 5000;

// ─── Centralized JSON error handler ────────────────────────────────
// Must be AFTER all routes — catches any errors thrown by routes
app.use(errorHandler);

// ─── Start the HTTP Server ──────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`✅ Backend running on port ${PORT}`);
  console.log(`✅ Backend running on port ${PORT}`);
  startMuhurtaNotificationCron({ baseUrl: `http://127.0.0.1:${PORT}` });
});

// ─── Graceful Shutdown ──────────────────────────────────────────────
// When PM2 stops the process (SIGTERM) or you press Ctrl+C (SIGINT),
// we close the HTTP server and database connections cleanly.
// This prevents "in-flight" requests from being cut off abruptly.
async function gracefulShutdown(signal) {
  logger.info(`[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info("[Server] HTTP server closed. Closing database connections...");
    logger.info("[Server] All connections closed. Exiting.");
    process.exit(0);
  });

  // Force exit after 15 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error("[Server] Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 15000);
}

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // PM2 sends this
process.on("SIGINT", () => gracefulShutdown("SIGINT"));  // Ctrl+C in terminal

// Catch unhandled promise rejections (prevents silent crashes)
process.on("unhandledRejection", (reason, promise) => {
  logger.error("[Server] Unhandled Promise Rejection:", reason);
});
