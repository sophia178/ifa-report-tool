import { TopNav } from "@/components/top-nav";
import { PricingCta } from "@/components/pricing-cta";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

type PricingPageProps = {
  searchParams: Promise<{ message?: string }>;
};

const features = [
  "Unlimited suitability reports",
  "All 8 FCA sections",
  "Audio transcription",
  "Word document download",
  "UK FCA Consumer Duty format",
];

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;

  return (
    <main className="pricing-page">
      <div className="pricing-shell">
        <TopNav email={user?.email} />

        {params.message === "subscribe" ? (
          <div className="pricing-banner">Please subscribe to access your dashboard</div>
        ) : null}

        <section className="pricing-hero fade-in">
          <span className="section-kicker">Pricing</span>
          <div className="stack" style={{ gap: 14 }}>
            <h1 className="display-title" style={{ fontSize: "clamp(2.4rem, 5vw, 4.4rem)" }}>
              Premium suitability reporting for independent advisers.
            </h1>
            <p>
              Suitance gives UK financial advisers one simple plan for faster FCA-ready
              reporting, built-in transcription, and polished Word exports.
            </p>
          </div>
        </section>

        <section className="pricing-grid">
          <article className="card pricing-card reveal-on-scroll">
            <div className="stack" style={{ gap: 10 }}>
              <span className="pill">Single plan</span>
              <div>
                <h2 className="pricing-plan-name">Suitance Beta</h2>
                <div className="pricing-price">
                  <strong>£19</strong>
                  <span>per month</span>
                </div>
              </div>
            </div>

            <div className="pricing-feature-list">
              {features.map((feature) => (
                <div className="pricing-feature" key={feature}>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <PricingCta isLoggedIn={Boolean(user)} isSubscribed={isSubscribed} />
            <p className="pricing-smallprint">
              Beta pricing locked in for life for early members. Cancel anytime.
            </p>
          </article>

          <aside className="soft-panel pricing-note reveal-on-scroll">
            <div className="stack">
              <span className="badge">Included</span>
              <h2 className="section-title">Built for the full suitability workflow.</h2>
              <p className="muted">
                Capture adviser notes or audio, generate a structured report, review the
                output, and export the final document in one secure workspace.
              </p>
              <div className="meta">
                <span>For UK independent financial advisers</span>
                <span>FCA-aligned structure</span>
                <span>Stripe-secured billing</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
