"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

type ComplianceIssue = {
  issue: string;
  rule: string;
  fix: string;
};

type ComplianceResult = {
  score: number;
  issues: ComplianceIssue[];
  recommendation: "Pass" | "Fail";
};

export default function CompliancePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBtn, setHoveredBtn] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscribed, stripe_price_id")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      const isPro = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
      const isPlus = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
      
      if (!isPro && !isPlus) {
        router.push("/pricing?message=upgrade");
        return;
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  async function handleCheck() {
    if (!text.trim()) return;
    setIsChecking(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to check compliance");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        
        try {
          const cleanJson = resultText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
          const parsed = JSON.parse(cleanJson);
          setResult(parsed);
        } catch (e) {
          // Ignore partial parse errors
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#059669";
    if (score >= 50) return "#D97706";
    return "#DC2626";
  };

  const getRecommendationStyles = (rec: string) => {
    return rec === "Pass" 
      ? { backgroundColor: "#ECFDF5", color: "#059669", border: "1px solid #10B981" }
      : { backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #EF4444" };
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Compliance Checker
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Analyse advice text against FCA Consumer Duty and COBS 9 rules.
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isChecking && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isChecking} messages={["Connecting to AI...", "Analysing text for compliance...", "Reviewing regulations...", "Finalising..."]} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Advice Content</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                Input Text
              </label>
              <textarea
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  width: "100%",
                  minHeight: "300px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  color: "#1E293B",
                  outline: "none",
                  backgroundColor: "white",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                placeholder="Paste advice text, report section, or client communication here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

            <button
              onClick={handleCheck}
              disabled={isChecking || !text.trim()}
              style={{
                backgroundColor: "#0A1628",
                color: "white",
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: (isChecking || !text.trim()) ? "not-allowed" : "pointer",
                opacity: isChecking ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "24px",
                letterSpacing: "0.5px"
              }}
            >
              <Shield size={20} />
              {isChecking ? "Analysing..." : "Run Compliance Check"}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: "40px", backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ padding: "32px", borderRadius: "16px", backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", textAlign: "center" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: "8px" }}>Compliance Score</h3>
                <div style={{ fontSize: "48px", fontWeight: "900", color: getScoreColor(result.score) }}>
                  {result.score}/100
                </div>
              </div>
              <div style={{ 
                padding: "32px", 
                borderRadius: "16px", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                justifyContent: "center",
                ...getRecommendationStyles(result.recommendation)
              }}>
                <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "inherit", marginBottom: "8px" }}>Recommendation</h3>
                <div style={{ fontSize: "32px", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px" }}>
                  {result.recommendation === "Pass" ? <CheckCircle size={32} /> : <XCircle size={32} />}
                  {result.recommendation}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <AlertCircle size={18} /> Identified Issues & Fixes
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ padding: "24px", borderRadius: "16px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Issue</span>
                        <p style={{ fontSize: "15px", fontWeight: "700", color: "#0A1628", margin: "4px 0 0" }}>{issue.issue}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rule Reference</span>
                        <p style={{ fontSize: "14px", color: "#475569", margin: "4px 0 0" }}>{issue.rule}</p>
                      </div>
                      <div style={{ marginTop: "8px", padding: "16px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommended Fix</span>
                        <p style={{ fontSize: "14px", color: "#065F46", margin: "4px 0 0", fontWeight: "500" }}>{issue.fix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
