"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Star, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

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
  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
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

  async function handleSummarise() {
    if (!text.trim()) return;
    setIsSummarising(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to summarise");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        
        try {
          const cleanJson = resultText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
          const parsed = JSON.parse(cleanJson);
          setResult(parsed);
        } catch (e) {
          // Ignore partial parse errors
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSummarising(false);
    }
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Research Summariser
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Paste any document, article, or research report text to get an AI-powered summary.
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isSummarising && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isSummarising} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Research Content</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>Source Text</label>
              <textarea
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  width: "100%",
                  minHeight: "300px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  color: "#1E293B",
                  outline: "none",
                  backgroundColor: "white",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#C9A84C"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#E5E7EB"}
                placeholder="Paste research text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

            <button
              onClick={handleSummarise}
              disabled={isSummarising || !text.trim()}
              style={{
                backgroundColor: "#0A1628",
                color: "white",
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: (isSummarising || !text.trim()) ? "not-allowed" : "pointer",
                opacity: isSummarising ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "24px",
                letterSpacing: "0.5px"
              }}
            >
              <Search size={20} />
              {isSummarising ? "Summarising..." : "Summarise Research"}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: "40px", backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>3-Sentence Summary</h3>
              <p style={{ color: "#374151", lineHeight: "1.8", fontSize: "16px", margin: 0 }}>{result.summary}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Key Points</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {result.keyPoints.map((point: string, i: number) => (
                    <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                      <span style={{ color: "#C9A84C", fontWeight: "900" }}>•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#EF4444", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={16} /> Risks & Concerns
                  </h3>
                  <p style={{ color: "#475569", lineHeight: "1.6", fontSize: "14px", margin: 0 }}>{result.risks}</p>
                </div>

                <div>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Star size={16} /> Relevance
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ flex: 1, height: "6px", backgroundColor: "#F1F5F9", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", backgroundColor: "#C9A84C", width: `${result.relevanceRating * 10}%` }} />
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628" }}>{result.relevanceRating}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
