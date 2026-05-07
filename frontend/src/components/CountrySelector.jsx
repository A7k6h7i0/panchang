import { useEffect, useMemo, useState } from "react";
import { translations } from "../translations";

const COUNTRY_REGIONS = {
  Canada: ["Ontario", "British Columbia", "Alberta", "Quebec", "Manitoba"],
  "United States": ["New Jersey", "California", "New York", "Texas", "Illinois", "Massachusetts"],
  Bangladesh: [],
  China: [],
  Egypt: [],
  Fiji: [],
  Indonesia: [],
  Japan: [],
  Kenya: [],
  Nigeria: [],
  "New Zealand": [],
  Oman: [],
  Pakistan: [],
  Philippines: [],
  Qatar: [],
  "Saudi Arabia": [],
  Singapore: [],
  "South Africa": [],
  "Sri Lanka": [],
  Tanzania: [],
  Thailand: [],
  "United Arab Emirates": [],
  Nepal: ["Madhesh Province", "Bagmati Province", "Lumbini Province", "Koshi Province", "Karnali Province"],
  Mauritius: ["Plaines Wilhems", "Savanne", "Pamplemousses", "Flacq", "Grand Port"],
  Guyana: ["East Berbice-Corentyne", "Essequibo Islands-West Demerara", "Mahaica-Berbice", "Demerara-Mahaica"],
  Suriname: ["Saramacca", "Nickerie", "Wanica", "Commewijne", "Paramaribo"],
  Malaysia: ["Negeri Sembilan", "Selangor", "Perak", "Penang", "Kuala Lumpur"],
  "United Kingdom": ["Greater London", "West Midlands", "Leicester", "Greater Manchester"],
  Australia: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
};

export const countryOptions = Object.keys(COUNTRY_REGIONS);

export function getRegionsForCountry(country) {
  return COUNTRY_REGIONS[country] || [];
}

function getCountryLabel(country, language) {
  const dict = translations[language] || translations.en || {};
  return dict[country] || country;
}

const triggerStyle = {
  background: "linear-gradient(135deg, rgba(180, 130, 50, 0.5) 0%, rgba(140, 100, 40, 0.6) 100%)",
  color: "#FFF4D8",
  border: "2px solid rgba(255, 140, 50, 0.7)",
  boxShadow: "0 0 12px rgba(255, 140, 50, 0.45), inset 0 0 8px rgba(255, 200, 100, 0.25)",
};

const popupShellStyle = {
  background: "linear-gradient(135deg, #4a0e0e 0%, #d8691e 50%, #4a0e0e 100%)",
  border: "2px solid rgba(255, 220, 150, 0.85)",
};

const popupListStyle = {
  background: "linear-gradient(180deg, rgba(255, 110, 40, 0.35) 0%, rgba(255, 90, 25, 0.25) 100%)",
};

function SelectorPopup({
  open,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  onBack,
  renderOptionLabel,
  emptyLabel = "No options available",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1010] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl p-4 shadow-2xl"
        style={popupShellStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-3 text-center text-lg font-bold text-orange-300">{title}</h3>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 rounded-lg px-3 py-2 text-sm font-semibold text-orange-100 transition-all duration-200 hover:bg-orange-600/60"
            style={{
              background: "rgba(255, 140, 50, 0.18)",
              border: "1px solid rgba(255, 183, 77, 0.45)",
            }}
          >
            Back
          </button>
        ) : null}
        <div className="max-h-72 overflow-y-auto rounded-lg p-2" style={popupListStyle}>
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
                    isActive ? "bg-orange-500 text-white shadow-lg" : "bg-orange-700/95 text-orange-100 hover:bg-orange-600"
                  }`}
                >
                  <span className="block break-words whitespace-normal leading-5">{optionLabel}</span>
                </button>
              );
            })
          ) : (
            <div className="rounded-lg px-3 py-4 text-sm font-medium text-orange-100">
              {emptyLabel}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, rgba(230, 81, 0, 0.9) 0%, rgba(255, 112, 67, 0.9) 100%)",
            border: "2px solid rgba(255, 183, 77, 0.8)",
            boxShadow: "0 2px 8px rgba(230, 81, 0, 0.4)",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function CountrySelector({
  country,
  region,
  language = "en",
  onCountryChange,
  onRegionChange,
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState("country");
  const regions = useMemo(() => getRegionsForCountry(country), [country]);
  const countryLabel = getCountryLabel(country, language);

  useEffect(() => {
    if (!popupOpen) {
      setPopupView("country");
    }
  }, [popupOpen]);

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setPopupView("country");
            setPopupOpen(true);
          }}
          className="inline-flex h-6 min-w-[68px] max-w-[68px] items-center justify-center gap-1 rounded-lg px-1 text-[9px] font-black outline-none transition-all duration-200 hover:scale-105 sm:h-7 sm:min-w-[84px] sm:max-w-[84px] sm:px-1.5 sm:text-[10px]"
          style={triggerStyle}
          aria-label="Open country selector"
          title={countryLabel || "Country"}
        >
          <span className="truncate">{countryLabel || "Country"}</span>
          <span aria-hidden="true" className="text-[10px]">▼</span>
        </button>
      </div>

      <SelectorPopup
        open={popupOpen}
        title={popupView === "country" ? "Select Country" : `${countryLabel || "Country"} Regions`}
        options={popupView === "country" ? countryOptions : regions}
        selectedValue={popupView === "country" ? country : region}
        onClose={() => setPopupOpen(false)}
        onBack={popupView === "region" ? () => setPopupView("country") : null}
        renderOptionLabel={popupView === "country" ? (option) => getCountryLabel(option, language) : undefined}
        emptyLabel="No regions available"
        onSelect={(value) => {
          if (popupView === "country") {
            onCountryChange(value);
            onRegionChange("");
            setPopupView("region");
            return;
          }
          onRegionChange(value);
          setPopupOpen(false);
        }}
      />
    </>
  );
}
