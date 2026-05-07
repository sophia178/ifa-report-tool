"use client";

import { useState, useEffect } from "react";
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
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
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
      setError("Something went wrong. Please try again.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse trades");

      setAnalysis(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          AI Trade Journal
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Log your trades and get AI-powered performance analysis.
        </p>
      </div>

      <div style={{ display: "flex", backgroundColor: "#F1F5F9", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        <button
          onClick={() => setActiveTab("log")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "log" ? "white" : "transparent",
            color: activeTab === "log" ? "#0A1628" : "#64748B",
            boxShadow: activeTab === "log" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s ease"
          }}
        >
          <Plus size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
          Log Trade
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            border: "none",
            backgroundColor: activeTab === "history" ? "white" : "transparent",
            color: activeTab === "history" ? "#0A1628" : "#64748B",
            boxShadow: activeTab === "history" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s ease"
          }}
        >
          <BarChart2 size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
          History & Analysis
        </button>
      </div>

      {activeTab === "log" ? (
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <form onSubmit={handleLogTrade} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Asset Name</label>
                <input
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", color: "#1E293B" }}
                  placeholder="e.g. AAPL, BTC/USD"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Entry Price</label>
                <input
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", color: "#1E293B" }}
                  type="number"
                  step="0.00000001"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Exit Price</label>
                <input
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", color: "#1E293B" }}
                  type="number"
                  step="0.00000001"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Position Size</label>
                <input
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", color: "#1E293B" }}
                  type="number"
                  step="0.01"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Trade Date</label>
                <input
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", color: "#1E293B" }}
                  type="date"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Trade Rationale</label>
              <textarea
                style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", minHeight: "120px", color: "#1E293B", fontFamily: "inherit" }}
                placeholder="Why did you take this trade? Strategy, setup, emotions..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "#991B1B", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#0A1628",
                color: "white",
                padding: "14px 24px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                opacity: isSubmitting ? 0.7 : 1
              }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#F8FAFC", color: "#64748B" }}>
                  <tr>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>Date</th>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>Asset</th>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>Size</th>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>Entry</th>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>Exit</th>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB" }}>P/L</th>
                    <th style={{ padding: "16px 24px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E5E7EB", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "14px" }}>
                  {trades.length > 0 ? (
                    trades.map((trade, idx) => {
                      const pl = (trade.exit_price - trade.entry_price) * trade.position_size;
                      const isWin = pl > 0;
                      return (
                        <tr key={trade.id} style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "#FAFBFC", borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "16px 24px", color: "#64748B" }}>{format(new Date(trade.trade_date), "dd MMM yy")}</td>
                          <td style={{ padding: "16px 24px", fontWeight: "700", color: "#0A1628" }}>{trade.asset_name}</td>
                          <td style={{ padding: "16px 24px", color: "#334155" }}>{trade.position_size}</td>
                          <td style={{ padding: "16px 24px", color: "#334155" }}>{trade.entry_price}</td>
                          <td style={{ padding: "16px 24px", color: "#334155" }}>{trade.exit_price}</td>
                          <td style={{ padding: "16px 24px", fontWeight: "800", color: isWin ? "#059669" : "#DC2626" }}>
                            {isWin ? "+" : ""}{pl.toFixed(2)}
                          </td>
                          <td style={{ padding: "16px 24px", textAlign: "right" }}>
                            <button 
                              onClick={() => handleDeleteTrade(trade.id)}
                              style={{ color: "#94A3B8", cursor: "pointer", background: "none", border: "none", padding: "4px" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#94A3B8", fontStyle: "italic" }}>No trades logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Performance Analysis</h3>
              <button
                disabled={isAnalysing || trades.length === 0}
                onClick={handleAnalyse}
                style={{
                  backgroundColor: "#0A1628",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "none",
                  cursor: (isAnalysing || trades.length === 0) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: (isAnalysing || trades.length === 0) ? 0.7 : 1
                }}
              >
                {isAnalysing ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Analysing...
                  </>
                ) : (
                  <>
                    <BarChart2 size={14} />
                    Analyse Performance
                  </>
                )}
              </button>
            </div>

            {analysis && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Win Rate</span>
                      <span style={{ fontSize: "24px", fontWeight: "800", color: "#059669" }}>{analysis.winRate}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "right" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg P/L</span>
                      <span style={{ fontSize: "24px", fontWeight: "800", color: parseFloat(analysis.avgProfitLoss) >= 0 ? "#059669" : "#DC2626" }}>
                        {analysis.avgProfitLoss}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "24px", borderTop: "1px solid #F1F5F9" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase" }}>Best Assets</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {analysis.bestAssets.map((asset, i) => (
                          <span key={i} style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "#ECFDF5", color: "#059669", fontSize: "12px", fontWeight: "700", border: "1px solid #10B981" }}>{asset}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase" }}>Worst Assets</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {analysis.worstAssets.map((asset, i) => (
                          <span key={i} style={{ padding: "4px 10px", borderRadius: "6px", backgroundColor: "#FEF2F2", color: "#DC2626", fontSize: "12px", fontWeight: "700", border: "1px solid #EF4444" }}>{asset}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: "24px", borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#D97706", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertTriangle size={14} />
                      Loss Patterns Identified
                    </span>
                    <p style={{ fontSize: "14px", color: "#475569", fontStyle: "italic", lineHeight: "1.6", margin: 0 }}>&ldquo;{analysis.patterns}&rdquo;</p>
                  </div>
                </div>

                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                    <Star size={16} color="#C9A84C" />
                    Growth Recommendations
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} style={{ display: "flex", gap: "16px", padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E5E7EB" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "#0A1628" }}>{i + 1}.</span>
                        <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.5", margin: 0 }}>{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
