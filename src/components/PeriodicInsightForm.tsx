import React, { useState, useEffect } from "react";
import { PeriodicInsight, DailyInsight } from "../types";
import { Plus, Check, BookOpen, AlertCircle, FileText, Sparkles } from "lucide-react";

interface PeriodicInsightFormProps {
  onAddPeriodicInsight: (insight: Partial<PeriodicInsight>) => Promise<void>;
  dailyInsights?: DailyInsight[];
  isInstagramOnly?: boolean;
}

export default function PeriodicInsightForm({ onAddPeriodicInsight, dailyInsights = [], isInstagramOnly }: PeriodicInsightFormProps) {
  const [month, setMonth] = useState("2026-07");
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");

  useEffect(() => {
    if (isInstagramOnly) {
      setPlatform("instagram");
    }
  }, [isInstagramOnly]);
  const [totalReach, setTotalReach] = useState("");
  const [totalEngagement, setTotalEngagement] = useState("");
  const [avgEngagementRate, setAvgEngagementRate] = useState("");
  
  const [topPost1, setTopPost1] = useState("");
  const [topPost2, setTopPost2] = useState("");
  const [topPost3, setTopPost3] = useState("");
  
  const [analysis, setAnalysis] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Helper to generate Indonesian diagnosis and analysis text based on performance stats
  const generateAutoAnalysis = (reach: number, engagement: number, er: number): string => {
    if (reach <= 0) {
      return "Belum ada data harian pendukung untuk dianalisis. Silakan masukkan data jangkauan dan interaksi harian terlebih dahulu agar sistem dapat mendiagnosis performa bulanan secara otomatis.";
    }
    const safeEr = Number(er.toFixed(2));
    if (safeEr > 10) {
      return `Performa bulan ini luar biasa dengan rata-rata Engagement Rate mencapai ${safeEr}%. Jangkauan (reach) sebesar ${reach.toLocaleString("id-ID")} sangat efektif dalam menghasilkan ${engagement.toLocaleString("id-ID")} total interaksi. Konten Anda sangat diminati audiens. Rekomendasi: Lanjutkan format konten utama dan tingkatkan frekuensi posting di jam sibuk.`;
    } else if (safeEr >= 5) {
      return `Performa bulan ini cukup stabil dengan rata-rata Engagement Rate ${safeEr}%. Total jangkauan mencapai ${reach.toLocaleString("id-ID")} dengan total interaksi ${engagement.toLocaleString("id-ID")}. Rekomendasi: Lakukan variasi topik ringan serta tingkatkan interaksi di kolom komentar untuk mendorong ER ke angka >10%.`;
    } else {
      return `Keterlibatan (Engagement Rate) bulan ini sebesar ${safeEr}% masih tergolong rendah dari target. Walaupun jangkauan sebesar ${reach.toLocaleString("id-ID")} memadai, interaksi (${engagement.toLocaleString("id-ID")}) masih minim. Rekomendasi: Evaluasi call-to-action (CTA) pada caption dan tingkatkan kualitas visual konten agar memicu likes, shares, dan saves.`;
    }
  };

  // Automatically calculate monthly stats from daily insights matching the month & platform
  useEffect(() => {
    const matching = dailyInsights.filter(
      (d) => d.platform === platform && d.date.startsWith(month)
    );

    if (matching.length > 0) {
      const sumReach = matching.reduce((sum, d) => sum + (d.reach || 0), 0);
      const sumEngagement = matching.reduce(
        (sum, d) => sum + ((d.likes || 0) + (d.comments || 0) + (d.shares || 0) + (d.saves || 0)),
        0
      );
      const calculatedER = sumReach > 0 ? (sumEngagement / sumReach) * 100 : 0;

      setTotalReach(sumReach.toString());
      setTotalEngagement(sumEngagement.toString());
      setAvgEngagementRate(calculatedER.toFixed(2));
    } else {
      setTotalReach("");
      setTotalEngagement("");
      setAvgEngagementRate("");
    }
  }, [month, platform, dailyInsights]);

  // Automatically update the analysis when stats change
  useEffect(() => {
    const reachNum = Number(totalReach);
    const engNum = Number(totalEngagement);
    const erNum = Number(avgEngagementRate) || (reachNum > 0 ? (engNum / reachNum) * 100 : 0);

    setAnalysis(generateAutoAnalysis(reachNum, engNum, erNum));
  }, [totalReach, totalEngagement, avgEngagementRate]);

  const matchingCount = dailyInsights.filter(
    (d) => d.platform === platform && d.date.startsWith(month)
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !totalReach || !totalEngagement) return;

    const combinedTopPosts = [topPost1.trim(), topPost2.trim(), topPost3.trim()]
      .filter(Boolean)
      .map((post, idx) => `${idx + 1}. ${post}`)
      .join("\n");

    await onAddPeriodicInsight({
      month,
      platform,
      totalReach: Number(totalReach),
      totalEngagement: Number(totalEngagement),
      avgEngagementRate: Number(avgEngagementRate) || 0,
      topPerformingPost: combinedTopPosts,
      analysis
    });

    setIsSuccess(true);
    // Reset fields except month & platform
    setTotalReach("");
    setTotalEngagement("");
    setAvgEngagementRate("");
    setTopPost1("");
    setTopPost2("");
    setTopPost3("");
    setAnalysis("");

    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6" id="periodic-insight-form">
      <div className="border-b border-slate-200/60 pb-4 mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight font-display">Input Insight Periodik (Bulanan)</h2>
          <p className="text-xs text-slate-500">Buat rangkuman analitik bulanan lengkap untuk memantau performa jangka panjang secara akurat.</p>
        </div>
        {isSuccess && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-bounce">
            <Check className="h-3 w-3" />
            <span>Insight Bulanan Tersimpan</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Automatic Conversion Alert Banner */}
        {matchingCount > 0 ? (
          <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-800 rounded-xl p-3.5 text-xs flex items-start gap-2.5 shadow-3xs">
            <Sparkles className="h-4.5 w-4.5 text-emerald-600 animate-pulse flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">✓ Konversi Otomatis Aktif</span>
              <span className="text-[10px] text-emerald-600 font-medium">
                Ditemukan {matchingCount} data harian untuk platform <span className="capitalize font-bold">{platform}</span> di bulan <span className="font-bold">{month}</span>. Angka jangkauan, interaksi, dan ER di bawah ini telah otomatis dihitung dan diisi. Anda tetap dapat menyesuaikannya jika diperlukan.
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 border border-amber-100 text-amber-800 rounded-xl p-3.5 text-xs flex items-start gap-2.5 shadow-3xs">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">⚠ Data Harian Tidak Ditemukan</span>
              <span className="text-[10px] text-amber-600 font-medium">
                Belum ada rekaman daily insight untuk platform <span className="capitalize font-bold">{platform}</span> di bulan <span className="font-bold">{month}</span>. Silakan isi angka total jangkauan dan interaksi secara manual di bawah ini.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Periode Bulan</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "instagram" | "tiktok")}
              disabled={isInstagramOnly}
              className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium disabled:opacity-75 disabled:bg-slate-100"
            >
              <option value="instagram">Instagram</option>
              {!isInstagramOnly && <option value="tiktok">TikTok</option>}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Reach Bulanan</label>
            <input
              type="number"
              value={totalReach}
              onChange={(e) => setTotalReach(e.target.value)}
              placeholder="180000"
              required
              className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Interaksi / Engagement</label>
            <input
              type="number"
              value={totalEngagement}
              onChange={(e) => setTotalEngagement(e.target.value)}
              placeholder="15400"
              required
              className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Rata-rata Engagement Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={avgEngagementRate}
              onChange={(e) => setAvgEngagementRate(e.target.value)}
              placeholder="12.5"
              className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">3 Konten Performa Terbaik (Top Performing Posts)</label>
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 px-2 py-1 rounded-lg w-8 text-center shrink-0">#1</span>
                <input
                  type="text"
                  value={topPost1}
                  onChange={(e) => setTopPost1(e.target.value)}
                  placeholder="Judul / topik konten performa terbaik utama"
                  className="w-full text-xs px-3.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 px-2 py-1 rounded-lg w-8 text-center shrink-0">#2</span>
                <input
                  type="text"
                  value={topPost2}
                  onChange={(e) => setTopPost2(e.target.value)}
                  placeholder="Judul / topik konten performa terbaik kedua"
                  className="w-full text-xs px-3.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 px-2 py-1 rounded-lg w-8 text-center shrink-0">#3</span>
                <input
                  type="text"
                  value={topPost3}
                  onChange={(e) => setTopPost3(e.target.value)}
                  placeholder="Judul / topik konten performa terbaik ketiga"
                  className="w-full text-xs px-3.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-slate-400" />
              <span>Diagnosis & Analisis Performa Bulanan</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>Diagnosis Otomatis Aktif</span>
            </span>
          </label>
          <textarea
            value={analysis}
            readOnly
            placeholder="Data analisis akan otomatis digenerate setelah jangkauan dan interaksi terisi."
            rows={4}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 leading-relaxed font-sans cursor-not-allowed select-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] uppercase tracking-wider py-2 px-6 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Simpan Insight Periodik</span>
          </button>
        </div>
      </form>
    </div>
  );
}
