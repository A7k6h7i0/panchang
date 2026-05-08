import { Link } from "react-router-dom";
import GlobalShortcutButtons from "../components/GlobalShortcutButtons";
import { UiIcon } from "../components/UiIcons";

export default function PageShell({
  title,
  right,
  children,
  transparent = false,
  className = "",
  backTo = "/",
  backLabel = "Back",
}) {
  const outerBackground = transparent
    ? "transparent"
    : "linear-gradient(180deg, #4a2f00 0%, #3b2500 55%, #2b1b00 100%)";
  const headerBackground = transparent ? "transparent" : "linear-gradient(135deg, rgba(84, 58, 6, 0.98) 0%, rgba(73, 50, 5, 0.95) 50%, rgba(57, 39, 3, 0.92) 100%)";
  const barBackground = transparent
    ? "transparent"
    : "linear-gradient(135deg, #d4ab11 0%, #bf9a0f 15%, #a7840d 35%, #92730b 50%, #a7840d 65%, #bf9a0f 85%, #d4ab11 100%)";

  return (
    <div
      className={`app-white-text min-h-[100svh] overflow-x-hidden ${className}`.trim()}
      style={{
        background: outerBackground,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <header className="sticky top-0 z-20 px-4 pt-3">
        <div
          className={`mx-auto w-full max-w-6xl min-w-0 rounded-xl p-2 ${transparent ? "" : "backdrop-blur-md"}`}
          style={{
            background: headerBackground,
            border: "1.5px solid rgba(255, 183, 77, 0.4)",
            boxShadow:
              "0 0 30px rgba(255, 140, 50, 0.6), 0 0 60px rgba(255, 100, 30, 0.45), inset 0 0 24px rgba(255, 140, 50, 0.18)",
          }}
        >
          <div
            className="grid grid-cols-[40px_1fr_40px] items-center gap-3 rounded-xl px-2 py-2"
            style={{
              background: barBackground,
              border: "1.5px solid rgba(255, 183, 77, 0.5)",
              boxShadow:
                "0 4px 20px rgba(255, 111, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(139, 69, 19, 0.3)",
            }}
          >
            <Link
              to={backTo}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-amber-100 transition hover:scale-105"
              style={{
                background: transparent ? "transparent" : "linear-gradient(135deg, rgba(255, 224, 130, 0.3) 0%, rgba(255, 183, 77, 0.25) 100%)",
                border: transparent ? "1px solid transparent" : "1.5px solid rgba(255, 183, 77, 0.4)",
                boxShadow: transparent ? "none" : "inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
              aria-label={backLabel}
              title={backLabel}
            >
              <UiIcon name="arrowLeft" size={18} />
            </Link>
            <div
              className="text-center text-lg font-black tracking-wide"
              data-page-shell-title="true"
              data-no-auto-translate="true"
              style={{
                color: "#FFF9F0",
                textShadow: "0 2px 8px rgba(255, 183, 77, 0.6), 0 0 20px rgba(255, 152, 0, 0.3)",
              }}
            >
              {title}
            </div>
            <div className="min-w-[40px] justify-self-end">{right}</div>
          </div>
        </div>
      </header>
      <GlobalShortcutButtons />
      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-4">{children}</main>
    </div>
  );
}
