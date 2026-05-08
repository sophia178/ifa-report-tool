"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Copy, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingProgress } from "@/components/loading-progress";

const purposes = [
  "Annual review reminder",
  "Post-meeting follow up",
  "Investment update",
  "Charges disclosure",
  "General communication",
];

const tones = ["Formal", "Friendly", "Concise"];

export default function EmailsPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [purpose, setPurpose] = useState(purposes[0]);
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState(tones[0]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
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
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  async function handleDraft() {
    if (!clientName || !keyPoints) return;
    setIsDrafting(true);
    setError("");
    setEmailContent("");

    try {
      const response = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          purpose,
          keyPoints,
          tone: tone.toLowerCase(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to draft email");
      }

      const data = await response.json();
      setEmailContent(data.result); // Use .result as per our new API pattern
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsDrafting(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {isDrafting && (
        <div style={{ marginBottom: "24px" }}>
          <LoadingProgress isLoading={isDrafting} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Client Email Drafter
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Generate professional, personalized emails for your clients in seconds.
        </p>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Client Name</label>
            <input
              type="text"
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "15px",
                width: "100%",
                color: "#1E293B"
              }}
              placeholder="e.g. John Smith"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Email Purpose</label>
            <select
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "15px",
                width: "100%",
                color: "#1E293B",
                backgroundColor: "white"
              }}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {purposes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Key Points to Include</label>
          <textarea
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "12px 16px",
              fontSize: "15px",
              width: "100%",
              minHeight: "120px",
              color: "#1E293B",
              fontFamily: "inherit"
            }}
            placeholder="e.g. mention the 5% portfolio growth, confirm the next meeting on Tuesday at 10am..."
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Tone</label>
          <div style={{ display: "flex", gap: "12px" }}>
            {tones.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: tone === t ? "2px solid #0A1628" : "1px solid #E5E7EB",
                  backgroundColor: tone === t ? "#F8FAFC" : "white",
                  color: "#0A1628"
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "#991B1B", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleDraft}
          disabled={isDrafting || !clientName || !keyPoints}
          style={{
            backgroundColor: "#C9A84C",
            color: "#0A1628",
            padding: "16px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "700",
            fontSize: "15px",
            cursor: (isDrafting || !clientName || !keyPoints) ? "not-allowed" : "pointer",
            opacity: (isDrafting || !clientName || !keyPoints) ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
        >
          {isDrafting ? (
            <>
              <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
              Drafting...
            </>
          ) : (
            <>
              <Mail size={20} />
              Draft Professional Email
            </>
          )}
        </button>

        {emailContent && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px", paddingTop: "32px", borderTop: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", margin: 0 }}>
                Generated Draft
              </h3>
              <button
                onClick={copyToClipboard}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0A1628",
                  cursor: "pointer"
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
            <div style={{ 
              padding: "24px", 
              borderRadius: "12px", 
              backgroundColor: "#F8FAFC", 
              border: "1px solid #E5E7EB", 
              whiteSpace: "pre-wrap", 
              color: "#334155", 
              lineHeight: "1.8", 
              fontFamily: "monospace", 
              fontSize: "14px" 
            }}>
              {emailContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
