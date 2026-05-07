import dotenv from 'dotenv';
dotenv.config();

import { askGemini } from './services/geminiChatService.js';
import { buildHoroscopeContext } from './services/rashiphalService.js';

const toolExecuter = async (name, args) => {
    return { error: "Unknown tool" };
};

const tools = [];

async function run() {
    try {
        console.log("Asking Gemini...");
        const msg = "today's rasiphalalu for gemini";
        const response = await askGemini({
            message: msg,
            tools,
            toolExecuter,
            horoscopeContext: buildHoroscopeContext({ message: msg, language: "en" })
        });
        console.log("\n=== Response ===\n", response);
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
