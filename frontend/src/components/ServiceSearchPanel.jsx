import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import { useLanguage } from "../hooks/useLanguage";
import { getStableItemKey } from "../utils/getStableItemKey";
import { loadLocation } from "../utils/appSettings";
import {
  fetchServiceJsonCached,
  readServiceSnapshotCache,
  writeServiceSnapshotCache,
} from "../services/serviceApiCache";
import NoResultsModal from "./NoResultsModal";
import ServiceCard from "./ServiceCard";
import {
  firstText,
  getServiceIdentifier,
  textOf,
} from "../utils/serviceItemDetails";

const SERVICE_API_BASE_URL = import.meta.env.VITE_HINDU_SEARCH_API_BASE_URL
  ? import.meta.env.VITE_HINDU_SEARCH_API_BASE_URL
  : import.meta.env.DEV
    ? "https://hindu-search.digitalleadpro.com"
    : "";

// Local backend URL for purohits (MongoDB-backed)
const LOCAL_API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

const EMPTY_RECENT_ITEMS = [];
const TEMPLE_SETTINGS_FALLBACK_DISTANCE_METERS = 10000;
const VOICE_LANGUAGE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  ta: "ta-IN",
};

function normalizeServiceItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function sortByDistance(items) {
  return [...items].sort((a, b) => {
    const aDistance = Number(a?.distance ?? Number.POSITIVE_INFINITY);
    const bDistance = Number(b?.distance ?? Number.POSITIVE_INFINITY);
    return aDistance - bDistance;
  });
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function getCoordsFromItem(item) {
  if (!item) return null;
  const lat =
    toNumber(item?.latitude) ??
    toNumber(item?.lat) ??
    toNumber(item?.location?.lat) ??
    toNumber(item?.location?.latitude) ??
    toNumber(item?.location?.coordinates?.[1]);
  const lng =
    toNumber(item?.longitude) ??
    toNumber(item?.lng) ??
    toNumber(item?.location?.lng) ??
    toNumber(item?.location?.longitude) ??
    toNumber(item?.location?.coordinates?.[0]);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function haversineDistanceMeters(origin, target) {
  if (!origin || !target) return null;
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(target.lat - origin.lat);
  const dLng = toRadians(target.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const targetLat = toRadians(target.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(targetLat) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ensureDistance(items, origin) {
  if (!origin) return items;
  return (items || []).map((item) => {
    if (Number.isFinite(Number(item?.distance))) return item;
    const coords = getCoordsFromItem(item);
    if (!coords) return item;
    const computed = haversineDistanceMeters(origin, coords);
    if (!Number.isFinite(computed)) return item;
    return { ...item, distance: computed };
  });
}

function matchesKeyword(value, pattern) {
  if (!value) return false;
  return pattern.test(String(value));
}

function getSavedTempleLocation() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("panchang:selected-location");
  if (!raw) return null;
  const saved = loadLocation();
  const lat = toNumber(saved?.lat);
  const lng = toNumber(saved?.lng);
  if (lat == null || lng == null) return null;
  return {
    lat,
    lng,
    source: "settings",
    name: String(saved?.name || "").trim(),
  };
}

function shouldPreferTypeFilter(items, predicate) {
  return items.some((item) => predicate(item));
}

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const collectSearchText = (item) => {
  const fields = [
    item?.name,
    item?.title,
    item?.display_name,
    item?.area,
    item?.location,
    item?.address,
    item?.place,
    item?.city,
    item?.temple,
    item?.temple_name,
    item?.templeName,
    item?.associated_temple,
    item?.specialization,
    item?.specialization_name,
    item?.pooja_type,
    item?.poojaType,
    item?.services,
    item?.service_types,
    item?.category,
    item?.tags,
  ];

  const parts = [];
  fields.forEach((field) => {
    if (!field) return;
    if (Array.isArray(field)) {
      field.forEach((entry) => parts.push(textOf(entry)));
    } else {
      parts.push(textOf(field));
    }
  });

  return normalizeSearchText(parts.join(" "));
};

const matchesSearchQuery = (item, query) => {
  const haystack = collectSearchText(item);
  if (!haystack) return false;
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;
  return tokens.every((token) => haystack.includes(token));
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

function ServiceSearchPanel({ serviceType, title, subtitle, recentItems, noResultsModalConfig, transparent = false }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const normalizedType = String(serviceType || "").toLowerCase();
  const resolvedType = useMemo(() => {
    if (normalizedType.startsWith("puroh")) return "purohit";
    if (normalizedType.startsWith("astrolog")) return "astrologer";
    if (normalizedType.startsWith("store")) return "store";
    return "temple";
  }, [normalizedType]);
  const initialSnapshot = useMemo(
    () => readServiceSnapshotCache(resolvedType)?.items || [],
    [resolvedType]
  );
  const isLocalApi = useMemo(
    () =>
      SERVICE_API_BASE_URL.includes("localhost:5046") ||
      SERVICE_API_BASE_URL.includes("127.0.0.1:5046"),
    []
  );
  const recentItemsSafe = useMemo(
    () => (Array.isArray(recentItems) ? recentItems : EMPTY_RECENT_ITEMS),
    [recentItems]
  );
  const [serviceResults, setServiceResults] = useState(() => initialSnapshot);
  const [allPurohits, setAllPurohits] = useState(() =>
    resolvedType === "purohit" ? initialSnapshot : []
  );
  const [allAstrologers, setAllAstrologers] = useState(() =>
    resolvedType === "astrologer" ? initialSnapshot : []
  );
  const [serviceError, setServiceError] = useState("");
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [isNoResultsModalOpen, setIsNoResultsModalOpen] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // Use custom debounce hook to prevent unnecessary updates
  const debouncedQuery = useDebounce(serviceQuery, 400);
  const [serviceHasInteracted, setServiceHasInteracted] = useState(false);
  const serviceAbortRef = useRef(null);
  const lastNearbyRef = useRef({
    purohit: resolvedType === "purohit" ? initialSnapshot : [],
    astrologer: resolvedType === "astrologer" ? initialSnapshot : [],
    temple: resolvedType === "temple" ? initialSnapshot : [],
    store: resolvedType === "store" ? initialSnapshot : [],
  });
  const lastActualNearbyCountRef = useRef({ purohit: 0, astrologer: 0, temple: 0, store: 0 });
  const userLocationRef = useRef(null);
  const preSearchResultsRef = useRef([]); // Keep results visible during search
  const requestIdRef = useRef(0);
  const serviceResultsRef = useRef(initialSnapshot);
  const recognitionRef = useRef(null);
  const recognitionStartingRef = useRef(false);
  const speechLanguage = useMemo(() => getSpeechRecognitionLanguage(language), [language]);

  const typePredicate = useCallback((item) => {
    const name = firstText(item?.name, item?.title, item?.display_name);
    const meta = firstText(
      item?.category,
      item?.type,
      item?.service_type,
      item?.tags,
      item?.categories,
      item?.main_category
    );
    const description = firstText(item?.description);
    
    // STRICT: For purohit type, only accept items explicitly marked as purohit
    // or items that have purohit-specific fields from our AddPurohithForm
    if (resolvedType === "purohit") {
      // First check: Explicit type fields - must be purohit
      const itemType = String(item?.type || "").toLowerCase();
      const itemServiceType = String(item?.service_type || "").toLowerCase();
      const itemCategory = String(item?.category || "").toLowerCase();
      
      // If explicitly marked as temple or anything other than purohit, reject it
      if (itemType && itemType !== "purohit") {
        return false;
      }
      if (itemServiceType && itemServiceType !== "purohit") {
        return false;
      }
      
      // Check if it looks like a temple from type/category - expanded list
      const excludeTypeKeywords = [
        "temple", "mandir", "hotel", "mall", "restaurant", "shop", "store",
        "ashram", "math", "mutt", "devi", "devasthanam", "devalayam", 
        "alayam", "kovil", "kshetram", "church", "masjid", "mosque",
        "inn", "resort", "stay", "lodge", "guest", "hospital", "clinic",
        "shopping", "center", "complex", "kalibari", "satram"
      ];
      if (excludeTypeKeywords.some(kw => 
        itemType.includes(kw) || 
        itemServiceType.includes(kw) || 
        itemCategory.includes(kw)
      )) {
        return false;
      }
      
      // Check for local purohit-specific fields (from AddPurohithForm)
      const looksLikeLocalPurohit = Boolean(
        item?.specialization || item?.services || item?.workingTemple || item?.phone
      );
      if (looksLikeLocalPurohit) return true;
      
      // Only allow if explicitly marked as purohit
      if (itemType === "purohit" || itemServiceType === "purohit") {
        return true;
      }
      
      // Additional check: reject if has temple-like fields
      if (item?.temple_name || item?.templeName || item?.place_id) {
        // Check if it has purohit-specific fields to confirm it's a purohit
        if (!item?.specialization && !item?.services && !item?.phone) {
          // Has temple info but no purohit-specific info - likely a temple
          return false;
        }
      }
      
      // Final keyword-based check with strict exclusion
      // Only accept purohit-related keywords
      const purohitPattern =
        /purohit|purohith|purohita|purohitam|pandit|priest|pujari|acharya|aacharya|archaka|brahmin|vaidya|h主持人|poojari|vadhyar|shastri|purohita|हिंदू पुजारी|पंडित|पूजारी|आचार्य/i;
      
      // Expanded temple/exclude pattern
      const excludePattern =
        /temple|mandir|devalayam|alayam|kovil|kshetram|swamy|swami|devi|devasthanam|hotel|restaurant|mall|shop|ashram|math|mutt|inn|resort|lodge|guest|kalibari|satram|church|masjid|mosque|hospital|clinic|shopping|center|complex|store/i;
      
      const matchesPurohit = matchesKeyword(name, purohitPattern) ||
        matchesKeyword(meta, purohitPattern) ||
        matchesKeyword(description, purohitPattern);
      const matchesExclude = matchesKeyword(name, excludePattern) ||
        matchesKeyword(meta, excludePattern) ||
        matchesKeyword(description, excludePattern);
      
      // If it matches exclude pattern, reject it regardless of purohit match
      if (matchesExclude) {
        return false;
      }
      
      // Only return true if it looks like purohit
      return matchesPurohit;
    }
    if (resolvedType === "astrologer") {
      const itemType = String(item?.type || "").toLowerCase();
      const itemServiceType = String(item?.service_type || "").toLowerCase();
      const itemCategory = String(item?.category || "").toLowerCase();

      if (itemType && itemType !== "astrologer") return false;
      if (itemServiceType && itemServiceType !== "astrologer") return false;
      if (/temple|mandir|store|shop|hotel|restaurant|clinic|hospital/i.test(`${itemType} ${itemServiceType} ${itemCategory}`)) {
        return false;
      }

      const astrologerPattern = /astrologer|astrology|jyotish|jyotishi|horoscope|numerology|vedic astrology|ज्योतिष|ज्योतिषी|ജ്യോതിഷി|ಜ್ಯೋತಿಷಿ|ஜோதிட/i;
      return (
        matchesKeyword(name, astrologerPattern) ||
        matchesKeyword(meta, astrologerPattern) ||
        matchesKeyword(description, astrologerPattern)
      );
    }
    if (resolvedType === "store") return true;
    const templePattern = /temple|mandir|devalayam|alayam|kovil|kshetram|swamy|swami|devi|devasthanam/i;
    return matchesKeyword(name, templePattern) || matchesKeyword(meta, templePattern);
  }, [resolvedType]);

  const filterByResolvedType = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) return items;
    if (resolvedType === "purohit") {
      return items.filter((item) => typePredicate(item));
    }
    if (resolvedType === "astrologer") {
      return items.filter((item) => typePredicate(item));
    }
    if (resolvedType === "store") return items;
    if (isLocalApi) return items;
    if (!shouldPreferTypeFilter(items, typePredicate)) return items;
    return items.filter((item) => typePredicate(item));
  }, [isLocalApi, resolvedType, typePredicate]);

  const getUserLocation = async () =>
    new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        reject(new Error("Geolocation is not supported in this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "gps",
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });

  const getTempleUserLocation = async () => {
    const savedLocation = getSavedTempleLocation();
    if (typeof window !== "undefined" && window.NativeApp?.postMessage) {
      try {
        const nativeLocation = await new Promise((resolve, reject) => {
          let settled = false;
          const finish = (callback) => (value) => {
            if (settled) return;
            settled = true;
            cleanup();
            callback(value);
          };
          const cleanup = () => {
            if (timeoutId) {
              window.clearTimeout(timeoutId);
            }
            delete window.receiveNativeLocation;
            delete window.onNativeLocationError;
          };
          const resolveOnce = finish(resolve);
          const rejectOnce = finish(reject);
          const timeoutId = window.setTimeout(() => {
            rejectOnce(new Error("Native location request timed out."));
          }, 8000);

          window.receiveNativeLocation = (lat, lng) => {
          const latitude = Number(lat);
          const longitude = Number(lng);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              rejectOnce(new Error("Could not read coordinates."));
            return;
          }
            resolveOnce({
            lat: latitude,
            lng: longitude,
            source: "native",
          });
          };

          window.onNativeLocationError = (errorMsg) => {
            rejectOnce(new Error(errorMsg || "Unable to get current location."));
          };

          try {
            window.NativeApp.postMessage(JSON.stringify({ action: "requestLocation" }));
          } catch {
            rejectOnce(new Error("Failed to communicate with the App native bridge."));
          }
        });
        if (savedLocation) {
          const mismatchDistance = haversineDistanceMeters(nativeLocation, savedLocation);
          if (Number.isFinite(mismatchDistance) && mismatchDistance > TEMPLE_SETTINGS_FALLBACK_DISTANCE_METERS) {
            console.warn("[temples] native location differs from saved settings, using saved location:", {
              nativeLocation,
              savedLocation,
              mismatchDistance,
            });
            return savedLocation;
          }
        }
        return nativeLocation;
      } catch {
        // Fall through to browser geolocation if the native bridge is unavailable or unresponsive.
      }
    }

    if (!navigator?.geolocation) {
      throw new Error("Geolocation is not supported in this browser.");
    }

    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state === "denied") {
          throw new Error(
            "Location access is blocked. Please allow it in your browser/device settings and reload the temples page."
          );
        }
      }
    } catch (err) {
      if (err?.message) {
        throw err;
      }
    }

    const gpsLocation = await getUserLocation();
    if (savedLocation) {
      const mismatchDistance = haversineDistanceMeters(gpsLocation, savedLocation);
      if (Number.isFinite(mismatchDistance) && mismatchDistance > TEMPLE_SETTINGS_FALLBACK_DISTANCE_METERS) {
        console.warn("[temples] gps location differs from saved settings, using saved location:", {
          gpsLocation,
          savedLocation,
          mismatchDistance,
        });
        return savedLocation;
      }
    }

    return gpsLocation;
  };

  const fetchServiceList = async (url, signal) => {
    const payload = await fetchServiceJsonCached(url, {
      signal,
      ttlMs: 2 * 24 * 60 * 60 * 1000,
      staleWhileRevalidate: true,
      revalidateAfterMs: 12 * 60 * 60 * 1000,
    });
    return normalizeServiceItems(payload);
  };

  const fetchAllPurohits = async (controller) => {
    // Use local backend for purohits to get pure data from MongoDB
    const url = `${LOCAL_API_BASE_URL}/api/purohith?limit=50`;
    const items = await fetchServiceList(url, controller.signal);
    if (import.meta?.env?.DEV) {
      console.log("[ServiceSearchPanel] GET /api/purohith response count:", items.length, items);
    }
    setAllPurohits(items);
    return items;
  };

  const fetchAllAstrologers = async (controller) => {
    const url = `${SERVICE_API_BASE_URL}/api/astrologers?limit=50`;
    const items = await fetchServiceList(url, controller.signal);
    if (import.meta?.env?.DEV) {
      console.log("[ServiceSearchPanel] GET /api/astrologers response count:", items.length, items);
    }
    setAllAstrologers(items);
    return items;
  };

  const mergeUniqueServices = (primary, fallback) => {
    const seen = new Set();
    const combined = [];
    const addItem = (item) => {
      const name = firstText(item?.name, item?.title, item?.display_name).toLowerCase();
      const address = firstText(item?.address, item?.location, item?.area, item?.place).toLowerCase();
      const key = `${name}::${address}`;
      if (seen.has(key)) return;
      seen.add(key);
      combined.push(item);
    };
    (primary || []).forEach(addItem);
    (fallback || []).forEach(addItem);
    return combined;
  };

  const fetchPurohitCandidates = async (controller) => {
    const terms = ["purohit", "pandit", "priest", "pujari", "acharya"];
    const collected = [];
    const addItems = (items) => {
      items.forEach((item) => collected.push(item));
    };

    // Use local backend for purohits to get pure data from MongoDB
    const baseUrl = `${LOCAL_API_BASE_URL}/api/purohith?limit=50`;
    addItems(await fetchServiceList(baseUrl, controller.signal));
    if (filterByResolvedType(collected).length >= 10) {
      return collected;
    }

    for (const term of terms) {
      const searchUrl = `${LOCAL_API_BASE_URL}/api/purohith?limit=50&search=${encodeURIComponent(
        term
      )}`;
      addItems(await fetchServiceList(searchUrl, controller.signal));
      if (filterByResolvedType(collected).length >= 10) break;
    }

    return collected;
  };

  const fetchAstrologerCandidates = async (controller) => {
    const terms = ["astrologer", "astrology", "jyotish", "horoscope", "numerology"];
    const collected = [];
    const addItems = (items) => {
      items.forEach((item) => collected.push(item));
    };

    const baseUrl = `${SERVICE_API_BASE_URL}/api/astrologers?limit=50`;
    addItems(await fetchServiceList(baseUrl, controller.signal));
    if (filterByResolvedType(collected).length >= 10) {
      return collected;
    }

    for (const term of terms) {
      const searchUrl = `${SERVICE_API_BASE_URL}/api/astrologers?limit=50&search=${encodeURIComponent(term)}`;
      addItems(await fetchServiceList(searchUrl, controller.signal));
      if (filterByResolvedType(collected).length >= 10) break;
    }

    return collected;
  };

  const ensureMinimumResults = async (nextType, currentItems, controller) => {
    if (nextType !== "purohit" && nextType !== "astrologer") return currentItems;
    if (currentItems.length >= 10) return currentItems;
    const fallbackItems =
      nextType === "purohit"
        ? await fetchPurohitCandidates(controller)
        : await fetchAstrologerCandidates(controller);
    if (import.meta?.env?.DEV) {
      console.debug(`[${nextType}] fallback items:`, fallbackItems.length);
    }
    const filteredFallback = filterByResolvedType(fallbackItems);
    if (import.meta?.env?.DEV) {
      console.debug(`[${nextType}] fallback filtered:`, filteredFallback.length);
    }
    const fallbackSorted = sortByDistance(
      ensureDistance(filteredFallback, userLocationRef.current)
    );
    const merged = mergeUniqueServices(currentItems, fallbackSorted);
    if (import.meta?.env?.DEV) {
      console.debug(`[${nextType}] merged total:`, merged.length);
    }
    return merged.slice(0, 10);
  };

  const ensureMinimumStoreResults = async (currentItems, controller) => {
    if (currentItems.length >= 10) return currentItems;
    const fallbackItems = await fetchServiceList(
      `${LOCAL_API_BASE_URL}/api/stores?limit=50`,
      controller.signal
    );
    const filteredFallback = filterByResolvedType(fallbackItems);
    const merged = mergeUniqueServices(currentItems, filteredFallback);
    return sortByDistance(ensureDistance(merged, userLocationRef.current));
  };

  const fetchGeneralServices = async (nextType, controller) => {
    if (nextType === "purohit") {
      const fallbackItems = await fetchPurohitCandidates(controller);
      const filteredFallback = filterByResolvedType(fallbackItems);
      const fallbackSorted = sortByDistance(
        ensureDistance(filteredFallback, userLocationRef.current)
      );
      return ensureMinimumResults(nextType, fallbackSorted, controller);
    }

    if (nextType === "astrologer") {
      const fallbackItems = await fetchAstrologerCandidates(controller);
      const filteredFallback = filterByResolvedType(fallbackItems);
      const fallbackSorted = sortByDistance(
        ensureDistance(filteredFallback, userLocationRef.current)
      );
      return ensureMinimumResults(nextType, fallbackSorted, controller);
    }

    if (nextType === "store") {
      const fallbackUrl = `${LOCAL_API_BASE_URL}/api/stores?limit=50`;
      const fallbackItems = await fetchServiceList(fallbackUrl, controller.signal);
      const filteredFallback = filterByResolvedType(fallbackItems);
      const fallbackSorted = sortByDistance(
        ensureDistance(filteredFallback, userLocationRef.current)
      );
      return fallbackSorted;
    }

    return [];
  };

  const setServiceErrorSafe = useCallback((next) => {
    setServiceError((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    if (!initialSnapshot.length) return;
    serviceResultsRef.current = initialSnapshot;
    lastNearbyRef.current[resolvedType] = initialSnapshot;
  }, [initialSnapshot, resolvedType]);

  useEffect(() => {
    if (serviceLoading) return;
    if (serviceQuery.trim()) return;
    if (!serviceResults.length) return;
    writeServiceSnapshotCache(resolvedType, serviceResults, {
      source: "display",
    });
  }, [resolvedType, serviceLoading, serviceQuery, serviceResults]);

  const fetchNearbyServices = async (nextType) => {
    setServiceErrorSafe("");
    setServiceLoading(true);
    setServiceHasInteracted(true);
    serviceAbortRef.current?.abort?.();
    const controller = new AbortController();
    serviceAbortRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      let location = null;
      try {
        location = await (nextType === "temple" ? getTempleUserLocation() : getUserLocation());
        userLocationRef.current = location;
        if (nextType === "temple") {
          console.log("[temples] resolved user location:", location);
        }
      } catch (geoError) {
        userLocationRef.current = null;
        if (nextType === "temple") {
          console.warn("[temples] failed to resolve user location:", geoError);
        }
      }
      let url = "";
      if (nextType === "purohit") {
        const allItems = await fetchAllPurohits(controller);
        const allFiltered = filterByResolvedType(allItems);
        if (location) {
          // Use local backend for nearby purohits
          url = `${LOCAL_API_BASE_URL}/api/purohith/nearby?latitude=${location.lat}&longitude=${location.lng}`;
          const nearbyItems = await fetchServiceList(url, controller.signal);
          const nearbyFiltered = filterByResolvedType(nearbyItems);
          lastActualNearbyCountRef.current[nextType] = nearbyFiltered.length;
          const nearbySorted = sortByDistance(
            ensureDistance(nearbyFiltered, userLocationRef.current)
          );
          const combined = mergeUniqueServices(nearbySorted, allFiltered);
          const ensured = await ensureMinimumResults(nextType, combined, controller);
          const recentFiltered = filterByResolvedType(recentItemsSafe);
          const mergedWithRecent = mergeUniqueServices(recentFiltered, ensured);
          if (requestId !== requestIdRef.current) return;
          setServiceResults(mergedWithRecent);
          lastNearbyRef.current[nextType] = mergedWithRecent;
          writeServiceSnapshotCache(nextType, mergedWithRecent, {
            source: "nearby",
          });
          return;
        }
        lastActualNearbyCountRef.current[nextType] = 0;
        const ensured = await ensureMinimumResults(nextType, allFiltered, controller);
        const recentFiltered = filterByResolvedType(recentItemsSafe);
        const mergedWithRecent = mergeUniqueServices(recentFiltered, ensured);
        if (requestId !== requestIdRef.current) return;
        setServiceResults(mergedWithRecent);
        lastNearbyRef.current[nextType] = mergedWithRecent;
        writeServiceSnapshotCache(nextType, mergedWithRecent, {
          source: "nearby",
        });
        return;
      } else if (nextType === "astrologer") {
        const allItems = await fetchAllAstrologers(controller);
        const allFiltered = filterByResolvedType(allItems);
        if (location) {
          url = `${SERVICE_API_BASE_URL}/api/astrologers/nearby?latitude=${location.lat}&longitude=${location.lng}`;
          const nearbyItems = await fetchServiceList(url, controller.signal);
          const nearbyFiltered = filterByResolvedType(nearbyItems);
          lastActualNearbyCountRef.current[nextType] = nearbyFiltered.length;
          const nearbySorted = sortByDistance(
            ensureDistance(nearbyFiltered, userLocationRef.current)
          );
          const combined = mergeUniqueServices(nearbySorted, allFiltered);
          const ensured = await ensureMinimumResults(nextType, combined, controller);
          const recentFiltered = filterByResolvedType(recentItemsSafe);
          const mergedWithRecent = mergeUniqueServices(recentFiltered, ensured);
          if (requestId !== requestIdRef.current) return;
          setServiceResults(mergedWithRecent);
          lastNearbyRef.current[nextType] = mergedWithRecent;
          writeServiceSnapshotCache(nextType, mergedWithRecent, {
            source: "nearby",
          });
          return;
        }
        lastActualNearbyCountRef.current[nextType] = 0;
        const ensured = await ensureMinimumResults(nextType, allFiltered, controller);
        const recentFiltered = filterByResolvedType(recentItemsSafe);
        const mergedWithRecent = mergeUniqueServices(recentFiltered, ensured);
        if (requestId !== requestIdRef.current) return;
        setServiceResults(mergedWithRecent);
        lastNearbyRef.current[nextType] = mergedWithRecent;
        writeServiceSnapshotCache(nextType, mergedWithRecent, {
          source: "nearby",
        });
        return;
      } else {
        if (!location) {
          lastActualNearbyCountRef.current[nextType] = 0;
          if (nextType === "temple") {
            throw new Error("Location permission denied. Please allow location access to find nearby temples.");
          }
          const fallbackResults = await fetchGeneralServices(nextType, controller);
          if (fallbackResults.length) {
            if (requestId !== requestIdRef.current) return;
            setServiceResults(fallbackResults);
            lastNearbyRef.current[nextType] = fallbackResults;
            writeServiceSnapshotCache(nextType, fallbackResults, {
              source: "fallback",
            });
            return;
          }
          throw new Error("Location permission denied. Please allow location access to find nearby results.");
        }
        if (nextType === "store") {
          url = `${LOCAL_API_BASE_URL}/api/stores/nearby?latitude=${location.lat}&longitude=${location.lng}`;
        } else {
          url = `${LOCAL_API_BASE_URL}/api/temples/nearby?latitude=${location.lat}&longitude=${location.lng}`;
          console.log("[temples] nearby request url:", url);
        }
      }
      const items = await fetchServiceList(url, controller.signal);
      if (nextType === "temple") {
        console.log("[temples] nearby response count:", items.length, items);
      }
      if (import.meta?.env?.DEV) {
        console.debug(`[${nextType}] nearby items:`, items.length);
      }
      const actualNearbyItems = filterByResolvedType(items);
      lastActualNearbyCountRef.current[nextType] = actualNearbyItems.length;
      let sorted = sortByDistance(
        ensureDistance(actualNearbyItems, userLocationRef.current)
      );
      if (nextType === "store") {
        sorted = await ensureMinimumStoreResults(sorted, controller);
      }
      if (import.meta?.env?.DEV) {
        console.debug(`[${nextType}] nearby filtered:`, sorted.length);
      }
      const ensured = await ensureMinimumResults(nextType, sorted, controller);
      const recentFiltered = filterByResolvedType(recentItemsSafe);
      const mergedWithRecent = mergeUniqueServices(recentFiltered, ensured);
      if (requestId !== requestIdRef.current) return;
      setServiceResults(mergedWithRecent);
      lastNearbyRef.current[nextType] = mergedWithRecent;
      writeServiceSnapshotCache(nextType, mergedWithRecent, {
        source: "nearby",
      });
    } catch (err) {
      if (err?.name === "AbortError") return;
      lastActualNearbyCountRef.current[nextType] = 0;
      try {
        if (nextType !== "temple") {
          const fallbackResults = await fetchGeneralServices(nextType, controller);
          if (fallbackResults.length) {
            const recentFiltered = filterByResolvedType(recentItemsSafe);
            const mergedWithRecent = mergeUniqueServices(recentFiltered, fallbackResults);
            if (requestId !== requestIdRef.current) return;
            setServiceResults(mergedWithRecent);
            lastNearbyRef.current[nextType] = mergedWithRecent;
            writeServiceSnapshotCache(nextType, mergedWithRecent, {
              source: "fallback",
            });
            return;
          }
        }
      } catch {
        // Ignore and surface the original error below.
      }

      if (err?.code === 1) {
        setServiceErrorSafe(
          nextType === "temple"
            ? "Location permission denied. Please allow location access to find nearby temples."
            : "Location permission denied. Please allow location access to find nearby results."
        );
      } else {
        setServiceErrorSafe(err?.message || "Unable to fetch nearby results.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setServiceLoading(false);
      }
    }
  };

  const fetchNearbyPurohiths = () => fetchNearbyServices("purohit");
  const fetchNearbyTemples = () => fetchNearbyServices("temple");
  const fetchNearbyStores = () => fetchNearbyServices("store");

  const searchHandler = useCallback((value) => {
    const nextValue = typeof value === "string" ? value : value?.target?.value;
    setIsNoResultsModalOpen(false);
    setServiceQuery(nextValue || "");
  }, []);

  const stopVoiceSearch = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // noop
    }
    recognitionStartingRef.current = false;
    setIsListening(false);
  }, []);

  const startVoiceSearch = useCallback(() => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      alert("Your browser does not support voice input.");
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Voice input is not ready yet.");
      return;
    }

    if (isListening || recognitionStartingRef.current) {
      stopVoiceSearch();
      return;
    }

    try {
      setIsNoResultsModalOpen(false);
      recognition.lang = speechLanguage;
      recognitionStartingRef.current = true;
      recognition.start();
    } catch {
      recognitionStartingRef.current = false;
      setIsListening(false);
    }
  }, [isListening, speechLanguage, stopVoiceSearch]);

  useEffect(() => {
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      setVoiceSupported(false);
      recognitionRef.current = null;
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

    recognition.onerror = (event) => {
      recognitionStartingRef.current = false;
      setIsListening(false);
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        alert("Microphone permission denied");
      }
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        setIsNoResultsModalOpen(false);
        setServiceHasInteracted(true);
        setServiceQuery(transcript);
      }

      try {
        recognition.stop();
      } catch {
        // noop
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
      recognitionRef.current = null;
      recognitionStartingRef.current = false;
    };
  }, [speechLanguage]);

  const searchServices = useCallback(async (nextType, query) => {
    const trimmed = String(query || "").trim();
    const cleaned = trimmed.replace(/\\/g, "").trim();
    if (!cleaned) {
      const fallbackResults =
        lastNearbyRef.current[nextType] ||
        (nextType === "purohit"
          ? allPurohits
          : nextType === "astrologer"
            ? allAstrologers
            : []);
      const recentFiltered = filterByResolvedType(recentItemsSafe);
      const mergedWithRecent = mergeUniqueServices(recentFiltered, fallbackResults || []);
      setServiceResults(mergedWithRecent);
      return;
    }
    setServiceHasInteracted(true);
    const currentResults = serviceResultsRef.current;
    preSearchResultsRef.current = currentResults; // Keep showing these while searching
    setServiceErrorSafe("");
    setServiceLoading(true);
    serviceAbortRef.current?.abort?.();
    const controller = new AbortController();
    serviceAbortRef.current = controller;
    const requestId = ++requestIdRef.current;

    try {
      const url =
        nextType === "purohit"
          ? `${SERVICE_API_BASE_URL}/api/purohits?search=${encodeURIComponent(cleaned)}`
          : nextType === "astrologer"
            ? `${SERVICE_API_BASE_URL}/api/astrologers?search=${encodeURIComponent(cleaned)}`
          : nextType === "store"
            ? `${LOCAL_API_BASE_URL}/api/stores?search=${encodeURIComponent(cleaned)}`
            : `${LOCAL_API_BASE_URL}/api/temples?search=${encodeURIComponent(cleaned)}`;
      const items = await fetchServiceList(url, controller.signal);
      if (requestId !== requestIdRef.current) return;
      const baseItems = filterByResolvedType(items);
      const filtered = baseItems.filter((item) => matchesSearchQuery(item, cleaned));
      const withDistance = ensureDistance(filtered, userLocationRef.current);
      const sorted = sortByDistance(withDistance);
      if (nextType === "purohit") {
        const recentFiltered = filterByResolvedType(recentItemsSafe).filter((item) =>
          matchesSearchQuery(item, cleaned)
        );
        const merged = mergeUniqueServices(recentFiltered, sorted);
        const ensured = await ensureMinimumResults(nextType, merged, controller);
        if (requestId !== requestIdRef.current) return;
        setServiceResults(ensured);
      } else if (nextType === "astrologer") {
        const recentFiltered = filterByResolvedType(recentItemsSafe).filter((item) =>
          matchesSearchQuery(item, cleaned)
        );
        const merged = mergeUniqueServices(recentFiltered, sorted);
        const ensured = await ensureMinimumResults(nextType, merged, controller);
        if (requestId !== requestIdRef.current) return;
        setServiceResults(ensured);
      } else {
        const recentFiltered = filterByResolvedType(recentItemsSafe).filter((item) =>
          matchesSearchQuery(item, cleaned)
        );
        const merged = mergeUniqueServices(recentFiltered, sorted);
        if (requestId !== requestIdRef.current) return;
        setServiceResults(merged);
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      setServiceErrorSafe(err?.message || "Unable to search results.");
    } finally {
      if (requestId === requestIdRef.current) {
        setServiceLoading(false);
      }
    }
  // The callback deliberately tracks the current search helpers and cached datasets.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allPurohits,
    allAstrologers,
    filterByResolvedType,
    recentItemsSafe,
    setServiceErrorSafe,
  ]);

  const visibleResults = useMemo(() => {
    if (serviceLoading) {
      return preSearchResultsRef.current.length > 0
        ? preSearchResultsRef.current
        : serviceResults;
    }
    return serviceResults;
  }, [serviceLoading, serviceResults]);

  const hasNoResultsModal = Boolean(noResultsModalConfig);

  useEffect(() => {
    const shouldOpenNoResultsModal =
      hasNoResultsModal &&
      debouncedQuery.trim().length > 0 &&
      !serviceLoading &&
      serviceResults.length === 0 &&
      Number(lastActualNearbyCountRef.current[resolvedType] || 0) === 0;

    setIsNoResultsModalOpen(shouldOpenNoResultsModal);
  }, [
    debouncedQuery,
    hasNoResultsModal,
    resolvedType,
    serviceLoading,
    serviceResults.length,
  ]);

  const renderCards = () => {
    const hasResults = visibleResults.length > 0;
    // Check actual search results to determine if truly no results (not just showing previous ones)
    const hasActualResults = serviceResults.length > 0;
    // Show empty state only when search is complete AND no results AND a search query exists
    const showEmptyState = !hasActualResults && !serviceLoading && debouncedQuery.trim().length > 0;

    return (
      <div className="grid gap-3">
        {serviceError ? (
          <div
            className="rounded-xl px-3 py-3 text-xs font-semibold"
            style={{
              background: "linear-gradient(135deg, rgba(90, 30, 20, 0.8) 0%, rgba(140, 60, 30, 0.85) 100%)",
              border: "2px solid rgba(255, 160, 90, 0.6)",
              color: "#FFE4B5",
            }}
          >
            {serviceError}
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="rounded-xl px-3 py-3 text-xs font-semibold" style={{ color: "#FFE4B5" }}>
            {serviceHasInteracted
              ? "No results found."
              : resolvedType === "store"
                ? "Select Pooja Store to load nearby results."
                : resolvedType === "astrologer"
                  ? "Select Astrologers to load nearby results."
                : "Select Purohit or Temple to load nearby results."}
          </div>
        ) : (
          <>
            {serviceLoading && !hasResults ? (
              <div
                className="rounded-2xl p-3"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20, 10, 6, 0.5) 0%, rgba(35, 16, 9, 0.65) 100%)",
                  border: "2px solid rgba(255, 170, 90, 0.55)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.28)",
                }}
              >
                <div className="flex items-center justify-center py-3">
                  <div className="text-[11px] font-semibold" style={{ color: "#FFD9A3" }}>
                    ⟳ Searching...
                  </div>
                </div>
              </div>
            ) : null}

            {visibleResults.map((item, index) => (
              <ServiceCard
                key={getStableItemKey(item, index)}
                item={item}
                resolvedType={resolvedType}
                transparent={transparent}
                clickable
                onClick={() => {
                  const identifier = getServiceIdentifier(item, index);
                  const detailRoute =
                    resolvedType === "purohit"
                      ? "/purohith"
                      : resolvedType === "astrologer"
                        ? "/astrologers"
                      : resolvedType === "store"
                        ? "/pooja-stores"
                        : "/temples";
                  const detailPath = `${detailRoute}/${encodeURIComponent(identifier)}`;
                  try {
                    window.sessionStorage.setItem(
                      `panchang:service-detail:${resolvedType}:${identifier}`,
                      JSON.stringify({ ...item, serviceType: resolvedType })
                    );
                    if (resolvedType === "purohit") {
                      window.sessionStorage.setItem(
                        `panchang:purohith-detail:${identifier}`,
                        JSON.stringify(item)
                      );
                    }
                  } catch {
                    // Ignore storage failures and still navigate with in-memory state.
                  }
                  navigate(detailPath, {
                    state: {
                      service: { ...item, serviceType: resolvedType },
                      serviceType: resolvedType,
                      from: detailRoute,
                    },
                  });
                }}
              />
            ))}

            {serviceLoading && hasResults ? (
              <div
                className="rounded-2xl p-3"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20, 10, 6, 0.5) 0%, rgba(35, 16, 9, 0.65) 100%)",
                  border: "2px solid rgba(255, 170, 90, 0.55)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.28)",
                }}
              >
                <div className="flex items-center justify-center py-3">
                  <div className="text-[11px] font-semibold" style={{ color: "#FFD9A3" }}>
                    ⟳ Loading more results...
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (resolvedType === "purohit") {
      fetchNearbyPurohiths();
    } else if (resolvedType === "astrologer") {
      fetchNearbyServices("astrologer");
    } else if (resolvedType === "store") {
      fetchNearbyStores();
    } else {
      fetchNearbyTemples();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedType]);

  // Merge recent items when they change
  useEffect(() => {
    if (resolvedType !== "purohit" && resolvedType !== "store" && resolvedType !== "astrologer") return;
    if (!recentItemsSafe.length) return;
    const recentFiltered = filterByResolvedType(recentItemsSafe);
    if (!recentFiltered.length) return;
    setServiceResults((prev) => mergeUniqueServices(recentFiltered, prev || []));
    lastNearbyRef.current[resolvedType] = mergeUniqueServices(
      recentFiltered,
      lastNearbyRef.current[resolvedType] || []
    );
  }, [recentItemsSafe, resolvedType, filterByResolvedType]);

  // Effect for debounced search queries
  useEffect(() => {
    serviceResultsRef.current = serviceResults;
  }, [serviceResults]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) {
      // Always merge recentItems back so newly-added purohiths aren't lost on search clear
      const base = lastNearbyRef.current[resolvedType] || [];
      if ((resolvedType === "purohit" || resolvedType === "store" || resolvedType === "astrologer") && recentItemsSafe.length > 0) {
        const recentFiltered = filterByResolvedType(recentItemsSafe);
        setServiceResults(mergeUniqueServices(recentFiltered, base));
      } else {
        setServiceResults(base);
      }
      return;
    }
    searchServices(resolvedType, query);
  }, [debouncedQuery, resolvedType, recentItemsSafe, filterByResolvedType, searchServices]);

  return (
    <>
      <div
        className="w-full min-w-0 overflow-hidden rounded-2xl p-3 backdrop-blur-md"
        style={{
          background: transparent
            ? "transparent"
            : "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)",
          border: "1.5px solid rgba(255, 183, 77, 0.4)",
          boxShadow: transparent
            ? "0 0 18px rgba(255, 140, 50, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.12)"
            : "0 0 25px rgba(120, 58, 26, 0.55), inset 0 0 18px rgba(170, 94, 43, 0.2)",
        }}
      >
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold uppercase tracking-wide" style={{ color: "#FFE4B5" }}>
            {title}
          </div>
          {subtitle ? (
            <div className="text-[11px]" style={{ color: "#FFD9A3" }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={serviceQuery}
              onChange={searchHandler}
              placeholder="Search by name or place"
              className="w-full min-w-0 rounded-lg py-2 pl-3 pr-11 text-xs font-semibold outline-none"
              style={{
                background: transparent
                  ? "transparent"
                  : "linear-gradient(180deg, rgba(255, 230, 200, 0.12) 0%, rgba(255, 200, 160, 0.08) 100%)",
                border: "1.5px solid rgba(255, 183, 77, 0.4)",
                color: "#FFEFD4",
                boxShadow: transparent
                  ? "0 0 10px rgba(255, 170, 90, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                  : undefined,
              }}
            />
            <button
              type="button"
              onClick={startVoiceSearch}
              disabled={!voiceSupported}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition"
              style={{
                background: isListening
                  ? "linear-gradient(180deg, rgba(255, 87, 87, 0.95) 0%, rgba(190, 40, 40, 0.95) 100%)"
                  : "transparent",
                color: voiceSupported ? (isListening ? "#ffffff" : "#ffedb3") : "rgba(255, 237, 179, 0.45)",
                opacity: voiceSupported ? 1 : 0.7,
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
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0a7 7 0 0 1-6 6.93V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.07A7 7 0 0 1 5 12a1 1 0 1 1 2 0a5 5 0 0 0 10 0Z" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => searchServices(resolvedType, serviceQuery)}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide"
            style={{
              background: transparent ? "transparent" : "var(--calendar-orange-gradient)",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              color: "#ffedb3",
              boxShadow: transparent
                ? "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                : undefined,
            }}
          >
            Search
          </button>
        </div>

        <div
          className="mt-3 max-h-[55vh] overflow-x-hidden overflow-y-auto pr-1"
          style={{
            scrollbarColor: "rgba(255, 170, 90, 0.7) rgba(40, 18, 10, 0.4)",
          }}
        >
          {renderCards()}
        </div>
      </div>

      <NoResultsModal
        isOpen={isNoResultsModalOpen}
        onClose={() => setIsNoResultsModalOpen(false)}
        title={noResultsModalConfig?.title}
        message={noResultsModalConfig?.message}
        actionLabel={noResultsModalConfig?.actionLabel}
        onAction={noResultsModalConfig?.onAction}
      />
    </>
  );
}

export default memo(ServiceSearchPanel);
