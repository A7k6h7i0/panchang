import { useMemo, useState } from "react";
import PageShell from "./PageShell";
import { languages, translations } from "../translations";
import {
  loadAyanamsa,
  loadLanguage,
  loadLocation,
  saveAyanamsa,
  saveLanguage,
  saveLocation,
} from "../utils/appSettings";

const CAL_MONTH_TYPE_KEY = "panchang:calendar-month-type";
const CAL_YEAR_TYPE_KEY = "panchang:calendar-year-type";
const SAYANA_KEY = "panchang:sayana";

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

export default function SettingsPage() {
  const [language, setLanguage] = useState(() => loadLanguage());
  const [location, setLocation] = useState(() => loadLocation());
  const [ayanamsa, setAyanamsa] = useState(() => loadAyanamsa());
  const [sayana, setSayana] = useState(() => (typeof window === "undefined" ? false : loadBool(SAYANA_KEY)));
  const [monthType, setMonthType] = useState(() => localStorage.getItem(CAL_MONTH_TYPE_KEY) || "amavasyant");
  const [yearType, setYearType] = useState(() => localStorage.getItem(CAL_YEAR_TYPE_KEY) || "saka");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");

  const languageOptions = useMemo(() => languages || [], []);
  const settingsOverrides = useMemo(
    () => ({
      te: {
        settingsTitle: "సెట్టింగ్స్",
        settingsLanguageTitle: "భాష",
        settingsLanguageSubtitle: "Prokerala అభ్యర్థనలు మరియు UI కోసం యాప్ భాష.",
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
        settingsAyanamsaSubtitle: "Prokerala జ్యోతిష గణనలకు ఉపయోగిస్తారు.",
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
        settingsLanguageSubtitle: "Prokerala अनुरोध और UI के लिए ऐप भाषा।",
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
        settingsAyanamsaSubtitle: "Prokerala ज्योतिष गणनाओं के लिए उपयोग होता है।",
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
        settingsLanguageSubtitle: "Prokerala അഭ്യർത്ഥനകൾക്കും UI-ക്കും വേണ്ടിയുള്ള ആപ്പ് ഭാഷ.",
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
        settingsAyanamsaSubtitle: "Prokerala ജ്യോതിഷ കണക്കുകൾക്കായി ഉപയോഗിക്കുന്നു.",
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
        settingsLanguageSubtitle: "Prokerala ವಿನಂತಿಗಳು ಮತ್ತು UIಗಾಗಿ ಆಪ್ ಭಾಷೆ.",
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
        settingsAyanamsaSubtitle: "Prokerala ಜ್ಯೋತಿಷ ಲೆಕ್ಕಾಚಾರಗಳಿಗೆ ಬಳಸಲಾಗುತ್ತದೆ.",
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
        settingsLanguageSubtitle: "Prokerala கோரிக்கைகள் மற்றும் UI-க்கு பயன்பாட்டு மொழி.",
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
        settingsAyanamsaSubtitle: "Prokerala ஜோதிட கணக்குகளுக்கு பயன்படுத்தப்படுகிறது.",
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
    setLanguage(value);
    saveLanguage(value);
  };

  const onAutoLocation = () => {
    if (!navigator.geolocation) {
      setStatus(tr("settingsStatusGeoNotSupported", "Geolocation not supported in this browser."));
      return;
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
          name: location.name || tr("settingsCurrentLocation", "Current location"),
          lat: lat.toFixed(4),
          lng: lng.toFixed(4),
        };
        setLocation(next);
        saveLocation(next);
        setStatus(tr("settingsStatusLocationUpdated", "Location updated."));
      },
      (err) => setStatus(err?.message || tr("settingsStatusPermissionDenied", "Location permission denied.")),
      { enableHighAccuracy: true, timeout: 10_000 }
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
    <PageShell title={tr("settingsTitle", "Settings")}>
      <div className="grid gap-4">
        <section className="app-surface rounded-3xl p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <div className="text-2xl font-black text-amber-100">{tr("settingsLanguageTitle", "Language")}</div>
              <div className="mt-1 text-sm text-amber-100/70">
                {tr("settingsLanguageSubtitle", "App language for Prokerala requests and UI.")}
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => onSaveLanguage(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base font-semibold text-amber-50 outline-none focus:border-amber-300/35"
            >
              {languageOptions.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName ? `${l.name} (${l.nativeName})` : l.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="app-surface rounded-3xl p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <div className="text-2xl font-black text-amber-100">{tr("settingsLocationTitle", "Location")}</div>
              <div className="mt-1 text-sm text-amber-100/70">
                {location.name || "—"}
                <div className="mt-1 text-xs text-amber-100/70">
                  {location.lat}°, {location.lng}° • {tr("settingsTimezone", "Timezone")} {location.tzOffset}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={onAutoLocation}
                className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
              >
                ⦿ {tr("settingsAutoLocation", "Auto Location")}
              </button>
              <button
                type="button"
                onClick={() => setEditing((s) => !s)}
                className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
              >
                📍 {tr("settingsChangeLocation", "Change Location")}
              </button>
            </div>
          </div>

          {editing ? (
            <div className="app-surface-soft mt-4 grid gap-3 rounded-2xl p-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-black tracking-wide text-amber-100/70">
                  {tr("settingsLabelName", "NAME")}
                </span>
                <input
                  value={location.name}
                  onChange={(e) => setLocation((s) => ({ ...s, name: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
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
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
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
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
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
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-amber-50 outline-none focus:border-amber-300/35"
                  placeholder="75.7885"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSaveLocation}
                  className="rounded-2xl bg-amber-400/15 px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-400/20"
                >
                  {tr("settingsSave", "Save")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
                >
                  {tr("settingsCancel", "Cancel")}
                </button>
              </div>
            </div>
          ) : null}

          {status ? <div className="mt-3 text-xs font-semibold text-amber-100/80">{status}</div> : null}
        </section>

        <section className="app-surface rounded-3xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-black text-amber-100">{tr("settingsSayanaTitle", "Sayana Panchang")}</div>
              <div className="mt-1 text-sm text-amber-100/70">
                {tr(
                  "settingsSayanaWarning",
                  "Warning: This may change ayanamsa and festival dates compared to most expectations."
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSayana}
              className={`relative inline-flex h-10 w-16 items-center rounded-full ring-1 transition ${
                sayana ? "bg-amber-400/30 ring-amber-300/25" : "bg-white/5 ring-white/10"
              }`}
              aria-label="Toggle Sayana"
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-amber-100 transition ${
                  sayana ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="app-surface rounded-3xl p-5">
          <div className="text-2xl font-black text-amber-100">
            {tr("settingsCalendarMonthType", "Calendar Month Type")}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onMonthType("amavasyant")}
              className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
                monthType === "amavasyant"
                  ? "bg-amber-400/25 text-amber-100 ring-amber-300/25"
                  : "bg-white/5 text-amber-100 ring-white/10 hover:bg-white/10"
              }`}
            >
              Amavasyant
            </button>
            <button
              type="button"
              onClick={() => onMonthType("purnimant")}
              className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
                monthType === "purnimant"
                  ? "bg-amber-400/25 text-amber-100 ring-amber-300/25"
                  : "bg-white/5 text-amber-100 ring-white/10 hover:bg-white/10"
              }`}
            >
              Purnimant
            </button>
          </div>
        </section>

        <section className="app-surface rounded-3xl p-5">
          <div className="text-2xl font-black text-amber-100">
            {tr("settingsCalendarYearType", "Calendar Year Type")}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                className={`rounded-2xl px-4 py-3 text-sm font-black ring-1 ${
                  yearType === key
                    ? "bg-amber-400/25 text-amber-100 ring-amber-300/25"
                    : "bg-white/5 text-amber-100 ring-white/10 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="app-surface rounded-3xl p-5">
          <div className="text-2xl font-black text-amber-100">{tr("settingsAyanamsaTitle", "Ayanamsa")}</div>
          <div className="mt-2 text-sm text-amber-100/70">
            {tr("settingsAyanamsaSubtitle", "Used for Prokerala astrology calculations.")}
          </div>
          <select
            value={ayanamsa}
            onChange={(e) => onAyanamsa(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base font-semibold text-amber-50 outline-none focus:border-amber-300/35"
          >
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
        </section>
      </div>
    </PageShell>
  );
}
