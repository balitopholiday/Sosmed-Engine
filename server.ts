import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db-store.json");

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
}

// Interfaces
interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

interface ContentPlan {
  id: string;
  title: string;
  platform: "instagram" | "tiktok" | "twitter" | "facebook" | "linkedin";
  date: string;
  time: string;
  status: "draft" | "scheduled" | "published";
  caption: string;
  category: string;
  mediaType: "image" | "video" | "carousel" | "reels" | "story";
  notes: string;
  comments: Comment[];
  syncedPlatforms?: string[]; // to simulate real-time calendar syncing
}

interface DailyInsight {
  id: string;
  date: string;
  platform: "instagram" | "tiktok";
  followers: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number; // (likes+comments+shares+saves)/reach or impressions
}

interface PeriodicInsight {
  id: string;
  month: string; // YYYY-MM
  platform: "instagram" | "tiktok";
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformingPost: string;
  analysis: string;
}

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "planned" | "completed";
  platforms: string[];
  budget: number;
  metrics: {
    reach: number;
    engagement: number;
    conversions: number;
  };
}

interface Inquiry {
  id: string;
  hari: string;
  tanggal: string;
  usernameNama: string;
  jumlah: number;
  periode: string;
  nomorWATamu: string;
  stage: "Engage" | "Penawaran" | "Nego" | "Deal" | "Tidak Deal";
}

interface Database {
  contentPlans: ContentPlan[];
  dailyInsights: DailyInsight[];
  periodicInsights: PeriodicInsight[];
  campaigns: Campaign[];
  generalFeedback: { id: string; user: string; text: string; timestamp: string }[];
  inquiries: Inquiry[];
}

