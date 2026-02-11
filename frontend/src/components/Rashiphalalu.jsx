import { useState, useEffect } from "react";
import { RASHIS } from "../data/rashiphalalu";
import { 
  RASHIPHALALU_DATA, 
  getRashiText, 
  getCurrentRashi, 
  RASHI_NAMES 
} from "../data/rashiphalalu";

// Period labels in all languages
const PERIOD_LABELS = {
  daily: { en: "Daily", te: "దైన", hi: "दैनिक", ml: "ദിവസം", kn: "ದೈನಂದಿನ", ta: "தினம்" },
  weekly: { en: "Weekly", te: "వారానికి", hi: "साप्ताहिक", ml: "ആഴ്ച", kn: "ಸಾಪ್ತಾಹಿಕ", ta: "வாரம்" },
  monthly: { en: "Monthly", te: "నెలకి", hi: "मासिक", ml: "മാസം", kn: "ಮಾಸಿಕ", ta: "மாதம்" },
  yearly: { en: "Yearly", te: "సంవత్సరానికి", hi: "वार्षिक", ml: "വർഷം", kn: "ವಾರ್ಷಿಕ", ta: "ஆண்டு" },
};

// Stat labels in all languages
const STAT_LABELS = {
  health: { en: "Health", te: "ఆరోగ్యం", hi: "स्वास्थ्य", ml: "ആരോഗ്യം", kn: "ಆರೋಗ್ಯ", ta: "ஆரோக்கியம்" },
  wealth: { en: "Wealth", te: "సంపద", hi: "संपत्ति", ml: "സമ്പത്തು", kn: "ಸಂಪದ", ta: "செல்வம்" },
  family: { en: "Family", te: "కుటుంబం", hi: "परिवार", ml: "കുടുಂಬಂ", kn: "ಕುಟುಂಬ", ta: "குடும்பம்" },
  love: { en: "Love", te: "ప్రేమ", hi: "प्रेम", ml: "പ്രണಯಂ", kn: "ಪ್ರೀತಿ", ta: "காதல்" },
  career: { en: "Career", te: "వృత్తి", hi: "करियर", ml: "കരിಯರ್", kn: "ವೃತ್ತಿ", ta: "தொழில்" }
};

const PERIOD_TYPES = {
  daily: { key: 'daily' },
  weekly: { key: 'weekly' },
  monthly: { key: 'monthly' },
  yearly: { key: 'yearly' },
};

