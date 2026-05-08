"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Newspaper, AlertTriangle } from "lucide-react";

interface NewsItem {
  topic: string;
  developments: string;
  implications: string;
  adviserAdvice: string;
  riskFlags: string;
}

export default function NewsPage() {
  const [briefings, setBriefings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: ["FCA", "UK Economy", "Consumer Duty", "Pensions"] }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch news");
      }

      const data = await res.json();
      setBriefings(data.result || []);
    } catch (err) {
      console.error("News fetch error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while loading news.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#0A1628] mb-2">Adviser News Briefing</h1>
          <p className="text-gray-600">Daily insights and regulatory developments for UK financial advisers.</p>
        </div>
        <button
          onClick={fetchNews}
          disabled={isLoading}
          className="flex items-center gap-2 bg-[#0A1628] text-white px-6 py-3 rounded-xl font-bold transition-all hover:bg-[#1a2a40] disabled:opacity-50"
        >
          <RefreshCw className={isLoading ? "animate-spin" : ""} size={20} />
          {isLoading ? "Refreshing..." : "Refresh News"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl mb-8 flex items-start gap-4">
          <AlertTriangle className="flex-shrink-0" />
          <div>
            <p className="font-bold mb-1">Could not load news</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse h-64" />
          ))}
        </div>
      ) : briefings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {briefings.map((item: NewsItem, idx: number) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#F8F6F1] p-3 rounded-xl">
                  <Newspaper className="text-[#C9A84C]" size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#0A1628]">{item.topic}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">Developments</h4>
                  <p className="text-gray-700 leading-relaxed">{item.developments}</p>
                </div>
                
                <div className="bg-[#F8F6F1] p-4 rounded-xl">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A1628] mb-1">Implications for Advisers</h4>
                  <p className="text-[#0A1628] text-sm italic">{item.implications}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-1">Client Advice</h4>
                    <p className="text-xs text-gray-600">{item.adviserAdvice}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-red-400 mb-1">Risk Flags</h4>
                    <p className="text-xs text-red-600">{item.riskFlags}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No news briefings available at the moment.</p>
        </div>
      )}
    </div>
  );
}
