import { TopNav } from "@/components/top-nav";
import { PricingCta } from "@/components/pricing-cta";
import { checkSubscription, getUserPlan } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

type PricingPageProps = {
  searchParams: Promise<{ message?: string }>;
};

const tiers = [
  {
    id: "starter",
    name: "STARTER",
    price: "£19",
    description: "Perfect for sole practitioners. Get the report generator for your regulatory jurisdiction.",
    features: [
      "1 jurisdiction report generator (FCA, ASIC, or SEC/FINRA)",
      "Research summariser",
      "Client email drafter",
      "20 reports per month",
      "Word document download",
    ],
    buttonBg: "#0A1628",
    buttonColor: "white",
  },
  {
    id: "plus",
    name: "PLUS",
    price: "£49",
    description: "All three jurisdictions unlocked plus compliance tools.",
    features: [
      "Everything in Starter",
      "All 3 report generators (FCA, ASIC, SEC/FINRA)",
      "Compliance checker",
      "Regulatory Update Alerts",
      "Unlimited reports",
    ],
    isPopular: true,
    buttonBg: "#C9A84C",
    buttonColor: "#0A1628",
  },
  {
    id: "pro",
    name: "PRO",
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
    buttonBg: "#0A1628",
    buttonColor: "white",
  },
];

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const currentPlan = user ? await getUserPlan(user.id) : null;

  return (
    <main style={{ backgroundColor: "white", minHeight: "100vh", paddingTop: "120px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px" }}>
        <TopNav email={user?.email} />

        {params.message === "subscribe" ? (
          <div style={{ backgroundColor: "#0A1628", color: "white", padding: "16px", textAlign: "center", borderRadius: "12px", marginBottom: "32px", marginTop: "32px", fontWeight: "600" }}>
            Please subscribe to a plan to access the Suitance dashboard.
          </div>
        ) : params.message === "upgrade" ? (
          <div style={{ backgroundColor: "#C9A84C", color: "#0A1628", padding: "16px", textAlign: "center", borderRadius: "12px", marginBottom: "32px", marginTop: "32px", fontWeight: "700" }}>
            Upgrade your plan to unlock this tool and more advanced features.
          </div>
        ) : null}

        <header style={{ marginTop: "64px" }}>
          <h1 style={{ fontSize: "42px", fontWeight: "800", color: "#0A1628", textAlign: "center", marginBottom: "16px" }}>
            Simple, transparent pricing.
          </h1>
          <p style={{ fontSize: "18px", color: "#64748B", textAlign: "center", marginBottom: "64px" }}>
            Try free for 7 days — then from £19/month. Cancel anytime.
          </p>
        </header>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
          {tiers.map((tier) => (
            <article 
              key={tier.id} 
              style={{ 
                backgroundColor: "white", 
                borderRadius: "16px", 
                padding: "40px", 
                flex: "1", 
                minWidth: "300px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)", 
                border: tier.isPopular ? "2px solid #C9A84C" : "1px solid #E5E7EB",
                position: "relative",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {tier.isPopular && (
                <div style={{ 
                  position: "absolute", 
                  top: "-12px", 
                  left: "50%", 
                  transform: "translateX(-50%)", 
                  backgroundColor: "#C9A84C", 
                  color: "#0A1628", 
                  fontSize: "12px", 
                  fontWeight: "700", 
                  padding: "4px 16px", 
                  borderRadius: "20px" 
                }}>
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: "14px", fontWeight: "700", color: "#C9A84C", letterSpacing: "2px", marginBottom: "8px" }}>
                {tier.name}
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "48px", fontWeight: "800", color: "#0A1628" }}>{tier.price}</span>
                <span style={{ fontSize: "18px", color: "#64748B" }}>/month</span>
              </div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "20px" }}>
                7-day free trial — no charge today
              </div>

              <p style={{ fontSize: "15px", color: "#64748B", marginBottom: "32px" }}>
                {tier.description}
              </p>

              <div style={{ flex: 1 }}>
                {tier.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "15px", color: "#374151", marginBottom: "12px" }}>
                    <span style={{ color: "#C9A84C" }}>✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "32px" }}>
                <PricingCta 
                  isLoggedIn={Boolean(user)} 
                  isSubscribed={isSubscribed} 
                  currentPlan={currentPlan}
                  tierPlan={tier.id as any}
                  price={tier.price}
                  style={{
                    width: "100%",
                    backgroundColor: tier.buttonBg,
                    color: tier.buttonColor,
                    padding: "14px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "15px",
                    border: "none",
                    cursor: "pointer",
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none"
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
