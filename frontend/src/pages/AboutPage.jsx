import PageShell from "./PageShell";

export default function AboutPage() {
  return (
    <PageShell title="About">
      <div className="grid gap-4">
        <section className="app-surface rounded-3xl p-5 text-amber-50">
          <div className="text-base font-black text-amber-100">About this app</div>
          <div className="mt-2 text-sm text-amber-100/80">
            Built as a Hindu calendar dashboard with Prokerala-backed astrology endpoints on the server.
          </div>
        </section>
      </div>
    </PageShell>
  );
}
