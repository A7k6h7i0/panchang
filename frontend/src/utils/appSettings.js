import { ensureLanguageLoaded, translations } from "../translations";
import { storageGet, storageSet } from "./storage";

const LANGUAGE_KEY = "panchang:selected-language";
const COUNTRY_KEY = "panchang:selected-country";
const LOCATION_KEY = "panchang:selected-location";
const AYANAMSA_KEY = "panchang:selected-ayanamsa";
export const LANGUAGE_CHANGE_EVENT = "panchang:language-changed";
export const COUNTRY_CHANGE_EVENT = "panchang:country-changed";

const COUNTRY_CONFIGS = {
  India: {
    timeZone: "Asia/Kolkata",
    tzOffset: "+05:30",
    name: "India",
    lat: "23.1765",
    lng: "75.7885",
  },
  Canada: {
    timeZone: "America/Toronto",
    tzOffset: "-05:00",
    name: "Canada",
    lat: "43.6532",
    lng: "-79.3832",
  },
  US: {
    timeZone: "America/New_York",
    tzOffset: "-05:00",
    name: "United States",
    lat: "40.7128",
    lng: "-74.0060",
  },
  UK: {
    timeZone: "Europe/London",
    tzOffset: "+00:00",
    name: "United Kingdom",
    lat: "51.5072",
    lng: "-0.1276",
  },
  Nepal: {
    timeZone: "Asia/Kathmandu",
    tzOffset: "+05:45",
    name: "Nepal",
    lat: "27.7172",
    lng: "85.3240",
  },
  Mauritius: {
    timeZone: "Indian/Mauritius",
    tzOffset: "+04:00",
    name: "Mauritius",
    lat: "-20.1609",
    lng: "57.5012",
  },
  Guyana: {
    timeZone: "America/Guyana",
    tzOffset: "-04:00",
    name: "Guyana",
    lat: "4.8604",
    lng: "-58.9302",
  },
  Suriname: {
    timeZone: "America/Paramaribo",
    tzOffset: "-03:00",
    name: "Suriname",
    lat: "5.8520",
    lng: "-55.2038",
  },
  Malaysia: {
    timeZone: "Asia/Kuala_Lumpur",
    tzOffset: "+08:00",
    name: "Malaysia",
    lat: "3.1390",
    lng: "101.6869",
  },
  Australia: {
    timeZone: "Australia/Sydney",
    tzOffset: "+10:00",
    name: "Australia",
    lat: "-33.8688",
    lng: "151.2093",
  },
  Bangladesh: {
    timeZone: "Asia/Dhaka",
    tzOffset: "+06:00",
    name: "Bangladesh",
    lat: "23.8103",
    lng: "90.4125",
  },
  China: {
    timeZone: "Asia/Shanghai",
    tzOffset: "+08:00",
    name: "China",
    lat: "31.2304",
    lng: "121.4737",
  },
  Egypt: {
    timeZone: "Africa/Cairo",
    tzOffset: "+02:00",
    name: "Egypt",
    lat: "30.0444",
    lng: "31.2357",
  },
  Fiji: {
    timeZone: "Pacific/Fiji",
    tzOffset: "+12:00",
    name: "Fiji",
    lat: "-18.1248",
    lng: "178.4501",
  },
  Indonesia: {
    timeZone: "Asia/Jakarta",
    tzOffset: "+07:00",
    name: "Indonesia",
    lat: "-6.2088",
    lng: "106.8456",
  },
  Japan: {
    timeZone: "Asia/Tokyo",
    tzOffset: "+09:00",
    name: "Japan",
    lat: "35.6762",
    lng: "139.6503",
  },
  Kenya: {
    timeZone: "Africa/Nairobi",
    tzOffset: "+03:00",
    name: "Kenya",
    lat: "-1.2921",
    lng: "36.8219",
  },
  Nigeria: {
    timeZone: "Africa/Lagos",
    tzOffset: "+01:00",
    name: "Nigeria",
    lat: "6.5244",
    lng: "3.3792",
  },
  "New Zealand": {
    timeZone: "Pacific/Auckland",
    tzOffset: "+12:00",
    name: "New Zealand",
    lat: "-36.8485",
    lng: "174.7633",
  },
  Oman: {
    timeZone: "Asia/Muscat",
    tzOffset: "+04:00",
    name: "Oman",
    lat: "23.5880",
    lng: "58.3829",
  },
  Pakistan: {
    timeZone: "Asia/Karachi",
    tzOffset: "+05:00",
    name: "Pakistan",
    lat: "24.8607",
    lng: "67.0011",
  },
  Philippines: {
    timeZone: "Asia/Manila",
    tzOffset: "+08:00",
    name: "Philippines",
    lat: "14.5995",
    lng: "120.9842",
  },
  Qatar: {
    timeZone: "Asia/Qatar",
    tzOffset: "+03:00",
    name: "Qatar",
    lat: "25.2854",
    lng: "51.5310",
  },
  "Saudi Arabia": {
    timeZone: "Asia/Riyadh",
    tzOffset: "+03:00",
    name: "Saudi Arabia",
    lat: "24.7136",
    lng: "46.6753",
  },
  Singapore: {
    timeZone: "Asia/Singapore",
    tzOffset: "+08:00",
    name: "Singapore",
    lat: "1.3521",
    lng: "103.8198",
  },
  "South Africa": {
    timeZone: "Africa/Johannesburg",
    tzOffset: "+02:00",
    name: "South Africa",
    lat: "-26.2041",
    lng: "28.0473",
  },
  "Sri Lanka": {
    timeZone: "Asia/Colombo",
    tzOffset: "+05:30",
    name: "Sri Lanka",
    lat: "6.9271",
    lng: "79.8612",
  },
  Tanzania: {
    timeZone: "Africa/Dar_es_Salaam",
    tzOffset: "+03:00",
    name: "Tanzania",
    lat: "-6.7924",
    lng: "39.2083",
  },
  Thailand: {
    timeZone: "Asia/Bangkok",
    tzOffset: "+07:00",
    name: "Thailand",
    lat: "13.7563",
    lng: "100.5018",
  },
  "United Arab Emirates": {
    timeZone: "Asia/Dubai",
    tzOffset: "+04:00",
    name: "United Arab Emirates",
    lat: "25.2048",
    lng: "55.2708",
  },
};

