"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import { Settings, Loader2, Upload, Save, Building2, MapPin, Hash, MessageSquare, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isPro, setIsPro] = useState(false);
  
  const [firmName, setFirmName] = useState("");
  const [firmAddress, setFirmAddress] = useState("");
  const [fcaNumber, setFcaNumber] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
        .select("subscribed, stripe_price_id")
        .eq("id", user.id)
        .single();

      if (!profile?.subscribed) {
        router.push("/pricing?message=subscribe");
        return;
      }

      const isProUser = profile.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
      setIsPro(isProUser);

      // Fetch existing white label settings
      const { data: settings } = await supabase
        .from("white_label_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings) {
        setFirmName(settings.firm_name);
        setFirmAddress(settings.firm_address || "");
        setFcaNumber(settings.fca_number || "");
        setFooterMessage(settings.footer_message || "");
        setLogoUrl(settings.logo_url);
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      let finalLogoUrl = logoUrl;

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('white-labels')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('white-labels')
          .getPublicUrl(fileName);
        
        finalLogoUrl = publicUrl;
      }

      const { error: upsertError } = await supabase
        .from('white_label_settings')
        .upsert({
          user_id: user.id,
          firm_name: firmName,
          firm_address: firmAddress,
          fca_number: fcaNumber,
          logo_url: finalLogoUrl,
          footer_message: footerMessage,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setLogoUrl(finalLogoUrl);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c1a362]" size={48} />
      </div>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <TopNav email={userEmail} />
        <DashboardNav />

        <div className="dashboard-content" style={{ width: "min(800px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="stack gap-8">
            <div className="stack gap-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="text-[#c1a362]" />
                Platform Settings
              </h2>
              <p className="text-gray-400">
                Manage your firm details and white-label preferences.
              </p>
            </div>

            {!isPro ? (
              <div className="card border border-amber-500/20 bg-amber-500/5 p-8 text-center stack gap-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Settings size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-200">White Labeling is a Pro Feature</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Upgrade to the Suitance Pro plan to remove Suitance branding and add your own firm logo, name, and FCA details to all reports.
                </p>
                <button onClick={() => router.push("/pricing")} className="btn mx-auto px-8">
                  View Pro Plan
                </button>
              </div>
            ) : (
              <div className="card shadow-xl border border-[rgba(193,163,98,0.2)] overflow-hidden">
                <div className="p-8 border-b border-[rgba(193,163,98,0.1)] bg-gradient-to-r from-[rgba(193,163,98,0.05)] to-transparent">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="text-[#c1a362]" size={20} />
                    White Label Settings
                  </h3>
                </div>

                <form onSubmit={handleSave} className="p-8 stack gap-8">
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="stack gap-3 items-center text-center">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Firm Logo</label>
                      <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-[rgba(193,163,98,0.2)] flex items-center justify-center overflow-hidden bg-[rgba(15,23,40,0.3)] group relative">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Firm Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Building2 className="text-gray-700" size={48} />
                        )}
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload className="text-white" size={24} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                      <span className="text-[10px] text-gray-500">Recommended: PNG, 500x500px</span>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="field">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Building2 size={14} /> Firm Name
                        </label>
                        <input
                          className="input"
                          placeholder="e.g. Oakwood Financial"
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="field">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <Hash size={14} /> FCA Number
                        </label>
                        <input
                          className="input"
                          placeholder="e.g. 123456"
                          value={fcaNumber}
                          onChange={(e) => setFcaNumber(e.target.value)}
                        />
                      </div>
                      <div className="field md:col-span-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                          <MapPin size={14} /> Registered Address
                        </label>
                        <textarea
                          className="textarea min-h-[80px]"
                          placeholder="Full registered address..."
                          value={firmAddress}
                          onChange={(e) => setFirmAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="field">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <MessageSquare size={14} /> Custom Footer Message
                    </label>
                    <textarea
                      className="textarea min-h-[100px]"
                      placeholder="e.g. Oakwood Financial is authorised and regulated by the Financial Conduct Authority..."
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                    />
                  </div>

                  {error && <div className="alert alert-error">{error}</div>}
                  {success && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-3 fade-in">
                      <CheckCircle2 size={18} />
                      Settings saved successfully. All future reports will use this branding.
                    </div>
                  )}

                  <button type="submit" className="btn w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Saving Settings...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        Save White Label Settings
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
