import { useState } from "react";

// Rashi SVG Icons - Natural and professional representations
const RASHI_ICONS = {
  mesha: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L20 28H28V56H36V28H44L32 8Z" fill="currentColor" opacity="0.9"/>
      <circle cx="24" cy="20" r="4" fill="currentColor"/>
      <circle cx="40" cy="20" r="4" fill="currentColor"/>
      <path d="M16 36H48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12 44H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  vrishabha: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="36" rx="20" ry="14" fill="currentColor" opacity="0.9"/>
      <path d="M16 28V20C16 16 20 12 24 12V12C24 8 28 4 32 4V4C36 4 40 8 40 12V12C44 12 48 16 48 20V28" stroke="currentColor" strokeWidth="4" fill="none"/>
      <ellipse cx="26" cy="34" rx="3" ry="4" fill="#1a0a05"/>
      <ellipse cx="38" cy="34" rx="3" ry="4" fill="#1a0a05"/>
      <path d="M28 44H36" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  mithuna: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="28" r="10" fill="currentColor" opacity="0.9"/>
      <circle cx="44" cy="28" r="10" fill="currentColor" opacity="0.9"/>
      <path d="M20 38V48C20 52 24 56 32 56C40 56 44 52 44 48V38" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path d="M12 18H26" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M38 18H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="17" cy="26" r="2" fill="#1a0a05"/>
      <circle cx="41" cy="26" r="2" fill="#1a0a05"/>
    </svg>
  ),
  karka: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="40" rx="22" ry="16" fill="currentColor" opacity="0.9"/>
      <path d="M12 36C12 24 20 16 32 16C44 16 52 24 52 36" stroke="currentColor" strokeWidth="4" fill="none"/>
      <circle cx="24" cy="38" r="4" fill="#1a0a05"/>
      <circle cx="40" cy="38" r="4" fill="#1a0a05"/>
      <path d="M26 48H38" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 44C8 44 4 40 4 36C4 32 8 28 12 28" stroke="currentColor" strokeWidth="3" fill="none"/>
      <path d="M56 44C56 44 60 40 60 36C60 32 56 28 52 28" stroke="currentColor" strokeWidth="3" fill="none"/>
    </svg>
  ),
  simha: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 32C16 20 24 12 32 12C40 12 48 20 48 32C48 44 40 52 32 52C24 52 16 44 16 32Z" fill="currentColor" opacity="0.9"/>
      <path d="M8 24V16C8 12 12 8 16 8V8C16 4 20 4 24 4" stroke="currentColor" strokeWidth="3" fill="none"/>
      <path d="M56 24V16C56 12 52 8 48 8V8C48 4 44 4 40 4" stroke="currentColor" strokeWidth="3" fill="none"/>
      <circle cx="25" cy="30" r="4" fill="#1a0a05"/>
      <circle cx="39" cy="30" r="4" fill="#1a0a05"/>
      <path d="M26 40H38" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 44L26 48L32 44L38 48L42 44" stroke="#1a0a05" strokeWidth="2" fill="none"/>
    </svg>
  ),
  kanya: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="32" rx="14" ry="20" fill="currentColor" opacity="0.9"/>
      <circle cx="32" cy="12" r="8" fill="currentColor"/>
      <path d="M24 24H40" stroke="#1a0a05" strokeWidth="3"/>
      <path d="M18 52V44C18 40 24 36 32 36C40 36 46 40 46 44V52" stroke="currentColor" strokeWidth="4" fill="none"/>
      <ellipse cx="28" cy="30" rx="2" ry="3" fill="#1a0a05"/>
      <ellipse cx="36" cy="30" rx="2" ry="3" fill="#1a0a05"/>
      <path d="M28 40H36" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  tula: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28L24 32L32 28L40 32L56 28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 36L24 32L32 36L40 32L56 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="32" cy="32" r="4" fill="currentColor"/>
      <path d="M12 20H52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="20" cy="16" r="3" fill="currentColor"/>
      <circle cx="44" cy="16" r="3" fill="currentColor"/>
    </svg>
  ),
  vrishchika: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="44" rx="18" ry="12" fill="currentColor" opacity="0.9"/>
      <path d="M20 32V20C20 16 24 12 28 12" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path d="M44 32V20C44 16 40 12 36 12" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path d="M28 12L32 4L36 12" stroke="currentColor" strokeWidth="3" fill="none"/>
      <circle cx="25" cy="42" r="3" fill="#1a0a05"/>
      <circle cx="39" cy="42" r="3" fill="#1a0a05"/>
      <path d="M26 50H38" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 28L20 32" stroke="currentColor" strokeWidth="2"/>
      <path d="M48 28L44 32" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  dhanu: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 44C8 44 4 36 12 32C20 28 28 32 28 32" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path d="M56 44C56 44 60 36 52 32C44 28 36 32 36 32" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path d="M28 32H36" stroke="currentColor" strokeWidth="4"/>
      <path d="M8 48H56" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <path d="M32 16V28" stroke="currentColor" strokeWidth="3"/>
      <circle cx="32" cy="12" r="6" fill="currentColor"/>
      <path d="M14 48L32 32L50 48" stroke="currentColor" strokeWidth="3" fill="none"/>
    </svg>
  ),
  makara: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 16C16 8 24 4 32 4C40 4 48 8 48 16" stroke="currentColor" strokeWidth="4" fill="none"/>
      <ellipse cx="32" cy="44" rx="20" ry="14" fill="currentColor" opacity="0.9"/>
      <path d="M12 44V36C12 32 20 28 32 28C44 28 52 32 52 36V44" stroke="currentColor" strokeWidth="4" fill="none"/>
      <circle cx="24" cy="42" r="3" fill="#1a0a05"/>
      <circle cx="40" cy="42" r="3" fill="#1a0a05"/>
      <path d="M26 50H38" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 24H44" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  kumbha: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 12V24C16 32 20 40 32 40C44 40 48 32 48 24V12" stroke="currentColor" strokeWidth="4" fill="none"/>
      <ellipse cx="32" cy="48" rx="16" ry="8" fill="currentColor" opacity="0.9"/>
      <path d="M8 24C8 16 16 8 24 8" stroke="currentColor" strokeWidth="3" fill="none"/>
      <path d="M56 24C56 16 48 8 40 8" stroke="currentColor" strokeWidth="3" fill="none"/>
      <circle cx="24" cy="28" r="4" fill="#1a0a05"/>
      <circle cx="40" cy="28" r="4" fill="#1a0a05"/>
      <path d="M28 36H36" stroke="#1a0a05" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 16C16 16 20 12 24 12" stroke="currentColor" strokeWidth="2"/>
      <path d="M48 16C48 16 44 12 40 12" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  meena: (
    <svg viewBox="0 0 64 64" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20C8 12 20 8 32 8C44 8 56 12 56 20C56 28 44 36 32 36C20 36 8 28 8 20Z" fill="currentColor" opacity="0.9"/>
      <path d="M56 20C56 12 44 8 32 8" stroke="currentColor" strokeWidth="4" fill="none"/>
      <path d="M8 20C8 12 20 8 32 8" stroke="currentColor" strokeWidth="4" fill="none"/>
      <ellipse cx="24" cy="24" rx="4" ry="6" fill="#1a0a05"/>
      <ellipse cx="40" cy="24" rx="4" ry="6" fill="#1a0a05"/>
      <path d="M16 44H28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M36 44H48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="50" r="6" fill="currentColor"/>
    </svg>
  ),
};

