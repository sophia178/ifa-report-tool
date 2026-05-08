"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  async function handleCheck() {
    if (!text.trim()) return;
    setIsChecking(true);
    setError("");

    try {
      const response = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to check compliance");

      setResult(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "8px" }}>Compliance Checker</h1>
        <p style={{ color: "#5F6877", fontSize: "16px" }}>Analyse advice text against FCA Consumer Duty and COBS 9 rules.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <textarea
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "20px",
              fontSize: "15px",
              width: "100%",
              minHeight: "300px",
              resize: "vertical",
              fontFamily: "inherit",
              color: "#1E293B",
              backgroundColor: "#F8FAFC",
              marginBottom: "24px",
              transition: "all 0.2s ease"
            }}
            placeholder="Paste advice text, report section, or client communication here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && (
            <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "#991B1B", fontSize: "14px", marginBottom: "24px" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleCheck}
            disabled={isChecking || !text.trim()}
            onMouseEnter={() => setHoveredBtn(true)}
            onMouseLeave={() => setHoveredBtn(false)}
            style={{
              backgroundColor: "#C9A84C",
              color: "#0A1628",
              padding: "16px 32px",
              borderRadius: "12px",
              border: "none",
              fontWeight: "700",
              fontSize: "16px",
              cursor: (isChecking || !text.trim()) ? "not-allowed" : "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              opacity: (isChecking || !text.trim()) ? 0.6 : 1,
              transition: "all 0.2s ease",
              transform: hoveredBtn && !isChecking && text.trim() ? "translateY(-1px)" : "none",
              boxShadow: hoveredBtn && !isChecking && text.trim() ? "0 4px 12px rgba(201, 168, 76, 0.2)" : "none"
            }}
          >
            {isChecking ? (
              <>
                <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
                Analysing text...
              </>
            ) : (
              <>
                <Shield size={20} />
                Run Compliance Check
              </>
            )}
          </button>
        </div>

        {result && (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
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
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", display: "flex", alignItems: "center", gap: "12px", margin: 0 }}>
                <AlertCircle size={24} color="#0A1628" />
                Identified Issues & Fixes
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
                      <div style={{ marginTop: "8px", padding: "16px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
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
