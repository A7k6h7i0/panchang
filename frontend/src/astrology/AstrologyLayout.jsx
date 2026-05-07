import { NavLink, Outlet } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

const linkBase = "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition";
const linkIdle = "bg-white/5 text-amber-100 hover:bg-white/10 hover:text-amber-50";
const linkActive = "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30";

export default function AstrologyLayout() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/15 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <NavLink to="/" className={`${linkBase} ${linkIdle}`} title="Back to Home">
              {"<"} {t.back || "Back"}
            </NavLink>
            <div className="text-lg font-black tracking-wide text-amber-100">Astrology</div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <NavLink
              to="/panchang"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {t.panchang || "Panchang"}
            </NavLink>
            <NavLink
              to="/kundali"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {t.kundali || "Kundali"}
            </NavLink>
            <NavLink
              to="/matchmaking"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {t.match_making || "Match Making"}
            </NavLink>
            <NavLink
              to="/muhurat"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {t.muhurat || "Muhurat"}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
