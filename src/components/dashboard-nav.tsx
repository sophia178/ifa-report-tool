"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Search, Mail, Map, Shield, Flag, TrendingUp, BarChart3, Coffee, Calendar, ShieldAlert, Layout, Bell, Zap, Newspaper, Users, Settings } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Report Generator", icon: FileText },
  { href: "/dashboard/templates", label: "Templates", icon: Layout },
  { href: "/dashboard/research", label: "Research Summariser", icon: Search },
  { href: "/dashboard/emails", label: "Email Drafter", icon: Mail },
  { href: "/dashboard/soa-australia", label: "Australian SOA", icon: Map },
  { href: "/dashboard/compliance", label: "Compliance Checker", icon: Shield },
  { href: "/dashboard/usa-plan", label: "USA Plan", icon: Flag },
  { href: "/dashboard/trade-journal", label: "Trade Journal", icon: TrendingUp },
  { href: "/dashboard/strategy", label: "Trade Strategy", icon: Zap },
  { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
  { href: "/dashboard/briefing", label: "Market Briefing", icon: Coffee },
  { href: "/dashboard/calendar", label: "Economic Calendar", icon: Calendar },
  { href: "/dashboard/risk", label: "Portfolio Risk", icon: ShieldAlert },
  { href: "/dashboard/regulatory", label: "Regulatory Alerts", icon: Bell },
  { href: "/dashboard/news", label: "Financial News", icon: Newspaper },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-nav">
      <div className="nav-group">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("nav-item", isActive && "active")}
            >
              <Icon className="icon" size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
