import PageShell from "./PageShell";
import { translations } from "../translations";
import { useState, useEffect } from "react";
import { loadLanguage } from "../utils/appSettings";

export default function GuideOnPhonePage() {
  const [language, setLanguage] = useState(() => loadLanguage() || "en");

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(loadLanguage() || "en");
    };
    window.addEventListener("storage", handleLanguageChange);
    return () => window.removeEventListener("storage", handleLanguageChange);
  }, []);

  const t = translations[language] || translations.en;

  return (
    <PageShell title={t.guideOnPhone || "Guide on Phone"}>
      <section className="app-surface rounded-3xl p-5 md:p-6 text-amber-50 shadow-lg max-w-4xl mx-auto border border-amber-500/20 bg-gradient-to-br from-black/20 to-amber-900/10">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-2xl md:text-3xl font-bold text-amber-100 mb-4">
            {t.serviceComingSoon || "The service is coming soon"}
          </h2>
          <p className="text-lg text-amber-200/80">
            We are working on this feature. Stay tuned!
          </p>
        </div>
      </section>
    </PageShell>
  );
}
