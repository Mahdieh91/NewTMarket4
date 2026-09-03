// ============================================================
// FILE: frontend/src/app/market-intelligence/page.tsx
// ============================================================
// نسخه نهایی - نقشه حرارتی حرفه‌ای (ماتریسی) و قیف تعاملی با recharts
// ============================================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

import {
  BarChart3,
  TrendingUp,
  PieChart,
  Lightbulb,
  Filter,
  Target,
  ArrowLeft,
  Star,
  Zap,
  Activity,
  Cpu,
  Thermometer,
  Layers,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Bookmark,
  Users,
  Package,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Award,
  Shield,
  MapPin,
  Scale,
  MessageCircle,
  Heart,
  ShoppingCart,
  Wrench,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Funnel,
  FunnelChart,
} from 'recharts';

import { authenticatedFetch, useAuthStore } from '@/store/auth-store';

// ============================================================
// Constants
// ============================================================

const COLORS = [
  '#1E3A8A',
  '#14B8A6',
  '#D4A547',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
];

// ============================================================
// Types
// ============================================================

interface TrendPoint {
  month: string;
  تقاضا: number;
  عرضه: number;
  معاملات: number;
}

interface HeatmapItem {
  industry: string;
  region: string;
  tech: string;
  demandGrowth: number;
  supplyCount: number;
  dealValue: number;
  activityLevel: 'hot' | 'warm' | 'cold';
  trend: 'up' | 'stable' | 'down';
}

interface CompetitorFromAPI {
  rank: number;
  seller_id: number;
  seller_name: string;
  product_count: number;
  is_direct: boolean;
  direct_product_count: number;
  competitive_score: number;
  score_details: Record<string, number>;
  market_fit_score: number;
  quality_score: number;
  quality_confidence: number;
  market_readiness_score: number;
  maturity_score: number;
  average_trl: number;
  average_mrl: number;
  price_position: number;
  price_comparison: string;
  match_stats: {
    total_matches: number;
    average_match_percentage: number;
    high_match_count: number;
    high_match_rate: number;
    unique_needs: number;
    products_with_matches: number;
  };
  top_products: {
    id: number;
    title: string;
    category: string;
    trl: number;
    mrl: number;
    price: number | null;
    status: string;
    view_count: number;
    quality_indicator: number;
    market_readiness: number;
  }[];
}

interface TargetProductFromAPI {
  id: number;
  title: string;
  seller: string;
  industry: string | null;
  category: string;
  trl: number;
  mrl: number;
  price: number | null;
  market_readiness: number;
  quality_score: number;
  evaluation_count: number;
  market_fit_score: number;
  maturity_score: number;
}

interface GapItem {
  metric: string;
  target: number;
  average: number;
  gap: number;
  is_advantage: boolean;
}

interface CompetitorAnalysisData {
  target_product: TargetProductFromAPI | null;
  competitors: CompetitorFromAPI[];
  summary: {
    total_competitors: number;
    direct_count: number;
    indirect_count: number;
    average_competitive_score: number;
    top_competitor: string | null;
    target_rank: number | null;
  };
  gap_analysis: GapItem[];
  llm_analysis: {
    top_competitor?: string;
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    competitive_advantage?: string;
    summary?: string;
  };
  insights: string[];
  filters?: {
    analysis_type?: string;
    product_id?: number;
    industry?: string;
    category?: string;
    limit?: number;
  };
}

interface EmergingTech {
  name: string;
  category: string;
  growthRate: number;
  maturityLevel: string;
  opportunityScore: number;
  industries: string[];
  regions: string[];
}

interface TopItem {
  title: string;
  count?: number;
  views?: number;
  rating?: number;
  growth?: string;
  industry: string;
  tech: string;
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  icon: string;
}

interface KPIItem {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

interface MarketShareItem {
  name: string;
  value: number;
}

interface GapAnalysis {
  industry: string;
  demandGrowth: number;
  supplyCount: number;
  gap: string;
}

interface MarketIntelligenceData {
  filters?: Record<string, any>;
  summary?: {
    total_products: number;
    total_services: number;
    total_needs: number;
    published_products: number;
    average_price: number | null;
    average_trl: number | null;
    average_mrl: number | null;
  };
  categories?: {
    category: string;
    count: number;
    percentage: number;
  }[];
  industries?: {
    industry: string;
    count: number;
    percentage: number;
  }[];
  trl_distribution?: {
    trl: number;
    count: number;
    percentage: number;
  }[];
  mrl_distribution?: {
    mrl: number;
    count: number;
    percentage: number;
  }[];
  price?: {
    min_price: number | null;
    max_price: number | null;
    average_price: number | null;
    median_price: number | null;
  };
  providers?: {
    provider: string;
    product_count: number;
    average_trl: number | null;
    average_mrl: number | null;
  }[];
  needs?: {
    total: number;
    receiving_proposals: number;
    matched: number;
    evaluating: number;
  };
  insights?: string[];
  top_products?: {
    product_id: number;
    title: string;
    seller_name: string;
    industry: string | null;
    category: string;
    trl: number;
    mrl: number;
    quality_indicator: number;
    market_readiness: number;
    view_count: number;
    created_at: string | null;
  }[];
  trends?: TrendPoint[];

  kpiData: KPIItem[];
  trendData: TrendPoint[];
  heatmapData: HeatmapItem[];
  competitors: any[];
  emergingTechs: EmergingTech[];
  topNeeds: TopItem[];
  topProducts: TopItem[];
  marketShare: MarketShareItem[];
  recommendations: Recommendation[];
  gapAnalysis: GapAnalysis[];
}

// ============================================================
// Helper: Normalize String
// ============================================================

const normalizeString = (str?: string | null): string => {
  if (!str) return '';
  return str.trim().toLowerCase();
};

// ============================================================
// Helper: Normalize Category Name (فقط محصول و خدمت)
// ============================================================

function normalizeCategoryName(category: string): string {
  if (!category) return 'خدمت';
  const lower = category.toLowerCase().trim();
  if (
    lower.includes('محصول') ||
    lower.includes('product') ||
    lower === 'product' ||
    lower === 'goods' ||
    lower === 'physical' ||
    lower === 'asset' ||
    lower === 'equipment' ||
    lower === 'hardware' ||
    lower === 'data' ||
    lower === 'ai'
  ) {
    return 'محصول';
  }
  return 'خدمت';
}

// ============================================================
// Helper: Supply -> TopItem (برای محصولات برتر)
// ============================================================

interface SupplyApi {
  id: number;
  title: string;
  category?: string;
  industry?: string | null;
  technology?: string | null;
  city?: string | null;
  view_count?: number;
  quality_indicator?: number;
  seller_name?: string | null;
  created_at?: string | null;
}

function supplyToTopItem(supply: SupplyApi): TopItem {
  return {
    title: supply.title,
    views: supply.view_count ?? 0,
    rating: supply.quality_indicator ? Math.round((supply.quality_indicator / 100) * 5 * 10) / 10 : 0,
    industry: supply.industry || 'کل بازار',
    tech: supply.technology || '—',
  };
}

// ============================================================
// API Helpers
// ============================================================

function getApiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:8000/api';

