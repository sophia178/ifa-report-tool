"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

function getReportPreview(report: Report) {
  const lines = report.content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !/^SECTION\s+\d+\s*[-—:]/i.test(line));

  return lines.slice(0, 2);
}

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

  useEffect(() => {
    async function fetchTemplates() {
      const supabase = createClient();
      const { data } = await supabase.from("report_templates").select("id, name, content");
      if (data) setTemplates(data);
    }
    fetchTemplates();
  }, []);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [latestReport, setLatestReport] = useState<string | null>(reports[0]?.content ?? null);
  const [latestReportId, setLatestReportId] = useState<string | null>(
    reports[0]?.id ?? null,
  );

  const hasReports = reports.length > 0;
  const headerText = useMemo(() => {
    return sourceType === "audio"
      ? "Upload meeting audio to transcribe, assess, and format the report."
      : "Paste meeting notes and turn them into a structured suitability report.";
  }, [sourceType]);

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
      setStatus(
        "Generating your FCA suitability report — this takes 15–30 seconds",
      );
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const json = (await response.json()) as GenerateResponse & {
        error?: string;
      };

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
      const message =
        caughtError instanceof Error ? caughtError.message : "Unexpected error.";
      setError(message);
      setStatus("");
    } finally {
      setIsGeneratingReport(false);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard-studio">
      <section className="studio-panel stack" id="new-report">
        <div className="stack">
          <div className="pill">New report</div>
          <div>
            <h2 className="section-title">Suitability report builder</h2>
            <p className="muted">{headerText}</p>
          </div>
        </div>

        <div className="studio-tabs">
          <button
            type="button"
            className={sourceType === "notes" ? "btn studio-tab-active" : "btn-secondary studio-tab-idle"}
            onClick={() => setSourceType("notes")}
          >
            Paste meeting notes
          </button>
          <button
            type="button"
            className={sourceType === "audio" ? "btn studio-tab-active" : "btn-secondary studio-tab-idle"}
            onClick={() => setSourceType("audio")}
          >
            Upload audio
          </button>
        </div>

        {status ? <div className="alert alert-success">{status}</div> : null}
        {isGeneratingReport ? (
          <div className="spinner-panel">
            <div className="spinner-ring" aria-hidden="true" />
            <strong>Generating your report...</strong>
          </div>
        ) : null}

        <form className="stack" onSubmit={handleSubmit}>
          {error ? (
            <div
              role="alert"
              style={{
                color: "#b42318",
                background: "#fef3f2",
                border: "1px solid #fecdca",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>Report generation failed</p>
              <p style={{ margin: "8px 0 0", color: "#b42318" }}>{error}</p>
            </div>
          ) : null}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="template">Starting template (optional)</label>
              <select
                className="input"
                id="template"
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                <option value="">Default Suitance Format</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="clientName">Client name</label>
              <input
                className="input"
                id="clientName"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="clientEmail">Client email</label>
              <input
                className="input"
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input
                className="input"
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="meetingDate">Meeting date</label>
              <input
                className="input"
                id="meetingDate"
                type="date"
                value={meetingDate}
                onChange={(event) => setMeetingDate(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="adviserName">Adviser name</label>
              <input
                className="input"
                id="adviserName"
                value={adviserName}
                onChange={(event) => setAdviserName(event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="adviserFirm">Adviser firm</label>
              <input
                className="input"
                id="adviserFirm"
                value={adviserFirm}
                onChange={(event) => setAdviserFirm(event.target.value)}
                required
              />
            </div>

            <div
              className="form-grid-full"
              style={{
                borderTop: "1px solid rgba(15, 23, 42, 0.08)",
                paddingTop: 20,
                marginTop: 4,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: 600,
                }}
              >
                Investment Details (optional)
              </h3>
            </div>

            <div className="field">
              <label htmlFor="platformName">Platform name</label>
              <input
                className="input"
                id="platformName"
                value={platformName}
                onChange={(event) => setPlatformName(event.target.value)}
                placeholder="e.g. Transact, Nucleus, Quilter"
              />
            </div>

            <div className="field">
              <label htmlFor="fundName">Fund name</label>
              <input
                className="input"
                id="fundName"
                value={fundName}
                onChange={(event) => setFundName(event.target.value)}
                placeholder="e.g. Vanguard LifeStrategy 60%"
              />
            </div>

            <div className="field">
              <label htmlFor="fundSrriRiskRating">Fund SRRI rating</label>
              <input
                className="input"
                id="fundSrriRiskRating"
                type="number"
                min={1}
                max={7}
                value={fundSrriRiskRating}
                onChange={(event) => setFundSrriRiskRating(event.target.value)}
                placeholder="Risk rating 1-7"
              />
            </div>

            <div className="field">
              <label htmlFor="fundIsinNumber">Fund ISIN</label>
              <input
                className="input"
                id="fundIsinNumber"
                value={fundIsinNumber}
                onChange={(event) => setFundIsinNumber(event.target.value)}
                placeholder="e.g. GB00B3X7QG63"
              />
            </div>
          </div>

          <div className="field form-grid-full">
            <label htmlFor="objectives">Client objectives</label>
            <textarea
              className="textarea"
              id="objectives"
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              placeholder="Retirement income planning, tax efficiency, medium-term growth..."
              required
            />
          </div>

          {sourceType === "notes" ? (
            <div className="field form-grid-full">
              <label htmlFor="meetingNotes">Meeting notes</label>
              <textarea
                className="textarea"
                id="meetingNotes"
                value={meetingNotes}
                onChange={(event) => setMeetingNotes(event.target.value)}
                placeholder="Paste the adviser meeting notes here..."
                required={sourceType === "notes"}
              />
            </div>
          ) : (
            <div className="field form-grid-full">
              <label htmlFor="audio">Meeting audio</label>
              <input
                className="input"
                id="audio"
                type="file"
                accept="audio/*"
                onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
                required={sourceType === "audio"}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-dark"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            style={isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
          >
            {isSubmitting ? "Generating..." : "Generate report"}
          </button>
        </form>
      </section>

      <section className="stack">
        <div className="studio-panel stack report-preview-card">
          <div className="pill">Latest output</div>
          {latestReport ? (
            <>
              <div className="report-toolbar">
                <div>
                  <h2 className="section-title">Generated report preview</h2>
                  <p className="muted" style={{ margin: "6px 0 0" }}>
                    Review the output before exporting the final document.
                  </p>
                </div>
                {latestReportId ? (
                  <a
                    href={`/api/download-report?id=${latestReportId}`}
                    className="btn-dark download-button"
                  >
                    Download Word document
                  </a>
                ) : null}
              </div>

              <div className="stack">
                <div className="report-surface">
                  <div className="report-prose">{renderReportLines(latestReport)}</div>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">
              Generate a report to preview the formatted FCA suitability output here.
            </p>
          )}
        </div>

        <div className="studio-panel stack">
          <div>
            <h2 className="section-title">Past reports</h2>
            <p className="muted">Previously generated reports for this adviser account.</p>
          </div>

          {hasReports ? (
            <div className="history-list">
              {reports.map((report) => (
                <div className="report-item" key={report.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{report.client_name}</h3>
                      <div className="meta">
                        <span>
                          Generated{" "}
                          {format(new Date(report.created_at), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/api/download-report?id=${report.id}`}
                      className="btn-dark"
                    >
                      Download Word Doc
                    </a>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    {getReportPreview(report).map((line, index) => (
                      <p
                        key={`${report.id}-${index}`}
                        className="muted"
                        style={{
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <a
                      href={`/api/download-report?id=${report.id}`}
                      className="btn-secondary"
                    >
                      Download Word Doc
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No reports yet. Create the first one from the form.</p>
          )}
        </div>
      </section>
    </div>
  );
}
