import { DashboardNav } from "@/components/dashboard-nav";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/auth/actions";
import { LogOut, Bell, Search } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F6F9", color: "#132033", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ 
        width: "240px", 
        minWidth: "240px",
        flexShrink: 0,
        backgroundColor: "#0A1628", 
        minHeight: "100vh", 
        display: "flex",
        flexDirection: "column",
        zIndex: 50, 
        borderRight: "1px solid rgba(255, 255, 255, 0.05)" 
      }}>
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflowY: "auto" }}>
        <header style={{ 
          height: "64px", 
          backgroundColor: "#FFFFFF", 
          borderBottom: "1px solid rgba(10, 22, 40, 0.08)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "0 32px", 
          position: "sticky", 
          top: 0, 
          zIndex: 40 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#0A1628" }}>Workspace</h1>
            <div style={{ 
              display: "none", // Hide on mobile if this were responsive
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
            <button style={{ padding: "8px", color: "#8A94A6", cursor: "pointer", background: "none", border: "none" }}>
              <Bell size={20} />
            </button>
            
            <div style={{ height: "32px", width: "1px", backgroundColor: "rgba(10, 22, 40, 0.08)", margin: "0 8px" }}></div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628", lineHeight: 1.2 }}>
                  {user.email?.split('@')[0]}
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
              
              <form action={logout}>
                <button 
                  type="submit" 
                  style={{ 
                    padding: "8px", 
                    color: "#8A94A6", 
                    cursor: "pointer", 
                    background: "none", 
                    border: "none" 
                  }}
                  title="Sign out"
                >
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          </div>
        </header>

        <div style={{ padding: "32px", flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
