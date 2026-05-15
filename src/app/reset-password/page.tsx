"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isPreparingSession, setIsPreparingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      setIsPreparingSession(true);
      setMessage(null);
      try {
        const supabase = createClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setCanReset(true);
          return;
        }

        const hashRaw = window.location.hash ? window.location.hash.replace(/^#/, "") : "";
        const hashParams = new URLSearchParams(hashRaw);
        const accessToken =
          hashParams.get("access_token") || url.searchParams.get("access_token") || "";
        const refreshToken =
          hashParams.get("refresh_token") || url.searchParams.get("refresh_token") || "";

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setCanReset(true);
          return;
        }

        setCanReset(false);
        setMessage({ type: "error", text: "Invalid or expired password reset link." });
      } catch (err: any) {
        setCanReset(false);
        setMessage({ type: "error", text: err?.message || "Invalid or expired password reset link." });
      } finally {
        setIsPreparingSession(false);
      }
    }

    prepare();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canReset) {
      setMessage({ type: "error", text: "Invalid or expired password reset link." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setMessage({ type: "success", text: "Password updated successfully! Redirecting..." });
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "white", borderRadius: "16px", padding: "48px", border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <Link href="/login" style={{ color: "#64748B", textDecoration: "none", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          ← Back to login
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", marginBottom: "12px" }}>Reset Password</h1>
        <p style={{ color: "#64748B", fontSize: "15px", marginBottom: "32px", lineHeight: "1.5" }}>
          Please enter your new password below.
        </p>

        {message && (
          <div style={{ 
            padding: "16px", 
            borderRadius: "12px", 
            marginBottom: "24px", 
            fontSize: "14px",
            backgroundColor: message.type === "success" ? "#ECFDF5" : "#FEF2F2",
            color: message.type === "success" ? "#065F46" : "#991B1B",
            border: `1px solid ${message.type === "success" ? "#D1FAE5" : "#FEE2E2"}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px", opacity: isPreparingSession ? 0.6 : 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password" style={{ fontSize: "12px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.05em" }}>New Password</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={8}
              placeholder="Min 8 characters"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
              disabled={isPreparingSession || !canReset}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="confirmPassword" style={{ fontSize: "12px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm New Password</label>
            <input 
              id="confirmPassword"
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setPasswordConfirm(e.target.value)} 
              required 
              minLength={8}
              placeholder="Confirm new password"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
              disabled={isPreparingSession || !canReset}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || isPreparingSession || !canReset}
            style={{ 
              padding: "16px", 
              backgroundColor: "#0A1628", 
              color: "white", 
              borderRadius: "8px", 
              border: "none", 
              fontWeight: "700", 
              fontSize: "16px", 
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: (isSubmitting || isPreparingSession || !canReset) ? 0.7 : 1
            }}
          >
            {isPreparingSession ? "Preparing..." : isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
