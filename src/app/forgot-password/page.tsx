"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setMessage({ type: "success", text: "Password reset link sent! Please check your email." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send reset email." });
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
        
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", marginBottom: "12px" }}>Forgot Password</h1>
        <p style={{ color: "#64748B", fontSize: "15px", marginBottom: "32px", lineHeight: "1.5" }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="email" style={{ fontSize: "12px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="name@company.com"
              style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: "16px", 
              backgroundColor: "#0A1628", 
              color: "white", 
              borderRadius: "8px", 
              border: "none", 
              fontWeight: "700", 
              fontSize: "16px", 
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      </div>
    </main>
  );
}
