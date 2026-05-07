export function getTranslatedFestivalName(name, language, festivalTranslations) {
  if (!name) return name;
  return festivalTranslations?.[language]?.[name] || name;
}

export function translateFestivalList(names, language, festivalTranslations) {
  return (Array.isArray(names) ? names : [])
    .map((name) => getTranslatedFestivalName(name, language, festivalTranslations))
    .filter(Boolean);
}
