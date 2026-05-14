"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

type Update = {
  title: string;
  summary: string;
  effectiveDate: string;
  actionRequired: string;
  jurisdiction: string;
  impact: "High" | "Medium" | "Low";
};

type Summary = {
  id: string;
  jurisdictions: string[];
  updates: Update[];
  created_at: string;
};

const availableJurisdictions = [
  { id: "UK", label: "United Kingdom (FCA)" },
  { id: "Australia", label: "Australia (ASIC)" },
  { id: "USA", label: "United States (SEC/FINRA)" },
];

export default function RegulatoryPage() {
  const router = useRouter();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(["UK"]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mapProfileJurisdiction = (j: string | null | undefined) => {
      if (j === "uk") return "UK";
      if (j === "aus") return "Australia";
      if (j === "usa") return "USA";
      return null;
    };

    async function fetchSummaries() {
      try {
        const response = await fetch("/api/regulatory");
        const data = await response.json();
        if (response.ok) setSummaries(data);
      } catch (err) {
        console.error("Failed to fetch summaries", err);
      }
    }

    async function checkAccess() {
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

      const isPlus = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
      const isPro = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
      
      if (!isPlus && !isPro) {
        router.push("/pricing?message=upgrade");
        return;
      }

      const preferred = mapProfileJurisdiction(profile?.jurisdiction);
      if (preferred) {
        setSelectedJurisdictions([preferred]);
      }
      
      await fetchSummaries();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function handleGenerate() {
    if (selectedJurisdictions.length === 0) return;
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/regulatory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jurisdictions: selectedJurisdictions }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate updates");
      }

      const data = await response.json();
      // Ensure we're setting the correct structure for summaries
      setSummaries([{ 
        id: Date.now().toString(), 
        created_at: new Date().toISOString(), 
        jurisdictions: selectedJurisdictions, 
        updates: data.updates 
      }]);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  const toggleJurisdiction = (id: string) => {
    setSelectedJurisdictions(prev => 
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingProgress isLoading={true} />
      </div>
    );
  }

  const latestSummary = summaries[0];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Regulatory Alerts
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Monitor global regulatory changes and impact assessments.
        </p>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", width: "100%" }}>
        {isGenerating && (
          <div style={{ marginBottom: "24px" }}>
            <LoadingProgress isLoading={isGenerating} />
          </div>
        )}

        <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "16px" }}>Jurisdictions</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px", display: "block" }}>
                Select Markets
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {availableJurisdictions.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => toggleJurisdiction(j.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: selectedJurisdictions.includes(j.id) ? "#C9A84C" : "#E5E7EB",
                      backgroundColor: selectedJurisdictions.includes(j.id) ? "#FFFBF0" : "white",
                      color: selectedJurisdictions.includes(j.id) ? "#0A1628" : "#64748B",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {j.label}
                    {selectedJurisdictions.includes(j.id) && <CheckCircle2 size={16} color="#C9A84C" />}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedJurisdictions.length === 0}
              style={{
                backgroundColor: "#0A1628",
                color: "white",
                width: "100%",
                padding: "16px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "15px",
                cursor: (isGenerating || selectedJurisdictions.length === 0) ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "24px",
                letterSpacing: "0.5px"
              }}
            >
              <RefreshCw size={20} />
              {isGenerating ? "Generating..." : "Generate Updates"}
            </button>
          </div>
        </div>

        {latestSummary && (
          <div style={{ marginTop: "40px", backgroundColor: "white", borderRadius: "16px", padding: "40px", border: "1px solid #E5E7EB", borderLeft: "3px solid #C9A84C", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#C9A84C", letterSpacing: "1.5px", textTransform: "uppercase" }}>Regulatory Updates</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {latestSummary.updates.map((update, idx) => (
                <div key={idx} style={{ padding: "24px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", margin: 0 }}>{update.title}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.05em" }}>{update.jurisdiction}</span>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: update.impact === "High" ? "#EF4444" : update.impact === "Medium" ? "#F59E0B" : "#10B981", textTransform: "uppercase", letterSpacing: "0.05em" }}>{update.impact} Impact</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", backgroundColor: "white", border: "1px solid #E5E7EB", color: "#64748B", padding: "4px 10px", borderRadius: "4px" }}>
                      Effective: {update.effectiveDate}
                    </span>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</span>
                    <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.6", margin: "4px 0 0" }}>{update.summary}</p>
                  </div>
                  <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #E5E7EB", borderLeft: "4px solid #C9A84C" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action Required</span>
                    <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: "4px 0 0" }}>{update.actionRequired}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
