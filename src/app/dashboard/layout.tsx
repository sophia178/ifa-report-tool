import { DashboardNav } from "@/components/dashboard-nav";
import { requireUser } from "@/lib/auth";
import { Menu, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientLogout } from "@/components/client-logout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const supabase = await createClient();

  // 1. Perform server-side subscription and onboarding checks
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscribed, jurisdiction, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.subscribed) {
    redirect("/pricing?message=subscribe");
  }

  if (!profile?.jurisdiction) {
    redirect("/onboarding");
  }

  const formatName = (email: string, displayName?: string) => {
    if (displayName) return displayName;
    const prefix = email.split("@")[0];
    // Remove all numbers
    const noNumbers = prefix.replace(/[0-9]/g, "");
    // Split on common separators and take first part only
    const firstName = noNumbers.split(/[._\-]/)[0];
    // Capitalise first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  const displayName = user.email ? formatName(user.email, profile?.display_name ?? undefined) : (profile?.display_name || "Adviser");

  return (
    <div className="dashboard-shell" style={{ display: "flex", height: "100vh", backgroundColor: "#F4F6F9", color: "#132033", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      <input id="dashboard-nav-toggle" className="dashboard-nav-toggle" type="checkbox" />
      {/* Sidebar */}
      <aside className="no-print dashboard-sidebar" style={{ 
        width: "240px", 
        minWidth: "240px",
        flexShrink: 0,
        backgroundColor: "#0A1628", 
        height: "100%", 
        display: "flex",
        flexDirection: "column",
        zIndex: 50, 
        borderRight: "1px solid rgba(255, 255, 255, 0.05)" 
      }}>
        <DashboardNav />
      </aside>
      <label htmlFor="dashboard-nav-toggle" className="dashboard-overlay no-print" />

      {/* Main Content Container */}
      <div className="dashboard-content" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Top Navigation Bar */}
        <header className="no-print dashboard-topbar" style={{ 
          height: "64px", 
          minHeight: "64px",
          backgroundColor: "#FFFFFF", 
          borderBottom: "1px solid rgba(10, 22, 40, 0.08)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "0 32px", 
          zIndex: 40 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <label
              htmlFor="dashboard-nav-toggle"
              className="dashboard-nav-toggle-btn"
              aria-label="Toggle menu"
            >
              <Menu size={18} />
            </label>
            <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628" }}>Workspace</h1>
            <div style={{ 
              display: "none", 
              alignItems: "center", 
              gap: "8px", 
              padding: "6px 12px", 
              backgroundColor: "#F4F6F9", 
              borderRadius: "8px", 
              border: "1px solid rgba(10, 22, 40, 0.08)", 
              color: "#8A94A6" 
            }}>
              <Search size={14} />
              <span style={{ fontSize: "12px", fontWeight: "500" }}>Search tools...</span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Notification bell removed as no system is built */}
            
            <div style={{ height: "32px", width: "1px", backgroundColor: "rgba(10, 22, 40, 0.08)", margin: "0 8px" }}></div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628", lineHeight: 1.2 }}>
                  {displayName}
                </span>
                <span style={{ fontSize: "10px", fontWeight: "600", color: "#8A94A6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Principal Adviser
                </span>
              </div>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "12px", 
                backgroundColor: "#0A1628", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#C9A84C", 
                fontWeight: "700", 
                border: "1px solid rgba(255, 255, 255, 0.1)" 
              }}>
                {user.email?.[0].toUpperCase()}
              </div>
              
              <ClientLogout />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="dashboard-main-content" style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