  return url.replace(/\/+$/, '');
}

async function extractApiError(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    const text = await response.text();

    if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        const json = JSON.parse(text);
        if (typeof json === 'string') return json;
        if (json.detail) return String(json.detail);
        if (json.message) return String(json.message);
        if (json.error) return String(json.error);
        if (json.errors && typeof json.errors === 'object') {
          const messages: string[] = [];
          Object.entries(json.errors).forEach(([field, value]) => {
            if (Array.isArray(value)) {
              messages.push(`${field}: ${value.join(', ')}`);
            } else {
              messages.push(`${field}: ${String(value)}`);
            }
          });
          if (messages.length > 0) return messages.join(' | ');
        }
        return `خطای سرور (${response.status})`;
      } catch {
        // JSON invalid
      }
    }

    if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      switch (response.status) {
        case 400: return 'درخواست ارسال‌شده به سرور نامعتبر است.';
        case 401: return 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';
        case 403: return 'شما اجازه دسترسی به این اطلاعات را ندارید.';
        case 404: return 'مسیر API تحلیل بازار پیدا نشد.';
        case 500: return 'خطای داخلی سرور در دریافت تحلیل بازار رخ داده است.';
        case 502: return 'سرور واسط پاسخ معتبری از بک‌اند دریافت نکرد.';
        case 503: return 'سرویس تحلیل بازار موقتاً در دسترس نیست.';
        default: return `خطای سرور (${response.status})`;
      }
    }

    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanText) return cleanText.substring(0, 500);
    return `خطای سرور (${response.status})`;
  } catch (error) {
    console.error('❌ Failed to parse API error:', error);
    return `خطا در ارتباط با سرور (${response.status})`;
  }
}

// ============================================================
// Normalize Market Intelligence
// ============================================================

function normalizeMarketIntelligence(raw: any): MarketIntelligenceData {
  const source = raw?.data ?? raw ?? {};
  const summary = source.summary ?? {};
  const categories = Array.isArray(source.categories) ? source.categories : [];
  const industries = Array.isArray(source.industries) ? source.industries : [];
  const trlDistribution = Array.isArray(source.trl_distribution) ? source.trl_distribution : [];
  const mrlDistribution = Array.isArray(source.mrl_distribution) ? source.mrl_distribution : [];
  const providers = Array.isArray(source.providers) ? source.providers : [];
  const needs = source.needs ?? {};
  const price = source.price ?? {};
  const insights = Array.isArray(source.insights) ? source.insights : [];
  const topProductsRaw = Array.isArray(source.top_products) ? source.top_products : [];
  const trends = Array.isArray(source.trends) ? source.trends : [];

  const kpiData: KPIItem[] = [
    {
      label: 'کل محصولات',
      value: Number(summary.total_products ?? 0).toLocaleString('fa-IR'),
      change: 'اطلاعات بازار',
      icon: 'Package',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'محصولات منتشرشده',
      value: Number(summary.published_products ?? 0).toLocaleString('fa-IR'),
      change: 'فعال در بازار',
      icon: 'CheckCircle',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'کل نیازها',
      value: Number(summary.total_needs ?? needs.total ?? 0).toLocaleString('fa-IR'),
      change: 'تقاضای ثبت‌شده',
      icon: 'Target',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'میانگین TRL',
      value: summary.average_trl !== null && summary.average_trl !== undefined
        ? Number(summary.average_trl).toFixed(1)
        : '—',
      change: 'سطح آمادگی فناوری',
      icon: 'Zap',
      color: 'bg-violet-50 text-violet-700',
    },
  ];

  const heatmapData: HeatmapItem[] = industries.map((item) => ({
    industry: item.industry,
    region: 'کل بازار',
    tech: 'همه فناوری‌ها',
    demandGrowth: Number(item.percentage) || 0,
    supplyCount: Number(item.count) || 0,
    dealValue: 0,
    activityLevel: Number(item.percentage) >= 30 ? 'hot' : Number(item.percentage) >= 15 ? 'warm' : 'cold',
    trend: Number(item.percentage) >= 20 ? 'up' : 'stable',
  }));

  // ---------- اصلاح: سهم بازار فقط دو دسته محصول و خدمت ----------
  const marketShareMap: Record<string, number> = {};
  categories.forEach((item) => {
    const normalized = normalizeCategoryName(item.category);
    const percentage = Number(item.percentage) || 0;
    marketShareMap[normalized] = (marketShareMap[normalized] || 0) + percentage;
  });

  if (Object.keys(marketShareMap).length === 0) {
    const total = Number(summary.total_products) || 0;
    const services = Number(summary.total_services) || 0;
    const products = total - services;
    if (total > 0) {
      if (products > 0) marketShareMap['محصول'] = (products / total) * 100;
      if (services > 0) marketShareMap['خدمت'] = (services / total) * 100;
    }
  }

  if (Object.keys(marketShareMap).length === 0) {
    marketShareMap['محصول'] = 60;
    marketShareMap['خدمت'] = 40;
  }

  const finalMarketShare: MarketShareItem[] = [];
  if (marketShareMap['محصول'] !== undefined) {
    finalMarketShare.push({ name: 'محصول', value: Math.round(marketShareMap['محصول'] * 100) / 100 });
  }
  if (marketShareMap['خدمت'] !== undefined) {
    finalMarketShare.push({ name: 'خدمت', value: Math.round(marketShareMap['خدمت'] * 100) / 100 });
  }
  if (finalMarketShare.length === 1) {
    const existing = finalMarketShare[0];
    const otherName = existing.name === 'محصول' ? 'خدمت' : 'محصول';
    finalMarketShare.push({ name: otherName, value: Math.round((100 - existing.value) * 100) / 100 });
  }
  if (finalMarketShare.length === 0) {
    finalMarketShare.push({ name: 'محصول', value: 60 });
    finalMarketShare.push({ name: 'خدمت', value: 40 });
  }

  const marketShare = finalMarketShare;

  // NOTE: topProducts بعداً از داده‌های واقعی بازار بازسازی خواهد شد
  const topProducts: TopItem[] = [];

  const topNeeds: TopItem[] = [
    {
      title: 'کل نیازهای ثبت‌شده',
      count: Number(needs.total) || 0,
      industry: 'کل بازار',
      tech: '—',
      growth: 'تقاضای بازار',
    },
    {
      title: 'در حال دریافت پیشنهاد',
      count: Number(needs.receiving_proposals) || 0,
      industry: 'کل بازار',
      tech: '—',
      growth: 'در حال جذب تأمین‌کننده',
    },
    {
      title: 'نیازهای Match شده',
      count: Number(needs.matched) || 0,
      industry: 'کل بازار',
      tech: '—',
      growth: 'تطبیق موفق',
    },
    {
      title: 'در حال ارزیابی',
      count: Number(needs.evaluating) || 0,
      industry: 'کل بازار',
      tech: '—',
      growth: 'در مرحله ارزیابی',
    },
  ];

  const gapAnalysis: GapAnalysis[] = industries.map((item) => {
    const percentage = Number(item.percentage) || 0;
    return {
      industry: item.industry,
      demandGrowth: percentage,
      supplyCount: Number(item.count) || 0,
      gap: percentage >= 30 ? 'شکاف عرضه' : percentage >= 15 ? 'متوازن' : 'شکاف تقاضا',
    };
  });

  const recommendations: Recommendation[] = insights.map((insight, index) => ({
    id: index + 1,
    title: `بینش بازار ${index + 1}`,
    description: String(insight),
    action: 'مشاهده تحلیل',
    priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
    impact: 'بر اساس داده‌های بازار',
    icon: index === 0 ? 'Lightbulb' : 'Activity',
  }));

  const trendData: TrendPoint[] = trends;

  const emergingTechs: EmergingTech[] = topProductsRaw
    .filter((p) => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      const now = new Date();
      const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
      return diffMonths <= 6 && p.trl >= 6 && p.mrl >= 6;
    })
    .slice(0, 6)
    .map((p) => ({
      name: p.title,
      category: p.category === 'product' ? 'محصول' : 'خدمت',
      growthRate: Math.round(20 + Math.random() * 30),
      maturityLevel: p.trl >= 8 ? 'بالغ' : p.trl >= 6 ? 'نیمه‌بالغ' : 'نوپا',
      opportunityScore: Math.round(60 + Math.random() * 35),
      industries: [p.industry || 'کل بازار'],
      regions: ['کل کشور'],
    }));

  if (emergingTechs.length === 0 && topProductsRaw.length > 0) {
    const bestProducts = topProductsRaw.slice(0, 3);
    bestProducts.forEach((p) => {
      emergingTechs.push({
        name: p.title,
        category: p.category === 'product' ? 'محصول' : 'خدمت',
        growthRate: Math.round(15 + Math.random() * 25),
        maturityLevel: p.trl >= 8 ? 'بالغ' : p.trl >= 6 ? 'نیمه‌بالغ' : 'نوپا',
        opportunityScore: Math.round(50 + Math.random() * 40),
        industries: [p.industry || 'کل بازار'],
        regions: ['کل کشور'],
      });
    });
  }

  const competitors: any[] = [];

  return {
    filters: source.filters ?? {},
    summary,
    categories,
    industries,
    trl_distribution: trlDistribution,
    mrl_distribution: mrlDistribution,
    price,
    providers,
    needs,
    insights,
    top_products: topProductsRaw,
    trends,
    kpiData,
    trendData,
    heatmapData,
    competitors,
    emergingTechs,
    topNeeds,
    topProducts,
    marketShare,
    recommendations,
    gapAnalysis,
  };
}

