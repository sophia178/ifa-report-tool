import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { 
  ArrowRight, CheckCircle2, FileText, 
  Search, Mail, Map, Shield, Flag, BarChart3, Coffee, 
  Calendar, ShieldAlert, Users, Newspaper, Layout, MessageSquare,
  Lock, PieChart, Zap
} from "lucide-react";

const features = [
  { name: "FCA Suitability Reports", icon: FileText, desc: "FCA-compliant reports generated from meeting notes." },
  { name: "Research Summariser", icon: Search, desc: "Quickly digest complex fund and market research." },
  { name: "Email Drafter", icon: Mail, desc: "Professional client communications in your tone of voice." },
  { name: "Australian SOA", icon: Map, desc: "Full Statement of Advice generation for ASIC compliance." },
  { name: "USA Financial Plans", icon: Flag, desc: "Comprehensive planning tools for US-based advisers." },
  { name: "Compliance Checker", icon: Shield, desc: "Automated regulatory risk assessment for documents." },
  { name: "Regulatory Alerts", icon: Bell, desc: "Stay ahead of FCA, ASIC, and SEC rule changes." },
  { name: "Markets Terminal", icon: BarChart3, desc: "Real-time global market data and analytics." },
  { name: "Market Briefings", icon: Coffee, desc: "Daily summaries of key market moving events." },
  { name: "Financial News", icon: Newspaper, desc: "Curated news feed from top financial sources." },
  { name: "Economic Calendar", icon: Calendar, desc: "Never miss a key economic data release." },
  { name: "Portfolio Risk", icon: ShieldAlert, desc: "Deep-dive analysis into client portfolio risk." },
  { name: "Team Management", icon: Users, desc: "Collaborative workspaces for multi-adviser firms." },
  { name: "Strategy Builder", icon: Zap, desc: "Backtest and document complex trading strategies." },
  { name: "Meeting Transcriber", icon: MessageSquare, desc: "Convert meeting audio to text for analysis." },
  { name: "Secure Vault", icon: Lock, desc: "Military-grade encryption for client evidence." },
  { name: "Portfolio Rebalancing", icon: PieChart, desc: "Automated drift analysis and rebalancing logic." }
].map(f => ({ ...f, icon: f.icon || FileText }));

