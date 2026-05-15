"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);

    try {
      // If new users are being blocked from logging in, check Supabase Dashboard → Authentication → Settings.
      // Turning OFF "Enable email confirmations" allows immediate access without requiring email verification.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const identities = (data.user as any)?.identities;
      const requiresEmailConfirmation = !!data.user && Array.isArray(identities) && identities.length === 0;

      if (requiresEmailConfirmation) {
        setMessage("Please check your email and click the confirmation link before logging in.");
        return;
      }

      if (data.user) {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
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
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: "0 0 8px 0" }}>Create your account</h1>
          <p style={{ fontSize: "15px", color: "#64748B", margin: 0 }}>Join thousands of financial advisers</p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", color: "#B91C1C", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", border: "1px solid #FEE2E2" }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ padding: "12px 16px", backgroundColor: "#ECFDF5", color: "#047857", borderRadius: "8px", marginBottom: "24px", fontSize: "14px", border: "1px solid #A7F3D0" }}>
            {message}
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
              placeholder="Min 8 characters"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
              placeholder="Repeat your password"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" }}
            />
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
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p style={{ marginTop: "32px", textAlign: "center", fontSize: "14px", color: "#64748B" }}>
          Already have an account? <Link href="/login" style={{ color: "#C9A84C", fontWeight: "700", textDecoration: "none" }}>Log in</Link>
        </p>
      </div>
    </main>
  );
}
