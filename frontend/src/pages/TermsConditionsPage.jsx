import PageShell from "./PageShell";

export default function TermsConditionsPage() {
  return (
    <PageShell title="Terms & Conditions">
      <section className="app-surface rounded-3xl p-5 md:p-6 text-amber-50 shadow-lg max-w-4xl mx-auto">
        <div className="text-sm md:text-base text-amber-100/90 leading-relaxed space-y-3">
          <p>This application is provided on an "as is" and "as available" basis, without warranties of any kind.</p>
          <p>You agree to use the app lawfully, not to disrupt its operation, and not to copy, reverse engineer, or redistribute the service without explicit permission.</p>
          <p>We may update, suspend, or discontinue features at any time without prior notice.</p>
        </div>
      </section>
    </PageShell>
  );
}
