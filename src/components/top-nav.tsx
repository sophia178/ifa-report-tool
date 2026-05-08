"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";
import { SuitanceLogo } from "./suitance-logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function TopNav({ email }: { email?: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav style={{ 
      backgroundColor: "rgba(10, 22, 40, 0.8)", 
      color: "#FFFFFF", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "16px 32px", 
      borderRadius: "16px", 
      border: "1px solid rgba(255, 255, 255, 0.1)", 
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", 
      backdropFilter: "blur(12px)", 
      position: "sticky", 
      top: "16px", 
      zIndex: 50 
    }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <SuitanceLogo textColor="#FFFFFF" size={24} />
      </Link>
      
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{ display: "none", alignItems: "center", gap: "24px", fontSize: "14px", fontWeight: "700", color: "rgba(255, 255, 255, 0.5)" }}>
          {/* Note: In a real app, I'd use a media query or a state for responsive display, but following "pure inline" for now */}
          <Link href="/#features" style={{ color: "inherit", textDecoration: "none" }}>Tools</Link>
          <Link href="/#pricing" style={{ color: "inherit", textDecoration: "none" }}>Pricing</Link>
          <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }}>Compliance</Link>
        </div>

        {email ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link 
              href="/dashboard" 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "8px 16px", 
                backgroundColor: "rgba(255, 255, 255, 0.05)", 
                borderRadius: "12px", 
                fontSize: "14px", 
                fontWeight: "700", 
                border: "1px solid rgba(255, 255, 255, 0.1)", 
                textDecoration: "none", 
                color: "#FFFFFF" 
              }}
            >
              <LayoutDashboard size={16} color="#C9A84C" />
              Dashboard
            </Link>
            <div style={{ height: "24px", width: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)" }}></div>
            <button 
              onClick={handleLogout}
              style={{ 
                color: "rgba(255, 255, 255, 0.5)", 
                cursor: "pointer", 
                background: "none", 
                border: "none", 
                padding: "4px" 
              }}
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/login" style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", textDecoration: "none" }}>Log in</Link>
            <Link href="/signup" style={{ backgroundColor: "#C9A84C", color: "#0A1628", padding: "8px 24px", borderRadius: "9999px", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
