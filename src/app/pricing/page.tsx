import { TopNav } from "@/components/top-nav";
import { PricingCta } from "@/components/pricing-cta";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

type PricingPageProps = {
  searchParams: Promise<{ message?: string }>;
};

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "£19",
    description: "Perfect for sole practitioners and paraplanners.",
    features: [
      "UK FCA suitability reports",
      "Research summariser",
      "Client email drafter",
      "20 reports per month",
      "Word document download",
    ],
    isStripe: true,
  },
  {
    id: "plus",
    name: "Plus",
    price: "£49",
    description: "Comprehensive tools for professional advisers.",
    features: [
      "Everything in Starter",
      "Australian SOA generator",
      "USA financial plan generator",
      "Compliance checker",
      "Unlimited reports",
    ],
    isStripe: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "£99",
    description: "The complete Suitance OS for advice firms.",
    features: [
      "Everything in Plus",
      "Live market dashboard",
      "AI market briefing",
      "Economic calendar",
      "Portfolio risk analyser",
      "AI Trade journal",
      "Team seats",
    ],
    isStripe: true,
  },
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
            <h1 className="display-title" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
              The operating system for modern financial advice.
            </h1>
            <p>
              Choose the plan that fits your practice. From simple reporting to a full firm-wide dashboard.
            </p>
          </div>
        </section>

        <section className="pricing-grid-three">
          {tiers.map((tier) => (
            <article key={tier.name} className="card pricing-card reveal-on-scroll">
              <div className="stack" style={{ gap: 10 }}>
                <div className="flex justify-between items-start">
                  <span className="pill">{tier.name}</span>
                </div>
                <div>
                  <div className="pricing-price">
                    <strong>{tier.price}</strong>
                    <span>per month</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{tier.description}</p>
                </div>
              </div>

              <div className="pricing-feature-list" style={{ marginTop: 24, flex: 1 }}>
                {tier.features.map((feature) => (
                  <div className="pricing-feature" key={feature}>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <PricingCta 
                isLoggedIn={Boolean(user)} 
                isSubscribed={isSubscribed} 
                plan={tier.id as any}
                price={tier.price}
              />
            </article>
          ))}
        </section>

        <section className="mt-20">
          <aside className="soft-panel pricing-note reveal-on-scroll">
            <div className="stack">
              <span className="badge">Professional Grade</span>
              <h2 className="section-title">Built for the full advice lifecycle.</h2>
              <p className="muted">
                Whether you are drafting a simple suitability report or performing complex portfolio risk analysis, Suitance provides the security, accuracy, and professional polish your clients expect.
              </p>
              <div className="meta">
                <span>Multi-region support (UK, US, AU)</span>
                <span>FCA-aligned compliance</span>
                <span>Stripe-secured billing</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
