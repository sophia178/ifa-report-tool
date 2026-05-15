"use client";

import { useState, useEffect } from "react";
import { 
  Archive, FileText, Download, Trash2, Loader2, 
  ArrowLeft, Search, Filter, ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ReportType = "fca" | "soa" | "usa";

type SavedReport = {
  id: string;
  client_name: string;
  created_at: string;
  type: ReportType;
  content: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const [fcaReports, setFcaReports] = useState<SavedReport[]>([]);
  const [soaReports, setSoaReports] = useState<SavedReport[]>([]);
  const [usaReports, setUsaReports] = useState<SavedReport[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");

  useEffect(() => {
    async function fetchAllReports() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch from all three tables
        const [fcaRes, soaRes, usaRes] = await Promise.all([
          supabase
            .from("reports")
            .select("id, client_name, created_at, report_text")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("australian_soas")
            .select("id, client_name, created_at, content, soa_text")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("usa_financial_plans")
            .select("id, client_name, created_at, content, plan_text")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        const fca = (fcaRes.data || []).map((r: any) => ({
          id: r.id,
          client_name: r.client_name,
          created_at: r.created_at,
          type: "fca" as const,
          content: r.report_text,
        }));
        const soa = (soaRes.data || []).map((r: any) => ({
          id: r.id,
          client_name: r.client_name,
          created_at: r.created_at,
          type: "soa" as const,
          content: r.content || r.soa_text || "",
        }));
        const usa = (usaRes.data || []).map((r: any) => ({
          id: r.id,
          client_name: r.client_name,
          created_at: r.created_at,
          type: "usa" as const,
          content: r.content || r.plan_text || "",
        }));

        setFcaReports(fca);
        setSoaReports(soa);
        setUsaReports(usa);

        const combined: SavedReport[] = [...fca, ...soa, ...usa];

        // Sort by date descending
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReports(combined);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllReports();
  }, [router]);

  async function handleDelete(id: string, type: ReportType) {
    if (!confirm("Are you sure you want to delete this report?")) return;
    setIsDeleting(id);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      let tableName = "reports";
      if (type === "soa") tableName = "australian_soas";
      if (type === "usa") tableName = "usa_financial_plans";

      const { error } = await supabase.from(tableName).delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete report.");
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleDownload(report: SavedReport) {
    setIsDownloading(report.id);
    try {
      const response =
        report.type === "soa"
          ? await fetch(`/api/download-soa`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: report.content, clientName: report.client_name }),
            })
          : report.type === "usa"
            ? await fetch(`/api/download-usa-plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: report.content, clientName: report.client_name }),
              })
            : await fetch(`/api/download-report?id=${report.id}&type=${report.type}`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.client_name}_Report.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert(err instanceof Error ? err.message : "Failed to download report.");
    } finally {
      setIsDownloading(null);
    }
  }

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getBadgeStyle = (type: ReportType) => ({
    backgroundColor: type === "fca" ? "#0A1628" : type === "soa" ? "#16a34a" : "#1d4ed8",
    color: "white",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    border: "1px solid rgba(255,255,255,0.15)"
  });

  const getTypeLabel = (type: ReportType) => {
    if (type === "fca") return "FCA";
    if (type === "soa") return "SOA";
    return "USA";
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <Loader2 className="animate-spin" size={40} color="#0A1628" />
          <p style={{ color: "#64748B", fontWeight: "600" }}>Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
            Your Reports
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
            All generated reports saved to your account.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} color="#94A3B8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text"
            placeholder="Search by client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "14px 16px 14px 48px", 
              borderRadius: "12px", 
              border: "1px solid #E2E8F0", 
              fontSize: "15px",
              outline: "none",
              backgroundColor: "white",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#E2E8F0"}
          />
        </div>
        <div style={{ position: "relative", minWidth: "200px" }}>
          <Filter size={18} color="#94A3B8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{ 
              width: "100%", 
              padding: "14px 16px 14px 48px", 
              borderRadius: "12px", 
              border: "1px solid #E2E8F0", 
              fontSize: "15px",
              outline: "none",
              backgroundColor: "white",
              appearance: "none",
              cursor: "pointer"
            }}
          >
            <option value="all">All Types</option>
            <option value="fca">FCA Suitability</option>
            <option value="soa">Australian SOA</option>
            <option value="usa">USA Financial Plan</option>
          </select>
          <ChevronDown size={16} color="#94A3B8" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {reports.length === 0 ? (
        <div style={{ padding: "100px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "24px", border: "2px dashed #E2E8F0" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#CBD5E1", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <Archive size={40} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628", marginBottom: "8px" }}>No reports yet</h3>
          <p style={{ color: "#64748B", maxWidth: "400px", margin: "0 auto 24px" }}>
            Generate your first report from Report Studio to see it here.
          </p>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#0A1628", color: "white", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", textDecoration: "none", fontSize: "14px" }}>
            Go to Report Studio
          </Link>
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{ padding: "100px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "24px", border: "2px dashed #E2E8F0" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#CBD5E1", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <Search size={40} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628", marginBottom: "8px" }}>No matching reports</h3>
          <p style={{ color: "#64748B", maxWidth: "460px", margin: "0 auto 0" }}>
            Try adjusting your search or switching the report type filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))", gap: "24px" }}>
          {filteredReports.map((report) => (
            <div key={report.id} style={{ 
              backgroundColor: "white", 
              borderRadius: "16px", 
              padding: "32px", 
              border: "1px solid #E5E7EB", 
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              transition: "transform 0.2s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#F4F6F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A1628" }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", margin: "0 0 6px" }}>{report.client_name}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={getBadgeStyle(report.type)}>{getTypeLabel(report.type)}</span>
                      <span style={{ fontSize: "13px", color: "#94A3B8" }}>•</span>
                      <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: "500" }}>
                        {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: "16px", 
                backgroundColor: "#F9FAFB", 
                borderRadius: "10px", 
                fontSize: "13px", 
                color: "#64748B",
                lineHeight: "1.6",
                maxHeight: "100px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical"
              }}>
                {report.content}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                <button
                  onClick={() => handleDownload(report)}
                  disabled={isDownloading === report.id}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    backgroundColor: "#0A1628",
                    color: "white",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: "700",
                    border: "none",
                    cursor: isDownloading === report.id ? "not-allowed" : "pointer",
                    opacity: isDownloading === report.id ? 0.7 : 1
                  }}
                >
                  {isDownloading === report.id ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  Download Word
                </button>
                <button
                  onClick={() => handleDelete(report.id, report.type)}
                  disabled={isDeleting === report.id}
                  style={{
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FEF2F2",
                    color: "#EF4444",
                    borderRadius: "10px",
                    border: "1px solid #FEE2E2",
                    cursor: isDeleting === report.id ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEE2E2")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                >
                  {isDeleting === report.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
