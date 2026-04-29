import Link from "next/link";

import { signup } from "@/app/auth/actions";
import { TopNav } from "@/components/top-nav";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="shell stack">
      <TopNav />

      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="stack">
          <div>
            <h1 className="section-title">Create an account</h1>
            <p className="muted">
              Sign up to store client suitability reports in your dashboard.
            </p>
          </div>

          {params.error ? (
            <div className="alert alert-error">{params.error}</div>
          ) : null}

          <form action={signup} className="stack">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input className="input" id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "2px 2px 0",
              }}
            >
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                required
                style={{ marginTop: 5 }}
              />
              <label
                htmlFor="termsAccepted"
                style={{
                  color: "var(--foreground)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  textTransform: "none",
                  letterSpacing: 0,
                  fontWeight: 500,
                }}
              >
                I confirm that I am an FCA-authorised financial adviser or
                paraplanner, or that I work under the supervision of an
                FCA-authorised firm. I have read and agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  Terms of Use
                </Link>
                .
              </label>
            </div>
            <button type="submit" className="btn">
              Sign up
            </button>
          </form>

          <p className="muted">
            Already registered? <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
