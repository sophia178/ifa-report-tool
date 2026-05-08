"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopNav } from "@/components/top-nav";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      setIsLoading(false);
    }
  }

  return (
    <main style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "1100px", marginBottom: "64px" }}>
        <TopNav />
      </div>

      <section style={{ 
        backgroundColor: "#FFFFFF", 
        width: "100%", 
        maxWidth: "480px", 
        padding: "48px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: "0 0 8px 0" }}>Welcome back</h1>
            <p style={{ fontSize: "15px", color: "#64748B", margin: 0 }}>Access your dashboard and saved reports</p>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", color: "#B91C1C", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", border: "1px solid #FEE2E2" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="email" style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Email</label>
              <input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="name@company.com"
                style={{ 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "1px solid #E5E7EB", 
                  fontSize: "15px",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box"
                }} 
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="password" style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                placeholder="••••••••"
                style={{ 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "1px solid #E5E7EB", 
                  fontSize: "15px",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box"
                }}
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
                marginTop: "8px",
                transition: "opacity 0.2s",
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p style={{ marginTop: "32px", textAlign: "center", fontSize: "14px", color: "#64748B" }}>
            Need an account? <Link href="/signup" style={{ color: "#0A1628", fontWeight: "700", textDecoration: "none" }}>Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
