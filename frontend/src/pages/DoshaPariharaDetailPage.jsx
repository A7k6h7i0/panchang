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

function InfoTile({ label, value }) {
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
      <div className="mt-2 text-sm font-semibold leading-6 text-[#FFF1DB]">{value}</div>
    </div>
  );
}

function ActionLink({ href, label, external = false, primary = false }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="rounded-xl px-4 py-3 text-center text-sm font-black text-[#FFF5E5] transition hover:scale-[1.01]"
      style={{
        background: primary ? "rgba(255, 183, 77, 0.16)" : "rgba(255, 255, 255, 0.05)",
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
          <section
            className="rounded-[30px] p-5 sm:p-6"
            style={{
              background: "linear-gradient(180deg, rgba(20, 10, 6, 0.72) 0%, rgba(35, 16, 9, 0.86) 100%)",
              border: "1.5px solid rgba(255, 183, 77, 0.32)",
              boxShadow: "0 18px 40px rgba(0, 0, 0, 0.24)",
            }}
          >
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
              {(record.doshaTypes || []).map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoTile label="Ritual" value={record.ritualName || "Not listed"} />
              <InfoTile label="Location" value={record.location || record.state || "Not listed"} />
              <InfoTile label="Coverage" value={`${(record.problemKeywords || []).length || 0} problems`} />
              <InfoTile label="Temple Speciality" value={record.speciality || "Not listed"} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {record.phone ? <ActionLink href={`tel:${record.phone}`} label="Call Temple" /> : null}
              {record.website ? <ActionLink href={record.website} label="Visit Website" external /> : null}
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
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