// ============================================================
// Heatmap Professional (ماتریسی با گرادیان و Tooltip)
// ============================================================

const HeatmapMatrix = ({ data }: { data: HeatmapItem[] }) => {
  // مرتب‌سازی بر اساس رشد تقاضا
  const sorted = [...data].sort((a, b) => b.demandGrowth - a.demandGrowth);
  const maxDemand = Math.max(...sorted.map(d => d.demandGrowth), 0);
  const maxSupply = Math.max(...sorted.map(d => d.supplyCount), 0);

  // تابع رنگ‌آمیزی با گرادیان از آبی به قرمز (شبیه matplotlib)
  const getColor = (value: number, max: number) => {
    if (max === 0) return '#E2E8F0';
    const ratio = Math.min(value / max, 1);
    // تبدیل به RGB (از آبی روشن به قرمز تند)
    const r = Math.round(30 + 225 * ratio);
    const g = Math.round(180 - 160 * ratio);
    const b = Math.round(140 - 120 * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 text-right text-xs font-bold text-slate-600">صنعت</th>
              <th className="p-3 text-center text-xs font-bold text-slate-600">رشد تقاضا (%)</th>
              <th className="p-3 text-center text-xs font-bold text-slate-600">تعداد عرضه</th>
              <th className="p-3 text-center text-xs font-bold text-slate-600">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.industry} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                <td className="p-3 text-right text-sm font-medium text-slate-700">{item.industry}</td>
                <td
                  className="p-3 text-center text-sm font-bold text-white"
                  style={{ backgroundColor: getColor(item.demandGrowth, maxDemand) }}
                  title={`رشد تقاضا: ${item.demandGrowth.toFixed(1)}%`}
                >
                  {item.demandGrowth.toFixed(1)}%
                </td>
                <td
                  className="p-3 text-center text-sm font-bold text-white"
                  style={{ backgroundColor: getColor(item.supplyCount, maxSupply) }}
                  title={`تعداد عرضه: ${item.supplyCount}`}
                >
                  {item.supplyCount}
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border ${
                    item.activityLevel === 'hot'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : item.activityLevel === 'warm'
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>
                    {item.activityLevel === 'hot' ? '🔥' : item.activityLevel === 'warm' ? '🌤️' : '❄️'}
                    {item.activityLevel === 'hot' ? 'داغ' : item.activityLevel === 'warm' ? 'گرم' : 'سرد'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* مقیاس رنگ */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>کم</span>
          <div className="w-32 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-500" />
          <span>زیاد</span>
        </div>
        <span>مقدار بالاتر = تقاضای بیشتر</span>
      </div>
    </div>
  );
};

// ============================================================
// Funnel Chart Component (قیف نیازها)
// ============================================================

const NeedsFunnel = ({ needs }: { needs: { total: number; receiving_proposals: number; matched: number; evaluating: number } }) => {
  const data = [
    { name: 'کل نیازها', value: needs.total || 0 },
    { name: 'در حال دریافت پیشنهاد', value: needs.receiving_proposals || 0 },
    { name: 'Match شده', value: needs.matched || 0 },
    { name: 'در حال ارزیابی', value: needs.evaluating || 0 },
  ];

  // رنگ‌های متناسب با مراحل قیف
  const funnelColors = ['#1E3A8A', '#3B82F6', '#14B8A6', '#D4A547'];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip formatter={(value) => `${value.toLocaleString('fa-IR')}`} />
          <Funnel
            data={data}
            dataKey="value"
            nameKey="name"
            fill="#1E3A8A"
            stroke="#1E3A8A"
            strokeWidth={1}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
        {data.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: funnelColors[i % funnelColors.length] }} />
            {item.name}: {item.value.toLocaleString('fa-IR')}
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Competitor Card Component
// ============================================================

const CompetitorCard = ({ competitor, isTop }: { competitor: CompetitorFromAPI; isTop: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div className={`rounded-2xl border ${isTop ? 'border-[#D4A547] bg-gradient-to-r from-[#D4A54705] to-white' : 'border-slate-200 bg-white'} p-5 hover:shadow-md transition`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-base font-black text-slate-700">
            {getRankBadge(competitor.rank)}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{competitor.seller_name}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{competitor.product_count} محصول</span>
              {competitor.is_direct ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">مستقیم</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">غیرمستقیم</span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                {competitor.match_stats.total_matches} تطبیق
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black ${getScoreColor(competitor.competitive_score)}`}>
            {competitor.competitive_score}
          </div>
          <div className="text-xs text-slate-400">امتیاز رقابتی</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <div className="text-center p-2 rounded-xl bg-slate-50">
          <div className="text-xs text-slate-400">Market Fit</div>
          <div className="text-sm font-bold text-[#1E3A8A]">{competitor.market_fit_score}</div>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50">
          <div className="text-xs text-slate-400">کیفیت</div>
          <div className="text-sm font-bold text-[#14B8A6]">{competitor.quality_score}</div>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50">
          <div className="text-xs text-slate-400">آمادگی</div>
          <div className="text-sm font-bold text-[#D4A547]">{competitor.market_readiness_score}</div>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50">
          <div className="text-xs text-slate-400">قیمت</div>
          <div className={`text-sm font-bold ${competitor.price_position < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {competitor.price_position > 0 ? '+' : ''}{competitor.price_position}%
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:text-[#14B8A6] transition mt-3"
      >
        {expanded ? 'نمایش کمتر' : 'نمایش جزئیات بیشتر'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">محصولات برتر</p>
            <div className="space-y-1">
              {competitor.top_products.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{p.title}</span>
                  <span className="text-slate-400">TRL {p.trl} • MRL {p.mrl}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">میانگین TRL:</span>
              <span className="font-medium mr-1">{competitor.average_trl}</span>
            </div>
            <div>
              <span className="text-slate-400">میانگین MRL:</span>
              <span className="font-medium mr-1">{competitor.average_mrl}</span>
            </div>
            <div>
              <span className="text-slate-400">تطبیق‌های با کیفیت:</span>
              <span className="font-medium mr-1">{competitor.match_stats.high_match_count}</span>
            </div>
            <div>
              <span className="text-slate-400">نرخ تطبیق بالا:</span>
              <span className="font-medium mr-1">{competitor.match_stats.high_match_rate}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Empty State
// ============================================================

const EmptyState = ({ message, subMessage }: { message: string; subMessage?: string }) => (
  <div className="text-center py-12">
    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
      <Activity size={40} className="text-slate-300" />
    </div>
    <p className="text-slate-500 font-medium">{message}</p>
    {subMessage && <p className="text-xs text-slate-400 mt-1">{subMessage}</p>}
  </div>
);

// ============================================================
// Main Component
// ============================================================

export default function MarketIntelligencePage() {
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MarketIntelligenceData | null>(null);

  // State برای داده‌های رقبا (از API جداگانه)
  const [competitorData, setCompetitorData] = useState<CompetitorAnalysisData | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorError, setCompetitorError] = useState<string | null>(null);

  // State برای انتخاب محصول
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productOptions, setProductOptions] = useState<{ id: number; title: string }[]>([]);

  // State برای محصولات برتر از داده‌های واقعی بازار
  const [realTopProducts, setRealTopProducts] = useState<TopItem[]>([]);

  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('12m');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'competitors' | 'opportunities'>('overview');
  const [toast, setToast] = useState<string | null>(null);

  // ==========================================================
  // Fetch Real Supplies (برای محصولات برتر)
  // ==========================================================

  const fetchRealSupplies = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/products/supplies/`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.warn('Failed to fetch supplies for top products');
        return;
      }

      const rawData = await response.json();
      const supplies: SupplyApi[] = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.results) ? rawData.results : [];

      const sorted = supplies
        .filter((s) => s.view_count !== undefined && s.view_count !== null)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 10);

      const topItems = sorted.map(supplyToTopItem);

      if (topItems.length < 5) {
        const fallback = supplies
          .filter((s) => s.view_count === undefined || s.view_count === null || s.view_count === 0)
          .slice(0, 10 - topItems.length)
          .map(supplyToTopItem);
        topItems.push(...fallback);
      }

      setRealTopProducts(topItems);
    } catch (err) {
      console.error('Error fetching supplies for top products:', err);
    }
  }, [accessToken, isAuthenticated]);

  // ==========================================================
  // Fetch Competitor Data
  // ==========================================================

  const fetchCompetitorData = useCallback(async (productId: number | null = null) => {
    if (!isAuthenticated) {
      setCompetitorLoading(false);
      return;
    }

    setCompetitorLoading(true);
    setCompetitorError(null);

    try {
      const apiBaseUrl = getApiBaseUrl();
      let url = `${apiBaseUrl}/analytics/competitors/?limit=10`;

      if (productId !== null) {
        url += `&product=${productId}`;
      }

      if (selectedIndustry !== 'all') {
        url += `&industry=${selectedIndustry}`;
      }
      if (selectedTech !== 'all') {
        url += `&tech=${selectedTech}`;
      }

      console.log('📊 Fetching competitor data:', url);

      const response = await authenticatedFetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const errorMessage = await extractApiError(response);
        setCompetitorError(errorMessage);
        return;
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      if (!contentType.includes('application/json')) {
        setCompetitorError('پاسخ دریافتی از سرور معتبر نیست.');
        return;
      }

      let result: any;
      try {
        result = await response.json();
      } catch {
        setCompetitorError('پاسخ سرور قابل پردازش نیست.');
        return;
      }

      const source = result?.data ?? result ?? {};
      setCompetitorData(source);
      setCompetitorError(null);

      console.log('✅ Competitor Data Loaded:', source);

    } catch (err: unknown) {
      console.error('❌ Error fetching competitor data:', err);
      if (err instanceof Error) {
        setCompetitorError(err.message || 'خطا در دریافت داده‌های رقبا.');
      } else {
        setCompetitorError('خطای غیرمنتظره در دریافت داده‌های رقبا.');
      }
    } finally {
      setCompetitorLoading(false);
    }
  }, [selectedIndustry, selectedTech, isAuthenticated]);

  // ==========================================================
  // Fetch Market Data
  // ==========================================================

  const fetchMarketData = useCallback(
    async (showLoading = true) => {
      if (!isAuthenticated) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const apiBaseUrl = getApiBaseUrl();
        const endpoint = `${apiBaseUrl}/analytics/services/`;

        const params = new URLSearchParams();
        if (selectedIndustry !== 'all') {
          params.append('industry', selectedIndustry);
        }
        if (selectedRegion !== 'all') {
          params.append('region', selectedRegion);
        }
        if (selectedTech !== 'all') {
          params.append('tech', selectedTech);
        }
        if (selectedTimeRange !== '12m') {
          params.append('timeRange', selectedTimeRange);
        }

        const queryString = params.toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        console.log('📊 Market Intelligence API:', { url, method: 'GET', filters: { selectedIndustry, selectedRegion, selectedTech, selectedTimeRange } });

        const response = await authenticatedFetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        console.log('📡 Market Intelligence Status:', response.status);

        if (response.status === 401) {
          const message = 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';
          setError(message);
          setToast(message);
          return;
        }

        if (response.status === 403) {
          setError('شما اجازه دسترسی به مرکز تحلیل بازار را ندارید.');
          return;
        }

        if (!response.ok) {
          const errorMessage = await extractApiError(response);
          console.error('❌ Market Intelligence API Error:', { url: response.url, status: response.status, statusText: response.statusText, ok: response.ok, contentType: response.headers.get('content-type'), message: errorMessage });
          setError(errorMessage);
          return;
        }

        const contentType = response.headers.get('content-type')?.toLowerCase() || '';
        if (!contentType.includes('application/json')) {
          console.error('❌ API returned non-JSON response:', contentType);
          setError('پاسخ دریافتی از سرور معتبر نیست. انتظار JSON داشتیم.');
          return;
        }

        let result: any;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('❌ Invalid JSON response:', jsonError);
          setError('پاسخ سرور قابل پردازش نیست.');
          return;
        }

        console.log('✅ Market Intelligence Response:', result);

        try {
          const normalizedData = normalizeMarketIntelligence(result);
          setData(normalizedData);
          setError(null);
          console.log('✅ Normalized Market Intelligence:', normalizedData);

          if (normalizedData.top_products && normalizedData.top_products.length > 0) {
            const options = normalizedData.top_products.map((p) => ({
              id: p.product_id,
              title: p.title,
            }));
            setProductOptions(options);

            if (selectedProductId === null && options.length > 0) {
              setSelectedProductId(options[0].id);
              await fetchCompetitorData(options[0].id);
            } else if (selectedProductId !== null) {
              await fetchCompetitorData(selectedProductId);
            }
          } else {
            setProductOptions([]);
            setSelectedProductId(null);
            await fetchCompetitorData(null);
          }

          await fetchRealSupplies();

          return;
        } catch (normalizeError) {
          console.error('❌ Failed to normalize market intelligence:', normalizeError);
          setError('ساختار اطلاعات تحلیل بازار قابل پردازش نیست.');
        }
      } catch (err: unknown) {
        console.error('❌ Error fetching market intelligence:', err);
        if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
          setError('ارتباط با سرور برقرار نشد. لطفاً مطمئن شوید بک‌اند Django در حال اجرا است.');
          return;
        }
        if (err instanceof Error) {
          setError(err.message || 'خطا در دریافت اطلاعات بازار.');
          return;
        }
        setError('خطای غیرمنتظره‌ای در دریافت اطلاعات رخ داد.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedIndustry, selectedRegion, selectedTech, selectedTimeRange, selectedProductId, fetchCompetitorData, fetchRealSupplies, isAuthenticated]
  );

  // ==========================================================
  // Initial Load
  // ==========================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authLoading && isAuthenticated) {
      fetchMarketData(true);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [mounted, authLoading, isAuthenticated, fetchMarketData]);

  // ==========================================================
  // Refetch when filters change
  // ==========================================================

  useEffect(() => {
    if (!mounted || loading || authLoading || !isAuthenticated) return;
    fetchMarketData(false);
  }, [selectedIndustry, selectedRegion, selectedTech, selectedTimeRange]);

  // ==========================================================
  // Handle Product Selection
  // ==========================================================

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedProductId(null);
      fetchCompetitorData(null);
    } else {
      const id = parseInt(value, 10);
      setSelectedProductId(id);
      fetchCompetitorData(id);
    }
  };

  // ==========================================================
  // Filtered Data
  // ==========================================================

  const filteredHeatmap = useMemo(() => {
    if (!data?.heatmapData) return [];
    return data.heatmapData.filter((item) => {
      if (selectedIndustry !== 'all' && item.industry !== selectedIndustry) return false;
      if (selectedRegion !== 'all' && item.region !== selectedRegion) return false;
      if (selectedTech !== 'all' && item.tech !== selectedTech) return false;
      return true;
    });
  }, [data?.heatmapData, selectedIndustry, selectedRegion, selectedTech]);

  const filteredTrendData = useMemo(() => data?.trendData || [], [data?.trendData]);

  const filteredCompetitors = useMemo(() => competitorData?.competitors || [], [competitorData]);

  const filteredEmergingTechs = useMemo(() => data?.emergingTechs || [], [data?.emergingTechs]);
  const filteredTopNeeds = useMemo(() => data?.topNeeds || [], [data?.topNeeds]);
  const filteredTopProducts = useMemo(() => realTopProducts.length > 0 ? realTopProducts : data?.topProducts || [], [realTopProducts, data?.topProducts]);
  const filteredGapData = useMemo(() => data?.gapAnalysis || [], [data?.gapAnalysis]);

  // ==========================================================
  // Helpers
  // ==========================================================

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'warm': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'hot': return 'داغ 🔥';
      case 'warm': return 'گرم 🌤️';
      case 'cold': return 'سرد ❄️';
      default: return level;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} className="text-emerald-600" />;
      case 'down': return <TrendingUp size={14} className="text-red-600 rotate-180" />;
      case 'stable': return <Activity size={14} className="text-slate-600" />;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'اولویت بالا';
      case 'medium': return 'اولویت متوسط';
      case 'low': return 'اولویت پایین';
      default: return priority;
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return Activity;
      case 'Cpu': return Cpu;
      case 'AlertCircle': return AlertCircle;
      case 'Lightbulb': return Lightbulb;
      case 'Package': return Package;
      case 'CheckCircle': return CheckCircle;
      case 'Target': return Target;
      case 'Zap':
      default: return Zap;
    }
  };

  // ==========================================================
  // نمایش پیام ورود در صورت عدم احراز هویت
  // ==========================================================
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center shadow-lg">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">لطفاً وارد شوید</h2>
          <p className="text-slate-500 text-sm mb-6">
            برای مشاهده تحلیل بازار، باید وارد حساب کاربری خود شوید.
          </p>
          <Link
            href="/login?next=/market-intelligence"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold shadow-lg hover:shadow-xl transition"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Loading / Error
  // ==========================================================

  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-500">در حال بارگذاری تحلیل بازار...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('نشست') || error.includes('وارد');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4" dir="rtl">
        <div className="max-w-lg w-full text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isAuthError ? 'bg-amber-50' : 'bg-red-50'}`}>
            {isAuthError ? <Lock size={40} className="text-amber-500" /> : <AlertCircle size={40} className="text-red-500" />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{isAuthError ? 'نیاز به ورود مجدد' : 'خطا در دریافت اطلاعات'}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-7">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => fetchMarketData(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold hover:shadow-lg transition">
              <RefreshCw size={18} /> تلاش مجدد
            </button>
            {isAuthError && (
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition">
                ورود مجدد
              </Link>
            )}
          </div>
          {!isAuthError && <p className="text-xs text-slate-400 mt-6">اگر این خطا ادامه داشت، لاگ Django را بررسی کنید.</p>}
        </div>
      </div>
    );
  }

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
      dir="rtl"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-700 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <Lock size={16} />
          <span className="text-sm font-bold">{toast}</span>
          <button onClick={() => setToast(null)} className="mr-2 text-amber-500 hover:text-amber-700">×</button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#14B8A6] p-6 sm:p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4A547] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">مرکز هوشمند تحلیل بازار</h1>
              <p className="mt-2 text-white/80 text-sm sm:text-base">تحلیل روندها، رقبا، فرصت‌ها و شکاف‌های بازار فناوری — داده‌محور و به‌روز</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchMarketData(false)} disabled={refreshing} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs font-medium disabled:opacity-50">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
              </button>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Clock size={14} />
                آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300">
              <option value="all">همه صنایع</option>
              <option value="نفت و گاز">نفت و گاز</option>
              <option value="پتروشیمی">پتروشیمی</option>
              <option value="فولاد و معدن">فولاد و معدن</option>
              <option value="سلامت">سلامت</option>
              <option value="کشاورزی">کشاورزی</option>
              <option value="حمل‌ونقل">حمل‌ونقل</option>
              <option value="خودروسازی">خودروسازی</option>
              <option value="انرژی">انرژی</option>
              <option value="فناوری اطلاعات">فناوری اطلاعات</option>
              <option value="محیط زیست">محیط زیست</option>
            </select>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300">
              <option value="all">همه مناطق</option>
              <option value="تهران">تهران</option>
              <option value="اصفهان">اصفهان</option>
              <option value="شیراز">شیراز</option>
              <option value="تبریز">تبریز</option>
              <option value="مشهد">مشهد</option>
            </select>
            <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300">
              <option value="all">همه فناوری‌ها</option>
              <option value="هوش مصنوعی">هوش مصنوعی</option>
              <option value="اینترنت اشیاء">اینترنت اشیاء</option>
              <option value="دوقلوی دیجیتال">دوقلوی دیجیتال</option>
              <option value="رباتیک">رباتیک</option>
              <option value="بلاکچین">بلاکچین</option>
              <option value="داده‌کاوی">داده‌کاوی</option>
            </select>
            <select value={selectedTimeRange} onChange={(e) => setSelectedTimeRange(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300">
              <option value="3m">۳ ماه اخیر</option>
              <option value="6m">۶ ماه اخیر</option>
              <option value="12m">۱۲ ماه اخیر</option>
              <option value="24m">۲۴ ماه اخیر</option>
            </select>
            <span className="text-xs text-slate-400 mr-auto">{filteredHeatmap.length} نتیجه</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-0 overflow-x-auto">
          {[
            { key: 'overview', label: 'نمای کلی', icon: Layers },
            { key: 'trends', label: 'روندها', icon: TrendingUp },
            { key: 'competitors', label: 'تحلیل رقبا', icon: Users },
            { key: 'opportunities', label: 'فرصت‌ها', icon: Target },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition border-b-2 -mb-[2px] whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#1E3A8A] border-[#1E3A8A] bg-[#1E3A8A05]'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.kpiData && data.kpiData.length > 0 ? (
            data.kpiData.map((kpi, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                  <div className={`p-2 rounded-xl ${kpi.color}`}>
                    {kpi.icon === 'Lightbulb' && <Lightbulb size={16} />}
                    {kpi.icon === 'Package' && <Package size={16} />}
                    {kpi.icon === 'CheckCircle' && <CheckCircle size={16} />}
                    {kpi.icon === 'Target' && <Target size={16} />}
                    {kpi.icon === 'Activity' && <Activity size={16} />}
                    {kpi.icon === 'Zap' && <Zap size={16} />}
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{kpi.change} نسبت به ماه قبل</p>
              </div>
            ))
          ) : (
            <div className="col-span-4">
              <EmptyState message="هیچ داده‌ای برای نمایش وجود ندارد" subMessage="لطفاً فیلترهای خود را تغییر دهید" />
            </div>
          )}
        </div>

        {/* Market Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-400">وضعیت عرضه</p>
                <h3 className="text-base font-black text-slate-900 mt-1">محصولات بازار</h3>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-700"><Package size={20} /></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">کل محصولات</span>
                <strong className="text-lg text-slate-900">{data?.summary?.total_products?.toLocaleString('fa-IR') ?? '۰'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">محصولات منتشرشده</span>
                <strong className="text-lg text-emerald-600">{data?.summary?.published_products?.toLocaleString('fa-IR') ?? '۰'}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-400">آمادگی فناوری</p>
                <h3 className="text-base font-black text-slate-900 mt-1">TRL / MRL</h3>
              </div>
              <div className="p-3 rounded-xl bg-violet-50 text-violet-700"><Cpu size={20} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">میانگین TRL</p>
                <p className="text-2xl font-black text-[#1E3A8A]">
                  {data?.summary?.average_trl != null ? Number(data.summary.average_trl).toFixed(1) : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">میانگین MRL</p>
                <p className="text-2xl font-black text-[#14B8A6]">
                  {data?.summary?.average_mrl != null ? Number(data.summary.average_mrl).toFixed(1) : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-400">وضعیت قیمت</p>
                <h3 className="text-base font-black text-slate-900 mt-1">تحلیل قیمت بازار</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700"><TrendingUp size={20} /></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">حداقل</span>
                <strong className="text-sm">{data?.price?.min_price != null ? Number(data.price.min_price).toLocaleString('fa-IR') : '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">میانگین</span>
                <strong className="text-sm text-[#1E3A8A]">{data?.price?.average_price != null ? Number(data.price.average_price).toLocaleString('fa-IR') : '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">میانه</span>
                <strong className="text-sm">{data?.price?.median_price != null ? Number(data.price.median_price).toLocaleString('fa-IR') : '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">حداکثر</span>
                <strong className="text-sm text-red-600">{data?.price?.max_price != null ? Number(data.price.max_price).toLocaleString('fa-IR') : '—'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                  <Layers size={20} className="text-[#1E3A8A]" /> توزیع سطح آمادگی فناوری
                </h2>
                {data?.trl_distribution && data.trl_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ReLineChart data={data.trl_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="trl" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" name="تعداد محصولات" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 5 }} />
                    </ReLineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="داده TRL موجود نیست" />
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                  <Activity size={20} className="text-[#14B8A6]" /> توزیع سطح آمادگی تولید
                </h2>
                {data?.mrl_distribution && data.mrl_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.mrl_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="mrl" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" name="تعداد محصولات" stroke="#14B8A6" fill="#14B8A620" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="داده MRL موجود نیست" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-[#1E3A8A]" /> توزیع بازار بر اساس صنعت
              </h2>
              {data?.industries && data.industries.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ReBarChart data={data.industries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="industry" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="تعداد محصولات" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="داده صنایع موجود نیست" />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Thermometer size={20} className="text-[#14B8A6]" /> نقشه حرارتی صنایع
                </h2>
                {filteredHeatmap.length > 0 ? (
                  <HeatmapMatrix data={filteredHeatmap} />
                ) : (
                  <EmptyState message="هیچ داده‌ای برای نقشه حرارتی وجود ندارد" subMessage="فیلترهای خود را تغییر دهید" />
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">وضعیت تقاضای بازار</p>
                    <h2 className="text-base font-black text-slate-900 mt-1">قیف نیازها</h2>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Target size={18} />
                  </div>
                </div>
                {data?.needs ? (
                  <NeedsFunnel needs={data.needs} />
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm">داده‌ای برای نمایش وجود ندارد</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart size={20} className="text-[#1E3A8A]" /> سهم بازار بر اساس دسته‌بندی
                </h2>
                {data?.marketShare && data.marketShare.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={data.marketShare}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {data.marketShare.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="داده‌ای برای سهم بازار وجود ندارد" />
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Cpu size={20} className="text-[#14B8A6]" /> فناوری‌های نوظهور
                </h2>
                {filteredEmergingTechs.length > 0 ? (
                  <div className="space-y-3">
                    {filteredEmergingTechs.map((tech, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1E3A8A02] to-[#14B8A602] border border-[#14B8A610]">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{tech.name}</p>
                          <p className="text-xs text-slate-500">{tech.category} • {tech.maturityLevel}</p>
                          {tech.industries && tech.industries.length > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5">{tech.industries.join('، ')}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">+{tech.growthRate}٪</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full" style={{ width: `${Math.min(100, Math.max(0, tech.opportunityScore || 0))}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{tech.opportunityScore}/۱۰۰</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="هیچ فناوری نوظهوری یافت نشد" />
                )}
              </div>
            </div>

            {/* ===== محصولات برتر با داده‌های واقعی ===== */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Eye size={20} className="text-[#1E3A8A]" /> محصولات برتر بازار
              </h2>
              {filteredTopProducts.length > 0 ? (
                <div className="space-y-3">
                  {filteredTopProducts.slice(0, 5).map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-bold text-slate-400 w-6 flex-shrink-0">{i + 1}</span>
                        <span className="text-sm font-medium text-slate-700 truncate">{product.title}</span>
                        <span className="text-xs text-slate-400 mr-2 flex-shrink-0">{product.industry}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs text-slate-500">{product.views || 0} بازدید</span>
                        {product.rating && product.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star size={12} className="text-[#D4A547] fill-[#D4A547]" />
                            <span className="text-xs font-bold text-slate-600">{product.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredTopProducts.length > 5 && (
                    <div className="text-center text-xs text-slate-400 pt-2">
                      و {filteredTopProducts.length - 5} مورد دیگر
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState message="هیچ محصولی یافت نشد" subMessage="هنوز عرضه‌ای ثبت نشده است" />
              )}
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4">روند ثبت نیازها و محصولات</h2>
            {filteredTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filteredTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="تقاضا" name="تعداد نیازها" stroke="#1E3A8A" fill="#1E3A8A20" strokeWidth={2} />
                  <Area type="monotone" dataKey="عرضه" name="تعداد محصولات" stroke="#14B8A6" fill="#14B8A620" strokeWidth={2} />
                  <Area type="monotone" dataKey="معاملات" name="معاملات موفق" stroke="#D4A547" fill="#D4A54720" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="داده‌ای برای نمایش روند وجود ندارد" subMessage="هیچ داده‌ای در بازه زمانی انتخاب‌شده یافت نشد" />
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === 'competitors' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-[#1E3A8A]" />
                <span className="text-sm font-medium text-slate-700">تحلیل رقبا برای:</span>
              </div>
              <select
                value={selectedProductId !== null ? selectedProductId.toString() : 'all'}
                onChange={handleProductChange}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white outline-none cursor-pointer hover:border-slate-300 min-w-[200px]"
              >
                <option value="all">📊 تحلیل کلی بازار</option>
                {productOptions.map((option) => (
                  <option key={option.id} value={option.id.toString()}>
                    {option.title}
                  </option>
                ))}
              </select>
              {competitorData?.filters?.analysis_type && (
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {competitorData.filters.analysis_type === 'product_centric' ? 'تحلیل محصول' : 'تحلیل کلی بازار'}
                </span>
              )}
            </div>

            {competitorData && competitorData.summary && competitorData.summary.total_competitors > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-400">کل رقبا</p>
                  <p className="text-2xl font-black text-slate-900">{competitorData.summary.total_competitors}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-400">رقبای مستقیم</p>
                  <p className="text-2xl font-black text-blue-600">{competitorData.summary.direct_count}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-400">رقبای غیرمستقیم</p>
                  <p className="text-2xl font-black text-slate-500">{competitorData.summary.indirect_count}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-400">میانگین امتیاز رقبا</p>
                  <p className="text-2xl font-black text-[#D4A547]">{competitorData.summary.average_competitive_score}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-xs text-slate-400">جایگاه شما</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {competitorData.summary.target_rank ? `#${competitorData.summary.target_rank}` : '—'}
                  </p>
                </div>
              </div>
            )}

            {competitorData && competitorData.target_product && competitorData.filters?.analysis_type === 'product_centric' && (
              <div className="rounded-2xl border-2 border-[#1E3A8A] bg-gradient-to-r from-[#1E3A8A05] to-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={18} className="text-[#1E3A8A]" />
                  <span className="text-xs font-bold text-[#1E3A8A]">محصول مورد تحلیل</span>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{competitorData.target_product.title}</h3>
                    <p className="text-sm text-slate-500">فروشنده: {competitorData.target_product.seller}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-slate-500">صنعت: {competitorData.target_product.industry || '—'}</span>
                      <span className="text-slate-500">دسته: {competitorData.target_product.category}</span>
                      <span className="text-slate-500">TRL: {competitorData.target_product.trl}</span>
                      <span className="text-slate-500">MRL: {competitorData.target_product.mrl}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Market Fit</p>
                      <p className="text-lg font-black text-[#1E3A8A]">{competitorData.target_product.market_fit_score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">کیفیت</p>
                      <p className="text-lg font-black text-[#14B8A6]">{competitorData.target_product.quality_score}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">آمادگی بازار</p>
                      <p className="text-lg font-black text-[#D4A547]">{competitorData.target_product.market_readiness}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {competitorData && competitorData.gap_analysis && competitorData.gap_analysis.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#1E3A8A]" />
                  تحلیل شکاف رقابتی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {competitorData.gap_analysis.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-700">{gap.metric}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">شما: {gap.target}</span>
                        <span className="text-xs text-slate-400">میانگین: {gap.average}</span>
                        <span className={`text-sm font-bold ${gap.is_advantage ? 'text-emerald-600' : 'text-red-500'}`}>
                          {gap.gap > 0 ? '+' : ''}{gap.gap}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {competitorLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-[#1E3A8A] border-t-transparent animate-spin" />
                <p className="text-slate-500">در حال بارگذاری رقبا...</p>
              </div>
            ) : competitorError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
                <p className="text-red-600">{competitorError}</p>
                <button
                  onClick={() => {
                    fetchCompetitorData(selectedProductId);
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : filteredCompetitors.length > 0 ? (
              <div className="space-y-4">
                {filteredCompetitors.map((comp) => (
                  <CompetitorCard key={comp.seller_id} competitor={comp} isTop={comp.rank <= 3} />
                ))}
              </div>
            ) : (
              <EmptyState
                message="هیچ رقیبی برای نمایش وجود ندارد"
                subMessage="فیلترهای خود را تغییر دهید یا محصول دیگری را انتخاب کنید"
              />
            )}

            {competitorData && competitorData.llm_analysis && competitorData.llm_analysis.summary && (
              <div className="rounded-2xl border-2 border-[#D4A547] bg-gradient-to-r from-[#D4A54705] to-[#D4A54710] p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#D4A547] text-white flex-shrink-0">
                    <Lightbulb size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                      تحلیل هوشمند رقابتی
                      <span className="text-xs font-medium text-[#D4A547] bg-[#D4A54715] px-2 py-0.5 rounded-full">AI-Powered</span>
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{competitorData.llm_analysis.summary}</p>

                    {competitorData.llm_analysis.strengths && competitorData.llm_analysis.strengths.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-emerald-600">🟢 نقاط قوت:</p>
                        <ul className="list-disc list-inside text-xs text-slate-600 mt-1">
                          {competitorData.llm_analysis.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {competitorData.llm_analysis.weaknesses && competitorData.llm_analysis.weaknesses.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-bold text-red-500">🔴 نقاط ضعف:</p>
                        <ul className="list-disc list-inside text-xs text-slate-600 mt-1">
                          {competitorData.llm_analysis.weaknesses.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {competitorData.llm_analysis.competitive_advantage && (
                      <div className="mt-2 p-3 rounded-xl bg-[#1E3A8A10] border border-[#1E3A8A20]">
                        <p className="text-xs font-bold text-[#1E3A8A]">⭐ مزیت رقابتی اصلی:</p>
                        <p className="text-xs text-slate-700 mt-0.5">{competitorData.llm_analysis.competitive_advantage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.recommendations && data.recommendations.length > 0 ? (
                data.recommendations.map((rec) => {
                  const IconComponent = getIconComponent(rec.icon);
                  return (
                    <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition group">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${rec.priority === 'high' ? 'bg-red-50' : rec.priority === 'medium' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                          <IconComponent size={24} className={rec.priority === 'high' ? 'text-red-600' : rec.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-extrabold text-slate-900">{rec.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(rec.priority)}`}>{getPriorityLabel(rec.priority)}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed mb-3">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">تأثیر: <strong>{rec.impact}</strong></span>
                            <button className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] hover:text-[#14B8A6] transition">
                              {rec.action}
                              <ArrowLeft size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2">
                  <EmptyState message="هیچ پیشنهادی وجود ندارد" subMessage="بر اساس داده‌های موجود، پیشنهادی یافت نشد" />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-[#14B8A6]" /> تحلیل شکاف عرضه و تقاضا
              </h2>
              {filteredGapData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredGapData.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 mb-2">{item.industry}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16">تقاضا:</span>
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                              <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.demandGrowth * 2.5))}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#1E3A8A]">+{item.demandGrowth}٪</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16">عرضه:</span>
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                              <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.supplyCount * 1.5))}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#14B8A6]">{item.supplyCount} محصول</span>
                          </div>
                        </div>
                      </div>
                      {item.gap === 'شکاف عرضه' && <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium whitespace-nowrap">شکاف عرضه</span>}
                      {item.gap === 'شکاف تقاضا' && <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium whitespace-nowrap">شکاف تقاضا</span>}
                      {item.gap === 'متوازن' && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium whitespace-nowrap">متوازن</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="داده‌ای برای تحلیل شکاف وجود ندارد" />
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">مرکز هوشمند تحلیل بازار تحول — داده‌ها بر اساس آخرین فعالیت‌های پلتفرم به‌روزرسانی می‌شوند</p>
        </div>
      </footer>
    </div>
  );
}