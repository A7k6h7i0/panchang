import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { postMuhurat } from "../services/astrologyApi";
import { getAstroDefaults } from "../utils/appSettings";
import PageShell from "../pages/PageShell";
import { Field, JsonBlock, SectionCard, SelectInput, TextInput } from "./components/AstroInputs";
import { buildIsoDatetime, isoParts, periodEnd, periodStart, safeDateFromIso, ymdToday } from "./components/formatters";
import CalendarDateInput from "../components/CalendarDateInput";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

function findPeriodList(root) {
  const data = root?.data || root;
  const candidates = [
    data?.periods,
    data?.auspicious_periods,
    data?.auspiciousPeriods,
    data?.muhurat,
    data?.muhurta,
    data?.data?.periods,
    data?.data?.auspicious_periods,
  ];

  const toArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") {
      return Object.entries(value).map(([key, val]) => ({
        ...(val && typeof val === "object" ? val : { value: val }),
        __key: key,
      }));
    }
    return [];
  };

  for (const c of candidates) {
    const arr = toArray(c);
    if (arr.length) return arr;
  }

  // Some local responses are a map of periods under data itself.
  if (data && typeof data === "object") {
    const asArr = toArray(data);
    if (asArr.length) return asArr;
  }

  return [];
}

function normalizePeriod(p) {
  const asTimeString = (value) => (typeof value === "string" ? value : null);

  const rawName = p?.name || p?.title || p?.type || p?.__key || "-";
  const name = String(rawName).replace(/_/g, " ");
  const start =
    asTimeString(periodStart(p)) ||
    null;
  const end =
    asTimeString(periodEnd(p)) ||
    null;

  const range =
    typeof p?.time === "string"
      ? p.time
      : typeof p?.timing === "string"
        ? p.timing
        : typeof p?.value === "string"
          ? p.value
          : null;
  const rangeMatch =
    range &&
    range.match(
      /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*(?:to|-|->)\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i
    );
  const start2 = !start && rangeMatch ? rangeMatch[1] : null;
  const end2 = !end && rangeMatch ? rangeMatch[2] : null;
  const description = p?.description || p?.summary || p?.note || null;
  return { name, type: p?.type || null, start: start || start2, end: end || end2, description, raw: p };
}

function normalizePeriodLabel(name) {
  const text = String(name || "").toLowerCase();
  if (/(amrit|amrith)/i.test(text)) return "Amrith Kalam";
  if (/(brahma)/i.test(text)) return "Brahma Muhurth";
  if (/(abhijit)/i.test(text)) return "Abhijeet";
  if (/(rahu)/i.test(text)) return "Rahu Kalam";
  if (/(yamag)/i.test(text)) return "Yamaganda";
  if (/(gulik)/i.test(text)) return "Gulikai Kalam";
  if (/(durmuh|dur\s*muh)/i.test(text)) return "Dur Muhurtam";
  if (/(varjy|varjya)/i.test(text)) return "Varjyam";
  return String(name || "-");
}

const AUSPICIOUS_ORDER = ["Amrith Kalam", "Brahma Muhurth", "Abhijeet"];
const INAUSPICIOUS_ORDER = ["Rahu Kalam", "Yamaganda", "Gulikai Kalam", "Dur Muhurtam", "Varjyam"];

function pickCurrentAndNext(periods, refDate) {
  if (!Array.isArray(periods) || !periods.length || !refDate) return { current: null, next: null };
  const refMs = refDate.getTime();
  let next = null;
  for (const p of periods) {
    const s = safeDateFromIso(periodStart(p));
    const e = safeDateFromIso(periodEnd(p));
    if (!s || !e) continue;
    const sMs = s.getTime();
    const eMs = e.getTime();
    if (refMs >= sMs && refMs < eMs) return { current: p, next: null };
    if (sMs > refMs) {
      const nextStart = safeDateFromIso(periodStart(next));
      const nextStartMs = nextStart ? nextStart.getTime() : Infinity;
      if (!next || sMs < nextStartMs) next = p;
    }
  }
  return { current: null, next };
}

