import { DashboardNav } from "@/components/dashboard-nav";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/auth/actions";
import { LogOut, User, Bell, Search, Settings } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div className="dashboard-container">
      <DashboardNav />
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="flex items-center gap-8">
            <h1 className="title-large text-[#0a1628]">Workspace</h1>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#F4F6F9] rounded-lg border border-gray-100 text-gray-400">
              <Search size={14} />
              <span className="text-xs font-medium">Search tools, clients, or data...</span>
              <span className="ml-4 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-400">⌘K</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-[#0a1628] hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
            
            <div className="h-8 w-px bg-gray-100 mx-2"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="stack gap-0 text-right hidden sm:grid">
                <span className="text-sm font-bold text-[#0a1628] leading-tight truncate max-w-[150px]">
                  {user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                  Principal Adviser
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center text-[#c9a84c] font-bold shadow-lg shadow-[#0a1628]/10 border border-white/10">
                {user.email?.[0].toUpperCase()}
              </div>
              
              <form action={logout}>
                <button 
                  type="submit" 
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="dashboard-content fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

