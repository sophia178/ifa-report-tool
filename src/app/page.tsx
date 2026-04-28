import Link from "next/link";

import { TopNav } from "@/components/top-nav";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="shell stack">
      <TopNav email={user?.email} />

      <section className="hero">
        <span className="pill">Supabase auth + Claude generation + Word export</span>
        <div className="stack">
          <h1>Generate FCA-compliant suitability reports from adviser notes or meeting audio.</h1>
          <p>
            Advisers can paste structured meeting notes or upload an audio file,
            then turn that evidence into a downloadable Word report with core
            compliance sections and a simple report dashboard.
          </p>
        </div>
        <div className="actions">
          <Link href={user ? "/dashboard" : "/signup"} className="btn">
            {user ? "Open dashboard" : "Create an account"}
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
        </div>
      </section>

      <section className="grid two-col">
        <div className="card stack">
          <h2 className="section-title">What the app does</h2>
          <p className="muted">
            Produces a structured suitability report with client details,
            attitude to risk, capacity for loss, recommended products, charges
            disclosure, and the next review date.
          </p>
          <div className="stack">
            <span className="badge">Meeting notes input</span>
            <span className="badge">Audio upload + transcription</span>
            <span className="badge">Dashboard for past reports</span>
            <span className="badge">Downloadable .docx output</span>
          </div>
        </div>

        <div className="card stack">
          <h2 className="section-title">Required setup</h2>
          <p className="muted">
            Add Supabase project credentials, an Anthropic API key, and an
            AssemblyAI key for audio transcription. SQL and environment templates
            are included in the project.
          </p>
          <div className="actions">
            <Link href="/dashboard" className="btn-secondary">
              View dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