// Default pre-populated seed data
const getInitialData = (): Database => {
  const plans: ContentPlan[] = [
    {
      id: "plan-1",
      title: "Tips SEO Instagram Reels 2026",
      platform: "instagram",
      date: "2026-07-08",
      time: "10:00",
      status: "scheduled",
      caption: "Mau Reels kamu rame jangkauan? Cobain tips SEO rahasia ini! 🚀\n\nBanyak yang gak sadar kalau algoritma sekarang sangat memperhatikan keyword di caption. Simak detailnya di video ya!\n\n#InstagramTips #SosmedTips #DigitalMarketing #SEOInstagram",
      category: "Educational",
      mediaType: "reels",
      notes: "Pastikan cover reels punya teks kontras tinggi.",
      comments: [
        { id: "c-1", user: "Andi (Graphic Designer)", text: "Desain covernya udah siap di folder share ya!", timestamp: "2026-07-06T15:30:00.000Z" },
        { id: "c-2", user: "Rara (Copywriter)", text: "Hashtagnya udah di-optimize juga sesuai riset keyword terbaru.", timestamp: "2026-07-06T16:00:00.000Z" }
      ],
      syncedPlatforms: ["instagram"]
    },
    {
      id: "plan-2",
      title: "Behind the Scenes - Kehidupan Agensi",
      platform: "tiktok",
      date: "2026-07-07",
      time: "18:00",
      status: "scheduled",
      caption: "Bila klien minta revisi 10 menit sebelum pulang kantor... 🙃 #AgencyLife #OfficeHumor #TikTokTrending",
      category: "Entertainment",
      mediaType: "video",
      notes: "Pakai sound tren 'Oh No' atau yang lagi viral hari ini.",
      comments: [],
      syncedPlatforms: []
    },
    {
      id: "plan-3",
      title: "Promo Flash Sale Jasa Sosmed",
      platform: "instagram",
      date: "2026-07-05",
      time: "12:00",
      status: "published",
      caption: "DISKON 30% buat kelola medsos bisnismu hanya untuk 5 slot pertama bulan ini! Hubungi link di bio sekarang! 📈",
      category: "Promo",
      mediaType: "image",
      notes: "Link pendaftaran arahkan ke WhatsApp admin.",
      comments: [
        { id: "c-3", user: "Budi (Supervisor)", text: "Bagus, interaksinya lumayan tinggi kemarin.", timestamp: "2026-07-05T14:20:00.000Z" }
      ],
      syncedPlatforms: ["instagram"]
    },
    {
      id: "plan-4",
      title: "Q&A Mingguan: Tanya Apa Saja",
      platform: "instagram",
      date: "2026-07-10",
      time: "15:00",
      status: "draft",
      caption: "Kalian punya kendala apa sih waktu kelola sosmed sendiri? Tulis di kolom komentar ya, kita bahas nanti sore! 👇",
      category: "Interactive",
      mediaType: "story",
      notes: "Gunakan stiker Question di Story.",
      comments: []
    }
  ];

  // Helper to generate historical daily insights (last 14 days, from June 23 to July 6)
  const daily: DailyInsight[] = [];
  const platforms: ("instagram" | "tiktok")[] = ["instagram", "tiktok"];
  
  for (let i = 14; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // IG stats
    const igReach = 5000 + Math.floor(Math.random() * 2000) + (14 - i) * 150;
    const igLikes = Math.floor(igReach * 0.06);
    const igComments = Math.floor(igReach * 0.015);
    const igShares = Math.floor(igReach * 0.02);
    const igSaves = Math.floor(igReach * 0.012);
    const igTotalEng = igLikes + igComments + igShares + igSaves;
    daily.push({
      id: `daily-ig-${dateStr}`,
      date: dateStr,
      platform: "instagram",
      followers: 12400 + (14 - i) * 35,
      reach: igReach,
      impressions: Math.floor(igReach * 1.3),
      likes: igLikes,
      comments: igComments,
      shares: igShares,
      saves: igSaves,
      engagementRate: parseFloat(((igTotalEng / igReach) * 100).toFixed(2))
    });

    // TikTok stats
    const ttReach = 8000 + Math.floor(Math.random() * 4000) + (14 - i) * 200;
    const ttLikes = Math.floor(ttReach * 0.09);
    const ttComments = Math.floor(ttReach * 0.02);
    const ttShares = Math.floor(ttReach * 0.035);
    const ttSaves = Math.floor(ttReach * 0.015);
    const ttTotalEng = ttLikes + ttComments + ttShares + ttSaves;
    daily.push({
      id: `daily-tt-${dateStr}`,
      date: dateStr,
      platform: "tiktok",
      followers: 24500 + (14 - i) * 75,
      reach: ttReach,
      impressions: Math.floor(ttReach * 1.5),
      likes: ttLikes,
      comments: ttComments,
      shares: ttShares,
      saves: ttSaves,
      engagementRate: parseFloat(((ttTotalEng / ttReach) * 100).toFixed(2))
    });
  }

  const periodic: PeriodicInsight[] = [
    {
      id: "p-june-ig",
      month: "2026-06",
      platform: "instagram",
      totalReach: 185000,
      totalEngagement: 19800,
      avgEngagementRate: 10.7,
      topPerformingPost: "Tips SEO Reels (plan-1)",
      analysis: "Jangkauan Instagram Reels meningkat pesat berkat penggunaan sound trending dan optimasi kata kunci pada deskripsi. Audiens lebih interaktif saat konten dibagikan di sore hari (jam 17.00 - 19.00)."
    },
    {
      id: "p-june-tt",
      month: "2026-06",
      platform: "tiktok",
      totalReach: 342000,
      totalEngagement: 51300,
      avgEngagementRate: 15.0,
      topPerformingPost: "Sketsa Komedi Klien (plan-2)",
      analysis: "Format komedi berdurasi pendek (<15 detik) memperoleh retensi penonton yang sangat tinggi. Share rate meningkat 45% dibanding bulan lalu. Direkomendasikan menambah frekuensi konten hiburan mingguan."
    }
  ];

  const campaigns: Campaign[] = [
    {
      id: "camp-1",
      name: "Q3 Brand Awareness",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      status: "active",
      platforms: ["instagram", "tiktok"],
      budget: 15000000,
      metrics: {
        reach: 125000,
        engagement: 14500,
        conversions: 350
      }
    },
    {
      id: "camp-2",
      name: "Product Launch Promo",
      startDate: "2026-07-15",
      endDate: "2026-07-31",
      status: "planned",
      platforms: ["instagram", "linkedin"],
      budget: 8000000,
      metrics: {
        reach: 0,
        engagement: 0,
        conversions: 0
      }
    }
  ];

  const feedback = [
    { id: "f-1", user: "Toni (Project Manager)", text: "Dashboard ini mempermudah kita tracking performa kampanye Q3 secara real-time. Bagus!", timestamp: "2026-07-06T10:15:00.000Z" },
    { id: "f-2", user: "Sari (SMM Lead)", text: "Caption Generator AI-nya membantu banget, menghemat waktu bikin draf caption harian.", timestamp: "2026-07-06T11:45:00.000Z" }
  ];

  const inquiries: Inquiry[] = [
    {
      id: "inq-1",
      hari: "Senin",
      tanggal: "2026-07-06",
      usernameNama: "budi_salon",
      jumlah: 10,
      periode: "1 Bulan",
      nomorWATamu: "081234567890",
      stage: "Deal"
    },
    {
      id: "inq-2",
      hari: "Selasa",
      tanggal: "2026-07-07",
      usernameNama: "kopi_senja",
      jumlah: 25,
      periode: "3 Bulan",
      nomorWATamu: "089876543210",
      stage: "Nego"
    },
    {
      id: "inq-3",
      hari: "Rabu",
      tanggal: "2026-07-08",
      usernameNama: "buku_ku",
      jumlah: 5,
      periode: "2 Minggu",
      nomorWATamu: "085544332211",
      stage: "Penawaran"
    },
    {
      id: "inq-4",
      hari: "Kamis",
      tanggal: "2026-07-09",
      usernameNama: "laundry_clean",
      jumlah: 30,
      periode: "6 Bulan",
      nomorWATamu: "082211223344",
      stage: "Engage"
    },
    {
      id: "inq-5",
      hari: "Jumat",
      tanggal: "2026-07-10",
      usernameNama: "travel_asia",
      jumlah: 50,
      periode: "1 Tahun",
      nomorWATamu: "087788990011",
      stage: "Tidak Deal"
    }
  ];

  return {
    contentPlans: plans,
    dailyInsights: daily,
    periodicInsights: periodic,
    campaigns,
    generalFeedback: feedback,
    inquiries
  };
};

