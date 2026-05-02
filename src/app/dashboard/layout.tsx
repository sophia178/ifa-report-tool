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
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="bg-slate-900 w-60 min-h-screen fixed left-0 top-0 z-50 overflow-y-auto">
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-slate-900">Workspace</h1>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-400">
              <Search size={14} />
              <span className="text-xs font-medium">Search tools...</span>
              <span className="ml-4 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-400">⌘K</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:grid text-right">
                <span className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                  {user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Principal Adviser
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-yellow-500 font-bold border border-slate-800">
                {user.email?.[0].toUpperCase()}
              </div>
              
              <form action={logout}>
                <button 
                  type="submit" 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut size={20} />
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}


