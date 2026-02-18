import { useEffect, useMemo, useState } from "react";
import PageShell from "./PageShell";

function normalizeDeg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const x = ((n % 360) + 360) % 360;
  return x;
}

function shortestDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

const DIR8 = [
  { short: "N", local: "Uttara", deg: 0 },
  { short: "NE", local: "Ishan", deg: 45 },
  { short: "E", local: "Purva", deg: 90 },
  { short: "SE", local: "Agneya", deg: 135 },
  { short: "S", local: "Dakshin", deg: 180 },
  { short: "SW", local: "Nairitya", deg: 225 },
  { short: "W", local: "Paschim", deg: 270 },
  { short: "NW", local: "Vayavya", deg: 315 },
];

function directionFrom(angle) {
  if (angle == null) return "-";
  const idx = Math.round(angle / 45) % 8;
  const d = DIR8[idx];
  return `${d.short} • ${d.local}`;
}

function headingFromEvent(e) {
  if (typeof e.webkitCompassHeading === "number") {
    return normalizeDeg(e.webkitCompassHeading);
  }
  if (typeof e.alpha === "number") {
    // For absolute-capable sensors alpha tends to map to compass heading;
    // fallback inverts alpha for browsers exposing relative alpha.
    const h = e.absolute ? e.alpha : 360 - e.alpha;
    return normalizeDeg(h);
  }
  return null;
}

export default function CompassPage() {
  const [heading, setHeading] = useState(null);
  const [status, setStatus] = useState("Tap Enable to start.");
  const [enabled, setEnabled] = useState(false);

  const angle = useMemo(() => normalizeDeg(heading), [heading]);
  const directionText = useMemo(() => directionFrom(angle), [angle]);

  const enable = async () => {
    try {
      if (!window.isSecureContext) {
        setStatus("Compass needs HTTPS (or localhost). Open this on a secure URL.");
        return;
      }

      if (typeof window.DeviceOrientationEvent === "undefined") {
        setStatus("Device orientation is not supported on this device/browser.");
        return;
      }

      setStatus("Starting...");

      // iOS requires permission prompt for DeviceOrientation.
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p !== "granted") {
          setStatus("Permission denied.");
          return;
        }
      }

      setEnabled(true);
      setStatus("Move your phone in a figure-8 to calibrate.");
    } catch (e) {
      setStatus(e?.message || "Failed to start compass.");
    }
  };

  useEffect(() => {
    if (!enabled) return;

    let gotReading = false;

    const handler = (e) => {
      const next = headingFromEvent(e);
      if (next == null) return;
      gotReading = true;
      setHeading((prev) => {
        if (prev == null) return next;
        const delta = shortestDelta(prev, next);
        return normalizeDeg(prev + delta * 0.2);
      });
      setStatus("Compass active.");
    };

    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);

    const timeout = window.setTimeout(() => {
      if (!gotReading) {
        setStatus("No sensor data. Enable Motion/Orientation permission in browser settings.");
      }
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("deviceorientationabsolute", handler, true);
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, [enabled]);

  return (
    <PageShell
      title="Compass"
      right={
        <button
          type="button"
          onClick={enable}
          className="rounded-xl bg-amber-400/15 px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-amber-300/25 hover:bg-amber-400/20"
        >
          Enable
        </button>
      }
    >
      <div className="grid gap-4">
        <section className="app-surface rounded-3xl p-5 text-amber-50">
          <div className="text-sm font-black text-amber-100">Heading</div>
          <div className="mt-1 text-4xl font-black text-amber-50">{angle == null ? "-" : `${Math.round(angle)} deg`}</div>
          <div className="mt-1 text-base font-black text-amber-100">{directionText}</div>
          <div className="mt-2 text-sm text-amber-100/70">{status}</div>
        </section>

        <section className="app-surface mx-auto w-full max-w-sm rounded-3xl p-5">
          <div className="relative mx-auto h-72 w-72">
            <div className="absolute inset-0 rounded-full border border-amber-300/25 bg-gradient-to-b from-amber-300/10 to-black/30 shadow-[0_30px_70px_rgba(0,0,0,0.55)]" />
            <div className="absolute inset-4 rounded-full border border-amber-300/15 bg-black/20" />
            <div
              className="absolute inset-0 transition-transform duration-150"
              style={{ transform: `rotate(${-(angle ?? 0)}deg)` }}
            >
              {Array.from({ length: 36 }).map((_, i) => {
                const major = i % 3 === 0;
                return (
                  <div
                    key={`tick-${i}`}
                    className={`absolute left-1/2 top-3 origin-bottom ${major ? "h-4 w-[2px]" : "h-2.5 w-[1px]"}`}
                    style={{
                      transform: `translateX(-50%) rotate(${i * 10}deg)`,
                      background: major ? "rgba(255, 210, 130, 0.6)" : "rgba(255, 210, 130, 0.35)",
                    }}
                  />
                );
              })}
              <div className="absolute left-1/2 top-1.5 -translate-x-1/2 text-xs font-black tracking-[0.2em] text-amber-100/80">N</div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black tracking-[0.2em] text-amber-100/80">E</div>
              <div className="absolute left-1/2 bottom-1.5 -translate-x-1/2 text-xs font-black tracking-[0.2em] text-amber-100/80">S</div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-black tracking-[0.2em] text-amber-100/80">W</div>
            </div>

            <div className="absolute left-1/2 top-[18px] -translate-x-1/2 text-amber-200">▲</div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="h-28 w-[6px] rounded-full bg-amber-200 shadow-[0_0_20px_rgba(255,210,130,0.45)]" />
            </div>
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/70 bg-amber-200" />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
