import PageShell from "./PageShell";
import { translations } from "../translations";
import { useLanguage } from "../hooks/useLanguage";

export default function GuideOnPhonePage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  return (
    <PageShell title={t.guideOnPhone || "Guide on Phone"} transparent>
      <section
        className="app-surface rounded-3xl p-6 text-amber-50 shadow-lg max-w-3xl mx-auto border border-amber-500/20 text-center"
        style={{ background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-amber-100">
          Service coming soon
        </h2>
      </section>
    </PageShell>
  );
}
