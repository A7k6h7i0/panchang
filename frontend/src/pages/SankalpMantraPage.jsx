import { useState } from "react";
import PageShell from "./PageShell";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";
import { speakCloud, stopSpeech } from "../utils/cloudSpeech";

const MANTRAS = [
  {
    title: "Sankalpa (short)",
    text: "ॐ तत्सत् अद्य मम उपात्त समस्त दुरितक्षयद्वारा श्री परमेश्वर प्रीत्यर्थं शुभकृत्यं करिष्ये।",
    meaningTe: "ఈ రోజున నేను అన్ని పాపక్షయానికి, శ్రీ పరమేశ్వరుని ప్రీతికోసం, శుభ కార్యాన్ని భక్తితో చేయాలని సంకల్పిస్తున్నాను.",
  },
  {
    title: "Ganapati",
    text: "ॐ गं गणपतये नमः।",
    meaningTe: "ఓం, గణపతి దేవునికి నమస్కారం.",
  },
  {
    title: "Saraswati",
    text: "ॐ ऐं सरस्वत्यै नमः।",
    meaningTe: "ఓం, సరస్వతీ దేవికి నమస్కారం.",
  },
];

function SpeakerIcon({ active = false }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10V14H8L13 19V5L8 10H4Z"
        fill={active ? "#FFD24A" : "#FFFFFF"}
      />
      <path
        d="M16 9.5C17.3333 10.8333 17.3333 13.1667 16 14.5"
        stroke={active ? "#8FD7FF" : "#FFD24A"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.5 7C21 9.5 21 14.5 18.5 17"
        stroke={active ? "#8FD7FF" : "#FFD24A"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SankalpMantraPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [activeMantra, setActiveMantra] = useState("");

  const stopSpeaking = () => {
    stopSpeech();
    setActiveMantra("");
  };

  const speakMantra = async (mantra) => {
    if (activeMantra === mantra.title) {
      stopSpeaking();
      return;
    }

    stopSpeech();
    setActiveMantra(mantra.title);

    try {
      await speakCloud(mantra.text, "hi", `${mantra.title}:sanskrit`);
      if (mantra.meaningTe) {
        await speakCloud(mantra.meaningTe, "te", `${mantra.title}:telugu-meaning`);
      }
    } finally {
      setActiveMantra("");
    }
  };

  return (
    <PageShell title={t.sankalp_mantra || "Sankalp Mantra"} transparent>
      <div className="grid gap-4">
        {MANTRAS.map((m) => (
          <section
            key={m.title}
            className="app-surface rounded-3xl p-5"
            style={{ background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-black text-amber-100">{m.title}</div>
              <button
                type="button"
                onClick={() => speakMantra(m)}
                className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: activeMantra === m.title ? "rgba(143, 215, 255, 0.16)" : "rgba(245, 198, 66, 0.18)",
                  border: "1.5px solid rgba(245, 198, 66, 0.65)",
                  boxShadow: activeMantra === m.title ? "0 0 12px rgba(143, 215, 255, 0.45)" : "none",
                }}
                aria-label={activeMantra === m.title ? `Stop ${m.title} audio` : `Play ${m.title} audio`}
                title={activeMantra === m.title ? "Stop audio" : "Play audio"}
              >
                <SpeakerIcon active={activeMantra === m.title} />
              </button>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-base text-amber-50">{m.text}</div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-100/90">
              <span className="font-black">తెలుగు అర్థం: </span>
              {m.meaningTe}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
