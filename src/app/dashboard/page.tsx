import { ReportStudio } from "@/components/report-studio";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { requireUser } from "@/lib/auth";
import { checkSubscription } from "@/lib/subscription";
import type { Report } from "@/types/report";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const isSubscribed = await checkSubscription(user.id);

  if (!isSubscribed) {
    redirect("/pricing?message=subscribe");
  }

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
    <main className="dashboard-page">
      <div
        style={{
          width: "min(1280px, calc(100% - 40px))",
          margin: "0 auto",
          paddingTop: 28,
        }}
      >
        <div
          style={{
            marginBottom: 18,
            padding: "14px 18px",
            borderRadius: 18,
            background: "#fff3cd",
            color: "#5c4300",
            border: "1px solid #f1d88a",
            boxShadow: "0 10px 24px rgba(10, 22, 40, 0.06)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Suitance is a drafting tool for FCA-authorised advisers. All generated
          reports must be reviewed, amended where necessary, and approved by a
          suitably qualified FCA-authorised adviser before being sent to any
          client. Suitance does not provide regulated financial advice and
          accepts no liability for the use of generated content.
        </div>
      </div>
      <div className="dashboard-shell">
        <TopNav email={user.email} />
        <DashboardNav />

        <section className="dashboard-hero fade-in">
          <span className="section-kicker">Adviser Dashboard</span>
          <div className="stack">
            <h1 className="display-title" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>
              Generate premium suitability reports with confidence.
            </h1>
            <p>
              Suitance helps advisers turn meeting notes or recorded advice
              meetings into clean, structured suitability reports ready for
              review and Word export.
            </p>
            {error ? <div className="alert alert-error">{error.message}</div> : null}
            <div className="actions">
              <a href="#new-report" className="btn">
                Generate New Report
              </a>
            </div>
            <div>
              <a
                href="/api/customer-portal"
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Manage subscription
              </a>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 28 }}>
          <ReportStudio reports={reports} />
        </div>
      </div>
    </main>
  );
}
