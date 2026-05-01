"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { TrendingUp, Loader2, Plus, BarChart2, Check, Star, AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

type Trade = {
  id: string;
  asset_name: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  trade_date: string;
  rationale: string;
};

type AnalysisResult = {
  winRate: string;
  avgProfitLoss: string;
  bestAssets: string[];
  worstAssets: string[];
  patterns: string;
  recommendations: string[];
};

export default function TradeJournalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"log" | "history">("log");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [assetName, setAssetName] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [rationale, setRationale] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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
      
      await fetchTrades();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchTrades() {
    try {
      const response = await fetch("/api/trades");
      const data = await response.json();
      if (response.ok) setTrades(data);
    } catch (err) {
      console.error("Failed to fetch trades", err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  async function handleLogTrade(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetName,
          entryPrice: parseFloat(entryPrice),
          exitPrice: parseFloat(exitPrice),
          positionSize: parseFloat(positionSize),
          tradeDate,
          rationale,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to log trade");

      setAssetName("");
      setEntryPrice("");
      setExitPrice("");
      setPositionSize("");
      setRationale("");
      await fetchTrades();
      setActiveTab("history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalyse() {
    setIsAnalysing(true);
    setError("");

    try {
      const response = await fetch("/api/trades/analyse", {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse trades");

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalysing(false);
    }
  }

  async function handleDeleteTrade(id: string) {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase.from("trades").delete().eq("id", id);
      if (error) throw error;
      await fetchTrades();
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <TopNav email={userEmail} />
        <DashboardNav />

        <div className="dashboard-content" style={{ width: "min(1000px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="stack gap-6">
            <div className="flex justify-between items-center">
              <div className="stack gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-[#c1a362]" />
                  AI Trade Journal
                </h2>
                <p className="text-gray-400">
                  Log your trades and get AI-powered performance analysis.
                </p>
              </div>
            </div>

            <div className="studio-tabs">
              <button
                className={`btn ${activeTab === "log" ? "studio-tab-active" : "btn-secondary studio-tab-idle"}`}
                onClick={() => setActiveTab("log")}
              >
                <Plus size={18} className="mr-2 inline" />
                Log Trade
              </button>
              <button
                className={`btn ${activeTab === "history" ? "studio-tab-active" : "btn-secondary studio-tab-idle"}`}
                onClick={() => setActiveTab("history")}
              >
                <BarChart2 size={18} className="mr-2 inline" />
                History & Analysis
              </button>
            </div>

            {activeTab === "log" ? (
              <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)] fade-in">
                <form onSubmit={handleLogTrade} className="p-8 stack gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Asset Name</label>
                      <input
                        className="input"
                        placeholder="e.g. AAPL, BTC/USD"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Entry Price</label>
                      <input
                        className="input"
                        type="number"
                        step="0.00000001"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Exit Price</label>
                      <input
                        className="input"
                        type="number"
                        step="0.00000001"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Position Size</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={positionSize}
                        onChange={(e) => setPositionSize(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Trade Date</label>
                      <input
                        className="input"
                        type="date"
                        value={tradeDate}
                        onChange={(e) => setTradeDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="text-sm font-medium text-gray-400">Trade Rationale</label>
                    <textarea
                      className="textarea min-h-[120px]"
                      placeholder="Why did you take this trade? Strategy, setup, emotions..."
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      required
                    />
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <button
                    type="submit"
                    className="btn w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Logging Trade...
                      </>
                    ) : (
                      "Log Trade to Journal"
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="stack gap-8 fade-in">
                <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)]">
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[rgba(193,163,98,0.05)] text-[#c1a362] text-xs uppercase tracking-wider">
                        <tr>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Date</th>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Asset</th>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Size</th>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Entry</th>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Exit</th>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">P/L</th>
                          <th className="p-4 border-b border-[rgba(193,163,98,0.1)] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {trades.length > 0 ? (
                          trades.map((trade) => {
                            const pl = (trade.exit_price - trade.entry_price) * trade.position_size;
                            const isWin = pl > 0;
                            return (
                              <tr key={trade.id} className="border-b border-[rgba(193,163,98,0.05)] hover:bg-[rgba(193,163,98,0.02)]">
                                <td className="p-4 text-gray-400">{format(new Date(trade.trade_date), "dd MMM yy")}</td>
                                <td className="p-4 font-bold text-gray-200">{trade.asset_name}</td>
                                <td className="p-4 text-gray-300">{trade.position_size}</td>
                                <td className="p-4 text-gray-300">{trade.entry_price}</td>
                                <td className="p-4 text-gray-300">{trade.exit_price}</td>
                                <td className={`p-4 font-bold ${isWin ? "text-green-500" : "text-red-500"}`}>
                                  {isWin ? "+" : ""}{pl.toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteTrade(trade.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500 italic">No trades logged yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="stack gap-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Performance Analysis</h3>
                    <button
                      className="btn-light btn-sm flex items-center gap-2"
                      onClick={handleAnalyse}
                      disabled={isAnalysing || trades.length === 0}
                    >
                      {isAnalysing ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Analysing...
                        </>
                      ) : (
                        <>
                          <BarChart2 size={16} />
                          Analyse Performance
                        </>
                      )}
                    </button>
                  </div>

                  {analysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
                      <div className="card border border-[rgba(193,163,98,0.2)] p-6 stack gap-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="stack gap-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Win Rate</span>
                            <span className="text-2xl font-bold text-green-500">{analysis.winRate}</span>
                          </div>
                          <div className="stack gap-1 text-right">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Avg P/L</span>
                            <span className={`text-2xl font-bold ${parseFloat(analysis.avgProfitLoss) >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {analysis.avgProfitLoss}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(193,163,98,0.1)]">
                          <div className="stack gap-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Best Assets</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {analysis.bestAssets.map((asset, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">{asset}</span>
                              ))}
                            </div>
                          </div>
                          <div className="stack gap-1 text-right">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Worst Assets</span>
                            <div className="flex flex-wrap gap-2 mt-1 justify-end">
                              {analysis.worstAssets.map((asset, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">{asset}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-[rgba(193,163,98,0.1)] stack gap-2">
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber-500" />
                            Loss Patterns Identified
                          </span>
                          <p className="text-sm text-gray-300 leading-relaxed italic">&ldquo;{analysis.patterns}&rdquo;</p>
                        </div>
                      </div>

                      <div className="card border border-[rgba(193,163,98,0.2)] p-6 stack gap-4">
                        <h4 className="text-sm font-bold text-[#c1a362] uppercase tracking-wider flex items-center gap-2">
                          <Star size={16} />
                          Growth Recommendations
                        </h4>
                        <ul className="stack gap-4">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-200 bg-[rgba(193,163,98,0.05)] p-3 rounded-lg border border-[rgba(193,163,98,0.1)]">
                              <span className="text-[#c1a362] font-bold shrink-0">{i + 1}.</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
