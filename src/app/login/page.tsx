import Link from "next/link";

import { login } from "@/app/auth/actions";
import { TopNav } from "@/components/top-nav";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="shell stack">
      <TopNav />

      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="stack">
          <div>
            <h1 className="section-title">Log in</h1>
            <p className="muted">Access your report dashboard and saved reports.</p>
          </div>

          {params.error ? (
            <div className="alert alert-error">{params.error}</div>
          ) : null}

          <form action={login} className="stack">
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
            <button type="submit" className="btn">
              Log in
            </button>
          </form>

          <p className="muted">
            Need an account? <Link href="/signup">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
