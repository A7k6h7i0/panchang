import { useEffect, useMemo, useState } from "react";
import PageShell from "./PageShell";

function normalizeDeg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const x = ((n % 360) + 360) % 360;
  return x;
}

export default function CompassPage() {
  const [heading, setHeading] = useState(null);
  const [status, setStatus] = useState("Tap Enable to start.");
  const [enabled, setEnabled] = useState(false);

  const angle = useMemo(() => normalizeDeg(heading), [heading]);

  const enable = async () => {
    try {
      setStatus("Starting…");

      // iOS requires permission prompt for DeviceOrientation.
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p !== "granted") {
          setStatus("Permission denied.");
          return;
        }
      }

      setEnabled(true);
      setStatus("Move your phone to calibrate.");
    } catch (e) {
      setStatus(e?.message || "Failed to start compass.");
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      if (typeof e.webkitCompassHeading === "number") {
        setHeading(e.webkitCompassHeading);
        return;
      }
      if (typeof e.alpha === "number") setHeading(360 - e.alpha);
    };

    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);

    return () => {
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
        <section className="rounded-3xl border border-white/10 bg-black/20 p-5 text-amber-50">
          <div className="text-sm font-black text-amber-100">Heading</div>
          <div className="mt-1 text-4xl font-black text-amber-50">
            {angle == null ? "—" : `${Math.round(angle)}°`}
          </div>
          <div className="mt-2 text-sm text-amber-100/70">{status}</div>
        </section>

        <section className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="relative mx-auto h-72 w-72">
            <div className="absolute inset-0 rounded-full border border-amber-300/25 bg-gradient-to-b from-amber-300/10 to-black/30 shadow-[0_30px_70px_rgba(0,0,0,0.55)]" />
            <div className="absolute inset-4 rounded-full border border-amber-300/15 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black tracking-[0.3em] text-amber-100/70">
              N
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-3 text-xs font-black tracking-[0.3em] text-amber-100/70">
              W
            </div>
            <div className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-black tracking-[0.3em] text-amber-100/70">
              E
            </div>
            <div className="absolute inset-0 flex items-end justify-center pb-3 text-xs font-black tracking-[0.3em] text-amber-100/70">
              S
            </div>

            <div
              className="absolute left-1/2 top-1/2 h-28 w-1 -translate-x-1/2 -translate-y-full rounded-full bg-amber-200 shadow-[0_0_20px_rgba(255,210,130,0.45)]"
              style={{ transform: `translate(-50%, -100%) rotate(${angle ?? 0}deg)`, transformOrigin: "bottom center" }}
            />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200" />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
