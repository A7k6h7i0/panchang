import { getStableItemKey } from "./getStableItemKey";

const SERVICE_API_BASE_URL = import.meta.env.VITE_HINDU_SEARCH_API_BASE_URL
  ? import.meta.env.VITE_HINDU_SEARCH_API_BASE_URL
  : import.meta.env.DEV
    ? "https://hindu-search.digitalleadpro.com"
    : "";

export const DEFAULT_SERVICE_IMAGE_URL = "/logo.png";

export function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return String(
      value?.name ??
        value?.vedic_name ??
        value?.title ??
        value?.value ??
        value?.label ??
        value?.display_name ??
        ""
    ).trim();
  }
  return "";
}

export function firstText(...values) {
  for (const value of values) {
    const candidate = textOf(value);
    if (candidate) return candidate;
  }
  return "";
}

export function buildMapsLink(text) {
  const query = encodeURIComponent(String(text || "").trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildDirectionsLink(text) {
  const destination = encodeURIComponent(String(text || "").trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function formatDistanceKm(distance) {
  const value = Number(distance);
  if (!Number.isFinite(value)) return "";
  const km = value / 1000;
  return `${km.toFixed(2)} km`;
}

export function initialsFromName(name) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "PU";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function resolveServiceImageUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("data:")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  const normalized = value.replace(/^\/+/, "");
  return `${SERVICE_API_BASE_URL}/${normalized}`;
}

function extractImageCandidate(value) {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractImageCandidate(entry));
  }
  if (typeof value === "object") {
    return [
      firstText(
        value?.url,
        value?.src,
        value?.image,
        value?.imageUrl,
        value?.image_url,
        value?.path
      ),
    ].filter(Boolean);
  }
  return [];
}

export function collectServiceImageUrls(item) {
  const images = [
    item?.imageUrl,
    item?.image_url,
    item?.image,
    item?.photo,
    item?.photoUrl,
    item?.photo_url,
    item?.featured_image,
    item?.featuredImage,
    item?.avatar,
    item?.avatar_url,
    item?.profile_image,
    item?.profileImage,
    item?.picture,
    item?.thumbnail,
    ...extractImageCandidate(item?.logo),
    ...extractImageCandidate(item?.cover),
    ...extractImageCandidate(item?.images),
    ...extractImageCandidate(item?.photos),
    ...extractImageCandidate(item?.gallery),
    ...extractImageCandidate(item?.media),
  ]
    .map((entry) => firstText(entry))
    .filter(Boolean)
    .map((entry) => resolveServiceImageUrl(entry));

  return [...new Set(images)];
}

export function pickServiceImageUrl(item) {
  return collectServiceImageUrls(item)[0] || "";
}

function seededShuffle(values, seedText) {
  const result = [...values];
  let seed = 0;
  const text = String(seedText || "panchang");
  for (let i = 0; i < text.length; i += 1) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let i = result.length - 1; i > 0; i -= 1) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

const SERVICE_RELATED_PHOTOS = {
  purohit: [
    "https://upload.wikimedia.org/wikipedia/commons/2/27/HINDU_PRIEST.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c8/Hindu_ritual.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Indian_home_pooja.jpg",
  ],
  temple: [
    "https://upload.wikimedia.org/wikipedia/commons/6/61/A_hindu_temple.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Hindu_Temple_USA.jpg/1280px-Hindu_Temple_USA.jpg",
  ],
  astrologer: [
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/The-Jyolsyan-Astrologer.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d5/Astrology_Horoscope_Wheel_Chart.jpg",
  ],
  store: [
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Indian_home_pooja.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/59/Diwali_Diyas.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/31/Tihar-Laxmi_Pooja.jpg",
  ],
};

export function collectServiceDetailImageUrls(item, serviceType) {
  const baseImages = collectServiceImageUrls(item);
  const normalizedType = String(serviceType || "").toLowerCase();
  const seedText = `${normalizedType}:${getStableItemKey(item, 0) || getServiceDisplayName(item) || getServiceAddress(item) || "service"}`;
  const relatedImages = SERVICE_RELATED_PHOTOS[normalizedType] || [];
  const shuffledRelated = seededShuffle(relatedImages, seedText);
  return [...new Set([...baseImages, ...shuffledRelated])];
}

export function getServiceFallbackImageUrl() {
  return DEFAULT_SERVICE_IMAGE_URL;
}

export function getServiceDisplayName(item) {
  return firstText(item?.name, item?.title, item?.display_name);
}

export function getServiceAddress(item) {
  return firstText(item?.address, item?.location, item?.area, item?.place);
}

export function getServiceRating(item) {
  return firstText(item?.rating, item?.rating_value, item?.average_rating);
}

export function getServiceRatingLabel(item) {
  const rating = getServiceRating(item);
  return rating || "N/A";
}

export function getServicePhone(item) {
  return firstText(item?.phone, item?.phone_number, item?.mobile, item?.contact);
}

export function getServiceTempleName(item) {
  return firstText(item?.templeName, item?.temple_name, item?.workingTempleName);
}

export function getServiceCategories(item) {
  return getServiceCategoryList(item).join(", ");
}

export function getServiceCategoryList(item) {
  const rawValues = [];

  if (Array.isArray(item?.categories)) {
    rawValues.push(...item.categories.map((entry) => textOf(entry)));
  } else {
    rawValues.push(item?.categories);
  }

  rawValues.push(item?.services, item?.specialization, item?.service_types);

  return [
    ...new Set(
      rawValues
        .flatMap((value) =>
          textOf(value)
            .split(/[|,\u2022]+/)
            .map((entry) => entry.trim())
            .filter(Boolean)
        )
    ),
  ];
}

export function getServiceDescription(item) {
  return firstText(item?.description, item?.about, item?.bio, item?.summary);
}

export function getServiceWebsite(item) {
  return firstText(item?.website, item?.link);
}

export function getServiceWorkdayTiming(item) {
  return firstText(item?.workday_timing, item?.timings, item?.working_hours);
}

export function getServiceIdentifier(item, index = 0) {
  return getStableItemKey(item, index);
}
