"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  FileText, Search, Mail, Map, Shield, Flag, TrendingUp, 
  BarChart3, Coffee, Calendar, ShieldAlert, Layout, 
  Bell, Zap, Newspaper, Users, Settings, Lock, ExternalLink
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
  const [userProfile, setUserProfile] = useState<{ jurisdiction?: string } | null>(null);
  const [planTier, setPlanTier] = useState<"Starter" | "Plus" | "Pro" | "Unknown">("Starter");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    async function getProfileAndPlan() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile
        const { data } = await supabase
          .from("profiles")
          .select("jurisdiction")
          .eq("id", user.id)
          .single();
        setUserProfile(data);

        // Fetch plan from API to ensure consistent server-side check
        try {
          const res = await fetch('/api/user-plan');
          const planData = await res.json();
          if (planData.plan) {
            setPlanTier(planData.plan.charAt(0).toUpperCase() + planData.plan.slice(1));
          } else {
            // Safety net: default to Pro/Full access if API returns no plan but user is authenticated
            setPlanTier("Pro");
          }
        } catch (err) {
          console.error('Failed to fetch plan:', err);
          // Safety net: default to Pro/Full access on error
          setPlanTier("Pro");
        }
      }
    }
    getProfileAndPlan();
  }, []);

  // Optimistic safety net: If plan is "Unknown" or failed to fetch, treat as Pro
  const isPlus = planTier === "Plus" || planTier === "Pro";
  const isPro = planTier === "Pro";
  const jurisdiction = userProfile?.jurisdiction || "uk";

  const canAccess = (item: NavItem) => {
    // Safety net: if Pro (or fallback to Pro), unlock everything
    if (isPro) return true;
    
    // Plus get all report generators
    if (isPlus && (item.requiredJurisdiction === "uk" || item.requiredJurisdiction === "aus" || item.requiredJurisdiction === "usa")) {
      return true;
    }

    if (item.requiredPlan === "plus") return isPlus;
    if (item.requiredPlan === "pro") return false;

    if (item.requiredJurisdiction) {
      return jurisdiction === item.requiredJurisdiction;
    }

    return true;
  };

  const getJurisdictionInfo = () => {
    switch (jurisdiction) {
      case "uk": return { name: "United Kingdom", flag: "🇬🇧" };
      case "aus": return { name: "Australia", flag: "🇦🇺" };
      case "usa": return { name: "United States", flag: "🇺🇸" };
      default: return { name: "United Kingdom", flag: "🇬🇧" };
    }
  };

  const jurInfo = getJurisdictionInfo();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", color: "#FFFFFF", overflowY: "hidden", backgroundColor: "#0A1628" }}>
      <div style={{ padding: "24px", flexShrink: 0 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <SuitanceLogo textColor="#FFFFFF" size={24} />
        </Link>
      </div>
      
      <nav style={{ flex: 1, padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: "28px", overflowY: "auto" }}>
        {navGroups.map((group) => {
          const filteredItems = group.items.filter(item => {
            if (isPlus || isPro) return true;
            if (item.requiredJurisdiction && jurisdiction !== item.requiredJurisdiction) return false;
            return true;
          });

          if (filteredItems.length === 0) return null;

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
                  
                  // Hide irrelevant jurisdiction tools for Starter
                  if (!isPlus && !isPro && item.requiredJurisdiction && jurisdiction !== item.requiredJurisdiction) {
                    return null;
                  }

                  return (
                    <Link
                      key={item.href}
                      href={locked ? "/pricing?message=upgrade" : item.href}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "500",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                        backgroundColor: isActive ? "rgba(201, 168, 76, 0.15)" : (hoveredItem === item.href ? "rgba(255, 255, 255, 0.05)" : "transparent"),
                        color: locked ? "rgba(255, 255, 255, 0.2)" : (isActive ? "#C9A84C" : "rgba(255, 255, 255, 0.7)"),
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {locked && (
                        <Lock size={12} style={{ opacity: 0.5 }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Status Badge */}
      <div style={{ 
        padding: "20px 16px", 
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        backgroundColor: "rgba(0, 0, 0, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)" }}></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>{planTier} Status</span>
            <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: "4px" }}>
              {jurInfo.flag} {jurInfo.name}
            </span>
          </div>
        </div>
        {planTier === "Starter" && (
          <Link href="/pricing" style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px", 
            fontSize: "11px", 
            color: "#C9A84C", 
            textDecoration: "none", 
            fontWeight: "600",
            padding: "8px 12px",
            backgroundColor: "rgba(201, 168, 76, 0.1)",
            borderRadius: "6px",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(201, 168, 76, 0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(201, 168, 76, 0.1)")}
          >
            Upgrade for more tools <ExternalLink size={10} />
          </Link>
        )}
      </div>
    </div>
  );
}