// User-specific database file resolver
const getUserDbFile = (username: string): string => {
  const safeName = username.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(process.cwd(), `db-store-${safeName}.json`);
};

// Database Initialization Helper
const loadUserDatabase = (username: string): Database => {
  const userFile = getUserDbFile(username);
  try {
    if (fs.existsSync(userFile)) {
      const data = fs.readFileSync(userFile, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.inquiries) {
        parsed.inquiries = [];
      }
      return parsed;
    }
  } catch (err) {
    console.error(`Error reading database file for user ${username}:`, err);
  }
  
  // Seed new user database from template store, or clean initial state
  let initialDb: Database;
  try {
    const mainFile = path.join(process.cwd(), "db-store.json");
    if (fs.existsSync(mainFile)) {
      const mainData = fs.readFileSync(mainFile, "utf-8");
      initialDb = JSON.parse(mainData);
    } else {
      initialDb = getInitialData();
    }
  } catch (err) {
    initialDb = getInitialData();
  }
  
  saveUserDatabase(username, initialDb);
  return initialDb;
};

const saveUserDatabase = (username: string, db: Database) => {
  const userFile = getUserDbFile(username);
  try {
    fs.writeFileSync(userFile, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing to database file for user ${username}:`, err);
  }
};

// Express Middleware to resolve user-specific database
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) {
    return next();
  }
  
  const usernameHeader = req.headers["x-user-username"];
  const username = (Array.isArray(usernameHeader) ? usernameHeader[0] : usernameHeader) || (req.query.username as string) || "ilham";
  
  const safeUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "");
  (req as any).username = safeUsername;
  (req as any).userDb = loadUserDatabase(safeUsername);
  next();
});

// Legacy backward compatibility placeholders
const loadDatabase = () => loadUserDatabase("ilham");
const saveDatabase = (db: Database) => saveUserDatabase("ilham", db);
let dbStore = loadUserDatabase("ilham");

// Helper to merge daily insights for user "ilham" (aggregates ilham, junibth, avenbths)
function getMergedDailyInsights(): DailyInsight[] {
  const users = ["ilham", "junibth", "avenbths"];
  const mergedMap: Record<string, DailyInsight> = {};

  users.forEach((u) => {
    const db = loadUserDatabase(u);
    if (db && Array.isArray(db.dailyInsights)) {
      db.dailyInsights.forEach((item) => {
        // Since aven and juni are strictly instagram, exclude any tiktok data from them
        if ((u === "junibth" || u === "avenbths") && item.platform !== "instagram") {
          return;
        }
        
        const key = `${item.date}_${item.platform}`;
        if (!mergedMap[key]) {
          mergedMap[key] = {
            id: item.id,
            date: item.date,
            platform: item.platform,
            followers: item.followers,
            reach: item.reach,
            impressions: item.impressions,
            likes: item.likes,
            comments: item.comments,
            shares: item.shares,
            saves: item.saves,
            engagementRate: item.engagementRate,
          };
        } else {
          const existing = mergedMap[key];
          existing.followers += item.followers;
          existing.reach += item.reach;
          existing.impressions += item.impressions;
          existing.likes += item.likes;
          existing.comments += item.comments;
          existing.shares += item.shares;
          existing.saves += item.saves;
          const totalEng = existing.likes + existing.comments + existing.shares + existing.saves;
          existing.engagementRate = parseFloat(((totalEng / Math.max(existing.reach, 1)) * 100).toFixed(2));
        }
      });
    }
  });

  return Object.values(mergedMap).sort((a, b) => a.date.localeCompare(b.date));
}

// Helper to merge periodic insights for user "ilham"
function getMergedPeriodicInsights(): PeriodicInsight[] {
  const users = ["ilham", "junibth", "avenbths"];
  const mergedMap: Record<string, PeriodicInsight> = {};

  users.forEach((u) => {
    const db = loadUserDatabase(u);
    if (db && Array.isArray(db.periodicInsights)) {
      db.periodicInsights.forEach((item) => {
        if ((u === "junibth" || u === "avenbths") && item.platform !== "instagram") {
          return;
        }

        const key = `${item.month}_${item.platform}`;
        const label = u === "junibth" ? "Juni" : u === "avenbths" ? "Aven" : "Ilham";
        if (!mergedMap[key]) {
          mergedMap[key] = {
            id: item.id,
            month: item.month,
            platform: item.platform,
            totalReach: item.totalReach,
            totalEngagement: item.totalEngagement,
            avgEngagementRate: item.avgEngagementRate,
            topPerformingPost: item.topPerformingPost ? `${label}: ${item.topPerformingPost}` : "",
            analysis: item.analysis ? `${label}: ${item.analysis}` : ""
          };
        } else {
          const existing = mergedMap[key];
          existing.totalReach += item.totalReach;
          existing.totalEngagement += item.totalEngagement;
          existing.avgEngagementRate = existing.totalReach > 0 
            ? parseFloat(((existing.totalEngagement / existing.totalReach) * 100).toFixed(2)) 
            : 0;
          if (item.topPerformingPost) {
            existing.topPerformingPost = existing.topPerformingPost 
              ? `${existing.topPerformingPost} | ${label}: ${item.topPerformingPost}` 
              : `${label}: ${item.topPerformingPost}`;
          }
          if (item.analysis) {
            existing.analysis = existing.analysis 
              ? `${existing.analysis}\n\n${label}: ${item.analysis}` 
              : `${label}: ${item.analysis}`;
          }
        }
      });
    }
  });

  return Object.values(mergedMap).sort((a, b) => b.month.localeCompare(a.month));
}

// API Endpoints

// 1. AI Caption Generator
app.post("/api/generate-caption", async (req, res) => {
  const { platform, topic, tone, keywords, length } = req.body;

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API client is not configured on the server. Please check your secrets.",
    });
  }

  try {
    const prompt = `Buatkan caption media sosial yang SEO Optimized dan Highly Scannable dalam Bahasa Indonesia untuk platform ${platform || "Instagram"}.
Detail Konten:
- Topik/Isi: ${topic || "Umum"}
- Nada/Tone: ${tone || "Casual"}
- Kata Kunci SEO: ${keywords || "Tidak ada"}
- Panjang Caption: ${length || "Sedang"}

Pastikan caption memiliki kriteria berikut:
1. **Hook Menarik**: Headline yang bikin penasaran dan menghentikan jempol scrolling audiens di baris pertama.
2. **Scannable**: Gunakan spasi baris, poin-poin/bullet, dan emoji yang relevan agar teks sangat mudah dibaca secara cepat.
3. **SEO Optimized**: Masukkan kata kunci SEO yang diminta secara halus dan organik di dalam teks.
4. **Call to Action (CTA)**: Ajakan bertindak yang jelas di bagian akhir (misal: "Komen di bawah!", "Klik link di bio!").
5. **Hashtags Terpilih**: 4-7 hashtag yang relevan dan populer di bagian terbawah.

Tolong kembalikan caption langsung tanpa teks pengantar atau penutup tambahan dari AI.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah pakar Sosial Media Specialist dan Copywriter SEO handal. Anda menulis caption yang menarik, memicu interaksi tinggi (high engagement), mudah dipindai mata (scannable), dan teroptimasi mesin pencari sosial (social SEO).",
        temperature: 0.8,
      },
    });

    const text = response.text || "Gagal membuat caption. Silakan coba lagi.";
    res.json({ caption: text });
  } catch (err: any) {
    console.error("Error generating caption with Gemini API:", err);
    res.status(500).json({ error: err.message || "Gagal memproses caption." });
  }
});

