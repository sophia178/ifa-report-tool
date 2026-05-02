"use client";

import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { LogOut, User, LayoutDashboard } from "lucide-react";

export function TopNav({ email }: { email?: string }) {
  return (
    <nav className="bg-slate-900 text-white flex items-center justify-between px-8 py-4 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md bg-slate-900/80 sticky top-4 z-50">
      <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
        Suitance<span className="text-yellow-500">.</span>
      </Link>
      
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
          <Link href="/#features" className="hover:text-white transition">Tools</Link>
          <Link href="/#pricing" className="hover:text-white transition">Pricing</Link>
          <Link href="/terms" className="hover:text-white transition">Compliance</Link>
        </div>

        {email ? (
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold border border-slate-700 transition"
            >
              <LayoutDashboard size={16} className="text-yellow-500" />
              Dashboard
            </Link>
            <div className="h-6 w-px bg-slate-800"></div>
            <form action={logout}>
              <button 
                type="submit" 
                className="text-slate-400 hover:text-red-400 transition"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold hover:text-yellow-500 transition">Log in</Link>
            <Link href="/signup" className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-yellow-400 transition">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
