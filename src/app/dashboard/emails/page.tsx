"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { Mail, Loader2, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email);

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
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to draft email");

      setEmailContent(data.emailContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <TopNav email={userEmail} />
        <DashboardNav />

        <div className="dashboard-content" style={{ width: "min(800px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)]">
            <div className="p-8 stack gap-6">
              <div className="stack gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Mail className="text-[#c1a362]" />
                  Client Email Drafter
                </h2>
                <p className="text-gray-400">
                  Generate professional, personalized emails for your clients in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="stack gap-2">
                  <label className="text-sm font-medium text-gray-400">Client Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. John Smith"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div className="stack gap-2">
                  <label className="text-sm font-medium text-gray-400">Email Purpose</label>
                  <select
                    className="input"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    {purposes.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="stack gap-2">
                <label className="text-sm font-medium text-gray-400">Key Points to Include</label>
                <textarea
                  className="input min-h-[120px] p-4"
                  placeholder="e.g. mention the 5% portfolio growth, confirm the next meeting on Tuesday at 10am..."
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                />
              </div>

              <div className="stack gap-2">
                <label className="text-sm font-medium text-gray-400">Tone</label>
                <div className="flex gap-4">
                  {tones.map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        className="hidden"
                        name="tone"
                        checked={tone === t}
                        onChange={() => setTone(t)}
                      />
                      <div className={`px-4 py-2 rounded-lg border transition-all ${
                        tone === t 
                          ? "bg-[#c1a362] border-[#c1a362] text-white" 
                          : "border-[rgba(193,163,98,0.2)] text-gray-400 hover:border-[#c1a362]"
                      }`}>
                        {t}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                className="btn w-full"
                disabled={isDrafting || !clientName || !keyPoints}
                onClick={handleDraft}
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Drafting Email...
                  </>
                ) : (
                  "Generate Email Draft"
                )}
              </button>

              {emailContent && (
                <div className="mt-8 stack gap-4 fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Generated Draft</h3>
                    <button
                      className="btn-light btn-sm flex items-center gap-2"
                      onClick={copyToClipboard}
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
                  <div className="p-6 rounded-xl bg-[rgba(193,163,98,0.05)] border border-[rgba(193,163,98,0.2)] whitespace-pre-wrap text-gray-300 leading-relaxed font-mono text-sm">
                    {emailContent}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
