import Link from "next/link";

import { logout } from "@/app/auth/actions";

type TopNavProps = {
  email?: string;
};

export function TopNav({ email }: TopNavProps) {
  return (
    <div className="nav-shell">
      <div className="nav">
        <Link href="/" className="nav-brand">
          Suitance
        </Link>

        <div className="nav-links">
          <Link href="/pricing" className="btn-ghost">
            Pricing
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
          <Link
            href="/terms"
            style={{
              color: "rgba(248, 246, 241, 0.76)",
              fontSize: "0.88rem",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Terms
          </Link>
          {email ? <span className="nav-email">{email}</span> : null}
          {email ? (
            <form action={logout}>
              <button type="submit" className="btn-light">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="btn-outline-light">
                Log in
              </Link>
              <Link href="/signup" className="btn">
                Start now
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
