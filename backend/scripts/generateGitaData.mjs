import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_ROOT = "C:/Users/ganta/Downloads/bhagavadgita";
const CHAPTER_SOURCE_DIR = path.join(SOURCE_ROOT, "chapter");
const SLOK_SOURCE_DIR = path.join(SOURCE_ROOT, "slok");
const OUTPUT_ROOT = path.join("backend", "data", "gita");
const OUTPUT_CHAPTERS_DIR = path.join(OUTPUT_ROOT, "chapters");

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

const KEYWORD_TAGS = [
  { tag: "karma", patterns: [/duty/i, /action/i, /work/i, /karma/i, /responsib/i, /perform/i] },
  { tag: "mind", patterns: [/mind/i, /meditat/i, /senses?/i, /self/i, /steady/i, /control/i] },
  { tag: "fear", patterns: [/fear/i, /doubt/i, /grief/i, /anxiety/i, /confusion/i, /despair/i] },
  { tag: "success", patterns: [/success/i, /victory/i, /purpose/i, /growth/i, /mastery/i, /fulfil/i] },
];

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}

function chapterThemes(chapterNumber, verseData) {
  const fromChapter = CHAPTER_THEME_MAP[chapterNumber] || [];
  const haystack = [
    verseData?.slok,
    verseData?.transliteration,
    verseData?.meaning,
    verseData?.speaker,
  ]
    .map(normalizeText)
    .join(" ")
    .toLowerCase();

  const fromKeywords = KEYWORD_TAGS.filter(({ patterns }) => patterns.some((pattern) => pattern.test(haystack))).map(
    ({ tag }) => tag
  );

  return uniqueTags([...fromChapter, ...fromKeywords]);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function getChapterNumberFromName(fileName) {
  const match = String(fileName || "").match(/chapter_(\d+)\.json$/i);
  return match ? Number(match[1]) : null;
}

function getVerseKey(fileName) {
  const match = String(fileName || "").match(/chapter_(\d+)_slok_(\d+)\.json$/i);
  if (!match) return null;
  return { chapter: Number(match[1]), verse: Number(match[2]) };
}

async function main() {
  const chapterFiles = (await fs.readdir(CHAPTER_SOURCE_DIR)).filter((name) => /chapter_\d+\.json$/i.test(name));
  const verseFiles = (await fs.readdir(SLOK_SOURCE_DIR)).filter((name) => /chapter_\d+_slok_\d+\.json$/i.test(name));

  const chapterDataMap = new Map();
  for (const fileName of chapterFiles) {
    const chapterNumber = getChapterNumberFromName(fileName);
    if (!chapterNumber) continue;
    const data = await readJson(path.join(CHAPTER_SOURCE_DIR, fileName));
    chapterDataMap.set(chapterNumber, data);
  }

  const verseBuckets = new Map();
  for (const fileName of verseFiles) {
    const key = getVerseKey(fileName);
    if (!key) continue;
    const raw = await readJson(path.join(SLOK_SOURCE_DIR, fileName));
    const meaning = normalizeText(raw?.tej?.ht || raw?.tej?.et || raw?.tej?.ec || raw?.siva?.et || raw?.purohit?.et || "");
    const verse = {
      id: raw?._id || `BG${key.chapter}.${key.verse}`,
      chapter: key.chapter,
      verse: key.verse,
      speaker: normalizeText(raw?.speaker),
      slok: normalizeText(raw?.slok),
      transliteration: normalizeText(raw?.transliteration),
      meaning,
    };
    verse.tags = chapterThemes(key.chapter, verse);

    if (!verseBuckets.has(key.chapter)) {
      verseBuckets.set(key.chapter, []);
    }
    verseBuckets.get(key.chapter).push(verse);
  }

  await ensureDir(OUTPUT_CHAPTERS_DIR);

  const chapters = [...chapterDataMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chapterNumber, chapterMeta]) => {
      const verses = (verseBuckets.get(chapterNumber) || []).sort((a, b) => a.verse - b.verse);
      const chapterPayload = {
        chapter: chapterNumber,
        meta: {
          chapter_number: chapterMeta?.chapter_number || chapterNumber,
          verses_count: chapterMeta?.verses_count || verses.length,
          name: normalizeText(chapterMeta?.name),
          translation: normalizeText(chapterMeta?.translation),
          transliteration: normalizeText(chapterMeta?.transliteration),
          meaning: chapterMeta?.meaning || {},
          summary: chapterMeta?.summary || {},
          themes: uniqueTags([
            ...(CHAPTER_THEME_MAP[chapterNumber] || []),
            ...verses.flatMap((verse) => verse.tags || []),
          ]),
        },
        verses,
      };

      return chapterPayload;
    });

  const indexPayload = {
    generatedAt: new Date().toISOString(),
    chapters: chapters.map((chapter) => ({
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

  await fs.writeFile(path.join(OUTPUT_ROOT, "index.json"), `${JSON.stringify(indexPayload, null, 2)}\n`, "utf8");

  await Promise.all(
    chapters.map(async (chapter) => {
      const fileName = path.join(OUTPUT_CHAPTERS_DIR, `${chapter.chapter}.json`);
      await fs.writeFile(fileName, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
    })
  );

  console.log(`Generated Gita data for ${chapters.length} chapters at ${OUTPUT_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
