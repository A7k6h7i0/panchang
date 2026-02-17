import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProkeralaPanchang } from "./services/astrologyApi";
import { getAstroDefaults, loadLocation } from "./utils/appSettings";
import { buildIsoDatetime, findActiveByTime, safeDateFromIso, ymdToday } from "./astrology/components/formatters";

const TILE_ITEMS = [
  { to: "/month-view", title: "Month View", subtitle: "Phase and Tithi for month", icon: "▦" },
  { to: "/panchang", title: "Panchang", subtitle: "Day View, Sun and Moon rise/set times", icon: "⌖" },
  { to: "/festivals", title: "Festivals", subtitle: "Festival and Event dates", icon: "✹" },
  { to: "/my-tithi", title: "My Tithi", subtitle: "Add and track your own tithis", icon: "◉" },
  { to: "/kundali", title: "Kundali", subtitle: "Time view, Planet Ephemeris, Lagna", icon: "✳" },
  { to: "/matchmaking", title: "Match Making", subtitle: "Guna Milan with Ashta Koota", icon: "◔" },
  { to: "/muhurat", title: "Muhurt", subtitle: "Muhurta, Choghadiya and Hora", icon: "◷" },
  { to: "/hindu-time", title: "Hindu Time", subtitle: "Watch Ishtkaal i.e Ghati or Nazhika", icon: "◴" },
  { to: "/settings", title: "Settings", subtitle: "Change location and preferences", icon: "⚙" },
  { to: "/info", title: "Info", subtitle: "Information about Hindu Calendar", icon: "?" },
];

