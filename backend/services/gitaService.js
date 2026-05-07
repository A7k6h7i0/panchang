import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_ROOT = path.join(__dirname, "..", "data", "gita");

const CHAPTER_THEME_MAP = {
  1: ["fear", "mind"],
  2: ["karma", "mind", "success"],
  3: ["karma", "success"],
  4: ["karma", "success"],
  5: ["mind", "karma"],
  6: ["mind", "fear"],
  7: ["success", "mind"],
  8: ["fear", "success"],
  9: ["karma", "success"],
  10: ["success"],
  11: ["fear", "success"],
  12: ["mind", "devotion"],
  13: ["mind"],
  14: ["mind", "fear"],
  15: ["mind"],
  16: ["fear", "success"],
  17: ["mind", "karma"],
  18: ["karma", "success", "fear"],
};

const MOOD_THEME_MAP = {
  calm: ["mind", "devotion"],
  stressed: ["mind", "fear"],
  anxious: ["fear", "mind"],
  fearful: ["fear", "mind"],
  confused: ["mind", "fear"],
  angry: ["karma", "mind"],
  motivated: ["karma", "success"],
  focused: ["mind", "karma"],
  tired: ["mind", "devotion"],
  sad: ["mind", "devotion"],
  brave: ["success", "fear"],
};

const MOOD_CHAPTER_MAP = {
  calm: [12, 6, 2],
  stressed: [6, 12, 2],
  anxious: [6, 2, 18],
  fearful: [2, 11, 18],
  confused: [2, 6, 18],
  angry: [3, 2, 18],
  motivated: [2, 3, 18],
  focused: [3, 18, 6],
  tired: [12, 18, 6],
  sad: [12, 6, 2],
  brave: [2, 11, 18],
};

const RAHUKALAM_WINDOWS = {
  0: ["16:30", "18:00"],
  1: ["07:30", "09:00"],
  2: ["15:00", "16:30"],
  3: ["12:00", "13:30"],
  4: ["13:30", "15:00"],
  5: ["10:30", "12:00"],
  6: ["09:00", "10:30"],
};

let datasetPromise = null;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(value) {
  return normalizeText(value).toLowerCase();
}

function uniqueTags(tags) {
  return [...new Set((tags || []).filter(Boolean))];
}

function hashString(...parts) {
  let h = 2166136261;
  for (const part of parts) {
    const text = String(part ?? "");
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
  }
  return Math.abs(h >>> 0);
}

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

function themeSetForMode(mode, mood) {
  const base = {
    morning: ["success", "mind", "karma"],
    rahukalam: ["karma", "fear", "mind"],
    afternoon: ["karma", "success", "mind"],
    evening: ["mind", "devotion", "success"],
  }[mode] || ["mind", "karma", "success"];

  const moodThemes = MOOD_THEME_MAP[String(mood || "").toLowerCase()] || [];
  return uniqueTags([...base, ...moodThemes]);
}

function scoreVerse(verse, themes, mode, mood, seed) {
  const tags = verse.tags || [];
  const chapterThemes = CHAPTER_THEME_MAP[Number(verse.chapter)] || [];
  const targetThemes = themeSetForMode(mode, mood);
  let score = 0;

  for (const theme of targetThemes) {
    if (tags.includes(theme)) score += 6;
    if (chapterThemes.includes(theme)) score += 3;
  }

  if (mode === "morning" && [2, 3, 6, 12, 18].includes(Number(verse.chapter))) score += 4;
  if (mode === "rahukalam" && [2, 3, 16, 18].includes(Number(verse.chapter))) score += 5;
  if (mood && normalizeSearchText(verse.meaning).includes(normalizeSearchText(mood))) score += 3;
  if (mood && (MOOD_CHAPTER_MAP[String(mood).toLowerCase()] || []).includes(Number(verse.chapter))) score += 12;

  const hashBias = hashString(seed, verse.id) % 17;
  return score * 100 + hashBias;
}

