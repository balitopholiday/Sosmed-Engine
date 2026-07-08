export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface ContentPlan {
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
  syncedPlatforms?: string[];
}

export interface DailyInsight {
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
  engagementRate: number;
}

export interface PeriodicInsight {
  id: string;
  month: string; // YYYY-MM
  platform: "instagram" | "tiktok";
  totalReach: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformingPost: string;
  analysis: string;
}

export interface Campaign {
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

export interface GeneralFeedback {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface Inquiry {
  id: string;
  hari: string;
  tanggal: string;
  usernameNama: string;
  jumlah: number;
  periode: string;
  nomorWATamu: string;
  stage: "Engage" | "Penawaran" | "Nego" | "Deal" | "Tidak Deal";
}

export type PlatformType = "all" | "instagram" | "tiktok" | "twitter" | "facebook" | "linkedin";
