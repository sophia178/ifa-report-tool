"use client";

import { useState, useEffect } from "react";
import { Flag, Loader2, FileDown, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

const today = new Date().toISOString().slice(0, 10);

function renderInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (!part) return null;
    const isBold = index % 2 === 1;
    if (isBold) {
      return (
        <strong key={index} style={{ fontWeight: "800", color: "#0A1628" }}>
          {part}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function renderPlanText(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");

  return lines.map((rawLine, index) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} style={{ height: "12px" }} />;
    }

    if (/^---+$/.test(trimmed)) {
      return (
        <hr
          key={index}
          style={{
            border: "none",
            borderTop: "1px solid #E5E7EB",
            margin: "18px 0",
          }}
        />
      );
    }

    const headingMatch = trimmed.match(/^(#{2,6})\s+(.*)$/);
    if (headingMatch) {
      const headingText = headingMatch[2].trim();
      return (
        <div
          key={index}
          style={{
            marginTop: "18px",
            marginBottom: "8px",
            fontSize: "16px",
            fontWeight: "900",
            color: "#0A1628",
            letterSpacing: "0.2px",
          }}
        >
          {headingText.replace(/\*\*(.*?)\*\*/g, "$1")}
        </div>
      );
    }

    return (
      <p
        key={index}
        style={{
          margin: 0,
          color: "#374151",
          fontSize: "15px",
          lineHeight: "1.8",
        }}
      >
        {renderInline(trimmed)}
      </p>
    );
  });
}

export default function USAPlanPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [planText, setPlanText] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBtn, setHoveredBtn] = useState(false);

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
    if (!reportId) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download-report?id=${reportId}&type=usa`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Financial_Plan_${clientName.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
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
        const { data: savedReport, error: saveError } = await supabase
          .from("usa_financial_plans")
          .insert({
            user_id: user.id,
            client_name: clientName,
            client_email: clientEmail,
            plan_text: result,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (saveError) {
          console.error("Failed to save Plan:", saveError);
        } else if (savedReport) {
          setReportId(savedReport.id);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
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
                {isSaved && <span style={{ fontSize: "12px", color: "#10B981", fontWeight: "600" }}>✓ Saved to history</span>}
              </div>
              <button 
                onClick={handleDownload}
                disabled={isDownloading || !reportId}
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
                  cursor: (isDownloading || !reportId) ? "not-allowed" : "pointer",
                  opacity: isDownloading ? 0.7 : 1
                }}
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {isDownloading ? "Downloading..." : "Download Word"}
              </button>
            </div>
            <div style={{ padding: "24px", backgroundColor: "#F8FAFC", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {renderPlanText(planText)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
