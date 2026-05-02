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
    title: "Reports",
    items: [
      { href: "/dashboard", label: "Report Studio", icon: FileText },
      { href: "/dashboard/templates", label: "Templates", icon: Layout },
      { href: "/dashboard/research", label: "Research Summariser", icon: Search },
      { href: "/dashboard/emails", label: "Email Drafter", icon: Mail },
    ]
  },
  {
    title: "Intelligence",
    items: [
      { href: "/dashboard/compliance", label: "Compliance Checker", icon: Shield },
      { href: "/dashboard/regulatory", label: "Regulatory Alerts", icon: Bell },
      { href: "/dashboard/soa-australia", label: "Australian SOA", icon: Map },
      { href: "/dashboard/usa-plan", label: "USA Plan", icon: Flag },
    ]
  },
  {
    title: "Markets & Terminal",
    items: [
      { href: "/dashboard/markets", label: "Markets Terminal", icon: BarChart3 },
      { href: "/dashboard/briefing", label: "Market Briefing", icon: Coffee },
      { href: "/dashboard/news", label: "Financial News", icon: Newspaper },
      { href: "/dashboard/calendar", label: "Economic Calendar", icon: Calendar },
    ]
  },
  {
    title: "Practice",
    items: [
      { href: "/dashboard/risk", label: "Portfolio Risk", icon: ShieldAlert },
      { href: "/dashboard/trade-journal", label: "Trade Journal", icon: TrendingUp },
      { href: "/dashboard/strategy", label: "Trade Strategy", icon: Zap },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ]
  }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "#FFFFFF" }}>
      <div style={{ padding: "24px" }}>
        <Link href="/" style={{ fontSize: "24px", fontWeight: "900", color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          Suitance<span style={{ color: "#C9A84C" }}>.</span>
        </Link>
      </div>
      
      <nav style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: "32px", overflowY: "auto" }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ padding: "0 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.4)" }}>
              {group.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                      fontSize: "14px",
                      fontWeight: "500",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      backgroundColor: isActive ? "#C9A84C" : "transparent",
                      color: isActive ? "#0A1628" : "rgba(255, 255, 255, 0.7)"
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: "24px", marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div style={{ padding: "16px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#C9A84C" }}></div>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.4)" }}>Pro Status</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.3)", lineHeight: "1.6" }}>
            You have full access to global regulatory intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
