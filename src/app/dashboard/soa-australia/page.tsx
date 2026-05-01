"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { Map, Loader2, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate SOA");

      setSoaId(data.soaId);
      setSoaText(data.soaText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <TopNav email={userEmail} />
        <DashboardNav />

        <div className="dashboard-content" style={{ width: "min(1200px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)]">
              <div className="p-8 stack gap-6">
                <div className="stack gap-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Map className="text-[#c1a362]" />
                    Australian SOA Generator
                  </h2>
                  <p className="text-gray-400">
                    Generate an ASIC RG 175 compliant Statement of Advice from meeting notes.
                  </p>
                </div>

                <form onSubmit={handleGenerate} className="stack gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Client Name</label>
                      <input
                        className="input"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Client Email</label>
                      <input
                        className="input"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Date of Birth</label>
                      <input
                        className="input"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Meeting Date</label>
                      <input
                        className="input"
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Adviser Name</label>
                      <input
                        className="input"
                        value={adviserName}
                        onChange={(e) => setAdviserName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="text-sm font-medium text-gray-400">Adviser Firm</label>
                      <input
                        className="input"
                        value={adviserFirm}
                        onChange={(e) => setAdviserFirm(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="stack gap-2">
                    <h3 className="text-sm font-semibold border-b border-[rgba(193,163,98,0.2)] pb-2">Investment Details (optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="field">
                        <label className="text-sm font-medium text-gray-400">Platform Name</label>
                        <input
                          className="input"
                          value={platformName}
                          onChange={(e) => setPlatformName(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="text-sm font-medium text-gray-400">Fund Name</label>
                        <input
                          className="input"
                          value={fundName}
                          onChange={(e) => setFundName(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="text-sm font-medium text-gray-400">Fund SRRI Rating</label>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="7"
                          value={fundSrriRiskRating}
                          onChange={(e) => setFundSrriRiskRating(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label className="text-sm font-medium text-gray-400">Fund ISIN</label>
                        <input
                          className="input"
                          value={fundIsinNumber}
                          onChange={(e) => setFundIsinNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="text-sm font-medium text-gray-400">Client Objectives</label>
                    <textarea
                      className="textarea min-h-[100px]"
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label className="text-sm font-medium text-gray-400">Meeting Notes</label>
                    <textarea
                      className="textarea min-h-[300px]"
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      required
                    />
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}

                  <button
                    type="submit"
                    className="btn w-full"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Generating SOA...
                      </>
                    ) : (
                      "Generate Statement of Advice"
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="stack gap-6">
              {soaText ? (
                <div className="card shadow-xl overflow-hidden border border-[rgba(193,163,98,0.2)] fade-in">
                  <div className="p-8 stack gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">Generated SOA</h3>
                      <a
                        href={`/api/download-soa?id=${soaId}`}
                        className="btn-light btn-sm flex items-center gap-2"
                        download
                      >
                        <FileDown size={18} />
                        Download Word
                      </a>
                    </div>
                    <div className="p-6 rounded-xl bg-white text-gray-900 h-[800px] overflow-y-auto">
                      {soaText.split('\n').map((line, i) => (
                        <p key={i} className={`mb-3 ${line.startsWith('SECTION') ? 'font-bold text-lg mt-6' : ''}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card border border-dashed border-[rgba(193,163,98,0.2)] bg-transparent p-12 text-center stack gap-4 items-center">
                  <div className="p-4 rounded-full bg-[rgba(193,163,98,0.05)] text-[#c1a362]">
                    <Map size={48} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300">No SOA Generated Yet</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">
                    Fill in the client details and meeting notes to generate a compliant Statement of Advice.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
