"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Loader2, Plus, Trash2, PieChart, Globe, AlertCircle, Star } from "lucide-react";
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
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscribed")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      // Check if user has Pro plan
      const planRes = await fetch("/api/user-plan");
      const { plan } = await planRes.json();
      
      if (plan === "starter" || plan === "plus") {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalysing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return "text-green-500";
    if (score <= 7) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)]">
              <div className="p-8 stack gap-6">
                <div className="stack gap-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldAlert className="text-[#c1a362]" />
                    Portfolio Risk Analyser
                  </h2>
                  <p className="text-gray-400">
                    Input up to 10 holdings to get an AI-powered risk and diversification assessment.
                  </p>
                </div>

                <div className="stack gap-4">
                  {holdings.map((holding, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-4 rounded-lg bg-[rgba(15,23,40,0.3)] border border-[rgba(193,163,98,0.1)] relative group">
                      <div className="stack gap-1 md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Asset Name</label>
                        <input
                          className="input h-9 text-sm"
                          placeholder="e.g. S&P 500 ETF"
                          value={holding.assetName}
                          onChange={(e) => updateHolding(index, "assetName", e.target.value)}
                        />
                      </div>
                      <div className="stack gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Class</label>
                        <select
                          className="input h-9 text-sm"
                          value={holding.assetClass}
                          onChange={(e) => updateHolding(index, "assetClass", e.target.value)}
                        >
                          {assetClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="stack gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Region</label>
                        <select
                          className="input h-9 text-sm"
                          value={holding.region}
                          onChange={(e) => updateHolding(index, "region", e.target.value)}
                        >
                          {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="stack gap-1 flex-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">%</label>
                          <input
                            className="input h-9 text-sm"
                            type="number"
                            placeholder="0"
                            value={holding.percentage}
                            onChange={(e) => updateHolding(index, "percentage", e.target.value)}
                          />
                        </div>
                        {holdings.length > 1 && (
                          <button 
                            onClick={() => removeHolding(index)}
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    className="btn-secondary w-full border-dashed border-[rgba(193,163,98,0.3)]"
                    onClick={addHolding}
                    disabled={holdings.length >= 10}
                  >
                    <Plus size={16} className="mr-2 inline" />
                    Add Holding
                  </button>

                  {error && <div className="alert alert-error text-sm">{error}</div>}

                  <button
                    className="btn w-full mt-4"
                    disabled={isAnalysing}
                    onClick={handleAnalyse}
                  >
                    {isAnalysing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Analysing Risk...
                      </>
                    ) : (
                      "Analyse Portfolio Risk"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="stack gap-6">
              {result ? (
                <div className="stack gap-6 fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6 border border-[rgba(193,163,98,0.2)] bg-[rgba(15,23,40,0.3)] text-center stack gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Risk Score</span>
                      <div className={`text-5xl font-bold ${getRiskColor(result.overallRiskScore)}`}>
                        {result.overallRiskScore}/10
                      </div>
                    </div>
                    <div className="card p-6 border border-[rgba(193,163,98,0.2)] bg-[rgba(15,23,40,0.3)] stack gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} className="text-red-500" />
                        Concentration Warnings
                      </span>
                      <ul className="stack gap-1">
                        {result.concentrationWarnings.map((w, i) => (
                          <li key={i} className="text-xs text-gray-300">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-6 border border-[rgba(193,163,98,0.2)] bg-[rgba(15,23,40,0.3)] stack gap-4">
                      <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest flex items-center gap-2">
                        <Globe size={14} />
                        Geographic Exposure
                      </span>
                      <div className="stack gap-3">
                        {result.geographicExposure.map((g, i) => (
                          <div key={i} className="stack gap-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">{g.region}</span>
                              <span className="font-bold text-[#c1a362]">{g.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#c1a362]" style={{ width: `${g.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-6 border border-[rgba(193,163,98,0.2)] bg-[rgba(15,23,40,0.3)] stack gap-4">
                      <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest flex items-center gap-2">
                        <PieChart size={14} />
                        Asset Class Breakdown
                      </span>
                      <div className="stack gap-3">
                        {result.assetClassBreakdown.map((a, i) => (
                          <div key={i} className="stack gap-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">{a.class}</span>
                              <span className="font-bold text-[#c1a362]">{a.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#c1a362]" style={{ width: `${a.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card p-6 border border-[rgba(193,163,98,0.2)] bg-[rgba(15,23,40,0.3)] stack gap-3">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert size={14} />
                      Correlation & Systemic Risks
                    </span>
                    <p className="text-sm text-gray-300 leading-relaxed italic">
                      &ldquo;{result.correlationRisks}&rdquo;
                    </p>
                  </div>

                  <div className="card p-6 border border-[rgba(193,163,98,0.2)] bg-[rgba(15,23,40,0.3)] stack gap-4">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                      <Star size={14} />
                      Diversification Recommendations
                    </span>
                    <ul className="stack gap-3">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-200 bg-[rgba(193,163,98,0.05)] p-3 rounded-lg border border-[rgba(193,163,98,0.1)]">
                          <span className="text-[#c1a362] font-bold shrink-0">{i + 1}.</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
  );
}
