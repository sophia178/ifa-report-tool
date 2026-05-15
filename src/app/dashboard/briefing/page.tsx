"use client";

import { useState, useEffect } from "react";
import { Coffee, Download, AlertCircle, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingProgress } from "@/components/loading-progress";

type Jurisdiction = "uk" | "aus" | "usa";

function stripEmbeddedCalendarPayload(text: string) {
  return text
    .replace(/economic_?calendar::[\s\S]*?(?:\n\s*\n|$)/gi, "")
    .replace(/economiccalendar::[\s\S]*?(?:\n\s*\n|$)/gi, "");
}

function stripJsonBlocks(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  const kept: string[] = [];
  let skippingJson = false;

  for (const line of lines) {
    const t = line.trim();
    const looksLikeJsonStart = t.startsWith("{") || t.startsWith("[");
    const looksLikeJsonEnd = t.endsWith("}") || t.endsWith("]");

    if (!skippingJson && looksLikeJsonStart && (t.includes(":") || t.includes("\""))) {
      skippingJson = true;
    }

    if (!skippingJson) {
      kept.push(line);
    }

    if (skippingJson && looksLikeJsonEnd) {
      skippingJson = false;
    }
  }

  return kept.join("\n");
}

function cleanBriefingForDisplay(text: string) {
  let t = text;

  const trimmed = t.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: any = JSON.parse(trimmed);
      if (typeof parsed === "string") t = parsed;
      else if (typeof parsed?.result === "string") t = parsed.result;
      else if (typeof parsed?.briefing_text === "string") t = parsed.briefing_text;
    } catch {
    }
  }

  t = stripEmbeddedCalendarPayload(t);
  t = stripJsonBlocks(t);
  return t.trim();
}

export default function BriefingPage() {
  const router = useRouter();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("uk");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
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
          .select("subscribed, stripe_price_id, jurisdiction")
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

        const rawJurisdiction =
          typeof profile?.jurisdiction === "string" ? profile.jurisdiction.trim().toLowerCase() : "uk";
        const effectiveJurisdiction: Jurisdiction =
          rawJurisdiction === "uk" || rawJurisdiction === "aus" || rawJurisdiction === "usa" ? rawJurisdiction : "uk";

        setJurisdiction(effectiveJurisdiction);

        const res = await fetch(`/api/briefing?jurisdiction=${encodeURIComponent(effectiveJurisdiction)}`);
        const json = await res.json();
        if (res.ok) {
          setBriefing(typeof json.result === "string" ? cleanBriefingForDisplay(json.result) : null);
          setLastUpdated(typeof json.lastUpdated === "string" ? json.lastUpdated : null);
        }
      } catch (err) {
        console.error("Briefing page init error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkAccessAndFetch();
  }, [router]);

  function getTitle() {
    switch (jurisdiction) {
      case "uk": return "The Daily Briefing — UK Markets";
      case "aus": return "The Daily Briefing — Australian Markets";
      case "usa": return "The Daily Briefing — US Markets";
    }
  }

  async function generateFor(selected: Jurisdiction) {
    setIsGenerating(true);
    setError("");
    setBriefing(null);
    setLastUpdated(null);

    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurisdiction: selected }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any)?.error || "Failed to generate briefing");
      }

      const data = await response.json();
      setBriefing(typeof data.result === "string" ? cleanBriefingForDisplay(data.result) : null);
      setLastUpdated(typeof data.lastUpdated === "string" ? data.lastUpdated : new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerate() {
    await generateFor(jurisdiction);
  }

  function renderFormattedContent(text: string) {
    const cleanedBriefingText = cleanBriefingForDisplay(text);
    // 1. Remove all emojis
    let cleanText = cleanedBriefingText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '');
    
    // 2. Remove asterisks and other markdown symbols
    cleanText = cleanText.replace(/[*_~`]/g, '');

    // 3. Handle # (h1) as well by treating it like ## for consistency in rendering
    cleanText = cleanText.replace(/^\s*#\s+/gm, "## ");

    // 4. Split by sections (handling both ## and ###)
    const sections = cleanText.split(/^(?:##|###)\s+/m).filter(s => s.trim().length > 0);
    
    return (
      <div id="briefing-print-content" style={{ fontFamily: '"Georgia", "Times New Roman", serif', lineHeight: "1.8", color: "#1A202C" }}>
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
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", minHeight: "100vh", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <div className="no-print" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {(
            [
              { key: "uk" as const, label: "🇬🇧 UK" },
              { key: "aus" as const, label: "🇦🇺 Australia" },
              { key: "usa" as const, label: "🇺🇸 USA" },
            ] satisfies Array<{ key: Jurisdiction; label: string }>
          ).map((opt) => {
            const selected = jurisdiction === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={async () => {
                  if (jurisdiction === opt.key) return;
                  setJurisdiction(opt.key);
                  await generateFor(opt.key);
                }}
                style={{
                  backgroundColor: selected ? "#C9A84C" : "#0A1628",
                  color: selected ? "#0A1628" : "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          {getTitle()}
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Market intelligence and strategic advice for professional financial advisers.
        </p>
        {lastUpdated && (
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "13px", fontWeight: "600" }}>
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isGenerating && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isGenerating} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase" }}>Actions</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "13px", fontWeight: "600" }}>
              <Calendar size={14} />
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="briefing-actions" style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="no-print"
              style={{
                flex: 1,
                padding: "16px",
                backgroundColor: "#0A1628",
                color: "white",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: isGenerating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                opacity: isGenerating ? 0.7 : 1,
                letterSpacing: "0.5px"
              }}
            >
              <Coffee size={20} />
              {isGenerating ? "Generating..." : "Generate New Briefing"}
            </button>
            
            {briefing && (
              <button 
                onClick={() => window.print()}
                className="no-print"
                style={{ padding: "16px 24px", backgroundColor: "#F8FAFC", color: "#0A1628", borderRadius: "10px", border: "1px solid #E5E7EB", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              >
                <Download size={20} /> Download PDF
              </button>
            )}
          </div>

          {error && (
            <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#DC2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {briefing ? (
          <div style={{ 
            marginTop: "40px",
            backgroundColor: "white", 
            padding: "40px", 
            borderRadius: "16px", 
            border: "1px solid #E5E7EB", 
            borderLeft: "3px solid #C9A84C",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            position: "relative"
          }}>
            {renderFormattedContent(briefing)}
            
            <div style={{ marginTop: "60px", paddingTop: "32px", borderTop: "1px solid #F1F5F9", textAlign: "center", color: "#94A3B8", fontSize: "12px", fontStyle: "italic" }}>
              This briefing is intended for professional financial advisers only. All market data is delayed by at least 15 minutes.
            </div>
          </div>
        ) : (
          !isGenerating && (
            <div style={{ marginTop: "40px", padding: "100px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px dashed #E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <Coffee size={48} color="#CBD5E1" />
              <p style={{ color: "#64748B", margin: 0, fontSize: "15px" }}>Generate your daily intelligence briefing to see market analysis.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
