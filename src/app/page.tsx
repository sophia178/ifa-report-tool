import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { 
  ArrowRight, CheckCircle2, FileText, 
  Zap, ShieldCheck, Download, 
  CheckCircle, Users, Layout, Shield
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const startHref = user ? (isSubscribed ? "/dashboard" : "/pricing") : "/signup";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", color: "#132033", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Nav handled by component but ensuring it fits the minimal theme */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        <TopNav email={user?.email} />
      </div>

      {/* Hero Section */}
      <section style={{ textAlign: "center", paddingTop: "80px", paddingBottom: "120px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: "72px", fontWeight: "800", color: "#0A1628", marginBottom: "24px", lineHeight: "1.1", letterSpacing: "-0.04em" }}>
            Suitability reports.<br />Written in seconds.
          </h1>
          <p style={{ fontSize: "22px", color: "#5F6877", marginBottom: "48px", lineHeight: "1.5", maxWidth: "640px", margin: "0 auto 48px" }}>
            Suitance turns your client meeting notes into complete FCA-compliant suitability reports. Reviewed by you. Sent with confidence.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <Link href={startHref} style={{ backgroundColor: "#C9A84C", color: "#FFFFFF", fontWeight: "700", padding: "18px 40px", borderRadius: "12px", fontSize: "18px", textDecoration: "none", boxShadow: "0 4px 14px rgba(201, 168, 76, 0.4)" }}>
              Start free — £19/month
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Step Features */}
      <section style={{ paddingBottom: "120px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            {[
              { icon: FileText, title: "Paste notes or upload audio", desc: "Start with your raw evidence from client meetings." },
              { icon: Zap, title: "AI generates your full FCA report", desc: "Our models build a structured, compliant draft instantly." },
              { icon: Download, title: "Download as Word document", desc: "Export your polished report ready for final review." }
            ].map((item, i) => (
              <div key={i} style={{ padding: "40px", borderRadius: "24px", border: "1px solid #F0F2F5", textAlign: "center", backgroundColor: "#FFFFFF" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#F4F6F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#0A1628" }}>
                  <item.icon size={28} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px", color: "#0A1628" }}>{item.title}</h3>
                <p style={{ color: "#5F6877", lineHeight: "1.6" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section style={{ borderTop: "1px solid #F0F2F5", borderBottom: "1px solid #F0F2F5", backgroundColor: "#FAFBFC", padding: "32px 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", alignItems: "center", textAlign: "center" }}>
            {[
              { label: "96/100 compliance score", icon: ShieldCheck },
              { label: "FCA Consumer Duty aligned", icon: CheckCircle },
              { label: "All 8 required sections", icon: Layout },
              { label: "Used by UK advisers", icon: Users }
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", color: "#5F6877", fontSize: "15px", fontWeight: "600" }}>
                <item.icon size={20} color="#C9A84C" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: "120px 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628" }}>Simple, transparent pricing.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            {[
              { name: "Starter", price: "£19", desc: "Perfect for sole practitioners." },
              { name: "Plus", price: "£49", desc: "For growing advisory firms.", featured: true },
              { name: "Pro", price: "£99", desc: "Full terminal for large teams." }
            ].map((tier, i) => (
              <div key={i} style={{ padding: "48px", borderRadius: "24px", border: tier.featured ? "2px solid #C9A84C" : "1px solid #F0F2F5", backgroundColor: "#FFFFFF", position: "relative" }}>
                {tier.featured && (
                  <span style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#C9A84C", color: "#FFFFFF", padding: "4px 16px", borderRadius: "99px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Most Popular</span>
                )}
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>{tier.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "40px", fontWeight: "800" }}>{tier.price}</span>
                  <span style={{ color: "#8A94A6" }}>/mo</span>
                </div>
                <p style={{ color: "#5F6877", marginBottom: "32px", fontSize: "14px" }}>{tier.desc}</p>
                <Link href="/signup" style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: "10px", backgroundColor: tier.featured ? "#0A1628" : "#F4F6F9", color: tier.featured ? "#FFFFFF" : "#0A1628", fontWeight: "700", textDecoration: "none" }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "80px 0", borderTop: "1px solid #F0F2F5" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "32px" }}>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628" }}>Suitance<span style={{ color: "#C9A84C" }}>.</span></div>
          <div style={{ display: "flex", gap: "32px", color: "#8A94A6", fontSize: "14px" }}>
            <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>Privacy</Link>
            <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
          </div>
          <div style={{ color: "#8A94A6", fontSize: "14px" }}>© 2026 Suitance Intelligence.</div>
        </div>
      </footer>
    </main>
  );
}