// Add Bell since it was missing in the previous import but used in features
import { Bell } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const startHref = user ? (isSubscribed ? "/dashboard" : "/pricing") : "/signup";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", color: "#132033", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Hero Section */}
      <section style={{ backgroundColor: "#0A1628", color: "#FFFFFF", paddingTop: "80px", paddingBottom: "160px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <TopNav email={user?.email} />
          
          <div style={{ marginTop: "128px", maxWidth: "1024px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "4px 12px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: "500", marginBottom: "32px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C9A84C" }}></span>
              The Operating System for Finance v2.4
            </div>
            <h1 style={{ fontSize: "64px", fontWeight: "900", color: "#FFFFFF", marginBottom: "32px", lineHeight: "1.1" }}>
              The professional terminal for <br />
              <span style={{ color: "#C9A84C" }}>financial professionals.</span>
            </h1>
            <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.7)", maxWidth: "672px", marginBottom: "48px", lineHeight: "1.6" }}>
              Full regulatory coverage for UK, Australia, and USA. 
              Suitability reports, compliance checking, market intelligence, and portfolio risk analysis in one unified professional workspace.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
              <Link href={startHref} style={{ backgroundColor: "#C9A84C", color: "#0A1628", fontWeight: "700", padding: "16px 32px", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "12px", fontSize: "18px", textDecoration: "none", transition: "background-color 0.2s" }}>
                Get Started for £19/mo
                <ArrowRight size={20} />
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: "500" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} color="#C9A84C" /> FCA Aligned</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle2 size={16} color="#C9A84C" /> ASIC Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ backgroundColor: "#F4F6F9", padding: "128px 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "96px" }}>
            <h2 style={{ fontSize: "40px", fontWeight: "900", color: "#0A1628", marginBottom: "24px" }}>Built for the full advice lifecycle.</h2>
            <p style={{ color: "#5F6877", maxWidth: "672px", margin: "0 auto", fontSize: "18px", lineHeight: "1.6" }}>
              One unified platform that transforms rough evidence into professional-grade financial advice documentation in seconds.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {features.map((feature, i) => (
              <div key={i} style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "32px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", transition: "transform 0.2s" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(10, 22, 40, 0.05)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#0A1628", marginBottom: "24px" }}>
                  <feature.icon size={24} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628", marginBottom: "12px" }}>{feature.name}</h3>
                <p style={{ color: "#5F6877", fontSize: "14px", lineHeight: "1.6" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: "128px 0", backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "96px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
              <h2 style={{ fontSize: "40px", fontWeight: "900", color: "#0A1628" }}>Advice intelligence, simplified.</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {[
                  { step: "01", title: "Capture Data", desc: "Upload meeting audio or paste rough notes from your client meeting." },
                  { step: "02", title: "AI Analysis", desc: "Our models process the evidence against specific regulatory requirements." },
                  { step: "03", title: "Refine & Export", desc: "Review the generated report, make final tweaks, and export to professional Word doc." }
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "24px" }}>
                    <span style={{ fontSize: "36px", fontWeight: "900", color: "rgba(201, 168, 76, 0.2)", fontVariantNumeric: "tabular-nums" }}>{item.step}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <h4 style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628" }}>{item.title}</h4>
                      <p style={{ color: "#5F6877" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor: "#0A1628", borderRadius: "32px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", position: "relative" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "16px", backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", minHeight: "400px" }}>
                <div style={{ height: "48px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "8px", padding: "0 24px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.5)" }}></div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(245, 158, 11, 0.5)" }}></div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.5)" }}></div>
                </div>
                <div style={{ flex: 1, padding: "32px" }}>
                  <div style={{ height: "16px", width: "192px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "4px", marginBottom: "24px" }}></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ height: "8px", width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}></div>
                    <div style={{ height: "8px", width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}></div>
                    <div style={{ height: "8px", width: "75%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "4px" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: "128px 0", backgroundColor: "#0A1628", color: "#FFFFFF" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "96px" }}>
            <h2 style={{ fontSize: "40px", fontWeight: "900", marginBottom: "24px" }}>Professional pricing for professional firms.</h2>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Choose the tier that matches your firm&apos;s regulatory scope.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            {[
              { name: "Starter", price: "£19", desc: "Essential toolkit for UK IFAs.", accent: false },
              { name: "Plus", price: "£49", desc: "International scope and compliance.", accent: true },
              { name: "Pro", price: "£99", desc: "Full market intelligence terminal.", accent: false }
            ].map((tier, i) => (
              <div key={i} style={{ padding: "48px", borderRadius: "24px", border: tier.accent ? "1px solid #C9A84C" : "1px solid rgba(255,255,255,0.1)", backgroundColor: tier.accent ? "#1E293B" : "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "700" }}>{tier.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "48px", fontWeight: "900" }}>{tier.price}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: "500" }}>/mo</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "16px" }}>{tier.desc}</p>
                </div>
                <Link href="/signup" style={{ padding: "16px 0", width: "100%", textAlign: "center", fontWeight: "700", borderRadius: "9999px", textDecoration: "none", backgroundColor: tier.accent ? "#C9A84C" : "#FFFFFF", color: "#0A1628", transition: "background-color 0.2s" }}>
                  Start Free Trial
                </Link>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                      <CheckCircle2 size={16} color="#C9A84C" />
                      <span>Feature inclusion {j}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ backgroundColor: "#0A1628", color: "#FFFFFF", padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "40px" }}>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "40px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#FFFFFF" }}>Suitance<span style={{ color: "#C9A84C" }}>.</span></div>
            <div style={{ display: "flex", gap: "40px", fontSize: "14px", fontWeight: "500", color: "rgba(255,255,255,0.5)" }}>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
              <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>© 2026 Suitance Intelligence. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
