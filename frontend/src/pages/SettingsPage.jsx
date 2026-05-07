import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ensureLanguageLoaded, initialLanguageReady, languages, translations } from "../translations";
import {
  LANGUAGE_CHANGE_EVENT,
  loadAyanamsa,
  loadLanguage,
  loadLocation,
  saveAyanamsa,
  saveLanguage,
  saveLocation,
} from "../utils/appSettings";
import PageShell from "./PageShell";

const CAL_MONTH_TYPE_KEY = "panchang:calendar-month-type";
const CAL_YEAR_TYPE_KEY = "panchang:calendar-year-type";
const SAYANA_KEY = "panchang:sayana";

const selectorTriggerStyle = {
  background: "transparent",
  color: "#FFF4D8",
  border: "2px solid rgba(255, 140, 50, 0.7)",
  boxShadow: "none",
};

const selectorPopupShellStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "2px solid rgba(255, 220, 150, 0.85)",
  backdropFilter: "blur(10px)",
};

const selectorPopupListStyle = {
  background: "rgba(255, 255, 255, 0.04)",
};

function loadBool(key, fallback = false) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function saveBool(key, value) {
  localStorage.setItem(key, value ? "1" : "0");
}

function SelectorPopup({
  open,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  renderOptionLabel,
  emptyLabel = "No options available",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1010] flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-4 shadow-2xl"
        style={selectorPopupShellStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-3 text-center text-lg font-bold text-orange-300">{title}</h3>
        <div className="max-h-72 overflow-y-auto rounded-lg p-2" style={selectorPopupListStyle}>
          {options.length ? (
            options.map((option) => {
              const isActive = option === selectedValue;
              const optionLabel = renderOptionLabel ? renderOptionLabel(option) : option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelect(option)}
                  className={`mb-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-orange-500/20 text-white shadow-lg" : "bg-transparent text-orange-100 hover:bg-orange-500/10"
                  }`}
                  style={{
                    border: "1px solid rgba(255, 183, 77, 0.35)",
                    boxShadow: isActive ? "inset 0 0 0 1px rgba(255, 220, 150, 0.35)" : "none",
                  }}
                >
                  <span className="block break-words whitespace-normal leading-5">{optionLabel}</span>
                </button>
              );
            })
          ) : (
            <div className="rounded-lg px-3 py-4 text-sm font-medium text-orange-100">{emptyLabel}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: "transparent",
            border: "2px solid rgba(255, 183, 77, 0.8)",
            boxShadow: "none",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [language, setLanguage] = useState(() => loadLanguage());
  const [location, setLocation] = useState(() => loadLocation());
  const [ayanamsa, setAyanamsa] = useState(() => loadAyanamsa());
  const [languageOpen, setLanguageOpen] = useState(false);
  const [ayanamsaOpen, setAyanamsaOpen] = useState(false);
  const [sayana, setSayana] = useState(() => (typeof window === "undefined" ? false : loadBool(SAYANA_KEY)));
  const [monthType, setMonthType] = useState(() => localStorage.getItem(CAL_MONTH_TYPE_KEY) || "amavasyant");
  const [yearType, setYearType] = useState(() => localStorage.getItem(CAL_YEAR_TYPE_KEY) || "saka");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");

  const languageOptions = useMemo(() => languages || [], []);
  const currentLanguageOption = useMemo(
    () => languageOptions.find((l) => l.code === language) || null,
    [languageOptions, language]
  );
  const settingsOverrides = useMemo(
    () => ({
      te: {
        settingsTitle: "సెట్టింగ్స్",
        settingsLanguageTitle: "భాష",
        settingsLanguageSubtitle: "local అభ్యర్థనలు మరియు UI కోసం యాప్ భాష.",
        settingsLocationTitle: "స్థానం",
        settingsTimezone: "టైమ్‌జోన్",
        settingsAutoLocation: "ఆటో లొకేషన్",
        settingsChangeLocation: "లొకేషన్ మార్చండి",
        settingsLabelName: "పేరు",
        settingsLabelTzOffset: "TZ ఆఫ్‌సెట్",
        settingsLabelLatitude: "అక్షాంశం",
        settingsLabelLongitude: "రేఖాంశం",
        settingsSave: "సేవ్",
        settingsCancel: "రద్దు",
        settingsSayanaTitle: "సాయన పంచాంగం",
        settingsSayanaWarning: "హెచ్చరిక: ఇది అయనాంశం మరియు పండుగ తేదీలను మారుస్తుంది.",
        settingsCalendarMonthType: "క్యాలెండర్ నెల రకం",
        settingsCalendarYearType: "క్యాలెండర్ సంవత్సరం రకం",
        settingsAyanamsaTitle: "అయనాంశ",
        settingsAyanamsaSubtitle: "local జ్యోతిష గణనలకు ఉపయోగిస్తారు.",
        settingsCurrentLocation: "ప్రస్తుత లొకేషన్",
        settingsStatusGeoNotSupported: "ఈ బ్రౌజర్‌లో జియోలొకేషన్ లేదు.",
        settingsStatusGettingLocation: "లొకేషన్ తీసుకుంటోంది…",
        settingsStatusCoordsFailed: "కోఆర్డినేట్లు చదవలేకపోయాం.",
        settingsStatusLocationUpdated: "లొకేషన్ అప్‌డేట్ అయింది.",
        settingsStatusPermissionDenied: "లొకేషన్ అనుమతి నిరాకరించబడింది.",
        settingsStatusSaved: "సేవ్ అయింది.",
      },
      hi: {
        settingsTitle: "सेटिंग्स",
        settingsLanguageTitle: "भाषा",
        settingsLanguageSubtitle: "local अनुरोध और UI के लिए ऐप भाषा।",
        settingsLocationTitle: "स्थान",
        settingsTimezone: "समय क्षेत्र",
        settingsAutoLocation: "ऑटो लोकेशन",
        settingsChangeLocation: "लोकेशन बदलें",
        settingsLabelName: "नाम",
        settingsLabelTzOffset: "TZ ऑफसेट",
        settingsLabelLatitude: "अक्षांश",
        settingsLabelLongitude: "देशांश",
        settingsSave: "सेव करें",
        settingsCancel: "रद्द करें",
        settingsSayanaTitle: "सायन पंचांग",
        settingsSayanaWarning: "चेतावनी: यह अयनांश और त्योहार की तारीखें बदल सकता है।",
        settingsCalendarMonthType: "कैलेंडर माह प्रकार",
        settingsCalendarYearType: "कैलेंडर वर्ष प्रकार",
        settingsAyanamsaTitle: "अयनांश",
        settingsAyanamsaSubtitle: "local ज्योतिष गणनाओं के लिए उपयोग होता है।",
        settingsCurrentLocation: "वर्तमान लोकेशन",
        settingsStatusGeoNotSupported: "इस ब्राउज़र में जियोलोकेशन समर्थित नहीं है।",
        settingsStatusGettingLocation: "लोकेशन लिया जा रहा है…",
        settingsStatusCoordsFailed: "निर्देशांक पढ़ नहीं सके।",
        settingsStatusLocationUpdated: "लोकेशन अपडेट हो गया।",
        settingsStatusPermissionDenied: "लोकेशन अनुमति अस्वीकृत।",
        settingsStatusSaved: "सेव हो गया।",
      },
      ml: {
        settingsTitle: "സെറ്റിംഗ്സ്",
        settingsLanguageTitle: "ഭാഷ",
        settingsLanguageSubtitle: "local അഭ്യർത്ഥനകൾക്കും UI-ക്കും വേണ്ടിയുള്ള ആപ്പ് ഭാഷ.",
        settingsLocationTitle: "സ്ഥലം",
        settingsTimezone: "ടൈം സോൺ",
        settingsAutoLocation: "ഓട്ടോ ലൊക്കേഷൻ",
        settingsChangeLocation: "ലൊക്കേഷൻ മാറ്റുക",
        settingsLabelName: "പേര്",
        settingsLabelTzOffset: "TZ ഓഫ്സെറ്റ്",
        settingsLabelLatitude: "അക്ഷാംശം",
        settingsLabelLongitude: "രേഖാംശം",
        settingsSave: "സേവ്",
        settingsCancel: "റദ്ദാക്കുക",
        settingsSayanaTitle: "സായന പഞ്ചാംഗം",
        settingsSayanaWarning: "മുന്നറിയിപ്പ്: ഇത് അയനാംശവും ഉത്സവ തീയതികളും മാറ്റാം.",
        settingsCalendarMonthType: "ക്യാലണ്ടർ മാസം തരം",
        settingsCalendarYearType: "ക്യാലണ്ടർ വർഷം തരം",
        settingsAyanamsaTitle: "അയനാംശം",
        settingsAyanamsaSubtitle: "local ജ്യോതിഷ കണക്കുകൾക്കായി ഉപയോഗിക്കുന്നു.",
        settingsCurrentLocation: "നിലവിലെ ലൊക്കേഷൻ",
        settingsStatusGeoNotSupported: "ഈ ബ്രൗസറിൽ ജിയോളൊക്കേഷൻ പിന്തുണയ്ക്കുന്നില്ല.",
        settingsStatusGettingLocation: "ലൊക്കേഷൻ നേടുന്നു…",
        settingsStatusCoordsFailed: "കോഓർഡിനേറ്റുകൾ വായിക്കാനായില്ല.",
        settingsStatusLocationUpdated: "ലൊക്കേഷൻ അപ്ഡേറ്റ് ചെയ്തു.",
        settingsStatusPermissionDenied: "ലൊക്കേഷൻ അനുമതി നിഷേധിച്ചു.",
        settingsStatusSaved: "സേവ് ചെയ്തു.",
      },
      kn: {
        settingsTitle: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        settingsLanguageTitle: "ಭಾಷೆ",
        settingsLanguageSubtitle: "local ವಿನಂತಿಗಳು ಮತ್ತು UIಗಾಗಿ ಆಪ್ ಭಾಷೆ.",
        settingsLocationTitle: "ಸ್ಥಳ",
        settingsTimezone: "ಸಮಯ ವಲಯ",
        settingsAutoLocation: "ಸ್ವಯಂ ಸ್ಥಳ",
        settingsChangeLocation: "ಸ್ಥಳ ಬದಲಾಯಿಸಿ",
        settingsLabelName: "ಹೆಸರು",
        settingsLabelTzOffset: "TZ ಆಫ್‌ಸೆಟ್",
        settingsLabelLatitude: "ಅಕ್ಷಾಂಶ",
        settingsLabelLongitude: "ರೇಖಾಂಶ",
        settingsSave: "ಉಳಿಸಿ",
        settingsCancel: "ರದ್ದು",
        settingsSayanaTitle: "ಸಾಯನ ಪಂಚಾಂಗ",
        settingsSayanaWarning: "ಎಚ್ಚರಿಕೆ: ಇದು ಅಯನಾಂಶ ಮತ್ತು ಹಬ್ಬದ ದಿನಾಂಕಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದು.",
        settingsCalendarMonthType: "ಕ್ಯಾಲೆಂಡರ್ ತಿಂಗಳ ವಿಧ",
        settingsCalendarYearType: "ಕ್ಯಾಲೆಂಡರ್ ವರ್ಷದ ವಿಧ",
        settingsAyanamsaTitle: "ಅಯನಾಂಶ",
        settingsAyanamsaSubtitle: "local ಜ್ಯೋತಿಷ ಲೆಕ್ಕಾಚಾರಗಳಿಗೆ ಬಳಸಲಾಗುತ್ತದೆ.",
        settingsCurrentLocation: "ಪ್ರಸ್ತುತ ಸ್ಥಳ",
        settingsStatusGeoNotSupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಜಿಯೊಲೊಕೇಷನ್ ಬೆಂಬಲವಿಲ್ಲ.",
        settingsStatusGettingLocation: "ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ…",
        settingsStatusCoordsFailed: "ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
        settingsStatusLocationUpdated: "ಸ್ಥಳ ನವೀಕರಿಸಲಾಗಿದೆ.",
        settingsStatusPermissionDenied: "ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.",
        settingsStatusSaved: "ಉಳಿಸಲಾಗಿದೆ.",
      },
      ta: {
        settingsTitle: "அமைப்புகள்",
        settingsLanguageTitle: "மொழி",
        settingsLanguageSubtitle: "local கோரிக்கைகள் மற்றும் UI-க்கு பயன்பாட்டு மொழி.",
        settingsLocationTitle: "இடம்",
        settingsTimezone: "நேர மண்டலம்",
        settingsAutoLocation: "தானியங்கு இடம்",
        settingsChangeLocation: "இடத்தை மாற்று",
        settingsLabelName: "பெயர்",
        settingsLabelTzOffset: "TZ ஆஃப்செட்",
        settingsLabelLatitude: "அகலம்",
        settingsLabelLongitude: "நீளம்",
        settingsSave: "சேமி",
        settingsCancel: "ரத்து",
        settingsSayanaTitle: "சாயன பஞ்சாங்கம்",
        settingsSayanaWarning: "எச்சரிக்கை: இது அயனாம்சம் மற்றும் திருவிழா தேதிகளை மாற்றலாம்.",
        settingsCalendarMonthType: "காலண்டர் மாத வகை",
        settingsCalendarYearType: "காலண்டர் ஆண்டு வகை",
        settingsAyanamsaTitle: "அயனாம்சம்",
        settingsAyanamsaSubtitle: "local ஜோதிட கணக்குகளுக்கு பயன்படுத்தப்படுகிறது.",
        settingsCurrentLocation: "தற்போதைய இடம்",
        settingsStatusGeoNotSupported: "இந்த உலாவியில் ஜியோலொக்கேஷன் ஆதரவு இல்லை.",
        settingsStatusGettingLocation: "இடம் பெறப்படுகிறது…",
        settingsStatusCoordsFailed: "கோஆர்டினேட்களை படிக்க முடியவில்லை.",
        settingsStatusLocationUpdated: "இடம் புதுப்பிக்கப்பட்டது.",
        settingsStatusPermissionDenied: "இட அனுமதி மறுக்கப்பட்டது.",
        settingsStatusSaved: "சேமிக்கப்பட்டது.",
      },
    }),
    []
  );

  const t = useMemo(() => {
    const base = translations[language] || {};
    return { ...translations.en, ...base, ...(settingsOverrides[language] || {}) };
  }, [language, settingsOverrides]);

  const tr = (key, fallback) => t?.[key] || fallback || key;

  const onSaveLanguage = (value) => {
    ensureLanguageLoaded(value).finally(() => {
      setLanguage(value);
      // saveLanguage dispatches LANGUAGE_CHANGE_EVENT so all mounted pages update immediately
      saveLanguage(value);
    });
  };

  useEffect(() => {
    initialLanguageReady.then(() => {
      const next = loadLanguage();
      if (next) setLanguage((prev) => (prev === next ? prev : next));
    });

    const syncLanguage = (event) => {
      const next = event?.detail?.language || loadLanguage();
      if (!next) return;
      ensureLanguageLoaded(next).finally(() => {
        setLanguage((prev) => (prev === next ? prev : next));
      });
    };
    const onStorage = (event) => {
      if (event?.key && event.key !== "panchang:selected-language") return;
      syncLanguage();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, syncLanguage);
    };
  }, []);

  const onAutoLocation = async () => {
    // 1. Check if running inside the Flutter App
    if (window.NativeApp && window.NativeApp.postMessage) {
      setStatus(tr("settingsStatusGettingLocation", "Getting location…"));

      // Define the success callback that Flutter will trigger
      window.receiveNativeLocation = (lat, lng) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setStatus(tr("settingsStatusCoordsFailed", "Could not read coordinates."));
          return;
        }
        const next = {
          ...location,
          name: tr("settingsCurrentLocation", "Current location"),
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
        };
        setLocation(next);
        saveLocation(next);
        setStatus(tr("settingsStatusLocationUpdated", "Location updated."));

        // Cleanup
        delete window.receiveNativeLocation;
        delete window.onNativeLocationError;
      };

      // Define the error callback that Flutter will trigger
      window.onNativeLocationError = (errorMsg) => {
        setStatus(errorMsg);

        // Cleanup
        delete window.receiveNativeLocation;
        delete window.onNativeLocationError;
      };

      // Tell Flutter to grab the location and call our functions
      try {
        window.NativeApp.postMessage(JSON.stringify({ action: "requestLocation" }));
      } catch {
        setStatus("Failed to communicate with the App native bridge.");
      }
      return;
    }

    // 2. Standard Web Browser Fallback
    if (!navigator.geolocation) {
      setStatus(tr("settingsStatusGeoNotSupported", "Geolocation not supported in this browser."));
      return;
    }

    // Pre-check permission state so we can give a clear message before the
    // browser silently fails (some mobile browsers don't trigger the prompt
    // if the user previously dismissed it).
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state === "denied") {
          setStatus(
            "Location access is blocked. Please allow it in your browser/device Settings, then try again."
          );
          return;
        }
      }
    } catch {
      // permissions API not supported — proceed anyway
    }

    setStatus(tr("settingsStatusGettingLocation", "Getting location…"));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setStatus(tr("settingsStatusCoordsFailed", "Could not read coordinates."));
          return;
        }
        const next = {
          ...location,
          name: tr("settingsCurrentLocation", "Current location"),
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
        };
        setLocation(next);
        saveLocation(next);
        setStatus(tr("settingsStatusLocationUpdated", "Location updated."));
      },
      (err) => {
        // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=UNAVAILABLE, 3=TIMEOUT
        if (err.code === 1) {
          setStatus(
            "Location permission denied. Please allow location access in your browser/device settings and try again."
          );
        } else if (err.code === 2) {
          setStatus("Location unavailable. Check that GPS/Location is enabled on your device.");
        } else if (err.code === 3) {
          setStatus("Location request timed out. Please try again.");
        } else {
          setStatus(err?.message || tr("settingsStatusPermissionDenied", "Location permission denied."));
        }
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 }
    );
  };

  const onSaveLocation = () => {
    saveLocation(location);
    setEditing(false);
    setStatus(tr("settingsStatusSaved", "Saved."));
  };

  const onToggleSayana = () => {
    const next = !sayana;
    setSayana(next);
    saveBool(SAYANA_KEY, next);
  };

  const onMonthType = (value) => {
    setMonthType(value);
    localStorage.setItem(CAL_MONTH_TYPE_KEY, value);
  };

  const onYearType = (value) => {
    setYearType(value);
    localStorage.setItem(CAL_YEAR_TYPE_KEY, value);
  };

  const onAyanamsa = (value) => {
    setAyanamsa(value);
    saveAyanamsa(value);
  };

  return (
    <PageShell title={tr("settingsTitle", "Settings")} transparent>
      <div className="grid gap-1">
        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="grid gap-2 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <div className="text-lg sm:text-xl font-black text-amber-100">{tr("settingsLanguageTitle", "Language")}</div>
            </div>
            <button
              type="button"
              onClick={() => setLanguageOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-base font-semibold outline-none transition-all duration-200 hover:scale-[1.01]"
              style={selectorTriggerStyle}
              aria-label="Open language selector"
              title={currentLanguageOption ? currentLanguageOption.name : language}
            >
              <span className="truncate">
                {currentLanguageOption
                  ? currentLanguageOption.name
                  : language}
              </span>
              <span aria-hidden="true" className="ml-3 text-sm">▼</span>
            </button>
          </div>
        </section>

        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="grid gap-2 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <div className="text-lg sm:text-xl font-black text-amber-100">{tr("settingsLocationTitle", "Location")}</div>
              <div className="mt-1 text-xs sm:text-sm text-amber-100/70">
                {location.name || "—"}
                <div className="mt-1 text-xs sm:text-sm text-amber-100/70">
                  {location.lat}°, {location.lng}° • {tr("settingsTimezone", "Timezone")} {location.tzOffset}
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <button
                type="button"
                onClick={onAutoLocation}
                className="rounded-xl px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
                style={{ background: "transparent" }}
              >
                ⦿ {tr("settingsAutoLocation", "Auto Location")}
              </button>
              <button
                type="button"
                onClick={() => setEditing((s) => !s)}
                className="rounded-xl px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
                style={{ background: "transparent" }}
              >
                📍 {tr("settingsChangeLocation", "Change Location")}
              </button>
            </div>
          </div>

          {editing ? (
            <div className="app-surface-soft mt-1 grid gap-2 rounded-xl p-3 md:grid-cols-2" style={{ background: "transparent", backdropFilter: "none" }}>
              <label className="grid gap-1">
                <span className="text-xs font-black tracking-wide text-amber-100/70">
                  {tr("settingsLabelName", "NAME")}
                </span>
                <input
                  value={location.name}
                  onChange={(e) => setLocation((s) => ({ ...s, name: e.target.value }))}
                  className="rounded-xl border border-white/10 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
                  style={{ background: "transparent" }}
                  placeholder="Ujjain, India"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-black tracking-wide text-amber-100/70">
                  {tr("settingsLabelTzOffset", "TZ OFFSET")}
                </span>
                <input
                  value={location.tzOffset}
                  onChange={(e) => setLocation((s) => ({ ...s, tzOffset: e.target.value }))}
                  className="rounded-xl border border-white/10 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
                  style={{ background: "transparent" }}
                  placeholder="+05:30"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-black tracking-wide text-amber-100/70">
                  {tr("settingsLabelLatitude", "LATITUDE")}
                </span>
                <input
                  value={location.lat}
                  onChange={(e) => setLocation((s) => ({ ...s, lat: e.target.value }))}
                  className="rounded-xl border border-white/10 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
                  style={{ background: "transparent" }}
                  placeholder="23.1765"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-black tracking-wide text-amber-100/70">
                  {tr("settingsLabelLongitude", "LONGITUDE")}
                </span>
                <input
                  value={location.lng}
                  onChange={(e) => setLocation((s) => ({ ...s, lng: e.target.value }))}
                  className="rounded-xl border border-white/10 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
                  style={{ background: "transparent" }}
                  placeholder="75.7885"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSaveLocation}
                  className="rounded-xl px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-amber-300/25"
                  style={{ background: "transparent" }}
                >
                  {tr("settingsSave", "Save")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
                  style={{ background: "transparent" }}
                >
                  {tr("settingsCancel", "Cancel")}
                </button>
              </div>
            </div>
          ) : null}

          {status ? <div className="mt-1 text-xs font-semibold text-amber-100/80">{status}</div> : null}
        </section>

        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-lg sm:text-xl font-black text-amber-100">{tr("settingsSayanaTitle", "Sayana Panchang")}</div>
              <div className="mt-1 text-xs sm:text-sm text-amber-100/70">
                {tr(
                  "settingsSayanaWarning",
                  "Warning: This may change ayanamsa and festival dates compared to most expectations."
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSayana}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full ring-1 transition sm:h-8 sm:w-14 ${sayana ? "ring-amber-300/25" : "ring-white/10"
                }`}
              style={{ background: "transparent" }}
              aria-label="Toggle Sayana"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-amber-100 transition sm:h-6 sm:w-6 ${sayana ? "translate-x-6 sm:translate-x-7" : "translate-x-1"
                  }`}
              />
            </button>
          </div>
        </section>

        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="text-lg sm:text-xl font-black text-amber-100">
            {tr("settingsCalendarMonthType", "Calendar Month Type")}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onMonthType("amavasyant")}
              className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ${monthType === "amavasyant"
                ? "text-amber-100 ring-amber-300/25"
                : "text-amber-100 ring-white/10 hover:bg-white/10"
                }`}
              style={{ background: "transparent" }}
            >
              Amavasyant
            </button>
            <button
              type="button"
              onClick={() => onMonthType("purnimant")}
              className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ${monthType === "purnimant"
                ? "text-amber-100 ring-amber-300/25"
                : "text-amber-100 ring-white/10 hover:bg-white/10"
                }`}
              style={{ background: "transparent" }}
            >
              Purnimant
            </button>
          </div>
        </section>

        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="text-lg sm:text-xl font-black text-amber-100">
            {tr("settingsCalendarYearType", "Calendar Year Type")}
          </div>
          <div className="mt-1 grid gap-2 md:grid-cols-2">
            {[
              ["vikram", "Vikram Samvat"],
              ["gujarati", "Gujarati Samvat"],
              ["saka", "Saka Samvat"],
              ["kali", "Kali Samvat"],
            ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onYearType(key)}
              className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ${yearType === key
                  ? "text-amber-100 ring-amber-300/25"
                  : "text-amber-100 ring-white/10 hover:bg-white/10"
                  }`}
              style={{ background: "transparent" }}
            >
              {label}
            </button>
            ))}
          </div>
        </section>

        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="text-lg sm:text-xl font-black text-amber-100">{tr("settingsAyanamsaTitle", "Ayanamsa")}</div>
          <button
            type="button"
            onClick={() => setAyanamsaOpen(true)}
            className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-base font-semibold outline-none transition-all duration-200 hover:scale-[1.01]"
            style={selectorTriggerStyle}
            aria-label="Open ayanamsa selector"
            title={ayanamsa}
          >
            <span className="truncate">
              {ayanamsa === "1" ? "Lahiri" : ayanamsa === "3" ? "Raman" : ayanamsa === "5" ? "KP" : ayanamsa}
            </span>
            <span aria-hidden="true" className="ml-3 text-sm">▼</span>
          </button>
        </section>

        <section className="app-surface rounded-2xl p-3" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="text-lg sm:text-xl font-black text-amber-100">Legal</div>
          <div className="mt-2 grid gap-2">
            <Link
              to="/privacy-policy"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-amber-100 transition-all duration-200 hover:bg-white/10"
              style={{ background: "transparent", border: "1.5px solid rgba(255, 183, 77, 0.4)" }}
            >
              {t.privacyPolicyTitle || "Privacy Policy"}
            </Link>
            <Link
              to="/terms-conditions"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-amber-100 transition-all duration-200 hover:bg-white/10"
              style={{ background: "transparent", border: "1.5px solid rgba(255, 183, 77, 0.4)" }}
            >
              {t.termsConditionsTitle || "Terms & Conditions"}
            </Link>
            <Link
              to="/disclaimer"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-amber-100 transition-all duration-200 hover:bg-white/10"
              style={{ background: "transparent", border: "1.5px solid rgba(255, 183, 77, 0.4)" }}
            >
              {t.disclaimerTitle || "Disclaimer"}
            </Link>
          </div>
        </section>
      </div>

      <SelectorPopup
        open={languageOpen}
        title="Select Language"
        options={languageOptions.map((l) => l.code)}
        selectedValue={language}
        onClose={() => setLanguageOpen(false)}
        renderOptionLabel={(code) => {
          const option = languageOptions.find((l) => l.code === code);
          return option ? option.name : code;
        }}
        onSelect={(value) => {
          onSaveLanguage(value);
          setLanguageOpen(false);
        }}
      />

      <SelectorPopup
        open={ayanamsaOpen}
        title="Select Ayanamsa"
        options={[
          { value: "1", label: "Lahiri" },
          { value: "3", label: "Raman" },
          { value: "5", label: "KP" },
        ].map((item) => item.value)}
        selectedValue={ayanamsa}
        onClose={() => setAyanamsaOpen(false)}
        renderOptionLabel={(value) => (value === "1" ? "Lahiri" : value === "3" ? "Raman" : value === "5" ? "KP" : value)}
        onSelect={(value) => {
          onAyanamsa(value);
          setAyanamsaOpen(false);
        }}
      />
    </PageShell>
  );
}

