"use client";

import { useState, useEffect } from "react";
import { Map, Loader2, FileDown, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { LoadingProgress } from "@/components/loading-progress";

const today = new Date().toISOString().slice(0, 10);

export default function SOAAustraliaPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [adviserName, setAdviserName] = useState("");
  const [adviserFirm, setAdviserFirm] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [fundName, setFundName] = useState("");
  const [fundSrriRiskRating, setFundSrriRiskRating] = useState("");
  const [fundIsinNumber, setFundIsinNumber] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [objectives, setObjectives] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [soaId, setSoaId] = useState<string | null>(null);
  const [soaText, setSoaText] = useState<string | null>(null);
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
      const isAusStarter = profile.jurisdiction === "aus"; // Starter is fallback

      if (!isPro && !isPlus && !isAusStarter) {
        router.push("/dashboard?error=access-denied");
        return;
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName || !meetingNotes) return;
    setIsGenerating(true);
    setError("");
    setSoaId(null);
    setSoaText(null);

    try {
      const response = await fetch("/api/soa-australia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          clientEmail,
          dateOfBirth,
          adviserName,
          adviserFirm,
          platformName,
          fundName,
          fundSrriRiskRating,
          fundIsinNumber,
          meetingDate,
          objectives,
          meetingNotes,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate SOA");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setSoaText(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 48px" }}>
      {isGenerating && (
        <div style={{ marginBottom: "24px" }}>
          <LoadingProgress isLoading={isGenerating} />
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: "#FEF2F2", 
          border: "1px solid #FCA5A5", 
          padding: "16px", 
          borderRadius: "12px", 
          color: "#991B1B", 
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: "14px", fontWeight: "600" }}>{error}</span>
        </div>
      )}

      <div style={{ marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "8px" }}>Australian SOA Generator</h1>
        <p style={{ color: "#5F6877", fontSize: "16px" }}>Generate an ASIC RG 175 compliant Statement of Advice from meeting notes.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
        {/* Input Panel */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Client Name</label>
                <input style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }} value={clientName} onChange={(e) => setClientName(e.target.value)} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Client Email</label>
                <input style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Date of Birth</label>
                <input style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }} type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Meeting Date</label>
                <input style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }} type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Meeting Notes</label>
              <textarea style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", minHeight: "200px", resize: "vertical" }} placeholder="Paste your meeting notes here..." value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} required />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", color: "#991B1B", borderRadius: "8px", fontSize: "14px", border: "1px solid #FEE2E2" }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isGenerating}
              onMouseEnter={() => setHoveredBtn(true)}
              onMouseLeave={() => setHoveredBtn(false)}
              style={{ 
                padding: "16px", 
                backgroundColor: "#C9A84C", 
                color: "#0A1628", 
                borderRadius: "12px", 
                fontWeight: "700", 
                fontSize: "16px", 
                cursor: isGenerating ? "not-allowed" : "pointer",
                opacity: isGenerating ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                transition: "all 0.2s ease",
                transform: hoveredBtn && !isGenerating ? "translateY(-1px)" : "none",
                boxShadow: hoveredBtn && !isGenerating ? "0 4px 12px rgba(201, 168, 76, 0.2)" : "none"
              }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
                  Generating SOA...
                </>
              ) : (
                <>
                  <Map size={20} />
                  Generate Australian SOA
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", minHeight: "600px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {soaText ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628" }}>Generated SOA</h3>
                <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#F4F6F9", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#0A1628" }}>
                  <FileDown size={16} /> Download Word
                </button>
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "#374151", fontSize: "15px", lineHeight: "1.7", padding: "24px", backgroundColor: "#F8FAFC", borderRadius: "12px", flex: 1 }}>
                {soaText}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8A94A6", textAlign: "center", gap: "16px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "#F4F6F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Map size={32} />
              </div>
              <div>
                <p style={{ fontWeight: "700", color: "#0A1628", marginBottom: "4px" }}>No SOA Generated Yet</p>
                <p style={{ fontSize: "14px" }}>Fill out the form to generate a compliant Statement of Advice.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