// Rashiphalalu (Daily Horoscope) data for all zodiac signs
const RASHIS = [
  { id: "mesha", name: "Mesha", icon: RASHI_ICONS.mesha },
  { id: "vrishabha", name: "Vrishabha", icon: RASHI_ICONS.vrishabha },
  { id: "mithuna", name: "Mithuna", icon: RASHI_ICONS.mithuna },
  { id: "karka", name: "Karka", icon: RASHI_ICONS.karka },
  { id: "simha", name: "Simha", icon: RASHI_ICONS.simha },
  { id: "kanya", name: "Kanya", icon: RASHI_ICONS.kanya },
  { id: "tula", name: "Tula", icon: RASHI_ICONS.tula },
  { id: "vrishchika", name: "Vrishchika", icon: RASHI_ICONS.vrishchika },
  { id: "dhanu", name: "Dhanu", icon: RASHI_ICONS.dhanu },
  { id: "makara", name: "Makara", icon: RASHI_ICONS.makara },
  { id: "kumbha", name: "Kumbha", icon: RASHI_ICONS.kumbha },
  { id: "meena", name: "Meena", icon: RASHI_ICONS.meena },
];

// Sample rashiphalalu data (in production, this would come from an API)
const getRashiphalaluData = (rashiId, language) => {
  const data = {
    mesha: {
      en: { general: "A new opportunity will knock on your door today.", luckyColor: "Red", luckyNumber: 5 },
      te: { general: "ఈ రోజు మీకు కొత్త అవకాశం వస్తుంది.", luckyColor: "ఎరుపు", luckyNumber: 5 },
      hi: { general: "आज आपके लिए एक नया अवसर आएगा.", luckyColor: "लाल", luckyNumber: 5 },
      ml: { general: "ഇന്ന് നിങ്ങൾക്ക് ഒരു പുതിയ അവസരം ലഭിക്കും.", luckyColor: "ചുവപ്പ്", luckyNumber: 5 },
      kn: { general: "ಇಂದು ನಿಮಗೆ ಹೊಸ ಅವಕಾಶ ಬರುತ್ತದೆ.", luckyColor: "ಕೆಂಪು", luckyNumber: 5 },
    },
    vrishabha: {
      en: { general: "Your hard work will pay off today.", luckyColor: "Green", luckyNumber: 3 },
      te: { general: "మీ కష్టం ఫలిస్తుంది.", luckyColor: "హసిరు", luckyNumber: 3 },
      hi: { general: "आपकी मेहनत आज रंग लाएगी।", luckyColor: "हरा", luckyNumber: 3 },
      ml: { general: "നിങ്ങളുടെ അധ്വാനം ഇന്ന് ഫലിക്കും.", luckyColor: "പച്ച", luckyNumber: 3 },
      kn: { general: "ನಿಮ್ಮ ಕಠಿಣ ಪರಿಶ್ರಮ ಫಲಿಸುತ್ತದೆ.", luckyColor: "ಹಸಿರು", luckyNumber: 3 },
    },
    mithuna: {
      en: { general: "Communication will be key to your success today.", luckyColor: "Yellow", luckyNumber: 7 },
      te: { general: "ఈ రోజు మాటలే మీ విజయానికి కీలకం.", luckyColor: "పసుపు", luckyNumber: 7 },
      hi: { general: "आज संवाद आपकी सफलता की कुंजी होगा।", luckyColor: "पीला", luckyNumber: 7 },
      ml: { general: "ഇന്ന് ആശയവിനിമമാണ് നിങ്ങളുടെ വിജയത്തിന്റെ താക്കോല്‍.", luckyColor: "മഞ്ഞ", luckyNumber: 7 },
      kn: { general: "ಇಂದು ಸಂವಹನವು ನಿಮ್ಮ ಯಶಸ್ಸಿಗೆ ಪ್ರಮುಖವಾಗಿದೆ.", luckyColor: "ಹಳದಿ", luckyNumber: 7 },
    },
    karka: {
      en: { general: "Family time will bring you peace and happiness.", luckyColor: "Silver", luckyNumber: 2 },
      te: { general: "కుటుంబ సమయం మీకు శాంతి, సుఖాలను తెస్తుంది.", luckyColor: "వెండి", luckyNumber: 2 },
      hi: { general: "परिवार के साथ समय शांति और खुशी लाएगा।", luckyColor: "चांदी", luckyNumber: 2 },
      ml: { general: "കുടുംബ സമയം നിങ്ങൾക്ക് സമാധാനവും സന്തോഷവും നല്‍കും.", luckyColor: "വെള്ളി", luckyNumber: 2 },
      kn: { general: "ಕುಟುಂಬ ಸಮಯವು ನಿಮಗೆ ಶಾಂತಿ ಮತ್ತು ಸಂತೋಷವನ್ನು ತರುತ್ತದೆ.", luckyColor: "ಬೆಳ್ಳಿ", luckyNumber: 2 },
    },
    simha: {
      en: { general: "Your leadership qualities will shine today.", luckyColor: "Gold", luckyNumber: 1 },
      te: { general: "మీ నాయకత్వ లక్షణాలు ఈ రోజు మెరిసిపడతాయి.", luckyColor: "బంగారు", luckyNumber: 1 },
      hi: { general: "आपकी नेतृत्व क्षमता आज चमकेगी।", luckyColor: "सोना", luckyNumber: 1 },
      ml: { general: "നിങ്ങളുടെ നേതൃത്വ സ്വഭാവം ഇന്ന് പ്രകാശിക്കും.", luckyColor: "സ്വർണം", luckyNumber: 1 },
      kn: { general: "ನಿಮ್ಮ ನಾಯಕತ್ವ ಗುಣವು ಇಂದು ಹೊಳೆಯುತ್ತದೆ.", luckyColor: "ಚಿನ್ನ", luckyNumber: 1 },
    },
    kanya: {
      en: { general: "Focus on health and wellness today.", luckyColor: "White", luckyNumber: 4 },
      te: { general: "ఈ రోజు ఆరోగ్యం, శారీరక శ్రేయస్సుపై దృష్టి పెట్టండి.", luckyColor: "తెలుపు", luckyNumber: 4 },
      hi: { general: "आज स्वास्थ्य और तंदुरुस्ती पर ध्यान दें।", luckyColor: "सफेद", luckyNumber: 4 },
      ml: { general: "ഇന്ന് ആരോഗ്യത്തിലും ക്ഷೇമത്തിലും ശ്രദ്ധ കൊടുക്കുക.", luckyColor: "വെള്ള", luckyNumber: 4 },
      kn: { general: "ಇಂದು ಆರೋಗ್ಯ ಮತ್ತು ಕ್ಷೇಮದ ಮೇಲೆ ಗಮನ ಹರಿಸಿ.", luckyColor: "ಬಿಳಿ", luckyNumber: 4 },
    },
    tula: {
      en: { general: "Balance and harmony will be your focus today.", luckyColor: "Pink", luckyNumber: 6 },
      te: { general: "సమతుల్యత, సామరస్యం ఈ రోజు మీ ఫోకస్.", luckyColor: "గులాబీ", luckyNumber: 6 },
      hi: { general: "आज संतुलन और सद्भाव पर ध्यान दें।", luckyColor: "गुलाबी", luckyNumber: 6 },
      ml: { general: "ഇന്ന് സന്തുലിതാവസ്ഥയും സാമരസ്യവും നിങ്ങളുടെ ശ്രദ്ധ.", luckyColor: "പിങ്ക്", luckyNumber: 6 },
      kn: { general: "ಇಂದು ಸಮತೋಲನ ಮತ್ತು ಸಾಮರಸ್ಯವು ನಿಮ್ಮ ಗಮನವಾಗಿರುತ್ತದೆ.", luckyColor: "ಗುಲಾಬಿ", luckyNumber: 6 },
    },
    vrishchika: {
      en: { general: "Trust your instincts and intuition today.", luckyColor: "Dark Red", luckyNumber: 8 },
      te: { general: "ఈ రోజు మీ ఆంతరిక భావనలకు నమ్మకం పెట్టండి.", luckyColor: "గాఢ ఎరుపు", luckyNumber: 8 },
      hi: { general: "आज अपने इंटुइशन पर भरोसा रखें।", luckyColor: "गहरा लाल", luckyNumber: 8 },
      ml: { general: "ഇന്ന് നിങ്ങളുടെ അന്തര്‍ദৃഷ്ടിക്ക് വിശ്വാസമര്‍പ്പിക്കുക.", luckyColor: "ഇരുണ്ട ചുവപ്പ്", luckyNumber: 8 },
      kn: { general: "ಇಂದು ನಿಮ್ಮ ಅಂತರ್ಜ್ಞೆಗೆ ನಂಬಿಕೆ ಇರಿಸಿ.", luckyColor: "ಗಾಢ ಕೆಂಪು", luckyNumber: 8 },
    },
    dhanu: {
      en: { general: "Adventure and new experiences await you.", luckyColor: "Orange", luckyNumber: 9 },
      te: { general: "సాహసం, కొత్త అనుభవాలు మీకు వస్తాయి.", luckyColor: "నారింజ", luckyNumber: 9 },
      hi: { general: "साहसिक और नए अनुभव आपका इंतज़ार कर रहे हैं।", luckyColor: "नारंगी", luckyNumber: 9 },
      ml: { general: "സാഹസികതയും പുതിയ അനുഭവവും നിങ്ങള്‍ക്കായി കാത്തിരിക്കുന്നു.", luckyColor: "ഓറഞ്ച്", luckyNumber: 9 },
      kn: { general: "ಸಾಹಸ ಮತ್ತು ಹೊಸ ಅನುಭವಗಳು ನಿಮ್ಮನ್ನು ಕಾಯುತ್ತಿವೆ.", luckyColor: "ಕಿತ್ತಳೆ", luckyNumber: 9 },
    },
    makara: {
      en: { general: "Hard work will lead to great rewards.", luckyColor: "Brown", luckyNumber: 10 },
      te: { general: "కష్టప్పికి మంచి ఫలితం వస్తుంది.", luckyColor: "బ్రౌన్", luckyNumber: 10 },
      hi: { general: "कड़ी मेहनत का अच्छा परिणाम मिलेगा।", luckyColor: "भूरा", luckyNumber: 10 },
      ml: { general: "കഠിനാധ്വാനം മികച്ച പ്രതിഫലം നല്‍കും.", luckyColor: "തവിട്ട്", luckyNumber: 10 },
      kn: { general: "ಕಠಿಣ ಪರಿಶ್ರಮ ಉತ್ತಮ ಫಲ ನೀಡುತ್ತದೆ.", luckyColor: "ಕಂದು", luckyNumber: 10 },
    },
    kumbha: {
      en: { general: "Innovation and creativity will bring success.", luckyColor: "Blue", luckyNumber: 11 },
      te: { general: "సృజనాత్మకత్వం విజయాన్ని తెస్తుంది.", luckyColor: "నీలం", luckyNumber: 11 },
      hi: { general: "नवाचार और रचनात्मकता सफलता लाएगी।", luckyColor: "नीला", luckyNumber: 11 },
      ml: { general: "കണ്ടുപിടിത്തവും സമര്‍ത്ഥവും വിജയം നല്‍കും.", luckyColor: "നീല", luckyNumber: 11 },
      kn: { general: "ಆವಿಷ್ಕಾರ ಮತ್ತು ಸೃಜನಶೀಲತೆ ಯಶಸ್ಸು ತರುತ್ತದೆ.", luckyColor: "ನೀಲಿ", luckyNumber: 11 },
    },
    meena: {
      en: { general: "Spiritual pursuits will bring inner peace.", luckyColor: "Purple", luckyNumber: 12 },
      te: { general: "ఆధ్యాత్మిక చింతన అంతర్గత శాంతిని తెస్తుంది.", luckyColor: "బూడిదం", luckyNumber: 12 },
      hi: { general: "आध्यात्मिक खोज आंतरिक शांति लाएगी।", luckyColor: "बैंगनी", luckyNumber: 12 },
      ml: { general: "ആത്മനിഷ്ഠ ശ്രമങ്ങൾ ആഭ്യന്തര സമാധാനം നല്‍കും.", luckyColor: "പർപ്പിള്‍", luckyNumber: 12 },
      kn: { general: "ಆಧ್ಯಾತ್ಮಿಕ ಅರಿವು ಒಳಗಿನ ಶಾಂತಿಯನ್ನು ನೀಡುತ್ತದೆ.", luckyColor: "ನೇರಳೆ", luckyNumber: 12 },
    },
  };
  
  return data[rashiId]?.[language] || data[rashiId]?.en;
};

