import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import { DOSHA_PARIHARA_DATA_URL, normalizeDoshaPariharaDataset, normalizeText, recordMatchesFilters, scoreDoshaPariharaRecord } from "../utils/doshaParihara";
import { UiIcon } from "../components/UiIcons";
import { useLanguage } from "../hooks/useLanguage";

const QUICK_SEARCHES = [
  "Kuja Dosha",
  "Rahu/Ketu Dosha",
  "Marriage Delay",
  "Education Problems",
  "Health Issues",
  "Financial Problems",
  "Career Issues",
];

const VOICE_LANGUAGE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  ta: "ta-IN",
};

function Pill({ active = false, children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="min-w-0 max-w-full rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition hover:scale-[1.01] sm:text-[11px]"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(255, 186, 75, 0.26) 0%, rgba(255, 143, 41, 0.2) 100%)"
          : "transparent",
        border: active ? "1.5px solid rgba(255, 183, 77, 0.4)" : "1.5px solid rgba(255, 183, 77, 0.22)",
        color: "#FFF4DF",
        boxShadow: active
          ? "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
          : "0 0 10px rgba(212, 168, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        whiteSpace: "normal",
        lineHeight: 1.15,
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </button>
  );
}

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.webkitSpeechRecognition || window.SpeechRecognition || null;
}

function getSpeechRecognitionLanguage(language) {
  const normalized = String(language || "").toLowerCase();
  if (VOICE_LANGUAGE_MAP[normalized]) return VOICE_LANGUAGE_MAP[normalized];
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "en-IN";
}

