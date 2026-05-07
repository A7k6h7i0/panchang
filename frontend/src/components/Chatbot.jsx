import { useState, useEffect } from "react";
import ChatInterface from "../chatbot/ChatInterface";
import { stopSpeech as stopCloudSpeech } from "../utils/cloudSpeech";

const defaultSettings = {
  language: "te",
  voiceSpeed: 1,
  voiceType: "female",
  autoPlay: true,
  friendMode: true,
  city: "Hyderabad",
};

const chatbotTranslations = {
  en: {
    appTitle: "Panchanga Friend",
    newChat: "New Chat",
    confirmNewChat: "Start a new chat? Current chat will be deleted.",
    close: "Close",
  },
  te: {
    appTitle: "Panchanga Friend",
    newChat: "New Chat",
    confirmNewChat: "Start a new chat? Current chat will be deleted.",
    close: "Close",
  },
  hi: {
    appTitle: "Panchanga Friend",
    newChat: "New Chat",
    confirmNewChat: "Start a new chat? Current chat will be deleted.",
    close: "Close",
  },
};

function t(key, lang) {
  return chatbotTranslations[lang]?.[key] || chatbotTranslations.en[key] || key;
}

function loadInitialMessages() {
  try {
    const saved = localStorage.getItem("panchang_chatbot_messages");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function loadInitialSettings() {
  try {
    const saved = localStorage.getItem("panchang_chatbot_settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function Chatbot({ isOpen, onClose, selectedDay, panchangData, currentView = "calendar", language }) {
  const [messages, setMessages] = useState(loadInitialMessages);
  const [settings] = useState(loadInitialSettings);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    localStorage.setItem("panchang_chatbot_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
    }
  }, [isOpen]);

  const stopAllSpeech = () => {
    stopCloudSpeech();
  };

  const handleNewChat = () => {
    if (confirm(t("confirmNewChat", effectiveSettings.language))) {
      stopAllSpeech();
      setResetSignal((v) => v + 1);
      setMessages([]);
      localStorage.removeItem("panchang_chatbot_messages");
    }
  };

  const handleClose = () => {
    stopAllSpeech();
    setResetSignal((v) => v + 1);
    if (onClose) onClose();
  };

  const mode = currentView === "rashiphalalu" ? "rashiphalalu" : "panchang";
  const effectiveSettings = { ...settings, language: language || settings.language };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 notranslate"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      translate="no"
      data-no-auto-translate="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-md h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-orange-100 flex flex-col"
        style={{
          background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
          border: "2.5px solid rgba(255, 183, 77, 0.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[rgba(58,5,8,0.82)] backdrop-blur-md shadow-sm border-b border-[rgba(255,183,77,0.18)]">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,183,77,0.14)] text-[#FFD9A6] border border-[rgba(255,183,77,0.28)] flex items-center justify-center text-lg font-semibold">
                AI
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#FFE8C5]">{t("appTitle", effectiveSettings.language)}</h1>
                <p className="text-xs text-[#EBCFA8]">{effectiveSettings.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[rgba(255,183,77,0.12)] text-[#FFE8C5] transition-colors"
                title={t("newChat", effectiveSettings.language)}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FFE8C5]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[rgba(255,183,77,0.12)] text-[#FFE8C5] transition-colors"
                title={t("close", effectiveSettings.language)}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#FFE8C5]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            settings={effectiveSettings}
            selectedDay={selectedDay}
            panchangData={panchangData}
            mode={mode}
            isOpen={isOpen}
            resetSignal={resetSignal}
          />
        </div>
      </div>
    </div>
  );
}
