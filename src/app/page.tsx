import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { 
  ShieldCheck, Globe, Bell, Zap, ArrowRight, CheckCircle2, FileText, 
  Search, Mail, Map, Shield, Flag, TrendingUp, BarChart3, Coffee, 
  Calendar, ShieldAlert, Users, Newspaper, Layout, MessageSquare,
  Lock, PieChart, LineChart, Target, ClipboardList, Briefcase
} from "lucide-react";

const features = [
  { name: "FCA Suitability Reports", icon: FileText, desc: "FCA-compliant reports generated from meeting notes." },
  { name: "Research Summariser", icon: Search, desc: "Quickly digest complex fund and market research." },
  { name: "Email Drafter", icon: Mail, desc: "Professional client communications in your tone of voice." },
  { name: "Australian SOA", icon: Map, desc: "Full Statement of Advice generation for ASIC compliance." },
  { name: "USA Financial Plans", icon: Flag, desc: "Comprehensive planning tools for US-based advisers." },
  { name: "Compliance Checker", icon: Shield, desc: "Automated regulatory risk assessment for documents." },
  { name: "Regulatory Alerts", icon: Bell, desc: "Stay ahead of FCA, ASIC, and SEC rule changes." },
  { name: "Markets Terminal", icon: BarChart3, desc: "Real-time global market data and analytics." },
  { name: "Market Briefings", icon: Coffee, desc: "Daily summaries of key market moving events." },
  { name: "Financial News", icon: Newspaper, desc: "Curated news feed from top financial sources." },
  { name: "Economic Calendar", icon: Calendar, desc: "Never miss a key economic data release." },
  { name: "Portfolio Risk", icon: ShieldAlert, desc: "Deep-dive analysis into client portfolio risk." },
  { name: "Team Management", icon: Users, desc: "Collaborative workspaces for multi-adviser firms." },
  { name: "Strategy Builder", icon: Zap, desc: "Backtest and document complex trading strategies." },
  { name: "Meeting Transcriber", icon: MessageSquare, desc: "Convert meeting audio to text for analysis." },
  { name: "Secure Vault", icon: Lock, desc: "Military-grade encryption for client evidence." },
  { name: "Portfolio Rebalancing", icon: PieChart, desc: "Automated drift analysis and rebalancing logic." }
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const startHref = user ? (isSubscribed ? "/dashboard" : "/pricing") : "/signup";

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white pt-8 pb-40 overflow-hidden relative">
        <div className="container mx-auto px-4 relative">
          <TopNav email={user?.email} />
          
          <div className="mt-32 max-w-5xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              The Operating System for Finance v2.4
            </div>
            <h1 className="text-6xl font-black text-white mb-8 leading-tight">
              The professional terminal for <br />
              <span className="text-yellow-500">financial professionals.</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mb-12">
              Full regulatory coverage for UK, Australia, and USA. 
              Suitability reports, compliance checking, market intelligence, and portfolio risk analysis in one unified professional workspace.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <Link href={startHref} className="bg-yellow-500 text-slate-900 font-bold px-8 py-4 rounded-full hover:bg-yellow-400 transition flex items-center gap-3 text-lg">
                Get Started for Free
                <ArrowRight size={20} />
              </Link>
              <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-yellow-500" /> FCA Aligned</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-yellow-500" /> ASIC Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Built for the full advice lifecycle.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              One unified platform that transforms rough evidence into professional-grade financial advice documentation in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 mb-6 group-hover:bg-yellow-500 group-hover:text-slate-900 transition-colors">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <h2 className="text-4xl font-black text-slate-900">Advice intelligence, simplified.</h2>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Capture Data", desc: "Upload meeting audio or paste rough notes from your client meeting." },
                  { step: "02", title: "AI Analysis", desc: "Our models process the evidence against specific regulatory requirements." },
                  { step: "03", title: "Refine & Export", desc: "Review the generated report, make final tweaks, and export to professional Word doc." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-4xl font-black text-yellow-500/20 tabular-nums">{item.step}</span>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
              <div className="w-full h-full rounded-2xl bg-slate-800 border border-slate-700 flex flex-col min-h-[400px]">
                <div className="h-12 border-b border-slate-700 flex items-center gap-2 px-6">
                  <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                </div>
                <div className="flex-1 p-8">
                  <div className="h-4 w-48 bg-slate-700 rounded mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-slate-700/50 rounded"></div>
                    <div className="h-2 w-full bg-slate-700/50 rounded"></div>
                    <div className="h-2 w-3/4 bg-slate-700/50 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black mb-6">Professional pricing for professional firms.</h2>
            <p className="text-slate-400">Choose the tier that matches your firm&apos;s regulatory scope.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "£19", desc: "Essential toolkit for UK IFAs.", accent: false },
              { name: "Plus", price: "£49", desc: "International scope and compliance.", accent: true },
              { name: "Pro", price: "£99", desc: "Full market intelligence terminal.", accent: false }
            ].map((tier, i) => (
              <div key={i} className={`p-12 rounded-3xl border ${tier.accent ? "border-yellow-500 bg-slate-800" : "border-slate-800 bg-slate-800/50"} flex flex-col gap-8`}>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{tier.price}</span>
                    <span className="text-slate-400 font-medium">/mo</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">{tier.desc}</p>
                </div>
                <Link href="/signup" className={`py-4 w-full text-center font-bold rounded-full transition ${tier.accent ? "bg-yellow-500 text-slate-900" : "bg-white text-slate-900"}`}>
                  Start Free Trial
                </Link>
                <div className="space-y-4 mt-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex items-center gap-3 text-sm text-slate-400">
                      <CheckCircle2 size={16} className="text-yellow-500" />
                      <span>Feature inclusion {j}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-2xl font-black text-slate-900">Suitance<span className="text-yellow-500">.</span></div>
          <div className="flex gap-10 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </div>
          <div className="text-sm text-slate-400">© 2026 Suitance Intelligence. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