function compactVerse(verse) {
  return {
    id: verse.id,
    chapter: Number(verse.chapter),
    verse: Number(verse.verse),
    speaker: normalizeText(verse.speaker),
    slok: normalizeText(verse.slok),
    transliteration: normalizeText(verse.transliteration),
    meaning: normalizeText(verse.meaning),
    tags: uniqueTags(verse.tags || []),
  };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function loadDataset() {
  if (datasetPromise) return datasetPromise;

  datasetPromise = (async () => {
    const index = await readJson(path.join(DATA_ROOT, "index.json"));
    const chaptersDir = path.join(DATA_ROOT, "chapters");
    const chapterEntries = (await Promise.all(
      (index?.chapters || []).map(async (entry) => {
        const chapterNumber = Number(entry?.chapter);
        if (!Number.isFinite(chapterNumber)) return null;
        const chapterFile = path.join(chaptersDir, `${chapterNumber}.json`);
        const payload = await readJson(chapterFile);
        const meta = payload?.meta || entry;
        const verses = Array.isArray(payload?.verses) ? payload.verses.map(compactVerse) : [];
        return {
          chapter: chapterNumber,
          meta: {
            chapter_number: Number(meta?.chapter_number || chapterNumber),
            verses_count: Number(meta?.verses_count || verses.length),
            name: normalizeText(meta?.name),
            translation: normalizeText(meta?.translation),
            transliteration: normalizeText(meta?.transliteration),
            meaning: meta?.meaning || {},
            summary: meta?.summary || {},
            themes: uniqueTags(meta?.themes || []),
          },
          verses,
        };
      })
    )).filter(Boolean);

    chapterEntries.sort((a, b) => a.chapter - b.chapter);

    const allVerses = chapterEntries.flatMap((chapter) =>
      chapter.verses.map((verse) => ({
        ...verse,
        chapterTitle: chapter.meta.name,
        chapterThemes: chapter.meta.themes,
        searchText: normalizeSearchText(
          [
            verse.id,
            verse.speaker,
            verse.slok,
            verse.transliteration,
            verse.meaning,
            chapter.meta.name,
            chapter.meta.translation,
            chapter.meta.transliteration,
            chapter.meta.summary?.en,
            chapter.meta.summary?.hi,
            ...(verse.tags || []),
          ].join(" ")
        ),
      }))
    );

    const chapterMap = new Map(chapterEntries.map((chapter) => [chapter.chapter, chapter]));
    const verseMap = new Map(allVerses.map((verse) => [`${verse.chapter}:${verse.verse}`, verse]));

    return {
      generatedAt: index?.generatedAt || null,
      chapters: chapterEntries,
      chapterMap,
      allVerses,
      verseMap,
    };
  })();

  return datasetPromise;
}

export async function warmGitaDataset() {
  return loadDataset();
}

export async function getGitaIndex() {
  const dataset = await loadDataset();
  return {
    generatedAt: dataset.generatedAt,
    chapters: dataset.chapters.map((chapter) => ({
      chapter: chapter.chapter,
      verses_count: chapter.meta.verses_count,
      name: chapter.meta.name,
      translation: chapter.meta.translation,
      transliteration: chapter.meta.transliteration,
      meaning: chapter.meta.meaning,
      summary: chapter.meta.summary,
      themes: chapter.meta.themes,
    })),
  };
}

export async function getGitaChapters() {
  const dataset = await loadDataset();
  return dataset.chapters;
}

export async function getGitaChapter(chapterNumber) {
  const dataset = await loadDataset();
  const chapter = dataset.chapterMap.get(Number(chapterNumber));
  if (!chapter) return null;
  return chapter;
}

export async function getGitaVerse(chapterNumber, verseNumber) {
  const dataset = await loadDataset();
  return dataset.verseMap.get(`${Number(chapterNumber)}:${Number(verseNumber)}`) || null;
}

export async function searchGitaVerses(query) {
  const dataset = await loadDataset();
  const q = normalizeSearchText(query);
  if (!q) return [];

  const tokens = q.split(" ").filter(Boolean);
  const ranked = dataset.allVerses
    .filter((verse) => tokens.every((token) => verse.searchText.includes(token)))
    .map((verse) => ({
      ...verse,
      score: tokens.reduce((score, token) => score + (verse.searchText.includes(token) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || a.chapter - b.chapter || a.verse - b.verse);

  return ranked.slice(0, 50).map(({ score, searchText, ...verse }) => verse);
}

function chooseVersePool(dataset, mode, mood) {
  const themes = themeSetForMode(mode, mood);
  return dataset.allVerses.filter((verse) => {
    const tags = verse.tags || [];
    const chapterThemes = CHAPTER_THEME_MAP[Number(verse.chapter)] || [];
    return themes.some((theme) => tags.includes(theme) || chapterThemes.includes(theme));
  });
}

function pickVerse(dataset, { date, time, mood, mode }) {
  const resolvedMode = mode || detectMode(date, time);
  const pool = chooseVersePool(dataset, resolvedMode, mood);
  const filteredPool = pool.length > 0 ? pool : dataset.allVerses;
  const seed = `${date || ""}|${time || ""}|${resolvedMode}|${mood || ""}`;
  const scored = filteredPool
    .map((verse) => ({
      verse,
      score: scoreVerse(verse, themeSetForMode(resolvedMode, mood), resolvedMode, mood, seed),
    }))
    .sort((a, b) => b.score - a.score || a.verse.chapter - b.verse.chapter || a.verse.verse - b.verse.verse);

  const selected = scored[0]?.verse || filteredPool[0] || null;
  const alternatives = scored.slice(1, 5).map((item) => item.verse);
  return {
    mode: resolvedMode,
    selected,
    alternatives,
  };
}

function getModeReason(mode) {
  if (mode === "rahukalam") return "Rahukalam window detected, so the selection leans toward karma and caution.";
  if (mode === "morning") return "Morning selection favors motivation, discipline, and a clear start.";
  if (mode === "afternoon") return "Afternoon selection favors steady action and balanced karma.";
  return "Evening selection favors reflection, calmness, and surrender.";
}

export async function getDailyGita({ date, time, mood, mode }) {
  const dataset = await loadDataset();
  const result = pickVerse(dataset, { date, time, mood, mode });
  if (!result.selected) return null;

  const chapter = dataset.chapterMap.get(Number(result.selected.chapter)) || null;
  return {
    date: date || null,
    time: time || null,
    mood: mood || null,
    mode: result.mode,
    reason: getModeReason(result.mode),
    chapter: chapter
      ? {
          chapter: chapter.chapter,
          verses_count: chapter.meta.verses_count,
          name: chapter.meta.name,
          translation: chapter.meta.translation,
          transliteration: chapter.meta.transliteration,
          meaning: chapter.meta.meaning,
          summary: chapter.meta.summary,
          themes: chapter.meta.themes,
        }
      : null,
    verse: result.selected,
    alternatives: result.alternatives,
  };
}

export async function getRecommendations({ date, time, mood, count = 5 }) {
  const dataset = await loadDataset();
  const mode = detectMode(date, time);
  const themes = themeSetForMode(mode, mood);
  const seed = `${date || ""}|${time || ""}|${mode}|${mood || ""}`;
  const ranked = dataset.allVerses
    .map((verse) => ({
      verse,
      score: scoreVerse(verse, themes, mode, mood, seed),
    }))
    .sort((a, b) => b.score - a.score || a.verse.chapter - b.verse.chapter || a.verse.verse - b.verse.verse)
    .slice(0, Math.max(1, Number(count) || 5));

  return ranked.map(({ verse }) => {
    const chapter = dataset.chapterMap.get(Number(verse.chapter)) || null;
    return {
      chapter: chapter
        ? {
            chapter: chapter.chapter,
            name: chapter.meta.name,
            translation: chapter.meta.translation,
            transliteration: chapter.meta.transliteration,
          }
        : null,
      verse,
      mode,
    };
  });
}

export function buildExplainFallback({ verse, mood, language = "te" }) {
  const simpleMeaning = normalizeText(verse?.meaning || "");
  const chapter = Number(verse?.chapter || 0);
  const verseNumber = Number(verse?.verse || 0);

  const fallbackText = {
    en: {
      meaningLabel: "Simple meaning",
      moodLabel: "Context",
      noteLabel: "Reference",
      meaning: simpleMeaning || "This verse teaches a useful spiritual lesson with clarity and calmness.",
      mood: mood ? "In the " + mood + " mood, this verse helps you respond with balance, discipline, and inner peace." : "This verse helps you stay balanced, disciplined, and peaceful.",
      note: `Bhagavad Gita ${chapter}.${verseNumber}`,
    },
    te: {
      meaningLabel: "\u0c38\u0c30\u0c33\u0c2e\u0c48\u0c28 \u0c05\u0c30\u0c4d\u0c25\u0c02",
      moodLabel: "\u0c38\u0c02\u0c26\u0c30\u0c4d\u0c2d\u0c02",
      noteLabel: "\u0c38\u0c42\u0c1a\u0c28",
      meaning: simpleMeaning || "\u0c08 \u0c36\u0c4d\u0c32\u0c4b\u0c15\u0c02 \u0c1c\u0c40\u0c35\u0c3f\u0c24\u0c3e\u0c28\u0c3f\u0c15\u0c3f \u0c35\u0c3f\u0c2c\u0c46\u0c15\u0c2e\u0c48\u0c28 \u0c1c\u0c4d\u0c1e\u0c3e\u0c28\u0c3e\u0c28\u0c4d\u0c28\u0c3f \u0c2c\u0c4b\u0c27\u0c3f\u0c38\u0c4d\u0c24\u0c41\u0c02\u0c26\u0c3f.",
      mood: mood ? "\u0c2e\u0c40\u0c30\u0c41 " + mood + " \u0c05\u0c28\u0c41\u0c2d\u0c42\u0c24\u0c3f\u0c32\u0c4b \u0c09\u0c28\u0c4d\u0c28\u0c2a\u0c4d\u0c2a\u0c41\u0c21\u0c41 \u0c07\u0c26\u0c3f \u0c38\u0c2e\u0c24\u0c57\u0c32\u0c4d\u0c2f\u0c02, \u0c15\u0c30\u0c4d\u0c2e\u0c36\u0c3f\u0c15\u0c4d\u0c37\u0c23, \u0c2e\u0c30\u0c3f\u0c2f\u0c41 \u0c2e\u0c28\u0c37\u0c4d\u0c36\u0c3e\u0c02\u0c24\u0c3f\u0c15\u0c3f \u0c0e\u0c32\u0c3e \u0c38\u0c39\u0c3e\u0c2f\u0c2a\u0c21\u0c41\u0c24\u0c41\u0c02\u0c26\u0c4b \u0c1a\u0c46\u0c2c\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f." : "\u0c08 \u0c36\u0c4d\u0c32\u0c4b\u0c15\u0c02 \u0c2e\u0c28\u0c38\u0c41\u0c28\u0c41 \u0c38\u0c3f\u0c25\u0c3f\u0c30\u0c02\u0c17\u0c3e \u0c09\u0c02\u0c1a\u0c3f, \u0c27\u0c48\u0c30\u0c4d\u0c2f\u0c02\u0c24\u0c4b \u0c38\u0c30\u0c48\u0c28 \u0c2e\u0c3e\u0c30\u0c4d\u0c17\u0c02\u0c32\u0c4b \u0c28\u0c21\u0c35\u0c2e\u0c28\u0c3f \u0c1a\u0c46\u0c2c\u0c41\u0c24\u0c41\u0c02\u0c26\u0c3f.",
      note: `\u0c2d\u0c17\u0c35\u0c26\u0ccd\u0c17\u0c40\u0c24 ${chapter}.${verseNumber}`,
    },
    hi: {
      meaningLabel: "\u0938\u0930\u0932 \u0905\u0930\u094d\u0925",
      moodLabel: "\u0938\u0902\u0926\u0930\u094d\u092d",
      noteLabel: "\u0938\u0902\u0926\u0930\u094d\u092d",
      meaning: simpleMeaning || "\u092f\u0939 \u0936\u094d\u0932\u094b\u0915 \u091c\u0940\u0935\u0928 \u0915\u0947 \u0932\u093f\u090f \u090f\u0915 \u0938\u0940\u0927\u093e \u0914\u0930 \u0909\u092a\u092f\u094b\u0917\u0940 \u0906\u0927\u094d\u092f\u093e\u0924\u094d\u092e\u093f\u0915 \u0938\u0902\u0926\u0947\u0936 \u0926\u0947\u0924\u093e \u0939\u0948\u0964",
      mood: mood ? "\u091c\u092c \u0906\u092a " + mood + " \u092e\u0939\u0938\u0942\u0938 \u0915\u0930 \u0930\u0939\u0947 \u0939\u094b\u0902, \u0924\u092c \u092f\u0939 \u0936\u094d\u0932\u094b\u0915 \u0938\u0902\u0924\u0941\u0932\u0928, \u0905\u0928\u0941\u0936\u093e\u0938\u0928 \u0914\u0930 \u0936\u093e\u0902\u0924\u093f \u092c\u0928\u093e\u090f \u0930\u0916\u0928\u0947 \u092e\u0947\u0902 \u092e\u0926\u0926 \u0915\u0930\u0924\u093e \u0939\u0948\u0964" : "\u092f\u0939 \u0936\u094d\u0932\u094b\u0915 \u092e\u0928 \u0915\u094b \u0938\u094d\u0925\u093f\u0930 \u0930\u0916\u0915\u0930 \u0938\u0939\u0940 \u0915\u0930\u094d\u092e \u0915\u0930\u0928\u0947 \u0915\u0940 \u092a\u094d\u0930\u0947\u0930\u0923\u093e \u0926\u0947\u0924\u093e \u0939\u0948\u0964",
      note: `\u092d\u0917\u0935\u0926 \u0917\u0940\u0924\u093e ${chapter}.${verseNumber}`,
    },
    ta: {
      meaningLabel: "\u0b8e\u0bb3\u0bbf\u0baf \u0baa\u0bca\u0bb0\u0bc1\u0bb3\u0bcd",
      moodLabel: "\u0b9a\u0bc2\u0bb4\u0bb2\u0bcd",
      noteLabel: "\u0b95\u0bc1\u0bb1\u0bbf\u0baa\u0bcd\u0baa\u0bc1",
      meaning: simpleMeaning || "\u0b87\u0ba8\u0bcd\u0ba4 \u0b9a\u0bcd\u0bb2\u0bcb\u0b95\u0bae\u0bcd \u0bb5\u0bbe\u0bb4\u0bcd\u0bb5\u0bc1\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0b8e\u0bb3\u0bbf\u0baf \u0b86\u0ba9\u0bcd\u0bae\u0bbf\u0b95 \u0baa\u0bbe\u0b9f\u0ba4\u0bcd\u0ba4\u0bc8 \u0bb5\u0bb4\u0b99\u0bcd\u0b95\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",
      mood: mood ? "\u0ba8\u0bc0\u0b99\u0bcd\u0b95\u0bb3\u0bcd " + mood + " \u0b89\u0b9f\u0bb1\u0bcd\u0b9a\u0bc1\u0bb0\u0bcd\u0b95\u0bb3\u0bbf\u0bb2\u0bcd \u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd\u0baa\u0bcb\u0ba4\u0bc1, \u0b87\u0ba8\u0bcd\u0ba4 \u0b9a\u0bcd\u0bb2\u0bcb\u0b95\u0bae\u0bcd \u0b9a\u0bae\u0ba8\u0bbf\u0bb2\u0bc8, \u0b95\u0bc1\u0bb1\u0bcd\u0bb1\u0bb1\u0bbf\u0baf\u0bc1\u0bb0\u0bc8 \u0b86\u0b95\u0bcd\u0b95\u0bbf\u0bb1\u0ba4\u0bc1." : "\u0b87\u0ba8\u0bcd\u0ba4 \u0b9a\u0bcd\u0bb2\u0bcb\u0b95\u0bae\u0bcd \u0bae\u0ba9\u0ba4\u0bc8 \u0ba8\u0bbf\u0bb2\u0bc8\u0baf\u0bbe\u0b95 \u0bb5\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1 \u0b9a\u0bb0\u0bbf\u0baf \u0bb5\u0bb4\u0bbf\u0baf\u0bbf\u0bb2\u0bcd \u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f \u0b89\u0ba4\u0bb5\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",
      note: `\u0baa\u0b95\u0bb5\u0ba4\u0bcd\u0b95\u0bc0\u0ba4\u0bbe ${chapter}.${verseNumber}`,
    },
    kn: {
      meaningLabel: "Simple meaning",
      moodLabel: "Context",
      noteLabel: "Reference",
      meaning: simpleMeaning || "This verse teaches a useful spiritual lesson with clarity and calmness.",
      mood: mood ? "When you feel " + mood + ", this verse helps you regain balance, discipline, and peace." : "This verse helps you stay balanced, disciplined, and peaceful.",
      note: `Bhagavad Gita ${chapter}.${verseNumber}`,
    },
    ml: {
      meaningLabel: "\u0d32\u0d33\u0d3f\u0d24\u0d2e\u0d3e\u0d2f \u0d05\u0d7c\u0d24\u0d4d\u0d25\u0d02",
      moodLabel: "\u0d38\u0d28\u0d4d\u0d26\u0d30\u0d4d\u0d2d\u0d02",
      noteLabel: "\u0d38\u0d42\u0d1a\u0d28",
      meaning: simpleMeaning || "\u0d07\u0d24\u0d4d \u0d2c\u0d4d\u0d30\u0d39\u0d4d\u0d2e\u0d07\u0d15 \u0d2c\u0d4b\u0d27\u0d4d\u0d27\u0d24\u0d4d\u0d24\u0d3f\u0d28\u0d41 \u0d35\u0d47\u0d23\u0d4d\u0d21\u0d3f \u0d2e\u0d39\u0d24\u0d4d\u0d35\u0d2e\u0d41\u0d33\u0d4d\u0d33 \u0d15\u0d47\u0d37\u0d4d\u0d1f\u0d02 \u0d28\u0d32\u0d4d\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d41.",
      mood: mood ? "\u0d28\u0d40\u0d19\u0d4d\u0d19\u0d7e " + mood + " \u0d38\u0d2e\u0d4d\u0d2c\u0d28\u0d4d\u0d27\u0d24\u0d4d\u0d24\u0d3f\u0d32\u0d3e\u0d23\u0d46\u0d19\u0d4d\u0d15\u0d3f\u0d32\u0d41\u0d02, \u0d07\u0d24\u0d4d \u0d38\u0d2e\u0d24\u0d4d\u0d35\u0d02, \u0d36\u0d3e\u0d38\u0d28\u0d02, \u0d2e\u0d28\u0d38\u0d4d\u0d38\u0d3f\u0d28\u0d4d\u0d31\u0d46 \u0d36\u0d3e\u0d28\u0d4d\u0d24\u0d3f \u0d08 \u0d35\u0d3f\u0d35\u0d30\u0d23\u0d02 \u0d06\u0d23\u0d4d\u0d31\u0d46\u0d32\u0d4d\u0d32\u0d3e\u0d02." : "\u0d07\u0d24\u0d4d \u0d38\u0d2e\u0d4d\u0d2c\u0d28\u0d4d\u0d27\u0d2a\u0d46\u0d1f\u0d4d\u0d1f \u0d2e\u0d28\u0d38\u0d4d\u0d38\u0d3f\u0d28\u0d4d\u0d28\u0d4d\u0d31\u0d46 \u0d38\u0d3f\u0d25\u0d3f\u0d30\u0d02\u0d2e\u0d3e\u0d15\u0d4d\u0d15\u0d3f \u0d36\u0d30\u0d3f\u0d2f \u0d2e\u0d3e\u0d7c\u0d17\u0d4d\u0d17\u0d24\u0d4d\u0d24\u0d3f\u0d32\u0d4d \u0d28\u0d1f\u0d15\u0d4d\u0d15\u0d3e\u0d28\u0d4d \u0d38\u0d39\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d41.",
      note: `\u0d2d\u0d17\u0d35\u0d26\u0d4d\u0d17\u0d40\u0d24 ${chapter}.${verseNumber}`,
    },
  };

  const guide = fallbackText[language] || fallbackText.te;

  return [
    "**" + guide.meaningLabel + ":** " + guide.meaning,
    "",
    "**" + guide.moodLabel + ":** " + guide.mood,
    "",
    "**" + guide.noteLabel + ":** " + guide.note,
  ].join("\n");
}
