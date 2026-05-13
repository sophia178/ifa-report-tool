"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Copy, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
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
  const [hoveredBtn, setHoveredBtn] = useState(false);
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
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setEmailContent(result);
      }
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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Client Email Drafter
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Generate professional, personalized emails for your clients in seconds.
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isDrafting && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isDrafting} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Email Details</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Client Name</label>
                <input
                  type="text"
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", outline: "none", transition: "border-color 0.2s" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                  placeholder="e.g. John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Purpose</label>
                <select
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", outline: "none", backgroundColor: "white" }}
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
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Key Points</label>
              <textarea
                style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "12px 16px", fontSize: "15px", width: "100%", minHeight: "120px", outline: "none", resize: "none", transition: "border-color 0.2s", fontFamily: "inherit" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                placeholder="e.g. mention the 5% portfolio growth, confirm the next meeting on Tuesday at 10am..."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Tone</label>
              <div style={{ display: "flex", gap: "12px" }}>
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: "1px solid",
                      borderColor: tone === t ? "#0A1628" : "#E5E7EB",
                      backgroundColor: tone === t ? "#F8FAFC" : "white",
                      color: "#0A1628"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

            <button
              onClick={handleDraft}
              disabled={isDrafting || !clientName || !keyPoints}
              style={{
                backgroundColor: "#0A1628",
                color: "white",
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: (isDrafting || !clientName || !keyPoints) ? "not-allowed" : "pointer",
                opacity: isDrafting ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "24px",
                letterSpacing: "0.5px"
              }}
            >
              <Mail size={20} />
              {isDrafting ? "Drafting..." : "Draft Professional Email"}
            </button>
          </div>
        </div>

        {emailContent && (
          <div style={{ marginTop: "40px", backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase" }}>Generated Draft</h3>
              <button
                onClick={copyToClipboard}
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
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"}
              >
                {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Email"}
              </button>
            </div>
            <div style={{ 
              padding: "24px", 
              borderRadius: "12px", 
              backgroundColor: "#F8FAFC", 
              border: "1px solid #E5E7EB", 
              whiteSpace: "pre-wrap", 
              color: "#374151", 
              lineHeight: "1.8", 
              fontSize: "15px" 
            }}>
              {emailContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
