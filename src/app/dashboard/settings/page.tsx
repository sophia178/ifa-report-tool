"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Shield, Lock, Trash2, Save, Upload, Loader2, ExternalLink, CreditCard } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [plan, setPlan] = useState<string>("Starter");
  const [isPro, setIsPro] = useState(false);
  const [isPlus, setIsPlus] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  
  // Profile
  const [displayName, setDisplayName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("uk");
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  // White Label
  const [firmName, setFirmName] = useState("");
  const [regulatorNumber, setRegulatorNumber] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [customFooterText, setCustomFooterText] = useState("");
  const [firmLogoUrl, setFirmLogoUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setJurisdiction(profile.jurisdiction || "uk");
        setFirmName(profile.firm_name || "");
        setRegulatorNumber(profile.regulator_number || "");
        setRegisteredAddress(profile.registered_address || "");
        setCustomFooterText(profile.custom_footer_text || "");
        setFirmLogoUrl(profile.firm_logo_url || "");
        setStripeCustomerId(profile.stripe_customer_id || null);
        
        // Determine plan
        if (profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          setPlan("Pro");
          setIsPro(true);
        } else if (profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
          setPlan("Plus");
          setIsPlus(true);
        } else {
          setPlan("Starter");
        }
      }
      
      setIsLoading(false);
    }
    fetchData();
  }, [router]);

  async function handleSaveProfile() {
    setIsSaving(true);
    setError("");
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          display_name: displayName, 
          jurisdiction 
        })
        .eq("id", userId);
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!userEmail) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert("Password reset email sent!");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSaveWhiteLabel() {
    if (!userId) return;
    setIsSaving(true);
    setError("");
    const supabase = createClient();
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          firm_name: firmName,
          firm_logo_url: firmLogoUrl,
        })
        .eq("id", userId);

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save white label settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadLogo(file: File) {
    if (!userId) return;
    setIsUploadingLogo(true);
    setError("");
    const supabase = createClient();
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const objectPath = `${userId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("firm-logos")
        .upload(objectPath, file, {
          contentType: file.type || "image/png",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("firm-logos").getPublicUrl(objectPath);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("Could not create public URL for uploaded logo.");
      setFirmLogoUrl(publicUrl);
    } catch (err: any) {
      setError(err.message || "Logo upload failed");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  const getPlanPrice = () => {
    switch (plan) {
      case "Pro": return "£99/month";
      case "Plus": return "£49/month";
      default: return "£19/month";
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="animate-spin text-[#0A1628]" size={48} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 48px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "40px" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748B", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "24px" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0A1628", marginBottom: "8px" }}>Account Settings</h1>
        <p style={{ color: "#5F6877", fontSize: "16px" }}>Manage your profile, jurisdiction, and firm preferences.</p>
      </div>

      {success && (
        <div style={{ backgroundColor: "#ECFDF5", color: "#065F46", padding: "16px 24px", borderRadius: "12px", marginBottom: "32px", border: "1px solid #D1FAE5", fontWeight: "600" }}>
          Changes saved successfully!
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        {/* Profile Section */}
        <section style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <User size={24} color="#0A1628" />
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Personal Profile</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Display Name</label>
                <input 
                  style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }} 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Primary Jurisdiction</label>
                <select 
                  style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", backgroundColor: "white" }} 
                  value={jurisdiction} 
                  onChange={(e) => setJurisdiction(e.target.value)}
                >
                  <option value="uk">United Kingdom (FCA)</option>
                  <option value="aus">Australia (ASIC)</option>
                  <option value="usa">United States (SEC/FINRA)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              onMouseEnter={() => setHoveredBtn("profile")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                backgroundColor: "#0A1628",
                color: "white",
                padding: "14px 28px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "14px",
                cursor: isSaving ? "not-allowed" : "pointer",
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                transform: hoveredBtn === "profile" && !isSaving ? "translateY(-1px)" : "none",
                boxShadow: hoveredBtn === "profile" && !isSaving ? "0 4px 12px rgba(10, 22, 40, 0.15)" : "none"
              }}
            >
              <Save size={18} /> Save Profile Changes
            </button>
          </div>
        </section>

        {/* Security Section */}
        <section style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <Lock size={24} color="#0A1628" />
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Security</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#0A1628", marginBottom: "4px" }}>Email Address</p>
              <p style={{ fontSize: "14px", color: "#64748B" }}>{userEmail}</p>
            </div>

            <button
              onClick={handlePasswordReset}
              onMouseEnter={() => setHoveredBtn("password")}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                color: "#0A1628",
                padding: "14px 28px",
                borderRadius: "10px",
                border: "none",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                width: "fit-content",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                backgroundColor: hoveredBtn === "password" ? "#E5E7EB" : "#F4F6F9"
              }}
            >
              <Shield size={18} /> Reset Password via Email
            </button>
          </div>
        </section>

        {/* Subscription Section */}
        <section style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <Shield size={24} color="#0A1628" />
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Subscription</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Current Plan</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "24px", fontWeight: "800", color: "#0A1628" }}>{plan}</span>
                  <span style={{ fontSize: "16px", color: "#64748B" }}>{getPlanPrice()}</span>
                </div>
              </div>
              
              {!isPro && (
                <Link 
                  href="/pricing"
                  onMouseEnter={() => setHoveredBtn("upgrade")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    backgroundColor: "#C9A84C",
                    color: "#0A1628",
                    padding: "12px 24px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                    transform: hoveredBtn === "upgrade" ? "translateY(-1px)" : "none",
                    boxShadow: hoveredBtn === "upgrade" ? "0 4px 12px rgba(201, 168, 76, 0.2)" : "none"
                  }}
                >
                  Upgrade Plan
                </Link>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {stripeCustomerId ? (
                  <>
                    <Link 
                      href="/api/customer-portal"
                      onMouseEnter={() => setHoveredBtn("portal")}
                      onMouseLeave={() => setHoveredBtn(null)}
                      style={{
                        backgroundColor: "#0A1628",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "10px",
                        textDecoration: "none",
                        fontWeight: "700",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        transform: hoveredBtn === "portal" ? "translateY(-1px)" : "none"
                      }}
                    >
                      <CreditCard size={18} /> Manage Subscription
                    </Link>
                    
                    <Link 
                      href="/api/customer-portal"
                      style={{ 
                        fontSize: "13px", 
                        color: "#EF4444", 
                        textDecoration: "none", 
                        fontWeight: "600" 
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      Cancel Subscription
                    </Link>
                  </>
                ) : (
                  <div style={{ fontSize: "13px", color: "#64748B", fontWeight: "600" }}>
                    No active subscription found
                  </div>
                )}
              </div>

              <p style={{ fontSize: "13px", color: "#64748B", fontStyle: "italic" }}>
                Changes take effect immediately. Cancellations apply at end of billing period.
              </p>
            </div>
          </div>
        </section>
        
        {isPro && (
          <section style={{ backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <Upload size={24} color="#0A1628" />
              <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0A1628", margin: 0 }}>White Label</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Firm Name</label>
                  <input 
                    style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }} 
                    value={firmName} 
                    onChange={(e) => setFirmName(e.target.value)} 
                    placeholder="e.g. Example Wealth Pty Ltd"
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>Firm Logo</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={isUploadingLogo}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) handleUploadLogo(file);
                      }}
                    />
                    {isUploadingLogo && <Loader2 className="animate-spin" size={18} />}
                  </div>
                  <input
                    style={{ padding: "12px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px" }}
                    value={firmLogoUrl}
                    onChange={(e) => setFirmLogoUrl(e.target.value)}
                    placeholder="Or paste a public logo URL"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveWhiteLabel}
                disabled={isSaving}
                onMouseEnter={() => setHoveredBtn("white-label")}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  backgroundColor: "#0A1628",
                  color: "white",
                  padding: "14px 28px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  width: "fit-content",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  transform: hoveredBtn === "white-label" && !isSaving ? "translateY(-1px)" : "none",
                  boxShadow: hoveredBtn === "white-label" && !isSaving ? "0 4px 12px rgba(10, 22, 40, 0.15)" : "none"
                }}
              >
                <Save size={18} /> Save White Label Settings
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
