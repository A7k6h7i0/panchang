import { useState, useRef, useEffect } from "react";
import { speakCloud } from "../utils/cloudSpeech";

function buildChatbotUrl() {
  const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const base = String(rawBase).trim().replace(/\/+$/, "");
  if (!base) return "/api/chatbot";
  if (base.endsWith("/api")) return `${base}/chatbot`;
  return `${base}/api/chatbot`;
}

export default function Chatbot({ 
  isOpen, 
  onClose, 
  language, 
  translations, 
  currentDateData, 
  selectedDay, 
  voiceEnabled = false,
  mode = "panchang" // "panchang" or "rashiphalalu"
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState("text"); // 'text' or 'voice'
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome message based on mode
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg = mode === "rashiphalalu" 
        ? {
            type: 'bot',
            text: translations?.rashiphalaluWelcome || "Welcome to Rashiphalalu! Ask me about your zodiac predictions.",
            timestamp: new Date()
          }
        : {
            type: 'bot',
            text: translations?.panchangWelcome || "Welcome to Panchang AI Assistant! Ask me about tithi, nakshatra, festivals, auspicious timings, or anything about the Panchang.",
            timestamp: new Date()
          };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, mode]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = getLanguageCode(language);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setInputMode("voice");
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [language]);

  const getLanguageCode = (lang) => {
    const languageCodes = {
      en: 'en-US',
      te: 'te-IN',
      hi: 'hi-IN',
      ml: 'ml-IN',
      kn: 'kn-IN',
      ta: 'ta-IN'
    };
    return languageCodes[lang] || 'en-US';
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(translations?.voiceNotSupported || "Voice recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
        setIsRecording(false);
      }
    } else {
      try {
        recognitionRef.current.lang = getLanguageCode(language);
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const currentMode = inputMode;
    const userMessage = {
      type: 'user',
      text: inputText,
      mode: currentMode,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(buildChatbotUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          language,
          calendarData: currentDateData,
          selectedDay,
          mode // Pass current mode to backend
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.response || data?.error || `Request failed with status ${response.status}`);
      }

      const botMessage = {
        type: 'bot',
        text: data?.response || translations?.noDataAvailable || "This information is not available in the Panchang data.",
        mode: currentMode === 'voice' ? 'voice' : 'text',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // If user used voice, respond with voice
      if (currentMode === 'voice' && voiceEnabled) {
        speakCloud(botMessage.text, language);
      }

    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: error?.message || translations?.error || "This information is not available in the Panchang data.",
        mode: 'text',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
    setInputText("");
    setInputMode("text");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message text with markdown-like formatting
  const formatMessage = (text) => {
    // Bold text between **
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx}>{part}</strong>;
      }
      return part;
    });
  };

  if (!isOpen) return null;

  const modeTitle = mode === "rashiphalalu" 
    ? (translations?.rashiphalalu || "Rashiphalalu") 
    : (translations?.panchangAssistant || "Panchang AI Assistant");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl h-[600px] bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕉️</span>
            <div>
              <h2 className="text-lg font-bold">{modeTitle}</h2>
              <p className="text-xs opacity-90">
                {isRecording 
                  ? (translations?.listening || "🎙️ Listening...") 
                  : (translations?.askAnything || "Ask about tithi, nakshatra & more")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-md ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {formatMessage(msg.text)}
                </div>
                <div className={`text-xs mt-1 ${msg.type === 'user' ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.mode === 'voice' && ' 🎙️'}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-orange-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
          <div className="flex items-end gap-2">
            <button
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`p-3 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-orange-100 dark:bg-gray-700 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={translations?.typeMessage || "Type your question..."}
              disabled={isLoading || isRecording}
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 resize-none max-h-32"
              style={{ minHeight: '48px' }}
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            {translations?.chatbotHint || "💡 Tip: Ask about tithi, nakshatra, festivals, or auspicious timings"}
          </div>
        </div>
      </div>
    </div>
  );
}
