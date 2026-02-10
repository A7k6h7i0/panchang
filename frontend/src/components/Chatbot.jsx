import { useState, useRef, useEffect } from "react";
import { speakCloud } from "../utils/cloudSpeech";

function buildChatbotUrl() {
  const rawBase =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
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
  selectedDay 
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
      alert("Voice recognition is not supported in your browser.");
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
          selectedDay
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
        text: data?.response || "This information is not available in the Panchang data.",
        mode: currentMode === 'voice' ? 'voice' : 'text',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // If user used voice, respond with voice
      if (currentMode === 'voice') {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
        style={{
          background: "linear-gradient(135deg, #4a0e0e 0%, #d8691e 50%, #4a0e0e 100%)",
          maxHeight: "calc(100dvh - 2rem)",
        }}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between rounded-t-2xl"
          style={{
            background: "rgba(90, 25, 8, 0.5)",
            borderBottom: "2px solid rgba(255, 140, 50, 0.5)"
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(255, 140, 50, 0.8) 0%, rgba(255, 100, 30, 0.9) 100%)",
              }}
            >
              <span className="text-xl">🗣️</span>
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#FFE4B5" }}>
                {translations?.chatbotTitle || "Panchang Assistant"}
              </h3>
              <p className="text-xs" style={{ color: "rgba(255, 228, 181, 0.7)" }}>
                {isRecording ? "🎙️ Listening..." : "Ask about tithi, nakshatra & more"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: "#FFE4B5" }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8" style={{ color: "rgba(255, 228, 181, 0.7)" }}>
              <div className="text-4xl mb-4">🗓️</div>
              <p className="text-sm">
                {translations?.chatbotWelcome || "Welcome! Ask me about:"}
              </p>
              <ul className="text-xs mt-2 space-y-1" style={{ color: "rgba(255, 228, 181, 0.5)" }}>
                <li>• {translations?.tithi || "Today's tithi"}</li>
                <li>• {translations?.nakshatra || "Current nakshatra"}</li>
                <li>• {translations?.festivals || "Festival details"}</li>
                <li>• {translations?.muhurta || "Muhurta timings"}</li>
              </ul>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'rounded-br-md'
                    : 'rounded-bl-md'
                }`}
                style={{
                  background: message.type === 'user'
                    ? "linear-gradient(135deg, rgba(255, 140, 50, 0.9) 0%, rgba(255, 100, 30, 0.95) 100%)"
                    : "rgba(255, 255, 255, 0.1)",
                  color: message.type === 'user' ? "#FFFFFF" : "#FFE4B5",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{message.text}</span>
                  {message.mode === 'voice' && message.type === 'user' && (
                    <span className="text-xs opacity-70">🎙️</span>
                  )}
                  {message.mode === 'voice' && message.type === 'bot' && (
                    <button
                      onClick={() => speakCloud(message.text, language)}
                      className="text-xs opacity-70 hover:opacity-100"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div 
                className="rounded-2xl rounded-bl-md px-4 py-3"
                style={{ background: "rgba(255, 255, 255, 0.1)", color: "#FFE4B5" }}
              >
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div 
          className="p-4 rounded-b-2xl"
          style={{
            background: "rgba(90, 25, 8, 0.5)",
            borderTop: "2px solid rgba(255, 140, 50, 0.5)"
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleVoiceInput}
              className={`p-3 rounded-full transition-all ${
                isRecording 
                  ? "animate-pulse" 
                  : "hover:bg-white/10"
              }`}
              style={{
                background: isRecording 
                  ? "rgba(255, 50, 50, 0.8)" 
                  : "rgba(255, 140, 50, 0.3)",
                color: "#FFE4B5"
              }}
            >
              {isRecording ? "⏹️" : "🎙️"}
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (!isRecording) {
                  setInputMode("text");
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={isRecording 
                ? translations?.listening || "Listening..." 
                : translations?.typeQuestion || "Type your question..."
              }
              className="flex-1 px-4 py-3 rounded-full outline-none"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#FFE4B5",
                border: "2px solid rgba(255, 140, 50, 0.3)"
              }}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: inputText.trim() && !isLoading
                  ? "linear-gradient(135deg, rgba(255, 140, 50, 0.9) 0%, rgba(255, 100, 30, 0.95) 100%)"
                  : "rgba(255, 140, 50, 0.3)",
                color: "#FFFFFF"
              }}
            >
              ➤
            </button>
          </div>
          
          <p className="text-xs text-center mt-2" style={{ color: "rgba(255, 228, 181, 0.5)" }}>
            {translations?.chatbotHint || "Tip: Use voice for voice responses, type for text responses"}
          </p>
        </div>
      </div>
    </div>
  );
}
