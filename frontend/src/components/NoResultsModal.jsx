import { useEffect } from "react";

export default function NoResultsModal({
  isOpen,
  onClose,
  title,
  message,
  actionLabel,
  onAction,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(10, 6, 4, 0.92) 0%, rgba(32, 15, 8, 0.95) 45%, rgba(74, 33, 16, 0.96) 100%)",
          border: "3px solid rgba(255, 140, 50, 0.7)",
          boxShadow: "0 0 25px rgba(120, 58, 26, 0.55), inset 0 0 18px rgba(170, 94, 43, 0.2)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black transition hover:scale-105"
          style={{
            background: "rgba(255, 224, 130, 0.16)",
            color: "#FFF5E1",
            border: "1px solid rgba(255, 224, 130, 0.3)",
          }}
          aria-label="Close popup"
        >
          X
        </button>

        <div className="pr-10">
          {title ? (
            <h2 className="text-lg font-black" style={{ color: "#FFE4B5" }}>
              {title}
            </h2>
          ) : null}
          <p className={`${title ? "mt-3" : "mt-1"} whitespace-pre-line text-sm font-semibold leading-6`} style={{ color: "#FFD9A3" }}>
            {message}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onAction?.();
              onClose?.();
            }}
            className="rounded-xl bg-amber-400/20 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-400/30"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
