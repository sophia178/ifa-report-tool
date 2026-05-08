"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        .select("subscribed")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      const planRes = await fetch("/api/user-plan");
      const { plan } = await planRes.json();
      
      if (plan === "starter") {
        router.push("/pricing?message=upgrade");
        return;
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    if (score >= 80) return "#059669"; // Emerald 600
    if (score >= 50) return "#D97706"; // Amber 600
    return "#DC2626"; // Red 600
  };

  const getRecommendationStyles = (rec: string) => {
    return rec === "Pass" 
      ? { backgroundColor: "#ECFDF5", color: "#059669", border: "1px solid #10B981" }
      : { backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #EF4444" };
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Compliance Checker
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Analyse advice text against FCA Consumer Duty and COBS 9 rules.
        </p>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "24px" }}>
        <textarea
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "15px",
            width: "100%",
            minHeight: "250px",
            resize: "vertical",
            fontFamily: "inherit",
            color: "#1E293B",
            backgroundColor: "#F8FAFC"
          }}
          placeholder="Paste advice text, report section, or client communication here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && (
          <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "#991B1B", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <button
          disabled={isChecking || !text.trim()}
          onClick={handleCheck}
          style={{
            backgroundColor: "#0A1628",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            border: "none",
            cursor: (isChecking || !text.trim()) ? "not-allowed" : "pointer",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            opacity: (isChecking || !text.trim()) ? 0.7 : 1
          }}
        >
          {isChecking ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Analysing Compliance...
            </>
          ) : (
            "Check Compliance"
          )}
        </button>

        {result && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "32px", paddingTop: "32px", borderTop: "1px solid #E5E7EB" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ padding: "32px", borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB", textAlign: "center" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: "8px" }}>Compliance Score</h3>
                <div style={{ fontSize: "48px", fontWeight: "900", color: getScoreColor(result.score) }}>
                  {result.score}/100
                </div>
              </div>
              <div style={{ 
                padding: "32px", 
                borderRadius: "12px", 
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
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", display: "flex", alignItems: "center", gap: "12px", margin: 0 }}>
                <AlertCircle size={20} color="#0A1628" />
                Identified Issues & Fixes
              </h3>
              
              {result.issues.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {result.issues.map((item, i) => (
                    <div key={i} style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#DC2626", textTransform: "uppercase" }}>Issue</span>
                          <p style={{ color: "#1E293B", fontWeight: "600", fontSize: "15px", margin: 0 }}>{item.issue}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "right" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase" }}>Relevant Rule</span>
                          <p style={{ fontSize: "13px", fontFamily: "monospace", color: "#0A1628", backgroundColor: "#F1F5F9", padding: "4px 8px", borderRadius: "4px", margin: 0 }}>{item.rule}</p>
                        </div>
                      </div>
                      <div style={{ paddingTop: "16px", borderTop: "1px solid #F1F5F9" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>Suggested Fix</span>
                        <p style={{ color: "#475569", fontSize: "14px", marginTop: "4px", fontStyle: "italic", margin: 0 }}>&ldquo;{item.fix}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "48px", textAlign: "center", border: "2px dashed #E5E7EB", borderRadius: "12px" }}>
                  <p style={{ color: "#94A3B8", margin: 0 }}>No major compliance issues identified.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
