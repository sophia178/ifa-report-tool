"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const jurisdictions = [
  { id: "uk", name: "United Kingdom", regulator: "FCA regulated", flag: "🇬🇧" },
  { id: "aus", name: "Australia", regulator: "ASIC regulated", flag: "🇦🇺" },
  { id: "usa", name: "United States", regulator: "SEC·FINRA regulated", flag: "🇺🇸" },
  { id: "global", name: "Multiple", regulator: "Global practice", flag: "🌍" },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSelection(id: string) {
    setSelected(id);
  }

  async function handleContinue() {
    if (!selected) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found. Please log in again.");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ jurisdiction: selected })
        .eq("id", user.id);

      if (updateError) throw updateError;

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Failed to save jurisdiction:", err);
      setError(err.message || "Failed to save your selection. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ backgroundColor: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "800", color: "#0A1628", marginBottom: "16px" }}>
          Welcome to Suitance.
        </h1>
        <p style={{ fontSize: "18px", color: "#64748B", marginBottom: "48px" }}>
          Where do you practise? Starter members get the report generator for their jurisdiction. Upgrade to Plus to unlock all three.
        </p>

        {error && (
          <div style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", padding: "12px", borderRadius: "8px", marginBottom: "24px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {jurisdictions.map((j) => (
            <button
              key={j.id}
              onClick={() => handleSelection(j.id)}
              disabled={isSubmitting}
              onMouseEnter={(e) => {
                if (!isSubmitting && selected !== j.id) {
                  e.currentTarget.style.border = "2px solid #C9A84C";
                  e.currentTarget.style.backgroundColor = "#FFFBF0";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && selected !== j.id) {
                  e.currentTarget.style.border = "2px solid #E5E7EB";
                  e.currentTarget.style.backgroundColor = "white";
                }
              }}
              style={{
                backgroundColor: selected === j.id ? "#FFFBF0" : "white",
                border: selected === j.id ? "2px solid #C9A84C" : "2px solid #E5E7EB",
                borderRadius: "16px",
                padding: "32px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>{j.flag}</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628" }}>{j.name}</div>
              <div style={{ fontSize: "14px", color: "#64748B", marginTop: "8px" }}>{j.regulator}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || isSubmitting}
          style={{
            backgroundColor: "#0A1628",
            color: "white",
            padding: "16px 48px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "700",
            marginTop: "40px",
            cursor: (!selected || isSubmitting) ? "not-allowed" : "pointer",
            opacity: (!selected || isSubmitting) ? 0.4 : 1,
            border: "none",
            transition: "all 0.2s ease"
          }}
        >
          {isSubmitting ? "Saving..." : "Continue"}
        </button>
      </div>
    </main>
  );
}
