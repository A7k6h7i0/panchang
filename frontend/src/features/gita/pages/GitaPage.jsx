import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../pages/PageShell";
import { useLanguage } from "../../../hooks/useLanguage";
import { languages, translations } from "../../../translations";
import { toggleBookmark } from "../utils/gitaBookmarks";
import { useGitaBrowser } from "../hooks/useGitaBrowser";
import DailySlokaCard from "../components/DailySlokaCard";
import ChapterList from "../components/ChapterList";
import SlokaList from "../components/SlokaList";
import SlokaDetail from "../components/SlokaDetail";
import RecommendationPanel from "../components/RecommendationPanel";

function getVerseBookmarkId(verse) {
  if (!verse) return "";
  return String(verse.id || `BG${verse.chapter}.${verse.verse}`);
}

export default function GitaPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const {
    chapters,
    daily,
    recommendations,
    chapterPayload,
    chapterMeta,
    selectedChapter,
    selectedVerse,
    mood,
    setMood,
    bookmarks,
    setBookmarks,
    bookmarked,
    explanation,
    explainLanguage,
    setExplainLanguage,
    explainLoading,
    loading,
    error,
    currentMode,
    handleSelectChapter,
    handleSelectVerse,
    handleBookmark,
    handleExplain,
  } = useGitaBrowser({ defaultExplainLanguage: language });
  const [showChapters, setShowChapters] = useState(false);
  const [showSlokas, setShowSlokas] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateDesktopState = () => setIsDesktop(mediaQuery.matches);

    updateDesktopState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateDesktopState);
      return () => mediaQuery.removeEventListener("change", updateDesktopState);
    }

    mediaQuery.addListener(updateDesktopState);
    return () => mediaQuery.removeListener(updateDesktopState);
  }, []);

  const activeChapter = useMemo(() => {
    if (!selectedChapter) return null;
    return chapters.find((chapter) => Number(chapter.chapter) === Number(selectedChapter)) || chapterMeta;
  }, [chapters, chapterMeta, selectedChapter]);
  const dailyBookmarked = bookmarks.some((item) => String(item?.id) === getVerseBookmarkId(daily?.verse));
  const showChaptersPanel = isDesktop || showChapters;
  const showSlokasPanel = isDesktop || showSlokas;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!notificationsEnabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const dailyKey = `gita:notified:${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(dailyKey)) return;
    if (!daily?.verse) return;

    localStorage.setItem(dailyKey, "1");
    new Notification("Your Gita Sloka of the Day is Ready", {
      body: `Bhagavad Gita ${daily.verse.chapter}.${daily.verse.verse}`,
    });
  }, [daily, notificationsEnabled]);

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  const handleBookmarkToggle = (verse) => {
    setBookmarks((prev) => toggleBookmark(verse, prev));
  };

  return (
    <PageShell title={t.bhagavad_gita || "Bhagavad Gita"} transparent>
      <div className="mx-auto w-full max-w-7xl">
        <div
          className="rounded-3xl p-4"
          style={{
            background: "transparent",
            border: "1.5px solid rgba(255, 183, 77, 0.4)",
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
                {t.dailyGitaPanchangInsight || "Daily Gita + Panchang Insight"}
              </div>
              <h1 className="mt-1 text-2xl font-black text-amber-50">
                {t.bhagavad_gita || "Bhagavad Gita"}
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
              <button
                type="button"
                onClick={requestNotifications}
                className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
              >
                {t.enable_notifications || "Enable Notifications"}
              </button>
              <Link
                to="/gita/bookmarks"
                className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
              >
                {t.viewBookmarks || "View Bookmarks"}
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <DailySlokaCard
              daily={daily}
              language={language}
              explainLanguage={explainLanguage}
              explainLanguageOptions={languages.filter((item) => ["en", "te", "hi", "ta", "kn", "ml"].includes(item.code))}
              onExplainLanguageChange={setExplainLanguage}
              bookmarked={dailyBookmarked}
              onBookmark={handleBookmarkToggle}
              onExplain={handleExplain}
              explanation={explanation}
              explainLoading={explainLoading}
              currentMode={currentMode}
            />
          </div>

          <div className="mt-4">
            <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setShowChapters((prev) => !prev)}
                className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
              >
                {showChapters ? "Hide Chapters" : "Show All Chapters"}
              </button>
              <button
                type="button"
                onClick={() => setShowSlokas((prev) => !prev)}
                className="rounded-xl border border-amber-300/40 bg-transparent px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-white/10"
              >
                {showSlokas ? "Hide Slokas" : "Show All Slokas"}
              </button>
            </div>
            {loading.index || loading.chapter || loading.recommendations ? (
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/70">
                Loading Gita content...
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-transparent p-3 text-sm font-semibold text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1fr_1.08fr]">
            {showChaptersPanel ? (
              <ChapterList
                chapters={chapters}
                selectedChapter={selectedChapter}
                onSelect={handleSelectChapter}
              />
            ) : null}

            <div className="grid gap-4">
              {showSlokasPanel ? (
                <SlokaList
                  verses={chapterPayload?.verses || []}
                  selectedVerseId={selectedVerse?.id}
                  onSelect={(verse) => {
                    if (verse?.chapter) handleSelectChapter(verse.chapter);
                    handleSelectVerse(verse);
                  }}
                />
              ) : null}

              <RecommendationPanel
                recommendations={recommendations}
                mood={mood}
                onMoodChange={setMood}
                onSelect={(verse) => {
                  if (verse?.chapter) handleSelectChapter(verse.chapter);
                  handleSelectVerse(verse);
                }}
              />
            </div>

            <div className="lg:sticky lg:top-4">
              <SlokaDetail
                verse={selectedVerse}
                chapter={activeChapter}
                language={language}
                bookmarked={bookmarked}
                onBookmark={handleBookmark}
              />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
