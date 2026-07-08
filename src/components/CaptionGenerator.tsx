import React, { useState } from "react";
import { Sparkles, Copy, Check, MessageSquare, Info, Globe, Hash } from "lucide-react";

interface CaptionGeneratorProps {
  onInsertToPlanner?: (caption: string) => void;
  isInstagramOnly?: boolean;
}

export default function CaptionGenerator({ onInsertToPlanner, isInstagramOnly }: CaptionGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("casual");
  const [keywords, setKeywords] = useState("");
  const [length, setLength] = useState("sedang");
  const [loading, setLoading] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isInstagramOnly) {
      setPlatform("instagram");
    }
  }, [isInstagramOnly]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Topik atau detail konten wajib diisi!");
      return;
    }
    setError("");
    setLoading(true);
    setGeneratedCaption("");

    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          topic,
          tone,
          keywords,
          length,
        }),
      });

      const data = await res.json();
      if (res.ok && data.caption) {
        setGeneratedCaption(data.caption);
      } else {
        setError(data.error || "Gagal membuat caption. Pastikan API Key di panel Secrets sudah diatur.");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan jaringan atau server tidak merespon.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="caption-generator">
      <div className="p-5 border-b border-slate-200 bg-linear-to-r from-violet-50/50 to-indigo-50/20 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">AI SEO Caption Generator</h2>
          <p className="text-xs text-slate-500">Tulis caption scannable dan SEO optimized dalam hitungan detik menggunakan Gemini AI</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <form onSubmit={handleGenerate} className="lg:col-span-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Platform Media Sosial</label>
            <div className={`grid ${isInstagramOnly ? "grid-cols-1" : "grid-cols-3"} gap-2`}>
              {[
                { id: "instagram", name: "Instagram" },
                { id: "tiktok", name: "TikTok" },
                { id: "linkedin", name: "LinkedIn" },
              ].filter(p => !isInstagramOnly || p.id === "instagram").map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`py-2 px-3 text-xs rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    platform === p.id
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs"
                      : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Topik atau Detail Konten</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Tips memilih warna konten agar feeds instagram kelihatan estetik dan profesional bagi pemula..."
              rows={4}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nada / Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium"
              >
                <option value="casual">Casual (Santai)</option>
                <option value="profesional">Profesional (Resmi)</option>
                <option value="persuasif">Persuasif (Promosi)</option>
                <option value="edukatif">Edukasi (Berbagi Ilmu)</option>
                <option value="humor">Humor / Menggelitik</option>
                <option value="interaktif">Interaktif (Tanya Jawab)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Panjang Caption</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium"
              >
                <option value="pendek">Pendek (&lt; 50 kata)</option>
                <option value="sedang">Sedang (50 - 150 kata)</option>
                <option value="panjang">Panjang (&gt; 150 kata)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Kata Kunci SEO (Opsional)</label>
              <span className="text-[10px] text-slate-400 font-mono">Pisahkan dengan koma</span>
            </div>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Contoh: tips instagram, estetik pemula, feeds rapi"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer text-white shadow-xs transition-all uppercase tracking-wider ${
              loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-sm"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Menciptakan Caption Kreatif...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Hasilkan Caption SEO</span>
              </>
            )}
          </button>
        </form>

        {/* Caption Result View */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[350px] border border-slate-200 rounded-2xl bg-slate-50/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hasil Caption</span>
            </div>
            {generatedCaption && (
              <div className="flex gap-2">
                {onInsertToPlanner && (
                  <button
                    onClick={() => {
                      onInsertToPlanner(generatedCaption);
                    }}
                    className="text-xs px-3 py-1.5 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/80 rounded-xl font-bold transition-all cursor-pointer shadow-3xs"
                  >
                    Masukkan ke Kalender
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-all cursor-pointer shadow-3xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 font-sans text-xs text-slate-700 leading-relaxed overflow-y-auto whitespace-pre-wrap select-text relative shadow-3xs">
            {generatedCaption ? (
              generatedCaption
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-red-500">
                <Info className="h-8 w-8 mb-2 stroke-1.5" />
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs text-slate-400 mt-2">Pastikan server berjalan, dan kunci Gemini API sudah valid di panel Secrets.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 select-none">
                <Globe className="h-10 w-10 mb-3 stroke-1 text-slate-300 animate-bounce" />
                <p className="font-semibold text-slate-650">Menunggu Input Anda</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Masukkan topik, pilih platform, lalu klik tombol "Hasilkan Caption SEO" di sebelah kiri untuk membuat deskripsi media sosial yang optimal.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-1 font-semibold">
                    <Hash className="h-2.5 w-2.5 text-slate-400" /> Social SEO
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-1 font-semibold">
                    ⚡ High Hook
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-1 font-semibold">
                    📖 Clear CTA
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