// 2. Content Plans (CRUD)
app.get("/api/content-plans", (req, res) => {
  const db = (req as any).userDb;
  const username = (req as any).username;
  if (username === "junibth" || username === "avenbths") {
    // Only return Instagram plans
    return res.json(db.contentPlans.filter((p: any) => p.platform === "instagram"));
  }
  res.json(db.contentPlans);
});

app.post("/api/content-plans", (req, res) => {
  const db = (req as any).userDb;
  const username = (req as any).username;
  const newPlan: ContentPlan = {
    id: `plan-${Date.now()}`,
    title: req.body.title || "Untitled Plan",
    platform: req.body.platform || "instagram",
    date: req.body.date || new Date().toISOString().split("T")[0],
    time: req.body.time || "12:00",
    status: req.body.status || "draft",
    caption: req.body.caption || "",
    category: req.body.category || "General",
    mediaType: req.body.mediaType || "image",
    notes: req.body.notes || "",
    comments: [],
    syncedPlatforms: req.body.syncedPlatforms || []
  };

  db.contentPlans.push(newPlan);
  saveUserDatabase(username, db);
  res.status(201).json(newPlan);
});

app.put("/api/content-plans/:id", (req, res) => {
  const { id } = req.params;
  const db = (req as any).userDb;
  const username = (req as any).username;
  const index = db.contentPlans.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Plan tidak ditemukan" });
  }

  db.contentPlans[index] = {
    ...db.contentPlans[index],
    title: req.body.title !== undefined ? req.body.title : db.contentPlans[index].title,
    platform: req.body.platform !== undefined ? req.body.platform : db.contentPlans[index].platform,
    date: req.body.date !== undefined ? req.body.date : db.contentPlans[index].date,
    time: req.body.time !== undefined ? req.body.time : db.contentPlans[index].time,
    status: req.body.status !== undefined ? req.body.status : db.contentPlans[index].status,
    caption: req.body.caption !== undefined ? req.body.caption : db.contentPlans[index].caption,
    category: req.body.category !== undefined ? req.body.category : db.contentPlans[index].category,
    mediaType: req.body.mediaType !== undefined ? req.body.mediaType : db.contentPlans[index].mediaType,
    notes: req.body.notes !== undefined ? req.body.notes : db.contentPlans[index].notes,
    syncedPlatforms: req.body.syncedPlatforms !== undefined ? req.body.syncedPlatforms : db.contentPlans[index].syncedPlatforms
  };

  saveUserDatabase(username, db);
  res.json(db.contentPlans[index]);
});