const MENU_LINKS = [
  ["/month-view", "Month View"],
  ["/panchang", "Panchang"],
  ["/festivals", "Festivals"],
  ["/my-tithi", "My Tithi"],
  ["/kundali", "Kundali"],
  ["/matchmaking", "Match Making"],
  ["/muhurat", "Muhurt"],
  ["/hindu-time", "Hindu Time"],
  ["/compass", "Compass"],
  ["/sankalp-mantra", "Sankalp Mantra"],
  ["/info", "Info"],
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toHHMM(value) {
  const s = String(value || "");
  if (!s) return "--:--";
  if (s.includes("T") && s.length >= 16) return s.slice(11, 16);
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  return s;
}

function computeGhati(now, sunriseIso) {
  const sunrise = safeDateFromIso(sunriseIso);
  if (!sunrise) return null;
  const deltaSec = Math.max(0, Math.floor((now.getTime() - sunrise.getTime()) / 1000));
  return {
    ghati: Math.floor(deltaSec / 1440),
    pal: Math.floor((deltaSec % 1440) / 24),
  };
}

function shareApp() {
  const url = window.location.origin;
  const text = "Hindu Calendar";
  if (navigator.share) return navigator.share({ title: text, text, url });
  return navigator.clipboard?.writeText(url);
}

function Tile({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-[#6e3508] bg-[#4a2205]/92 p-4 text-center shadow-[0_8px_18px_rgba(0,0,0,0.32)] transition hover:bg-[#562808]/95"
    >
      <div className="mx-auto mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-xl font-black text-[#f2efe8]">
        {icon}
      </div>
      <div className="text-[30px] font-black leading-tight text-[#f6ce50] sm:text-[32px] md:text-[22px] lg:text-[24px]">
        {title}
      </div>
      <div className="mt-1 text-[11px] leading-4 text-[#bca784]">{subtitle}</div>
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [panchang, setPanchang] = useState(null);
  const [error, setError] = useState("");
  const [settingsNonce, setSettingsNonce] = useState(0);
  const abortRef = useRef(null);

  const defaults = useMemo(() => {
    void settingsNonce;
    return getAstroDefaults();
  }, [settingsNonce]);

  const location = useMemo(() => {
    void settingsNonce;
    return loadLocation();
  }, [settingsNonce]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const refresh = () => setSettingsNonce((n) => n + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");

    const run = async () => {
      try {
        const payload = await getProkeralaPanchang(
          {
            date: ymdToday(),
            time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
            lat: defaults.lat,
            lng: defaults.lng,
            tzOffset: defaults.tzOffset,
            ayanamsa: defaults.ayanamsa,
            la: defaults.la,
          },
          { signal: controller.signal }
        );
        setPanchang(payload?.data || payload || null);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setPanchang(null);
        setError(e?.message || "Failed to load Panchang");
      }
    };

    const t = setTimeout(run, 350);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.getMinutes(), settingsNonce]);

  const summary = useMemo(() => {
    if (!panchang) return null;
    const refDate = safeDateFromIso(
      buildIsoDatetime({
        date: ymdToday(),
        time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
        tzOffset: defaults.tzOffset,
      })
    );
    const tithi = findActiveByTime(panchang?.tithi, refDate);
    const nakshatra = findActiveByTime(panchang?.nakshatra, refDate);
    const choghadiya = findActiveByTime(panchang?.choghadiya, refDate);
    const ghati = computeGhati(now, panchang?.sunrise);

    return {
      tithi: tithi?.name || "--",
      paksha: tithi?.paksha || "",
      nakshatra: nakshatra?.name || "--",
      vaara: panchang?.vaara || panchang?.weekday || "--",
      choghadiya:
        choghadiya?.name && choghadiya?.start && choghadiya?.end
          ? `${choghadiya.name} ${toHHMM(choghadiya.start)} - ${toHHMM(choghadiya.end)}`
          : "--",
      panchaka: panchang?.panchaka?.name || panchang?.panchaka || "",
      shaka:
        panchang?.shaka_samvat ||
        panchang?.saka_samvat ||
        panchang?.samvat ||
        "--",
      lunarMonth:
        panchang?.lunar_month?.name ||
        panchang?.lunar_month ||
        panchang?.masa ||
        "--",
      sunrise: toHHMM(panchang?.sunrise),
      ghati,
    };
  }, [panchang, now, defaults.tzOffset]);

  const formattedTime = useMemo(
    () => now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [now]
  );
  const formattedDate = useMemo(
    () => now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }),
    [now]
  );

  return (
    <div
      className="min-h-screen bg-[#4f2202] text-[#f6ce50]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 8%, rgba(255,164,39,0.22) 0%, rgba(0,0,0,0) 35%), radial-gradient(circle at 85% 24%, rgba(255,130,22,0.18) 0%, rgba(0,0,0,0) 42%), linear-gradient(180deg, #5b2803 0%, #2f1403 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-md px-4 pb-44 pt-5 md:max-w-5xl md:px-6 md:pb-52">
        <header className="mb-4 grid grid-cols-[40px_1fr_80px] items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="h-10 w-10 rounded-xl bg-[#3a1b05]/80 text-2xl text-[#f3f0e8]"
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="text-center text-xl font-bold text-[#f3f0e8] md:text-2xl">Hindu Calendar</div>
          <div className="flex items-center justify-end gap-2">
            <Link
              to="/settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#3a1b05]/80 text-xl text-[#f3f0e8]"
              aria-label="Settings"
              title="Settings"
            >
              ⚙
            </Link>
            <button
              type="button"
              className="h-10 w-10 rounded-xl bg-[#3a1b05]/80 text-xl text-[#f3f0e8]"
              aria-label="More"
            >
              ⋮
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-[#6e3508] bg-[#4a2205]/92 px-4 py-5 text-center shadow-[0_10px_24px_rgba(0,0,0,0.32)]">
          <div className="text-[15px] font-semibold text-[#f0d680]">{formattedTime}, {formattedDate}</div>
          <div className="mt-2 text-[34px] font-black leading-none text-[#f6ce50] md:text-[40px]">
            Hindu Time{" "}
            <span className="text-[#f6eac2]">
              {summary?.ghati ? `${pad2(summary.ghati.ghati)}:${pad2(summary.ghati.pal)}` : "--:--"}
            </span>
          </div>
          <div className="mt-2 text-sm text-[#f0d680] md:text-base">
            {summary ? `${summary.tithi}, ${summary.paksha}, ${summary.lunarMonth}` : "--"}
          </div>
          <div className="mt-1 text-sm text-[#dfc279] md:text-base">
            {summary ? `${summary.nakshatra}, ${summary.vaara}, ${summary.shaka}` : "--"}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm md:text-base">
            <div className="font-bold text-[#f6ce50]">
              Choghadiya <span className="text-[#ff90a1]">{summary?.choghadiya || "--"}</span>
            </div>
            <div className="font-bold text-[#ff90a1]">{summary?.panchaka ? `Panchak ${summary.panchaka} ▼` : ""}</div>
          </div>
          <div className="mt-2 text-sm text-[#d7c3a0]">
            Sunrise {summary?.sunrise || "--:--"} |{" "}
            {location?.name ? `${location.name} ${location.lat}, ${location.lng}` : ""}
          </div>
          {error ? <div className="mt-2 text-sm text-[#ff8d8d]">{error}</div> : null}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 md:gap-4">
          {TILE_ITEMS.map((tile) => (
            <Tile key={tile.to} {...tile} />
          ))}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="mx-auto w-full max-w-md px-4 pb-3 md:max-w-5xl md:px-6">
          <section className="grid grid-cols-4 rounded-3xl border border-[#6e3508] bg-[#4a2205]/95 p-2 text-center shadow-[0_8px_20px_rgba(0,0,0,0.34)]">
            <button
              type="button"
              onClick={() => navigate("/compass")}
              className="rounded-2xl py-2 text-[11px] font-semibold text-[#f3f0e8]"
            >
              <div className="text-lg">⌖</div>
              Compass
            </button>
            <button
              type="button"
              onClick={() => navigate("/sankalp-mantra")}
              className="rounded-2xl py-2 text-[11px] font-semibold text-[#f3f0e8]"
            >
              <div className="text-lg">ॐ</div>
              Sankalp Mantra
            </button>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="rounded-2xl py-2 text-[11px] font-semibold text-[#f3f0e8]"
            >
              <div className="text-lg">i</div>
              About
            </button>
            <button
              type="button"
              onClick={() => shareApp()}
              className="rounded-2xl py-2 text-[11px] font-semibold text-[#f3f0e8]"
            >
              <div className="text-lg">↗</div>
              Share
            </button>
          </section>

          <section className="mt-2 rounded-3xl border border-[#6e3508] bg-[#232323]/95 px-4 py-3 text-center shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
            <div className="text-base font-semibold text-[#f1efde]">
              {summary?.lunarMonth || "--"}, {summary?.shaka || "--"}
            </div>
            <div className="text-xs text-[#f6ce50]">Uttarayana, Shishir, Tapasya</div>
            <div className="text-xs font-bold text-[#f6ce50]">Indian National Calendar</div>
          </section>
        </div>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-30">
          <button type="button" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/60" />
          <aside className="absolute left-0 top-0 h-full w-[82%] max-w-sm border-r border-[#6e3508] bg-[#3a1b05] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-black text-[#f3f0e8]">Menu</div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-black/25 px-3 py-1 text-sm font-semibold text-[#f3f0e8]"
              >
                Close
              </button>
            </div>
            <nav className="grid gap-2">
              {MENU_LINKS.map(([to, label]) => (
                <Link
                  key={`menu-${to}`}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-[#6e3508] bg-[#4a2205]/85 px-3 py-2 text-[#f6ce50]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
