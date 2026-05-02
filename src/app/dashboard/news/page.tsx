"use client";

import { useState, useEffect } from "react";
import { Newspaper, Loader2, Search, RefreshCw, Send, AlertTriangle, MessageSquare, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NewsItem = {
  topic: string;
  developments: string;
  implications: string;
  adviserAdvice: string;
  riskFlags: string;
};

type Briefing = {
  id: string;
  keywords: string[];
  briefing_json: NewsItem[];
  created_at: string;
};

export default function NewsPage() {
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
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
      
      await fetchBriefings();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchBriefings() {
    try {
      const response = await fetch("/api/news");
      const data = await response.json();
      if (response.ok) setBriefings(data);
    } catch (err) {
      console.error("Failed to fetch briefings", err);
    }
  }

  async function handleGenerate() {
    const keywordArray = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0).slice(0, 5);
    if (keywordArray.length === 0) return;
    
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywordArray }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate briefing");

      await fetchBriefings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  const latestBriefing = briefings[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 stack gap-6">
              <div className="card shadow-xl border border-[rgba(193,163,98,0.2)] p-8">
                <div className="stack gap-6">
                  <div className="stack gap-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Newspaper className="text-[#c1a362]" />
                      Financial News Feed
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Enter up to 5 keywords or assets to generate a structured AI briefing.
                    </p>
                  </div>

                  <div className="stack gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Keywords / Assets</label>
                    <input
                      className="input"
                      placeholder="e.g. FTSE 100, interest rates, gilts..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                    <span className="text-[10px] text-gray-500 italic">Separate with commas (max 5)</span>
                  </div>

                  {error && <div className="alert alert-error text-sm">{error}</div>}

                  <button
                    className="btn w-full"
                    disabled={isGenerating || !keywords.trim()}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Generating Briefing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} className="mr-2" />
                        Generate Briefing
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="stack gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Past Briefings</h3>
                {briefings.map((b) => (
                  <button
                    key={b.id}
                    className="p-4 rounded-xl border border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.2)] text-left hover:border-[#c1a362]/30 transition-all"
                  >
                    <div className="text-xs font-bold text-gray-300">
                      {new Date(b.created_at).toLocaleDateString()} at {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-1 uppercase tracking-wider">
                      {b.keywords.join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {latestBriefing ? (
                <div className="stack gap-6 fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">Latest Briefing</h3>
                    <span className="text-[10px] font-bold text-[#c1a362] bg-[#c1a362]/10 px-2 py-1 rounded uppercase tracking-widest">
                      AI Generated
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {latestBriefing.briefing_json.map((item, i) => (
                      <div key={i} className="card border border-[rgba(193,163,98,0.15)] bg-[rgba(15,23,40,0.4)] overflow-hidden">
                        <div className="p-6 border-b border-[rgba(193,163,98,0.1)] bg-gradient-to-r from-[rgba(193,163,98,0.05)] to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#c1a362]"></div>
                            <h4 className="text-xl font-bold text-white uppercase tracking-wider">{item.topic}</h4>
                          </div>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="stack gap-6">
                            <div className="stack gap-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Search size={12} />
                                Latest Developments
                              </span>
                              <p className="text-sm text-gray-300 leading-relaxed">{item.developments}</p>
                            </div>
                            <div className="stack gap-2">
                              <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={12} />
                                Market Implications
                              </span>
                              <p className="text-sm text-gray-200 leading-relaxed italic">{item.implications}</p>
                            </div>
                          </div>

                          <div className="stack gap-6">
                            <div className="p-5 rounded-2xl bg-[#c1a362]/5 border border-[#c1a362]/10 stack gap-3">
                              <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} />
                                Client Communication Advice
                              </span>
                              <p className="text-sm text-gray-300 leading-relaxed">&ldquo;{item.adviserAdvice}&rdquo;</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 stack gap-3">
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle size={14} />
                                Urgent Risk Flags
                              </span>
                              <p className="text-sm text-gray-300 leading-relaxed">{item.riskFlags}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
  );
}
