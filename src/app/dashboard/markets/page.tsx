"use client";

import { useState, useEffect, useCallback } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { TrendingUp, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
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
  const [userEmail, setUserEmail] = useState<string | undefined>();
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
      setError(err instanceof Error ? err.message : "Something went wrong");
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
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  const renderCard = (item: MarketItem) => {
    const isPositive = !item.changePercent.startsWith("-") && item.changePercent !== "0.00%";
    return (
      <div key={item.symbol} className="p-4 rounded-xl border border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.3)] stack gap-2">
        <div className="flex justify-between items-start">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{item.symbol}</span>
          {isPositive ? (
            <ArrowUpRight className="text-green-500" size={16} />
          ) : (
            <ArrowDownRight className="text-red-500" size={16} />
          )}
        </div>
        <div className="flex justify-between items-end">
          <span className="text-xl font-bold text-gray-200">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          <span className={`text-sm font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {item.changePercent}
          </span>
        </div>
      </div>
    );
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <TopNav email={userEmail} />
        <DashboardNav />

        <div className="dashboard-content" style={{ width: "min(1200px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="stack gap-8">
            <div className="flex justify-between items-end">
              <div className="stack gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-[#c1a362]" />
                  Live Market Dashboard
                </h2>
                <p className="text-gray-400">
                  Real-time global market data. Auto-refreshes every 60 seconds.
                </p>
              </div>
              <div className="text-right stack gap-1">
                <button 
                  onClick={fetchMarketData} 
                  disabled={isRefreshing}
                  className="text-xs text-[#c1a362] hover:underline flex items-center gap-1 justify-end"
                >
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                  Manual Refresh
                </button>
                {lastUpdated && (
                  <span className="text-[10px] text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {data && (
              <div className="stack gap-10 fade-in">
                <section className="stack gap-4">
                  <h3 className="text-lg font-bold text-[#c1a362] border-b border-[rgba(193,163,98,0.2)] pb-2 uppercase tracking-widest text-xs">Major Indices</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {data.indices.map(renderCard)}
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <section className="stack gap-4">
                    <h3 className="text-lg font-bold text-[#c1a362] border-b border-[rgba(193,163,98,0.2)] pb-2 uppercase tracking-widest text-xs">FX Pairs</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.fx.map(renderCard)}
                    </div>
                  </section>

                  <section className="stack gap-4">
                    <h3 className="text-lg font-bold text-[#c1a362] border-b border-[rgba(193,163,98,0.2)] pb-2 uppercase tracking-widest text-xs">Commodities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.commodities.map(renderCard)}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {!data && !error && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#c1a362]" size={40} />
                <p className="text-gray-500">Connecting to market data streams...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
