"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, Search, Mail, Map, Shield, Flag, TrendingUp, 
  BarChart3, Coffee, Calendar, ShieldAlert, Layout, 
  Bell, Zap, Newspaper, Users, Settings
} from "lucide-react";

const navGroups = [
  {
    title: "REPORTS",
    items: [
      { href: "/dashboard", label: "Report Studio", icon: FileText },
      { href: "/dashboard/templates", label: "Templates", icon: Layout },
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      { href: "/dashboard/research", label: "Research", icon: Search },
      { href: "/dashboard/emails", label: "Emails", icon: Mail },
      { href: "/dashboard/compliance", label: "Compliance", icon: Shield },
      { href: "/dashboard/regulatory", label: "Regulatory", icon: Bell },
    ]
  },
  {
    title: "GLOBAL",
    items: [
      { href: "/dashboard/soa-australia", label: "Australian SOA", icon: Map },
      { href: "/dashboard/usa-plan", label: "USA Plan", icon: Flag },
    ]
  },
  {
    title: "MARKETS",
    items: [
      { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
      { href: "/dashboard/briefing", label: "Briefing", icon: Coffee },
      { href: "/dashboard/news", label: "News", icon: Newspaper },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    ]
  },
  {
    title: "PRACTICE",
    items: [
      { href: "/dashboard/risk", label: "Risk", icon: ShieldAlert },
      { href: "/dashboard/trade-journal", label: "Trade Journal", icon: TrendingUp },
      { href: "/dashboard/strategy", label: "Strategy", icon: Zap },
    ]
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ]
  }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", color: "#FFFFFF", overflowY: "hidden" }}>
      <div style={{ padding: "24px", flexShrink: 0 }}>
        <Link href="/" style={{ fontSize: "24px", fontWeight: "900", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          Suitance<span style={{ color: "#C9A84C" }}>.</span>
        </Link>
      </div>
      
      <nav style={{ flex: 1, padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: "28px", overflowY: "auto" }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ padding: "0 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.4)" }}>
              {group.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "500",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      backgroundColor: isActive ? "rgba(201, 168, 76, 0.15)" : "transparent",
                      color: isActive ? "#C9A84C" : "rgba(255, 255, 255, 0.6)"
                    }}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: "20px", marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.05)", flexShrink: 0 }}>
        <div style={{ padding: "14px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C9A84C" }}></div>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.4)" }}>Pro Status</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.3)", lineHeight: "1.5" }}>
            Full access to all tools.
          </p>
        </div>
      </div>
    </div>
  );
}