export default function MuhuratPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const abortRef = useRef(null);
  const [form, setForm] = useState(() => ({
    date: ymdToday(),
    time: "08:00",
    ...getAstroDefaults(),
  }));

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const periods = useMemo(
    () =>
      findPeriodList(result)
        .map(normalizePeriod)
        .filter((p) => p && (p.start || p.end)),
    [result]
  );
  const refDate = useMemo(
    () =>
      safeDateFromIso(
        buildIsoDatetime({
          date: form.date,
          time: form.time,
          tzOffset: form.tzOffset,
        })
      ),
    [form.date, form.time, form.tzOffset]
  );
  const spotlight = useMemo(() => pickCurrentAndNext(periods, refDate), [periods, refDate]);
  const auspiciousPeriods = useMemo(
    () =>
      periods
        .filter((p) => {
          const label = normalizePeriodLabel(p?.name || "");
          return label === "Amrith Kalam" || label === "Brahma Muhurth" || label === "Abhijeet";
        })
        .sort(
          (a, b) =>
            AUSPICIOUS_ORDER.indexOf(normalizePeriodLabel(a?.name || "")) -
            AUSPICIOUS_ORDER.indexOf(normalizePeriodLabel(b?.name || ""))
        ),
    [periods]
  );
  const inauspiciousPeriods = useMemo(
    () =>
      periods
        .filter((p) => {
          const label = normalizePeriodLabel(p?.name || "");
          return (
            label === "Rahu Kalam" ||
            label === "Yamaganda" ||
            label === "Gulikai Kalam" ||
            label === "Dur Muhurtam" ||
            label === "Varjyam"
          );
        })
        .sort(
          (a, b) =>
            INAUSPICIOUS_ORDER.indexOf(normalizePeriodLabel(a?.name || "")) -
            INAUSPICIOUS_ORDER.indexOf(normalizePeriodLabel(b?.name || ""))
        ),
    [periods]
  );

  const fmtTime = (value) => {
    const s = String(value ?? "").trim();
    if (!s || s === "null" || s === "undefined") return "---";
    if (s.includes("T")) return isoParts(s).time;
    return s;
  };

  const onChange = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const runFetch = async ({ signal } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await postMuhurat({
        date: form.date,
        time: form.time,
        lat: form.lat,
        lng: form.lng,
        tzOffset: form.tzOffset,
        ayanamsa: form.ayanamsa,
        la: form.la,
      }, { signal });
      setResult(payload);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(err?.payload || { message: err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    await runFetch({ signal: controller.signal });
  };

  useEffect(() => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    const t = setTimeout(() => runFetch({ signal: controller.signal }), 550);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.time, form.lat, form.lng, form.tzOffset, form.ayanamsa, form.la]);

  return (
    <PageShell
      title={t.muhurat || "Muhurat"}
      transparent
      right={
        <Link
          to="/settings"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-amber-100 ring-1 ring-white/10 hover:bg-white/10"
          style={{ background: "transparent" }}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </Link>
      }
    >
      <div className="grid gap-6">
      <SectionCard
        title={t.muhurat || "Muhurat"}
        subtitle="Auspicious periods (muhurta) based on date/time/location."
        transparent
        right={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              form="muhurat-form"
              disabled={loading}
              className="rounded-xl px-4 py-2 text-sm font-black text-amber-100 ring-1 ring-amber-300/30 transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "transparent" }}
            >
              {loading ? "Loading…" : "Fetch"}
            </button>
          </div>
        }
      >
        <form id="muhurat-form" onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
          <Field label="Date">
            <CalendarDateInput value={form.date} onChange={(next) => setForm((s) => ({ ...s, date: next }))} transparent />
          </Field>
          <Field label="Time">
            <TextInput type="time" value={form.time} onChange={onChange("time")} transparent />
          </Field>
          <Field label="Timezone Offset" hint="+05:30">
            <TextInput value={form.tzOffset} onChange={onChange("tzOffset")} transparent />
          </Field>
          <Field label="Latitude">
            <TextInput value={form.lat} onChange={onChange("lat")} transparent />
          </Field>
          <Field label="Longitude">
            <TextInput value={form.lng} onChange={onChange("lng")} transparent />
          </Field>
          <Field label="Ayanamsa" hint="1, 3, 5">
            <SelectInput value={form.ayanamsa} onChange={onChange("ayanamsa")} transparent>
              <option value="1">1 (Lahiri)</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </SelectInput>
          </Field>
          <Field label="Language (la)">
            <TextInput value={form.la} onChange={onChange("la")} transparent />
          </Field>
        </form>
      </SectionCard>

      {error ? (
        <SectionCard title="Error" subtitle="Muhurat data could not be loaded." transparent>
          <JsonBlock value={error} transparent />
        </SectionCard>
      ) : null}

      {spotlight.current || spotlight.next ? (
        <SectionCard
          title={spotlight.current ? "Now" : "Next"}
          subtitle={spotlight.current ? "Current period at selected time." : "Upcoming period after selected time."}
          transparent
        >
          <div className="rounded-2xl border border-white/10 p-4 text-sm text-amber-50" style={{ background: "transparent" }}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="text-base font-black text-amber-100">
                  {normalizePeriodLabel((spotlight.current || spotlight.next)?.name || "-")}
                </div>
                <div className="text-xs text-amber-100/70">
                  {fmtTime((spotlight.current || spotlight.next)?.start)} →{" "}
                  {fmtTime((spotlight.current || spotlight.next)?.end)}
                </div>
              </div>
            {(spotlight.current || spotlight.next)?.description ? (
              <div className="mt-2 text-amber-50/90">
                {String((spotlight.current || spotlight.next).description)}
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {auspiciousPeriods.length ? (
        <SectionCard title="Auspicious" subtitle="Good muhurat periods." transparent>
          <div className="grid gap-3">
            {auspiciousPeriods.map((p, idx) => (
              <div
                key={p?.id || p?.name || idx}
                className="rounded-2xl border border-white/10 p-4 text-sm text-amber-50"
                style={{ background: "transparent" }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="text-base font-black text-amber-100">
                    {normalizePeriodLabel(p?.name || `Period ${idx + 1}`)}
                  </div>
                  <div className="text-xs text-amber-100/70">
                    {fmtTime(p?.start)} → {fmtTime(p?.end)}
                  </div>
                </div>
                {p?.description ? (
                  <div className="mt-2 text-amber-50/90">{String(p.description)}</div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {inauspiciousPeriods.length ? (
        <SectionCard title="Inauspicious" subtitle="Avoid these kaals for important activities." transparent>
          <div className="grid gap-3">
            {inauspiciousPeriods.map((p, idx) => (
              <div
                key={p?.id || p?.name || idx}
                className="rounded-2xl border border-white/10 p-4 text-sm text-amber-50"
                style={{ background: "transparent" }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="text-base font-black text-amber-100">
                    {normalizePeriodLabel(p?.name || `Period ${idx + 1}`)}
                  </div>
                  <div className="text-xs text-amber-100/70">
                    {fmtTime(p?.start)} → {fmtTime(p?.end)}
                  </div>
                </div>
                {p?.description ? (
                  <div className="mt-2 text-amber-50/90">{String(p.description)}</div>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
      </div>
    </PageShell>
  );
}


