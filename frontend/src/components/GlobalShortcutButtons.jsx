import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Chatbot from "./Chatbot";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";
import { UiIcon } from "./UiIcons";

export default function GlobalShortcutButtons({ allowHomeRoute = false }) {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const location = useLocation();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  if ((location.pathname === "/" && !allowHomeRoute) || location.pathname === "/month-view") {
    return null;
  }

  return (
    <>
      <Link
        to="/astrology"
        aria-label="Open astrology pages"
        title={t.astrology || "Astrology"}
        className="fixed z-40 inline-flex items-center justify-center rounded-full h-12 w-12 sm:h-14 sm:w-14 backdrop-blur-md"
        style={{
          right: "1rem",
          bottom: "5rem",
          background: "linear-gradient(145deg, rgba(255, 210, 155, 0.18) 0%, rgba(255, 150, 80, 0.12) 55%, rgba(255, 120, 45, 0.16) 100%)",
          border: "2px solid rgba(255, 226, 176, 0.65)",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35), 0 0 26px rgba(255, 145, 65, 0.3), inset 0 1px 8px rgba(255, 250, 240, 0.18)",
        }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full h-8 w-8 sm:h-9 sm:w-9"
          style={{
            background: "linear-gradient(145deg, rgba(255, 176, 102, 0.32) 0%, rgba(255, 122, 55, 0.26) 100%)",
            border: "1px solid rgba(255, 224, 170, 0.55)",
            boxShadow: "inset 0 0 10px rgba(255, 239, 210, 0.16)",
            color: "#FFF1D6",
            fontSize: "17px",
            lineHeight: "1",
          }}
        >
          <UiIcon name="astrology" size={18} />
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setIsChatbotOpen(true)}
        aria-label="Open chatbot"
        title={t.chatbot || "Chatbot"}
        className="fixed z-40 inline-flex items-center justify-center rounded-full h-12 w-12 sm:h-14 sm:w-14 backdrop-blur-md"
        style={{
          right: "1rem",
          bottom: "9.75rem",
          background: "linear-gradient(145deg, rgba(255, 210, 155, 0.2) 0%, rgba(255, 150, 80, 0.12) 55%, rgba(255, 120, 45, 0.18) 100%)",
          border: "2px solid rgba(255, 226, 176, 0.7)",
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35), 0 0 26px rgba(255, 145, 65, 0.3), inset 0 1px 8px rgba(255, 250, 240, 0.2)",
        }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full h-8 w-8 sm:h-9 sm:w-9"
          style={{
            background: "linear-gradient(145deg, rgba(255, 176, 102, 0.35) 0%, rgba(255, 122, 55, 0.28) 100%)",
            border: "1px solid rgba(255, 224, 170, 0.6)",
            boxShadow: "inset 0 0 10px rgba(255, 239, 210, 0.18)",
            color: "#FFF1D6",
            fontSize: "17px",
            lineHeight: "1",
          }}
        >
          <UiIcon name="chat" size={18} />
        </span>
      </button>

      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        selectedDay={null}
        panchangData={null}
        currentView="calendar"
        language={language}
      />
    </>
  );
}
