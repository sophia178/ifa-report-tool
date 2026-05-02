"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Download, Zap, Clock, User, CheckCircle } from "lucide-react";

import type { Report } from "@/types/report";

type ReportStudioProps = {
  reports: Report[];
};

type GenerateResponse = {
  report: string;
  reportId: string;
};

type Template = {
  id: string;
  name: string;
  content: string;
};

const today = new Date().toISOString().slice(0, 10);

function renderReportLines(report: string) {
  return report
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => line.length > 0 || lines[index - 1] !== "")
    .map((line, index) =>
      /^SECTION\s+\d+\s*[-—:]/i.test(line) ? (
        <p className="report-line report-heading" key={`heading-${index}`}>
          {line}
        </p>
      ) : (
        <p className="report-line" key={`line-${index}`}>
          {line || "\u00a0"}
        </p>
      ),
    );
}

export function ReportStudio({ reports }: ReportStudioProps) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"notes" | "audio">("notes");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [adviserName, setAdviserName] = useState("");
  const [adviserFirm, setAdviserFirm] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [fundName, setFundName] = useState("");
  const [fundSrriRiskRating, setFundSrriRiskRating] = useState("");
  const [fundIsinNumber, setFundIsinNumber] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [objectives, setObjectives] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [latestReport, setLatestReport] = useState<string | null>(reports[0]?.content ?? null);
  const [latestReportId, setLatestReportId] = useState<string | null>(
    reports[0]?.id ?? null,
  );

  useEffect(() => {
    async function fetchTemplates() {
      const supabase = createClient();
      const { data } = await supabase.from("report_templates").select("id, name, content");
      if (data) setTemplates(data);
    }
    fetchTemplates();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setStatus("Preparing evidence...");

    try {
      let transcript = "";
      let audioPath: string | null = null;

      if (sourceType === "audio") {
        if (!audioFile) {
          throw new Error("Please choose an audio file before generating the report.");
        }

        const uploadFormData = new FormData();
        uploadFormData.append("audio", audioFile);
        uploadFormData.append("clientName", clientName);

        setStatus("Uploading and transcribing audio...");
        const uploadResponse = await fetch("/api/upload-audio", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadJson = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadJson.error || "Audio upload failed.");
        }

        transcript = uploadJson.transcript;
        audioPath = uploadJson.audioPath;
      }

      setIsGeneratingReport(true);
      setStatus("Generating your FCA suitability report...");
      
      const controller = new AbortController();
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      const payload = {
        clientName,
        clientEmail,
        dateOfBirth,
        adviserName,
        adviserFirm,
        platformName,
        fundName,
        fundSrriRiskRating,
        fundIsinNumber,
        meetingDate,
        objectives,
        sourceType,
        meetingNotes,
        transcript,
        audioPath,
        templateContent: selectedTemplate?.content || "",
      };
      
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      let response: Response;

      try {
        response = await fetch("/api/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const json = (await response.json()) as GenerateResponse & { error?: string };

      if (!response.ok) {
        throw new Error(json.error || "Report generation failed.");
      }

      setLatestReport(json.report);
      setLatestReportId(json.reportId);
      setStatus("Report generated successfully.");
      setMeetingNotes("");
      setAudioFile(null);
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unexpected error.";
      setError(message);
      setStatus("");
    } finally {
      setIsGeneratingReport(false);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="studio-container">
      {/* Left Column: Form */}
      <section className="studio-panel stack">
        <div className="stack" style={{ gap: "8px" }}>
          <div className="pill" style={{ width: "fit-content" }}>Report Builder</div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0A1628" }}>Client Evidence</h2>
          <p className="muted">Enter meeting details and client objectives below.</p>
        </div>

        <div className="studio-tabs">
          <button
            type="button"
            className={`studio-tab ${sourceType === "notes" ? "studio-tab-active" : "studio-tab-idle"}`}
            onClick={() => setSourceType("notes")}
          >
            Meeting Notes
          </button>
          <button
            type="button"
            className={`studio-tab ${sourceType === "audio" ? "studio-tab-active" : "studio-tab-idle"}`}
            onClick={() => setSourceType("audio")}
          >
            Meeting Audio
          </button>
        </div>

        <form className="stack" onSubmit={handleSubmit} style={{ gap: "32px" }}>
          <div className="form-grid">
            <div className="field">
              <label>Client Name</label>
              <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Client Email</label>
              <input className="input" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Meeting Date</label>
              <input className="input" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>Starting Template</label>
              <select className="input" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                <option value="">Standard Format</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Investment Objectives</label>
            <textarea 
              className="textarea" 
              value={objectives} 
              onChange={(e) => setObjectives(e.target.value)} 
              placeholder="e.g. Retirement planning, tax-efficient growth..." 
              required 
            />
          </div>

          {sourceType === "notes" ? (
            <div className="field">
              <label>Meeting Notes</label>
              <textarea 
                className="textarea" 
                style={{ minHeight: "200px" }}
                value={meetingNotes} 
                onChange={(e) => setMeetingNotes(e.target.value)} 
                placeholder="Paste your rough meeting notes here..." 
                required 
              />
            </div>
          ) : (
            <div className="field">
              <label>Audio File</label>
              <input 
                type="file" 
                className="input" 
                accept="audio/*" 
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} 
                required 
              />
            </div>
          )}

          <button type="submit" className="btn-dark" disabled={isSubmitting}>
            {isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <Zap size={18} className="animate-pulse" /> Generating Report...
              </span>
            ) : "Generate Report"}
          </button>

          {error && (
            <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#B91C1C", fontSize: "14px" }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          {status && !error && (
            <div style={{ padding: "16px", backgroundColor: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: "12px", color: "#15803D", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={16} /> {status}
            </div>
          )}
        </form>
      </section>

      {/* Right Column: Preview */}
      <section className="stack">
        <div className="studio-panel stack" style={{ minHeight: "800px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="stack" style={{ gap: "4px" }}>
              <div className="pill" style={{ width: "fit-content" }}>Output</div>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0A1628" }}>Report Preview</h2>
            </div>
            {latestReportId && (
              <a href={`/api/download-report?id=${latestReportId}`} className="btn-dark" style={{ padding: "10px 20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Download size={16} /> Download Word
              </a>
            )}
          </div>

          <div className="report-surface" style={{ marginTop: "24px" }}>
            {latestReport ? (
              <div className="report-prose">{renderReportLines(latestReport)}</div>
            ) : (
              <div style={{ height: "600px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#8A94A6", gap: "16px" }}>
                <FileText size={48} strokeWidth={1} />
                <p>Your generated report will appear here.<br />Fill in the details on the left to begin.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
