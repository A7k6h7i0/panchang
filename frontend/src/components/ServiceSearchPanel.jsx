import { useEffect, useRef, useState } from "react";

const SERVICE_API_BASE_URL =
  import.meta.env.VITE_HINDU_SEARCH_API_BASE_URL ||
  "https://hindu-search.digitalleadpro.com";

function normalizeServiceItems(payload) {
  if (!payload) return [];
  if (Array.isArray(payload?.data)) return payload.data;
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

function formatDistanceKm(distance) {
  const value = Number(distance);
  if (!Number.isFinite(value)) return "";
  const km = value / 1000;
  return `${km.toFixed(2)} km`;
}

function buildMapsLink(text) {
  const query = encodeURIComponent(String(text || "").trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function ServiceSpinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold" style={{ color: "#FFE4B5" }}>
      <span
        className="inline-flex h-4 w-4 animate-spin rounded-full"
        style={{
          border: "2px solid rgba(255, 200, 120, 0.45)",
          borderTopColor: "rgba(255, 255, 255, 0.95)",
        }}
      />
      {label}
    </div>
  );
}

function textOf(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return (
      String(
        value?.name ??
        value?.vedic_name ??
        value?.title ??
        value?.value ??
        value?.label ??
        value?.display_name ??
        ""
      ).trim()
    );
  }
  return "";
}

function firstText(...values) {
  for (const v of values) {
    const t = textOf(v);
    if (t) return t;
  }
  return "";
}

function matchesKeyword(value, pattern) {
  if (!value) return false;
  return pattern.test(String(value));
}

function shouldPreferTypeFilter(items, predicate) {
  return items.some((item) => predicate(item));
}

