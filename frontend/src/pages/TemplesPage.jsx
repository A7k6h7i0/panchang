import PageShell from "./PageShell";
import ServiceSearchPanel from "../components/ServiceSearchPanel";
import { useLanguage } from "../hooks/useLanguage";
import { translations } from "../translations";

export default function TemplesPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const title = t.temples || "Temples";
  const subtitle = t.templesSubtitle || "Nearby temples and search";

  return (
    <PageShell title={title} transparent>
      <div className="mx-auto w-full max-w-4xl">
        <ServiceSearchPanel
          serviceType="temple"
          title={title}
          subtitle={subtitle}
        />
      </div>
    </PageShell>
  );
}
