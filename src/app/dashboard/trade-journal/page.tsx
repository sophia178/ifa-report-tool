"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Loader2, Plus, BarChart2, Check, Star, AlertTriangle, Trash2, MessageSquare } from "lucide-react";
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
      const data = await response.json();
      if (response.ok) setTrades(data);
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
          asset_name: assetName,
          entry_price: parseFloat(entryPrice),
          exit_price: parseFloat(exitPrice),
          position_size: parseFloat(positionSize),
          trade_date: tradeDate,
          rationale
        }),
      });

      if (!response.ok) throw new Error("Failed to log trade");

      setAssetName("");
      setEntryPrice("");
      setExitPrice("");
      setPositionSize("");
      setRationale("");
      await fetchTrades();
      setActiveTab("history");
    } catch (err: any) {
      setError(err.message || "Failed to log trade");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnalyse() {
    if (trades.length === 0) return;
    setIsAnalysing(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/trades/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades }),
      });

      const data = await response.json();
      if (response.ok) setAnalysis(data);
    } catch (err) {
      console.error("Failed to analyse trades", err);
    } finally {
      setIsAnalysing(false);
    }
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this trade?")) return;
    try {
      await fetch(`/api/trades?id=${id}`, { method: "DELETE" });
      await fetchTrades();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Trade Journal
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Log and analyse your trades to identify profitable patterns and risks.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #E5E7EB", paddingBottom: "1px" }}>
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

      {activeTab === "log" ? (
        <form onSubmit={handleLogTrade} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", backgroundColor: "white", padding: "32px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Asset / Ticker</label>
            <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)} required placeholder="e.g. BTC/USD" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Trade Date</label>
            <input type="date" value={tradeDate} onChange={e => setTradeDate(e.target.value)} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Entry Price</label>
            <input type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Exit Price</label>
            <input type="number" step="any" value={exitPrice} onChange={e => setExitPrice(e.target.value)} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Rationale / Strategy</label>
            <textarea value={rationale} onChange={e => setRationale(e.target.value)} required rows={4} placeholder="Why did you take this trade?" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", resize: "none" }} />
          </div>
          <button type="submit" disabled={isSubmitting} 
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#1a2a40"; }}
            onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = "#0A1628"; }}
            style={{ gridColumn: "span 2", padding: "14px", backgroundColor: "#0A1628", color: "white", borderRadius: "8px", border: "none", fontWeight: "700", cursor: isSubmitting ? "not-allowed" : "pointer", transition: "background-color 0.2s" }}
          >
            {isSubmitting ? "Logging..." : "Log Trade"}
          </button>
          {error && <p style={{ color: "#EF4444", fontSize: "12px", gridColumn: "span 2", margin: 0 }}>{error}</p>}
        </form>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Performance Analysis</h2>
            <button 
              onClick={handleAnalyse} 
              disabled={isAnalysing || trades.length === 0}
              onMouseEnter={(e) => { if (!isAnalysing && trades.length > 0) e.currentTarget.style.backgroundColor = "#B39239"; }}
              onMouseLeave={(e) => { if (!isAnalysing && trades.length > 0) e.currentTarget.style.backgroundColor = "#C9A84C"; }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#C9A84C", color: "#0A1628", borderRadius: "8px", border: "none", fontWeight: "700", cursor: "pointer", transition: "background-color 0.2s" }}
            >
              {isAnalysing ? <Loader2 className="animate-spin" size={16} /> : <BarChart2 size={16} />}
              {isAnalysing ? "Analysing..." : "Run AI Analysis"}
            </button>
          </div>

          {analysis && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ backgroundColor: "#F8FAFC", padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Win Rate</span>
                <div style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628" }}>{analysis.winRate}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Patterns</span>
                <p style={{ fontSize: "14px", color: "#374151", margin: "8px 0 0", lineHeight: "1.5" }}>{analysis.patterns}</p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {trades.map((trade) => {
              const profit = trade.exit_price - trade.entry_price;
              const isWin = profit > 0;
              return (
                <div key={trade.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", backgroundColor: "white", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#0A1628" }}>{trade.asset_name}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: isWin ? "#059669" : "#DC2626", backgroundColor: isWin ? "#ECFDF5" : "#FEF2F2", padding: "2px 8px", borderRadius: "4px" }}>
                        {isWin ? "+" : ""}{profit.toFixed(2)}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>{format(new Date(trade.trade_date), "dd MMM yyyy")}</span>
                  </div>
                  <button onClick={() => deleteTrade(trade.id)} style={{ padding: "8px", color: "#94A3B8", backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