export default function ServiceSearchPanel({ serviceType, title, subtitle }) {
  const normalizedType = String(serviceType || "").toLowerCase();
  const resolvedType = normalizedType.startsWith("puroh") ? "purohit" : "temple";
  const [serviceResults, setServiceResults] = useState([]);
  const [serviceError, setServiceError] = useState("");
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceHasInteracted, setServiceHasInteracted] = useState(false);
  const serviceAbortRef = useRef(null);
  const lastNearbyRef = useRef({ purohit: [], temple: [] });

  const typePredicate = (item) => {
    const name = firstText(item?.name, item?.title, item?.display_name);
    const meta = firstText(item?.category, item?.type, item?.service_type, item?.tags);
    if (resolvedType === "purohit") {
      const purohitPattern = /purohit|purohith|purohita|purohitam|pandit|priest|pujari|acharya|aacharya|archaka/i;
      return matchesKeyword(name, purohitPattern) || matchesKeyword(meta, purohitPattern);
    }
    const templePattern = /temple|mandir|devalayam|alayam|kovil|kshetram|swamy|swami|devi|devasthanam/i;
    return matchesKeyword(name, templePattern) || matchesKeyword(meta, templePattern);
  };

  const filterByResolvedType = (items) => {
    if (!Array.isArray(items) || items.length === 0) return items;
    if (!shouldPreferTypeFilter(items, typePredicate)) return items;
    return items.filter((item) => typePredicate(item));
  };

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
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });

  const fetchServiceList = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error("Unable to fetch nearby results.");
    }
    const payload = await response.json();
    return normalizeServiceItems(payload);
  };

  const fetchNearbyServices = async (nextType) => {
    setServiceError("");
    setServiceLoading(true);
    setServiceHasInteracted(true);
    serviceAbortRef.current?.abort?.();
    const controller = new AbortController();
    serviceAbortRef.current = controller;

    try {
      const location = await getUserLocation();
      const path = nextType === "purohit" ? "purohits" : "temples";
      const url = `${SERVICE_API_BASE_URL}/api/${path}/nearby?latitude=${location.lat}&longitude=${location.lng}`;
      const items = await fetchServiceList(url, controller.signal);
      const sorted = sortByDistance(filterByResolvedType(items));
      setServiceResults(sorted);
      lastNearbyRef.current[nextType] = sorted;
    } catch (err) {
      if (err?.name === "AbortError") return;
      if (err?.code === 1) {
        setServiceError("Location permission denied. Please allow location access to find nearby results.");
      } else {
        setServiceError(err?.message || "Unable to fetch nearby results.");
      }
      setServiceResults([]);
    } finally {
      setServiceLoading(false);
    }
  };

  const fetchNearbyPurohiths = () => fetchNearbyServices("purohit");
  const fetchNearbyTemples = () => fetchNearbyServices("temple");

  const searchHandler = (value) => {
    const nextValue = typeof value === "string" ? value : value?.target?.value;
    setServiceQuery(nextValue || "");
  };

  const searchServices = async (nextType, query) => {
    const trimmed = String(query || "").trim();
    if (!trimmed) {
      setServiceResults(lastNearbyRef.current[nextType] || []);
      return;
    }
    setServiceHasInteracted(true);
    setServiceError("");
    setServiceLoading(true);
    serviceAbortRef.current?.abort?.();
    const controller = new AbortController();
    serviceAbortRef.current = controller;

    try {
      const path = nextType === "purohit" ? "purohits" : "temples";
      const url = `${SERVICE_API_BASE_URL}/api/${path}?search=${encodeURIComponent(trimmed)}`;
      const items = await fetchServiceList(url, controller.signal);
      setServiceResults(sortByDistance(filterByResolvedType(items)));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setServiceError(err?.message || "Unable to search results.");
      setServiceResults([]);
    } finally {
      setServiceLoading(false);
    }
  };

  const renderCards = () => {
    if (serviceLoading) {
      return <ServiceSpinner label="Loading nearby results..." />;
    }

    if (serviceError) {
      return (
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
      );
    }

    if (!serviceResults.length) {
      return (
        <div className="rounded-xl px-3 py-3 text-xs font-semibold" style={{ color: "#FFE4B5" }}>
          {serviceHasInteracted
            ? "No results found."
            : "Select Purohit or Temple to load nearby results."}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {serviceResults.map((item, index) => {
          const name = firstText(item?.name, item?.title, item?.display_name);
          const address = firstText(item?.address, item?.location, item?.area, item?.place);
          const rating = firstText(item?.rating, item?.rating_value, item?.average_rating);
          const phone = firstText(item?.phone, item?.phone_number, item?.mobile, item?.contact);
          const distance = formatDistanceKm(item?.distance);
          const mapsLink = buildMapsLink(address || name);
          const hasPhone = Boolean(phone);
          const hasMaps = Boolean(address || name);

          return (
            <div
              key={`${name || "result"}-${index}`}
              className="rounded-2xl p-3"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20, 10, 6, 0.5) 0%, rgba(35, 16, 9, 0.65) 100%)",
                border: "2px solid rgba(255, 170, 90, 0.55)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.28)",
              }}
            >
              <div className="text-sm font-bold" style={{ color: "#FFF4DB" }}>
                {name || "Unknown"}
              </div>
              <div className="mt-1 text-xs" style={{ color: "#FFE4B5" }}>
                {address || "Address not available"}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-[11px]" style={{ color: "#FFD9A3" }}>
                <span>⭐ {rating || "N/A"}</span>
                {distance ? <span>📍 {distance} away</span> : null}
                <span>📞 {phone || "Not available"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={hasPhone ? `tel:${phone}` : undefined}
                  onClick={(event) => {
                    if (!hasPhone) event.preventDefault();
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold"
                  aria-disabled={!hasPhone}
                  style={{
                    background: "var(--calendar-orange-gradient)",
                    border: "2px solid rgba(212, 168, 71, 0.8)",
                    color: "#ffedb3",
                    opacity: hasPhone ? 1 : 0.55,
                  }}
                >
                  Call
                </a>
                <a
                  href={hasMaps ? mapsLink : undefined}
                  onClick={(event) => {
                    if (!hasMaps) event.preventDefault();
                  }}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-3 py-1.5 text-xs font-bold"
                  aria-disabled={!hasMaps}
                  style={{
                    background: "linear-gradient(135deg, rgba(42, 90, 31, 0.95) 0%, rgba(90, 150, 69, 0.95) 100%)",
                    border: "2px solid rgba(212, 168, 71, 0.8)",
                    color: "#ffedb3",
                    opacity: hasMaps ? 1 : 0.55,
                  }}
                >
                  Directions
                </a>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (resolvedType === "purohit") {
      fetchNearbyPurohiths();
    } else {
      fetchNearbyTemples();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedType]);

  useEffect(() => {
    const query = serviceQuery.trim();
    if (!query) {
      setServiceResults(lastNearbyRef.current[resolvedType] || []);
      return;
    }
    const timeout = setTimeout(() => {
      searchServices(resolvedType, query);
    }, 350);
    return () => clearTimeout(timeout);
  }, [serviceQuery, resolvedType]);

  return (
    <div
      className="rounded-2xl p-3 backdrop-blur-md"
      style={{
        background:
          "linear-gradient(180deg, rgba(10, 6, 4, 0.28) 0%, rgba(20, 10, 6, 0.42) 100%), url(\"/backgroundImage.png\"), linear-gradient(135deg, rgba(74, 33, 16, 0.98) 0%, rgba(92, 42, 21, 0.95) 50%, rgba(112, 54, 27, 0.92) 100%)",
        border: "3px solid rgba(255, 140, 50, 0.7)",
        boxShadow: "0 0 25px rgba(120, 58, 26, 0.55), inset 0 0 18px rgba(170, 94, 43, 0.2)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold uppercase tracking-wide" style={{ color: "#FFE4B5" }}>
          {title}
        </div>
        {subtitle ? (
          <div className="text-[11px]" style={{ color: "#FFD9A3" }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={serviceQuery}
          onChange={searchHandler}
          placeholder="Search by name or place"
          className="w-full flex-1 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
          style={{
            background: "linear-gradient(180deg, rgba(255, 230, 200, 0.12) 0%, rgba(255, 200, 160, 0.08) 100%)",
            border: "2px solid rgba(255, 170, 90, 0.6)",
            color: "#FFEFD4",
          }}
        />
        <button
          type="button"
          onClick={() => searchServices(resolvedType, serviceQuery)}
          className="rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide"
          style={{
            background: "var(--calendar-orange-gradient)",
            border: "2px solid rgba(212, 168, 71, 0.8)",
            color: "#ffedb3",
          }}
        >
          Search
        </button>
      </div>

      <div
        className="mt-3 max-h-[55vh] overflow-y-auto pr-1"
        style={{
          scrollbarColor: "rgba(255, 170, 90, 0.7) rgba(40, 18, 10, 0.4)",
        }}
      >
        {renderCards()}
      </div>
    </div>
  );
}
