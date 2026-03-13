import PageShell from "./PageShell";
import ServiceSearchPanel from "../components/ServiceSearchPanel";

export default function TemplesPage() {
  return (
    <PageShell title="Temples">
      <div className="mx-auto w-full max-w-4xl">
        <ServiceSearchPanel
          serviceType="temple"
          title="Temples"
          subtitle="Nearby temples and search"
        />
      </div>
    </PageShell>
  );
}
