import React, { useState, useEffect } from "react";
import {
  ContentPlan,
  DailyInsight,
  PeriodicInsight,
  Campaign,
  GeneralFeedback,
  Inquiry
} from "./types";
import CaptionGenerator from "./components/CaptionGenerator";
import ContentPlanner from "./components/ContentPlanner";
import DailyInsightForm from "./components/DailyInsightForm";
import PeriodicInsightForm from "./components/PeriodicInsightForm";
import AnalyticsView from "./components/AnalyticsView";
import Exporter from "./components/Exporter";
import InquiryDashboard from "./components/InquiryDashboard";
import Login from "./components/Login";

import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  BarChart3,
  DownloadCloud,
  Layers,
  Clock,
  Menu,
  X,
  Plus,
  Briefcase,
  LogOut,
  Eye,
  Sun,
  Moon
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "planner" | "inquiries" | "generator" | "inputs" | "exporter">("dashboard");
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [periodicInsights, setPeriodicInsights] = useState<PeriodicInsight[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [feed, setFeed] = useState<GeneralFeedback[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string; avatar: string } | null>(null);
  const [guestViewUser, setGuestViewUser] = useState<"junibth" | "avenbths">("junibth");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("smm_dark_mode");
    return saved === "true";
  });

  // Apply dark mode class on mount or when changed
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    localStorage.setItem("smm_dark_mode", String(newValue));
  };

  // Load auth session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("smm_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Gagal memulihkan sesi pengguna:", err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user: { username: string; name: string; role: string; avatar: string }) => {
    localStorage.setItem("smm_user", JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("smm_user");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Sync current time clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(
        date.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }) + ` - ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} WIB`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    let targetUser = currentUser?.username || "ilham";
    if (targetUser === "guest") {
      targetUser = guestViewUser;
    }
    const headers: Record<string, string> = {
      "x-user-username": targetUser
    };
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });
  };

  // Fetch all database states from full-stack server
  const fetchAllData = async () => {
    try {
      const [plansRes, dailyRes, periodicRes, campaignsRes, feedRes, inquiriesRes] = await Promise.all([
        apiFetch("/api/content-plans"),
        apiFetch("/api/insights/daily"),
        apiFetch("/api/insights/periodic"),
        apiFetch("/api/campaigns"),
        apiFetch("/api/feedback"),
        apiFetch("/api/inquiries")
      ]);

      const [plansData, dailyData, periodicData, campaignsData, feedData, inquiriesData] = await Promise.all([
        plansRes.json(),
        dailyRes.json(),
        periodicRes.json(),
        campaignsRes.json(),
        feedRes.json(),
        inquiriesRes.json()
      ]);

      setPlans(plansData);
      setDailyInsights(dailyData);
      setPeriodicInsights(periodicData);
      setCampaigns(campaignsData);
      setFeed(feedData);
      setInquiries(inquiriesData);
    } catch (err) {
      console.error("Gagal memuat data dari server:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync data when the user or session updates
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchAllData();
    }
  }, [currentUser?.username, isAuthenticated, guestViewUser]);

  // Mutating handlers connected to backend
  const handleAddPlan = async (newPlan: Partial<ContentPlan>) => {
    try {
      const res = await apiFetch("/api/content-plans", {
        method: "POST",
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        const added = await res.json();
        setPlans((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePlan = async (id: string, updates: Partial<ContentPlan>) => {
    try {
      const res = await apiFetch(`/api/content-plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const res = await apiFetch(`/api/content-plans/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (planId: string, comment: { user: string; text: string }) => {
    try {
      const res = await apiFetch(`/api/content-plans/${planId}/comments`, {
        method: "POST",
        body: JSON.stringify(comment)
      });
      if (res.ok) {
        const addedComment = await res.json();
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id === planId) {
              return { ...p, comments: [...(p.comments || []), addedComment] };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDailyInsight = async (newInsight: Partial<DailyInsight>) => {
    try {
      const res = await apiFetch("/api/insights/daily", {
        method: "POST",
        body: JSON.stringify(newInsight)
      });
      if (res.ok) {
        const added = await res.json();
        setDailyInsights((prev) => {
          const duplicateIdx = prev.findIndex((d) => d.date === added.date && d.platform === added.platform);
          if (duplicateIdx !== -1) {
            const updated = [...prev];
            updated[duplicateIdx] = added;
            return updated;
          }
          return [...prev, added].sort((a, b) => a.date.localeCompare(b.date));
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchDailyInsights = async (platform: "instagram" | "tiktok", items: any[]) => {
    try {
      const res = await apiFetch("/api/insights/batch", {
        method: "POST",
        body: JSON.stringify({ platform, items })
      });
      if (res.ok) {
        const data = await res.json();
        setDailyInsights(data.dailyInsights);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPeriodicInsight = async (newPeriodic: Partial<PeriodicInsight>) => {
    try {
      const res = await apiFetch("/api/insights/periodic", {
        method: "POST",
        body: JSON.stringify(newPeriodic)
      });
      if (res.ok) {
        const added = await res.json();
        setPeriodicInsights((prev) => {
          const duplicateIdx = prev.findIndex((item) => item.month === added.month && item.platform === added.platform);
          if (duplicateIdx !== -1) {
            const updated = [...prev];
            updated[duplicateIdx] = added;
            return updated;
          }
          return [added, ...prev].sort((a, b) => b.month.localeCompare(a.month));
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFeed = async (user: string, text: string) => {
    try {
      const res = await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ user, text })
      });
      if (res.ok) {
        const added = await res.json();
        setFeed((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInquiry = async (newInq: Omit<Inquiry, "id">) => {
    try {
      const res = await apiFetch("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(newInq)
      });
      if (res.ok) {
        const added = await res.json();
        setInquiries((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInquiry = async (id: string, updates: Partial<Inquiry>) => {
    try {
      const res = await apiFetch(`/api/inquiries/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setInquiries((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      const res = await apiFetch(`/api/inquiries/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInsertCaptionToPlanner = (caption: string) => {
    // Open create plan modal in kalender konten and pre-populate caption!
    setActiveTab("planner");
    // Directly inject into planner modal trigger
    setTimeout(() => {
      const addBtn = document.querySelector("#content-planner button") as HTMLButtonElement;
      if (addBtn) addBtn.click();
      
      // Attempt to populate caption text field
      setTimeout(() => {
        const captionTextarea = document.querySelector("textarea[placeholder='Isi caption di sini...']") as HTMLTextAreaElement;
        if (captionTextarea) {
          captionTextarea.value = caption;
          // Trigger React synthetic event update
          const event = new Event("input", { bubbles: true });
          captionTextarea.dispatchEvent(event);
        }
      }, 100);
    }, 100);
  };

  const navigationItemsRaw = [
    { id: "dashboard", label: "Dashboard Analitik", icon: LayoutDashboard },
    { id: "planner", label: "Kalender Konten", icon: CalendarDays },
    { id: "inquiries", label: "Dashboard Inquiry", icon: Briefcase },
    { id: "generator", label: "Caption AI Writer", icon: Sparkles },
    { id: "inputs", label: "Input Insights", icon: BarChart3 },
    { id: "exporter", label: "Cetak & Ekspor", icon: DownloadCloud }
  ] as const;

  const navigationItems = currentUser?.username === "guest"
    ? navigationItemsRaw.filter((item) => ["dashboard", "planner", "inquiries"].includes(item.id))
    : navigationItemsRaw;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl animate-bounce">
            <Layers className="h-10 w-10 animate-spin" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">SOSMED SPECIALIST ENGINE</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Memuat database & inisialisasi modul analitik...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row font-sans text-slate-700 antialiased relative">
      
      {/* Printable Report Title Card (Hidden on Screen, Visible only on Print) */}
      <div className="hidden print:block w-full p-8 space-y-6">
        <div className="border-b-4 border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">LAPORAN ANALISIS MEDIA SOSIAL</h1>
            <p className="text-sm text-slate-500 font-mono">Sosial Media Specialist Dashboard - Laporan Resmi</p>
          </div>
          <p className="text-xs text-slate-600 font-mono text-right">{currentTime}</p>
        </div>
        <div className="grid grid-cols-3 gap-6 bg-slate-100 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Followers Terakhir</span>
            <span className="text-xl font-bold font-mono text-slate-800">
              {dailyInsights.length > 0 ? dailyInsights[dailyInsights.length - 1].followers.toLocaleString() : "-"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rencana Konten</span>
            <span className="text-xl font-bold font-mono text-slate-800">{plans.length} Post</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Platform Aktif</span>
            <span className="text-xl font-bold font-mono text-indigo-600">Instagram, TikTok</span>
          </div>
        </div>
      </div>

      {/* Navigation Sidebar (Hidden on Print) */}
      <aside className="w-full lg:w-64 bg-white text-slate-600 flex-none flex flex-col justify-between shrink-0 border-r border-slate-200 z-30 print:hidden">
        <div>
          {/* Brand Row */}
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight font-display leading-none">Sosmed Engine</h1>
                <p className="text-[9px] text-indigo-600 font-bold tracking-wider uppercase mt-0.5">Specialist Pro</p>
              </div>
            </div>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer border border-slate-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Nav menu links */}
          <nav className={`p-4 space-y-1.5 ${mobileMenuOpen ? "block" : "hidden lg:block"}`}>
            {navigationItems.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === item.id
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)] font-bold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                  }`}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Identity / Metadata Row */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 hidden lg:flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 shrink-0 text-xs uppercase shadow-3xs">
              {currentUser?.avatar || "U"}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">{currentUser?.name}</span>
              <span className="text-[10px] text-slate-500 font-semibold block truncate leading-tight">{currentUser?.role.split("(")[0]}</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-100/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col justify-between min-h-0 min-w-0">
        
        {/* Header Row (Hidden on Print) */}
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-900 tracking-tight font-display">
              {navigationItems.find((n) => n.id === activeTab)?.label}
            </h2>
            <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100/80 text-[9px] font-bold rounded-full items-center gap-1 uppercase font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Mode
            </span>

            {/* Guest Source Switcher */}
            {currentUser?.username === "guest" && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2 py-0.5 md:px-2.5 md:py-1">
                <span className="hidden lg:inline-flex text-[10px] font-black text-amber-800 uppercase tracking-wider font-mono items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                  <span>Data Pantau:</span>
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setGuestViewUser("junibth")}
                    className={`px-2.5 py-0.5 text-[10px] md:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      guestViewUser === "junibth"
                        ? "bg-indigo-600 text-white shadow-3xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    🌸 Juni (Instagram)
                  </button>
                  <button
                    onClick={() => setGuestViewUser("avenbths")}
                    className={`px-2.5 py-0.5 text-[10px] md:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      guestViewUser === "avenbths"
                        ? "bg-indigo-600 text-white shadow-3xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    🏝️ Aven (Instagram)
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Night Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="px-2.5 py-1 text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-3xs"
              title={isDarkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Malam"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>TERANG</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>MALAM</span>
                </>
              )}
            </button>
            <p className="hidden md:block text-[11px] text-slate-400 font-mono text-right">{currentTime}</p>
            <div className="h-5 w-[1px] bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800">{currentUser?.name}</span>
                <span className="text-[9px] text-slate-400 font-medium leading-none">
                  {currentUser?.role}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 font-bold text-white flex items-center justify-center shadow-xs border border-indigo-500/10 text-xs">
                {currentUser?.avatar || "U"}
              </div>
              {/* Mobile logout button shortcut */}
              <button
                onClick={handleLogout}
                className="lg:hidden p-1.5 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                title="Keluar"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Pages */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0">
          
          {/* 1. Dashboard Analitik View */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <AnalyticsView
                dailyInsights={dailyInsights}
                periodicInsights={periodicInsights}
                campaigns={campaigns}
                isInstagramOnly={currentUser?.username === "junibth" || currentUser?.username === "avenbths" || currentUser?.username === "guest"}
              />
            </div>
          )}

          {/* 2. Kalender Konten View */}
          {activeTab === "planner" && (
            <div className="space-y-6">
              <ContentPlanner
                plans={plans}
                onAddPlan={handleAddPlan}
                onUpdatePlan={handleUpdatePlan}
                onDeletePlan={handleDeletePlan}
                onAddComment={handleAddComment}
                isInstagramOnly={currentUser?.username === "junibth" || currentUser?.username === "avenbths" || currentUser?.username === "guest"}
                isReadOnly={currentUser?.username === "guest"}
              />
            </div>
          )}

          {/* Dashboard Inquiry View */}
          {activeTab === "inquiries" && (
            <div className="space-y-6">
              <InquiryDashboard
                inquiries={inquiries}
                onAddInquiry={handleAddInquiry}
                onUpdateInquiry={handleUpdateInquiry}
                onDeleteInquiry={handleDeleteInquiry}
                isReadOnly={currentUser?.username === "guest"}
              />
            </div>
          )}

          {/* 3. AI Caption Generator View */}
          {activeTab === "generator" && (
            <div className="space-y-6">
              <CaptionGenerator 
                onInsertToPlanner={handleInsertCaptionToPlanner}
                isInstagramOnly={currentUser?.username === "junibth" || currentUser?.username === "avenbths"}
              />
            </div>
          )}

          {/* 4. Input Insights View */}
          {activeTab === "inputs" && (
            <div className="space-y-6">
              <DailyInsightForm
                onAddDailyInsight={handleAddDailyInsight}
                onBatchDailyInsights={handleBatchDailyInsights}
                isInstagramOnly={currentUser?.username === "junibth" || currentUser?.username === "avenbths"}
              />
              <PeriodicInsightForm 
                onAddPeriodicInsight={handleAddPeriodicInsight} 
                dailyInsights={dailyInsights}
                isInstagramOnly={currentUser?.username === "junibth" || currentUser?.username === "avenbths"}
              />
            </div>
          )}

          {/* 6. Cetak & Ekspor View */}
          {activeTab === "exporter" && (
            <div className="space-y-6">
              <Exporter 
                plans={plans} 
                dailyInsights={dailyInsights} 
                campaigns={campaigns}
                isInstagramOnly={currentUser?.username === "junibth" || currentUser?.username === "avenbths"}
              />
            </div>
          )}

        </div>

        {/* Footer (Hidden on Print) */}
        <footer className="bg-white border-t border-slate-100 py-3 px-6 flex justify-between items-center text-[10px] text-slate-400 font-mono shrink-0 print:hidden">
          <span>© 2026 Sosial Media Specialist Dashboard. Hak Cipta Dilindungi.</span>
          <span>SMM Engine v2.4</span>
        </footer>

      </main>
    </div>
  );
}
