"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2, Plus, BarChart2, Check, Star, AlertTriangle, Trash2, MessageSquare, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

type Trade = {
  id: string;
  symbol?: string;
  asset_name?: string;
  entry_price: number;
  exit_price: number;
  quantity?: number;
  position_size?: number;
  direction?: "long" | "short";
  trade_date: string;
  notes?: string;
  rationale?: string;
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
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(false);
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
      
      await fetchTrades();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchTrades() {
    try {
      const response = await fetch("/api/trades");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch trades");
      }
      const data = await response.json();
      setTrades(data);
    } catch (err) {
      console.error("Failed to fetch trades", err);
    }
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
          symbol,
          direction,
          entry_price: parseFloat(entryPrice),
          exit_price: parseFloat(exitPrice),
          quantity: parseFloat(quantity),
          trade_date: tradeDate,
          notes
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to log trade");
      }

      setSymbol("");
      setDirection("long");
      setEntryPrice("");
      setExitPrice("");
      setQuantity("");
      setNotes("");
      await fetchTrades();
      setActiveTab("history");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to log trade");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalyse() {
    if (trades.length === 0) return;
    setIsAnalysing(true);
    setAnalysis(null);
    setError("");

    try {
      const response = await fetch("/api/trades/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to analyse trades");
      }

      const data = await response.json();
      setAnalysis(data.result);
    } catch (err) {
      console.error("Failed to analyse trades", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalysing(false);
    }
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this trade?")) return;
    try {
      const res = await fetch(`/api/trades?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchTrades();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Trade Journal
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Log and analyse your trades to identify profitable patterns and risks.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #E5E7EB", paddingBottom: "1px", marginBottom: "40px" }}>
        <button 
          onClick={() => setActiveTab("log")}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "transparent", 
            border: "none", 
            borderBottom: activeTab === "log" ? "2px solid #C9A84C" : "2px solid transparent",
            color: activeTab === "log" ? "#0A1628" : "#64748B",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Log New Trade
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "transparent", 
            border: "none", 
            borderBottom: activeTab === "history" ? "2px solid #C9A84C" : "2px solid transparent",
            color: activeTab === "history" ? "#0A1628" : "#64748B",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Trade History ({trades.length})
        </button>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {(isSubmitting || isAnalysing) && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={true} messages={isSubmitting ? ["Saving trade...", "Updating history..."] : ["Connecting to AI...", "Analysing trade patterns...", "Calculating metrics...", "Finalising..."]} />
          </div>
        )}

        {activeTab === "log" ? (
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>New Trade Entry</h2>
            <form onSubmit={handleLogTrade} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Symbol</label>
                  <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} required placeholder="e.g. AAPL" style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Trade Date</label>
                  <input type="date" value={tradeDate} onChange={e => setTradeDate(e.target.value)} required style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Direction</label>
                  <select value={direction} onChange={(e) => setDirection(e.target.value as "long" | "short")} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%", backgroundColor: "white" }}>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Quantity</label>
                  <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder="e.g. 10" style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Entry Price</label>
                  <input type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} required style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Exit Price</label>
                  <input type="number" step="any" value={exitPrice} onChange={e => setExitPrice(e.target.value)} required style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} required rows={4} placeholder="Setup, rationale, execution notes..." style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", resize: "none", fontFamily: "inherit", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} />
              </div>

              {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  backgroundColor: "#0A1628", 
                  color: "white", 
                  padding: "16px", 
                  borderRadius: "10px", 
                  fontWeight: "700", 
                  fontSize: "15px", 
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  border: "none",
                  marginTop: "24px",
                  letterSpacing: "0.5px"
                }}
              >
                <Plus size={20} />
                {isSubmitting ? "Saving..." : "Log Trade"}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase" }}>Performance Intelligence</h2>
              <button 
                onClick={handleAnalyse} 
                disabled={isAnalysing || trades.length === 0}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#0A1628", color: "white", borderRadius: "8px", border: "none", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }}
              >
                <BarChart2 size={16} />
                {isAnalysing ? "Analysing..." : "Run AI Analysis"}
              </button>
            </div>

            {analysis && (
              <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC", textAlign: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>Win Rate</span>
                  <div style={{ fontSize: "40px", fontWeight: "900", color: "#0A1628", marginTop: "8px" }}>{analysis.winRate}</div>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>Average P&amp;L</span>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "#0A1628", marginTop: "8px" }}>{analysis.avgProfitLoss}</div>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>Market Patterns</span>
                  <p style={{ fontSize: "14px", color: "#374151", margin: "8px 0 0", lineHeight: "1.6" }}>{analysis.patterns}</p>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>Best Symbols</span>
                  <p style={{ fontSize: "14px", color: "#374151", margin: "8px 0 0", lineHeight: "1.6" }}>
                    {analysis.bestAssets?.length ? analysis.bestAssets.join(", ") : "---"}
                  </p>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>Worst Symbols</span>
                  <p style={{ fontSize: "14px", color: "#374151", margin: "8px 0 0", lineHeight: "1.6" }}>
                    {analysis.worstAssets?.length ? analysis.worstAssets.join(", ") : "---"}
                  </p>
                </div>
                <div style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B" }}>Recommendations</span>
                  <ul style={{ margin: "10px 0 0", paddingLeft: "18px", color: "#374151", lineHeight: "1.7" }}>
                    {analysis.recommendations?.map((r, i) => (
                      <li key={i} style={{ fontSize: "14px" }}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
                  <thead>
                    <tr>
                      {["Date", "Symbol", "Dir", "Qty", "Entry", "Exit", "P&L", ""].map((h) => (
                        <th key={h} style={{ textAlign: "left", fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 10px", borderBottom: "1px solid #E5E7EB" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, idx) => {
                      const tradeSymbol = (trade.symbol || trade.asset_name || "").toString();
                      const tradeDirection = trade.direction || "long";
                      const qty = Number(trade.quantity ?? trade.position_size ?? 0);
                      const pnl =
                        tradeDirection === "short"
                          ? (trade.entry_price - trade.exit_price) * qty
                          : (trade.exit_price - trade.entry_price) * qty;
                      const isWin = pnl >= 0;
                      return (
                        <tr key={trade.id} style={{ backgroundColor: idx % 2 === 0 ? "white" : "#F9FAFB" }}>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#374151" }}>
                            {format(new Date(trade.trade_date), "dd MMM yyyy")}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#0A1628", fontWeight: 800 }}>
                            {tradeSymbol || "---"}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#374151" }}>
                            {tradeDirection.toUpperCase()}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#374151" }}>
                            {Number.isFinite(qty) && qty ? qty : "---"}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#374151" }}>
                            {trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", color: "#374151" }}>
                            {trade.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9", fontSize: "13px", fontWeight: 800, color: isWin ? "#059669" : "#DC2626" }}>
                            {isWin ? "+" : ""}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 10px", borderBottom: "1px solid #F1F5F9" }}>
                            <button onClick={() => deleteTrade(trade.id)} style={{ padding: "8px", color: "#94A3B8", backgroundColor: "transparent", border: "none", cursor: "pointer" }} aria-label="Delete trade">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {trades.length === 0 && (
                <div style={{ padding: "60px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px dashed #E5E7EB" }}>
                  <TrendingUp size={48} color="#CBD5E1" style={{ marginBottom: "16px" }} />
                  <p style={{ color: "#64748B", margin: 0 }}>No trades logged yet. Start by logging your first trade entry.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
