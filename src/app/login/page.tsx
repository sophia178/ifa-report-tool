"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      setIsLoading(false);
    }
  }

  return (
    <main style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ 
        backgroundColor: "#FFFFFF", 
        width: "100%", 
        maxWidth: "480px", 
        padding: "48px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
      }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: "0 0 8px 0" }}>Welcome back</h1>
          <p style={{ fontSize: "15px", color: "#64748B", margin: 0 }}>Access your professional workspace</p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", color: "#B91C1C", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", border: "1px solid #FEE2E2" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="name@company.com"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }} 
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              placeholder="••••••••"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
            <div style={{ marginTop: "4px" }}>
              <Link href="/forgot-password" style={{ fontSize: "13px", color: "#C9A84C", textDecoration: "none", fontWeight: "600" }}>Forgot password?</Link>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: "100%", 
              backgroundColor: "#0A1628", 
              color: "white", 
              padding: "14px", 
              borderRadius: "8px", 
              fontWeight: "700", 
              fontSize: "15px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "12px"
            }}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p style={{ marginTop: "32px", textAlign: "center", fontSize: "14px", color: "#64748B" }}>
          Need an account? <Link href="/signup" style={{ color: "#C9A84C", fontWeight: "700", textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
