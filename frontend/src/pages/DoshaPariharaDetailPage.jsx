import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import PageShell from "./PageShell";
import { DOSHA_PARIHARA_DATA_URL, findDoshaPariharaRecord, normalizeDoshaPariharaDataset } from "../utils/doshaParihara";

function Tag({ children }) {
  return (
    <span
      className="inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 183, 77, 0.18)",
        color: "#FFF0D5",
      }}
    >
      {children}
    </span>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 183, 77, 0.16)",
      }}
    >
      <div className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "#FFD49E" }}>
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-6 text-[#FFF1DB]">
        {value}
      </div>
    </div>
  );
}

function DetailAction({ href, label, external = false }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="rounded-xl px-4 py-3 text-center text-sm font-black text-[#FFF5E5] transition hover:scale-[1.01]"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 183, 77, 0.18)",
      }}
    >
      {label}
    </a>
  );
}

export default function DoshaPariharaDetailPage() {
  const params = useParams();
  const location = useLocation();
  const [dataset, setDataset] = useState({ records: [] });
  const [loading, setLoading] = useState(true);

  const identifier = params.itemId || "";

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(DOSHA_PARIHARA_DATA_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Failed to load dosha parihara data");
        }
        const payload = await response.json();
        const nextDataset = normalizeDoshaPariharaDataset(payload);
        if (active) {
          setDataset(nextDataset);
        }
      } catch (error) {
        if (error?.name !== "AbortError" && active) {
          setDataset({ records: [] });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const record = useMemo(() => {
    return location.state?.record || findDoshaPariharaRecord(dataset.records, identifier);
  }, [dataset.records, identifier, location.state?.record]);

  useEffect(() => {
    const title = record?.templeName ? `${record.templeName} | Dosha Parihara` : "Dosha Parihara";
    document.title = title;

    const description = record
      ? `${record.templeName} in ${record.location || record.state || "India"} for ${record.ritualName || "local parihara search"}.`
      : "Dosha Parihara temple details.";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [record]);

  return (
    <PageShell title="Dosha Parihara" transparent backTo="/dosha-parihara" backLabel="Back to Dosha Parihara">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {!record && !loading ? (
          <section
            className="rounded-[26px] p-5"
            style={{
              background: "rgba(20, 10, 6, 0.68)",
              border: "1.5px solid rgba(255, 183, 77, 0.28)",
            }}
          >
            <div className="text-lg font-black text-[#FFF5E2]">Temple details not found.</div>
            <p className="mt-2 text-sm leading-6 text-[#FFE0B4]">
              The local record was not found. Go back to the list and open another entry.
            </p>
            <div className="mt-4">
              <Link
                to="/dosha-parihara"
                className="inline-flex rounded-xl px-4 py-2 text-sm font-black text-[#FFF3D8]"
                style={{
                  background: "rgba(255, 183, 77, 0.15)",
                  border: "1px solid rgba(255, 183, 77, 0.26)",
                }}
              >
                Back to list
              </Link>
            </div>
          </section>
        ) : null}

        {record ? (
          <>
            <section
              className="overflow-hidden rounded-[30px]"
              style={{
                background: "linear-gradient(180deg, rgba(20, 10, 6, 0.72) 0%, rgba(35, 16, 9, 0.86) 100%)",
                border: "1.5px solid rgba(255, 183, 77, 0.32)",
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.24)",
              }}
            >
              <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-5 sm:p-6">
                  <div className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: "#FFD49E" }}>
                    Temple Detail
                  </div>
                  <h1 className="mt-2 text-3xl font-black leading-tight text-[#FFF6E6] sm:text-4xl">
                    {record.templeName}
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#FFE1B8]">
                    {record.location}
                    {record.district ? ` • ${record.district}` : ""}
                    {record.state ? ` • ${record.state}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(record.categoryLabels || []).map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(record.doshaTypes || []).map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 183, 77, 0.16)",
                      }}
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#FFD49E" }}>
                        Ritual
                      </div>
                      <div className="mt-2 text-sm font-bold text-[#FFF2DC]">{record.ritualName || "Not listed"}</div>
                    </div>
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 183, 77, 0.16)",
                      }}
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#FFD49E" }}>
                        Location
                      </div>
                      <div className="mt-2 text-sm font-bold text-[#FFF2DC]">{record.location || record.state || "Not listed"}</div>
                    </div>
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 183, 77, 0.16)",
                      }}
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#FFD49E" }}>
                        Coverage
                      </div>
                      <div className="mt-2 text-sm font-bold text-[#FFF2DC]">
                        {(record.problemKeywords || []).length || 0} problems
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-amber-300/15 bg-black/10 p-5 sm:p-6 lg:border-l lg:border-t-0">
                  <div
                    className="flex min-h-[220px] items-end overflow-hidden rounded-[26px] p-5"
                    style={{
                      background:
                        "radial-gradient(circle at top right, rgba(255, 214, 126, 0.28), transparent 40%), linear-gradient(160deg, rgba(255, 176, 77, 0.18) 0%, rgba(71, 31, 11, 0.92) 100%)",
                      border: "1px solid rgba(255, 183, 77, 0.18)",
                    }}
                  >
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.26em]" style={{ color: "#FFD49E" }}>
                        Temple Snapshot
                      </div>
                      <div className="mt-2 text-xl font-black text-[#FFF6E8]">
                        {record.templeName}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[#FFE0B6]">
                        {record.speciality || "Local parihara reference for temple search and remedies."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    {record.phone ? (
                      <DetailAction href={`tel:${record.phone}`} label="Call Temple" />
                    ) : null}
                    {record.website ? (
                      <DetailAction href={record.website} label="Visit Website" external />
                    ) : null}
                    <Link
                      to="/dosha-parihara"
                      className="rounded-xl px-4 py-3 text-center text-sm font-black text-[#FFF5E5] transition hover:scale-[1.01]"
                      style={{
                        background: "rgba(255, 183, 77, 0.16)",
                        border: "1px solid rgba(255, 183, 77, 0.26)",
                      }}
                    >
                      Back to Search
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <DetailRow label="Ritual / Pooja Name" value={record.ritualName} />
              <DetailRow label="Temple Speciality" value={record.speciality} />
              <DetailRow label="Problems Covered" value={(record.problemKeywords || []).join(", ")} />
              <DetailRow label="Address" value={record.address || record.location} />
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              <DetailRow label="Description" value={record.description} />
              <DetailRow label="Search Keywords" value={(record.keywords || []).join(", ")} />
            </section>

            <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div
                className="rounded-[26px] p-5"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 183, 77, 0.18)",
                }}
              >
                <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: "#FFD49E" }}>
                  Quick Summary
                </div>
                <div className="mt-3 text-sm leading-7 text-[#FFF0D8]">
                  Search this temple by any of these terms:{" "}
                  <span className="font-black text-[#FFE19A]">
                    {[
                      record.templeName,
                      record.location,
                      ...(record.doshaTypes || []),
                      ...(record.problemKeywords || []),
                      record.ritualName,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                </div>
              </div>

              <div
                className="rounded-[26px] p-5"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 183, 77, 0.18)",
                }}
              >
                <div className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: "#FFD49E" }}>
                  Related Search Ideas
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[record.templeName, record.ritualName, ...(record.doshaTypes || []), ...(record.problemKeywords || [])]
                    .filter(Boolean)
                    .slice(0, 10)
                    .map((item) => (
                      <Tag key={item}>{item}</Tag>
                    ))}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
