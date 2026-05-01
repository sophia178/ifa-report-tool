"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, Search, Mail, Map, Shield, Flag, TrendingUp, 
  BarChart3, Coffee, Calendar, ShieldAlert, Layout, 
  Bell, Zap, Newspaper, Users, Settings, Briefcase, 
  Target, ClipboardList
} from "lucide-react";
import { clsx } from "clsx";

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
    <aside className="dashboard-sidebar">
      <div className="sidebar-logo">
        Suitance<span className="text-[#c9a84c]">.</span>
      </div>
      
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="stack gap-2">
            <div className="sidebar-group-title">{group.title}</div>
            <div className="stack gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx("sidebar-item", isActive && "active")}
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

      <div className="mt-auto p-6 border-t border-white/5">
        <div className="p-4 bg-white/5 rounded-xl border border-white/5 stack gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c9a84c]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Pro Status</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            You have full access to global regulatory intelligence.
          </p>
        </div>
      </div>
    </aside>
  );
}