const COUNTRY_ALIASES = {
  India: "India",
  Canada: "Canada",
  US: "US",
  "United States": "US",
  UK: "UK",
  "United Kingdom": "UK",
  Nepal: "Nepal",
  Mauritius: "Mauritius",
  Guyana: "Guyana",
  Suriname: "Suriname",
  Malaysia: "Malaysia",
  Australia: "Australia",
  Bangladesh: "Bangladesh",
  China: "China",
  Egypt: "Egypt",
  Fiji: "Fiji",
  Indonesia: "Indonesia",
  Japan: "Japan",
  Kenya: "Kenya",
  Nigeria: "Nigeria",
  "New Zealand": "New Zealand",
  Oman: "Oman",
  Pakistan: "Pakistan",
  Philippines: "Philippines",
  Qatar: "Qatar",
  "Saudi Arabia": "Saudi Arabia",
  Singapore: "Singapore",
  "South Africa": "South Africa",
  "Sri Lanka": "Sri Lanka",
  Tanzania: "Tanzania",
  Thailand: "Thailand",
  "United Arab Emirates": "United Arab Emirates",
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildCountryLookup() {
  const lookup = new Map();

  const register = (raw, canonical) => {
    const key = normalizeText(raw);
    if (!key || !canonical) return;
    if (!lookup.has(key)) lookup.set(key, canonical);
  };

  for (const [countryKey, config] of Object.entries(COUNTRY_CONFIGS)) {
    register(countryKey, countryKey);
    register(config?.name, countryKey);
  }

  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
    register(alias, canonical);
  }

  for (const dict of Object.values(translations || {})) {
    for (const [countryKey, config] of Object.entries(COUNTRY_CONFIGS)) {
      register(dict?.[countryKey], countryKey);
      register(dict?.[config?.name], countryKey);
    }
  }

  return lookup;
}

const COUNTRY_LOOKUP = buildCountryLookup();

