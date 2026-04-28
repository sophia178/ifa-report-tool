import { ReportStudio } from "@/components/report-studio";
import { TopNav } from "@/components/top-nav";
import { requireUser } from "@/lib/auth";
import type { StoredReportRecord } from "@/types/report";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, client_name, client_email, source_type, meeting_date, next_review_date, created_at, audio_path, meeting_notes, transcript, report_json",
    )
    .order("created_at", { ascending: false });

  const reports = (data ?? []) as StoredReportRecord[];

  return (
    <main className="shell stack">
      <TopNav email={user.email} />

      <section className="hero">
        <span className="pill">Adviser dashboard</span>
        <div className="stack">
          <h1>Generate and manage suitability reports.</h1>
          <p>
            Authenticated advisers can transcribe audio, generate FCA-style
            reports with Claude, and download each result as a Word document.
          </p>
          {error ? <div className="alert alert-error">{error.message}</div> : null}
          <div className="actions">
            <a
              href="#new-report"
              className="btn"
              style={{
                background: "#15803d",
                boxShadow: "0 10px 24px rgba(21, 128, 61, 0.22)",
              }}
            >
              Generate New Report
            </a>
          </div>
        </div>
      </section>

      <ReportStudio reports={reports} />
    </main>
  );
}