app.delete("/api/content-plans/:id", (req, res) => {
  const { id } = req.params;
  const db = (req as any).userDb;
  const username = (req as any).username;
  const index = db.contentPlans.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Plan tidak ditemukan" });
  }

  db.contentPlans.splice(index, 1);
  saveUserDatabase(username, db);
  res.json({ message: "Plan berhasil dihapus" });
});

// Comments on plans
app.post("/api/content-plans/:id/comments", (req, res) => {
  const { id } = req.params;
  const { user, text } = req.body;
  const db = (req as any).userDb;
  const username = (req as any).username;
  const plan = db.contentPlans.find((p) => p.id === id);

  if (!plan) {
    return res.status(404).json({ error: "Plan tidak ditemukan" });
  }

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    user: user || "Team Member",
    text: text || "",
    timestamp: new Date().toISOString()
  };

  if (!plan.comments) plan.comments = [];
  plan.comments.push(newComment);
  saveUserDatabase(username, db);
  res.status(201).json(newComment);
});

// 3. Daily Insights (CRUD)
app.get("/api/insights/daily", (req, res) => {
  const db = (req as any).userDb;
  const username = (req as any).username;
  if (username === "ilham") {
    return res.json(getMergedDailyInsights());
  }
  if (username === "junibth" || username === "avenbths") {
    // Only return Instagram insights
    return res.json(db.dailyInsights.filter((d: any) => d.platform === "instagram"));
  }
  res.json(db.dailyInsights);
});

