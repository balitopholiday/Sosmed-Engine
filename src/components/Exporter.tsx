import React from "react";
import { ContentPlan, DailyInsight, Campaign } from "../types";
import { Download, FileSpreadsheet, FileText, Printer, CheckCircle } from "lucide-react";

interface ExporterProps {
  plans: ContentPlan[];
  dailyInsights: DailyInsight[];
  campaigns: Campaign[];
  isInstagramOnly?: boolean;
}

export default function Exporter({ plans, dailyInsights, campaigns, isInstagramOnly }: ExporterProps) {
  
  // 1. Export Content Plans to CSV Spreadsheet
  const exportPlansToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "ID,Judul Konten,Platform,Tanggal,Waktu,Status,Kategori,Tipe Media,Catatan Tim\n";
    
    // Rows
    const targetPlans = plans.filter(plan => !isInstagramOnly || plan.platform === "instagram");
    targetPlans.forEach((plan) => {
      const row = [
        plan.id,
        `"${plan.title.replace(/"/g, '""')}"`,
        plan.platform,
        plan.date,
        plan.time,
        plan.status,
        plan.category,
        plan.mediaType,
        `"${(plan.notes || "").replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Content_Planning_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Daily Insights to CSV Spreadsheet
  const exportInsightsToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "Tanggal,Platform,Total Followers,Reach,Impressions,Likes,Comments,Shares,Saves,Engagement Rate (%)\n";
    
    // Rows
    const targetInsights = dailyInsights.filter(item => !isInstagramOnly || item.platform === "instagram");
    targetInsights.forEach((item) => {
      const row = [
        item.date,
        item.platform,
        item.followers,
        item.reach,
        item.impressions,
        item.likes,
        item.comments,
        item.shares,
        item.saves,
        item.engagementRate
      ].join(",");
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daily_Insights_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Trigger Print-Friendly PDF Generator
  const triggerPrintPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6" id="exporter-widget">
      <div className="border-b border-slate-200/60 pb-4 mb-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display tracking-tight">
          <Download className="h-4 w-4 text-indigo-600" />
          <span>Ekspor Laporan & Presentasi</span>
        </h2>
        <p className="text-xs text-slate-500">Konversikan perencanaan konten dan data analitik performa ke format CSV / PDF secara instan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Content Plans Card */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:bg-indigo-50/10 hover:shadow-2xs transition-all text-center flex flex-col justify-between h-full">
          <div className="space-y-2 mb-4">
            <div className="p-3 bg-indigo-50/60 text-indigo-700 rounded-xl w-fit mx-auto shadow-3xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">Draf Content Planning</h3>
            <p className="text-[10px] text-slate-400 leading-normal font-sans">Unduh seluruh tabel jadwal postingan kalender ke format CSV Spreadsheet Microsoft Excel.</p>
          </div>
          <button
            onClick={exportPlansToCSV}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs h-10"
          >
            <span>Ekspor Kalender Konten (.csv)</span>
          </button>
        </div>

        {/* CSV Daily Analytics Card */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:border-pink-200 hover:bg-pink-50/10 hover:shadow-2xs transition-all text-center flex flex-col justify-between h-full">
          <div className="space-y-2 mb-4">
            <div className="p-3 bg-pink-50/60 text-pink-700 rounded-xl w-fit mx-auto shadow-3xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">Data Insights Harian</h3>
            <p className="text-[10px] text-slate-400 leading-normal font-sans">Ekspor metrik harian (jangkauan, followers, interaksi) untuk diolah di tools BI eksternal.</p>
          </div>
          <button
            onClick={exportInsightsToCSV}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs h-10"
          >
            <span>Ekspor Insights Harian (.csv)</span>
          </button>
        </div>

        {/* Print / Export to PDF Card */}
        <div className="border border-slate-200 rounded-2xl p-5 hover:border-amber-200 hover:bg-amber-50/10 hover:shadow-2xs transition-all text-center flex flex-col justify-between h-full">
          <div className="space-y-2 mb-4">
            <div className="p-3 bg-amber-50/60 text-amber-700 rounded-xl w-fit mx-auto shadow-3xs">
              <Printer className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">Cetak Presentasi PDF</h3>
            <p className="text-[10px] text-slate-400 leading-normal font-sans">Gunakan layout cetak yang rapi untuk menyimpan dashboard ke format PDF atau cetak secara fisik.</p>
          </div>
          <button
            onClick={triggerPrintPDF}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs h-10"
          >
            <span>Cetak / Ekspor PDF Instan</span>
          </button>
        </div>
      </div>

      {/* Printable CSS Helper Warning */}
      <div className="mt-4 p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex items-start gap-2 text-[10px] text-slate-500 font-sans">
        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="leading-relaxed">
          <strong>Tip Presentasi:</strong> Tombol "Cetak / Ekspor PDF" akan memicu fungsi cetak browser Anda. Seluruh komponen grafik, tabel kampanye, dan analisis diagnosis sudah dioptimasi khusus untuk format cetak kertas landscape/portrait yang elegan.
        </p>
      </div>
    </div>
  );
}
