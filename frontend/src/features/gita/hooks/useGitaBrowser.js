import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import {
  explainSloka,
  getDailySloka,
  getGitaChapter,
  getGitaIndex,
  getRecommendations,
  searchSlokas,
} from "../utils/gitaApi";
import {
  loadCachedGitaExplanation,
  loadCachedGitaSnapshot,
  saveCachedGitaExplanation,
  saveCachedGitaSnapshot,
} from "../utils/gitaCache";
import { isBookmarked as isVerseBookmarked, loadBookmarks, toggleBookmark } from "../utils/gitaBookmarks";

const SUPPORTED_EXPLANATION_LANGUAGES = new Set(["en", "te", "hi", "ta", "kn", "ml"]);
const RAHUKALAM_WINDOWS = {
  0: ["16:30", "18:00"],
  1: ["07:30", "09:00"],
  2: ["15:00", "16:30"],
  3: ["12:00", "13:30"],
  4: ["13:30", "15:00"],
  5: ["10:30", "12:00"],
  6: ["09:00", "10:30"],
};

function parseClock(time) {
  const match = String(time || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { hour: 12, minute: 0, minutes: 12 * 60 };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return { hour, minute, minutes: hour * 60 + minute };
}

function isWithinWindow(minutes, window) {
  if (!window || window.length !== 2) return false;
  const start = parseClock(window[0]).minutes;
  const end = parseClock(window[1]).minutes;
  return minutes >= start && minutes < end;
}

function detectMode(date, time) {
  const parsedTime = parseClock(time);
  const day = new Date(`${date || new Date().toISOString().slice(0, 10)}T12:00:00Z`);
  const weekday = Number.isFinite(day.getUTCDay()) ? day.getUTCDay() : 0;

  if (isWithinWindow(parsedTime.minutes, RAHUKALAM_WINDOWS[weekday])) {
    return "rahukalam";
  }

  if (parsedTime.hour < 12) return "morning";
  if (parsedTime.hour < 17) return "afternoon";
  return "evening";
}

export function useGitaBrowser({ defaultExplainLanguage = "te" } = {}) {
  const [isPending, startTransition] = useTransition();
  const cachedSnapshot = useMemo(() => loadCachedGitaSnapshot() || {}, []);
  const [index, setIndex] = useState(cachedSnapshot.index || null);
  const [daily, setDaily] = useState(cachedSnapshot.daily || null);
  const [recommendations, setRecommendations] = useState(Array.isArray(cachedSnapshot.recommendations) ? cachedSnapshot.recommendations : []);
  const [selectedChapter, setSelectedChapter] = useState(cachedSnapshot.selectedChapter || null);
  const [selectedVerse, setSelectedVerse] = useState(cachedSnapshot.selectedVerse || null);
  const [chapterPayload, setChapterPayload] = useState(cachedSnapshot.chapterPayload || null);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [mood, setMood] = useState(() => String(cachedSnapshot.mood || "calm").toLowerCase());
  const [currentMode, setCurrentMode] = useState(() => {
    const now = new Date();
    return detectMode(now.toISOString().slice(0, 10), now.toTimeString().slice(0, 5));
  });
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks());
  const [explanation, setExplanation] = useState("");
  const [explainLanguage, setExplainLanguage] = useState(() => {
    const cachedLanguage = String(cachedSnapshot.explainLanguage || "").trim().toLowerCase();
    return SUPPORTED_EXPLANATION_LANGUAGES.has(cachedLanguage)
      ? cachedLanguage
      : String(defaultExplainLanguage || "te").trim().toLowerCase() || "te";
  });
  const [explainLoading, setExplainLoading] = useState(false);
  const EXPLAINING_MESSAGE = "Generating explanation...";
  const [loading, setLoading] = useState({
    index: !cachedSnapshot.index,
    daily: !cachedSnapshot.daily,
    chapter: false,
    search: false,
    recommendations: !Array.isArray(cachedSnapshot.recommendations) || cachedSnapshot.recommendations.length === 0,
  });
  const [error, setError] = useState("");

  const chapters = useMemo(() => index?.chapters || [], [index]);

  useEffect(() => {
    const updateMode = () => {
      const now = new Date();
      setCurrentMode(detectMode(now.toISOString().slice(0, 10), now.toTimeString().slice(0, 5)));
    };

    updateMode();
    const id = window.setInterval(updateMode, 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const selectedVersePayload = useMemo(() => {
    if (!selectedVerse) return null;
    if (selectedVerse?.verse) return selectedVerse;
    if (chapterPayload?.verses?.length) {
      return chapterPayload.verses.find((verse) => verse.verse === selectedVerse) || null;
    }
    return null;
  }, [chapterPayload?.verses, selectedVerse]);

  useEffect(() => {
    let active = true;
    getGitaIndex()
      .then((indexData) => {
        if (!active) return;
        setIndex(indexData);
        saveCachedGitaSnapshot({ index: indexData });
        setLoading((prev) => ({ ...prev, index: false }));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Failed to load Gita data");
        setLoading((prev) => ({ ...prev, index: false }));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    const mode = currentMode;

    saveCachedGitaSnapshot({ mood, mode });
    setLoading((prev) => ({ ...prev, daily: true, recommendations: true }));
    Promise.all([
      getDailySloka({ date, time, mood, mode }),
      getRecommendations({ date, time, mood, mode, count: 1 }),
    ])
      .then(([dailyData, recommendationData]) => {
        if (!active) return;
        setDaily(dailyData);
        const nextRecommendations = Array.isArray(recommendationData) ? recommendationData : [];
        setRecommendations(nextRecommendations);
        const moodVerse = nextRecommendations?.[0]?.verse || dailyData?.verse || null;
        if (moodVerse) {
          setSelectedChapter(Number(moodVerse.chapter));
          setSelectedVerse(moodVerse);
        }
        saveCachedGitaSnapshot({
          daily: dailyData,
          recommendations: nextRecommendations,
          ...(moodVerse
            ? {
                selectedChapter: Number(moodVerse.chapter),
                selectedVerse: moodVerse,
              }
            : {}),
        });
        setLoading((prev) => ({ ...prev, daily: false, recommendations: false }));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Failed to load daily Gita data");
        setLoading((prev) => ({ ...prev, daily: false, recommendations: false }));
      });
    return () => {
      active = false;
    };
  }, [mood, currentMode]);

  useEffect(() => {
    if (!selectedChapter) return;
    let active = true;
    setLoading((prev) => ({ ...prev, chapter: true }));
    getGitaChapter(selectedChapter)
      .then((payload) => {
        if (!active) return;
        setChapterPayload(payload);
        saveCachedGitaSnapshot({ chapterPayload: payload });
        setLoading((prev) => ({ ...prev, chapter: false }));
        setSelectedVerse((current) => {
          if (current && Number(current.chapter) === Number(selectedChapter)) return current;
          return payload?.verses?.length ? payload.verses[0] : null;
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Failed to load chapter");
        setLoading((prev) => ({ ...prev, chapter: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedChapter]);

  useEffect(() => {
    const query = String(deferredQuery || "").trim();
    if (!query) {
      setSearchResults([]);
      setLoading((prev) => ({ ...prev, search: false }));
      return;
    }

    let active = true;
    setLoading((prev) => ({ ...prev, search: true }));
    searchSlokas(query)
      .then((payload) => {
        if (!active) return;
        setSearchResults(Array.isArray(payload) ? payload : []);
        setLoading((prev) => ({ ...prev, search: false }));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Search failed");
        setSearchResults([]);
        setLoading((prev) => ({ ...prev, search: false }));
      });

    return () => {
      active = false;
    };
  }, [deferredQuery]);

  const selectedVerseInfo = selectedVersePayload || selectedVerse || daily?.verse || null;

  const chapterMeta = useMemo(() => {
    if (!selectedChapter) return null;
    const fromIndex = chapters.find((chapter) => Number(chapter.chapter) === Number(selectedChapter));
    return fromIndex || chapterPayload?.meta || null;
  }, [chapters, chapterPayload?.meta, selectedChapter]);

  const handleSelectChapter = (chapterNumber) => {
    startTransition(() => {
      setSelectedChapter(Number(chapterNumber));
      setSelectedVerse(null);
      setSearchQuery("");
      setSearchResults([]);
      setExplanation("");
      saveCachedGitaSnapshot({ selectedChapter: Number(chapterNumber) });
    });
  };

  const handleSelectVerse = (verse) => {
    startTransition(() => {
      setSelectedVerse(verse);
      setExplanation("");
      saveCachedGitaSnapshot({ selectedVerse: verse });
    });
  };

  const handleExplainLanguageChange = (nextLanguage) => {
    const normalized = String(nextLanguage || "").trim().toLowerCase();
    const resolved = SUPPORTED_EXPLANATION_LANGUAGES.has(normalized) ? normalized : "te";
    setExplainLanguage(resolved);
    setExplanation("");
    saveCachedGitaSnapshot({ explainLanguage: resolved });
  };

  const handleBookmark = (verse) => {
    setBookmarks((prev) => toggleBookmark(verse, prev));
  };

  const handleExplain = async (verse, requestedLanguage = explainLanguage) => {
    if (!verse) return;
    const normalized = String(requestedLanguage || "").trim().toLowerCase();
    const language = SUPPORTED_EXPLANATION_LANGUAGES.has(normalized) ? normalized : "te";

    const cachedExplanation = loadCachedGitaExplanation(verse, mood, language);
    if (cachedExplanation) {
      setExplainLoading(false);
      setExplanation(cachedExplanation);
      return cachedExplanation;
    }

    setExplainLoading(true);
    setExplanation("");

    if (typeof window !== "undefined") {
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
    }

    try {
      const payload = await explainSloka({ verse, mood, language });
      const text = payload?.explanation || "";
      saveCachedGitaExplanation(verse, mood, language, text);
      setExplanation(text);
      return text;
    } catch (err) {
      const text = err?.message || "Failed to explain this verse.";
      setExplanation(text);
      return text;
    } finally {
      setExplainLoading(false);
    }
  };

  const activeVerse = selectedVerseInfo;
  const bookmarked = activeVerse ? isVerseBookmarked(activeVerse, bookmarks) : false;

  return {
    index,
    chapters,
    daily,
    recommendations,
    chapterPayload,
    chapterMeta,
    selectedChapter,
    selectedVerse: activeVerse,
    selectedVersePayload: activeVerse,
    searchQuery,
    setSearchQuery,
    searchResults,
    mood,
    setMood,
    setMoodAndSuggest: (nextMood) => setMood(nextMood),
    bookmarks,
    setBookmarks,
    bookmarked,
    explanation,
    explainLanguage,
    setExplainLanguage: handleExplainLanguageChange,
    explainLoading,
    loading,
    error,
    isPending,
    handleSelectChapter,
    handleSelectVerse,
    handleBookmark,
    handleExplain,
    currentMode,
  };
}
