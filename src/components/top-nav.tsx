import Link from "next/link";

import { logout } from "@/app/auth/actions";

type TopNavProps = {
  email?: string;
};

export function TopNav({ email }: TopNavProps) {
  return (
    <div className="nav">
      <Link href="/" className="pill">
        FCA Suitability Reports
      </Link>

      <div className="nav-links">
        <Link href="/dashboard" className="btn-ghost">
          Dashboard
        </Link>
        {email ? <span className="muted">{email}</span> : null}
        {email ? (
          <form action={logout}>
            <button type="submit" className="btn-secondary">
              Sign out
            </button>
          </form>
        ) : (
          <>
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
            <Link href="/signup" className="btn">
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
