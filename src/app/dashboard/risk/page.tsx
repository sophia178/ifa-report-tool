"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Loader2, Plus, Trash2, PieChart, Globe, AlertCircle, Star, AlertTriangle, TrendingUp, Activity, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

type Holding = {
  assetName: string;
  assetClass: string;
  region: string;
  percentage: string;
};

type AnalysisResult = {
  overallRiskScore: number;
  concentrationWarnings: string[];
  geographicExposure: { region: string; percentage: number }[];
  assetClassBreakdown: { class: string; percentage: number }[];
  correlationRisks: string;
  recommendations: string[];
};

const assetClasses = ["Equity", "Bond", "Property", "Cash", "Alternative"];
const regions = ["UK", "USA", "Europe", "Asia", "Emerging Markets", "Global"];

export default function RiskPage() {
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([
    { assetName: "", assetClass: assetClasses[0], region: regions[0], percentage: "" }
  ]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const totalPercentage = holdings.reduce((sum, h) => sum + (parseFloat(h.percentage) || 0), 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01;

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
      
      if (!isPro) {
        router.push("/pricing?message=upgrade-pro");
        return;
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  function addHolding() {
    if (holdings.length < 10) {
      setHoldings([...holdings, { assetName: "", assetClass: assetClasses[0], region: regions[0], percentage: "" }]);
    }
  }

  function removeHolding(index: number) {
    setHoldings(holdings.filter((_, i) => i !== index));
  }

  function updateHolding(index: number, field: keyof Holding, value: string) {
    const newHoldings = [...holdings];
    newHoldings[index][field] = value;
    setHoldings(newHoldings);
  }

  async function handleAnalyse() {
    if (!isValid) return;

    setIsAnalysing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to analyse risk");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalysing(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return "#10B981";
    if (score <= 7) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Portfolio Risk Analyser
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          AI-powered risk and diversification assessment for client portfolios.
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isAnalysing && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isAnalysing} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Portfolio Holdings</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {holdings.map((holding, index) => (
              <div key={index} style={{ padding: "20px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Asset Name</label>
                    <input
                      type="text"
                      placeholder="e.g. S&P 500 ETF"
                      value={holding.assetName}
                      onChange={(e) => updateHolding(index, "assetName", e.target.value)}
                      style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", outline: "none", backgroundColor: "white" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Weight (%)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={holding.percentage}
                      onChange={(e) => updateHolding(index, "percentage", e.target.value)}
                      style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", outline: "none", backgroundColor: "white" }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Asset Class</label>
                    <select
                      value={holding.assetClass}
                      onChange={(e) => updateHolding(index, "assetClass", e.target.value)}
                      style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", outline: "none", backgroundColor: "white" }}
                    >
                      {assetClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Region</label>
                    <select
                      value={holding.region}
                      onChange={(e) => updateHolding(index, "region", e.target.value)}
                      style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", outline: "none", backgroundColor: "white" }}
                    >
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                {holdings.length > 1 && (
                  <button 
                    onClick={() => removeHolding(index)}
                    style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#EF4444", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={addHolding}
              disabled={holdings.length >= 10}
              style={{ padding: "12px", border: "2px dashed #E5E7EB", borderRadius: "8px", color: "#64748B", backgroundColor: "transparent", cursor: "pointer", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
            >
              <Plus size={16} />
              Add Holding
            </button>

            {/* Validation Message Inline */}
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: isValid ? "#C9A84C" : "#64748B" }}>
                Total Allocation: {totalPercentage}%
              </span>
              {!isValid && (
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#EF4444" }}>
                  Total portfolio percentage must equal 100%. Currently: {totalPercentage}%
                </span>
              )}
            </div>

            <button
              onClick={handleAnalyse}
              disabled={isAnalysing || !isValid}
              style={{
                backgroundColor: !isValid ? "#94A3B8" : "#0A1628",
                color: "white",
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: (isAnalysing || !isValid) ? "not-allowed" : "pointer",
                opacity: isAnalysing ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "24px",
                letterSpacing: "0.5px"
              }}
            >
              <Activity size={20} />
              {isAnalysing ? "Analysing..." : "Run Risk Assessment"}
            </button>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", textAlign: "center", margin: "12px 0 0" }}>{error}</p>}
          </div>
        </div>

        {result ? (
          <div style={{ marginTop: "40px", backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={{ backgroundColor: "#0A1628", color: "white", borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", marginBottom: "8px" }}>Overall Risk Score</h3>
                <div style={{ fontSize: "64px", fontWeight: "800", color: getRiskColor(result.overallRiskScore) }}>
                  {result.overallRiskScore}<span style={{ fontSize: "24px", color: "#64748B" }}>/10</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    Concentration Warnings
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.concentrationWarnings.map((w, i) => (
                      <li key={i} style={{ fontSize: "14px", color: "#374151", paddingLeft: "20px", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, top: "8px", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#E5E7EB" }}></span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={16} color="#C9A84C" />
                    Recommendations
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.recommendations.map((r, i) => (
                      <li key={i} style={{ fontSize: "14px", color: "#374151", fontStyle: "italic" }}>
                        &quot;{r}&quot;
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px dashed #E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <ShieldAlert size={48} color="#CBD5E1" />
              <p style={{ color: "#64748B", margin: 0 }}>Input your portfolio holdings to begin analysis.</p>
            </div>
          )}
      </div>
    </div>
  );
}
