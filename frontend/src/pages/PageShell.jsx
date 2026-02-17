import { Link } from "react-router-dom";

export default function PageShell({ title, right, children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at 15% 10%, rgba(255, 190, 110, 0.14) 0%, rgba(0, 0, 0, 0) 40%), radial-gradient(circle at 85% 20%, rgba(255, 120, 45, 0.18) 0%, rgba(0, 0, 0, 0) 45%), linear-gradient(180deg, rgba(44, 16, 8, 1) 0%, rgba(16, 6, 3, 1) 100%)",
      }}
    >
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
            aria-label="Back"
            title="Back"
          >
            ←
          </Link>
          <div className="text-lg font-black tracking-wide text-amber-100">{title}</div>
          <div className="min-w-[40px]">{right}</div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

