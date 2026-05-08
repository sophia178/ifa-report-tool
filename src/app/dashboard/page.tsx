import { ReportStudio } from "@/components/report-studio";
import { requireUser } from "@/lib/auth";
import type { Report } from "@/types/report";
import { FileText, Download, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  // 1. Fetch user profile for display name and jurisdiction
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, jurisdiction, stripe_price_id")
    .eq("id", user.id)
    .single();

  const { data } = await supabase
    .from("reports")
    .select("id, client_name, created_at, report_text")
    .order("created_at", { ascending: false });

  const reports: Report[] = (data ?? []).map((report) => ({
    id: report.id,
    client_name: report.client_name,
    created_at: report.created_at,
    content: report.report_text,
  }));

  const displayName = profile?.display_name || user.email?.split('@')[0] || "Adviser";
  
  // 2. Dynamic greeting based on time
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17) greeting = "Good evening";

  // 3. Dynamic content based on jurisdiction
  const jurisdiction = profile?.jurisdiction || "uk";
  const isPlus = profile?.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
  const isPro = profile?.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
  const hasFullAccess = isPlus || isPro;

  const getDashboardHero = () => {
    if (hasFullAccess) {
      return {
        title: "Report Studio",
        desc: "Transform meeting notes into professional suitability reports, SOAs, or financial plans.",
        link: "#studio"
      };
    }
    switch (jurisdiction) {
      case "aus": return { title: "Australian SOA", desc: "Transform your meeting notes into a complete ASIC-compliant Statement of Advice.", link: "/dashboard/soa-australia" };
      case "usa": return { title: "Financial Plan", desc: "Transform your meeting notes into a complete SEC/FINRA-compliant Financial Plan.", link: "/dashboard/usa-plan" };
      default: return { title: "Suitability Report", desc: "Transform your meeting notes into a complete FCA-compliant suitability report.", link: "#studio" };
    }
  };

  const hero = getDashboardHero();

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 48px" }}>
      <div style={{ marginBottom: "64px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "8px" }}>
          {greeting}, {displayName}
        </h1>
        <p style={{ color: "#5F6877", fontSize: "16px" }}>Welcome back to your professional workspace.</p>
      </div>

      {/* Primary Action Card */}
      <div style={{ 
        backgroundColor: "#FFFFFF", 
        borderRadius: "24px", 
        padding: "64px", 
        textAlign: "center", 
        border: "1px solid #E5E7EB", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        marginBottom: "80px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          borderRadius: "20px", 
          backgroundColor: "#F4F6F9", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          margin: "0 auto 32px",
          color: "#C9A84C"
        }}>
          <FileText size={40} />
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "16px" }}>{hero.title}</h2>
        <p style={{ color: "#5F6877", fontSize: "18px", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px", lineHeight: "1.6" }}>
          {hero.desc}
        </p>
        <Link href={hero.link} style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: "12px", 
          backgroundColor: "#0A1628", 
          color: "#FFFFFF", 
          padding: "16px 36px", 
          borderRadius: "12px", 
          fontWeight: "700", 
          textDecoration: "none",
          fontSize: "16px",
          transition: "transform 0.2s ease"
        }}>
          Start Building <ArrowRight size={20} />
        </Link>
      </div>

      {/* Recent Reports Section */}
      {reports.length > 0 && (
        <div style={{ marginBottom: "80px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", marginBottom: "24px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recent Reports
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            {reports.slice(0, 5).map((report) => (
              <div key={report.id} style={{ 
                backgroundColor: "#FFFFFF", 
                borderRadius: "16px", 
                padding: "24px", 
                border: "1px solid #F0F2F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#F4F6F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#5F6877" }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", marginBottom: "4px" }}>{report.client_name}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8A94A6", fontSize: "13px" }}>
                      <Calendar size={14} />
                      {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button style={{ 
                    padding: "10px 20px", 
                    borderRadius: "8px", 
                    backgroundColor: "#F4F6F9", 
                    color: "#0A1628", 
                    fontWeight: "600", 
                    fontSize: "13px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Studio for Action */}
      <div id="studio">
        <ReportStudio reports={reports} />
      </div>
    </div>
  );
}
