"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Flag, Loader2, FileDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

const today = new Date().toISOString().slice(0, 10);

function isAllCapsHeading(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  const withoutNumbering = normalized.replace(/^\d{1,2}\.\s+/, "");
  if (!withoutNumbering) return false;
  if (!/[A-Z]/.test(withoutNumbering)) return false;
  if (/[a-z]/.test(withoutNumbering)) return false;
  if (withoutNumbering.length < 3) return false;
  if (withoutNumbering.length > 140) return false;
  return /^[A-Z0-9][A-Z0-9 \-&,()'/.:%]+$/.test(withoutNumbering);
}

function renderInline(text: string) {
  const safe = text.replace(/\r/g, "");
  const parts = safe.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    const isBold = index % 2 === 1;
    return isBold ? (
      <strong key={index} style={{ fontWeight: "800", color: "#0A1628" }}>
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    );
  });
}

function looksLikePipeTableRow(line: string) {
  const pipeCount = (line.match(/\|/g) || []).length;
  return pipeCount >= 2 && line.trim().length >= 5;
}

function splitPipeRow(line: string) {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

function renderPlanText(text: string) {
  const sanitized = text
    .replace(/\r/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "");

  const lines = sanitized.split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();

    if (!trimmed) {
      blocks.push(<div key={`spacer-${i}`} style={{ height: "12px" }} />);
      i += 1;
      continue;
    }

    if (looksLikePipeTableRow(trimmed)) {
      const start = i;
      const tableLines: string[] = [];
      while (i < lines.length && looksLikePipeTableRow((lines[i] ?? "").trim())) {
        tableLines.push((lines[i] ?? "").trim());
        i += 1;
      }

      const rows = tableLines.map(splitPipeRow).filter((r) => r.length > 0);
      const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);

      blocks.push(
        <div
          key={`table-${start}`}
          style={{
            overflowX: "auto",
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            backgroundColor: "white",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
            <tbody>
              {rows.map((row, rIndex) => (
                <tr
                  key={rIndex}
                  style={{
                    backgroundColor: rIndex === 0 ? "#F8FAFC" : rIndex % 2 === 0 ? "white" : "#F8FAFC",
                  }}
                >
                  {Array.from({ length: maxCols }).map((_, cIndex) => (
                    <td
                      key={cIndex}
                      style={{
                        borderTop: "1px solid #E5E7EB",
                        borderLeft: cIndex === 0 ? "1px solid #E5E7EB" : "none",
                        borderRight: cIndex === maxCols - 1 ? "1px solid #E5E7EB" : "1px solid #E5E7EB",
                        borderBottom: "1px solid #E5E7EB",
                        padding: "10px 12px",
                        verticalAlign: "top",
                        color: "#374151",
                        fontSize: "14px",
                        fontWeight: rIndex === 0 ? "700" : "500",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {row[cIndex] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (isAllCapsHeading(trimmed)) {
      blocks.push(
        <div
          key={`h-${i}`}
          style={{
            marginTop: blocks.length === 0 ? 0 : "24px",
            marginBottom: "10px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#0A1628",
          }}
        >
          {trimmed}
        </div>
      );
      i += 1;
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} style={{ margin: 0, color: "#374151", fontSize: "15px", lineHeight: "1.8" }}>
        {renderInline(trimmed)}
      </p>
    );
    i += 1;
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{blocks}</div>;
}

export default function USAPlanPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [k401Provider, setK401Provider] = useState("");
  const [current401kBalance, setCurrent401kBalance] = useState("");
  const [annual401kContribution, setAnnual401kContribution] = useState("");
  const [rothIraBalance, setRothIraBalance] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [planText, setPlanText] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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
        .select("subscribed, jurisdiction, stripe_price_id")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      const isPro = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
      const isPlus = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
      const isUSAStarter = profile.jurisdiction === "usa";

      if (!isPro && !isPlus && !isUSAStarter) {
        router.push("/dashboard?error=access-denied");
        return;
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  async function handleDownload() {
    if (!planText) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download-usa-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, content: planText }),
      });
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clientName}_Report.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName || !meetingNotes) return;
    setIsGenerating(true);
    setError("");
    setPlanText(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch("/api/usa-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          dateOfBirth,
          meetingDate,
          k401Provider,
          current401kBalance,
          annual401kContribution,
          rothIraBalance,
          meetingNotes,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate USA plan");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setPlanText(result);
      }

      // Save to Supabase
      if (user && result) {
        const insertNew = await supabase
          .from("usa_financial_plans")
          .insert({
            user_id: user.id,
            client_name: clientName,
            client_email: clientEmail,
            content: result,
            created_at: new Date().toISOString(),
          } as any)
          .select()
          .maybeSingle();

        const finalInsert = insertNew.error
          ? await supabase
              .from("usa_financial_plans")
              .insert({
                user_id: user.id,
                client_name: clientName,
                client_email: clientEmail,
                plan_text: result,
                created_at: new Date().toISOString(),
              } as any)
              .select()
              .maybeSingle()
          : insertNew;

        if (finalInsert.error) {
          console.error("Failed to save Plan:", finalInsert.error);
        } else if (finalInsert.data) {
          setReportId(finalInsert.data.id);
          setShowSavedToast(true);
          setTimeout(() => setShowSavedToast(false), 2500);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {showSavedToast && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 1000,
            backgroundColor: "#16a34a",
            color: "white",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "700",
            boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
          }}
        >
          Report saved
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          USA Financial Plan Generator
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Generate a complete US Financial Plan compliant with CFP Board standards.
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isGenerating && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isGenerating} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Client Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Client Name</label>
                  <input style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Client Email</label>
                  <input style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Date of Birth</label>
                  <input style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Meeting Date</label>
                  <input style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>401k Provider</label>
                  <input style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} value={k401Provider} onChange={(e) => setK401Provider(e.target.value)} placeholder="e.g. Fidelity" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Current 401k Balance</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ padding: "12px 12px", backgroundColor: "#F8FAFC", color: "#0A1628", fontWeight: "700", borderRight: "1px solid #E5E7EB" }}>$</div>
                    <input style={{ border: "none", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.parentElement && (e.currentTarget.parentElement.style.borderColor = "#C9A84C")} onBlur={(e) => e.currentTarget.parentElement && (e.currentTarget.parentElement.style.borderColor = "#E5E7EB")} type="number" inputMode="decimal" value={current401kBalance} onChange={(e) => setCurrent401kBalance(e.target.value)} placeholder="150000" />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Annual 401k Contribution</label>
                  <input style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} type="number" inputMode="decimal" value={annual401kContribution} onChange={(e) => setAnnual401kContribution(e.target.value)} placeholder="e.g. 22500" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Roth IRA Balance</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ padding: "12px 12px", backgroundColor: "#F8FAFC", color: "#0A1628", fontWeight: "700", borderRight: "1px solid #E5E7EB" }}>$</div>
                    <input style={{ border: "none", padding: "12px 16px", fontSize: "15px", outline: "none", width: "100%" }} onFocus={(e) => e.currentTarget.parentElement && (e.currentTarget.parentElement.style.borderColor = "#C9A84C")} onBlur={(e) => e.currentTarget.parentElement && (e.currentTarget.parentElement.style.borderColor = "#E5E7EB")} type="number" inputMode="decimal" value={rothIraBalance} onChange={(e) => setRothIraBalance(e.target.value)} placeholder="50000" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Case Details</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Meeting Notes</label>
                <textarea style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", minHeight: "200px", resize: "vertical", outline: "none", fontFamily: "inherit", width: "100%" }} onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"} onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"} placeholder="Paste your meeting notes here..." value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} required />
              </div>
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

            <button 
              type="submit" 
              disabled={isGenerating || !clientName || !meetingNotes}
              style={{ 
                backgroundColor: "#0A1628", 
                color: "white", 
                width: "100%",
                padding: "16px", 
                borderRadius: "10px", 
                fontWeight: "700", 
                fontSize: "15px", 
                cursor: (isGenerating || !clientName || !meetingNotes) ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "24px",
                border: "none",
                letterSpacing: "0.5px"
              }}
            >
              <Flag size={20} />
              {isGenerating ? "Generating..." : "Generate USA Financial Plan"}
            </button>
          </form>
        </div>

        {planText && (
          <div style={{ marginTop: "40px", backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase" }}>Generated Plan</h3>
              </div>
              <button 
                onClick={handleDownload}
                disabled={isDownloading || !planText}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  padding: "8px 16px", 
                  backgroundColor: "#F8FAFC", 
                  border: "1px solid #E5E7EB", 
                  borderRadius: "8px", 
                  fontSize: "13px", 
                  fontWeight: "600", 
                  color: "#0A1628", 
                  cursor: (isDownloading || !planText) ? "not-allowed" : "pointer",
                  opacity: isDownloading ? 0.7 : 1
                }}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {isDownloading ? "Downloading..." : "Download Word"}
              </button>
            </div>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px", backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "12px" }}>
              {renderPlanText(planText)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