export function normalizeCountryKey(country) {
  const raw = String(country || "").trim();
  if (!raw) return DEFAULTS.country;

  const normalized = normalizeText(raw);
  return (
    COUNTRY_LOOKUP.get(normalized) ||
    COUNTRY_ALIASES[raw] ||
    (COUNTRY_CONFIGS[raw] ? raw : DEFAULTS.country)
  );
}

const DEFAULTS = {
  language: "en",
  country: "India",
  ayanamsa: "1",
  location: {
    name: "Ujjain, India",
    lat: "23.1765",
    lng: "75.7885",
    tzOffset: "+05:30",
  },
};

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadLanguage() {
  const raw = storageGet(LANGUAGE_KEY);
  return (raw && String(raw).trim()) || DEFAULTS.language;
}

export function saveLanguage(language) {
  const nextLanguage = String(language || DEFAULTS.language);
  storageSet(LANGUAGE_KEY, nextLanguage);
  ensureLanguageLoaded(nextLanguage).finally(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_CHANGE_EVENT, {
        detail: { language: nextLanguage },
      })
    );
  });
}

export function loadCountry() {
  const raw = storageGet(COUNTRY_KEY);
  return normalizeCountryKey(raw);
}

export function saveCountry(country) {
  const nextCountry = normalizeCountryKey(country);
  storageSet(COUNTRY_KEY, nextCountry);
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(COUNTRY_CHANGE_EVENT, {
      detail: { country: nextCountry },
    })
  );
}

export const countryOptions = Object.keys(COUNTRY_CONFIGS);

export function getCountryConfig(country) {
  return COUNTRY_CONFIGS[normalizeCountryKey(country)] || COUNTRY_CONFIGS[DEFAULTS.country];
}

export function getCountryAstroDefaults(country, language) {
  const selectedCountry = normalizeCountryKey(country);
  const config = getCountryConfig(selectedCountry);
  return {
    la: language || loadLanguage(),
    lat: config.lat,
    lng: config.lng,
    tzOffset: config.tzOffset,
    ayanamsa: loadAyanamsa(),
    locationName: config.name,
    country: selectedCountry,
    timeZone: config.timeZone,
  };
}

export function getTimePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: Number(map.year || 0),
    month: Number(map.month || 0),
    day: Number(map.day || 0),
    hour: Number(map.hour || 0),
    minute: Number(map.minute || 0),
    second: Number(map.second || 0),
  };
}

export function formatTimeInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function loadAyanamsa() {
  const raw = storageGet(AYANAMSA_KEY);
  return (raw && String(raw).trim()) || DEFAULTS.ayanamsa;
}

export function saveAyanamsa(ayanamsa) {
  storageSet(AYANAMSA_KEY, String(ayanamsa || DEFAULTS.ayanamsa));
}

export function loadLocation() {
  const raw = storageGet(LOCATION_KEY);
  const parsed = raw ? safeParseJson(raw) : null;
  const loc = parsed && typeof parsed === "object" ? parsed : null;
  return {
    name: (loc?.name && String(loc.name)) || DEFAULTS.location.name,
    lat: (loc?.lat && String(loc.lat)) || DEFAULTS.location.lat,
    lng: (loc?.lng && String(loc.lng)) || DEFAULTS.location.lng,
    tzOffset: (loc?.tzOffset && String(loc.tzOffset)) || DEFAULTS.location.tzOffset,
  };
}

export function saveLocation(next) {
  const current = loadLocation();
  const value = {
    name: (next?.name && String(next.name)) || current.name,
    lat: (next?.lat && String(next.lat)) || current.lat,
    lng: (next?.lng && String(next.lng)) || current.lng,
    tzOffset: (next?.tzOffset && String(next.tzOffset)) || current.tzOffset,
  };
  storageSet(LOCATION_KEY, JSON.stringify(value));
}

export function getAstroDefaults() {
  const language = loadLanguage();
  const location = loadLocation();
  const ayanamsa = loadAyanamsa();
  return {
    la: language,
    lat: location.lat,
    lng: location.lng,
    tzOffset: location.tzOffset,
    ayanamsa,
    locationName: location.name,
  };
}
