"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "white", borderRadius: "24px", padding: "48px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "12px" }}>Reset Password</h1>
        <p style={{ color: "#64748B", fontSize: "16px", marginBottom: "32px", lineHeight: "1.5" }}>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
