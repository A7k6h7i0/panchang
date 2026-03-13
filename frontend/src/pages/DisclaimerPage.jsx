import PageShell from "./PageShell";

export default function DisclaimerPage() {
  return (
    <PageShell title="Disclaimer">
      <section className="app-surface rounded-3xl p-5 md:p-6 text-amber-50 shadow-lg max-w-4xl mx-auto border border-red-500/20 bg-gradient-to-br from-black/20 to-red-900/10">
        <div className="text-sm md:text-base text-amber-100/90 leading-relaxed space-y-3">
          <p>Panchang, astrology, and related content are provided for informational and cultural purposes only.</p>
          <p>We make no warranties regarding accuracy, completeness, or suitability for any particular purpose.</p>
          <p>You accept full responsibility for decisions made based on this content, and we are not liable for any loss, harm, or damages arising from its use.</p>
        </div>
      </section>
    </PageShell>
  );
}
