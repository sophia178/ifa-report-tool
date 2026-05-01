import { ReportStudio } from "@/components/report-studio";
import { requireUser } from "@/lib/auth";
import { checkSubscription } from "@/lib/subscription";
import type { Report } from "@/types/report";
import { redirect } from "next/navigation";
import { Info, Plus, FileText, Download } from "lucide-react";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const isSubscribed = await checkSubscription(user.id);

  if (!isSubscribed) {
    redirect("/pricing?message=subscribe");
  }

  const { data } = await supabase
    .from("reports")
    .select("id, client_name, created_at, report_text")
    .order("created_at", { ascending: false });

  const reports: Report[] = (data ?? []).map((report) => ({
    id: report.id,
    client_name: report.client_name,
    created_at: report.created_at,
    content: report.report_text,
  }));

  return (
    <div className="stack gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="stack gap-2">
          <h2 className="display-medium text-[#0a1628]">Report Studio</h2>
          <p className="text-gray-500 body-large">
            Transform meeting notes into FCA-compliant suitability reports.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center gap-4">
            <div className="stack gap-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Plan</span>
              <span className="text-sm font-bold text-[#0a1628]">Plus Professional</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
          </div>
        </div>
      </div>

      <div className="card bg-[#0a1628] border-none text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative flex items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] shrink-0">
            <Info size={24} />
          </div>
          <div className="stack gap-2">
            <h4 className="title-large text-white">Regulatory Compliance Notice</h4>
            <p className="text-gray-400 leading-relaxed max-w-4xl">
              Suitance is a professional drafting tool for FCA-authorised advisers. All generated reports 
              must be reviewed, amended where necessary, and approved by a qualified adviser before client delivery. 
              The platform does not provide regulated advice.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ReportStudio reports={reports} />
      </div>
    </div>
  );
}

