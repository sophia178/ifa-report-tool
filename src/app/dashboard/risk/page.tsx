"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Loader2, Plus, Trash2, PieChart, Globe, AlertCircle, Star, AlertTriangle, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
    const totalPercentage = holdings.reduce((sum, h) => sum + (parseFloat(h.percentage) || 0), 0);
    if (totalPercentage !== 100) {
      setError("Total portfolio percentage must equal 100%. Currently: " + totalPercentage + "%");
      return;
    }

    setIsAnalysing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse risk");

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsAnalysing(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return "#10B981";
    if (score <= 7) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Portfolio Risk Analyser
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          AI-powered risk and diversification assessment for client portfolios.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
        {/* Input Card */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", marginBottom: "20px" }}>Portfolio Holdings</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {holdings.map((holding, index) => (
              <div key={index} style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Asset Name</label>
                    <input
                      type="text"
                      placeholder="e.g. S&P 500 ETF"
                      value={holding.assetName}
                      onChange={(e) => updateHolding(index, "assetName", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Weight (%)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={holding.percentage}
                      onChange={(e) => updateHolding(index, "percentage", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Asset Class</label>
                    <select
                      value={holding.assetClass}
                      onChange={(e) => updateHolding(index, "assetClass", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                    >
                      {assetClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Region</label>
                    <select
                      value={holding.region}
                      onChange={(e) => updateHolding(index, "region", e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #E5E7EB", fontSize: "13px" }}
                    >
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                {holdings.length > 1 && (
                  <button 
                    onClick={() => removeHolding(index)}
                    style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#EF4444", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={addHolding}
              disabled={holdings.length >= 10}
              style={{ padding: "12px", border: "2px dashed #E5E7EB", borderRadius: "8px", color: "#64748B", backgroundColor: "transparent", cursor: "pointer", fontWeight: "600", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Plus size={16} />
              Add Holding
            </button>

            <button
              onClick={handleAnalyse}
              disabled={isAnalysing}
              style={{ width: "100%", padding: "14px", backgroundColor: "#0A1628", color: "white", borderRadius: "8px", border: "none", fontWeight: "700", fontSize: "15px", cursor: isAnalysing ? "not-allowed" : "pointer", marginTop: "12px" }}
            >
              {isAnalysing ? "Analysing..." : "Run Risk Assessment"}
            </button>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", textAlign: "center", margin: 0 }}>{error}</p>}
          </div>
        </div>

        {/* Results Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {result ? (
            <>
              <div style={{ backgroundColor: "#0A1628", color: "white", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", marginBottom: "8px" }}>Overall Risk Score</h3>
                <div style={{ fontSize: "64px", fontWeight: "800", color: getRiskColor(result.overallRiskScore) }}>
                  {result.overallRiskScore}<span style={{ fontSize: "24px", color: "#64748B" }}>/10</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB" }}>
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

                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB" }}>
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
            </>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <ShieldAlert size={48} color="#CBD5E1" />
              <p style={{ color: "#64748B", margin: 0 }}>Input your portfolio holdings to begin analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
