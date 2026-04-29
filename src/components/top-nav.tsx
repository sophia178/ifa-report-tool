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
          Clearance
        </Link>

        <div className="nav-links">
          <Link href="/dashboard" className="btn-ghost">
            Dashboard
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
                Sign in
              </Link>
              <Link href="/signup" className="btn">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
