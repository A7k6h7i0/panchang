import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import PageShell from "./PageShell";
import { readServiceSnapshotCache } from "../services/serviceApiCache";
import { getStableItemKey } from "../utils/getStableItemKey";
import {
  buildDirectionsLink,
  buildMapsLink,
  collectServiceDetailImageUrls,
  getServiceAddress,
  getServiceDescription,
  getServiceDisplayName,
  getServicePhone,
  getServiceRatingLabel,
  getServiceWebsite,
  getServiceWorkdayTiming,
} from "../utils/serviceItemDetails";

function serviceLabel(serviceType) {
  const normalized = String(serviceType || "").toLowerCase();
  if (normalized === "purohit") return "Purohith";
  if (normalized === "astrologer") return "Astrologer";
  if (normalized === "store") return "Pooja Store";
  return "Temple";
}

function defaultBackTo(serviceType) {
  const normalized = String(serviceType || "").toLowerCase();
  if (normalized === "purohit") return "/purohith";
  if (normalized === "astrologer") return "/astrologers";
  if (normalized === "store") return "/pooja-stores";
  return "/temples";
}

function resolveStoredService(identifier, serviceType) {
  if (typeof window === "undefined" || !identifier) return null;

  const normalizedType = String(serviceType || "").toLowerCase();

  try {
    const nextKey = `panchang:service-detail:${normalizedType}:${identifier}`;
    const stored = window.sessionStorage.getItem(nextKey);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore storage errors and fall back to cached snapshots.
  }

  if (normalizedType === "purohit") {
    try {
      const stored = window.sessionStorage.getItem(`panchang:purohith-detail:${identifier}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore storage errors and fall back to cached snapshots.
    }
  }

  const snapshot = readServiceSnapshotCache(normalizedType)?.items || [];
  return snapshot.find((item, index) => getStableItemKey(item, index) === identifier) || null;
}

function RatingPill({ value }) {
  const numericRating = Number(value);
  const clampedRating = Number.isFinite(numericRating)
    ? Math.max(0, Math.min(5, numericRating))
    : 0;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black"
      style={{
        background: "linear-gradient(135deg, rgba(255, 214, 102, 0.2) 0%, rgba(255, 164, 66, 0.3) 100%)",
        border: "1.5px solid rgba(255, 196, 108, 0.34)",
        color: "#FFF4DB",
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <span aria-hidden="true" className="text-[13px] leading-none text-[#FFC933]">
        {"\u2605"}
      </span>
      <span>{clampedRating ? clampedRating.toFixed(1).replace(/\.0$/, "") : "N/A"}</span>
    </div>
  );
}

function CallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7.6 3.2c.6-.3 1.3-.1 1.7.4l2.1 2.7c.4.5.4 1.2 0 1.7l-1.3 1.5c-.2.3-.3.7-.1 1 .7 1.3 1.6 2.4 2.8 3.2.3.2.7.2 1-.1l1.5-1.3c.5-.4 1.2-.4 1.7 0l2.7 2.1c.6.4.7 1.1.4 1.7-.8 1.5-2.2 2.5-3.9 2.7-2.7.4-6.1-.8-9.1-3.8S2.3 9.7 2.7 7c.2-1.7 1.2-3.1 2.7-3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 2 3 11l6.2.3L9.5 21 18 11.5 12 2Zm-1.2 7.3c.5-.5 1.5-.5 2 0 .5.5.5 1.5 0 2-.5.5-1.5.5-2 0-.5-.5-.5-1.5 0-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm6.9 9h-3.1a15.7 15.7 0 0 0-1-5.2A8 8 0 0 1 18.9 11ZM12 4c.9 1.1 1.8 3.3 2.2 7H9.8C10.2 7.3 11.1 5.1 12 4ZM4.3 13h3.1a15.7 15.7 0 0 0 1 5.2A8 8 0 0 1 4.3 13Zm3.1-2H4.3a8 8 0 0 1 4.1-5.2A15.7 15.7 0 0 0 7.4 11Zm4.6 7.9c-.9-1.1-1.8-3.3-2.2-7h4.4c-.4 3.7-1.3 5.9-2.2 7Zm2.8-.7a15.7 15.7 0 0 0 1-5.2h3.1a8 8 0 0 1-4.1 5.2ZM14.1 11c-.2-2-.6-3.8-1.2-5.1 1.8.4 3.3 1.8 4.1 5.1Zm-3-5.1c-.6 1.3-1 3.1-1.2 5.1H5.8a8 8 0 0 1 5.3-5.1Zm0 8.2c.2 2 .6 3.8 1.2 5.1-1.8-.4-3.3-1.8-4.1-5.1Zm3 5.1c.6-1.3 1-3.1 1.2-5.1h3.1a8 8 0 0 1-4.3 5.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ActionTile({ href, onClick, label, icon, background, disabled = false, external = false }) {
  const sharedProps = external ? { target: "_blank", rel: "noreferrer" } : {};

  return (
    <div className="flex flex-col items-center gap-1">
      <a
        href={disabled ? undefined : href}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        className="group flex h-9 w-9 items-center justify-center rounded-[9px] text-center transition hover:scale-[1.03] sm:h-10 sm:w-10"
        style={{
          background,
          border: "1px solid rgba(255, 205, 148, 0.28)",
          color: "#FFF6E6",
          opacity: disabled ? 0.55 : 1,
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
        {...sharedProps}
      >
        {icon}
      </a>
      <div
          className="text-center text-[8px] font-black uppercase tracking-[0.14em] sm:text-[9px]"
        style={{
          color: "#FFE2B0",
          maxWidth: label.length > 12 ? "72px" : "auto",
          whiteSpace: label.length > 12 ? "normal" : "nowrap",
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
    </div>
    );
  }

export default function ServiceDetailPage({
  serviceType = "purohit",
  pageTitle,
  backTo,
  backLabel,
}) {
  const location = useLocation();
  const params = useParams();
  const serviceId = params.serviceId || params.purohithId || params.itemId || "";
  const resolvedType = String(serviceType || "purohit").toLowerCase();
  const decodedId = useMemo(() => decodeURIComponent(serviceId), [serviceId]);

  const storedService = useMemo(() => {
    return location.state?.service || location.state?.purohith || resolveStoredService(decodedId, resolvedType);
  }, [decodedId, location.state, resolvedType]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const name = getServiceDisplayName(storedService);
  const address = getServiceAddress(storedService);
  const rating = getServiceRatingLabel(storedService);
  const phone = getServicePhone(storedService);
  const description = getServiceDescription(storedService);
  const website = getServiceWebsite(storedService);
  const workdayTiming = getServiceWorkdayTiming(storedService);
  const mapsLink = buildMapsLink(address || name);
  const directionsLink = buildDirectionsLink(address || name);
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address || name || "")}&z=15&output=embed`;
  const imageUrls = collectServiceDetailImageUrls(storedService, resolvedType);
  const fallbackInitials = String(name || serviceLabel(resolvedType)).slice(0, 2).toUpperCase();
  const swipeStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (imageUrls.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % imageUrls.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [imageUrls.length]);

  const resolvedBackTo = backTo || defaultBackTo(resolvedType);
  const resolvedTitle = pageTitle || name || serviceLabel(resolvedType);
  const resolvedBackLabel = backLabel || `Back to ${serviceLabel(resolvedType)}s`;

  const handleSwipeStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleSwipeEnd = (event) => {
    if (imageUrls.length <= 1) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - swipeStartRef.current.x;
    const deltaY = touch.clientY - swipeStartRef.current.y;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0) {
      setActiveImageIndex((prev) => (prev + 1) % imageUrls.length);
    } else {
      setActiveImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    }
  };

  if (!storedService) {
    return (
      <PageShell title={resolvedTitle} transparent backTo={resolvedBackTo}>
        <div
          className="mx-auto max-w-4xl rounded-3xl p-5"
          style={{
            background: "linear-gradient(180deg, rgba(20, 10, 6, 0.62) 0%, rgba(35, 16, 9, 0.76) 100%)",
            border: "1.5px solid rgba(255, 183, 77, 0.35)",
            color: "#FFF4DB",
          }}
        >
          <div className="text-lg font-black">{serviceLabel(resolvedType)} details not available.</div>
          <div className="mt-2 text-sm" style={{ color: "#FFD9A3" }}>
            Return to the list and open it again.
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={resolvedTitle} transparent backTo={resolvedBackTo} backLabel={resolvedBackLabel}>
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <section
          className="overflow-hidden rounded-[28px]"
          style={{
            background: "linear-gradient(180deg, rgba(20, 10, 6, 0.68) 0%, rgba(35, 16, 9, 0.82) 100%)",
            border: "1.5px solid rgba(255, 183, 77, 0.35)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            className="relative h-[250px] overflow-hidden sm:h-72 md:h-80"
            onTouchStart={handleSwipeStart}
            onTouchEnd={handleSwipeEnd}
          >
            <div className="absolute right-4 top-4 z-10">
              <RatingPill value={rating} />
            </div>
            {imageUrls[activeImageIndex] ? (
              <img
                src={imageUrls[activeImageIndex]}
                alt={name || serviceLabel(resolvedType)}
                className="h-full w-full object-cover bg-black/20"
                style={{ display: "block", objectPosition: "center center" }}
                onError={(event) => {
                  const parent = event.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = "";
                    parent.innerHTML = `
                      <div style="display:flex;height:100%;width:100%;align-items:center;justify-content:center;background:linear-gradient(135deg, rgba(255, 245, 218, 0.98) 0%, rgba(255, 224, 160, 0.96) 52%, rgba(255, 201, 122, 0.92) 100%);color:#8B4513;font-size:1.75rem;font-weight:900;">
                        ${fallbackInitials}
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div
                className="flex h-full items-center justify-center text-4xl font-black"
                style={{
                  background: "linear-gradient(135deg, rgba(255, 245, 218, 0.98) 0%, rgba(255, 224, 160, 0.96) 52%, rgba(255, 201, 122, 0.92) 100%)",
                  color: "#8B4513",
                }}
              >
                {String(name || "PU").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="px-4 pb-4 pt-3">
            <div className="text-lg font-black sm:text-xl" style={{ color: "#FFF7E9" }}>
              {name || serviceLabel(resolvedType)}
            </div>
            {address ? (
              <div className="mt-1 text-[12px] leading-5 sm:text-sm" style={{ color: "#FFD9A3" }}>
                {address}
              </div>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              <ActionTile
                href={phone ? `tel:${phone}` : ""}
                label="Call"
                icon={<CallIcon />}
                background="linear-gradient(135deg, rgba(112, 79, 30, 0.98) 0%, rgba(77, 51, 17, 0.98) 100%)"
                disabled={!phone}
              />
              <ActionTile
                href={directionsLink}
                label="Directions"
                icon={<DirectionsIcon />}
                background="linear-gradient(135deg, rgba(38, 95, 173, 0.98) 0%, rgba(25, 74, 145, 0.98) 100%)"
                external
                disabled={!address && !name}
              />
              <ActionTile
                href={website || ""}
                label={website ? "Website" : "Website not available"}
                icon={<WebsiteIcon />}
                background="linear-gradient(135deg, rgba(90, 90, 90, 0.98) 0%, rgba(55, 55, 55, 0.98) 100%)"
                external={Boolean(website)}
                disabled={!website}
              />
            </div>
          </div>
        </section>

        <section
          className="rounded-[28px] p-4"
          style={{
            background: "linear-gradient(180deg, rgba(20, 10, 6, 0.62) 0%, rgba(35, 16, 9, 0.76) 100%)",
            border: "1.5px solid rgba(255, 183, 77, 0.35)",
          }}
        >
          <div className="space-y-4">
            <div
              className="rounded-3xl p-4"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1.5px solid rgba(255, 183, 77, 0.24)",
              }}
            >
              <div className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: "#FFD39A" }}>
                Quick Facts
              </div>
              <div className="mt-3 space-y-3 text-sm" style={{ color: "#FFF1D6" }}>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD39A" }}>
                    Phone
                  </div>
                  <div className="mt-1">{phone || "Not available"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD39A" }}>
                    Address
                  </div>
                  <div className="mt-1">{address || "Address not available"}</div>
                </div>
                {workdayTiming ? (
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD39A" }}>
                      Timings
                    </div>
                    <div className="mt-1">{workdayTiming}</div>
                  </div>
                ) : null}
              </div>
            </div>

            {(address || name) ? (
              <div
                className="rounded-3xl p-4"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1.5px solid rgba(255, 183, 77, 0.24)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: "#FFD39A" }}>
                    Location Map
                  </div>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{
                      border: "1.5px solid rgba(255, 183, 77, 0.24)",
                      color: "#FFE4B5",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    Open Maps
                  </a>
                </div>
                <div className="mt-3 overflow-hidden rounded-3xl" style={{ border: "1.5px solid rgba(255, 183, 77, 0.24)" }}>
                  <iframe
                    title={`${name || serviceLabel(resolvedType)} location map`}
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-[240px] w-full border-0"
                  />
                </div>
              </div>
            ) : null}

            <div
              className="rounded-3xl p-4"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1.5px solid rgba(255, 183, 77, 0.24)",
              }}
            >
              <div className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: "#FFD39A" }}>
                Information
              </div>
              <div className="mt-3 text-sm leading-7" style={{ color: "#FFF1D6" }}>
                {description || "Not available"}
              </div>
            </div>
          </div>
        </section>
        <div className="flex justify-end">
          <Link
            to={resolvedBackTo}
            className="rounded-2xl px-4 py-2 text-xs font-black"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255, 183, 77, 0.4)",
              color: "#FFE4B5",
              boxShadow: "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
          >
            Back
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
