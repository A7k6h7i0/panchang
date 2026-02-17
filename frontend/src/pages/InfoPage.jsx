import PageShell from "./PageShell";

export default function InfoPage() {
  return (
    <PageShell title="Info">
      <div className="grid gap-4">
        <section className="rounded-3xl border border-white/10 bg-black/20 p-5 text-amber-50">
          <div className="text-base font-black text-amber-100">Hindu Calendar</div>
          <div className="mt-2 text-sm text-amber-100/80">
            Panchang, festivals, muhurat, kundali and more. Data is fetched from your backend Prokerala integration
            where available.
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/20 p-5 text-amber-50">
          <div className="text-sm font-black text-amber-100">Tips</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-amber-100/80">
            <li>Set your location in Settings for accurate sunrise/tithi.</li>
            <li>Use Month View for calendar navigation.</li>
            <li>Hindu Time shows Ghati/Pal/Vipal from sunrise.</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

