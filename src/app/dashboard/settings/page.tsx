"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [plan, setPlan] = useState<string>("Starter");
  const [isPro, setIsPro] = useState(false);
  
  // Profile
  const [displayName, setDisplayName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("UK");

  // White Label
  const [firmName, setFirmName] = useState("");
  const [regulatorNumber, setRegulatorNumber] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [customFooterText, setCustomFooterText] = useState("");
  const [firmLogoUrl, setFirmLogoUrl] = useState("");

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
        setJurisdiction(profile.jurisdiction || "UK");
        setFirmName(profile.firm_name || "");
        setRegulatorNumber(profile.regulator_number || "");
        setRegisteredAddress(profile.registered_address || "");
        setCustomFooterText(profile.custom_footer_text || "");
        setFirmLogoUrl(profile.firm_logo_url || "");
        
        // Determine plan
        if (profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          setPlan("Pro");
          setIsPro(true);
        } else if (profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
          setPlan("Plus");
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

  async function handleSaveWhiteLabel() {
    if (!isPro) return;
    setIsSaving(true);
    setError("");
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          firm_name: firmName,
          regulator_number: regulatorNumber,
          registered_address: registeredAddress,
          custom_footer_text: customFooterText,
          firm_logo_url: firmLogoUrl
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
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      });
      if (error) throw error;
      alert("Password reset email sent!");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action is irreversible.")) return;
    
    setIsSaving(true);
    const supabase = createClient();
    try {
      // Deleting profile and user
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;
      
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: any) {
      // If RPC is not available, we can at least sign out and tell them to contact support
      // or implement a server action for this.
      console.error(err);
      alert("Please contact support to delete your account.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsSaving(true);
    const supabase = createClient();
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('white-labels')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('white-labels')
        .getPublicUrl(filePath);

      setFirmLogoUrl(publicUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#0A1628", marginBottom: "40px" }}>Account Settings</h1>

      {success && (
        <div style={{ backgroundColor: "#ECFDF5", color: "#065F46", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px" }}>
          Changes saved successfully!
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#FEF2F2", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Profile Section */}
      <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#0A1628", marginBottom: "20px" }}>Profile</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Display name</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Email</label>
            <input 
              type="text" 
              value={userEmail} 
              readOnly
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px", backgroundColor: "#F9FAFB", color: "#94A3B8" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Jurisdiction</label>
            <select 
              value={jurisdiction} 
              onChange={(e) => setJurisdiction(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
            >
              <option value="UK">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="USA">United States</option>
              <option value="Multiple">Multiple</option>
            </select>
          </div>
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            style={{ backgroundColor: "#C9A84C", color: "#FFFFFF", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: isSaving ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>

      {/* Subscription Section */}
      <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#0A1628", marginBottom: "20px" }}>Subscription</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "14px", color: "#64748B" }}>Current plan</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628" }}>{plan}</div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button 
              onClick={() => router.push("/api/customer-portal")}
              style={{ backgroundColor: "#0A1628", color: "#FFFFFF", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}
            >
              Manage subscription
            </button>
            <button 
              onClick={() => router.push("/api/customer-portal")}
              style={{ background: "none", border: "none", color: "#64748B", textDecoration: "underline", fontSize: "14px", cursor: "pointer" }}
            >
              Cancel subscription
            </button>
          </div>
        </div>
      </section>

      {/* White Label Section */}
      <section style={{ backgroundColor: isPro ? "#FFFFFF" : "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", opacity: isPro ? 1 : 0.7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#0A1628" }}>White label</h2>
          {!isPro && <span style={{ backgroundColor: "#E5E7EB", color: "#64748B", padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>PRO ONLY</span>}
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Firm logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {firmLogoUrl && <img src={firmLogoUrl} alt="Firm logo" style={{ height: "48px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload}
                disabled={!isPro || isSaving}
                style={{ fontSize: "14px" }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Firm name</label>
            <input 
              type="text" 
              value={firmName} 
              onChange={(e) => setFirmName(e.target.value)}
              disabled={!isPro}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>FCA/ASIC/SEC number</label>
            <input 
              type="text" 
              value={regulatorNumber} 
              onChange={(e) => setRegulatorNumber(e.target.value)}
              disabled={!isPro}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Registered address</label>
            <textarea 
              value={registeredAddress} 
              onChange={(e) => setRegisteredAddress(e.target.value)}
              disabled={!isPro}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px", resize: "none" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#64748B", marginBottom: "8px" }}>Custom footer text</label>
            <input 
              type="text" 
              value={customFooterText} 
              onChange={(e) => setCustomFooterText(e.target.value)}
              disabled={!isPro}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "16px" }}
            />
          </div>
          <button 
            onClick={handleSaveWhiteLabel}
            disabled={!isPro || isSaving}
            style={{ backgroundColor: "#C9A84C", color: "#FFFFFF", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: (!isPro || isSaving) ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
          >
            {isSaving ? "Saving..." : "Save white label settings"}
          </button>
        </div>
      </section>

      {/* Password Section */}
      <section style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#0A1628", marginBottom: "20px" }}>Password</h2>
        <button 
          onClick={handlePasswordReset}
          style={{ backgroundColor: "#FFFFFF", color: "#0A1628", padding: "10px 20px", borderRadius: "8px", border: "1px solid #E5E7EB", fontWeight: "600", cursor: "pointer" }}
        >
          Change password
        </button>
        <p style={{ fontSize: "14px", color: "#64748B", marginTop: "12px" }}>We&apos;ll send a password reset link to {userEmail}.</p>
      </section>

      {/* Danger Zone */}
      <section style={{ backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#991B1B", marginBottom: "20px" }}>Danger zone</h2>
        <button 
          onClick={handleDeleteAccount}
          disabled={isSaving}
          style={{ backgroundColor: "#EF4444", color: "#FFFFFF", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: isSaving ? "not-allowed" : "pointer" }}
        >
          Delete account
        </button>
        <p style={{ fontSize: "14px", color: "#B91C1C", marginTop: "12px" }}>Once you delete your account, there is no going back. Please be certain.</p>
      </section>
    </div>
  );
}
