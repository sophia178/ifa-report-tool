"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { DashboardNav } from "@/components/dashboard-nav";
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
      const data = await response.json();
      if (response.ok) setTeam(data);
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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to invite member");

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
      if (response.ok) await fetchTeam();
    } catch (err) {
      console.error("Remove failed", err);
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

        <div className="dashboard-content" style={{ width: "min(1000px, calc(100% - 40px))", margin: "40px auto" }}>
          <div className="stack gap-8">
            <div className="stack gap-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="text-[#c1a362]" />
                Team Management
              </h2>
              <p className="text-gray-400">
                Invite team members and manage their access to your Pro subscription.
              </p>
            </div>

            {!isPro ? (
              <div className="card border border-amber-500/20 bg-amber-500/5 p-8 text-center stack gap-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-200">Team Seats is a Pro Feature</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Upgrade to Suitance Pro to invite up to 4 additional team members. Everyone gets full Pro access under one subscription.
                </p>
                <button onClick={() => router.push("/pricing")} className="btn mx-auto px-8">
                  View Pro Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                  <div className="card shadow-xl border border-[rgba(193,163,98,0.2)] p-8">
                    <form onSubmit={handleInvite} className="stack gap-6">
                      <div className="stack gap-2">
                        <h3 className="text-lg font-bold">Invite Member</h3>
                        <p className="text-xs text-gray-500">You can have up to 4 additional team members.</p>
                      </div>
                      
                      <div className="field">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                          <input
                            type="email"
                            className="input pl-10"
                            placeholder="colleague@firm.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            disabled={team.length >= 4}
                          />
                        </div>
                      </div>

                      {error && <div className="alert alert-error text-xs">{error}</div>}

                      <button 
                        type="submit" 
                        className="btn w-full" 
                        disabled={isInviting || team.length >= 4 || !inviteEmail}
                      >
                        {isInviting ? <Loader2 className="animate-spin mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />}
                        Send Invitation
                      </button>

                      {team.length >= 4 && (
                        <p className="text-[10px] text-amber-500 text-center">
                          Team limit reached. Remove a member to invite someone new.
                        </p>
                      )}
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="card shadow-xl border border-[rgba(193,163,98,0.2)] overflow-hidden bg-[rgba(15,23,40,0.3)]">
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[rgba(193,163,98,0.05)] text-[#c1a362] text-xs uppercase tracking-wider">
                          <tr>
                            <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Team Member</th>
                            <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Status</th>
                            <th className="p-4 border-b border-[rgba(193,163,98,0.1)]">Joined</th>
                            <th className="p-4 border-b border-[rgba(193,163,98,0.1)] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {team.length > 0 ? (
                            team.map((member) => (
                              <tr key={member.id} className="border-b border-[rgba(193,163,98,0.05)] hover:bg-[rgba(193,163,98,0.02)]">
                                <td className="p-4">
                                  <div className="font-bold text-gray-200">{member.member_email}</div>
                                </td>
                                <td className="p-4">
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    member.status === 'active' 
                                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  }`}>
                                    {member.status === 'active' ? <ShieldCheck size={12} /> : <Clock size={12} />}
                                    {member.status}
                                  </div>
                                </td>
                                <td className="p-4 text-gray-500">
                                  {new Date(member.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => handleRemove(member.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-gray-500 italic">
                                Your team is currently empty.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
