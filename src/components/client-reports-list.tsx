"use client";

import { useState } from "react";
import { FileText, Download, Calendar, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Report } from "@/types/report";

export function ClientReportsList({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this report?")) return;
    setIsDeleting(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Failed to delete report. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleDownload(report: Report) {
    setIsDownloading(report.id);
    try {
      const response = await fetch("/api/download-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Suitability_Report_${report.client_name.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(err instanceof Error ? err.message : "Failed to download report.");
    } finally {
      setIsDownloading(null);
    }
  }

  function getReportType(sourceType: string | undefined) {
    if (sourceType === "audio") return "Audio Transcription";
    return "Suitability Report";
  }

  if (reports.length === 0) return null;

  return (
    <div style={{ marginBottom: "80px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", marginBottom: "24px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Recent Reports
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {reports.map((report) => (
          <div key={report.id} style={{ 
            backgroundColor: "#FFFFFF", 
            borderRadius: "12px", 
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            marginBottom: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div 
              style={{ 
                padding: "16px 20px", 
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#F4F6F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A1628" }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", margin: 0 }}>{report.client_name}</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#64748B", fontSize: "13px", marginTop: "2px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={14} />
                      {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span>{getReportType(report.source_type)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }} onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => handleDelete(report.id)}
                  disabled={isDeleting === report.id}
                  style={{ padding: "8px", color: "#94A3B8", cursor: "pointer", background: "none", border: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                  onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}
                >
                  {isDeleting === report.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
                <div style={{ color: "#94A3B8" }}>
                  {expandedId === report.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>

            {expandedId === report.id && (
              <div style={{ padding: "0 24px 24px 24px", borderTop: "1px solid #F3F4F6" }}>
                <div style={{ 
                  marginTop: "24px",
                  padding: "24px", 
                  backgroundColor: "#F9FAFB", 
                  borderRadius: "8px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#374151",
                  whiteSpace: "pre-wrap"
                }}>
                  {report.content}
                </div>
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={() => handleDownload(report)}
                    disabled={isDownloading === report.id}
                    style={{ 
                      padding: "10px 20px", 
                      borderRadius: "8px", 
                      backgroundColor: "#0A1628", 
                      color: "#FFFFFF", 
                      fontWeight: "600", 
                      fontSize: "13px",
                      border: "none",
                      cursor: isDownloading === report.id ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: isDownloading === report.id ? 0.7 : 1
                    }}
                  >
                    {isDownloading === report.id ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    Download Word
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
