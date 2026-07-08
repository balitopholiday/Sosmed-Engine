import React, { useState, useMemo } from "react";
import { Inquiry } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Phone,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  Users,
  TrendingUp,
  Percent,
  Calendar,
  X,
  BarChart3,
  Eye
} from "lucide-react";

interface InquiryDashboardProps {
  inquiries: Inquiry[];
  onAddInquiry: (inquiry: Omit<Inquiry, "id">) => Promise<void>;
  onUpdateInquiry: (id: string, inquiry: Partial<Inquiry>) => Promise<void>;
  onDeleteInquiry: (id: string) => Promise<void>;
  isReadOnly?: boolean;
}

export default function InquiryDashboard({
  inquiries,
  onAddInquiry,
  onUpdateInquiry,
  onDeleteInquiry,
  isReadOnly
}: InquiryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [timeGrouping, setTimeGrouping] = useState<"weekly" | "monthly" | "yearly">("weekly");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);

  // Form states
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [hari, setHari] = useState("Senin");
  const [usernameNama, setUsernameNama] = useState("");
  const [jumlah, setJumlah] = useState<number>(0);
  const [periode, setPeriode] = useState("1 Bulan");
  const [nomorWATamu, setNomorWATamu] = useState("");
  const [stage, setStage] = useState<Inquiry["stage"]>("Engage");

  // Automatically calculate Indonesian Day based on selected date
  const handleDateChange = (dateVal: string) => {
    setTanggal(dateVal);
    if (!dateVal) return;
    const dateObj = new Date(dateVal);
    const dayIndex = dateObj.getDay();
    const indonesianDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    setHari(indonesianDays[dayIndex]);
  };

  const handleOpenCreateModal = () => {
    setEditingInquiry(null);
    const todayStr = new Date().toISOString().split("T")[0];
    setTanggal(todayStr);
    handleDateChange(todayStr);
    setUsernameNama("");
    setJumlah(0);
    setPeriode("1 Bulan");
    setNomorWATamu("");
    setStage("Engage");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inq: Inquiry) => {
    setEditingInquiry(inq);
    setTanggal(inq.tanggal);
    setHari(inq.hari);
    setUsernameNama(inq.usernameNama);
    setJumlah(inq.jumlah);
    setPeriode(inq.periode);
    setNomorWATamu(inq.nomorWATamu);
    setStage(inq.stage);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameNama.trim()) return;

    const payload = {
      hari,
      tanggal,
      usernameNama,
      jumlah: Number(jumlah) || 0,
      periode,
      nomorWATamu,
      stage
    };

    if (editingInquiry) {
      await onUpdateInquiry(editingInquiry.id, payload);
    } else {
      await onAddInquiry(payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setInquiryToDelete(id);
  };

  const confirmDelete = async () => {
    if (inquiryToDelete) {
      await onDeleteInquiry(inquiryToDelete);
      setInquiryToDelete(null);
    }
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const total = inquiries.length;
    const dealList = inquiries.filter((i) => i.stage === "Deal");
    const potentialList = inquiries.filter((i) => i.stage !== "Tidak Deal");
    
    const totalDealsValue = dealList.reduce((sum, i) => sum + i.jumlah, 0);
    const potentialRevenue = potentialList.reduce((sum, i) => sum + i.jumlah, 0);
    
    const closedCount = dealList.length;
    const winRate = total > 0 ? (closedCount / total) * 100 : 0;

    return {
      total,
      closedCount,
      totalDealsValue,
      potentialRevenue,
      winRate
    };
  }, [inquiries]);

  // Aggregated Inquiry Data for Charts (Weekly, Monthly, Yearly)
  const aggregatedInquiryData = useMemo(() => {
    const groups: Record<string, { label: string; totalPax: number; count: number; dateVal: string }> = {};

    inquiries.forEach((inq) => {
      let key = "";
      let label = "";
      const dateStr = inq.tanggal; // YYYY-MM-DD
      
      if (!dateStr) return;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return;

      if (timeGrouping === "weekly") {
        // Find Sunday/Monday of the week
        const day = dateObj.getDay();
        const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Monday
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
          totalPax: 0,
          count: 0,
          dateVal: key
        };
      }

      groups[key].totalPax += inq.jumlah || 0;
      groups[key].count += 1;
    });

    // Sort chronologically
    return Object.values(groups).sort((a, b) => a.dateVal.localeCompare(b.dateVal));
  }, [inquiries, timeGrouping]);

  // Filtered Inquiries for display
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchSearch =
        inq.usernameNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.nomorWATamu.includes(searchTerm) ||
        inq.periode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStage = stageFilter === "all" || inq.stage === stageFilter;
      
      return matchSearch && matchStage;
    });
  }, [inquiries, searchTerm, stageFilter]);

  // Stage styling helper
  const getStageBadgeClass = (s: Inquiry["stage"]) => {
    switch (s) {
      case "Deal":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Nego":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Penawaran":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Engage":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Tidak Deal":
        return "bg-red-50 text-red-700 border-red-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  // Direct CSV Exporter
  const exportCSV = () => {
    if (filteredInquiries.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    const headers = ["Hari", "Tanggal", "Username / Nama", "Jumlah (PAX)", "Periode", "Nomor WA Tamu", "Stage"];
    const rows = filteredInquiries.map((inq) => [
      inq.hari,
      inq.tanggal,
      inq.usernameNama,
      inq.jumlah,
      inq.periode,
      `'${inq.nomorWATamu}`, // Single quote prevents Excel parsing truncation
      inq.stage
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inquiry_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Instant PDF Exporter using document.print or dynamic generated print window
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredInquiries
      .map(
        (inq) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 10px;">${inq.hari}</td>
        <td style="padding: 10px;">${inq.tanggal}</td>
        <td style="padding: 10px; font-weight: bold;">${inq.usernameNama}</td>
        <td style="padding: 10px;">${inq.jumlah.toLocaleString()} PAX</td>
        <td style="padding: 10px;">${inq.periode}</td>
        <td style="padding: 10px;">${inq.nomorWATamu}</td>
        <td style="padding: 10px; font-weight: bold;">${inq.stage}</td>
      </tr>
    `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Inquiry Sosial Media Specialist</title>
          <style>
            body { font-family: sans-serif; color: #334155; margin: 40px; }
            h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; color: #1e1b4b; }
            p { font-size: 12px; margin-top: 0; color: #64748b; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left; padding: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569; }
            .badge { padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Sosial Media Specialist - Laporan Inquiry</h1>
          <p>Dicetak pada tanggal: ${new Date().toLocaleDateString("id-ID")} - Total ${filteredInquiries.length} Inquiry</p>
          <table>
            <thead>
              <tr>
                <th>Hari</th>
                <th>Tanggal</th>
                <th>Username / Nama</th>
                <th>Jumlah (PAX)</th>
                <th>Periode</th>
                <th>Nomor WA Tamu</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="inquiry-dashboard">
      {/* Metric Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Inquiry</span>
            <span className="text-2xl font-black text-slate-850 tracking-tight font-display">
              {stats.total}
            </span>
            <div className="text-[10px] text-slate-500 font-semibold">
              Terhitung semua stage
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <HelpCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Potential Deal Value */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Potensi PAX</span>
            <span className="text-xl font-black text-indigo-600 tracking-tight font-display">
              {stats.potentialRevenue.toLocaleString()} PAX
            </span>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Potensi Pax Aktif
            </div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Closed Deals */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total PAX (DEAL)</span>
            <span className="text-xl font-black text-emerald-600 tracking-tight font-display">
              {stats.totalDealsValue.toLocaleString()} PAX
            </span>
            <div className="text-[10px] text-slate-500 font-semibold">
              Dari {stats.closedCount} inquiry berstatus Deal
            </div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Conversion Win Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Rasio Konversi (Win Rate)</span>
            <span className="text-2xl font-black text-slate-850 tracking-tight font-display">
              {stats.winRate.toFixed(1)}%
            </span>
            <div className="text-[10px] text-slate-500 font-semibold">
              Persentase deal sukses
            </div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Graphical Inquiry Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs transition-all hover:shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 mb-5 gap-3">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
              <BarChart3 className="h-4.5 w-4.5 text-indigo-600" />
              <span>Analisis Perbandingan PAX Inquiry ({timeGrouping === "weekly" ? "Mingguan" : timeGrouping === "monthly" ? "Bulanan" : "Tahunan"})</span>
            </h3>
            <p className="text-[10px] text-slate-500">Visualisasi volume pengunjung (PAX) dan frekuensi inquiry masuk.</p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            {[
              { id: "weekly", name: "Perminggu" },
              { id: "monthly", name: "Perbulan" },
              { id: "yearly", name: "Pertahun" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeGrouping(tab.id as any)}
                className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  timeGrouping === tab.id
                    ? "bg-white text-indigo-700 shadow-3xs border border-indigo-100/40"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {aggregatedInquiryData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
            <BarChart3 className="h-8 w-8 text-slate-350 mb-2 animate-pulse" />
            <span className="text-xs font-bold text-slate-500">Belum ada data inquiry yang terekam</span>
            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Data akan otomatis terakumulasi di sini setelah Anda menambahkan inquiry baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Total PAX Bar Chart */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Grafik Total PAX (Pengunjung)</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                  Jumlah PAX
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregatedInquiryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.95} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontStyle="italic" />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar name="Total PAX" dataKey="totalPax" fill="url(#colorPax)" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Inquiry Frequency Line Chart */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Grafik Frekuensi Inquiry Masuk</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                  Jumlah Inquiry
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aggregatedInquiryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" name="Jumlah Inquiry" dataKey="count" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="flex flex-1 max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, nomor WA, atau periode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700 font-sans shadow-3xs"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">Semua Stage</option>
              <option value="Engage">Engage</option>
              <option value="Penawaran">Penawaran</option>
              <option value="Nego">Nego</option>
              <option value="Deal">Deal</option>
              <option value="Tidak Deal">Tidak Deal</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Cetak PDF</span>
            </button>
            {!isReadOnly ? (
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs uppercase tracking-wider"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Inquiry</span>
              </button>
            ) : (
              <span className="text-xs font-bold px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl flex items-center gap-1.5 shadow-3xs uppercase font-mono">
                <Eye className="h-3.5 w-3.5" />
                <span>Mode Pantau</span>
              </span>
            )}
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-5">Hari</th>
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Username / Nama</th>
                <th className="py-3 px-5">Jumlah (PAX)</th>
                <th className="py-3 px-5">Periode</th>
                <th className="py-3 px-5">Nomor WA Tamu</th>
                <th className="py-3 px-5">Stage</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inq) => (
                  <tr key={inq.id} className="text-xs text-slate-650 hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-600">{inq.hari}</td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">{inq.tanggal}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-850">
                      <span className="text-indigo-600">@</span>
                      {inq.usernameNama}
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-800">
                      {inq.jumlah.toLocaleString()} Pax
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-semibold">{inq.periode}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                        <span>{inq.nomorWATamu || "-"}</span>
                        {inq.nomorWATamu && (
                          <a
                            href={`https://wa.me/${inq.nomorWATamu.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Hubungi langsung via WhatsApp"
                          >
                            <MessageCircle className="h-4.5 w-4.5 fill-emerald-50 text-emerald-600" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStageBadgeClass(
                          inq.stage
                        )}`}
                      >
                        {inq.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(inq)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title={isReadOnly ? "Lihat Detail" : "Edit Inquiry"}
                        >
                          {isReadOnly ? <Eye className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                        </button>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDeleteClick(inq.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Inquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data inquiry ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                {isReadOnly ? "Detail Inquiry Tamu (Baca Saja)" : (editingInquiry ? "Edit Inquiry Tamu" : "Buat Inquiry Baru")}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-5">
              <fieldset disabled={isReadOnly} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => handleDateChange(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hari</label>
                  <input
                    type="text"
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    placeholder="Contoh: Senin"
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl focus:outline-hidden text-slate-500 font-medium cursor-not-allowed"
                    readOnly
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Terisi otomatis sesuai tanggal</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username / Nama Tamu</label>
                <input
                  type="text"
                  value={usernameNama}
                  onChange={(e) => setUsernameNama(e.target.value)}
                  placeholder="Contoh: budi_salon"
                  required
                  className="w-full text-xs px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah (PAX)</label>
                  <input
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                    placeholder="Contoh: 10"
                    className="w-full text-xs px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Periode Kontrak</label>
                  <input
                    type="text"
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    placeholder="Contoh: 1 Bulan, 2 Minggu"
                    className="w-full text-xs px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor WA Tamu</label>
                <input
                  type="text"
                  value={nomorWATamu}
                  onChange={(e) => setNomorWATamu(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full text-xs px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as Inquiry["stage"])}
                  className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                >
                  <option value="Engage">Engage</option>
                  <option value="Penawaran">Penawaran</option>
                  <option value="Nego">Nego</option>
                  <option value="Deal">Deal</option>
                  <option value="Tidak Deal">Tidak Deal</option>
                </select>
              </div>
              </fieldset>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {isReadOnly ? "Tutup" : "Batal"}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs uppercase tracking-wider"
                  >
                    {editingInquiry ? "Simpan Perubahan" : "Simpan Baru"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Deletion */}
      {inquiryToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans animate-fade-in animate-duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide font-display mb-2">
              Konfirmasi Hapus
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus data inquiry tamu ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setInquiryToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs uppercase tracking-wider"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
