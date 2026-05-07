import { useCallback, useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import VoiceInput from "./VoiceInput";
import { sendChatMessage } from "./chatService";
import { speakCloud, stopSpeech as stopCloudSpeech } from "../utils/cloudSpeech";

const translations = {
  en: {
    welcomeFriend: "I'm your Panchanga Friend. Ask me anything!",
    welcomeFormal: "Hello! I'm your Panchanga assistant. How can I help?",
    errorMessage: "Sorry, something went wrong. Please try again!",
    emptyTitle: "Welcome to Panchanga Friend!",
    emptySubtitle: "Get daily panchanga, auspicious times, Rahukalam and more",
    inputPlaceholder: "Type your question...",
  },
  te: {
    welcomeFriend: "నేను మీ పంచాంగ ఫ్రెండ్. ఏదైనా అడగండి!",
    welcomeFormal: "నమస్కారం! నేను మీ పంచాంగ సహాయకుడిని. ఎలా సహాయం చేయను?",
    errorMessage: "క్షమించండి, ఏదో తప్పు జరిగింది. మళ్లీ ప్రయత్నించండి!",
    emptyTitle: "పంచాంగ ఫ్రెండ్ కి స్వాగతం!",
    emptySubtitle: "రోజువారీ పంచాంగం, రాహుకాలం మరియు శుభ సమయాలు తెలుసుకోండి",
    inputPlaceholder: "మీ ప్రశ్న టైప్ చేయండి...",
  },
  hi: {
    welcomeFriend: "मैं तुम्हारा पंचांग फ्रेंड हूँ। कुछ भी पूछो!",
    welcomeFormal: "नमस्ते! मैं आपका पंचांग सहायक हूँ। कैसे मदद करूँ?",
    errorMessage: "क्षमा करें, कुछ गलत हो गया। फिर से प्रयास करें!",
    emptyTitle: "पंचांग फ्रेंड में आपका स्वागत है!",
    emptySubtitle: "दैनिक पंचांग, राहुकाल और शुभ समय जानें",
    inputPlaceholder: "अपना सवाल टाइप करें...",
  },
  ml: {
    welcomeFriend: "ഞാൻ നിങ്ങളുടെ പഞ്ചാംഗ സുഹൃത്ത്. എന്തും ചോദിക്കൂ!",
    welcomeFormal: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ പഞ്ചാംഗ സഹായിയാണ്. ഞാൻ എങ്ങനെ സഹായിക്കാം?",
    errorMessage: "ക്ഷമിക്കണം, ചില പിഴവ് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കൂ!",
    emptyTitle: "പഞ്ചാംഗ സുഹൃത്തിലേക്ക് സ്വാഗതം!",
    emptySubtitle: "ദിന പഞ്ചാംഗം, രാഹുകാലം, ശുഭസമയങ്ങൾ അറിയാം",
    inputPlaceholder: "നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക...",
  },
  kn: {
    welcomeFriend: "ನಾನು ನಿಮ್ಮ ಪಂಚಾಂಗ ಮಿತ್ರ. ಏನಾದರೂ ಕೇಳಿ!",
    welcomeFormal: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಪಂಚಾಂಗ ಸಹಾಯಕ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    errorMessage: "ಕ್ಷಮಿಸಿ, ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ!",
    emptyTitle: "ಪಂಚಾಂಗ ಮಿತ್ರಕ್ಕೆ ಸ್ವಾಗತ!",
    emptySubtitle: "ದೈನಂದಿನ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ ಮತ್ತು ಶುಭ ಸಮಯಗಳನ್ನು ನೋಡಿ",
    inputPlaceholder: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...",
  },
  ta: {
    welcomeFriend: "நான் உங்கள் பஞ்சாங்க நண்பன். எதையும் கேளுங்கள்!",
    welcomeFormal: "வணக்கம்! நான் உங்கள் பஞ்சாங்க உதவியாளர். நான் எப்படி உதவலாம்?",
    errorMessage: "மன்னிக்கவும், ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயற்சிக்கவும்!",
    emptyTitle: "பஞ்சாங்க நண்பனுக்கு வரவேற்பு!",
    emptySubtitle: "தினசரி பஞ்சாங்கம், ராகுகாலம் மற்றும் நல்ல நேரங்களை அறியுங்கள்",
    inputPlaceholder: "உங்கள் கேள்வியை টাইப் செய்யுங்கள்...",
  },
};

function getT(language) {
  return translations[language] || translations.en;
}

function getApiRoot() {
  const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const base = String(rawBase).trim().replace(/\/+$/, "");
  if (!base) return "/api";
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

function normalizeLanguage(language) {
  return String(language || "en").trim().toLowerCase() || "en";
}

function shouldTranslateMessage(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (value.length < 2 || value.length > 500) return false;
  if (/^[\d\s\W_]+$/u.test(value)) return false;
  return true;
}

async function translateBatchTexts(target, texts, signal) {
  if (!texts.length) return [];

  try {
    const res = await fetch(`${getApiRoot()}/translate/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, texts }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Translate API failed (${res.status})`);
    }

    const payload = await res.json();
    return Array.isArray(payload?.translations) ? payload.translations : texts;
  } catch (error) {
    console.warn("Chat translation fallback used:", error?.message || error);
    return texts;
  }
}

function sanitizeSpeechText(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_`~#]+/g, " ")
    .replace(/^\s*[-•●◦▪▫]+\s*/gm, " ")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function ChatInterface({
  messages,
  setMessages,
  settings,
  selectedDay,
  panchangData,
  mode = "panchang",
  isOpen = true,
  resetSignal = 0,
}) {
  const t = getT(settings.language);
  const language = normalizeLanguage(settings.language);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayMessages, setDisplayMessages] = useState(messages);

  const loadingTexts = [
    t.loadingProcessing || "Processing request...",
    t.loadingGathering || "Gathering local data...",
    t.loadingGenerating || "Generating response...",
  ];

  const messagesEndRef = useRef(null);
  const prevLanguageRef = useRef(settings.language);
  const speechRequestRef = useRef(0);
  const translateCacheRef = useRef(new Map());
  const translateRunRef = useRef(0);

  const beginSpeech = useCallback(() => {
    const nextRequestId = speechRequestRef.current + 1;
    speechRequestRef.current = nextRequestId;
    setIsSpeaking(true);
    return nextRequestId;
  }, []);

  const stopSpeech = useCallback(() => {
    speechRequestRef.current += 1;
    setIsSpeaking(false);
    stopCloudSpeech();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loadingTextIndex]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingTextIndex(0);
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 1500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, loadingTexts.length]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = {
        id: Date.now().toString(),
        text: settings.friendMode ? t.welcomeFriend : t.welcomeFormal,
        sender: "bot",
        timestamp: new Date(),
        language: settings.language,
      };
      setMessages([welcomeMsg]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevLanguageRef.current !== settings.language) {
      prevLanguageRef.current = settings.language;
    }
  }, [settings.language, setMessages]);

  useEffect(() => {
    let cancelled = false;
    const runId = ++translateRunRef.current;
    const currentLanguage = language || "en";
    const controller = new AbortController();

    const applyDisplayMessages = async () => {
      const baseMessages = messages.map((msg) => ({ ...msg }));

      if (currentLanguage === "en") {
        if (!cancelled && runId === translateRunRef.current) {
          setDisplayMessages(baseMessages.map((msg) => ({ ...msg, displayText: msg.text })));
        }
        return;
      }

      const pendingTexts = [];
      baseMessages.forEach((msg) => {
        const sourceText = String(msg.text || "");
        if (!sourceText) return;
        if (msg.language === currentLanguage || !shouldTranslateMessage(sourceText)) return;

        const cacheKey = `${currentLanguage}::${sourceText}`;
        if (!translateCacheRef.current.has(cacheKey)) {
          pendingTexts.push(sourceText);
        }
      });

      const translatedMessages = baseMessages.map((msg) => {
        const sourceText = String(msg.text || "");
        if (!sourceText) return { ...msg, displayText: sourceText };
        if (msg.language === currentLanguage || !shouldTranslateMessage(sourceText)) {
          return { ...msg, displayText: sourceText };
        }

        const cacheKey = `${currentLanguage}::${sourceText}`;
        return {
          ...msg,
          displayText: translateCacheRef.current.get(cacheKey) || sourceText,
        };
      });

      if (!cancelled && runId === translateRunRef.current) {
        setDisplayMessages(translatedMessages);
      }

      const uniquePending = [...new Set(pendingTexts)];
      if (!uniquePending.length) return;

      const controller = new AbortController();
      try {
        for (let i = 0; i < uniquePending.length; i += 50) {
          const chunk = uniquePending.slice(i, i + 50);
          const translatedChunk = await translateBatchTexts(currentLanguage, chunk, controller.signal);
          if (cancelled || runId !== translateRunRef.current) return;

          chunk.forEach((sourceText, index) => {
            const translated = translatedChunk[index] || sourceText;
            translateCacheRef.current.set(`${currentLanguage}::${sourceText}`, translated);
          });
        }

        if (cancelled || runId !== translateRunRef.current) return;

        setDisplayMessages(
          baseMessages.map((msg) => {
            const sourceText = String(msg.text || "");
            if (!sourceText) return { ...msg, displayText: sourceText };
            if (msg.language === currentLanguage || !shouldTranslateMessage(sourceText)) {
              return { ...msg, displayText: sourceText };
            }

            const cacheKey = `${currentLanguage}::${sourceText}`;
            return {
              ...msg,
              displayText: translateCacheRef.current.get(cacheKey) || sourceText,
            };
          })
        );
      } catch (error) {
        if (!cancelled && runId === translateRunRef.current) {
          console.warn("Chat translation failed:", error?.message || error);
        }
      }
    };

    applyDisplayMessages();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [messages, language]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
    }
  }, [isOpen, stopSpeech]);

  useEffect(() => {
    stopSpeech();
  }, [resetSignal, stopSpeech]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const speakText = useCallback(
    async (text, currentSettings) => {
      const cleanText = sanitizeSpeechText(text);

      if (!cleanText) {
        stopSpeech();
        return;
      }

      stopSpeech();
      const requestId = beginSpeech();

      try {
        await speakCloud(cleanText, currentSettings?.language || "en");
      } finally {
        if (speechRequestRef.current === requestId) {
          setIsSpeaking(false);
        }
      }
    },
    [beginSpeech, stopSpeech]
  );

  const handleSend = async (incomingText, options = {}) => {
    const { fromVoice = false } = options;
    const finalText = (incomingText ?? input).trim();
    if (!finalText || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: finalText,
      sender: "user",
      timestamp: new Date(),
      language: settings.language,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(finalText, settings, {
        selectedDay,
        panchangData,
        mode,
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
        language: settings.language,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (fromVoice) {
        speakText(response, settings);
      }
    } catch {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: t.errorMessage,
        sender: "bot",
        timestamp: new Date(),
        language: settings.language,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (text) => {
    setInput(text);
    handleSend(text, { fromVoice: true });
  };

  const handleMicToggle = useCallback(() => {
    stopSpeech();
  }, [stopSpeech]);

  return (
    <div
      className="h-full flex flex-col rounded-t-3xl"
      style={{
        background: "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
      }}
    >
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#7b2024] to-[#c96a2a] rounded-full flex items-center justify-center mb-4">
              <i className="ri-calendar-check-line text-white text-5xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-[#FFE8C5] mb-2">{t.emptyTitle}</h2>
            <p className="text-sm text-[#EBCFA8]">{t.emptySubtitle}</p>
          </div>
        )}

        {displayMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} settings={settings} onSpeak={speakText} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7b2024] to-[#c96a2a] rounded-full flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor" aria-hidden="true">
                <path d="M10 2h4v2h-4zM7 6h10a4 4 0 0 1 4 4v5a5 5 0 0 1-5 5h-2v2h-4v-2H8a5 5 0 0 1-5-5v-5a4 4 0 0 1 4-4Zm1 4a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3Zm8 1.5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0Z" />
              </svg>
            </div>
            <div className="bg-[rgba(58,5,8,0.72)] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm min-w-[200px] border border-[rgba(255,183,77,0.18)]">
              <div className="flex items-center gap-2 text-[#FFD9A6]">
                <svg viewBox="0 0 24 24" className="w-4 h-4 animate-spin text-[#FFD9A6] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                </svg>
                <div className="text-xs font-medium relative h-[16px] overflow-hidden flex-1">
                  <div key={loadingTextIndex} className="absolute inset-0 animate-[slideUp_0.3s_ease-out_forwards]">
                    {loadingTexts[loadingTextIndex]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-[rgba(58,5,8,0.92)] border-t border-[rgba(255,183,77,0.18)]">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,183,77,0.18)] rounded-3xl px-4 flex items-center gap-2 min-h-[44px]">
            {isSpeaking ? (
              <div
                className="flex items-center gap-2 mr-1 rounded-full border border-[rgba(255,217,166,0.22)] bg-[rgba(123,32,36,0.35)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFD9A6]"
                aria-live="polite"
                aria-label="Bot is speaking"
              >
                <span className="flex items-end gap-0.5 h-4" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span
                      key={index}
                      className="w-1 rounded-full bg-[#FFD9A6]"
                      style={{
                        height: `${8 + ((index + 1) % 3) * 4}px`,
                        animation: "chatbotWave 1s ease-in-out infinite",
                        animationDelay: `${index * 0.12}s`,
                      }}
                    />
                  ))}
                </span>
                <span>Speaking</span>
              </div>
            ) : null}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t.inputPlaceholder}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#FFE8C5] placeholder-[#D8B88B] py-2.5 relative z-10"
              disabled={isLoading}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <VoiceInput
              onTranscript={handleVoiceInput}
              settings={settings}
              isOpen={isOpen}
              resetSignal={resetSignal}
              onToggleSpeech={handleMicToggle}
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 flex-shrink-0 bg-gradient-to-br from-[#7b2024] to-[#c96a2a] rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            aria-label="Send message"
            title="Send"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor" aria-hidden="true">
              <path d="M3.4 20.4L22 12 3.4 3.6 3 10l13 2-13 2z" />
            </svg>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes chatbotWave {
          0%, 100% {
            transform: scaleY(0.45);
            opacity: 0.55;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
