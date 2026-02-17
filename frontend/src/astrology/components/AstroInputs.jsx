const inputBase =
  "w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-amber-50 placeholder:text-amber-200/40 outline-none transition focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-amber-100">{label}</span>
        {hint ? (
          <span className="text-xs text-amber-100/60">{hint}</span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={`${inputBase} ${props.className || ""}`} />;
}

export function SelectInput(props) {
  return (
    <select {...props} className={`${inputBase} ${props.className || ""}`}>
      {props.children}
    </select>
  );
}

export function SectionCard({ title, subtitle, children, right }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-black tracking-wide text-amber-100">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-xs text-amber-100/60">{subtitle}</div>
          ) : null}
        </div>
        {right || null}
      </header>
      {children}
    </section>
  );
}

export function JsonBlock({ value }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs text-amber-50">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

