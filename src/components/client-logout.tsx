"use client";

import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function ClientLogout() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button 
      onClick={handleLogout}
      style={{ 
        padding: "8px", 
        color: "#8A94A6", 
        cursor: "pointer", 
        background: "none", 
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      title="Sign out"
    >
      <LogOut size={20} />
    </button>
  );
}
