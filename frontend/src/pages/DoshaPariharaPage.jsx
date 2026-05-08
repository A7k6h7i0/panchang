import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "./PageShell";
import { DOSHA_PARIHARA_DATA_URL, normalizeDoshaPariharaDataset, normalizeText, recordMatchesFilters, scoreDoshaPariharaRecord } from "../utils/doshaParihara";
import { UiIcon } from "../components/UiIcons";
import { DOSHA_DROPDOWN_LABELS } from "../data/doshaDropdownOptions";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const VOICE_LANGUAGE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  ta: "ta-IN",
};

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

function normalizeDoshaQuery(value) {
  return normalizeText(value).replace(/\b(dosha|doshaa|dosh)\b/g, "").trim();
}

function buildDoshaIndex(doshaTypes) {
  const index = new Map();

  (doshaTypes || []).forEach((doshaType) => {
    const names = [doshaType?.label, ...(Array.isArray(doshaType?.aliases) ? doshaType.aliases : [])]
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
    names.forEach((name) => {
      const key = normalizeDoshaQuery(name);
      if (!key) return;
      if (!index.has(key)) index.set(key, doshaType);
    });
  });

  return index;
}

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const prev = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j < current.length; j += 1) prev[j] = current[j];
  }
  return prev[right.length];
}

function resolveDoshaQuery(query, doshaIndex) {
  const normalizedQuery = normalizeDoshaQuery(query);
  if (!normalizedQuery) return "";
  if (doshaIndex?.has(normalizedQuery)) {
    return doshaIndex.get(normalizedQuery)?.label || query;
  }

  const candidates = Array.from(doshaIndex?.keys() || []);
  let bestKey = "";
  let bestScore = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const distance = levenshteinDistance(normalizedQuery, candidate);
    const lengthGap = Math.abs(normalizedQuery.length - candidate.length);
    const score = distance + lengthGap * 0.15;
    if (score < bestScore) {
      bestScore = score;
      bestKey = candidate;
    }
  });

  if (bestKey && bestScore <= 2.5) {
    return doshaIndex.get(bestKey)?.label || query;
  }

  return query;
}

