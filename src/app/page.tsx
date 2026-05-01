import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { checkSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";
import { 
  ShieldCheck, 
  Globe, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Search, 
  Mail, 
  Map, 
  Shield, 
  Flag, 
  TrendingUp, 
  BarChart3, 
  Coffee, 
  Calendar, 
  ShieldAlert 
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSubscribed = user ? await checkSubscription(user.id) : false;
  const startHref = user ? (isSubscribed ? "/dashboard" : "/pricing") : "/signup";

  return (
    <main className="landing-page min-h-screen bg-[#f8f6f1]">
      {/* Hero Section */}
      <section className="bg-[#0a1628] text-[#f8f6f1] pb-32">
        <div className="shell">
          <TopNav email={user?.email} />
          
          <div className="mt-24 max-w-4xl">
            <span className="inline-block px-3 py-1 rounded-full bg-[#c1a362]/20 text-[#c1a362] text-xs font-bold uppercase tracking-widest mb-6">
              Platform v2.0 Live
            </span>
            <h1 className="text-6xl md:text-7xl font-bold leading-[1.1] mb-8">
              The complete operating system for <span className="text-[#c1a362]">financial professionals.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
              Full regulatory coverage for UK, Australia, and USA. 
              Suitability reports, compliance checking, market intelligence, and portfolio risk analysis in one unified professional workspace.
            </p>
            <div className="flex flex-wrap gap-6 items-center">
              <Link href={startHref} className="btn h-14 px-8 flex items-center gap-3 text-lg">
                Get Started for £19/mo
                <ArrowRight size={20} />
              </Link>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Globe size={16} />
                Global regulatory standards
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="bg-white border-y border-gray-100 py-10">
        <div className="shell flex flex-wrap justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-[#0a1628]">96/100</div>
            <div className="text-sm text-gray-500 leading-tight">
              Compliance score from <br /> independent assessment
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-green-600" size={32} />
            <div className="text-lg font-semibold text-[#0a1628]">FCA Consumer Duty aligned</div>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-500">Trusted by 500+ advice firms</div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-32 shell">
        <div className="text-center mb-20 stack gap-4">
          <h2 className="text-4xl font-bold text-[#0a1628]">Built for the full advice lifecycle.</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            One platform that covers everything from initial research to final report generation and ongoing market monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="card p-8 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#c1a362]/10 flex items-center justify-center text-[#c1a362] mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-sm text-gray-500 mb-8">The essential toolkit for UK-based independent advisers.</p>
            <ul className="stack gap-4">
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <FileText size={16} className="text-[#c1a362]" /> UK FCA Suitability Reports
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Search size={16} className="text-[#c1a362]" /> Research Summariser
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Mail size={16} className="text-[#c1a362]" /> Client Email Drafter
              </li>
            </ul>
          </div>

          {/* Plus */}
          <div className="card p-8 bg-[#0a1628] text-white border border-[#c1a362]/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#c1a362] bg-[#c1a362]/10 px-2 py-1 rounded border border-[#c1a362]/20">Most Popular</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#c1a362] flex items-center justify-center text-white mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Plus</h3>
            <p className="text-sm text-gray-400 mb-8">Advanced tools for international advice and compliance.</p>
            <ul className="stack gap-4">
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Map size={16} className="text-[#c1a362]" /> Australian SOA Generator
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Flag size={16} className="text-[#c1a362]" /> USA Financial Plan Generator
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-300">
                <Shield size={16} className="text-[#c1a362]" /> Compliance Checker
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="card p-8 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#0a1628]/5 flex items-center justify-center text-[#0a1628] mb-6">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <p className="text-sm text-gray-500 mb-8">Total market intelligence and portfolio risk control.</p>
            <ul className="stack gap-4">
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <BarChart3 size={16} className="text-[#0a1628]" /> Live Market Dashboard
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Coffee size={16} className="text-[#0a1628]" /> AI Market Briefing
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <Calendar size={16} className="text-[#0a1628]" /> Economic Calendar
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <ShieldAlert size={16} className="text-[#0a1628]" /> Portfolio Risk Analyser
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-700">
                <TrendingUp size={16} className="text-[#0a1628]" /> AI Trade Journal
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 bg-gray-50 border-y border-gray-100">
        <div className="shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="stack gap-12">
              <div className="stack gap-4">
                <span className="text-[#c1a362] font-bold uppercase tracking-widest text-xs">Efficiency First</span>
                <h2 className="text-4xl font-bold text-[#0a1628]">Draft a report in 60 seconds.</h2>
              </div>
              
              <div className="stack gap-10">
                <div className="flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-[#0a1628] text-white flex items-center justify-center shrink-0 font-bold">1</div>
                  <div className="stack gap-2">
                    <h4 className="font-bold text-[#0a1628]">Paste meeting notes or audio</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Simply paste your rough notes or upload a recording. Suitance handles the rest.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-[#0a1628] text-white flex items-center justify-center shrink-0 font-bold">2</div>
                  <div className="stack gap-2">
                    <h4 className="font-bold text-[#0a1628]">AI generates the professional draft</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Our regulatory-tuned models organize your evidence into a compliant, structured report.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-10 h-10 rounded-full bg-[#0a1628] text-white flex items-center justify-center shrink-0 font-bold">3</div>
                  <div className="stack gap-2">
                    <h4 className="font-bold text-[#0a1628]">Download and send</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">Export as a polished Word document, ready for final review and client signature.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#0a1628] rounded-3xl p-8 shadow-2xl transform lg:rotate-3">
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-700 rounded animate-pulse"></div>
                  <div className="pt-8 flex justify-between">
                    <div className="h-8 w-32 bg-[#c1a362]/20 rounded border border-[#c1a362]/20"></div>
                    <div className="h-8 w-8 bg-[#c1a362] rounded"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <CheckCircle2 className="text-green-500" />
                  <span className="font-bold text-[#0a1628]">FCA Aligned</span>
                </div>
                <div className="text-xs text-gray-400 leading-tight">Consumer Duty sections <br />included by default.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 shell text-center">
        <div className="max-w-3xl mx-auto stack gap-10">
          <h2 className="text-5xl font-bold text-[#0a1628]">Ready to upgrade your practice?</h2>
          <p className="text-gray-500 text-lg">
            Join hundreds of advisers who have reclaimed their afternoons. 
            Start today with our Starter plan and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={startHref} className="btn h-14 px-12 text-lg">
              Get Started Now
            </Link>
            <Link href="/pricing" className="btn-secondary h-14 px-12 text-lg">
              View All Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-20">
        <div className="shell">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="stack gap-6 max-w-sm">
              <div className="text-2xl font-bold text-[#0a1628]">Suitance</div>
              <p className="text-sm text-gray-500 leading-relaxed">
                The world-class operating system for modern financial advisers, paraplanners, and wealth managers.
                Built for professional grade accuracy and regulatory compliance.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-20">
              <div className="stack gap-6">
                <h5 className="font-bold text-[#0a1628]">Platform</h5>
                <ul className="stack gap-3 text-sm text-gray-500">
                  <li><Link href="/pricing" className="hover:text-[#c1a362]">Pricing</Link></li>
                  <li><Link href="/dashboard" className="hover:text-[#c1a362]">Dashboard</Link></li>
                  <li><Link href="/login" className="hover:text-[#c1a362]">Log In</Link></li>
                </ul>
              </div>
              <div className="stack gap-6">
                <h5 className="font-bold text-[#0a1628]">Legal</h5>
                <ul className="stack gap-3 text-sm text-gray-500">
                  <li><Link href="/terms" className="hover:text-[#c1a362]">Terms of Use</Link></li>
                  <li><Link href="/privacy" className="hover:text-[#c1a362]">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xs text-gray-400">© 2026 Suitance. suitance.co.uk</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Built for financial professionals worldwide
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
