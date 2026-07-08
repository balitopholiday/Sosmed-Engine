import React, { useState } from "react";
import { Layers, Shield, User, Lock, AlertCircle, ArrowRight, Sun, Moon } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { username: string; name: string; role: string; avatar: string }) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Login({ onLoginSuccess, isDarkMode, onToggleDarkMode }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const accounts = [
    {
      username: "ilham",
      password: "bangjin99",
      name: "Ilham",
      role: "SMM Specialist (Full Admin)",
      avatar: "I",
      desc: "Hak akses penuh untuk mengelola kalender konten, analitik, dan inquiry."
    },
    {
      username: "junibth",
      password: "junibth99",
      name: "Juni",
      role: "Juni (Instagram - Bali Top Holiday)",
      avatar: "J",
      desc: "Akses peninjauan konten, analitik Instagram, dan draf draf untuk Bali Top Holiday."
    },
    {
      username: "avenbths",
      password: "avenbths99",
      name: "Aven",
      role: "Aven (Instagram - Bali Top Holidays)",
      avatar: "A",
      desc: "Akses peninjauan konten, analitik Instagram, dan draf draf untuk Bali Top Holidays."
    },
    {
      username: "guest",
      password: "guestbth99",
      name: "Tamu (Guest)",
      role: "Guest Viewer (Akses Pantau)",
      avatar: "G",
      desc: "Akses pantau (hanya baca) untuk melihat data inquiry, kalender konten, dan analitik milik Juni & Aven. Dapat beralih sumber data langsung di dasbor."
    }
  ];


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi!");
      return;
    }

    const matched = accounts.find(
      (acc) => acc.username === username.toLowerCase().trim() && acc.password === password
    );

    if (matched) {
      setError("");
      onLoginSuccess({
        username: matched.username,
        name: matched.name,
        role: matched.role,
        avatar: matched.avatar
      });
    } else {
      setError("Username atau password salah! Silakan periksa kembali.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center p-4 relative font-sans transition-colors duration-300">
      {/* Night Mode Toggle Button */}
      <button
        onClick={onToggleDarkMode}
        className="absolute top-4 right-4 px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 dark:text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-850 shadow-3xs z-50 uppercase tracking-wider"
        title={isDarkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Malam"}
      >
        {isDarkMode ? (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>TERANG</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>MALAM</span>
          </>
        )}
      </button>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10 animate-pulse" />

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 md:p-10 relative z-10 flex flex-col justify-between transition-colors duration-300">
        <div>
          {/* Header logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none uppercase font-display">Sosmed Engine</h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase mt-1">Specialist Pro</p>
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-200 tracking-tight font-display mb-1.5">Selamat Datang Kembali</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Silakan masuk menggunakan kredensial akun Anda untuk mengakses dasbor.</p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2 mb-5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-8 text-center">
          © 2026 SMM Specialist Dashboard. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
