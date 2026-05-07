import { storageGetJson, storageSetJson } from "./storage";

const YEAR_CACHE_PREFIX = "panchang:calendar-year:";
const FESTIVAL_CACHE_PREFIX = "panchang:festival-year:";

function getTodayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCacheKey(prefix, year) {
  return `${prefix}${year}`;
}

function normalizeCacheRecord(record) {
  if (!record || typeof record !== "object") return null;
  if (!Array.isArray(record.data) && typeof record.data !== "object") return null;

  return {
    date: String(record.date || ""),
    data: record.data,
  };
}

function readCache(prefix, year) {
  return normalizeCacheRecord(storageGetJson(getCacheKey(prefix, year), null));
}

function writeCache(prefix, year, data) {
  storageSetJson(getCacheKey(prefix, year), {
    date: getTodayStamp(),
    data,
  });
}

export function getCachedYearData(year) {
  return readCache(YEAR_CACHE_PREFIX, year);
}

export function setCachedYearData(year, data) {
  writeCache(YEAR_CACHE_PREFIX, year, data);
}

export function getCachedFestivalData(year) {
  return readCache(FESTIVAL_CACHE_PREFIX, year);
}

export function setCachedFestivalData(year, data) {
  writeCache(FESTIVAL_CACHE_PREFIX, year, data);
}

export function isCacheFresh(record) {
  return Boolean(record?.date) && record.date === getTodayStamp();
}
