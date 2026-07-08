import React, { useState, useMemo } from "react";
import { DailyInsight, PeriodicInsight, Campaign } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Eye,
  Heart,
  Award,
  AlertCircle,
  Sparkles,
  DollarSign,
  Briefcase
} from "lucide-react";

interface AnalyticsViewProps {
  dailyInsights: DailyInsight[];
  periodicInsights: PeriodicInsight[];
  campaigns: Campaign[];
  isInstagramOnly?: boolean;
}

export default function AnalyticsView({ dailyInsights, periodicInsights, campaigns, isInstagramOnly }: AnalyticsViewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<"all" | "instagram" | "tiktok">(isInstagramOnly ? "instagram" : "all");
  const [timeGrouping, setTimeGrouping] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  React.useEffect(() => {
    if (isInstagramOnly) {
      setSelectedPlatform("instagram");
    }
  }, [isInstagramOnly]);

  // 1. Calculate General Aggregated Stats for Selected Platform
  const stats = useMemo(() => {
    const filtered = dailyInsights.filter(
      (d) => selectedPlatform === "all" || d.platform === selectedPlatform
    );

    if (filtered.length === 0) {
      return {
        totalReach: 0,
        totalImpressions: 0,
        avgEngagementRate: 0,
        totalFollowers: 0,
        reachDelta: 0,
        engagementDelta: 0,
        followersDelta: 0
      };
    }

    // Sort by date ascending to parse timeline
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    
    // Aggregates
    let totalReach = 0;
    let totalImpressions = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;

    sorted.forEach((item) => {
      totalReach += item.reach;
      totalImpressions += item.impressions;
      totalLikes += item.likes;
      totalComments += item.comments;
      totalShares += item.shares;
      totalSaves += item.saves;
    });

    const totalEngagement = totalLikes + totalComments + totalShares + totalSaves;
    const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
    const totalFollowers = sorted[sorted.length - 1].followers;

    // Deltas Calculation (Compare latest 7 days vs previous 7 days)
    const midPoint = Math.floor(sorted.length / 2);
    const recentPeriod = sorted.slice(midPoint);
    const previousPeriod = sorted.slice(0, midPoint);

    const sumReach = (arr: DailyInsight[]) => arr.reduce((sum, item) => sum + item.reach, 0);
    const sumEngagement = (arr: DailyInsight[]) =>
      arr.reduce((sum, item) => sum + item.likes + item.comments + item.shares + item.saves, 0);

    const recentReach = sumReach(recentPeriod);
    const previousReach = sumReach(previousPeriod);
    const recentEng = sumEngagement(recentPeriod);
    const previousEng = sumEngagement(previousPeriod);

    const reachDelta = previousReach > 0 ? ((recentReach - previousReach) / previousReach) * 100 : 0;
    const engagementDelta = previousEng > 0 ? ((recentEng - previousEng) / previousEng) * 100 : 0;

    // Follower Growth Delta
    const firstFollowers = sorted[0].followers;
    const lastFollowers = sorted[sorted.length - 1].followers;
    const followersDelta = firstFollowers > 0 ? ((lastFollowers - firstFollowers) / firstFollowers) * 100 : 0;

    return {
      totalReach,
      totalImpressions,
      avgEngagementRate,
      totalFollowers,
      reachDelta,
      engagementDelta,
      followersDelta
    };
  }, [dailyInsights, selectedPlatform]);

  // 2. Reach vs Engagement Smart Diagnosis Generator
  const diagnosis = useMemo(() => {
    const er = stats.avgEngagementRate;
    
    if (er === 0) {
      return {
        status: "Data Belum Memadai",
        color: "text-slate-600 bg-slate-50 border-slate-200",
        desc: "Silakan input data insight harian atau bulanan terlebih dahulu untuk mengaktifkan modul diagnosis performa kecerdasan buatan.",
        action: "Gunakan panel 'Input Data Insight' di atas untuk mengimpor atau melog data harian."
      };
    }

    if (er >= 12) {
      return {
        status: "SANGAT SEHAT (High Reach, High Engagement)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
        desc: "Luar biasa! Konten Anda menyebar luas dan audiens Anda sangat interaktif. Hubungan timbal balik (engagement) berada di atas rata-rata industri sosial media.",
        action: "Rekomendasi: Pertahankan ritme postingan Anda. Lipatgandakan format konten berkinerja terbaik ini (terutama yang bertema " + (periodicInsights[0]?.topPerformingPost || "Edukasi/Hiburan") + ")."
      };
    } else if (er >= 6 && er < 12) {
      return {
        status: "INTERAKSI STABIL (Moderate Reach, Good Engagement)",
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
        desc: "Hubungan audiens terjalin dengan baik, namun persebaran jangkauan organik (reach) masih bisa dioptimalkan lebih jauh.",
        action: "Rekomendasi: Fokuskan optimasi pada SEO Caption dan letakkan kata kunci tertarget agar robot algoritma menyebarkan Reels/Video Anda ke non-followers."
      };
    } else {
      return {
        status: "SINDROM JANGKAUAN DINGIN (Low Engagement Rate)",
        color: "text-amber-700 bg-amber-50 border-amber-200",
        desc: "Jangkauan konten Anda cukup baik, namun tingkat konversi interaksi (like/komen/save) sangat rendah. Audiens cenderung langsung melakukan scroll tanpa berinteraksi.",
        action: "Rekomendasi: Tambahkan 'Hook Menarik' di 3 detik pertama video, gunakan stiker tanya jawab di Story, dan sertakan Call to Action (CTA) pemicu keterlibatan yang kuat di baris awal caption."
      };
    }
  }, [stats.avgEngagementRate, periodicInsights]);

  // 3. Format Insights Timeline for Recharts (Daily, Weekly, Monthly, Yearly)
  const chartData = useMemo(() => {
    const filtered = dailyInsights.filter(
      (d) => selectedPlatform === "all" || d.platform === selectedPlatform
    );

    if (timeGrouping === "daily") {
      return filtered
        .map((item) => ({
          label: item.date.slice(5), // MM-DD
          Reach: item.reach,
          Impression: item.impressions,
          Engagement: item.likes + item.comments + item.shares + item.saves,
          "ER (%)": Number(item.engagementRate.toFixed(2)),
          dateVal: item.date
        }))
        .sort((a, b) => a.dateVal.localeCompare(b.dateVal));
    }

    const groups: Record<string, { label: string; reach: number; impressions: number; engagement: number; dateVal: string }> = {};

    filtered.forEach((item) => {
      let key = "";
      let label = "";
      const dateStr = item.date;
      if (!dateStr) return;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return;

      if (timeGrouping === "weekly") {
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(dateObj.setDate(diff));
        key = monday.toISOString().split("T")[0];
        label = `W - ${monday.toLocaleDateString("id-ID", { month: "short", day: "numeric" })}`;
      } else if (timeGrouping === "monthly") {
        key = dateStr.slice(0, 7); // YYYY-MM
        label = dateObj.toLocaleDateString("id-ID", { year: "numeric", month: "short" });
      } else {
        key = dateStr.slice(0, 4); // YYYY
        label = key;
      }

      if (!groups[key]) {
        groups[key] = {
          label,
          reach: 0,
          impressions: 0,
          engagement: 0,
          dateVal: key
        };
      }

      groups[key].reach += item.reach;
      groups[key].impressions += item.impressions;
      groups[key].engagement += item.likes + item.comments + item.shares + item.saves;
    });

    return Object.values(groups)
      .map((g) => ({
        label: g.label,
        Reach: g.reach,
        Impression: g.impressions,
        Engagement: g.engagement,
        "ER (%)": g.reach > 0 ? Number(((g.engagement / g.reach) * 100).toFixed(2)) : 0,
        dateVal: g.dateVal
      }))
      .sort((a, b) => a.dateVal.localeCompare(b.dateVal));
  }, [dailyInsights, selectedPlatform, timeGrouping]);

  return (
    <div className="space-y-6" id="analytics-view">
      {/* Platform & Timeframe Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs gap-4">
        {!isInstagramOnly ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-700 pl-1 tracking-tight font-display">Saringan Medsos:</span>
            <div className="flex gap-1.5">
              {[
                { id: "all", name: "Semua Medsos" },
                { id: "instagram", name: "Instagram" },
                { id: "tiktok", name: "TikTok" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPlatform(tab.id as any)}
                  className={`py-1.5 px-3.5 text-xs rounded-xl transition-all font-semibold cursor-pointer ${
                    selectedPlatform === tab.id
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-3xs font-bold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-700 pl-1 tracking-tight font-display">Saringan Medsos:</span>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/60 px-3.5 py-1.5 rounded-xl shadow-3xs">
              Instagram Only
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:border-l md:border-slate-100 md:pl-4">
          <span className="text-xs font-bold text-slate-700 tracking-tight font-display">Grup Waktu Grafik:</span>
          <div className="flex gap-1.5">
            {[
              { id: "daily", name: "Harian" },
              { id: "weekly", name: "Mingguan" },
              { id: "monthly", name: "Bulanan" },
              { id: "yearly", name: "Tahunan" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeGrouping(tab.id as any)}
                className={`py-1.5 px-3.5 text-xs rounded-xl transition-all font-semibold cursor-pointer ${
                  timeGrouping === tab.id
                    ? "bg-amber-50 text-amber-700 border border-amber-100/60 shadow-3xs font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Numerical Stats Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Followers Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Followers</span>
            <span className="text-2xl font-black text-slate-850 tracking-tight font-display">
              {stats.totalFollowers.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              {stats.followersDelta >= 0 ? (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +{stats.followersDelta.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[10px] text-red-500 font-bold flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5" /> {stats.followersDelta.toFixed(1)}%
                </span>
              )}
              <span className="text-[9px] text-slate-400">vs awal periode</span>
            </div>
          </div>
          <div className="p-3 bg-violet-50 border border-violet-100/50 rounded-xl text-violet-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Reach Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Reach</span>
            <span className="text-2xl font-black text-slate-850 tracking-tight font-display">
              {stats.totalReach.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              {stats.reachDelta >= 0 ? (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +{stats.reachDelta.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[10px] text-red-500 font-bold flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5" /> {stats.reachDelta.toFixed(1)}%
                </span>
              )}
              <span className="text-[9px] text-slate-400">vs periode lalu</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl text-indigo-600">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Impression Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Impressions</span>
            <span className="text-2xl font-black text-slate-850 tracking-tight font-display">
              {stats.totalImpressions.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                Kerapatan Tampilan
              </span>
              <span className="text-[9px] text-slate-400">1.3x jangkauan</span>
            </div>
          </div>
          <div className="p-3 bg-pink-50 border border-pink-100/50 rounded-xl text-pink-600">
            <Eye className="h-5 w-5" />
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Engagement Rate</span>
            <span className="text-2xl font-black text-slate-850 tracking-tight font-display">
              {stats.avgEngagementRate.toFixed(2)}%
            </span>
            <div className="flex items-center gap-1">
              {stats.engagementDelta >= 0 ? (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> +{stats.engagementDelta.toFixed(1)}%
                </span>
              ) : (
                <span className="text-[10px] text-red-500 font-bold flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5" /> {stats.engagementDelta.toFixed(1)}%
                </span>
              )}
              <span className="text-[9px] text-slate-400">interaksi</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100/50 rounded-xl text-amber-600">
            <Heart className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* AI Performance Diagnosis Panel */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-5 items-start transition-all hover:shadow-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] ${diagnosis.color}`}>
        <div className="p-2.5 bg-white/90 border border-slate-200/40 rounded-xl text-indigo-600 shadow-3xs self-start shrink-0">
          <Sparkles className="h-5 w-5 animate-pulse text-indigo-500" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-xs font-black uppercase tracking-wider flex flex-wrap items-center gap-2 font-display">
            <span className="text-slate-850">Diagnosis Reach vs Engagement</span>
            <span className="text-[10px] bg-white text-slate-800 border border-slate-200/50 px-2 py-0.5 rounded font-bold">
              {diagnosis.status}
            </span>
          </h4>
          <p className="text-xs leading-relaxed font-sans font-semibold text-slate-750">{diagnosis.desc}</p>
          <div className="text-xs pt-2 border-t border-slate-200/30 font-semibold italic text-slate-600">
            💡 <strong>Rekomendasi Tindakan:</strong> {diagnosis.action}
          </div>
        </div>
      </div>

      {/* Recharts Graphical Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reach and Impressions Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
              Grafik Jangkauan & Impresi ({timeGrouping === "daily" ? "Harian" : timeGrouping === "weekly" ? "Mingguan" : timeGrouping === "monthly" ? "Bulanan" : "Tahunan"})
            </h3>
            <p className="text-[10px] text-slate-500">Melihat tren visibilitas konten secara berkala otomatis.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontStyle="italic" />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Reach" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReach)" />
                <Area type="monotone" dataKey="Impression" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorImp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Rate Bar/Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
              Tingkat Hubungan Timbal Balik (Engagement Rate - {timeGrouping === "daily" ? "Harian" : timeGrouping === "weekly" ? "Mingguan" : timeGrouping === "monthly" ? "Bulanan" : "Tahunan"})
            </h3>
            <p className="text-[10px] text-slate-500">Persentase audiens yang berinteraksi dari total jangkauan berkala.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ER (%)" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} dot={{ stroke: "#f59e0b", strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
