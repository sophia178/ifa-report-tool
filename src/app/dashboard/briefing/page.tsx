"use client";

import { useState, useEffect } from "react";
import { Coffee, Loader2, Download, AlertCircle, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingProgress } from "@/components/loading-progress";

export default function BriefingPage() {
  const router = useRouter();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestBriefing() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("market_briefings")
          .select("briefing_text")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) setBriefing(data.briefing_text);
      } catch (err) {
        console.error("Failed to fetch briefing", err);
      }
    }

    async function checkAccessAndFetch() {
      try {
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

        const planRes = await fetch("/api/user-plan");
        const planData = await planRes.json();
        const plan = planData.plan || "starter";
        
        if (plan !== "pro") {
          router.push("/pricing?message=upgrade-pro");
          return;
        }
        
        await fetchLatestBriefing();
      } catch (err) {
        console.error("Briefing page init error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkAccessAndFetch();
  }, [router]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setBriefing(null);

    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate briefing");
      }

      const data = await response.json();
      setBriefing(data.result); // Use .result as per our new API pattern
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function renderFormattedContent(text: string) {
    // 1. Remove all emojis
    let cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '');
    
    // 2. Remove asterisks and other markdown symbols
    cleanText = cleanText.replace(/[*_~`]/g, '');

    // 3. Split by sections (handling both ## and ###)
    const sections = cleanText.split(/^(?:##|###)\s+/m).filter(s => s.trim().length > 0);
    
    return (
      <div style={{ fontFamily: '"Georgia", "Times New Roman", serif', lineHeight: "1.8", color: "#1A202C" }}>
        {sections.map((section, idx) => {
          const lines = section.split('\n');
          const title = lines[0].trim();
          const content = lines.slice(1).join('\n').trim();

          // 4. Handle tables within content
          const parts = content.split(/(\|[^\n]+\|\n(?:\|[:\-\s|]+\|\n)?(?:\|[^\n]+\|\n)*)/);

          return (
            <div key={idx} style={{ marginBottom: "48px" }}>
              {title && (
                <h2 style={{ 
                  fontSize: "26px", 
                  fontWeight: "700", 
                  color: "#0A1628", 
                  marginBottom: "24px",
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  borderBottom: "2px solid #F1F5F9",
                  paddingBottom: "12px",
                  letterSpacing: "-0.01em"
                }}>
                  {title}
                </h2>
              )}
              
              {parts.map((part, pIdx) => {
                if (part.startsWith('|')) {
                  // Render Table
                  const rows = part.trim().split('\n').filter(r => !r.match(/^[|:\-\s]+$/));
                  if (rows.length < 2) return null;

                  const headers = rows[0].split('|').filter(c => c.trim().length > 0);
                  const body = rows.slice(1).map(r => r.split('|').filter(c => c.trim().length > 0));

                  return (
                    <div key={pIdx} style={{ overflowX: "auto", marginBottom: "32px", marginTop: "12px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #0A1628" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#0A1628" }}>
                            {headers.map((h, hIdx) => (
                              <th key={hIdx} style={{ padding: "14px 16px", border: "1px solid #0A1628", textAlign: "left", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "white", letterSpacing: "0.05em" }}>{h.trim()}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {body.map((row, rIdx) => (
                            <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? "white" : "#F8FAFC" }}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} style={{ padding: "14px 16px", border: "1px solid #E2E8F0", fontSize: "14px", color: "#1A202C", fontWeight: "500" }}>{cell.trim()}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                // Render Paragraphs
                return part.split('\n\n').map((p, bIdx) => {
                  if (!p.trim()) return null;
                  return (
                    <p key={`${pIdx}-${bIdx}`} style={{ marginBottom: "20px", fontSize: "17px", color: "#374151" }}>
                      {p.trim()}
                    </p>
                  );
                });
              })}
              <div style={{ height: "1px", backgroundColor: "#F1F5F9", width: "100%", marginTop: "32px" }} />
            </div>
          );
        })}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 48px", minHeight: "100vh", backgroundColor: "white" }}>
      {isGenerating && (
        <div style={{ marginBottom: "24px" }}>
          <LoadingProgress isLoading={isGenerating} />
        </div>
      )}
      
      <div style={{ borderBottom: "4px solid #0A1628", paddingBottom: "40px", marginBottom: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#C9A84C", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "13px", marginBottom: "16px" }}>
            <Coffee size={18} />
            Market Intelligence
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: "900", color: "#0A1628", margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            The Daily Briefing
          </h1>
        </div>
        <div style={{ textAlign: "right", color: "#64748B", fontSize: "15px", fontWeight: "500" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginBottom: "4px" }}>
            <Calendar size={16} />
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          Ref: BRIEF-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: "12px 24px",
              backgroundColor: "#0A1628",
              color: "white",
              borderRadius: "8px",
              border: "none",
              fontWeight: "700",
              fontSize: "14px",
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Coffee size={18} />}
            {isGenerating ? "Generating Briefing..." : "Generate New Briefing"}
          </button>
          
          {briefing && (
            <button style={{ padding: "12px 24px", backgroundColor: "#F4F6F9", color: "#0A1628", borderRadius: "8px", border: "1px solid #E2E8F0", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={18} /> Download PDF
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: "20px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#DC2626", fontSize: "15px", display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {briefing ? (
          <div style={{ 
            backgroundColor: "#FFFFFF", 
            padding: "60px", 
            borderRadius: "4px", 
            border: "1px solid #E2E8F0", 
            boxShadow: "0 10px 25px rgba(0,0,0,0.02)",
            position: "relative"
          }}>
            {renderFormattedContent(briefing)}
            
            <div style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid #F1F5F9", textAlign: "center", color: "#94A3B8", fontSize: "13px", fontStyle: "italic" }}>
              This briefing is intended for professional financial advisers only. All market data is delayed by at least 15 minutes.
            </div>
          </div>
        ) : (
          !isGenerating && (
            <div style={{ padding: "120px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "2px dashed #E2E8F0" }}>
              <Coffee size={64} color="#CBD5E1" style={{ marginBottom: "24px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628", marginBottom: "12px" }}>No Briefing Active</h3>
              <p style={{ color: "#64748B", maxWidth: "400px", margin: "0 auto" }}>Generate your daily intelligence briefing to see market analysis and strategic advice.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