app.post("/api/insights/daily", (req, res) => {
  const { date, platform, followers, reach, impressions, likes, comments, shares, saves } = req.body;
  const db = (req as any).userDb;
  const username = (req as any).username;

  const reachNum = Number(reach) || 1;
  const likesNum = Number(likes) || 0;
  const commentsNum = Number(comments) || 0;
  const sharesNum = Number(shares) || 0;
  const savesNum = Number(saves) || 0;
  const totalEng = likesNum + commentsNum + sharesNum + savesNum;

  const newInsight: DailyInsight = {
    id: `daily-${platform || "ig"}-${Date.now()}`,
    date: date || new Date().toISOString().split("T")[0],
    platform: platform || "instagram",
    followers: Number(followers) || 0,
    reach: reachNum,
    impressions: Number(impressions) || reachNum,
    likes: likesNum,
    comments: commentsNum,
    shares: sharesNum,
    saves: savesNum,
    engagementRate: parseFloat(((totalEng / reachNum) * 100).toFixed(2))
  };

  // Prevent duplicate for same platform + date by replacing or appending
  const duplicateIndex = db.dailyInsights.findIndex(
    (item) => item.date === newInsight.date && item.platform === newInsight.platform
  );

  if (duplicateIndex !== -1) {
    db.dailyInsights[duplicateIndex] = newInsight;
  } else {
    db.dailyInsights.push(newInsight);
  }

  // Keep daily insights sorted by date
  db.dailyInsights.sort((a, b) => a.date.localeCompare(b.date));

  saveUserDatabase(username, db);
  res.status(201).json(newInsight);
});

