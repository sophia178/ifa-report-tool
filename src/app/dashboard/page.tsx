import { ReportStudio } from "@/components/report-studio";
import { TopNav } from "@/components/top-nav";
import { requireUser } from "@/lib/auth";
import type { Report } from "@/types/report";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("reports")
    .select("id, client_name, created_at, report_text")
    .order("created_at", { ascending: false });

  const reports: Report[] = (data ?? []).map((report) => ({
    id: report.id,
    client_name: report.client_name,
    created_at: report.created_at,
    content: report.report_text,
  }));

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
