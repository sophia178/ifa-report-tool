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
    <main className="landing-page min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#0a1628] text-white pt-8 pb-40 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl -mr-96 -mt-96 pointer-events-none"></div>
        <div className="shell relative">
          <TopNav email={user?.email} />
          
          <div className="mt-32 max-w-5xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-medium mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse"></span>
              The Operating System for Finance v2.4
            </div>
            <h1 className="display-large mb-8">
              The professional terminal for <br />
              <span className="text-gradient animate-gradient">financial professionals.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-12 body-large">
              Full regulatory coverage for UK, Australia, and USA. 
              Suitability reports, compliance checking, market intelligence, and portfolio risk analysis in one unified professional workspace.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <Link href={startHref} className="btn btn-gold h-14 px-8 text-lg font-bold">
                Get Started for Free
                <ArrowRight size={20} />
              </Link>
              <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#c9a84c]" /> FCA Aligned</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#c9a84c]" /> ASIC Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 bg-[#F4F6F9]">
        <div className="shell">
          <div className="text-center mb-24">
            <h2 className="display-medium mb-6">Built for the full advice lifecycle.</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              One unified platform that transforms rough evidence into professional-grade financial advice documentation in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card group hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-xl bg-[#0a1628]/5 flex items-center justify-center text-[#0a1628] mb-6 group-hover:bg-[#c9a84c] group-hover:text-white transition-all duration-300">
                  <feature.icon size={24} />
                </div>
                <h3 className="title-large mb-3">{feature.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-white">
        <div className="shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="stack gap-12">
              <h2 className="display-medium">Advice intelligence, <br />simplified.</h2>
              <div className="stack gap-8">
                {[
                  { step: "01", title: "Capture Data", desc: "Upload meeting audio or paste rough notes from your client meeting." },
                  { step: "02", title: "AI Analysis", desc: "Our models process the evidence against specific regulatory requirements." },
                  { step: "03", title: "Refine & Export", desc: "Review the generated report, make final tweaks, and export to professional Word doc." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-4xl font-black text-[#c9a84c]/20 tabular-nums">{item.step}</span>
                    <div className="stack gap-2">
                      <h4 className="text-xl font-bold">{item.title}</h4>
                      <p className="text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-[#0a1628] shadow-2xl overflow-hidden p-8">
                <div className="w-full h-full rounded-2xl bg-[#1e293b] border border-white/5 flex flex-col">
                  <div className="h-12 border-b border-white/5 flex items-center gap-2 px-6">
                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                  </div>
                  <div className="flex-1 p-8">
                    <div className="h-4 w-48 bg-white/10 rounded mb-6"></div>
                    <div className="stack gap-4">
                      <div className="h-2 w-full bg-white/5 rounded"></div>
                      <div className="h-2 w-full bg-white/5 rounded"></div>
                      <div className="h-2 w-3/4 bg-white/5 rounded"></div>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-4">
                      <div className="h-24 bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl"></div>
                      <div className="h-24 bg-white/5 border border-white/10 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-12 -left-12 p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-[280px] hidden lg:block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><CheckCircle2 size={20} /></div>
                  <span className="font-bold text-sm">FCA Validated</span>
                </div>
                <p className="text-xs text-gray-400">Section 21 of the FSMA 2000 compliant report generation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-32 bg-[#0a1628] text-white">
        <div className="shell">
          <div className="text-center mb-24">
            <h2 className="display-medium mb-6">Professional pricing for professional firms.</h2>
            <p className="text-gray-400">Choose the tier that matches your firm&apos;s regulatory scope.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "£19", desc: "Essential toolkit for UK IFAs.", accent: false },
              { name: "Plus", price: "£49", desc: "International scope and compliance.", accent: true },
              { name: "Pro", price: "£99", desc: "Full market intelligence terminal.", accent: false }
            ].map((tier, i) => (
              <div key={i} className={`p-12 rounded-3xl border ${tier.accent ? "border-[#c9a84c] bg-[#1e293b]" : "border-white/10 bg-white/5"} stack gap-8`}>
                <div className="stack gap-2">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{tier.price}</span>
                    <span className="text-gray-400 font-medium">/mo</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-4">{tier.desc}</p>
                </div>
                <Link href="/signup" className={`btn h-12 w-full font-bold ${tier.accent ? "btn-gold" : "bg-white text-[#0a1628]"}`}>
                  Start Free Trial
                </Link>
                <div className="stack gap-4 mt-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex items-center gap-3 text-sm text-gray-400">
                      <CheckCircle2 size={16} className="text-[#c9a84c]" />
                      <span>Feature inclusion {j}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
