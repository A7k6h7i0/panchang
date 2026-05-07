import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";
import PageShell from "./PageShell";

export default function DisclaimerPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  return (
    <PageShell title={t.disclaimerTitle || "Disclaimer"} transparent>
      <div className="grid gap-4 max-w-4xl mx-auto pb-8">
        <section
          className="app-surface rounded-3xl p-5 md:p-6 text-amber-50 shadow-lg"
          style={{
            background: "transparent",
            border: "1.5px solid rgba(255, 183, 77, 0.4)",
            boxShadow: "0 8px 32px rgba(255, 152, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -3px 0 rgba(139, 69, 19, 0.25), 0 0 40px rgba(255, 183, 77, 0.2)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
        >
          <div className="text-sm md:text-base text-amber-100/90 leading-relaxed space-y-3">
            <p>Panchang, astrology, and related content are provided for informational and cultural purposes only.</p>
            <p>We make no warranties regarding accuracy, completeness, or suitability for any particular purpose.</p>
            <p>You accept full responsibility for decisions made based on this content, and we are not liable for any loss, harm, or damages arising from its use.</p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
