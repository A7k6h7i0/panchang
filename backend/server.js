import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 PUT YOUR API KEY HERE (or use env later)
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

// Import chatbot route
import chatbotRoutes from "./routes/chatbot.js";
app.use("/api", chatbotRoutes);


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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

