const inputBase =
  "w-full rounded-xl border px-3 py-2 text-amber-50 placeholder:text-amber-100/75 outline-none transition focus:ring-2 focus:ring-amber-300/20";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-amber-100">{label}</span>
        {hint ? <span className="text-xs text-amber-100/65">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className={`${inputBase} ${props.className || ""}`}
      style={{
        background: "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
        borderColor: "#d4a847",
      }}
    />
  );
}

export function SelectInput(props) {
  return (
    <select
      {...props}
      className={`${inputBase} ${props.className || ""}`}
      style={{
        background: "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
        borderColor: "#d4a847",
      }}
    >
      {props.children}
    </select>
  );
}

export function SectionCard({ title, subtitle, children, right }) {
  return (
    <section
      className="rounded-2xl p-4 backdrop-blur-md"
      style={{
        background:
          "linear-gradient(180deg, #ff4d0d 0%, #ff5c1a 10%, #ff6b28 20%, #ff7935 30%, #ff8743 40%, #ff7935 50%, #ff6b28 60%, #ff5c1a 70%, #ff4d0d 80%, #d94100 90%, #c23800 100%)",
        border: "2.5px solid rgba(255, 168, 67, 0.8)",
        boxShadow:
          "0 0 20px rgba(255, 140, 50, 0.42), inset 0 0 14px rgba(255, 220, 140, 0.1)",
      }}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-black tracking-wide text-amber-100">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-amber-100/70">{subtitle}</div> : null}
        </div>
        {right || null}
      </header>
      {children}
    </section>
  );
}

export function JsonBlock({ value }) {
  return (
    <pre
      className="max-h-[420px] overflow-auto rounded-2xl p-4 text-xs text-amber-50"
      style={{
        border: "2px solid #d4a847",
        background: "linear-gradient(135deg, #2a5a1f 0%, #3a6e2d 30%, #4a8238 60%, #5a9645 100%)",
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
