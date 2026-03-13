import PageShell from "./PageShell";
import ServiceSearchPanel from "../components/ServiceSearchPanel";

export default function PurohithPage() {
  return (
    <PageShell title="Purohith">
      <div className="mx-auto w-full max-w-4xl">
        <ServiceSearchPanel
          serviceType="purohit"
          title="Purohith"
          subtitle="Nearby purohiths and search"
        />
      </div>
    </PageShell>
  );
}
