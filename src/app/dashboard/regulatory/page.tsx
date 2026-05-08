"use client";

import { useState, useEffect } from "react";
import { Bell, Loader2, Globe, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Update = {
  regulationName: string;
  whatChanged: string;
  effectiveDate: string;
  actionRequired: string;
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
    async function checkAccess() {
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

      const isPlus = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
      const isPro = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
      
      if (!isPlus && !isPro) {
        router.push("/pricing?message=upgrade");
        return;
      }
      
      await fetchSummaries();
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchSummaries() {
    try {
      const response = await fetch("/api/regulatory");
      const data = await response.json();
      if (response.ok) setSummaries(data);
    } catch (err) {
      console.error("Failed to fetch summaries", err);
    }
  }

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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate updates");

      await fetchSummaries();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
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
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  const latestSummary = summaries[0];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Regulatory Alerts
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "16px" }}>
          Monitor global regulatory changes and impact assessments.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", alignItems: "start" }}>
        {/* Selection Card */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe size={18} color="#C9A84C" />
            Jurisdictions
          </h2>
          
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

          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedJurisdictions.length === 0}
            style={{
              backgroundColor: "#C9A84C",
              color: "#0A1628",
              padding: "16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "700",
              fontSize: "14px",
              cursor: (isGenerating || selectedJurisdictions.length === 0) ? "not-allowed" : "pointer",
              opacity: (isGenerating || selectedJurisdictions.length === 0) ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease"
            }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Generate Updates
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {error && (
            <div style={{ padding: "16px", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", color: "#DC2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {latestSummary ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {latestSummary.updates.map((update, idx) => (
                <div key={idx} style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628", margin: 0 }}>{update.regulationName}</h3>
                    <span style={{ fontSize: "12px", fontWeight: "700", backgroundColor: "#F1F5F9", color: "#64748B", padding: "4px 10px", borderRadius: "4px" }}>
                      Effective: {update.effectiveDate}
                    </span>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#94A3B8", textTransform: "uppercase", marginBottom: "8px" }}>Summary</h4>
                    <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.6", margin: 0 }}>{update.whatChanged}</p>
                  </div>
                  <div style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #C9A84C" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", marginBottom: "8px" }}>Action Required</h4>
                    <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: 0 }}>{update.actionRequired}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
              <Bell size={48} color="#CBD5E1" style={{ marginBottom: "16px" }} />
              <p style={{ color: "#64748B", margin: 0 }}>No updates generated yet. Click refresh to start.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
