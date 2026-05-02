"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ComplianceIssue = {
  issue: string;
  rule: string;
  fix: string;
};

type ComplianceResult = {
  score: number;
  issues: ComplianceIssue[];
  recommendation: "Pass" | "Fail";
};

export default function CompliancePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
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

  async function handleCheck() {
    if (!text.trim()) return;
    setIsChecking(true);
    setError("");

    try {
      const response = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to check compliance");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsChecking(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getRecommendationColor = (rec: string) => {
    return rec === "Pass" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)]">
            <div className="p-8 stack gap-6">
              <div className="stack gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="text-[#c1a362]" />
                  Compliance Checker
                </h2>
                <p className="text-gray-400">
                  Analyse advice text against FCA Consumer Duty and COBS 9 rules.
                </p>
              </div>

              <div className="stack gap-4">
                <textarea
                  className="input min-h-[250px] resize-y p-4"
                  placeholder="Paste advice text, report section, or client communication here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                {error && <div className="alert alert-error">{error}</div>}

                <button
                  className="btn w-full"
                  disabled={isChecking || !text.trim()}
                  onClick={handleCheck}
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Analysing Compliance...
                    </>
                  ) : (
                    "Check Compliance"
                  )}
                </button>
              </div>

              {result && (
                <div className="mt-8 stack gap-8 fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-[rgba(193,163,98,0.05)] border border-[rgba(193,163,98,0.2)] text-center">
                      <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Compliance Score</h3>
                      <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}/100
                      </div>
                    </div>
                    <div className={`p-6 rounded-xl border flex flex-col items-center justify-center ${getRecommendationColor(result.recommendation)}`}>
                      <h3 className="text-sm font-medium mb-2 uppercase tracking-wider">Recommendation</h3>
                      <div className="text-3xl font-bold flex items-center gap-2">
                        {result.recommendation === "Pass" ? <CheckCircle /> : <XCircle />}
                        {result.recommendation}
                      </div>
                    </div>
                  </div>

                  <div className="stack gap-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <AlertCircle className="text-[#c1a362]" />
                      Identified Issues & Fixes
                    </h3>
                    
                    {result.issues.length > 0 ? (
                      <div className="stack gap-4">
                        {result.issues.map((item, i) => (
                          <div key={i} className="p-6 rounded-xl border border-[rgba(193,163,98,0.1)] bg-[rgba(15,23,40,0.3)] stack gap-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="stack gap-1">
                                <span className="text-xs font-bold text-red-400 uppercase">Issue</span>
                                <p className="text-gray-200">{item.issue}</p>
                              </div>
                              <div className="stack gap-1 md:text-right shrink-0">
                                <span className="text-xs font-bold text-[#c1a362] uppercase">Relevant Rule</span>
                                <p className="text-sm font-mono text-[#c1a362]">{item.rule}</p>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-[rgba(193,163,98,0.1)]">
                              <span className="text-xs font-bold text-green-400 uppercase">Suggested Fix</span>
                              <p className="text-sm text-gray-300 mt-1 italic">&ldquo;{item.fix}&rdquo;</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center border border-dashed border-[rgba(193,163,98,0.2)] rounded-xl">
                        <p className="text-gray-400">No major compliance issues identified.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
  );
}