function sortDoshaChips(doshaTypes, query) {
  const normalizedQuery = normalizeDoshaQuery(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const queryLower = normalizeText(query);

  return [...(doshaTypes || [])].sort((a, b) => {
    const score = (value) => {
      const normalizedValue = normalizeDoshaQuery(value);
      if (!normalizedValue) return 0;
      let next = 0;
      if (normalizedValue === normalizedQuery) next += 6;
      if (normalizedValue.includes(normalizedQuery) || normalizedQuery.includes(normalizedValue)) next += 4;
      if (queryTokens.some((token) => normalizedValue.includes(token))) next += 2;
      if (queryLower && normalizedValue.includes(queryLower)) next += 1;
      return next;
    };

    const aScore = score(a);
    const bScore = score(b);
    if (aScore !== bScore) return bScore - aScore;
    return String(a || "").localeCompare(String(b || ""));
  });
}

function RecordCard({ record, query, doshaIndex, onSelect }) {
  const routeState = { record };
  const locationText = [record.location, record.district, record.state].filter(Boolean).join(" • ");
  const resolvedQuery = resolveDoshaQuery(query, doshaIndex);
  const orderedDoshas = sortDoshaChips(record.doshaTypes || [], resolvedQuery);
  const normalizedQuery = normalizeDoshaQuery(resolvedQuery);
  const matchedDoshaLabel = doshaIndex?.get(normalizedQuery)?.label || orderedDoshas.find((item) => normalizeDoshaQuery(item) === normalizedQuery) || "";
  const visibleDoshas = orderedDoshas.filter((item) => item !== matchedDoshaLabel).slice(0, 5);
  const hiddenDoshaCount = Math.max(0, orderedDoshas.length - visibleDoshas.length - (matchedDoshaLabel ? 1 : 0));

  return (
    <Link
      to={`/dosha-parihara/${encodeURIComponent(record.id)}`}
      state={routeState}
      onPointerDown={onSelect}
      onClick={onSelect}
      className="group block overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-0.5"
      style={{
        background: "transparent",
        border: "1.5px solid rgba(255, 183, 77, 0.4)",
        boxShadow: "0 0 10px rgba(212, 168, 71, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
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
                <div className="truncate text-sm font-bold text-amber-50 sm:text-[15px]">
                  {record.templeName}
                </div>
                <div className="mt-1 text-xs leading-5 text-amber-100/80">
                  {locationText || "Address not available"}
                </div>
              </div>
              <div
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 214, 102, 0.18) 0%, rgba(255, 164, 66, 0.28) 100%)",
                  border: "1.5px solid rgba(255, 196, 108, 0.34)",
                  color: "#FFE8C5",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <span aria-hidden="true">{"\u2605"}</span>
                <span>{record.state || "Temple"}</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {matchedDoshaLabel ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{
                    background: "rgba(255, 183, 77, 0.16)",
                    color: "#FFE8C5",
                    border: "1px solid rgba(255, 183, 77, 0.28)",
                  }}
                >
                  {matchedDoshaLabel}
                </span>
              ) : null}
              {visibleDoshas.map((item) => (
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
              {hiddenDoshaCount > 0 ? (
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    color: "#FFD39A",
                    border: "1px solid rgba(255, 183, 77, 0.18)",
                  }}
                >
                  +{hiddenDoshaCount} more
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-[12px] leading-5 text-amber-100/80 sm:grid-cols-2">
          <div>
            <span className="font-black uppercase tracking-[0.16em] text-amber-100">Ritual: </span>
            {record.ritualName || "Not listed"}
          </div>
          <div>
            <span className="font-black uppercase tracking-[0.16em] text-amber-100">Speciality: </span>
            {record.speciality || "Not listed"}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100 sm:text-[11px]">
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

function DoshaTypeDropdown({ options, value, onChange, placeholderLabel }) {
  const [open, setOpen] = useState(false);
  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) || null,
    [options, value]
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold outline-none transition hover:scale-[1.01]"
        style={{
          background: "transparent",
          border: "1.5px solid rgba(255, 183, 77, 0.4)",
          boxShadow: "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          color: "#FFE8C5",
          colorScheme: "dark",
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open dosha type selector"
      >
        <span className="truncate">{selectedOption?.label || placeholderLabel || "All Types"}</span>
        <UiIcon name="chevronDown" size={16} color="#FFD49E" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[1010] bg-black/65 backdrop-blur-sm"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            className="flex h-[100dvh] w-screen flex-col"
            style={{
              background: "rgba(212, 168, 71, 0.12)",
              border: "1px solid rgba(255, 220, 120, 0.18)",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
            }}
            onPointerDownCapture={(event) => event.stopPropagation()}
            onTouchStartCapture={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-amber-300/12 px-4 py-4 sm:px-6">
              <h3 className="text-base font-black text-amber-100 sm:text-lg">Select Dosha Type</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-100"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255, 183, 77, 0.45)",
                }}
              >
                Close
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
              }}
            >
              {options.map((option) => {
                const isActive = option.id === value;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className={`mb-3 block w-full rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-all duration-200 ${
                      isActive ? "bg-amber-300/15 text-white" : "bg-transparent text-amber-100 hover:bg-amber-300/10"
                    }`}
                    style={{
                      border: "1px solid rgba(255, 183, 77, 0.22)",
                      boxShadow: isActive ? "inset 0 0 0 1px rgba(255, 220, 150, 0.2)" : "none",
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="block break-words whitespace-normal leading-5">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function DoshaPariharaPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataset, setDataset] = useState({ doshaTypes: [], records: [] });
  const [query, setQuery] = useState("");
  const [activeDoshaType, setActiveDoshaType] = useState("all");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  const doshaTypes = useMemo(() => dataset.doshaTypes || [], [dataset.doshaTypes]);
  const doshaIndex = useMemo(() => buildDoshaIndex(doshaTypes), [doshaTypes]);
  const resolvedQuery = useMemo(() => resolveDoshaQuery(query, doshaIndex), [doshaIndex, query]);
  const suggestedDoshaLabel = useMemo(() => {
    const cleanedQuery = normalizeDoshaQuery(query);
    const cleanedResolved = normalizeDoshaQuery(resolvedQuery);
    if (!cleanedQuery || !cleanedResolved || cleanedQuery === cleanedResolved) {
      return "";
    }
    return resolvedQuery;
  }, [query, resolvedQuery]);
  const doshaTypeOptions = useMemo(
    () => [
      { id: "all", label: t.allTypes || "All Types" },
      ...DOSHA_DROPDOWN_LABELS.map((label) => ({ id: label, label })),
    ],
    [t.allTypes]
  );
  const liveQuery = normalizeText(query);
  const commitSearch = useCallback(() => {
    const nextQuery = query.trim();
    if (nextQuery !== query) {
      setQuery(nextQuery);
    }
    queryInputRef.current?.blur?.();
  }, [query]);
  const dismissKeyboard = useCallback(() => {
    queryInputRef.current?.blur?.();
  }, []);

  const records = useMemo(() => {
    const filtered = (dataset.records || []).filter((record) =>
      recordMatchesFilters(record, {
        query: normalizeText(resolvedQuery),
        doshaTypeId: activeDoshaType,
      })
    );

    return [...filtered].sort((a, b) => {
      const scoreDiff = scoreDoshaPariharaRecord(b, normalizeText(resolvedQuery)) - scoreDoshaPariharaRecord(a, normalizeText(resolvedQuery));
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.templeName || "").localeCompare(String(b.templeName || ""));
    });
  }, [activeDoshaType, dataset.records, resolvedQuery]);

  const searchSuggestions = useMemo(() => {
    if (!resolvedQuery) return [];

    const filtered = (dataset.records || []).filter((record) =>
      recordMatchesFilters(record, {
        query: normalizeText(resolvedQuery),
        doshaTypeId: activeDoshaType,
      })
    );

    return filtered
      .slice()
      .sort((a, b) => {
        const scoreDiff = scoreDoshaPariharaRecord(b, normalizeText(resolvedQuery)) - scoreDoshaPariharaRecord(a, normalizeText(resolvedQuery));
        if (scoreDiff !== 0) return scoreDiff;
        return String(a.templeName || "").localeCompare(String(b.templeName || ""));
      })
      .slice(0, 6);
  }, [activeDoshaType, dataset.records, resolvedQuery]);

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

  const hasSearchQuery = query.trim().length > 0;

  return (
    <PageShell title={t.doshaParihara || "Dosha Parihara"} transparent>
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <input
                ref={queryInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  commitSearch();
                }}
                placeholder="Search dosha, temple, ritual, or problem..."
                className="w-full rounded-xl px-4 py-3 pr-12 text-[15px] font-semibold outline-none"
                style={{
                  background: "rgba(212, 168, 71, 0.18)",
                  border: "1px solid rgba(255, 183, 77, 0.22)",
                  color: "#FFE8C5",
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
              {!hasSearchQuery && searchSuggestions.length ? (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl"
                  style={{
                    background: "rgba(40, 18, 6, 0.88)",
                    border: "1.5px solid rgba(255, 183, 77, 0.34)",
                    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.28)",
                  }}
                >
                  <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-100">
                    Suggestions
                  </div>
                  <div className="max-h-72 overflow-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                    {searchSuggestions.map((record) => (
                      <Link
                        key={record.id}
                        to={`/dosha-parihara/${encodeURIComponent(record.id)}`}
                        state={{ record }}
                        onPointerDown={dismissKeyboard}
                        onClick={() => {
                          dismissKeyboard();
                          setQuery(record.templeName || "");
                        }}
                        className="block border-t border-amber-300/10 px-4 py-3 text-left transition hover:bg-amber-300/10"
                      >
                        <div className="text-sm font-bold text-amber-50">{record.templeName}</div>
                        <div className="mt-1 text-xs leading-5 text-amber-100/80">
                          {[record.location, record.district, record.state].filter(Boolean).join(" â€¢ ")}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sortDoshaChips(record.doshaTypes || [], liveQuery).slice(0, 4).map((item) => (
                            <span
                              key={item}
                              className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]"
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                                color: "#FFE4B5",
                                border: "1px solid rgba(255, 183, 77, 0.14)",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {suggestedDoshaLabel ? (
            <div className="mt-2 text-xs font-semibold text-amber-100/80">
              Did you mean{" "}
              <button
                type="button"
                onClick={() => {
                  setQuery(suggestedDoshaLabel);
                  dismissKeyboard();
                }}
                className="font-black text-amber-50 underline decoration-amber-200/60 decoration-2 underline-offset-4 transition hover:text-amber-100"
              >
                {suggestedDoshaLabel}
              </button>
              ?
            </div>
          ) : null}

          <div className="mt-2">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
              {t.doshaTypes || "Dosha Types"}
            </div>
            <DoshaTypeDropdown
              options={doshaTypeOptions}
              value={activeDoshaType}
              onChange={setActiveDoshaType}
              placeholderLabel={t.allTypes || "All Types"}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-none px-4 pb-8 sm:px-6 lg:px-8">
        {hasSearchQuery ? (
          <>
            {error ? (
              <section
                className="mt-4 rounded-2xl p-4 text-sm font-semibold text-amber-100/80"
                style={{ background: "transparent", border: "1px solid rgba(255, 120, 90, 0.28)" }}
              >
                {error}
              </section>
            ) : null}

            {loading ? (
              <section
                className="mt-4 rounded-2xl p-4 text-sm font-semibold text-amber-100/80"
                style={{ background: "transparent", border: "1px solid rgba(255, 183, 77, 0.18)" }}
              >
                Loading local dosha parihara data...
              </section>
            ) : null}

            {!loading && !records.length ? (
              <section
                className="mt-4 rounded-2xl p-5 text-sm font-semibold text-amber-100/80"
                style={{ background: "transparent", border: "1px solid rgba(255, 183, 77, 0.18)" }}
              >
                No temples match your search yet. Try a broader keyword or clear the dosha type filter.
              </section>
            ) : null}

            <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  query={query}
                  doshaIndex={doshaIndex}
                  onSelect={dismissKeyboard}
                />
              ))}
            </section>
          </>
        ) : (
          <>
            {error ? (
              <section
                className="mt-4 rounded-2xl p-4 text-sm font-semibold text-amber-100/80"
                style={{ background: "transparent", border: "1px solid rgba(255, 120, 90, 0.28)" }}
              >
                {error}
              </section>
            ) : null}

            {loading ? (
              <section
                className="mt-4 rounded-2xl p-4 text-sm font-semibold text-amber-100/80"
                style={{ background: "transparent", border: "1px solid rgba(255, 183, 77, 0.18)" }}
              >
                Loading local dosha parihara data...
              </section>
            ) : null}

            {!loading && !records.length ? (
              <section
                className="mt-4 rounded-2xl p-5 text-sm font-semibold text-amber-100/80"
                style={{ background: "transparent", border: "1px solid rgba(255, 183, 77, 0.18)" }}
              >
                No temples match your search yet. Try a broader keyword or clear the dosha type filter.
              </section>
            ) : null}

            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  query={query}
                  doshaIndex={doshaIndex}
                  onSelect={dismissKeyboard}
                />
              ))}
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
