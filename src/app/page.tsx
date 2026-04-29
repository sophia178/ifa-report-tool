import Link from "next/link";

import { TopNav } from "@/components/top-nav";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const startHref = user ? (isSubscribed ? "/dashboard" : "/pricing") : "/signup";

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="shell">
          <TopNav email={user?.email} />

          <div className="landing-hero-inner">
            <div className="hero-copy stack fade-in">
              <span className="section-kicker">AI Suitability Platform</span>
              <h1 className="display-title">
                Suitability reports.{" "}
                <span className="hero-accent">Written in seconds.</span>
              </h1>
              <p className="hero-subtitle">
                Suitance uses AI to turn your meeting notes or audio into fully
                structured FCA-compliant suitability reports — ready to download
                as a Word document.
              </p>
              <div className="actions">
                <Link href={startHref} className="btn">
                  Start now
                </Link>
                <Link href="/login" className="btn-outline-light">
                  Log in
                </Link>
              </div>
            </div>

            <div className="hero-metrics fade-in fade-in-delay-1">
              <div className="metric-card">
                <strong>4 hrs</strong>
                <span>Typical drafting time saved on every suitability report.</span>
              </div>
              <div className="metric-card">
                <strong>8 sections</strong>
                <span>Structured around the core report areas advisers need to cover.</span>
              </div>
              <div className="metric-card">
                <strong>Word-ready</strong>
                <span>Download polished reports instantly for client file completion.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block shell reveal-on-scroll">
        <div className="stack" style={{ gap: 14 }}>
          <span className="section-kicker">How It Works</span>
          <h2 className="section-title">A smoother workflow for advice firms.</h2>
          <p className="section-copy">
            Suitance keeps the process simple: capture the meeting, generate the
            report, and send the final document onward without spending an
            afternoon drafting.
          </p>
        </div>

        <div className="section-grid-3" style={{ marginTop: 30 }}>
          <article className="card step-card reveal-on-scroll">
            <span className="step-number">1</span>
            <h3>Paste notes or upload audio</h3>
            <p className="muted">
              Start with your adviser notes or a recorded meeting. Suitance
              accepts both without changing your process.
            </p>
          </article>
          <article className="card step-card reveal-on-scroll">
            <span className="step-number">2</span>
            <h3>AI generates your FCA report</h3>
            <p className="muted">
              The platform organises the meeting into a professional suitability
              report aligned to the required structure.
            </p>
          </article>
          <article className="card step-card reveal-on-scroll">
            <span className="step-number">3</span>
            <h3>Download as Word document</h3>
            <p className="muted">
              Review the finished draft in-app and export a clean Word document
              for your client file and internal process.
            </p>
          </article>
        </div>
      </section>

      <section className="section-block shell reveal-on-scroll">
        <div className="stack" style={{ gap: 14 }}>
          <span className="section-kicker">Why Suitance</span>
          <h2 className="section-title">Built for modern UK independent advisers.</h2>
          <p className="section-copy">
            Designed to feel trustworthy in front of clients and efficient behind
            the scenes for advisers, paraplanners, and compliance teams.
          </p>
        </div>

        <div className="section-grid-4" style={{ marginTop: 30 }}>
          <article className="card benefit-tile reveal-on-scroll">
            <span className="badge">Efficiency</span>
            <h3>Save 4 hours per report</h3>
            <p className="muted">
              Spend less time drafting from scratch and more time advising clients.
            </p>
          </article>
          <article className="card benefit-tile reveal-on-scroll">
            <span className="badge">Standards</span>
            <h3>FCA Consumer Duty aligned</h3>
            <p className="muted">
              Supports a clear, structured process around suitability and client outcomes.
            </p>
          </article>
          <article className="card benefit-tile reveal-on-scroll">
            <span className="badge">Structure</span>
            <h3>All 8 required sections</h3>
            <p className="muted">
              Keeps every report organised with a consistent section-by-section format.
            </p>
          </article>
          <article className="card benefit-tile reveal-on-scroll">
            <span className="badge">Input</span>
            <h3>Audio transcription built in</h3>
            <p className="muted">
              Turn recorded meetings into usable report drafts without manual transcription.
            </p>
          </article>
        </div>
      </section>

      <footer className="site-footer shell">
        <div className="site-footer-inner">
          <span>Suitance © 2026</span>
          <span>Built for UK Independent Financial Advisers</span>
        </div>
      </footer>
    </main>
  );
}
