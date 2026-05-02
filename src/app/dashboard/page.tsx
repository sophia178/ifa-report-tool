import { ReportStudio } from "@/components/report-studio";
import { requireUser } from "@/lib/auth";
import { checkSubscription } from "@/lib/subscription";
import type { Report } from "@/types/report";
import { redirect } from "next/navigation";
import { Plus, FileText, Download, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const isSubscribed = await checkSubscription(user.id);

  if (!isSubscribed) {
    redirect("/pricing?message=subscribe");
  }

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

  const userEmail = user.email || "Adviser";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 0" }}>
      <div style={{ marginBottom: "64px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "8px" }}>
          Good morning, {userEmail.split('@')[0]}
        </h1>
        <p style={{ color: "#5F6877", fontSize: "16px" }}>Welcome back to your professional workspace.</p>
      </div>

      {/* Primary Action Card */}
      <div style={{ 
        backgroundColor: "#FFFFFF", 
        borderRadius: "24px", 
        padding: "64px", 
        textAlign: "center", 
        border: "1px solid #F0F2F5", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        marginBottom: "80px"
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
        <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", marginBottom: "16px" }}>Generate New Report</h2>
        <p style={{ color: "#5F6877", fontSize: "18px", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
          Transform your latest client meeting notes into a complete FCA-compliant suitability report.
        </p>
        <Link href="#studio" style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: "12px", 
          backgroundColor: "#0A1628", 
          color: "#FFFFFF", 
          padding: "16px 32px", 
          borderRadius: "12px", 
          fontWeight: "700", 
          textDecoration: "none",
          fontSize: "16px"
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
