"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const jurisdictions = [
  { id: "UK", name: "United Kingdom", regulator: "FCA regulated", flag: "🇬🇧" },
  { id: "Australia", name: "Australia", regulator: "ASIC regulated", flag: "🇦🇺" },
  { id: "USA", name: "United States", regulator: "SEC/FINRA regulated", flag: "🇺🇸" },
  { id: "Multiple", name: "Multiple", regulator: "Multiple jurisdictions", flag: "🌍" },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSelection(id: string) {
    setSelected(id);
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({ jurisdiction: id })
        .eq("id", user.id);

      if (error) throw error;

      router.push("/pricing");
    } catch (err) {
      console.error("Failed to save jurisdiction:", err);
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", color: "#0A1628", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: "40px", fontWeight: "800", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          Welcome to Suitance. Where do you practise?
        </h1>
        <p style={{ fontSize: "18px", color: "#64748B", marginBottom: "48px" }}>
          We&apos;ll tailor your workspace to your regulatory environment.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {jurisdictions.map((j) => (
            <button
              key={j.id}
              onClick={() => handleSelection(j.id)}
              disabled={isSubmitting}
              style={{
                backgroundColor: "#FFFFFF",
                border: selected === j.id ? "2px solid #C9A84C" : "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "left",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: selected === j.id ? "0 4px 12px rgba(201, 168, 76, 0.1)" : "none",
                opacity: isSubmitting && selected !== j.id ? 0.5 : 1
              }}
            >
              <span style={{ fontSize: "32px" }}>{j.flag}</span>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#0A1628" }}>{j.name}</div>
                <div style={{ fontSize: "14px", color: "#64748B", fontWeight: "500" }}>{j.regulator}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
