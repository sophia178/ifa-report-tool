"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { Search, Loader2, Star, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SummaryResult = {
  summary: string;
  keyPoints: string[];
  risks: string;
  relevanceRating: number;
};

export default function ResearchPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isSummarising, setIsSummarising] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
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
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  async function handleSummarise() {
    if (!text.trim()) return;
    setIsSummarising(true);
    setError("");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to summarise");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSummarising(false);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <TopNav email={userEmail} />
        <DashboardNav />

        <div className="dashboard-content" style={{ width: "min(800px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)]">
            <div className="p-8 stack gap-6">
              <div className="stack gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Search className="text-[#c1a362]" />
                  Research Summariser
                </h2>
                <p className="text-gray-400">
                  Paste any document, article, or research report text to get an AI-powered summary.
                </p>
              </div>

              <div className="stack gap-4">
                <textarea
                  className="input min-h-[300px] resize-y p-4"
                  placeholder="Paste research text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                {error && <div className="alert alert-error">{error}</div>}

                <button
                  className="btn w-full"
                  disabled={isSummarising || !text.trim()}
                  onClick={handleSummarise}
                >
                  {isSummarising ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Summarising...
                    </>
                  ) : (
                    "Summarise Research"
                  )}
                </button>
              </div>

              {result && (
                <div className="mt-8 stack gap-8 fade-in">
                  <div className="p-6 rounded-xl bg-[rgba(193,163,98,0.05)] border border-[rgba(193,163,98,0.2)]">
                    <h3 className="text-lg font-semibold mb-3">3-Sentence Summary</h3>
                    <p className="text-gray-300 leading-relaxed">{result.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="stack gap-4">
                      <h3 className="text-lg font-semibold">Key Points</h3>
                      <ul className="stack gap-3">
                        {result.keyPoints.map((point: string, i: number) => (
                          <li key={i} className="flex gap-3 text-gray-300">
                            <span className="text-[#c1a362] font-bold">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="stack gap-6">
                      <div className="stack gap-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-400">
                          <AlertTriangle size={18} />
                          Risks & Concerns
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{result.risks}</p>
                      </div>

                      <div className="stack gap-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Star className="text-[#c1a362]" size={18} />
                          Relevance Rating
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#c1a362]" 
                              style={{ width: `${result.relevanceRating * 10}%` }}
                            />
                          </div>
                          <span className="text-xl font-bold text-[#c1a362]">
                            {result.relevanceRating}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">Relevance for UK financial advisers</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
