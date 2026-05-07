import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../backend/.env") });

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

async function synthesizeText(text) {
  try {
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        input: { text },
        voice: { languageCode: "te-IN", name: "te-IN-Standard-A" },
        audioConfig: { audioEncoding: "MP3" },
      }
    );
    console.log(`Success for: "${text}"`);
    return response.data.audioContent;
  } catch (err) {
    console.error(`Error for "${text}":`, err.response?.data || err.message);
    return null;
  }
}

async function run() {
  const variations = [
    "09:57 ఉదయం నుండి 11:27 ఉదయం వరకు",
    "09 57 ఉదయం నుండి 11 27 ఉదయం వరకు",
    "తొమ్మిది గంటల యాభై ఏడు నిమిషాలు ఉదయం నుండి పదకొండు గంటల ఇరవై ఏడు నిమిషాలు ఉదయం వరకు",
    "09 గంటల 57 నిమిషాలు ఉదయం నుండి 11 గంటల 27 నిమిషాలు ఉదయం వరకు"
  ];
  
  for (let i = 0; i < variations.length; i++) {
    const text = variations[i];
    const audioContent = await synthesizeText(text);
    if (audioContent) {
      fs.writeFileSync(`test_audio_${i}.mp3`, audioContent, "base64");
    }
  }
  console.log("Done");
}

run();
