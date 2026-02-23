function getApiRoot() {
  const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const base = String(rawBase).trim().replace(/\/+$/, "");

  if (!base) return "/api";
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

const API_ROOT = getApiRoot();

export async function sendChatMessage(message, settings, options = {}) {
  const selectedDay = options.selectedDay || null;
  const mode = options.mode || "panchang";

  const response = await fetch(`${API_ROOT}/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      selectedDay,
      mode,
      language: settings?.language || "en",
      friendMode: settings?.friendMode || false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chatbot request failed: ${response.status}`);
  }

  const payload = await response.json();
  const text = String(payload?.response || "").trim();
  if (!text) {
    throw new Error("Empty chatbot response");
  }

  return text;
}