function Rashiphalalu({ language, translations: t, onBack }) {
  const [selectedRashi, setSelectedRashi] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [currentRashi, setCurrentRashi] = useState(null);
  const [rashiphalaluData, setRashiphalaluData] = useState(null);

  // Get current rashi based on date
  useEffect(() => {
    const today = new Date();
    const rashi = getCurrentRashi(today);
    setCurrentRashi(rashi);
    // Set selected rashi to current rashi on mount
    const foundRashi = RASHIS.find(r => r.id === rashi);
    if (foundRashi) {
      setSelectedRashi(foundRashi);
    } else {
      setSelectedRashi(RASHIS[0]);
    }
  }, []);

  // Get rashiphalalu data when rashi or period changes
  useEffect(() => {
    if (!selectedRashi) return;

    const today = new Date();
    const data = RASHIPHALALU_DATA[selectedRashi.id];
    
    if (!data) {
      setRashiphalaluData(null);
      return;
    }

    const periodData = data[selectedPeriod];
    if (!periodData) {
      setRashiphalaluData(null);
      return;
    }

    const text = selectedPeriod === 'yearly' 
      ? periodData.text 
      : getRashiText(selectedRashi.id, selectedPeriod, today);
    
    setRashiphalaluData({
      text,
      colors: periodData.colors,
      stats: periodData.stats,
      name: RASHI_NAMES[selectedRashi.id]?.[language] || RASHI_NAMES[selectedRashi.id]?.en || selectedRashi.name
    });
  }, [selectedRashi, selectedPeriod, language]);

  // Get localized stat label
  const getStatLabel = (key) => {
    return STAT_LABELS[key]?.[language] || STAT_LABELS[key]?.en || key;
  };

  // Get localized period label
  const getPeriodLabel = (key) => {
    return PERIOD_LABELS[key]?.[language] || PERIOD_LABELS[key]?.en || key;
  };

  if (!selectedRashi || !rashiphalaluData) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #FF8C32 0%, #FF6347 20%, #FF4560 40%, #E63946 60%, #D32F2F 80%, #B71C1C 100%)"
        }}
      >
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #FF8C32 0%, #FF6347 20%, #FF4560 40%, #E63946 60%, #D32F2F 80%, #B71C1C 100%)",
        position: "relative",
      }}
    >
      {/* Header */}
      <header className="relative z-40 py-1.5 px-2">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                border: "2px solid rgba(255, 140, 50, 0.7)",
                color: "#FFE4B5",
                boxShadow: `
                  0 0 10px rgba(255, 140, 50, 0.6),
                  inset 0 0 6px rgba(255, 200, 100, 0.2)
                `,
              }}
            >
              ← {t?.back || "Back"}
            </button>

            {/* Title */}
            <h1
              className="font-black tracking-tight text-center flex-1"
              style={{
                color: "#FFFFFF",
                textShadow: `
                  0 1px 2px rgba(0, 0, 0, 0.85),
                  0 2px 6px rgba(255, 140, 50, 0.45)
                `,
                fontSize: "clamp(0.8rem, 2.5vw, 1.1rem)",
                fontWeight: "900",
              }}
            >
              {t?.rashiphalalu || "Rashiphalalu"}
            </h1>

            {/* Selected Rashi Name */}
            <div
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap"
              style={{
                background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                border: "2px solid rgba(255, 140, 50, 0.7)",
                color: "#FFE4B5",
              }}
            >
              <span>{rashiphalaluData.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-1.5 py-1 space-y-1.5">
        {/* Period Selector */}
        <div
          className="rounded-lg p-1 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.95) 0%, rgba(100, 25, 12, 0.9) 100%)",
            border: "2px solid rgba(255, 140, 50, 0.6)",
          }}
        >
          <div className="flex gap-1">
            {Object.values(PERIOD_TYPES).map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`flex-1 inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === period.key ? "scale-[1.02]" : "hover:scale-[1.01]"
                }`}
                style={{
                  background: selectedPeriod === period.key
                    ? "linear-gradient(135deg, rgba(255, 140, 50, 0.8) 0%, rgba(255, 100, 30, 0.9) 100%)"
                    : "transparent",
                  border: selectedPeriod === period.key
                    ? "2px solid rgba(255, 140, 50, 0.9)"
                    : "2px solid transparent",
                  color: selectedPeriod === period.key ? "#FFFFFF" : "#FFE4B5",
                  boxShadow: selectedPeriod === period.key
                    ? "0 0 10px rgba(255, 140, 50, 0.5)"
                    : "none",
                }}
              >
                {getPeriodLabel(period.key)}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Rashi Display */}
        <div
          className="rounded-lg p-3 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
            border: "2px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 15px rgba(255, 140, 50, 0.8),
              0 0 30px rgba(255, 100, 30, 0.6),
              inset 0 0 12px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          <div className="flex flex-col items-center">
            {/* Rashi Icon */}
            <div
              className="inline-flex items-center justify-center h-10 w-10 rounded-full mb-1.5"
              style={{
                background: "linear-gradient(135deg, #1a0a05 0%, #2d1208 50%, #401a0c 100%)",
                border: "2px solid #ff8c32",
                boxShadow: `
                  0 0 15px rgba(255, 140, 50, 1),
                  0 0 30px rgba(255, 100, 30, 0.8),
                  inset 0 0 10px rgba(255, 140, 50, 0.3)
                `,
              }}
            >
              <span className="text-xl">{selectedRashi.icon}</span>
            </div>
            
            {/* Selected Rashi Name */}
            <h2
              className="font-black text-base"
              style={{
                color: "#FFFFFF",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 140, 50, 0.4)",
              }}
            >
              {rashiphalaluData.name}
            </h2>
          </div>

          {/* Rashiphalalu Details */}
          <div className="mt-2 space-y-1.5">
            {/* Text */}
            <div
              className="rounded-lg p-2.5"
              style={{
                background: "rgba(80, 20, 10, 0.8)",
                border: "2px solid rgba(255, 140, 50, 0.5)",
              }}
            >
              <p
                className="text-sm sm:text-base leading-relaxed"
                style={{ color: "#FFE4B5" }}
              >
                {rashiphalaluData.text}
              </p>
            </div>

            {/* Lucky Colors */}
            <div
              className="rounded-lg p-2"
              style={{
                background: "rgba(80, 20, 10, 0.8)",
                border: "2px solid rgba(255, 140, 50, 0.5)",
              }}
            >
              <h3
                className="font-bold text-[10px] mb-1.5"
                style={{ color: "#D4AF37" }}
              >
                Lucky Colors
              </h3>
              <div className="flex gap-1.5 flex-wrap">
                {rashiphalaluData.colors?.map((color, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: "rgba(255, 140, 50, 0.3)",
                      border: "1.5px solid rgba(255, 140, 50, 0.6)",
                      color: "#FFE4B5",
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{
                        background: color.toLowerCase().replace(' ', ''),
                        display: 'inline-block',
                        minWidth: '6px',
                        minHeight: '6px'
                      }}
                    ></span>
                    {color}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(rashiphalaluData.stats || {}).map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-lg p-1.5 text-center"
                  style={{
                    background: "rgba(80, 20, 10, 0.8)",
                    border: "2px solid rgba(255, 140, 50, 0.5)",
                  }}
                >
                  <h4
                    className="font-bold text-[9px] mb-1"
                    style={{ color: "#D4AF37" }}
                  >
                    {getStatLabel(key)}
                  </h4>
                  <div className="flex items-center justify-center gap-1">
                    <div className="flex-1 h-1 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value}%`,
                          background: `linear-gradient(90deg, rgba(255, 140, 50, 0.8), rgba(255, 100, 30, 0.9))`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: "#FFFFFF" }}>
                      {value}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rashi Selection Grid */}
        <div
          className="rounded-lg p-2.5 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
            border: "2px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 15px rgba(255, 140, 50, 0.8),
              0 0 30px rgba(255, 100, 30, 0.6),
              inset 0 0 12px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          <h3
            className="font-bold text-xs mb-2 text-center"
            style={{
              color: "#FFFFFF",
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
            }}
          >
            Select Your Rashi
          </h3>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            {RASHIS.map((rashi) => (
              <button
                key={rashi.id}
                onClick={() => setSelectedRashi(rashi)}
                className={`rounded-lg p-1.5 transition-all hover:scale-105 ${
                  selectedRashi.id === rashi.id ? "ring-2 ring-offset-2 ring-offset-transparent" : ""
                }`}
                style={{
                  background: selectedRashi.id === rashi.id
                    ? "linear-gradient(135deg, rgba(255, 140, 50, 0.6) 0%, rgba(255, 100, 30, 0.7) 100%)"
                    : "linear-gradient(135deg, rgba(80, 20, 10, 0.9) 0%, rgba(100, 25, 12, 0.85) 100%)",
                  border: selectedRashi.id === rashi.id
                    ? "2px solid rgba(255, 140, 50, 0.9)"
                    : "2px solid rgba(255, 140, 50, 0.4)",
                  boxShadow: selectedRashi.id === rashi.id
                    ? `
                      0 0 12px rgba(255, 140, 50, 0.8),
                      0 0 25px rgba(255, 100, 30, 0.6),
                      inset 0 0 6px rgba(255, 200, 100, 0.2)
                    `
                    : "none",
                  color: selectedRashi.id === rashi.id ? "#FFFFFF" : "#FFE4B5",
                }}
              >
                <div className="text-lg mb-0.5">{rashi.icon}</div>
                <div className="text-[10px] font-bold truncate">
                  {RASHI_NAMES[rashi.id]?.[language] || rashi.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Global Styles */}
      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}

export default Rashiphalalu;
