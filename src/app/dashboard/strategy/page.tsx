"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, Target, AlertCircle, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Strategy = {
  strategyName: string;
  entryRules: string;
  exitRules: string;
  risks: string;
  positionSizing: string;
  invalidationConditions: string;
  viabilityRating: number;
  reasoning: string;
};

type SavedStrategy = {
  id: string;
  idea: string;
  strategy_json: Strategy;
  created_at: string;
};

export default function StrategyPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
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
      
      await fetchStrategies();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchStrategies() {
    try {
      const response = await fetch("/api/strategy");
      const data = await response.json();
      if (response.ok) setSavedStrategies(data);
    } catch (err) {
      console.error("Failed to fetch strategies", err);
    }
  }

  async function handleBuild() {
    if (!idea.trim()) return;
    setIsBuilding(true);
    setError("");
    setCurrentStrategy(null);

    try {
      const response = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to build strategy");

      setCurrentStrategy(data.strategy_json);
      await fetchStrategies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsBuilding(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 stack gap-6">
              <div className="card shadow-xl border border-[rgba(193,163,98,0.2)] p-8">
                <div className="stack gap-6">
                  <div className="stack gap-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Zap className="text-[#c1a362]" />
                      Strategy Builder
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Describe your trading idea in plain English and let Claude structure it.
                    </p>
                  </div>

                  <div className="stack gap-2">
                    <textarea
                      className="textarea min-h-[150px]"
                      placeholder="e.g. buy gold when inflation expectations rise above 3% and the dollar is weakening..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                    />
                  </div>

                  {error && <div className="alert alert-error text-sm">{error}</div>}

                  <button
                    className="btn w-full"
                    disabled={isBuilding || !idea.trim()}
                    onClick={handleBuild}
                    style={{
                      backgroundColor: "#C9A84C",
                      color: "#0A1628",
                      fontWeight: "700"
                    }}
                  >
                    {isBuilding ? (
                      <>
                        <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%", marginRight: "8px" }} />
                        Building Strategy...
                      </>
                    ) : (
                      "Build Strategy"
                    )}
                  </button>
                </div>
              </div>

              <div className="stack gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Saved Strategies</h3>
                {savedStrategies.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStrategy(s.strategy_json)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      currentStrategy?.strategyName === s.strategy_json.strategyName
                        ? "bg-[#c1a362]/10 border-[#c1a362] shadow-lg"
                        : "border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.2)] hover:border-[#c1a362]/30"
                    }`}
                  >
                    <div className="font-bold text-gray-200 line-clamp-1">{s.strategy_json.strategyName}</div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {currentStrategy ? (
                <div className="stack gap-6 fade-in">
                  <div className="card border border-[#c1a362]/30 bg-[#0a1628] overflow-hidden">
                    <div className="p-8 border-b border-[rgba(193,163,98,0.1)] bg-gradient-to-r from-[rgba(193,163,98,0.05)] to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="stack gap-2">
                        <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest">Formal Strategy</span>
                        <h3 className="text-3xl font-bold text-white">{currentStrategy.strategyName}</h3>
                      </div>
                      <div className="flex flex-col items-center p-4 rounded-2xl bg-[#c1a362]/10 border border-[#c1a362]/20 min-w-[120px]">
                        <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest mb-1">Viability</span>
                        <div className="text-3xl font-bold text-[#c1a362]">{currentStrategy.viabilityRating}/10</div>
                      </div>
                    </div>
                    
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="stack gap-8">
                        <div className="stack gap-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Target size={14} className="text-[#c1a362]" />
                            Execution Rules
                          </h4>
                          <div className="stack gap-4">
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                              <span className="text-[10px] font-bold text-green-500 uppercase block mb-1">Entry</span>
                              <p className="text-sm text-gray-300 leading-relaxed">{currentStrategy.entryRules}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                              <span className="text-[10px] font-bold text-red-500 uppercase block mb-1">Exit</span>
                              <p className="text-sm text-gray-300 leading-relaxed">{currentStrategy.exitRules}</p>
                            </div>
                          </div>
                        </div>

                        <div className="stack gap-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Star size={14} className="text-[#c1a362]" />
                            Position Sizing
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed italic">&ldquo;{currentStrategy.positionSizing}&rdquo;</p>
                        </div>
                      </div>

                      <div className="stack gap-8">
                        <div className="stack gap-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-400" />
                            Risk Analysis
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">{currentStrategy.risks}</p>
                        </div>

                        <div className="stack gap-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} className="text-amber-500" />
                            Invalidation Conditions
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">{currentStrategy.invalidationConditions}</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-[rgba(193,163,98,0.05)] border border-[rgba(193,163,98,0.1)]">
                          <h4 className="text-xs font-bold text-[#c1a362] uppercase tracking-widest flex items-center gap-2 mb-3">
                            <TrendingUp size={14} />
                            Professional Reasoning
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed italic">{currentStrategy.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
  );
}
