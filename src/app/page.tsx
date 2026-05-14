import Link from "next/link";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const startHref = user ? (isSubscribed ? "/dashboard" : "/pricing") : "/signup";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", color: "#132033", fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: 0 }}>
      {/* Navigation Bar */}
      <nav style={{ width: "100%", backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: "0 48px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box", position: "fixed", top: 0, left: 0, zIndex: 1000 }}>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0A1628" }}>Suitance</div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/login" style={{ textDecoration: "none", color: "#6B7280", fontSize: "14px", fontWeight: "500" }}>Log in</Link>
          <Link href={startHref} style={{ textDecoration: "none", backgroundColor: "#0A1628", color: "#FFFFFF", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600" }}>Start now</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ backgroundColor: "#0A1628", padding: "184px 48px 120px 48px", textAlign: "center" }}>
        <h1 style={{ fontSize: "56px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1", maxWidth: "800px", margin: "0 auto 24px" }}>
          Suitability reports. Written <span style={{ textDecoration: "underline", textDecorationColor: "#C9A84C", textUnderlineOffset: "8px" }}>in seconds.</span>
        </h1>
        <p style={{ fontSize: "18px", color: "#94A3B8", maxWidth: "700px", margin: "0 auto 40px", lineHeight: "1.6" }}>
          Suitance helps financial advisers draft suitability reports faster. All output must be reviewed by a qualified regulated adviser before use.
        </p>
        <Link href={startHref} style={{ display: "inline-block", textDecoration: "none", backgroundColor: "#C9A84C", color: "#0A1628", fontWeight: "700", fontSize: "16px", padding: "16px 40px", borderRadius: "50px", border: "none", cursor: "pointer", marginBottom: "32px" }}>
          Start free — 7 days free trial
        </Link>
        <div style={{ fontSize: "12px", color: "#C9A84C", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
          🇬🇧 designed for FCA suitability report standards — 🇦🇺 designed for ASIC Statement of Advice standards — 🇺🇸 designed for CFP Board and SEC planning standards
        </div>
      </section>

      {/* Social Proof Bar */}
      <section style={{ backgroundColor: "#0A1628", padding: "24px 48px", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>96/100 compliance score</div>
          <div style={{ width: "1px", height: "16px", backgroundColor: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>FCA Consumer Duty aligned</div>
          <div style={{ width: "1px", height: "16px", backgroundColor: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>All 8 required sections</div>
          <div style={{ width: "1px", height: "16px", backgroundColor: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>Used by global advisers</div>
          <div style={{ width: "1px", height: "16px", backgroundColor: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: "600" }}>7-day free trial</div>
        </div>
      </section>

      {/* Three Steps Section */}
      <section style={{ backgroundColor: "#FFFFFF", padding: "80px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "32px" }}>
          {[
            { num: "1", title: "Paste notes or upload audio", desc: "Start with your raw evidence from client meetings." },
            { num: "2", title: "AI generates your full report", desc: "Our models build a structured, compliant draft instantly." },
            { num: "3", title: "Download as Word document", desc: "Export your polished report ready for final review." }
          ].map((step, i) => (
            <div key={i} style={{ backgroundColor: "#F8FAFC", padding: "32px", borderRadius: "12px", flex: 1 }}>
              <div style={{ width: "32px", height: "32px", backgroundColor: "#0A1628", color: "#FFFFFF", borderRadius: "50%", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", marginTop: "16px", marginBottom: "8px" }}>{step.title}</h3>
              <p style={{ fontSize: "15px", color: "#64748B", lineHeight: "1.6", margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ backgroundColor: "#F8FAFC", padding: "80px 48px", textAlign: "center" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0A1628", marginBottom: "16px" }}>Simple, transparent pricing.</h2>
        <p style={{ fontSize: "18px", color: "#64748B", textAlign: "center", marginBottom: "64px" }}>
          Start today from £19/month. Scale as you grow.
        </p>
        <div style={{ display: "flex", gap: "24px", maxWidth: "900px", margin: "0 auto", justifyContent: "center" }}>
          {[
            { name: "Starter", price: "£19", desc: "Perfect for sole practitioners.", featured: false },
            { name: "Plus", price: "£49", desc: "For growing advisory firms.", featured: true },
            { name: "Pro", price: "£99", desc: "Full terminal for large teams.", featured: false }
          ].map((tier, i) => (
            <div key={i} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "40px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: tier.featured ? "2px solid #C9A84C" : "1px solid transparent", display: "flex", flexDirection: "column", textAlign: "left" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#6B7280", marginBottom: "8px", textTransform: "uppercase" }}>{tier.name}</h3>
              <div style={{ fontSize: "48px", fontWeight: "800", color: "#0A1628", marginBottom: "16px" }}>{tier.price}<span style={{ fontSize: "16px", color: "#6B7280", fontWeight: "500" }}>/mo</span></div>
              <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "auto", lineHeight: "1.5" }}>{tier.desc}</p>
              <Link href="/signup" style={{ display: "block", textAlign: "center", textDecoration: "none", backgroundColor: "#0A1628", color: "#FFFFFF", padding: "14px", borderRadius: "8px", marginTop: "24px", fontWeight: "600", fontSize: "14px" }}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ backgroundColor: "#FFFFFF", padding: "56px 48px", borderTop: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "16px", padding: "28px 28px", border: "1px solid #E5E7EB", color: "#475569", lineHeight: "1.7", fontSize: "14px" }}>
            Suitance is a software drafting tool. It is not authorised or regulated by the FCA, ASIC, or SEC. All AI-generated content must be reviewed, verified, and approved by a qualified regulated financial adviser before use with any client. Reports generated by Suitance do not constitute regulated financial advice.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#0A1628", padding: "40px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#FFFFFF", fontSize: "14px" }}>
          <div style={{ fontWeight: "700", fontSize: "18px" }}>Suitance<span style={{ color: "#C9A84C" }}>.</span></div>
          <div style={{ display: "flex", gap: "32px", opacity: 0.7 }}>
            <span>© 2026 Suitance</span>
            <Link href="/terms" style={{ color: "#FFFFFF", textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "#FFFFFF", textDecoration: "none" }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
