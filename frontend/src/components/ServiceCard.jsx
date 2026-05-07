import { memo } from "react";
import {
  buildDirectionsLink,
  getServiceAddress,
  getServiceDisplayName,
  getServiceRatingLabel,
  initialsFromName,
  pickServiceImageUrl,
} from "../utils/serviceItemDetails";

const SHARED_BORDER = "1.5px solid rgba(255, 183, 77, 0.4)";

function ServiceCardComponent({ item, resolvedType, transparent = false, onClick, clickable = false }) {
  const name = getServiceDisplayName(item);
  const address = getServiceAddress(item);
  const rating = getServiceRatingLabel(item);
  const directionsLink = buildDirectionsLink(address || name);
  const hasPhone = Boolean(item?.phone || item?.phone_number || item?.mobile || item?.contact);
  const phone = item?.phone || item?.phone_number || item?.mobile || item?.contact;
  const hasMaps = Boolean(address || name);
  const imageUrl = pickServiceImageUrl(item);
  const fallbackInitials = initialsFromName(name);
  const fallbackAlt =
    resolvedType === "purohit"
      ? "Purohith"
      : resolvedType === "astrologer"
        ? "Astrologer"
      : resolvedType === "store"
        ? "Pooja Store"
        : "Temple";

  return (
    <div
      className={`w-full min-w-0 overflow-hidden rounded-2xl p-3 ${clickable ? "cursor-pointer transition hover:scale-[1.01]" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!clickable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event);
        }
      }}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={{
        background: transparent
          ? "transparent"
          : "linear-gradient(180deg, rgba(20, 10, 6, 0.5) 0%, rgba(35, 16, 9, 0.65) 100%)",
        border: SHARED_BORDER,
        boxShadow: transparent
          ? "0 4px 15px rgba(255, 107, 53, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.16), inset 0 -1px 0 rgba(139, 69, 19, 0.14)"
          : "0 8px 20px rgba(0, 0, 0, 0.28)",
      }}
    >
      <div className="flex w-full min-w-0 gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl text-xs font-black"
          style={{
            background: imageUrl
              ? (transparent
                  ? "linear-gradient(135deg, rgba(255, 170, 90, 0.18) 0%, rgba(255, 120, 50, 0.22) 100%)"
                  : "linear-gradient(135deg, rgba(255, 170, 90, 0.3) 0%, rgba(255, 120, 50, 0.35) 100%)")
              : "linear-gradient(135deg, rgba(255, 245, 218, 0.98) 0%, rgba(255, 224, 160, 0.96) 52%, rgba(255, 201, 122, 0.92) 100%)",
            border: SHARED_BORDER,
            color: imageUrl ? "#FFE4B5" : "#8B4513",
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name || fallbackAlt}
              className="h-full w-full object-contain p-0.5"
              loading="lazy"
              onError={(event) => {
                const parent = event.currentTarget.parentElement;
                event.currentTarget.style.display = "none";
                if (parent) {
                  parent.textContent = fallbackInitials;
                }
              }}
            />
          ) : (
            <span>{fallbackInitials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold" style={{ color: "#FFF4DB" }}>
                {name || "Unknown"}
              </div>
              <div className="mt-1 break-words text-xs leading-5" style={{ color: "#FFE4B5" }}>
                {address || "Address not available"}
              </div>
            </div>

            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black"
              style={{
                background: "linear-gradient(135deg, rgba(255, 214, 102, 0.18) 0%, rgba(255, 164, 66, 0.28) 100%)",
                border: SHARED_BORDER,
                color: "#FFF1BE",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <span aria-hidden="true">{"\u2605"}</span>
              <span>{rating}</span>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        <a
          href={hasPhone ? `tel:${phone}` : undefined}
          onClick={(event) => {
            event.stopPropagation();
            if (!hasPhone) event.preventDefault();
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-bold"
          aria-disabled={!hasPhone}
          style={{
            background: transparent
              ? "transparent"
              : "var(--calendar-orange-gradient)",
            border: SHARED_BORDER,
            color: "#ffedb3",
            opacity: hasPhone ? 1 : 0.55,
            boxShadow: transparent
              ? "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
              : undefined,
          }}
        >
          Call
        </a>
        <a
          href={hasMaps ? directionsLink : undefined}
          onClick={(event) => {
            event.stopPropagation();
            if (!hasMaps) event.preventDefault();
          }}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg px-3 py-1.5 text-xs font-bold"
          aria-disabled={!hasMaps}
          style={{
            background: transparent
              ? "transparent"
              : "linear-gradient(135deg, rgba(42, 90, 31, 0.95) 0%, rgba(90, 150, 69, 0.95) 100%)",
            border: SHARED_BORDER,
            color: "#ffedb3",
            opacity: hasMaps ? 1 : 0.55,
            boxShadow: transparent
              ? "0 0 10px rgba(212, 168, 71, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
              : undefined,
          }}
        >
          Directions
        </a>
      </div>
    </div>
  );
}

const ServiceCard = memo(
  ServiceCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.resolvedType === nextProps.resolvedType &&
      prevProps.transparent === nextProps.transparent &&
      prevProps.clickable === nextProps.clickable &&
      prevProps.item?.place_id === nextProps.item?.place_id &&
      prevProps.item?._id === nextProps.item?._id &&
      prevProps.item?.id === nextProps.item?.id &&
      prevProps.item?.name === nextProps.item?.name &&
      prevProps.item?.address === nextProps.item?.address &&
      prevProps.item?.phone === nextProps.item?.phone &&
      prevProps.item?.rating === nextProps.item?.rating &&
      prevProps.item?.services === nextProps.item?.services &&
      prevProps.item?.categories === nextProps.item?.categories
    );
  }
);

export default ServiceCard;
