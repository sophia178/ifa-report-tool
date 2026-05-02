"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, Search, Mail, Map, Shield, Flag, TrendingUp, 
  BarChart3, Coffee, Calendar, ShieldAlert, Layout, 
  Bell, Zap, Newspaper, Users, Settings, Briefcase, 
  Target, ClipboardList, Home
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
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="text-2xl font-black text-white flex items-center gap-2">
          Suitance<span className="text-yellow-500">.</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-yellow-500 text-slate-900" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
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

      <div className="p-6 mt-auto border-t border-slate-800">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pro Status</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            You have full access to global regulatory intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}


