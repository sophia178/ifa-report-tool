"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  FileText, Download, Zap, User, 
  Mic, Calculator, AlertCircle,
  ShieldCheck, Target, TrendingUp, Wallet
} from "lucide-react";

import type { Report } from "@/types/report";

type ReportStudioProps = {
  reports: Report[];
  adviserName: string;
};

type Template = {
  id: string;
  name: string;
  content: string;
};

const today = new Date().toISOString().slice(0, 10);

const SectionHeading = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div style={{ marginBottom: "24px", marginTop: "40px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
      <div style={{ backgroundColor: "#F4F6F9", padding: "8px", borderRadius: "8px", color: "#0A1628" }}>
        <Icon size={20} />
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
    </div>
    <div style={{ height: "1px", backgroundColor: "#E5E7EB", width: "100%" }} />
  </div>
);

const InputField = ({ label, value, onChange, placeholder, type = "text", prefix, required }: any) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <label style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748B", fontSize: "14px", fontWeight: "600" }}>{prefix}</span>
      )}
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ 
          width: "100%", 
          padding: `12px 16px ${prefix ? '12px 32px' : '12px 16px'}`, 
          paddingLeft: prefix ? "32px" : "16px",
          borderRadius: "10px", 
          border: "1px solid #E2E8F0", 
          fontSize: "14px",
          outline: "none",
          transition: "all 0.2s ease",
          boxSizing: "border-box"
        }} 
      />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, height = "100px" }: any) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <label style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>{label}</label>
    <textarea 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ 
        width: "100%", 
        padding: "12px 16px", 
        borderRadius: "10px", 
        border: "1px solid #E2E8F0", 
        fontSize: "14px",
        minHeight: height,
        outline: "none",
        transition: "all 0.2s ease",
        resize: "vertical",
        fontFamily: "inherit",
        boxSizing: "border-box"
      }} 
    />
  </div>
);

const ToggleField = ({ label, value, onChange }: any) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
    <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>{label}</span>
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: "48px",
        height: "24px",
        borderRadius: "12px",
        backgroundColor: value ? "#C9A84C" : "#CBD5E1",
        position: "relative",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "white",
        position: "absolute",
        top: "2px",
        left: value ? "26px" : "2px",
        transition: "all 0.2s ease"
      }} />
    </button>
  </div>
);