function Rashiphalalu({ language, translations: t, onBack }) {
  const [selectedRashi, setSelectedRashi] = useState(RASHIS[0]);
  const rashiphalaluData = getRashiphalaluData(selectedRashi.id, language);

  return (
    <div 
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #FF8C32 0%, #FF6347 20%, #FF4560 40%, #E63946 60%, #D32F2F 80%, #B71C1C 100%)",
        position: "relative",
      }}
    >
      {/* Animated Particle Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 10% 20%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(2px 2px at 30% 40%, rgba(255, 200, 50, 0.8), transparent),
            radial-gradient(2px 2px at 50% 10%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(2px 2px at 70% 60%, rgba(255, 180, 40, 0.8), transparent),
            radial-gradient(2px 2px at 85% 30%, rgba(255, 220, 80, 0.9), transparent),
            radial-gradient(1px 1px at 20% 70%, rgba(255, 200, 50, 0.7), transparent),
            radial-gradient(1px 1px at 60% 80%, rgba(255, 180, 40, 0.9), transparent),
            radial-gradient(2px 2px at 90% 15%, rgba(255, 220, 80, 0.8), transparent),
            radial-gradient(1px 1px at 15% 50%, rgba(255, 200, 50, 0.7), transparent),
            radial-gradient(2px 2px at 75% 85%, rgba(255, 180, 40, 0.9), transparent)
          `,
          backgroundSize: "100% 100%",
          animation: "sparkle 3s ease-in-out infinite",
        }}
      />

      {/* Header */}
      <header className="relative z-40 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all hover:scale-105 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
                border: "2.5px solid rgba(255, 140, 50, 0.7)",
                color: "#FFE4B5",
                boxShadow: `
                  0 0 20px rgba(255, 140, 50, 0.6),
                  0 0 40px rgba(255, 100, 30, 0.4),
                  inset 0 0 15px rgba(255, 200, 100, 0.2)
                `,
              }}
            >
              ← {t.back || "Back"}
            </button>

            {/* Title */}
            <h1
              className="font-black tracking-tight"
              style={{
                color: "#FFFFFF",
                textShadow: `
                  0 1px 2px rgba(0, 0, 0, 0.85),
                  0 6px 18px rgba(255, 140, 50, 0.45)
                `,
                fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                fontWeight: "900",
              }}
            >
              {t.rashiphalalu || "Daily Horoscope"}
            </h1>

            {/* Spacer for balance */}
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Selected Rashi Display */}
        <div
          className="rounded-2xl sm:rounded-3xl p-6 mb-6 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 35px rgba(255, 140, 50, 0.8),
              0 0 70px rgba(255, 100, 30, 0.6),
              inset 0 0 30px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center h-20 w-20 rounded-full mb-4"
              style={{
                background: "linear-gradient(135deg, #1a0a05 0%, #2d1208 50%, #401a0c 100%)",
                border: "4px solid #ff8c32",
                boxShadow: `
                  0 0 30px rgba(255, 140, 50, 1),
                  0 0 60px rgba(255, 100, 30, 0.8),
                  inset 0 0 20px rgba(255, 140, 50, 0.3)
                `,
              }}
            >
              <div className="text-4xl w-12 h-12">{selectedRashi.icon}</div>
            </div>
            <h2
              className="font-black text-2xl"
              style={{
                color: "#FFFFFF",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 140, 50, 0.4)",
              }}
            >
              {selectedRashi.name}
            </h2>
          </div>

          {/* Rashiphalalu Details */}
          <div className="mt-6 space-y-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(80, 20, 10, 0.8)",
                border: "2px solid rgba(255, 140, 50, 0.5)",
              }}
            >
              <h3
                className="font-bold text-sm mb-2"
                style={{ color: "#D4AF37" }}
              >
                {t.general || "General"}
              </h3>
              <p
                className="text-lg"
                style={{ color: "#FFE4B5" }}
              >
                {rashiphalaluData.general}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(80, 20, 10, 0.8)",
                  border: "2px solid rgba(255, 140, 50, 0.5)",
                }}
              >
                <h3
                  className="font-bold text-sm mb-1"
                  style={{ color: "#D4AF37" }}
                >
                  {t.luckyColor || "Lucky Color"}
                </h3>
                <p
                  className="text-lg"
                  style={{ color: "#FFE4B5" }}
                >
                  {rashiphalaluData.luckyColor}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(80, 20, 10, 0.8)",
                  border: "2px solid rgba(255, 140, 50, 0.5)",
                }}
              >
                <h3
                  className="font-bold text-sm mb-1"
                  style={{ color: "#D4AF37" }}
                >
                  {t.luckyNumber || "Lucky Number"}
                </h3>
                <p
                  className="text-lg"
                  style={{ color: "#FFE4B5" }}
                >
                  {rashiphalaluData.luckyNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rashi Selection Grid */}
        <div
          className="rounded-2xl sm:rounded-3xl p-6 backdrop-blur-md"
          style={{
            background: "linear-gradient(135deg, rgba(80, 20, 10, 0.98) 0%, rgba(100, 25, 12, 0.95) 50%, rgba(120, 30, 15, 0.92) 100%)",
            border: "3px solid rgba(255, 140, 50, 0.8)",
            boxShadow: `
              0 0 35px rgba(255, 140, 50, 0.8),
              0 0 70px rgba(255, 100, 30, 0.6),
              inset 0 0 30px rgba(255, 140, 50, 0.2)
            `,
          }}
        >
          <h3
            className="font-bold text-lg mb-4 text-center"
            style={{
              color: "#FFFFFF",
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
            }}
          >
            {t.selectRashi || "Select Your Rashi"}
          </h3>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {RASHIS.map((rashi) => (
              <button
                key={rashi.id}
                onClick={() => setSelectedRashi(rashi)}
                className={`rounded-xl p-3 transition-all hover:scale-105 ${
                  selectedRashi.id === rashi.id ? "ring-2 ring-offset-2 ring-offset-transparent" : ""
                }`}
                style={{
                  background: selectedRashi.id === rashi.id
                    ? "linear-gradient(135deg, rgba(255, 140, 50, 0.6) 0%, rgba(255, 100, 30, 0.7) 100%)"
                    : "linear-gradient(135deg, rgba(80, 20, 10, 0.9) 0%, rgba(100, 25, 12, 0.85) 100%)",
                  border: selectedRashi.id === rashi.id
                    ? "2.5px solid rgba(255, 140, 50, 0.9)"
                    : "2px solid rgba(255, 140, 50, 0.4)",
                  boxShadow: selectedRashi.id === rashi.id
                    ? `
                      0 0 25px rgba(255, 140, 50, 0.8),
                      0 0 50px rgba(255, 100, 30, 0.6),
                      inset 0 0 15px rgba(255, 200, 100, 0.2)
                    `
                    : "none",
                  color: selectedRashi.id === rashi.id ? "#FFFFFF" : "#FFE4B5",
                }}
              >
                <div className="w-10 h-10 mb-1">{rashi.icon}</div>
                <div className="text-xs font-bold">{rashi.name}</div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer
      <footer 
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 text-center"
        style={{
          textShadow: "0 2px 6px rgba(0, 0, 0, 0.6)",
        }}
      >
        <span
          className="inline-block text-sm sm:text-base md:text-lg font-black tracking-[0.08em]"
          style={{
            background:
              "linear-gradient(135deg, #fff1bf 0%, #ffd678 25%, #ffb347 50%, #ff8c2f 75%, #ffd89a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter:
              "drop-shadow(0 0 8px rgba(255, 190, 90, 0.55)) drop-shadow(0 0 14px rgba(255, 120, 35, 0.45))",
          }}
        >
          {t.shubhamasthu || "Shubhamasthu"}
        </span>
      </footer> */}

      {/* Global Styles */}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        button:hover {
          filter: brightness(1.15);
        }

        button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default Rashiphalalu;