function RecordCard({ record }) {
  const routeState = { record };
  const locationText = [record.location, record.district, record.state].filter(Boolean).join(" • ");

  return (
    <Link
      to={`/dosha-parihara/${encodeURIComponent(record.id)}`}
      state={routeState}
      className="group block overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(180deg, rgba(20, 10, 6, 0.5) 0%, rgba(35, 16, 9, 0.66) 100%)",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.28)",
      }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-[11px] font-black uppercase tracking-[0.18em]"
            style={{
              background: "linear-gradient(135deg, rgba(255, 245, 218, 0.98) 0%, rgba(255, 224, 160, 0.96) 52%, rgba(255, 201, 122, 0.92) 100%)",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              color: "#8B4513",
            }}
          >
            {String(record.templeName || "TD").slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-[#FFF4DB] sm:text-[15px]">
                  {record.templeName}
                </div>
                <div className="mt-1 text-xs leading-5 text-[#FFE4B5]">
                  {locationText || "Address not available"}
                </div>
              </div>
              <div
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 214, 102, 0.18) 0%, rgba(255, 164, 66, 0.28) 100%)",
                  border: "1.5px solid rgba(255, 196, 108, 0.34)",
                  color: "#FFF1BE",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <span aria-hidden="true">{"\u2605"}</span>
                <span>{record.state || "Temple"}</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {(record.doshaTypes || []).slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "#FFE4B5",
                    border: "1px solid rgba(255, 183, 77, 0.18)",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-[12px] leading-5 text-[#FFF0D7] sm:grid-cols-2">
          <div>
            <span className="font-black uppercase tracking-[0.16em] text-[#FFD49E]">Ritual: </span>
            {record.ritualName || "Not listed"}
          </div>
          <div>
            <span className="font-black uppercase tracking-[0.16em] text-[#FFD49E]">Speciality: </span>
            {record.speciality || "Not listed"}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFE2B0] sm:text-[11px]">
          <span>{(record.problemKeywords || []).slice(0, 3).join(" • ")}</span>
          <span className="inline-flex items-center gap-1">
            View details
            <UiIcon name="arrowLeft" size={12} className="rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DoshaPariharaPage() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataset, setDataset] = useState({ categories: [], doshaTypes: [], records: [] });
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDoshaType, setActiveDoshaType] = useState("all");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const recognitionRef = useRef(null);
  const recognitionStartingRef = useRef(false);
  const queryInputRef = useRef(null);
  const speechLanguage = useMemo(() => getSpeechRecognitionLanguage(language), [language]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(DOSHA_PARIHARA_DATA_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Unable to load dosha parihara data (${response.status})`);
        }
        const payload = await response.json();
        const nextDataset = normalizeDoshaPariharaDataset(payload);
        if (active) {
          setDataset(nextDataset);
        }
      } catch (nextError) {
        if (nextError?.name === "AbortError") return;
        if (active) {
          setError("Could not load local dosha parihara data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      setVoiceSupported(false);
      recognitionRef.current = null;
      recognitionStartingRef.current = false;
      return undefined;
    }

    setVoiceSupported(true);
    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = speechLanguage;

    recognition.onstart = () => {
      recognitionStartingRef.current = false;
      setIsListening(true);
    };

    recognition.onend = () => {
      recognitionStartingRef.current = false;
      setIsListening(false);
    };

    recognition.onerror = () => {
      recognitionStartingRef.current = false;
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setQuery(transcript);
      }
      recognition.stop();
      window.setTimeout(() => {
        queryInputRef.current?.focus?.();
      }, 0);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop errors
      }
      recognitionRef.current = null;
      recognitionStartingRef.current = false;
      setIsListening(false);
    };
  }, [speechLanguage]);

  const categories = useMemo(() => dataset.categories || [], [dataset.categories]);
  const doshaTypes = useMemo(() => dataset.doshaTypes || [], [dataset.doshaTypes]);
  const normalizedQuery = normalizeText(deferredQuery);

  const records = useMemo(() => {
    const filtered = (dataset.records || []).filter((record) =>
      recordMatchesFilters(record, {
        query: normalizedQuery,
        categoryId: activeCategory,
        doshaTypeId: activeDoshaType,
      })
    );

    return [...filtered].sort((a, b) => {
      const scoreDiff = scoreDoshaPariharaRecord(b, normalizedQuery) - scoreDoshaPariharaRecord(a, normalizedQuery);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.templeName || "").localeCompare(String(b.templeName || ""));
    });
  }, [activeCategory, activeDoshaType, dataset.records, normalizedQuery]);

  const updateSearch = (value) => {
    setQuery(value);
  };

  const stopVoiceSearch = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // ignore stop errors
    }
    recognitionStartingRef.current = false;
    setIsListening(false);
  }, []);

  const startVoiceSearch = useCallback(() => {
    if (!voiceSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening || recognitionStartingRef.current) {
      stopVoiceSearch();
      return;
    }

    try {
      recognition.lang = speechLanguage;
      recognitionStartingRef.current = true;
      recognition.start();
    } catch {
      recognitionStartingRef.current = false;
      setIsListening(false);
    }
  }, [isListening, speechLanguage, stopVoiceSearch, voiceSupported]);

  return (
    <PageShell title="Dosha Parihara" transparent>
      <div className="mx-auto w-full max-w-4xl">
        <section
          className="rounded-2xl p-3 sm:p-4"
          style={{
            background: "linear-gradient(180deg, rgba(20, 10, 6, 0.5) 0%, rgba(35, 16, 9, 0.65) 100%)",
            border: "1.5px solid rgba(255, 183, 77, 0.4)",
            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 0 -1px 0 rgba(139, 69, 19, 0.14)",
          }}
        >
          <div className="rounded-2xl p-3 sm:p-4" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 183, 77, 0.14)" }}>
            <div className="max-w-2xl">
              <div className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: "#FFD49E" }}>
                Local Temple Search
              </div>
              <h1 className="mt-2 text-2xl font-black leading-tight text-[#FFF6E6] sm:text-[2.75rem]">
                Dosha Parihara
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#FFE1B8]">
                Search temples and remedy centers by dosha type, ritual, state, or the problem you want to address.
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl p-3" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 183, 77, 0.14)" }}>
                <label className="block text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: "#FFD49E" }}>
                  Search
                </label>
                <div className="mt-2 flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <input
                      ref={queryInputRef}
                      value={query}
                      onChange={(event) => updateSearch(event.target.value)}
                      placeholder="Search dosha, temple, ritual, or problem..."
                      className="w-full rounded-xl px-4 py-3 pr-12 text-[15px] font-semibold outline-none"
                      style={{
                        background: "rgba(10, 5, 2, 0.42)",
                        border: "1px solid rgba(255, 183, 77, 0.22)",
                        color: "#FFF8EB",
                      }}
                    />
                    <button
                      type="button"
                      onClick={startVoiceSearch}
                      disabled={!voiceSupported}
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition"
                      style={{
                        background: isListening
                          ? "linear-gradient(180deg, rgba(255, 87, 87, 0.95) 0%, rgba(190, 40, 40, 0.95) 100%)"
                          : "rgba(255, 255, 255, 0.04)",
                        color: voiceSupported ? (isListening ? "#ffffff" : "#ffedb3") : "rgba(255, 237, 179, 0.45)",
                        opacity: voiceSupported ? 1 : 0.7,
                        border: "1px solid rgba(255, 183, 77, 0.2)",
                      }}
                      title={
                        voiceSupported
                          ? isListening
                            ? "Stop voice search"
                            : "Search by voice"
                          : "Voice input not supported"
                      }
                      aria-label={
                        voiceSupported
                          ? isListening
                            ? "Stop voice search"
                            : "Search by voice"
                          : "Voice input not supported"
                      }
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                        <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0a7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.07A7 7 0 0 1 5 12a1 1 0 1 1 2 0a5 5 0 0 0 10 0Z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (query.trim()) {
                        setQuery(query.trim());
                      }
                      queryInputRef.current?.focus?.();
                    }}
                    className="shrink-0 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#FFF5E5]"
                    style={{
                      background: "linear-gradient(135deg, rgba(255, 186, 75, 0.24) 0%, rgba(255, 143, 41, 0.18) 100%)",
                      border: "1px solid rgba(255, 183, 77, 0.28)",
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {QUICK_SEARCHES.map((item) => (
                  <Pill key={item} onClick={() => updateSearch(item)}>{item}</Pill>
                ))}
              </div>

              <div>
                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: "#FFD49E" }}>
                  Categories
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Pill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>All</Pill>
                  {categories.map((category) => (
                    <Pill
                      key={category.id}
                      active={activeCategory === category.id}
                      onClick={() => setActiveCategory(category.id)}
                      title={category.description}
                    >
                      {category.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: "#FFD49E" }}>
                  Dosha Types
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Pill active={activeDoshaType === "all"} onClick={() => setActiveDoshaType("all")}>All Types</Pill>
                  {doshaTypes.map((doshaType) => (
                    <Pill
                      key={doshaType.id}
                      active={activeDoshaType === doshaType.id}
                      onClick={() => setActiveDoshaType(doshaType.id)}
                      title={doshaType.description}
                    >
                      {doshaType.label}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="mt-4 rounded-2xl p-4 text-sm font-semibold text-[#FFE0B6]" style={{ background: "rgba(78, 22, 18, 0.66)", border: "1px solid rgba(255, 120, 90, 0.28)" }}>
            {error}
          </section>
        ) : null}

        {loading ? (
          <section className="mt-4 rounded-2xl p-4 text-sm font-semibold text-[#FFE0B6]" style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 183, 77, 0.18)" }}>
            Loading local dosha parihara data...
          </section>
        ) : null}

        {!loading && !records.length ? (
          <section className="mt-4 rounded-2xl p-5 text-sm font-semibold text-[#FFE0B6]" style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 183, 77, 0.18)" }}>
            No temples match your search yet. Try a broader keyword or clear the category filter.
          </section>
        ) : null}

        <section className="mt-4 grid gap-3">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </section>
      </div>
    </PageShell>
  );
}