export function ReportStudio({ reports, adviserName }: ReportStudioProps) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"notes" | "audio">("notes");
  
  // CLIENT DETAILS
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAge, setClientAge] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [adviserNameVal, setAdviserNameVal] = useState(adviserName);

  // FINANCIAL PROFILE
  const [annualIncome, setAnnualIncome] = useState("");
  const [totalAssets, setTotalAssets] = useState("");
  const [existingInvestments, setExistingInvestments] = useState("");
  const [outstandingDebts, setOutstandingDebts] = useState("");
  const [propertyOwned, setPropertyOwned] = useState(false);

  // RISK PROFILE
  const [riskScore, setRiskScore] = useState(5);
  const [attitudeToLoss, setAttitudeToLoss] = useState("");

  // OBJECTIVES
  const [primaryObjective, setPrimaryObjective] = useState("");
  const [timeHorizon, setTimeHorizon] = useState<"short" | "medium" | "long">("medium");
  const [specificGoals, setSpecificGoals] = useState("");

  // RECOMMENDATION
  const [recommendedProduct, setRecommendedProduct] = useState("");
  const [initialAdviceCharge, setInitialAdviceCharge] = useState("");
  const [ongoingAdviceCharge, setOngoingAdviceCharge] = useState("");
  const [productCharge, setProductCharge] = useState("");

  // SPECIAL CONSIDERATIONS
  const [isVulnerable, setIsVulnerable] = useState(false);
  const [vulnerabilityDetails, setVulnerabilityDetails] = useState("");
  const [isPensionTransfer, setIsPensionTransfer] = useState(false);
  const [isIhtPlanning, setIsIhtPlanning] = useState(false);
  const [consumerDutyNotes, setConsumerDutyNotes] = useState("");

  // MEETING NOTES
  const [meetingNotes, setMeetingNotes] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // STATE
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestReport, setLatestReport] = useState<string | null>(reports[0]?.content ?? null);
  const [latestReportId, setLatestReportId] = useState<string | null>(reports[0]?.id ?? null);

  useEffect(() => {
    async function fetchTemplates() {
      const supabase = createClient();
      const { data } = await supabase.from("report_templates").select("id, name, content");
      if (data) setTemplates(data);
    }
    fetchTemplates();
  }, []);

  const riskCategory = useMemo(() => {
    if (riskScore <= 3) return "Cautious";
    if (riskScore <= 6) return "Moderate";
    return "Adventurous";
  }, [riskScore]);

  const totalOngoingCharge = useMemo(() => {
    const ongoing = parseFloat(ongoingAdviceCharge) || 0;
    const product = parseFloat(productCharge) || 0;
    return (ongoing + product).toFixed(2);
  }, [ongoingAdviceCharge, productCharge]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setStatus("Preparing evidence...");

    try {
      let transcript = "";
      let audioPath: string | null = null;

      if (sourceType === "audio" && audioFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("audio", audioFile);
        uploadFormData.append("clientName", clientName);

        setStatus("Uploading and transcribing audio...");
        const uploadResponse = await fetch("/api/upload-audio", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadJson = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadJson.error || "Audio upload failed.");

        transcript = uploadJson.transcript;
        audioPath = uploadJson.audioPath;
      }

      setStatus("Generating your FCA suitability report...");
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      
      const payload = {
        clientName,
        clientEmail,
        clientAge,
        meetingDate,
        adviserName: adviserNameVal,
        annualIncome,
        totalAssets,
        existingInvestments,
        outstandingDebts,
        propertyOwned,
        riskScore,
        riskCategory,
        attitudeToLoss,
        primaryObjective,
        timeHorizon,
        specificGoals,
        recommendedProduct,
        initialAdviceCharge,
        ongoingAdviceCharge,
        productCharge,
        totalOngoingCharge,
        isVulnerable,
        vulnerabilityDetails,
        isPensionTransfer,
        isIhtPlanning,
        consumerDutyNotes,
        sourceType,
        meetingNotes,
        transcript,
        audioPath,
        templateContent: selectedTemplate?.content || "",
      };

      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Report generation failed.");

      setLatestReport(json.report);
      setLatestReportId(json.reportId);
      setStatus("Report generated successfully.");
      router.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected error.");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "120px" }}>
      <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "48px", border: "1px solid #E5E7EB", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", marginBottom: "8px" }}>Report Studio</h2>
          <p style={{ color: "#64748B", fontSize: "16px" }}>Complete the structured profile below to generate a comprehensive suitability report.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <SectionHeading title="Client Details" icon={User} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <InputField label="Client Name" value={clientName} onChange={setClientName} placeholder="Full Name" required />
            <InputField label="Client Email" value={clientEmail} onChange={setClientEmail} placeholder="email@example.com" type="email" required />
            <InputField label="Client Age" value={clientAge} onChange={setClientAge} placeholder="e.g. 54" type="number" />
            <InputField label="Meeting Date" value={meetingDate} onChange={setMeetingDate} type="date" required />
            <div style={{ gridColumn: "span 2" }}>
              <InputField label="Adviser Name" value={adviserNameVal} onChange={setAdviserNameVal} placeholder="Your Name" required />
            </div>
          </div>

          <SectionHeading title="Financial Profile" icon={Wallet} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <InputField label="Annual Income" value={annualIncome} onChange={setAnnualIncome} placeholder="e.g. 75,000" prefix="£" />
            <InputField label="Total Assets" value={totalAssets} onChange={setTotalAssets} placeholder="e.g. 500,000" prefix="£" />
            <div style={{ gridColumn: "span 2" }}>
              <TextAreaField label="Existing Investments" value={existingInvestments} onChange={setExistingInvestments} placeholder="List current holdings, platforms, and values..." />
            </div>
            <InputField label="Outstanding Debts" value={outstandingDebts} onChange={setOutstandingDebts} placeholder="e.g. 150,000" prefix="£" />
            <ToggleField label="Property Owned" value={propertyOwned} onChange={setPropertyOwned} />
          </div>

          <SectionHeading title="Risk Profile" icon={ShieldCheck} />
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "14px", fontWeight: "700", color: "#374151" }}>Risk Score (1-10)</label>
                <span style={{ backgroundColor: "#0A1628", color: "white", padding: "4px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: "700" }}>{riskScore} - {riskCategory}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1" 
                value={riskScore} 
                onChange={(e) => setRiskScore(parseInt(e.target.value))}
                style={{ width: "100%", cursor: "pointer", accentColor: "#C9A84C" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>
                <span>1 Cautious</span>
                <span>5 Moderate</span>
                <span>10 Adventurous</span>
              </div>
            </div>
            <TextAreaField label="Attitude to Loss" value={attitudeToLoss} onChange={setAttitudeToLoss} placeholder="Describe the client's ability and willingness to sustain financial loss..." />
          </div>

          <SectionHeading title="Objectives" icon={Target} />
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <TextAreaField label="Primary Objective" value={primaryObjective} onChange={setPrimaryObjective} placeholder="What is the main goal of this advice?" height="80px" />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>Time Horizon</label>
              <select 
                value={timeHorizon} 
                onChange={(e: any) => setTimeHorizon(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", outline: "none", backgroundColor: "white" }}
              >
                <option value="short">Short term (0-3 years)</option>
                <option value="medium">Medium term (3-7 years)</option>
                <option value="long">Long term (7+ years)</option>
              </select>
            </div>
            <TextAreaField label="Specific Goals" value={specificGoals} onChange={setSpecificGoals} placeholder="Detailed goals, e.g. 'Pay off mortgage in 5 years', 'Retire at 60 with £40k income'..." />
          </div>

          <SectionHeading title="Recommendation" icon={TrendingUp} />
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <TextAreaField label="Recommended Product/Strategy" value={recommendedProduct} onChange={setRecommendedProduct} placeholder="What are you recommending and why?" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <InputField label="Initial Advice Charge" value={initialAdviceCharge} onChange={setInitialAdviceCharge} placeholder="e.g. 2,500" prefix="£" />
              <InputField label="Ongoing Advice Charge" value={ongoingAdviceCharge} onChange={setOngoingAdviceCharge} placeholder="e.g. 0.75" prefix="%" />
              <InputField label="Product Charge" value={productCharge} onChange={setProductCharge} placeholder="e.g. 0.35" prefix="%" />
              <div style={{ backgroundColor: "#F1F5F9", padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Total Ongoing Charge</span>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "#0A1628" }}>{totalOngoingCharge}%</span>
              </div>
            </div>
          </div>

          <SectionHeading title="Special Considerations" icon={ShieldCheck} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            <ToggleField label="Vulnerable Client" value={isVulnerable} onChange={setIsVulnerable} />
            {isVulnerable && (
              <TextAreaField label="Vulnerability Details" value={vulnerabilityDetails} onChange={setVulnerabilityDetails} placeholder="Explain the nature of vulnerability and support required..." />
            )}
            <ToggleField label="Pension Transfer involved" value={isPensionTransfer} onChange={setIsPensionTransfer} />
            <ToggleField label="IHT Planning required" value={isIhtPlanning} onChange={setIsIhtPlanning} />
            <TextAreaField label="Consumer Duty Notes" value={consumerDutyNotes} onChange={setConsumerDutyNotes} placeholder="How does this advice specifically deliver good outcomes for the client?" height="80px" />
          </div>

          <SectionHeading title="Meeting Notes" icon={FileText} />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: "#0A1628",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <Mic size={18} /> Audio Transcription
              </button>
              <div style={{ flex: 1 }} />
              {templates.length > 0 && (
                <select 
                  className="input" 
                  style={{ width: "200px", padding: "8px" }}
                  value={selectedTemplateId} 
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Standard Format</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
            <TextAreaField 
              label="Full Meeting Notes" 
              value={meetingNotes} 
              onChange={setMeetingNotes} 
              placeholder="Paste your full meeting notes here or use the audio transcription feature above..." 
              height="300px" 
            />
          </div>

          <div style={{ 
            marginTop: "40px",
            position: "sticky", 
            bottom: "20px", 
            backgroundColor: "white", 
            padding: "20px 0", 
            borderTop: "1px solid #F1F5F9",
            zIndex: 10,
          }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#C9A84C",
                color: "#0A1628",
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "700",
                border: "none",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                opacity: isSubmitting ? 0.7 : 1,
                transition: "all 0.2s ease",
                boxShadow: "0 10px 15px -3px rgba(201, 168, 76, 0.3)"
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin" style={{ width: "20px", height: "20px", border: "3px solid #0A1628", borderTopColor: "#C9A84C", borderRadius: "50%" }} />
                  Generating your report...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Generate Professional Suitability Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ 
          marginTop: "24px", 
          padding: "16px", 
          backgroundColor: "#FEF2F2", 
          border: "1px solid #FEE2E2", 
          borderRadius: "12px", 
          color: "#991B1B",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {latestReport && (latestReportId) && (
        <div style={{ marginTop: "48px", backgroundColor: "white", borderRadius: "24px", padding: "48px", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628" }}>Generated Report</h3>
            <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#F4F6F9", borderRadius: "8px", border: "none", fontWeight: "700", color: "#0A1628", cursor: "pointer" }}>
              <Download size={18} /> Download Word
            </button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", color: "#374151", fontSize: "15px", lineHeight: "1.8", fontFamily: "inherit" }}>
            {latestReport}
          </div>
        </div>
      )}
    </div>
  );
}
