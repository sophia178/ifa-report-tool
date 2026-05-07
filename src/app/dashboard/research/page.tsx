"use client";

import { useState, useEffect } from "react";
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
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSummarising(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Research Summariser
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Paste any document, article, or research report text to get an AI-powered summary.
        </p>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "24px" }}>
        <textarea
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "15px",
            width: "100%",
            minHeight: "300px",
            resize: "vertical",
            fontFamily: "inherit",
            color: "#1E293B",
            backgroundColor: "#F8FAFC"
          }}
          placeholder="Paste research text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {error && (
          <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "#991B1B", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <button
          disabled={isSummarising || !text.trim()}
          onClick={handleSummarise}
          style={{
            backgroundColor: "#0A1628",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            border: "none",
            cursor: (isSummarising || !text.trim()) ? "not-allowed" : "pointer",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            opacity: (isSummarising || !text.trim()) ? 0.7 : 1
          }}
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

        {result && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "32px", paddingTop: "32px", borderTop: "1px solid #E5E7EB" }}>
            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", marginBottom: "16px", display: "block" }}>
                3-Sentence Summary
              </h3>
              <p style={{ color: "#334155", lineHeight: "1.8", fontSize: "15px", margin: 0 }}>{result.summary}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", margin: 0 }}>
                  Key Points
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {result.keyPoints.map((point: string, i: number) => (
                    <li key={i} style={{ display: "flex", gap: "12px", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
                      <span style={{ color: "#0A1628", fontWeight: "900" }}>•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ 
                    fontSize: "12px", 
                    fontWeight: "800", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.1em", 
                    color: "#991B1B", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    margin: 0 
                  }}>
                    <AlertTriangle size={16} />
                    Risks & Concerns
                  </h3>
                  <p style={{ color: "#475569", lineHeight: "1.6", fontSize: "14px", margin: 0 }}>{result.risks}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ 
                    fontSize: "12px", 
                    fontWeight: "800", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.1em", 
                    color: "#64748B", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    margin: 0 
                  }}>
                    <Star size={16} color="#0A1628" />
                    Relevance Rating
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ flex: 1, height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                      <div 
                        style={{ height: "100%", backgroundColor: "#0A1628", width: `${result.relevanceRating * 10}%` }}
                      />
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628" }}>
                      {result.relevanceRating}/10
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0 }}>Relevance for UK financial advisers</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
