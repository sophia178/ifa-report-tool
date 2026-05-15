"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, UserPlus, Trash2, Mail, ShieldCheck, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TeamMember = {
  id: string;
  member_email: string;
  status: "pending" | "active";
  created_at: string;
};

export default function TeamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isPro, setIsPro] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [team, setTeam] = useState<TeamMember[]>([]);
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

      if (isProUser) {
        await fetchTeam();
      }
      
      setIsLoading(false);
    }
    checkAccess();
  }, [router]);

  async function fetchTeam() {
    try {
      const response = await fetch("/api/team");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch team");
      }
      const data = await response.json();
      setTeam(data);
    } catch (err) {
      console.error("Failed to fetch team", err);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);
    setError("");

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to invite member");
      }

      setInviteEmail("");
      await fetchTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this team member? They will lose Pro access.")) return;

    try {
      const response = await fetch(`/api/team?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove member");
      }
      await fetchTeam();
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  }

  if (!isPro && !isLoading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ backgroundColor: "#F8FAFC", border: "1px dashed #E5E7EB", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0A1628", margin: "0 0 10px" }}>
            Team Management is a Pro feature
          </h1>
          <p style={{ color: "#64748B", margin: "0 0 20px", fontSize: "15px" }}>
            Upgrade to Pro to invite colleagues and manage firm access.
          </p>
          <a href="/pricing" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "12px 20px", backgroundColor: "#0A1628", color: "white", borderRadius: "10px", fontWeight: "700", textDecoration: "none" }}>
            Upgrade to Pro
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "white", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0A1628", margin: 0 }}>
          Team Management
        </h1>
        <p style={{ color: "#64748B", margin: 0 }}>
          Invite team members and manage their access to your Suitance Pro firm.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", alignItems: "start" }}>
        {/* Invite Card */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0A1628", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={18} color="#C9A84C" />
            Invite Member
          </h2>
          
          <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", textTransform: "uppercase" }}>Email Address</label>
              <input
                type="email"
                placeholder="colleague@firm.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px" }}
              />
            </div>

            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#0A1628",
                color: "white",
                borderRadius: "8px",
                border: "none",
                fontWeight: "700",
                fontSize: "14px",
                cursor: (isInviting || !inviteEmail.trim()) ? "not-allowed" : "pointer",
                opacity: (isInviting || !inviteEmail.trim()) ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {isInviting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
              {isInviting ? "Inviting..." : "Send Invite"}
            </button>
            {error && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{error}</p>}
          </form>
        </div>

        {/* List Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Users size={20} color="#0A1628" />
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0A1628", margin: 0 }}>Active Team</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* You (The Owner) */}
            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", padding: "16px 20px", border: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#0A1628", color: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                  {userEmail?.[0].toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628" }}>{userEmail} (You)</span>
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600", textTransform: "uppercase" }}>Firm Administrator</span>
                </div>
              </div>
              <ShieldCheck size={18} color="#10B981" />
            </div>

            {team.map((member) => (
              <div key={member.id} style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px 20px", border: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                    {member.member_email[0].toUpperCase()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628" }}>{member.member_email}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {member.status === "pending" ? (
                        <>
                          <Clock size={10} color="#F59E0B" />
                          <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "600", textTransform: "uppercase" }}>Pending Invite</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={10} color="#10B981" />
                          <span style={{ fontSize: "11px", color: "#10B981", fontWeight: "600", textTransform: "uppercase" }}>Active Member</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRemove(member.id)} style={{ color: "#94A3B8", cursor: "pointer", padding: "8px" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {team.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center", border: "1px dashed #E5E7EB", borderRadius: "12px" }}>
                <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0 }}>No other team members yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
