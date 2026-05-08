"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  FileText, Search, Mail, Map, Shield, Flag, TrendingUp, 
  BarChart3, Coffee, Calendar, ShieldAlert, Layout, 
  Bell, Zap, Newspaper, Users, Settings, Lock
} from "lucide-react";
import { SuitanceLogo } from "./suitance-logo";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  requiredPlan?: "plus" | "pro";
  requiredJurisdiction?: "uk" | "aus" | "usa";
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "REPORTS",
    items: [
      { href: "/dashboard", label: "Report Studio", icon: FileText, requiredJurisdiction: "uk" },
      { href: "/dashboard/soa-australia", label: "Australian SOA", icon: Map, requiredJurisdiction: "aus" },
      { href: "/dashboard/usa-plan", label: "USA Plan", icon: Flag, requiredJurisdiction: "usa" },
      { href: "/dashboard/templates", label: "Templates", icon: Layout },
    ]
  },
  {
    title: "INTELLIGENCE",
    items: [
      { href: "/dashboard/research", label: "Research", icon: Search },
      { href: "/dashboard/emails", label: "Emails", icon: Mail },
      { href: "/dashboard/compliance", label: "Compliance", icon: Shield, requiredPlan: "plus" },
      { href: "/dashboard/regulatory", label: "Regulatory", icon: Bell, requiredPlan: "plus" },
    ]
  },
  {
    title: "MARKETS",
    items: [
      { href: "/dashboard/markets", label: "Markets", icon: BarChart3, requiredPlan: "pro" },
      { href: "/dashboard/briefing", label: "Briefing", icon: Coffee, requiredPlan: "pro" },
      { href: "/dashboard/news", label: "News", icon: Newspaper, requiredPlan: "pro" },
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar, requiredPlan: "pro" },
    ]
  },
  {
    title: "PRACTICE",
    items: [
      { href: "/dashboard/risk", label: "Risk", icon: ShieldAlert, requiredPlan: "pro" },
      { href: "/dashboard/trade-journal", label: "Trade Journal", icon: TrendingUp, requiredPlan: "pro" },
      { href: "/dashboard/strategy", label: "Strategy", icon: Zap, requiredPlan: "pro" },
    ]
  },
  {
    title: "ACCOUNT",
    items: [
      { href: "/dashboard/team", label: "Team", icon: Users, requiredPlan: "pro" },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ]
  }
];

export function DashboardNav() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{ jurisdiction?: string, stripe_price_id?: string } | null>(null);

  useEffect(() => {
    async function getProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("jurisdiction, stripe_price_id")
          .eq("id", user.id)
          .single();
        setUserProfile(data);
      }
    }
    getProfile();
  }, []);

  const isPlus = userProfile?.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID;
  const isPro = userProfile?.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
  const jurisdiction = userProfile?.jurisdiction;

  const canAccess = (item: NavItem) => {
    // Pro gets everything
    if (isPro) return true;

    // Plus requirements
    if (item.requiredPlan === "plus") return isPlus;
    
    // Pro requirements (if item requires pro but user is not pro, they can't access)
    if (item.requiredPlan === "pro") return false;

    // Plus also gets all report generators regardless of jurisdiction
    if (isPlus && (item.requiredJurisdiction === "uk" || item.requiredJurisdiction === "aus" || item.requiredJurisdiction === "usa")) {
      return true;
    }

    // Starter jurisdiction gating
    if (item.requiredJurisdiction) {
      return jurisdiction === item.requiredJurisdiction;
    }

    return true;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", color: "#FFFFFF", overflowY: "hidden" }}>
      <div style={{ padding: "24px", flexShrink: 0 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <SuitanceLogo textColor="#FFFFFF" size={24} />
        </Link>
      </div>
      
      <nav style={{ flex: 1, padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: "28px", overflowY: "auto" }}>
        {navGroups.map((group) => {
          // Filter items to avoid showing duplicate or irrelevant jurisdiction items for Starter
          const visibleItems = group.items.filter(item => {
            if (isPlus || isPro) return true;
            if (item.requiredJurisdiction && jurisdiction !== item.requiredJurisdiction) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ padding: "0 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.4)" }}>
                {group.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const locked = !canAccess(item);
                  
                  return (
                    <Link
                      key={item.href}
                      href={locked ? "/pricing" : item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                        backgroundColor: isActive ? "rgba(201, 168, 76, 0.15)" : "transparent",
                        color: locked ? "rgba(255, 255, 255, 0.2)" : (isActive ? "#C9A84C" : "rgba(255, 255, 255, 0.6)"),
                        cursor: locked ? "pointer" : "default"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {locked && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ 
                            fontSize: "9px", 
                            backgroundColor: "rgba(201, 168, 76, 0.2)", 
                            color: "#C9A84C", 
                            padding: "2px 6px", 
                            borderRadius: "4px",
                            fontWeight: "700"
                          }}>UPGRADE</span>
                          <Lock size={12} />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: "20px", marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.05)", flexShrink: 0 }}>
        <div style={{ padding: "14px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#C9A84C" }}></div>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.4)" }}>
              {isPro ? "Pro Status" : (isPlus ? "Plus Status" : "Starter Status")}
            </span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.3)", lineHeight: "1.5" }}>
            {isPro ? "Full access to all tools." : (isPlus ? "Standard access unlocked." : "Basic jurisdiction tools.")}
          </p>
        </div>
      </div>
    </div>
  );
}
