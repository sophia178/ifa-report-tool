"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TopNav } from "@/components/top-nav";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted) {
      setError("You must agree to the Terms of Use to create an account.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("already registered") || error.status === 422) {
          setError("This email is already registered. Please log in instead.");
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      // Create profile manually on the client side to ensure it exists
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          subscribed: false,
        });
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
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
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: "0 0 8px 0" }}>Create your account</h1>
            <p style={{ fontSize: "15px", color: "#64748B", margin: 0 }}>Sign up to store client suitability reports in your dashboard.</p>
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
                placeholder="Min 8 characters"
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

            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginTop: "4px" }}>
              <input
                id="termsAccepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                style={{ marginTop: "4px", cursor: "pointer" }}
              />
              <label
                htmlFor="termsAccepted"
                style={{
                  color: "#64748B",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", color: "#0A1628", fontWeight: "600" }}
                >
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", color: "#0A1628", fontWeight: "600" }}
                >
                  Privacy Policy
                </Link>
              </label>
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
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p style={{ marginTop: "32px", textAlign: "center", fontSize: "14px", color: "#64748B" }}>
            Already registered? <Link href="/login" style={{ color: "#0A1628", fontWeight: "700", textDecoration: "none" }}>Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
