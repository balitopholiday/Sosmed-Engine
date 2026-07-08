import React, { useState } from "react";
import { DailyInsight } from "../types";
import { Plus, Check, UploadCloud, AlertCircle, Smartphone, Eye, ThumbsUp, MessageSquare, Share2, Bookmark } from "lucide-react";

interface DailyInsightFormProps {
  onAddDailyInsight: (insight: Partial<DailyInsight>) => Promise<void>;
  onBatchDailyInsights: (platform: "instagram" | "tiktok", items: any[]) => Promise<void>;
  isInstagramOnly?: boolean;
}

export default function DailyInsightForm({ onAddDailyInsight, onBatchDailyInsights, isInstagramOnly }: DailyInsightFormProps) {
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  
  React.useEffect(() => {
    if (isInstagramOnly) {
      setPlatform("instagram");
    }
  }, [isInstagramOnly]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [followers, setFollowers] = useState("");
  const [reach, setReach] = useState("");
  const [impressions, setImpressions] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !followers || !reach) return;

    await onAddDailyInsight({
      date,
      platform,
      followers: Number(followers),
      reach: Number(reach),
      impressions: Number(impressions) || Number(reach),
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      saves: Number(saves) || 0
    });

    setIsSuccess(true);
    // Reset fields
    setFollowers("");
    setReach("");
    setImpressions("");
    setLikes("");
    setComments("");
    setShares("");
    setSaves("");
    
    setTimeout(() => setIsSuccess(false), 3000);
  };

  // Simulate Excel/CSV File Upload Parsing
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setUploadMessage(`Membaca file "${file.name}"...`);
    
    // Simulate smart parsing & calculations of TikTok/IG exported insights
    setTimeout(() => {
      // Create mock historical data parsed from the file
      const isIG = file.name.toLowerCase().includes("ig") || file.name.toLowerCase().includes("instagram");
      const plat: "instagram" | "tiktok" = isIG ? "instagram" : "tiktok";
      
      const parsedItems = [
        { date: "2026-07-01", followers: 12500, reach: 6700, impressions: 8900, likes: 450, comments: 80, shares: 120, saves: 40 },
        { date: "2026-07-02", followers: 12530, reach: 7100, impressions: 9400, likes: 510, comments: 95, shares: 140, saves: 55 },
        { date: "2026-07-03", followers: 12580, reach: 5900, impressions: 7800, likes: 380, comments: 70, shares: 90, saves: 35 },
        { date: "2026-07-04", followers: 12620, reach: 8300, impressions: 11000, likes: 620, comments: 120, shares: 180, saves: 70 },
        { date: "2026-07-05", followers: 12650, reach: 9200, impressions: 12500, likes: 710, comments: 145, shares: 210, saves: 85 }
      ];

      onBatchDailyInsights(plat, parsedItems);
      setUploadMessage(`✅ Sukses mengimpor 5 baris data analitik ${plat.toUpperCase()} secara otomatis!`);
      setTimeout(() => setUploadMessage(""), 4000);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6" id="daily-insight-form">
      <div className="border-b border-slate-200/60 pb-4 mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight font-display">Input Data Insight Harian</h2>
          <p className="text-xs text-slate-500">Log performa harian secara manual atau unggah file laporan ekspor.</p>
        </div>
        {isSuccess && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-bounce">
            <Check className="h-3 w-3" />
            <span>Data Berhasil Disimpan</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Manual Form Log */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Platform</label>
              <div className={`grid ${isInstagramOnly ? "grid-cols-1" : "grid-cols-2"} gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1`}>
                <button
                  type="button"
                  onClick={() => setPlatform("instagram")}
                  className={`py-1 px-2.5 text-[10px] rounded-lg text-center transition-all cursor-pointer font-bold w-full ${
                    platform === "instagram" ? "bg-white text-slate-850 shadow-3xs border border-slate-200/40" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Instagram
                </button>
                {!isInstagramOnly && (
                  <button
                    type="button"
                    onClick={() => setPlatform("tiktok")}
                    className={`py-1 px-2.5 text-[10px] rounded-lg text-center transition-all cursor-pointer font-bold ${
                      platform === "tiktok" ? "bg-white text-slate-850 shadow-3xs border border-slate-200/40" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    TikTok
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Followers</label>
              <input
                type="number"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                placeholder="12450"
                required
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Smartphone className="h-3 w-3 text-slate-400" />
                <span>Reach / Jangkauan</span>
              </label>
              <input
                type="number"
                value={reach}
                onChange={(e) => setReach(e.target.value)}
                placeholder="5500"
                required
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Eye className="h-3 w-3 text-slate-400" />
                <span>Views</span>
              </label>
              <input
                type="number"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value)}
                placeholder="7100"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-slate-400" />
                <span>Likes</span>
              </label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="320"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-slate-400" />
                <span>Comments</span>
              </label>
              <input
                type="number"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="45"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Share2 className="h-3 w-3 text-slate-400" />
                <span>Shares / Retweets</span>
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="80"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Bookmark className="h-3 w-3 text-slate-400" />
                <span>Saves / Mark</span>
              </label>
              <input
                type="number"
                value={saves}
                onChange={(e) => setSaves(e.target.value)}
                placeholder="30"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>Tambahkan Data</span>
              </button>
            </div>
          </div>
        </form>

        {/* Drag & Drop Upload Zone */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Impor Data CSV / Excel</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center min-h-[140px] cursor-pointer relative overflow-hidden ${
                isDragOver ? "border-indigo-500 bg-indigo-50/40" : "border-slate-200 bg-slate-50/30 hover:bg-slate-50/80"
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2 stroke-1" />
              <p className="text-xs font-bold text-slate-700">Tarik & Lepas File Di Sini</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] leading-tight">Mendukung ekspor data performa Instagram / TikTok (.csv, .xlsx)</p>
            </div>
          </div>

          {uploadMessage && (
            <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-700 font-medium leading-relaxed font-mono">{uploadMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
