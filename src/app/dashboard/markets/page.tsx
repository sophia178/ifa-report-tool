"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MarketItem = {
  symbol: string;
  price: number;
  changePercent: string;
};

type MarketData = {
  indices: MarketItem[];
  fx: MarketItem[];
  commodities: MarketItem[];
};

export default function MarketsPage() {
  const router = useRouter();
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/markets");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to fetch markets");
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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
      
      await fetchMarketData();
      setIsLoading(false);
    }
    checkAccess();
  }, [router, fetchMarketData]);

  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [isLoading, fetchMarketData]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  const renderCard = (item: MarketItem) => {
    const isPositive = !item.changePercent.startsWith("-") && item.changePercent !== "0.00%";
    
    return (
      <div key={item.symbol} style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        padding: "20px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #F0F2F5"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {item.symbol}
          </span>
          <span style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628" }}>
            {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </span>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "4px", 
          padding: "6px 12px", 
          borderRadius: "6px", 
          fontSize: "13px", 
          fontWeight: "700",
          backgroundColor: isPositive ? "#ECFDF5" : "#FEF2F2",
          color: isPositive ? "#059669" : "#DC2626"
        }}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {item.changePercent}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
            Market Intelligence
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
            Real-time global market data terminal. Refreshes every 60s.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", backgroundColor: "white", padding: "12px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "right", paddingRight: "16px", borderRight: "1px solid #E5E7EB" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" }}>Last Update</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>{lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={fetchMarketData} 
            disabled={isRefreshing}
            style={{ 
              backgroundColor: "transparent", 
              border: "none", 
              cursor: isRefreshing ? "not-allowed" : "pointer",
              color: "#0A1628",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px"
            }}
          >
            <RefreshCw size={20} style={{ animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#DC2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Global Indices</h2>
              <div style={{ height: "1px", flex: 1, backgroundColor: "#E5E7EB" }}></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {data.indices.map(renderCard)}
            </div>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", flexWrap: "wrap" }}>
            <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Foreign Exchange</h2>
                <div style={{ height: "1px", flex: 1, backgroundColor: "#E5E7EB" }}></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.fx.map(renderCard)}
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Commodities</h2>
                <div style={{ height: "1px", flex: 1, backgroundColor: "#E5E7EB" }}></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.commodities.map(renderCard)}
              </div>
            </section>
          </div>
        </div>
      )}

      {!data && !error && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: "24px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "4px solid #F1F5F9", borderTopColor: "#0A1628", animation: "spin 1s linear infinite" }}></div>
            <TrendingUp style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#0A1628" }} size={24} />
          </div>
          <p style={{ color: "#64748B", fontWeight: "600" }}>Connecting to global data streams...</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
