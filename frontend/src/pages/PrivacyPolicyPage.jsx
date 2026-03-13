import PageShell from "./PageShell";

export default function PrivacyPolicyPage() {
  return (
    <PageShell title="Privacy Policy">
      <section className="app-surface rounded-3xl p-5 md:p-6 text-amber-50 shadow-lg max-w-4xl mx-auto">
        <div className="text-sm md:text-base text-amber-100/90 leading-relaxed space-y-3">
          <p>We collect only the minimum data required to operate this application, such as language, location, and settings you choose to save.</p>
          <p>We do not sell, rent, or share personal data with third parties for marketing or profiling.</p>
          <p>Any diagnostics or analytics are limited to stability and performance improvements and are processed in aggregated form.</p>
          <p>Stored preferences are kept locally in your browser or device and can be cleared at any time through your settings.</p>
        </div>
      </section>
    </PageShell>
  );
}
