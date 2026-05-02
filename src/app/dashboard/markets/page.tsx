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
    
    // Simple SVG sparkline generation
    const points = Array.from({ length: 10 }, (_, i) => ({
      x: i * 20,
      y: 20 + Math.random() * 20 * (isPositive ? -1 : 1) + (isPositive ? 10 : 0)
    }));
    const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
      <div key={item.symbol} className="market-card stack gap-4">
        <div className="flex justify-between items-start">
          <div className="stack gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.symbol}</span>
            <span className="text-lg font-bold text-[#0a1628]">
              {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {item.changePercent}
          </div>
        </div>
        
        <svg className="sparkline" viewBox="0 0 180 40" preserveAspectRatio="none">
          <path
            d={d}
            fill="none"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="stack gap-10">
      <div className="flex justify-between items-end">
        <div className="stack gap-2">
          <h2 className="display-medium text-[#0a1628]">Market Intelligence</h2>
          <p className="text-gray-500 body-large">
            Real-time global market data terminal. Refreshes every 60s.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
          <div className="stack gap-0 text-right pr-4 border-r border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Update</span>
            <span className="text-xs font-bold text-[#0a1628]">{lastUpdated?.toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={fetchMarketData} 
            disabled={isRefreshing}
            className="w-10 h-10 flex items-center justify-center text-[#c9a84c] hover:bg-[#F4F6F9] rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {data && (
        <div className="stack gap-12 fade-in">
          <section className="stack gap-6">
            <div className="flex items-center gap-4">
              <h3 className="title-large text-[#0a1628]">Global Indices</h3>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {data.indices.map(renderCard)}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section className="stack gap-6">
              <div className="flex items-center gap-4">
                <h3 className="title-large text-[#0a1628]">Foreign Exchange</h3>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.fx.map(renderCard)}
              </div>
            </section>

            <section className="stack gap-6">
              <div className="flex items-center gap-4">
                <h3 className="title-large text-[#0a1628]">Commodities</h3>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.commodities.map(renderCard)}
              </div>
            </section>
          </div>
        </div>
      )}

      {!data && !error && (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#F4F6F9] border-t-[#c9a84c] animate-spin"></div>
            <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#c9a84c]" size={24} />
          </div>
          <p className="text-gray-400 font-medium">Connecting to global data streams...</p>
        </div>
      )}
    </div>
  );
}

