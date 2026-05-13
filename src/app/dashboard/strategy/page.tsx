"use client";

import { useState, useEffect } from "react";
import { Zap, Target, AlertCircle, ShieldCheck, TrendingUp, Star, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

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
  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
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
      
      await fetchStrategies();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchStrategies() {
    try {
      const response = await fetch("/api/strategy");
      if (!response.ok) throw new Error("Failed to fetch strategies");
      const data = await response.json();
      setSavedStrategies(data);
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

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to build strategy");
      }

      const data = await response.json();
      setCurrentStrategy(data.result);
      await fetchStrategies();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsBuilding(false);
    }
  }

  const cleanText = (text: string) => {
    return text.replace(/[⊙☆★☐☑☒✓✔✕✖✗✘•●○]/g, "").trim();
  };

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
          AI Strategy Builder
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Turn your trading ideas into structured institutional-grade strategies.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {isBuilding && (
            <div style={{ marginBottom: "24px" }}>
              <LoadingProgress isLoading={isBuilding} messages={["Connecting to AI...", "Analysing idea...", "Building strategy framework...", "Finalising..."]} />
            </div>
          )}

          {/* Input Card */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Strategy Idea</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                  Your Concept
                </label>
                <textarea
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", minHeight: "150px", outline: "none", resize: "none", fontFamily: "inherit" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                  placeholder="e.g. buy gold when inflation expectations rise above 3% and the dollar is weakening..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </div>

              {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

              <button
                onClick={handleBuild}
                disabled={isBuilding || !idea.trim()}
                style={{
                  backgroundColor: "#0A1628",
                  color: "white",
                  width: "100%",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "15px",
                  cursor: (isBuilding || !idea.trim()) ? "not-allowed" : "pointer",
                  opacity: isBuilding ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "24px",
                  letterSpacing: "0.5px"
                }}
              >
                <Zap size={20} />
                {isBuilding ? "Building..." : "Build Strategy"}
              </button>
            </div>
          </div>

          {/* History List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: "8px" }}>Saved Strategies</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {savedStrategies.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStrategy(s.strategy_json)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: currentStrategy?.strategyName === s.strategy_json.strategyName ? "#C9A84C" : "#E5E7EB",
                    backgroundColor: currentStrategy?.strategyName === s.strategy_json.strategyName ? "#FFFBF0" : "white",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontWeight: "700", color: "#0A1628", fontSize: "14px" }}>{s.strategy_json.strategyName}</div>
                  <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>{new Date(s.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {currentStrategy ? (
            <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0A1628", margin: "0 0 4px" }}>{currentStrategy.strategyName}</h2>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#C9A84C", textTransform: "uppercase", letterSpacing: "1px" }}>AI Generated Strategy</div>
                </div>
                <div style={{ textAlign: "right", minWidth: "120px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Viability Score</div>
                  <div style={{ height: "6px", width: "100%", backgroundColor: "#F1F5F9", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ height: "100%", width: `${currentStrategy.viabilityRating * 10}%`, backgroundColor: currentStrategy.viabilityRating >= 7 ? "#10B981" : currentStrategy.viabilityRating >= 4 ? "#F59E0B" : "#EF4444", transition: "width 1s ease-out" }} />
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: "#0A1628" }}>{currentStrategy.viabilityRating}/10</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {currentStrategy.entryRules && (
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Target size={16} color="#C9A84C" /> Entry Rules
                    </h4>
                    <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: 0 }}>{cleanText(currentStrategy.entryRules)}</p>
                  </div>
                )}

                {currentStrategy.exitRules && (
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <TrendingUp size={16} color="#10B981" /> Exit Rules
                    </h4>
                    <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.7", margin: 0 }}>{cleanText(currentStrategy.exitRules)}</p>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  {currentStrategy.risks && (
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={16} color="#EF4444" /> Risks
                      </h4>
                      <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>{cleanText(currentStrategy.risks)}</p>
                    </div>
                  )}
                  {currentStrategy.positionSizing && (
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Star size={16} color="#C9A84C" /> Position Sizing
                      </h4>
                      <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>{cleanText(currentStrategy.positionSizing)}</p>
                    </div>
                  )}
                </div>

                {currentStrategy.invalidationConditions && (
                  <div style={{ padding: "24px", backgroundColor: "#FFFBEB", borderRadius: "12px", border: "1px solid #FEF3C7" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#92400E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <ShieldCheck size={16} /> Invalidation
                    </h4>
                    <p style={{ fontSize: "14px", color: "#92400E", lineHeight: "1.6", margin: 0 }}>{cleanText(currentStrategy.invalidationConditions)}</p>
                  </div>
                )}

                {currentStrategy.reasoning && (
                  <div style={{ marginTop: "8px", paddingTop: "32px", borderTop: "1px solid #E5E7EB" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>AI Reasoning</h4>
                    <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.6", margin: 0, fontStyle: "italic" }}>{cleanText(currentStrategy.reasoning)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: "100px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px dashed #E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "20px", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <Zap size={32} color="#CBD5E1" />
              </div>
              <div>
                <p style={{ fontWeight: "700", color: "#0A1628", margin: "0 0 4px" }}>Ready to Build</p>
                <p style={{ fontSize: "14px", color: "#94A3B8", maxWidth: "280px", margin: 0 }}>Enter your strategy idea on the left to generate a formal trading plan.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
