"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  client_name: string;
  client_email: string;
  content: string;
  created_at: string;
  type: "FCA" | "SOA" | "USA";
  table: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchAllReports() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const [fca, soa, usa] = await Promise.all([
          supabase.from("reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("australian_soas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("usa_financial_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);

        const fcaReports: Report[] = (fca.data || []).map((r: any) => ({
          id: r.id,
          client_name: r.client_name,
          client_email: r.client_email || "",
          content: r.report_text || r.content || "",
          created_at: r.created_at,
          type: "FCA",
          table: "reports",
        }));

        const soaReports: Report[] = (soa.data || []).map((r: any) => ({
          id: r.id,
          client_name: r.client_name,
          client_email: r.client_email || "",
          content: r.content || r.soa_text || "",
          created_at: r.created_at,
          type: "SOA",
          table: "australian_soas",
        }));

        const usaReports: Report[] = (usa.data || []).map((r: any) => ({
          id: r.id,
          client_name: r.client_name,
          client_email: r.client_email || "",
          content: r.content || r.plan_text || "",
          created_at: r.created_at,
          type: "USA",
          table: "usa_financial_plans",
        }));

        const all = [...fcaReports, ...soaReports, ...usaReports].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setReports(all);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchAllReports();
  }, [router]);

  async function deleteReport(id: string, table: string) {
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  async function downloadReport(report: Report) {
    const endpoint =
      report.type === "FCA" ? "/api/download-report" : report.type === "SOA" ? "/api/download-soa" : "/api/download-usa-plan";

    const res =
      report.type === "FCA"
        ? await fetch(`/api/download-report?id=${encodeURIComponent(report.id)}&type=fca`)
        : await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: report.content,
              clientName: report.client_name,
              reportText: report.content,
              planText: report.content,
            }),
          });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.client_name}_${report.type}_Report.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function getBadgeColor(type: string) {
    if (type === "FCA") return "#0A1628";
    if (type === "SOA") return "#16a34a";
    return "#1d4ed8";
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "40px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0A1628", marginBottom: "8px" }}>All Reports</h1>
      <p style={{ color: "#6b7280", marginBottom: "32px" }}>
        All generated reports across FCA, Australian SOA and USA Financial Plans
      </p>

      {loading && <p style={{ color: "#6b7280" }}>Loading reports...</p>}

      {!loading && reports.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ color: "#6b7280", fontSize: "16px" }}>No reports yet. Generate your first report to see it here.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {reports.map((report) => (
          <div
            key={report.id}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span
                style={{
                  backgroundColor: getBadgeColor(report.type),
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {report.type}
              </span>
              <div>
                <p style={{ fontWeight: "600", color: "#0A1628", margin: 0 }}>{report.client_name || "Unknown Client"}</p>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>{formatDate(report.created_at)}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => downloadReport(report)}
                style={{
                  backgroundColor: "#C9A84C",
                  color: "#0A1628",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Download Word
              </button>
              <button
                onClick={() => deleteReport(report.id, report.table)}
                style={{
                  backgroundColor: "transparent",
                  color: "#dc2626",
                  border: "1px solid #dc2626",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
