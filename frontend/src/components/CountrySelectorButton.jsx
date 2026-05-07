import { useEffect, useMemo, useState } from "react";
import { countryOptions, loadCountry, normalizeCountryKey, saveCountry } from "../utils/appSettings";
import { translations } from "../translations";

const triggerStyle = {
  background: "transparent",
  color: "#FFF4D8",
  border: "1.5px solid rgba(255, 183, 77, 0.4)",
  boxShadow: "none",
};

const popupShellStyle = {
  background: "rgba(40, 18, 6, 0.72)",
  border: "1px solid rgba(255, 220, 120, 0.28)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
};

const popupListStyle = {
  background: "transparent",
};

const COUNTRY_SHORT_CODES = {
  India: "IN",
  Canada: "CA",
  US: "US",
  UK: "UK",
  Nepal: "NP",
  Mauritius: "MU",
  Guyana: "GY",
  Suriname: "SR",
  Malaysia: "MY",
  Australia: "AU",
  Bangladesh: "BD",
  China: "CN",
  Egypt: "EG",
  Fiji: "FJ",
  Indonesia: "ID",
  Japan: "JP",
  Kenya: "KE",
  Nigeria: "NG",
  "New Zealand": "NZ",
  Oman: "OM",
  Pakistan: "PK",
  Philippines: "PH",
  Qatar: "QA",
  "Saudi Arabia": "SA",
  Singapore: "SG",
  "South Africa": "ZA",
  "Sri Lanka": "LK",
  Tanzania: "TZ",
  Thailand: "TH",
  "United Arab Emirates": "AE",
};

function getCountryLabel(country, language) {
  const dict = translations[language] || translations.en || {};
  return dict[country] || country;
}

function getCountryShortCode(country) {
  if (COUNTRY_SHORT_CODES[country]) return COUNTRY_SHORT_CODES[country];
  const parts = String(country || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

export default function CountrySelectorButton({ value, onChange, language = "en", style: styleOverride }) {
  const [open, setOpen] = useState(false);
  const [internalCountry, setInternalCountry] = useState(() => normalizeCountryKey(loadCountry()));
  const isControlled = value != null;
  const country = normalizeCountryKey(isControlled ? value : internalCountry);
  const options = useMemo(() => countryOptions || [], []);
  const countryLabel = getCountryLabel(country, language);
  const countryCode = getCountryShortCode(country);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-6 min-w-[34px] items-center justify-center gap-0.5 rounded-lg px-1 text-[8px] font-black outline-none transition-all duration-200 hover:scale-105 sm:h-7 sm:min-w-[72px] sm:gap-1 sm:px-1.5 sm:text-[10px]"
        style={{ ...triggerStyle, ...styleOverride }}
        aria-label="Open country selector"
        title={countryLabel}
      >
        <span className="sm:hidden">{countryCode}</span>
        <span className="hidden sm:inline">{countryLabel}</span>
        <span aria-hidden="true" className="text-[8px] sm:text-[10px]">
          {"\u25BC"}
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[1010] flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.04)",
            backdropFilter: "blur(8px)",
          }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-4 shadow-2xl"
            style={popupShellStyle}
            onPointerDownCapture={(event) => event.stopPropagation()}
            onTouchStartCapture={(event) => event.stopPropagation()}
          >
            <h3 className="mb-3 text-center text-lg font-bold text-orange-100">Select Country</h3>
            <div
              className="max-h-72 overflow-y-auto rounded-lg p-2"
              style={{
                ...popupListStyle,
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
              }}
            >
              {options.map((option) => {
                const isActive = option === country;
                const optionLabel = getCountryLabel(option, language);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      const nextCountry = normalizeCountryKey(option);
                      saveCountry(nextCountry);
                      if (onChange) onChange(nextCountry);
                      if (!isControlled) setInternalCountry(nextCountry);
                      setOpen(false);
                    }}
                    className={`mb-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-amber-300/15 text-white"
                        : "bg-transparent text-orange-100 hover:bg-amber-300/10"
                    }`}
                    style={{
                      border: "1px solid rgba(255, 183, 77, 0.28)",
                      boxShadow: isActive ? "inset 0 0 0 1px rgba(255, 220, 150, 0.25)" : "none",
                    }}
                  >
                    <span className="block break-words whitespace-normal leading-5">{optionLabel}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 183, 77, 0.65)",
                boxShadow: "none",
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
