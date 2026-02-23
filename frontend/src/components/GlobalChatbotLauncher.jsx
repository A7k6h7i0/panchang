import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Chatbot from "./Chatbot";
import { LANGUAGE_CHANGE_EVENT, loadLanguage } from "../utils/appSettings";

function loadInitialLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    return loadLanguage() || "en";
  } catch {
    return "en";
  }
}

export default function GlobalChatbotLauncher() {
  const location = useLocation();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatButtonPos, setChatButtonPos] = useState({ x: null, y: null });
  const [language, setLanguage] = useState(loadInitialLanguage);
  const chatButtonRef = useRef(null);
  const dragStateRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const isMonthView = location.pathname === "/month-view";

  const clampChatPosition = (x, y) => {
    if (typeof window === "undefined") return { x, y };
    const rect = chatButtonRef.current?.getBoundingClientRect();
    const width = rect?.width || (window.innerWidth >= 640 ? 56 : 48);
    const height = rect?.height || (window.innerHeight >= 640 ? 56 : 48);
    const edgePad = 8;
    const maxX = Math.max(edgePad, window.innerWidth - width - edgePad);
    const maxY = Math.max(edgePad, window.innerHeight - height - edgePad);
    return {
      x: Math.min(Math.max(edgePad, x), maxX),
      y: Math.min(Math.max(edgePad, y), maxY),
    };
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncLanguage = () => {
      const next = loadInitialLanguage();
      setLanguage((prev) => (prev === next ? prev : next));
    };
    window.addEventListener("storage", syncLanguage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setDefaultPosition = () => {
      setChatButtonPos((prev) => {
        if (prev.x !== null && prev.y !== null) return prev;
        const size = window.innerWidth >= 640 ? 56 : 48;
        const margin = window.innerWidth >= 640 ? 24 : 16;
        return {
          x: window.innerWidth - size - margin,
          y: window.innerHeight - size - margin,
        };
      });
    };

    const handleResize = () => {
      setChatButtonPos((prev) => {
        if (prev.x === null || prev.y === null) return prev;
        return clampChatPosition(prev.x, prev.y);
      });
    };

    setDefaultPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChatButtonPointerDown = (event) => {
    if (!chatButtonRef.current) return;
    event.preventDefault();
    const rect = chatButtonRef.current.getBoundingClientRect();
    dragStateRef.current = {
      dragging: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    const onPointerMove = (moveEvent) => {
      if (!dragStateRef.current.dragging) return;
      const nextX = moveEvent.clientX - dragStateRef.current.offsetX;
      const nextY = moveEvent.clientY - dragStateRef.current.offsetY;
      setChatButtonPos(clampChatPosition(nextX, nextY));
    };

    const onPointerUp = () => {
      dragStateRef.current.dragging = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  if (isMonthView) return null;

  return (
    <>
      <button
        ref={chatButtonRef}
        type="button"
        aria-label="Open chatbot"
        title="Open chatbot"
        onClick={() => setIsChatbotOpen(true)}
        onPointerDown={handleChatButtonPointerDown}
        className="fixed z-40 inline-flex items-center justify-center rounded-full h-12 w-12 sm:h-14 sm:w-14 backdrop-blur-md cursor-grab active:cursor-grabbing"
        style={{
          background:
            "linear-gradient(145deg, rgba(255, 210, 155, 0.22) 0%, rgba(255, 150, 80, 0.16) 55%, rgba(255, 120, 45, 0.2) 100%)",
          border: "2px solid rgba(255, 226, 176, 0.75)",
          boxShadow:
            "0 12px 28px rgba(0, 0, 0, 0.4), 0 0 26px rgba(255, 145, 65, 0.4), inset 0 1px 8px rgba(255, 250, 240, 0.22)",
          touchAction: "none",
          ...(chatButtonPos.x === null || chatButtonPos.y === null
            ? { right: "1rem", bottom: "1rem" }
            : { left: `${chatButtonPos.x}px`, top: `${chatButtonPos.y}px` }),
        }}
      >
        <span
          className="inline-flex items-center justify-center rounded-full h-8 w-8 sm:h-9 sm:w-9"
          style={{
            background:
              "linear-gradient(145deg, rgba(255, 176, 102, 0.38) 0%, rgba(255, 122, 55, 0.32) 100%)",
            border: "1px solid rgba(255, 224, 170, 0.65)",
            boxShadow: "inset 0 0 10px rgba(255, 239, 210, 0.2)",
            color: "#FFF1D6",
            fontSize: "17px",
            lineHeight: "1",
          }}
        >
          {"\uD83D\uDCAC"}
        </span>
      </button>

      {isChatbotOpen ? (
        <Chatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          language={language}
          currentView="calendar"
          selectedDay={null}
        />
      ) : null}
    </>
  );
}
