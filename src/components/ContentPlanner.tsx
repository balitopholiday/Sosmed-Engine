import React, { useState } from "react";
import { ContentPlan, Comment } from "../types";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  MessageSquare,
  Send,
  RefreshCw,
  Bell,
  CheckCircle,
  HelpCircle,
  Instagram,
  Check,
  Smartphone,
  BookOpen,
  Eye
} from "lucide-react";

interface ContentPlannerProps {
  plans: ContentPlan[];
  onAddPlan: (plan: Partial<ContentPlan>) => Promise<void>;
  onUpdatePlan: (id: string, updates: Partial<ContentPlan>) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onAddComment: (planId: string, comment: { user: string; text: string }) => Promise<void>;
  isInstagramOnly?: boolean;
  isReadOnly?: boolean;
}

export default function ContentPlanner({
  plans,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onAddComment,
  isInstagramOnly,
  isReadOnly
}: ContentPlannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<ContentPlan["platform"]>("instagram");

  React.useEffect(() => {
    if (isInstagramOnly) {
      setPlatform("instagram");
    }
  }, [isInstagramOnly]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<ContentPlan["status"]>("draft");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Educational");
  const [mediaType, setMediaType] = useState<ContentPlan["mediaType"]>("image");
  const [notes, setNotes] = useState("");

  // Commentary states
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState("SMM Specialist");

  // Syncing simulation state
  const [syncingPlanId, setSyncingPlanId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<string[]>([]);
  const [syncComplete, setSyncComplete] = useState(false);

  // Reminder states
  const [reminders, setReminders] = useState<{ [key: string]: boolean }>({});
  const [reminderModal, setReminderModal] = useState<{ title: string; time: string } | null>(null);
  
  // View mode & current week states for Monday-Sunday view
  const [viewMode, setViewMode] = useState<"weekly" | "list">("weekly");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const current = new Date();
    const currentDay = current.getDay();
    // Adjust so Monday is the first day (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);
    return monday;
  });

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleThisWeek = () => {
    const current = new Date();
    const currentDay = current.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(current);
    monday.setDate(current.getDate() + mondayOffset);
    setCurrentWeekStart(monday);
  };

  const weekDaysInfo = React.useMemo(() => {
    const daysInd = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const list = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      const dateStr = day.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      
      list.push({
        dayName: daysInd[i],
        dateStr,
        isToday,
        formattedDate: day.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
      });
    }
    return list;
  }, [currentWeekStart]);

  const handleAddPlanForDate = (dateString: string) => {
    resetForm();
    setDate(dateString);
    setIsModalOpen(true);
  };

  // Month and Year filter states
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  const monthsList = [
    { value: "", label: "Semua Bulan" },
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" }
  ];

  // Year selection from 2024 up to 2050
  const availableYears: string[] = [];
  const startYear = 2024;
  const endYear = 2050;
  for (let y = startYear; y <= endYear; y++) {
    availableYears.push(y.toString());
  }

  // Filter plans based on month and year selection
  const filteredPlans = plans
    .filter((p) => !isInstagramOnly || p.platform === "instagram")
    .filter((p) => {
      if (!p.date) return true;
      const parts = p.date.split("-"); // yyyy-mm-dd
      if (parts.length < 2) return true;
      const year = parts[0];
      const month = parts[1];
      
      const matchMonth = !selectedMonth || month === selectedMonth;
      const matchYear = !selectedYear || year === selectedYear;
      return matchMonth && matchYear;
    });

  const resetForm = () => {
    setTitle("");
    setPlatform("instagram");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("12:00");
    setStatus("draft");
    setCaption("");
    setCategory("Educational");
    setMediaType("image");
    setNotes("");
    setEditingPlan(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: ContentPlan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setPlatform(plan.platform);
    setDate(plan.date);
    setTime(plan.time);
    setStatus(plan.status);
    setCaption(plan.caption || "");
    setCategory(plan.category);
    setMediaType(plan.mediaType);
    setNotes(plan.notes || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const planData = {
      title,
      platform,
      date,
      time,
      status,
      caption,
      category,
      mediaType,
      notes
    };

    if (editingPlan) {
      await onUpdatePlan(editingPlan.id, planData);
    } else {
      await onAddPlan(planData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handlePostComment = async (planId: string) => {
    if (!commentText.trim()) return;
    await onAddComment(planId, { user: currentUser, text: commentText });
    setCommentText("");
  };

  // Simulate Social media direct sync / real-time publish
  const handleSimulateSync = (plan: ContentPlan) => {
    setSyncingPlanId(plan.id);
    setSyncComplete(false);
    setSyncProgress(["Inisialisasi koneksi API...", "Mengotentikasi kredensial token..."]);

    setTimeout(() => {
      setSyncProgress((prev) => [...prev, `Menyeimbangkan aset media (${plan.mediaType.toUpperCase()})`]);
    }, 1000);

    setTimeout(() => {
      setSyncProgress((prev) => [...prev, "Mengoptimasi metadata deskripsi SEO & Hashtag"]);
    }, 2000);

    setTimeout(() => {
      setSyncProgress((prev) => [...prev, `Berhasil memposting ke API Gateway ${plan.platform.toUpperCase()}!`]);
      setSyncComplete(true);
      // Automatically update status to 'published' and add to synced platforms
      onUpdatePlan(plan.id, {
        status: "published",
        syncedPlatforms: Array.from(new Set([...(plan.syncedPlatforms || []), plan.platform]))
      });
    }, 3500);
  };

  // Set Reminder Notification
  const handleToggleReminder = (plan: ContentPlan) => {
    const key = plan.id;
    const isSet = !reminders[key];
    setReminders((prev) => ({ ...prev, [key]: isSet }));

    if (isSet) {
      // Simulate scheduling alert
      const timerSeconds = 5; // trigger alert in 5 seconds for demonstration
      setTimeout(() => {
        // play alert sound if possible, or trigger modal
        setReminderModal({
          title: plan.title,
          time: `${plan.date} pukul ${plan.time}`
        });
      }, timerSeconds * 1000);
    }
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case "instagram":
        return <span className="p-1.5 bg-pink-50 rounded-md text-pink-600 block"><Instagram className="h-4 w-4" /></span>;
      case "tiktok":
        return <span className="p-1.5 bg-slate-900 rounded-md text-white block font-black text-xs font-mono px-2">TT</span>;
      case "linkedin":
        return <span className="p-1.5 bg-blue-50 rounded-md text-blue-600 block font-bold text-xs px-1.5">In</span>;
      case "facebook":
        return <span className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 block font-bold text-xs px-2">Fb</span>;
      default:
        return <span className="p-1.5 bg-slate-100 rounded-md text-slate-600 block font-bold text-xs px-1.5">Tw</span>;
    }
  };

  return (
    <div className="space-y-6" id="content-planner">
      {/* Reminder Alert Modal Banner */}
      {reminderModal && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-xs flex items-start gap-3 animate-bounce">
          <Bell className="h-6 w-6 text-amber-600 animate-swing shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">🔔 PENGINGAT JADWAL POSTING KONTEN!</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Konten Anda <strong>"{reminderModal.title}"</strong> dijadwalkan tayang pada <strong>{reminderModal.time}</strong>. Harap verifikasi aset grafis & video.
            </p>
          </div>
          <button
            onClick={() => setReminderModal(null)}
            className="text-amber-800 hover:text-amber-950 font-bold text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded-md cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Synchronizing API Loading Overlay Panel */}
      {syncingPlanId && (
        <div className="bg-slate-900/90 text-white p-6 rounded-xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 text-indigo-400 ${!syncComplete ? "animate-spin" : ""}`} />
              <span>SINKRONISASI API MEDIA SOSIAL REAL-TIME</span>
            </h3>
            <div className="text-xs text-slate-300 font-mono space-y-1">
              {syncProgress.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-indigo-400">✓</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            {syncComplete ? (
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>KONTEN BERHASIL TAYANG</span>
              </div>
            ) : (
              <div className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                Sedang Mengirim ke Server...
              </div>
            )}
            <button
              onClick={() => setSyncingPlanId(null)}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display tracking-tight uppercase">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span>Kalender Perencanaan & Sinkronisasi</span>
          </h2>
          <p className="text-xs text-slate-500">Kelola draf konten, jadwalkan postingan, dan bagikan umpan balik tim.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-9.5 mr-2">
            <button
              type="button"
              onClick={() => setViewMode("weekly")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "weekly"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-3xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-200"
              }`}
            >
              🗓️ Kalender Mingguan (Senin-Minggu)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-3xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-200"
              }`}
            >
              📋 Semua List
            </button>
          </div>

          {isReadOnly ? (
            <span className="text-xs font-bold px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl flex items-center gap-1.5 shadow-3xs uppercase font-mono">
              <Eye className="h-3.5 w-3.5" />
              <span>Akses Tamu (Membaca)</span>
            </span>
          ) : (
            <>
              <button
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider shadow-xs hover:shadow-md transition-all cursor-pointer h-9.5"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Content Plan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Month & Year Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 shadow-3xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bulan</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tahun</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {(selectedMonth || selectedYear) && (
            <button
              onClick={() => {
                setSelectedMonth("");
                setSelectedYear("");
              }}
              className="sm:mt-5 text-[10px] font-bold text-red-650 hover:text-red-700 dark:text-red-400 dark:hover:text-red-350 hover:underline flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Menampilkan <strong className="text-slate-850 dark:text-slate-200 font-bold">{filteredPlans.length}</strong> rencana konten
        </div>
      </div>

       {viewMode === "weekly" ? (
        <div className="space-y-4" id="weekly-calendar-view">
          {/* Week Navigator bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300 shadow-3xs">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-750 transition-all cursor-pointer text-xs font-bold shrink-0 shadow-3xs bg-white dark:bg-slate-900"
              >
                ← Sebelum
              </button>
              <button
                type="button"
                onClick={handleThisWeek}
                className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Minggu Ini
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-750 transition-all cursor-pointer text-xs font-bold shrink-0 shadow-3xs bg-white dark:bg-slate-900"
              >
                Berikut →
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-slate-650 dark:text-slate-400 text-center uppercase tracking-wider">
              📅 Rentang: {weekDaysInfo[0].formattedDate} s.d {weekDaysInfo[6].formattedDate} ({new Date(weekDaysInfo[0].dateStr).toLocaleDateString("id-ID", { year: "numeric" })})
            </div>
          </div>

          {/* 7 Columns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 items-stretch">
            {weekDaysInfo.map((day) => {
              const dayPlans = filteredPlans.filter((p) => p.date === day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col bg-slate-50/50 dark:bg-slate-950/20 border rounded-2xl p-3.5 transition-all min-h-[350px] ${
                    day.isToday
                      ? "border-indigo-500 ring-4 ring-indigo-500/10 dark:ring-indigo-500/15 bg-indigo-50/5 dark:bg-indigo-950/5"
                      : "border-slate-200 dark:border-slate-850"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex flex-col">
                      <span className={`text-xs font-black tracking-tight uppercase ${day.isToday ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-750 dark:text-slate-300"}`}>
                        {day.dayName}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-0.5">
                        {day.formattedDate}
                      </span>
                    </div>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleAddPlanForDate(day.dateStr)}
                        className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/40"
                        title={`Rancang konten untuk hari ${day.dayName}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Content Area */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-0.5">
                    {dayPlans.length === 0 ? (
                      <div className="h-32 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col items-center justify-center p-3 text-center bg-white/40 dark:bg-transparent">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-snug">
                          Belum ada draf
                        </span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleAddPlanForDate(day.dateStr)}
                            className="mt-2 text-[9px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-wider cursor-pointer hover:underline"
                          >
                            + Jadwalkan
                          </button>
                        )}
                      </div>
                    ) : (
                      dayPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-3xs hover:shadow-2xs transition-all relative group flex flex-col justify-between gap-3 text-left ${
                            plan.status === "published"
                              ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/5 dark:bg-emerald-950/5"
                              : plan.status === "scheduled"
                              ? "border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/5 dark:bg-indigo-950/5"
                              : "border-slate-200 dark:border-slate-800/80"
                          }`}
                        >
                          <div>
                            {/* Platform icon & metadata line */}
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {getPlatformIcon(plan.platform)}
                                <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded font-mono uppercase font-extrabold tracking-wider">
                                  {plan.mediaType}
                                </span>
                              </div>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono font-bold">
                                {plan.time}
                              </span>
                            </div>

                            {/* Post title */}
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                              {plan.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[9px]">
                            <div className="flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  plan.status === "published"
                                    ? "bg-emerald-500"
                                    : plan.status === "scheduled"
                                    ? "bg-indigo-500 animate-pulse"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span className="text-slate-500 dark:text-slate-400 capitalize font-bold">{plan.status}</span>
                            </div>

                            {/* Column card action buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(plan)}
                                className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/60 rounded transition-all cursor-pointer"
                                title="Ubah Rencana"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => onDeletePlan(plan.id)}
                                  className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/60 rounded transition-all cursor-pointer"
                                  title="Hapus Rencana"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Original list grid view fallback */
        filteredPlans.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-2xl text-center space-y-3 transition-colors duration-300 shadow-3xs">
            <Calendar className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto animate-pulse" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Tidak Ada Rencana Konten</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Tidak ditemukan rencana postingan konten untuk filter bulan dan tahun yang Anda pilih.
            </p>
            {(selectedMonth || selectedYear) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth("");
                  setSelectedYear("");
                }}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer inline-block"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-2xl p-5 bg-white dark:bg-slate-900 shadow-3xs hover:shadow-xs transition-all relative ${
                  plan.status === "published"
                    ? "border-emerald-250 dark:border-emerald-900/60 bg-emerald-50/5 dark:bg-emerald-950/5"
                    : plan.status === "scheduled"
                    ? "border-indigo-250 dark:border-indigo-900/60 bg-indigo-50/5 dark:bg-indigo-950/5"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(plan.platform)}
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-2 py-0.5 rounded-md font-mono font-medium">
                      {plan.category}
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md font-medium uppercase font-mono border border-indigo-100/50 dark:border-indigo-900/40">
                      {plan.mediaType}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggleReminder(plan)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-3xs ${
                        reminders[plan.id]
                          ? "bg-amber-100 border-amber-255 text-amber-700"
                          : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-400 hover:text-amber-500 hover:border-amber-200"
                      }`}
                      title="Aktifkan Pengingat Posting"
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="p-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 rounded-xl transition-all cursor-pointer shadow-3xs"
                      title={isReadOnly ? "Lihat Detail" : "Edit Plan"}
                    >
                      {isReadOnly ? <Eye className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={() => onDeletePlan(plan.id)}
                        className="p-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl transition-all cursor-pointer shadow-3xs"
                        title="Hapus Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Date */}
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">{plan.title}</h3>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs mb-3 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {plan.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {plan.time} WIB
                  </span>
                </div>

                {/* Caption Preview */}
                <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205/60 dark:border-slate-800/80 rounded-xl p-3 text-xs text-slate-650 dark:text-slate-350 mb-4 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                  {plan.caption || <em className="text-slate-400">Belum ada caption. Gunakan generator AI!</em>}
                </div>

                {/* Real-time sync & Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        plan.status === "published"
                          ? "bg-emerald-500"
                          : plan.status === "scheduled"
                          ? "bg-indigo-500 animate-ping"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-350 capitalize">{plan.status}</span>
                    {plan.syncedPlatforms && plan.syncedPlatforms.length > 0 && (
                      <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-lg font-bold font-mono flex items-center gap-0.5 animate-pulse">
                        <Check className="h-2 w-2" /> Synced
                      </span>
                    )}
                  </div>

                  {/* Sync Trigger button */}
                  {plan.status !== "published" ? (
                    !isReadOnly ? (
                      <button
                        onClick={() => handleSimulateSync(plan)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-3xs uppercase tracking-wider"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Sinkronisasi Media Sosial</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                        <span>Belum Dipublish</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                      <CheckCircle className="h-3 w-3" />
                      <span>Selesai Dipublish</span>
                    </div>
                  )}
                </div>


              </div>
            ))}
          </div>
        )
      )}

      {/* Manual Plan Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-linear-to-r from-indigo-50/20 to-transparent">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
                {isReadOnly ? "Detail Rencana Konten (Baca Saja)" : (editingPlan ? "Ubah Rencana Konten" : "Rancang Rencana Konten Baru")}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <fieldset disabled={isReadOnly} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Konten</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Tips Memilih Warna Feed Instagram"
                  required
                  className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as ContentPlan["platform"])}
                    disabled={isInstagramOnly}
                    className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium disabled:opacity-75 disabled:bg-slate-100"
                  >
                    <option value="instagram">Instagram</option>
                    {!isInstagramOnly && (
                      <>
                        <option value="tiktok">TikTok</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter / X</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Format Media</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as ContentPlan["mediaType"])}
                    className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                  >
                    <option value="image">Single Image / Grafis</option>
                    <option value="video">Standard Video</option>
                    <option value="carousel">Slide Carousel</option>
                    <option value="reels">Instagram Reels / Short</option>
                    <option value="story">Social Story</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Posting</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Waktu Posting</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentPlan["status"])}
                    className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                  >
                    <option value="draft">Draft (Draf)</option>
                    <option value="scheduled">Scheduled (Terjadwal)</option>
                    <option value="published">Published (Selesai Tayang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Konten</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                  >
                    <option value="Promosi">Promosi</option>
                    <option value="Edukasi & Informasi">Edukasi & Informasi</option>
                    <option value="Enganging">Enganging</option>
                    <option value="Brand Awareness">Brand Awareness</option>
                    <option value="Tren Viral">Tren Viral</option>
                    <option value="Testimoni">Testimoni</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Draf Teks Caption (Bisa diedit atau di-generate via AI)</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Isi caption di sini..."
                  rows={4}
                  className="w-full text-xs px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-700 font-sans"
                />
              </div>
              </fieldset>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
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
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {editingPlan ? "Simpan Perubahan" : "Simpan Plan"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
