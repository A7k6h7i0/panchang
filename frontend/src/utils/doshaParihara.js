export const DOSHA_PARIHARA_DATA_URL = "/data/dosha-parihara.json";

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_./&+-]+/g, " ")
    .replace(/[^a-z0-9 /&+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPlaceholderWebsite(value) {
  return /^(website|web site|default|default website|sample|example|placeholder|none|null|n\/a|na|not available|coming soon|cafe|caffe|test|demo|local|localhost)$/i.test(
    String(value || "").trim()
  );
}

function normalizeWebsiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || isPlaceholderWebsite(raw) || /\s{2,}/.test(raw)) return "";

  const candidate = /^https?:\/\//i.test(raw) || /^\/\//.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate.startsWith("//") ? `https:${candidate}` : candidate);
    const hostname = String(url.hostname || "").toLowerCase();
    if (!hostname || hostname === "localhost" || !hostname.includes(".")) return "";
    if (isPlaceholderWebsite(hostname) || /(^|\.)(example|placeholder|default|website|cafe|caffe|test|demo|local)(\.|$)/i.test(hostname)) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  return String(value)
    .split(/[,/|]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeCategory(entry, index) {
  const label = String(entry?.label || entry?.name || entry?.title || "").trim();
  const id = String(entry?.id || entry?.slug || slugify(label) || `category-${index}`).trim();
  return {
    id,
    label: label || id,
    description: String(entry?.description || "").trim(),
    aliases: asList(entry?.aliases),
  };
}

function normalizeDoshaType(entry, index) {
  const label = String(entry?.label || entry?.name || entry?.title || "").trim();
  const id = String(entry?.id || entry?.slug || slugify(label) || `dosha-${index}`).trim();
  return {
    id,
    label: label || id,
    categoryId: String(entry?.categoryId || entry?.category_id || "").trim(),
    aliases: asList(entry?.aliases),
    description: String(entry?.description || "").trim(),
    problemKeywords: asList(entry?.problemKeywords || entry?.problems || entry?.issues),
  };
}

export function normalizeDoshaPariharaRecord(record, index, categoryLookup, doshaLookup) {
  const templeName = String(record?.templeName || record?.temple_name || record?.name || record?.title || "").trim();
  const location = String(record?.location || record?.city || record?.place || record?.area || "").trim();
  const id = String(record?.id || record?.slug || slugify(`${templeName}-${location}`) || `record-${index}`).trim();
  const categoryIds = asList(record?.categoryIds || record?.category_ids || record?.category || record?.categories);
  const doshaTypes = asList(record?.doshaTypes || record?.dosha_types || record?.dosha || record?.doshaName);
  const problemKeywords = asList(record?.problemKeywords || record?.problems || record?.issueKeywords);
  const ritualName = String(record?.ritualName || record?.ritual_name || record?.poojaName || record?.pooja_name || "").trim();
  const speciality = String(record?.templeSpeciality || record?.speciality || record?.specialization || "").trim();
  const description = String(record?.description || "").trim();
  const address = String(record?.address || "").trim();
  const district = String(record?.district || "").trim();
  const state = String(record?.state || "").trim();
  const contact = record?.contact && typeof record.contact === "object" ? record.contact : {};
  const isBlockedWebsiteTemple =
    /kukke-subramanya-sarpa-dosha-parihara/i.test(id) ||
    /kukke subramanya temple/i.test(templeName);
  const website = isBlockedWebsiteTemple ? "" : normalizeWebsiteUrl(record?.website || contact?.website || "");
  const phone = String(record?.phone || contact?.phone || "").trim();
  const images = Array.isArray(record?.images) ? record.images.map((entry) => String(entry || "").trim()).filter(Boolean) : [];

  const categoryLabels = categoryIds.map((categoryId) => categoryLookup.get(categoryId)?.label || categoryId);
  const doshaTypeLabels = doshaTypes.map((doshaType) => doshaLookup.get(slugify(doshaType))?.label || doshaType);
  const searchText = normalizeText(
    [
      templeName,
      location,
      district,
      state,
      ritualName,
      speciality,
      description,
      address,
      ...categoryLabels,
      ...doshaTypeLabels,
      ...problemKeywords,
      ...(Array.isArray(record?.keywords) ? record.keywords : asList(record?.keywords)),
    ].join(" ")
  );

  return {
    ...record,
    id,
    templeName,
    location,
    district,
    state,
    categoryIds,
    categoryLabels,
    doshaTypes,
    doshaTypeLabels,
    problemKeywords,
    ritualName,
    speciality,
    description,
    address,
    website,
    phone,
    images,
    searchText,
  };
}

export function normalizeDoshaPariharaDataset(payload) {
  const rawCategories = Array.isArray(payload?.categories) ? payload.categories : [];
  const categories = rawCategories.map(normalizeCategory);
  const categoryLookup = new Map(categories.map((entry) => [entry.id, entry]));

  const rawDoshaTypes = Array.isArray(payload?.doshaTypes) ? payload.doshaTypes : [];
  const doshaTypes = rawDoshaTypes.map(normalizeDoshaType);
  const doshaLookup = new Map(
    doshaTypes.flatMap((entry) => [
      [entry.id, entry],
      [slugify(entry.label), entry],
      ...entry.aliases.map((alias) => [slugify(alias), entry]),
    ])
  );

  const rawRecords = Array.isArray(payload?.records)
    ? payload.records
    : Array.isArray(payload)
      ? payload
      : [];
  const records = rawRecords.map((record, index) =>
    normalizeDoshaPariharaRecord(record, index, categoryLookup, doshaLookup)
  );

  return {
    updatedAt: String(payload?.updatedAt || "").trim(),
    categories,
    doshaTypes,
    records,
  };
}

export function findDoshaPariharaRecord(records, identifier) {
  const needle = slugify(identifier);
  if (!needle) return null;
  return (records || []).find((record) => {
    return (
      slugify(record?.id) === needle ||
      slugify(record?.slug) === needle ||
      slugify(record?.templeName) === needle
    );
  }) || null;
}

export function recordMatchesFilters(record, { query, categoryId, doshaTypeId }) {
  if (!record) return false;

  if (categoryId && categoryId !== "all" && !record.categoryIds.includes(categoryId)) {
    return false;
  }

  if (doshaTypeId && doshaTypeId !== "all") {
    const needle = slugify(doshaTypeId);
    const matchesType = record.doshaTypes.some((type) => slugify(type) === needle);
    if (!matchesType) return false;
  }

  const cleanedQuery = normalizeText(query);
  if (!cleanedQuery) return true;

  const tokens = cleanedQuery.split(" ").filter(Boolean);
  if (!tokens.length) return true;

  return tokens.every((token) => record.searchText.includes(token));
}

export function scoreDoshaPariharaRecord(record, query) {
  const cleanedQuery = normalizeText(query);
  if (!cleanedQuery) return 0;

  const tokens = cleanedQuery.split(" ").filter(Boolean);
  if (!tokens.length) return 0;

  let score = 0;
  tokens.forEach((token) => {
    if (normalizeText(record?.templeName).includes(token)) score += 5;
    if (normalizeText(record?.ritualName).includes(token)) score += 4;
    if (normalizeText(record?.speciality).includes(token)) score += 3;
    if (normalizeText((record?.doshaTypes || []).join(" ")).includes(token)) score += 3;
    if (normalizeText((record?.problemKeywords || []).join(" ")).includes(token)) score += 3;
    if (record?.searchText?.includes(token)) score += 1;
  });

  return score;
}
