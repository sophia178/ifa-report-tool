"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Globe, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Update = {
  regulationName: string;
  whatChanged: string;
  effectiveDate: string;
  actionRequired: string;
};

type Summary = {
  id: string;
  jurisdictions: string[];
  updates: Update[];
  created_at: string;
};

const availableJurisdictions = [
  { id: "UK", label: "United Kingdom (FCA)" },
  { id: "Australia", label: "Australia (ASIC)" },
  { id: "USA", label: "United States (SEC/FINRA)" },
];

export default function RegulatoryPage() {
  const router = useRouter();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(["UK"]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
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

      // Check if user has at least Plus plan
      const planRes = await fetch("/api/user-plan");
      const { plan } = await planRes.json();
      
      if (plan === "starter") {
        router.push("/pricing?message=upgrade");
        return;
      }
      
      await fetchSummaries();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchSummaries() {
    try {
      const response = await fetch("/api/regulatory");
      const data = await response.json();
      if (response.ok) setSummaries(data);
    } catch (err) {
      console.error("Failed to fetch summaries", err);
    }
  }

  async function handleGenerate() {
    if (selectedJurisdictions.length === 0) return;
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/regulatory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurisdictions: selectedJurisdictions }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate updates");

      await fetchSummaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  const toggleJurisdiction = (id: string) => {
    setSelectedJurisdictions(prev => 
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  const latestSummary = summaries[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 stack gap-6">
              <div className="card shadow-xl border border-[rgba(193,163,98,0.2)] p-8">
                <div className="stack gap-6">
                  <div className="stack gap-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Bell className="text-[#c1a362]" />
                      Regulatory Alerts
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Select your jurisdictions to generate an AI-powered regulatory update.
                    </p>
                  </div>

                  <div className="stack gap-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Jurisdictions</label>
                    {availableJurisdictions.map((j) => (
                      <button
                        key={j.id}
                        onClick={() => toggleJurisdiction(j.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          selectedJurisdictions.includes(j.id)
                            ? "bg-[#c1a362]/10 border-[#c1a362] text-[#c1a362]"
                            : "border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.3)] text-gray-500 hover:border-[#c1a362]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Globe size={18} />
                          <span className="font-medium">{j.label}</span>
                        </div>
                        {selectedJurisdictions.includes(j.id) && <CheckCircle2 size={18} />}
                      </button>
                    ))}
                  </div>

                  {error && <div className="alert alert-error text-sm">{error}</div>}

                  <button
                    className="btn w-full"
                    disabled={isGenerating || selectedJurisdictions.length === 0}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Checking Updates...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} className="mr-2" />
                        Check for Updates
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="stack gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">History</h3>
                {summaries.map((s) => (
                  <button
                    key={s.id}
                    className="p-4 rounded-xl border border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.2)] text-left hover:border-[#c1a362]/30 transition-all"
                  >
                    <div className="text-xs font-bold text-gray-300">
                      {new Date(s.created_at).toLocaleDateString()} at {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                      {s.jurisdictions.join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {latestSummary ? (
                <div className="stack gap-6 fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">Recent Updates</h3>
                    <span className="text-xs text-gray-500 italic">Last generated {new Date(latestSummary.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="stack gap-6">
                    {latestSummary.updates.map((update, i) => (
                      <div key={i} className="card border border-[rgba(193,163,98,0.15)] bg-[rgba(15,23,40,0.4)] overflow-hidden">
                        <div className="p-6 border-b border-[rgba(193,163,98,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="stack gap-1">
                            <span className="text-[10px] font-bold text-[#c1a362] uppercase tracking-widest">Regulation</span>
                            <h4 className="text-lg font-bold text-gray-100">{update.regulationName}</h4>
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-2 shrink-0">
                            <AlertTriangle size={14} />
                            Takes effect: {update.effectiveDate}
                          </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="stack gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">What Changed</span>
                            <p className="text-sm text-gray-300 leading-relaxed">{update.whatChanged}</p>
                          </div>
                          <div className="stack gap-2">
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Action Required</span>
                            <p className="text-sm text-gray-200 leading-relaxed font-medium">{update.actionRequired}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card border border-dashed border-[rgba(193,163,98,0.2)] bg-transparent p-20 text-center stack gap-4 items-center justify-center h-full">
                  <div className="p-4 rounded-full bg-[rgba(193,163,98,0.05)] text-[#c1a362]">
                    <Bell size={48} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300">No Updates Generated</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Select your jurisdictions on the left and click Check for Updates.</p>
                </div>
              )}
            </div>
          </div>
  );
}
