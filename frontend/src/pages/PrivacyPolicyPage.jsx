import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";
import PageShell from "./PageShell";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  return (
    <PageShell title={t.privacyPolicyTitle || "Privacy Policy"} transparent>
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
            <p>We collect only the minimum data required to operate this application, such as language, location, and settings you choose to save.</p>
            <p>We do not sell, rent, or share personal data with third parties for marketing or profiling.</p>
            <p>Any diagnostics or analytics are limited to stability and performance improvements and are processed in aggregated form.</p>
            <p>Stored preferences are kept locally in your browser or device and can be cleared at any time through your settings.</p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