// Batch uploading raw IG / TikTok stats (Simulating CSV upload)
app.post("/api/insights/batch", (req, res) => {
  const { platform, items } = req.body;
  const db = (req as any).userDb;
  const username = (req as any).username;

  if (!platform || !Array.isArray(items)) {
    return res.status(400).json({ error: "Platform and items array are required" });
  }

  items.forEach((item: any) => {
    const reachNum = Number(item.reach) || 100;
    const likesNum = Number(item.likes) || 0;
    const commentsNum = Number(item.comments) || 0;
    const sharesNum = Number(item.shares) || 0;
    const savesNum = Number(item.saves) || 0;
    const totalEng = likesNum + commentsNum + sharesNum + savesNum;

    const newInsight: DailyInsight = {
      id: `daily-${platform}-${item.date || Date.now()}-${Math.floor(Math.random()*1000)}`,
      date: item.date || new Date().toISOString().split("T")[0],
      platform,
      followers: Number(item.followers) || 0,
      reach: reachNum,
      impressions: Number(item.impressions) || Math.floor(reachNum * 1.2),
      likes: likesNum,
      comments: commentsNum,
      shares: sharesNum,
      saves: savesNum,
      engagementRate: parseFloat(((totalEng / reachNum) * 100).toFixed(2))
    };

    // Replace if exact duplicate is found, else push
    const duplicateIndex = db.dailyInsights.findIndex(
      (d) => d.date === newInsight.date && d.platform === newInsight.platform
    );
    if (duplicateIndex !== -1) {
      db.dailyInsights[duplicateIndex] = newInsight;
    } else {
      db.dailyInsights.push(newInsight);
    }
  });

  db.dailyInsights.sort((a, b) => a.date.localeCompare(b.date));
  saveUserDatabase(username, db);
  res.status(200).json({ message: `Successfully synced ${items.length} records.`, dailyInsights: db.dailyInsights });
});

// 4. Periodic Insights (CRUD)
app.get("/api/insights/periodic", (req, res) => {
  const db = (req as any).userDb;
  const username = (req as any).username;
  if (username === "ilham") {
    return res.json(getMergedPeriodicInsights());
  }
  if (username === "junibth" || username === "avenbths") {
    // Only return Instagram insights
    return res.json(db.periodicInsights.filter((p: any) => p.platform === "instagram"));
  }
  res.json(db.periodicInsights);
});

app.post("/api/insights/periodic", (req, res) => {
  const { month, platform, totalReach, totalEngagement, avgEngagementRate, topPerformingPost, analysis } = req.body;
  const db = (req as any).userDb;
  const username = (req as any).username;

  const newPeriodic: PeriodicInsight = {
    id: `p-${month || "2026-07"}-${platform || "ig"}-${Date.now()}`,
    month: month || "2026-07",
    platform: platform || "instagram",
    totalReach: Number(totalReach) || 0,
    totalEngagement: Number(totalEngagement) || 0,
    avgEngagementRate: Number(avgEngagementRate) || 0,
    topPerformingPost: topPerformingPost || "",
    analysis: analysis || ""
  };

  const duplicateIndex = db.periodicInsights.findIndex(
    (item) => item.month === newPeriodic.month && item.platform === newPeriodic.platform
  );

  if (duplicateIndex !== -1) {
    db.periodicInsights[duplicateIndex] = newPeriodic;
  } else {
    db.periodicInsights.push(newPeriodic);
  }

  db.periodicInsights.sort((a, b) => b.month.localeCompare(a.month)); // Newest first

  saveUserDatabase(username, db);
  res.status(201).json(newPeriodic);
});

// 5. Campaigns
app.get("/api/campaigns", (req, res) => {
  const db = (req as any).userDb;
  res.json(db.campaigns);
});

