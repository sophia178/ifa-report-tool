"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { StoredReportRecord, SuitabilityReport } from "@/types/report";

type ReportStudioProps = {
  reports: StoredReportRecord[];
};

type GenerateResponse = {
  report: SuitabilityReport;
  reportId: string;
};

const today = new Date().toISOString().slice(0, 10);

function getReportPreview(report: StoredReportRecord) {
  const combinedText = [
    report.report_json.suitabilitySummary,
    report.report_json.attitudeToRisk.summary,
    report.report_json.capacityForLoss.summary,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const lines = combinedText
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(0, 2);
}

export function ReportStudio({ reports }: ReportStudioProps) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"notes" | "audio">("notes");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [adviserName, setAdviserName] = useState("");
  const [adviserFirm, setAdviserFirm] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [objectives, setObjectives] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [latestReport, setLatestReport] = useState<SuitabilityReport | null>(
    reports[0]?.report_json ?? null,
  );
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
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          dateOfBirth,
          adviserName,
          adviserFirm,
          meetingDate,
          objectives,
          sourceType,
          meetingNotes,
          transcript,
          audioPath,
        }),
      });

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
    <div className="grid two-col">
      <section className="card stack" id="new-report">
        <div className="stack">
          <div className="pill">New report</div>
          <div>
            <h2 className="section-title">Suitability report builder</h2>
            <p className="muted">{headerText}</p>
          </div>
        </div>

        <div className="actions">
          <button
            type="button"
            className={sourceType === "notes" ? "btn" : "btn-secondary"}
            onClick={() => setSourceType("notes")}
          >
            Paste meeting notes
          </button>
          <button
            type="button"
            className={sourceType === "audio" ? "btn" : "btn-secondary"}
            onClick={() => setSourceType("audio")}
          >
            Upload audio
          </button>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}
        {status ? <div className="alert alert-success">{status}</div> : null}
        {isGeneratingReport ? (
          <div
            className="card"
            style={{
              borderColor: "#abefc6",
              background: "#f0fdf4",
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#bbf7d0"
                  strokeWidth="4"
                />
                <path
                  d="M22 12a10 10 0 0 0-10-10"
                  stroke="#15803d"
                  strokeWidth="4"
                  strokeLinecap="round"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
              <strong>
                Generating your FCA suitability report — this takes 15–30
                seconds
              </strong>
            </div>
          </div>
        ) : null}

        <form className="stack" onSubmit={handleSubmit}>
          <div className="grid two-col">
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
          </div>

          <div className="field">
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
            <div className="field">
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
            <div className="field">
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
            className="btn"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            style={isSubmitting ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
          >
            {isSubmitting ? "Generating..." : "Generate report"}
          </button>
        </form>
      </section>

      <section className="stack">
        <div className="card stack">
          <div className="pill">Latest output</div>
          {latestReport ? (
            <>
              <div className="actions">
                {latestReportId ? (
                  <a
                    href={`/api/download-report?id=${latestReportId}`}
                    className="btn"
                  >
                    Download Word document
                  </a>
                ) : null}
              </div>

              <div className="stack">
                <div>
                  <h2 className="section-title">{latestReport.clientDetails.fullName}</h2>
                  <p className="muted">{latestReport.suitabilitySummary}</p>
                </div>

                <div className="grid two-col">
                  <div className="card stack">
                    <h3 className="section-title">Attitude to risk</h3>
                    <p>
                      <strong>{latestReport.attitudeToRisk.riskLevel}</strong>
                    </p>
                    <p className="muted">{latestReport.attitudeToRisk.summary}</p>
                  </div>
                  <div className="card stack">
                    <h3 className="section-title">Capacity for loss</h3>
                    <p>
                      <strong>{latestReport.capacityForLoss.capacityLevel}</strong>
                    </p>
                    <p className="muted">{latestReport.capacityForLoss.summary}</p>
                  </div>
                </div>

                <div className="stack">
                  <h3 className="section-title">Recommended products</h3>
                  {latestReport.recommendedProducts.map((product) => (
                    <div className="product-card stack" key={product.name}>
                      <div className="meta">
                        <span className="badge">{product.type}</span>
                      </div>
                      <h4 style={{ margin: 0 }}>{product.name}</h4>
                      <p className="muted" style={{ margin: 0 }}>
                        {product.justification}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="card stack">
                  <h3 className="section-title">Charges disclosure</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Initial charges: {latestReport.chargesDisclosure.initialCharges}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Ongoing charges: {latestReport.chargesDisclosure.ongoingCharges}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Product charges: {latestReport.chargesDisclosure.productCharges}
                  </p>
                  <p className="muted" style={{ margin: 0 }}>
                    Platform charges: {latestReport.chargesDisclosure.platformCharges}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Next review date:</strong> {latestReport.nextReviewDate}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">
              Generate a report to preview the formatted FCA suitability output here.
            </p>
          )}
        </div>

        <div className="card stack">
          <div>
            <h2 className="section-title">Past reports</h2>
            <p className="muted">Previously generated reports for this adviser account.</p>
          </div>

          {hasReports ? (
            <div className="report-list">
              {reports.map((report) => (
                <div
                  className="report-item"
                  key={report.id}
                  style={{
                    background: "#ffffff",
                    boxShadow: "0 10px 24px rgba(16, 34, 62, 0.05)",
                  }}
                >
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
                        <span className="badge">{report.source_type}</span>
                        <span>
                          Generated{" "}
                          {format(new Date(report.created_at), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/api/download-report?id=${report.id}`}
                      className="btn-secondary"
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
                  <div className="meta">
                    <span>{report.client_email}</span>
                    <span>Meeting: {report.meeting_date}</span>
                    <span>Review: {report.next_review_date}</span>
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