app.post("/api/campaigns", (req, res) => {
  const db = (req as any).userDb;
  const username = (req as any).username;
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    name: req.body.name || "Kampanye Baru",
    startDate: req.body.startDate || new Date().toISOString().split("T")[0],
    endDate: req.body.endDate || new Date().toISOString().split("T")[0],
    status: req.body.status || "planned",
    platforms: req.body.platforms || ["instagram"],
    budget: Number(req.body.budget) || 0,
    metrics: req.body.metrics || { reach: 0, engagement: 0, conversions: 0 }
  };

  db.campaigns.push(newCampaign);
  saveUserDatabase(username, db);
  res.status(201).json(newCampaign);
});

// 6. Collaboration Feedback Feed
app.get("/api/feedback", (req, res) => {
  const db = (req as any).userDb;
  res.json(db.generalFeedback);
});

app.post("/api/feedback", (req, res) => {
  const { user, text } = req.body;
  const db = (req as any).userDb;
  const username = (req as any).username;
  const newFeed = {
    id: `f-${Date.now()}`,
    user: user || "Anonim",
    text: text || "",
    timestamp: new Date().toISOString()
  };

  db.generalFeedback.push(newFeed);
  saveUserDatabase(username, db);
  res.status(201).json(newFeed);
});

// 7. Inquiries CRUD API
app.get("/api/inquiries", (req, res) => {
  const db = (req as any).userDb;
  res.json(db.inquiries || []);
});

app.post("/api/inquiries", (req, res) => {
  const db = (req as any).userDb;
  const username = (req as any).username;
  const newInquiry: Inquiry = {
    id: `inq-${Date.now()}`,
    hari: req.body.hari || "Senin",
    tanggal: req.body.tanggal || new Date().toISOString().split("T")[0],
    usernameNama: req.body.usernameNama || "",
    jumlah: Number(req.body.jumlah) || 0,
    periode: req.body.periode || "1 Bulan",
    nomorWATamu: req.body.nomorWATamu || "",
    stage: req.body.stage || "Engage"
  };

  if (!db.inquiries) db.inquiries = [];
  db.inquiries.push(newInquiry);
  saveUserDatabase(username, db);
  res.status(201).json(newInquiry);
});

app.put("/api/inquiries/:id", (req, res) => {
  const { id } = req.params;
  const db = (req as any).userDb;
  const username = (req as any).username;
  const index = db.inquiries.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Inquiry tidak ditemukan" });
  }

  db.inquiries[index] = {
    ...db.inquiries[index],
    hari: req.body.hari !== undefined ? req.body.hari : db.inquiries[index].hari,
    tanggal: req.body.tanggal !== undefined ? req.body.tanggal : db.inquiries[index].tanggal,
    usernameNama: req.body.usernameNama !== undefined ? req.body.usernameNama : db.inquiries[index].usernameNama,
    jumlah: req.body.jumlah !== undefined ? Number(req.body.jumlah) : db.inquiries[index].jumlah,
    periode: req.body.periode !== undefined ? req.body.periode : db.inquiries[index].periode,
    nomorWATamu: req.body.nomorWATamu !== undefined ? req.body.nomorWATamu : db.inquiries[index].nomorWATamu,
    stage: req.body.stage !== undefined ? req.body.stage : db.inquiries[index].stage
  };

  saveUserDatabase(username, db);
  res.json(db.inquiries[index]);
});

app.delete("/api/inquiries/:id", (req, res) => {
  const { id } = req.params;
  const db = (req as any).userDb;
  const username = (req as any).username;
  const index = db.inquiries.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Inquiry tidak ditemukan" });
  }

  db.inquiries.splice(index, 1);
  saveUserDatabase(username, db);
  res.json({ message: "Inquiry berhasil dihapus" });
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sosmed Specialist Dashboard Server] running on port ${PORT}`);
  });
}

startServer();
