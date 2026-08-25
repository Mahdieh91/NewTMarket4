'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, PieChart, Lightbulb, Filter, Sparkles,
  Calendar, Target, ArrowLeft, Star, Zap,
  Activity, Cpu, Thermometer, LineChart, Layers, Eye, CheckCircle,
  AlertCircle, Clock, Bookmark,
  Users, Package, ArrowRight, User, Lock, Info,
} from 'lucide-react';
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, PieChart as RePieChart,
  Pie, Cell,
} from 'recharts';

const COLORS = ['#1E3A8A', '#14B8A6', '#D4A547', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// ==================== Types ====================
interface TrendPoint { month: string; تقاضا: number; عرضه: number; معاملات: number; }
interface HeatmapItem { industry: string; region: string; tech: string; demandGrowth: number; supplyCount: number; dealValue: number; activityLevel: 'hot' | 'warm' | 'cold'; trend: 'up' | 'stable' | 'down'; }
interface Competitor { name: string; products: number; marketShare: number; avgRating: number; strengths: string[]; weaknesses: string[]; industries: string[]; regions: string[]; techs: string[]; ratingReasons: string[]; }
interface EmergingTech { name: string; category: string; growthRate: number; maturityLevel: string; opportunityScore: number; industries: string[]; regions: string[]; }
interface TopItem { title: string; count?: number; views?: number; rating?: number; growth?: string; industry: string; tech: string; }
interface Recommendation { id: number; title: string; description: string; action: string; priority: 'high' | 'medium' | 'low'; impact: string; icon: any; }

// ==================== داده‌های پایه نمودار برای هر صنعت ====================
const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

const industryBaseTrends: Record<string, TrendPoint[]> = {
  'نفت و گاز': months.map((m, i) => ({ month: m, تقاضا: 45 + i * 5, عرضه: 38 + i * 4, معاملات: 22 + i * 3 })),
  'پتروشیمی': months.map((m, i) => ({ month: m, تقاضا: 40 + i * 4, عرضه: 35 + i * 3, معاملات: 20 + i * 2 })),
  'فولاد و معدن': months.map((m, i) => ({ month: m, تقاضا: 35 + i * 3, عرضه: 30 + i * 2, معاملات: 18 + i * 1 })),
  'سلامت': months.map((m, i) => ({ month: m, تقاضا: 50 + i * 6, عرضه: 45 + i * 5, معاملات: 28 + i * 4 })),
  'کشاورزی': months.map((m, i) => ({ month: m, تقاضا: 25 + i * 2, عرضه: 20 + i * 1, معاملات: 12 + i * 1 })),
  'حمل‌ونقل': months.map((m, i) => ({ month: m, تقاضا: 30 + i * 3, عرضه: 28 + i * 2, معاملات: 15 + i * 2 })),
  'خودروسازی': months.map((m, i) => ({ month: m, تقاضا: 20 + i * 1, عرضه: 25 + i * 2, معاملات: 10 + i * 1 })),
  'انرژی': months.map((m, i) => ({ month: m, تقاضا: 55 + i * 7, عرضه: 48 + i * 6, معاملات: 32 + i * 5 })),
  'فناوری اطلاعات': months.map((m, i) => ({ month: m, تقاضا: 60 + i * 8, عرضه: 55 + i * 7, معاملات: 35 + i * 6 })),
  'محیط زیست': months.map((m, i) => ({ month: m, تقاضا: 28 + i * 2, عرضه: 22 + i * 1, معاملات: 14 + i * 1 })),
};

const regionMultiplier: Record<string, number> = {
  'تهران': 1.3, 'اصفهان': 1.1, 'شیراز': 0.9, 'تبریز': 0.8, 'مشهد': 0.7,
};
const techMultiplier: Record<string, number> = {
  'هوش مصنوعی': 1.4, 'اینترنت اشیاء': 1.2, 'دوقلوی دیجیتال': 1.3,
  'رباتیک': 0.9, 'بلاکچین': 0.8, 'داده‌کاوی': 1.1,
};

// ==================== داده‌های نمونه ====================
const allHeatmap: HeatmapItem[] = [
  { industry: 'نفت و گاز', region: 'تهران', tech: 'هوش مصنوعی', demandGrowth: 28, supplyCount: 45, dealValue: 12500, activityLevel: 'hot', trend: 'up' },
  { industry: 'نفت و گاز', region: 'اصفهان', tech: 'دوقلوی دیجیتال', demandGrowth: 22, supplyCount: 38, dealValue: 11000, activityLevel: 'hot', trend: 'up' },
  { industry: 'پتروشیمی', region: 'تهران', tech: 'اینترنت اشیاء', demandGrowth: 22, supplyCount: 38, dealValue: 9800, activityLevel: 'hot', trend: 'up' },
  { industry: 'پتروشیمی', region: 'شیراز', tech: 'هوش مصنوعی', demandGrowth: 18, supplyCount: 32, dealValue: 8500, activityLevel: 'warm', trend: 'up' },
  { industry: 'فولاد و معدن', region: 'اصفهان', tech: 'رباتیک', demandGrowth: 18, supplyCount: 32, dealValue: 7500, activityLevel: 'warm', trend: 'up' },
  { industry: 'فولاد و معدن', region: 'تبریز', tech: 'دوقلوی دیجیتال', demandGrowth: 15, supplyCount: 28, dealValue: 6800, activityLevel: 'warm', trend: 'stable' },
  { industry: 'سلامت', region: 'تهران', tech: 'هوش مصنوعی', demandGrowth: 25, supplyCount: 55, dealValue: 6200, activityLevel: 'hot', trend: 'up' },
  { industry: 'سلامت', region: 'مشهد', tech: 'اینترنت اشیاء', demandGrowth: 20, supplyCount: 48, dealValue: 5800, activityLevel: 'hot', trend: 'up' },
  { industry: 'کشاورزی', region: 'شیراز', tech: 'رباتیک', demandGrowth: 12, supplyCount: 20, dealValue: 3400, activityLevel: 'warm', trend: 'stable' },
  { industry: 'کشاورزی', region: 'اصفهان', tech: 'بلاکچین', demandGrowth: 10, supplyCount: 18, dealValue: 3000, activityLevel: 'warm', trend: 'stable' },
  { industry: 'حمل‌ونقل', region: 'تهران', tech: 'اینترنت اشیاء', demandGrowth: 15, supplyCount: 28, dealValue: 5600, activityLevel: 'warm', trend: 'up' },
  { industry: 'حمل‌ونقل', region: 'تبریز', tech: 'هوش مصنوعی', demandGrowth: 12, supplyCount: 25, dealValue: 5000, activityLevel: 'warm', trend: 'up' },
  { industry: 'خودروسازی', region: 'تهران', tech: 'رباتیک', demandGrowth: 8, supplyCount: 35, dealValue: 8900, activityLevel: 'cold', trend: 'down' },
  { industry: 'خودروسازی', region: 'اصفهان', tech: 'دوقلوی دیجیتال', demandGrowth: 5, supplyCount: 30, dealValue: 7800, activityLevel: 'cold', trend: 'down' },
  { industry: 'انرژی', region: 'تهران', tech: 'هوش مصنوعی', demandGrowth: 32, supplyCount: 42, dealValue: 15000, activityLevel: 'hot', trend: 'up' },
  { industry: 'انرژی', region: 'شیراز', tech: 'اینترنت اشیاء', demandGrowth: 28, supplyCount: 38, dealValue: 13500, activityLevel: 'hot', trend: 'up' },
  { industry: 'فناوری اطلاعات', region: 'تهران', tech: 'هوش مصنوعی', demandGrowth: 35, supplyCount: 65, dealValue: 11000, activityLevel: 'hot', trend: 'up' },
  { industry: 'فناوری اطلاعات', region: 'مشهد', tech: 'بلاکچین', demandGrowth: 30, supplyCount: 58, dealValue: 9800, activityLevel: 'hot', trend: 'up' },
  { industry: 'محیط زیست', region: 'تهران', tech: 'اینترنت اشیاء', demandGrowth: 20, supplyCount: 18, dealValue: 4200, activityLevel: 'warm', trend: 'up' },
  { industry: 'محیط زیست', region: 'اصفهان', tech: 'هوش مصنوعی', demandGrowth: 18, supplyCount: 15, dealValue: 3800, activityLevel: 'warm', trend: 'up' },
];

const allCompetitors: Competitor[] = [
  { name: 'فناوران نوین', products: 28, marketShare: 18, avgRating: 4.8, strengths: ['هوش مصنوعی', 'پشتیبانی ۲۴/۷'], weaknesses: ['قیمت بالا'], industries: ['نفت و گاز', 'پتروشیمی', 'انرژی'], regions: ['تهران', 'اصفهان'], techs: ['هوش مصنوعی', 'دوقلوی دیجیتال'], ratingReasons: ['کیفیت بالای مستندات فنی', 'پاسخگویی سریع', 'رضایت مشتریان قبلی', 'نوآوری در محصول'] },
  { name: 'مهندسی انرژی پویا', products: 22, marketShare: 14, avgRating: 4.5, strengths: ['تجربه بالا', 'گواهینامه‌ها'], weaknesses: ['زمان تحویل طولانی'], industries: ['انرژی', 'نفت و گاز'], regions: ['تهران', 'شیراز'], techs: ['اینترنت اشیاء', 'هوش مصنوعی'], ratingReasons: ['سابقه طولانی در صنعت', 'گواهینامه‌های معتبر', 'تحویل به‌موقع در پروژه‌های قبلی'] },
  { name: 'هوشمندسازان یزد', products: 18, marketShare: 11, avgRating: 4.6, strengths: ['نوآوری', 'قیمت رقابتی'], weaknesses: ['تیم کوچک'], industries: ['فولاد و معدن', 'خودروسازی'], regions: ['اصفهان', 'تبریز'], techs: ['رباتیک', 'دوقلوی دیجیتال'], ratingReasons: ['راهکارهای خلاقانه', 'قیمت مناسب', 'انعطاف‌پذیری بالا'] },
  { name: 'کنترل صنعتی پارس', products: 25, marketShare: 16, avgRating: 4.3, strengths: ['سابقه طولانی', 'محصولات متنوع'], weaknesses: ['فناوری قدیمی'], industries: ['پتروشیمی', 'حمل‌ونقل'], regions: ['تهران', 'مشهد'], techs: ['اینترنت اشیاء', 'بلاکچین'], ratingReasons: ['تنوع محصولات', 'پشتیبانی گسترده', 'قیمت متوسط'] },
  { name: 'پردازش داده‌های هوشمند', products: 15, marketShare: 9, avgRating: 4.7, strengths: ['دقت بالا', 'سرعت'], weaknesses: ['بازار محدود'], industries: ['فناوری اطلاعات', 'سلامت'], regions: ['تهران'], techs: ['هوش مصنوعی', 'دوقلوی دیجیتال'], ratingReasons: ['دقت الگوریتم‌ها', 'سرعت پردازش بالا', 'تخصص در داده‌کاوی'] },
  { name: 'راهکارهای سبز', products: 12, marketShare: 7, avgRating: 4.4, strengths: ['قیمت مناسب', 'سفارشی‌سازی'], weaknesses: ['مقیاس کوچک'], industries: ['محیط زیست', 'کشاورزی'], regions: ['شیراز', 'اصفهان'], techs: ['اینترنت اشیاء', 'رباتیک'], ratingReasons: ['سفارشی‌سازی بالا', 'قیمت رقابتی', 'پشتیبانی محلی'] },
];

const allEmergingTechs: EmergingTech[] = [
  { name: 'دوقلوی دیجیتال', category: 'Industry 4.0', growthRate: 45, maturityLevel: 'در حال رشد', opportunityScore: 92, industries: ['نفت و گاز', 'پتروشیمی', 'فولاد و معدن'], regions: ['تهران', 'اصفهان'] },
  { name: 'بهینه‌سازی با AI', category: 'هوش مصنوعی', growthRate: 38, maturityLevel: 'بالغ', opportunityScore: 88, industries: ['انرژی', 'فناوری اطلاعات', 'سلامت'], regions: ['تهران', 'مشهد'] },
  { name: 'اینترنت اشیاء صنعتی', category: 'IIoT', growthRate: 32, maturityLevel: 'در حال رشد', opportunityScore: 85, industries: ['حمل‌ونقل', 'پتروشیمی', 'محیط زیست'], regions: ['تهران', 'شیراز'] },
  { name: 'تحلیل پیش‌بینانه', category: 'داده‌کاوی', growthRate: 28, maturityLevel: 'بالغ', opportunityScore: 80, industries: ['فناوری اطلاعات', 'سلامت', 'انرژی'], regions: ['تهران', 'اصفهان'] },
  { name: 'رباتیک صنعتی', category: 'اتوماسیون', growthRate: 25, maturityLevel: 'نوظهور', opportunityScore: 78, industries: ['خودروسازی', 'فولاد و معدن'], regions: ['تبریز', 'اصفهان'] },
  { name: 'بلاکچین صنعتی', category: 'امنیت', growthRate: 20, maturityLevel: 'نوظهور', opportunityScore: 65, industries: ['فناوری اطلاعات', 'کشاورزی'], regions: ['تهران', 'مشهد'] },
];

const allTopNeeds: TopItem[] = [
  { title: 'بهینه‌سازی مصرف انرژی', count: 48, growth: '+۲۸٪', industry: 'انرژی', tech: 'هوش مصنوعی' },
  { title: 'پایش هوشمند تجهیزات', count: 42, growth: '+۲۲٪', industry: 'نفت و گاز', tech: 'اینترنت اشیاء' },
  { title: 'اتوماسیون فرآیندها', count: 38, growth: '+۱۸٪', industry: 'پتروشیمی', tech: 'رباتیک' },
  { title: 'تحلیل داده‌های صنعتی', count: 35, growth: '+۳۰٪', industry: 'فناوری اطلاعات', tech: 'داده‌کاوی' },
  { title: 'مدیریت زنجیره تأمین', count: 31, growth: '+۱۵٪', industry: 'حمل‌ونقل', tech: 'بلاکچین' },
  { title: 'تشخیص نقص تجهیزات', count: 28, growth: '+۲۵٪', industry: 'فولاد و معدن', tech: 'هوش مصنوعی' },
  { title: 'پایش کیفیت محصول', count: 25, growth: '+۲۰٪', industry: 'سلامت', tech: 'اینترنت اشیاء' },
  { title: 'بهینه‌سازی مصرف آب', count: 22, growth: '+۱۲٪', industry: 'کشاورزی', tech: 'دوقلوی دیجیتال' },
  { title: 'کاهش آلایندگی', count: 20, growth: '+۱۸٪', industry: 'محیط زیست', tech: 'اینترنت اشیاء' },
  { title: 'طراحی ربات صنعتی', count: 18, growth: '+۱۰٪', industry: 'خودروسازی', tech: 'رباتیک' },
];

const allTopProducts: TopItem[] = [
  { title: 'سامانه پایش هوشمند کوره', views: 1250, rating: 4.8, industry: 'نفت و گاز', tech: 'هوش مصنوعی' },
  { title: 'نرم‌افزار Digital Twin', views: 980, rating: 4.6, industry: 'پتروشیمی', tech: 'دوقلوی دیجیتال' },
  { title: 'سیستم کنترل پیشرفته APC', views: 850, rating: 4.5, industry: 'انرژی', tech: 'هوش مصنوعی' },
  { title: 'مشاوره بهینه‌سازی انرژی', views: 720, rating: 4.9, industry: 'انرژی', tech: 'داده‌کاوی' },
  { title: 'راهکار یکپارچه IIoT', views: 680, rating: 4.4, industry: 'حمل‌ونقل', tech: 'اینترنت اشیاء' },
  { title: 'ربات بازرسی خط لوله', views: 550, rating: 4.7, industry: 'نفت و گاز', tech: 'رباتیک' },
  { title: 'پلتفرم تحلیل داده سلامت', views: 520, rating: 4.8, industry: 'سلامت', tech: 'داده‌کاوی' },
  { title: 'سامانه مدیریت هوشمند گلخانه', views: 480, rating: 4.3, industry: 'کشاورزی', tech: 'اینترنت اشیاء' },
  { title: 'نرم‌افزار شبیه‌سازی فرآیند', views: 450, rating: 4.6, industry: 'فولاد و معدن', tech: 'دوقلوی دیجیتال' },
  { title: 'بلاکچین ردیابی محصول', views: 400, rating: 4.5, industry: 'فناوری اطلاعات', tech: 'بلاکچین' },
];

const allMarketShareData = [
  { name: 'فناوران نوین', value: 18 },
  { name: 'کنترل پارس', value: 16 },
  { name: 'انرژی پویا', value: 14 },
  { name: 'هوشمندسازان', value: 11 },
  { name: 'پردازش هوشمند', value: 9 },
  { name: 'راهکار سبز', value: 7 },
  { name: 'سایر', value: 25 },
];

const smartRecommendations: Recommendation[] = [
  { id: 1, title: 'فرصت طلایی در صنعت انرژی', description: 'تقاضا برای راهکارهای بهینه‌سازی مصرف انرژی ۳۲٪ رشد داشته است.', action: 'ثبت محصول در حوزه انرژی', priority: 'high', impact: 'بالا', icon: Zap },
  { id: 2, title: 'شکاف عرضه در سلامت', description: 'نیازهای ثبت‌شده در حوزه سلامت ۲۵٪ افزایش یافته اما عرضه فقط ۱۵٪ رشد داشته.', action: 'بررسی نیازهای سلامت', priority: 'high', impact: 'متوسط', icon: Activity },
  { id: 3, title: 'فناوری دوقلوی دیجیتال', description: 'رشد ۴۵٪ در جستجوهای مرتبط با Digital Twin. رقابت هنوز کم است.', action: 'توسعه محصول دوقلوی دیجیتال', priority: 'medium', impact: 'بالا', icon: Cpu },
  { id: 4, title: 'کاهش رقابت در خودروسازی', description: 'نرخ رشد تقاضا در خودروسازی کاهش یافته. بازنگری استراتژی توصیه می‌شود.', action: 'تنوع‌بخشی به صنایع هدف', priority: 'medium', impact: 'متوسط', icon: AlertCircle },
];

// ==================== Main Component ====================
export default function MarketIntelligencePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('12m');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'competitors' | 'opportunities'>('overview');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  // ==================== Filtering Logic ====================

  // 1. Filter heatmap
  const filteredHeatmap = useMemo(() => {
    return allHeatmap.filter(item => {
      if (selectedIndustry !== 'all' && item.industry !== selectedIndustry) return false;
      if (selectedRegion !== 'all' && item.region !== selectedRegion) return false;
      if (selectedTech !== 'all' && item.tech !== selectedTech) return false;
      return true;
    });
  }, [selectedIndustry, selectedRegion, selectedTech]);

  // 2. Filter trend data
  const filteredTrendData = useMemo(() => {
    let base: TrendPoint[];
    if (selectedIndustry !== 'all') {
      base = industryBaseTrends[selectedIndustry] || industryBaseTrends['فناوری اطلاعات'];
    } else {
      const allIndustries = Object.keys(industryBaseTrends);
      base = months.map((m, i) => {
        const sum = allIndustries.reduce((acc, ind) => {
          const point = industryBaseTrends[ind][i];
          return { تقاضا: acc.تقاضا + point.تقاضا, عرضه: acc.عرضه + point.عرضه, معاملات: acc.معاملات + point.معاملات };
        }, { تقاضا: 0, عرضه: 0, معاملات: 0 });
        return {
          month: m,
          تقاضا: Math.round(sum.تقاضا / allIndustries.length),
          عرضه: Math.round(sum.عرضه / allIndustries.length),
          معاملات: Math.round(sum.معاملات / allIndustries.length),
        };
      });
    }

    let multiplier = 1;
    if (selectedRegion !== 'all') multiplier *= regionMultiplier[selectedRegion] || 1;
    if (selectedTech !== 'all') multiplier *= techMultiplier[selectedTech] || 1;

    let data = base.map(point => ({
      month: point.month,
      تقاضا: Math.round(point.تقاضا * multiplier),
      عرضه: Math.round(point.عرضه * multiplier),
      معاملات: Math.round(point.معاملات * multiplier),
    }));

    const monthsCount = selectedTimeRange === '3m' ? 3 : selectedTimeRange === '6m' ? 6 : selectedTimeRange === '12m' ? 12 : 24;
    if (monthsCount <= 12) {
      data = data.slice(-monthsCount);
    } else {
      data = [...data, ...data.map(d => ({ ...d, month: d.month + '۲' }))];
    }
    return data;
  }, [selectedIndustry, selectedRegion, selectedTech, selectedTimeRange]);

  // 3. Filter competitors
  const filteredCompetitors = useMemo(() => {
    return allCompetitors.filter(comp => {
      if (selectedIndustry !== 'all' && !comp.industries.includes(selectedIndustry)) return false;
      if (selectedRegion !== 'all' && !comp.regions.includes(selectedRegion)) return false;
      if (selectedTech !== 'all' && !comp.techs.includes(selectedTech)) return false;
      return true;
    });
  }, [selectedIndustry, selectedRegion, selectedTech]);

  // 4. Filter emerging techs
  const filteredEmergingTechs = useMemo(() => {
    return allEmergingTechs.filter(tech => {
      if (selectedIndustry !== 'all' && !tech.industries.includes(selectedIndustry)) return false;
      if (selectedRegion !== 'all' && !tech.regions.includes(selectedRegion)) return false;
      if (selectedTech !== 'all' && tech.category !== selectedTech) return false;
      return true;
    });
  }, [selectedIndustry, selectedRegion, selectedTech]);

  // 5. Filter needs and products
  const filteredTopNeeds = useMemo(() => {
    return allTopNeeds.filter(need => {
      if (selectedIndustry !== 'all' && need.industry !== selectedIndustry) return false;
      if (selectedTech !== 'all' && need.tech !== selectedTech) return false;
      return true;
    });
  }, [selectedIndustry, selectedTech]);

  const filteredTopProducts = useMemo(() => {
    return allTopProducts.filter(prod => {
      if (selectedIndustry !== 'all' && prod.industry !== selectedIndustry) return false;
      if (selectedTech !== 'all' && prod.tech !== selectedTech) return false;
      return true;
    });
  }, [selectedIndustry, selectedTech]);

  // 6. Dynamic KPI calculations
  const kpiData = useMemo(() => {
    const totalNeeds = filteredTopNeeds.reduce((sum, n) => sum + (n.count || 0), 0);
    const totalProducts = filteredHeatmap.reduce((sum, h) => sum + h.supplyCount, 0);
    const totalDeals = filteredHeatmap.reduce((sum, h) => sum + h.dealValue, 0);
    const avgGrowth = filteredHeatmap.length > 0
      ? Math.round(filteredHeatmap.reduce((sum, h) => sum + h.demandGrowth, 0) / filteredHeatmap.length)
      : 0;
    return [
      { label: 'نیازهای فعال', value: totalNeeds.toLocaleString('fa-IR'), change: '+۱۲٪', icon: Lightbulb, color: 'bg-[#1E3A8A]/10 text-[#1E3A8A]' },
      { label: 'محصولات ثبت‌شده', value: totalProducts.toLocaleString('fa-IR'), change: '+۱۸٪', icon: Package, color: 'bg-[#14B8A6]/10 text-[#14B8A6]' },
      { label: 'ارزش معاملات (میلیون)', value: (totalDeals / 1000).toFixed(0).toLocaleString('fa-IR'), change: '+۲۲٪', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
      { label: 'میانگین رشد تقاضا', value: `${avgGrowth}٪`, change: '+۵٪', icon: Target, color: 'bg-amber-50 text-amber-600' },
    ];
  }, [filteredTopNeeds, filteredHeatmap]);

  // 7. Gap analysis data
  const gapData = useMemo(() => filteredHeatmap.slice(0, 6), [filteredHeatmap]);

  // ==================== Helper functions ====================
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

  if (!mounted) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]" style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }} dir="rtl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-700 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <Lock size={16} />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

     

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ===== Page Header ===== */}
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
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Clock size={14} />
              آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}
            </div>
          </div>
        </div>

        {/* ===== Filters Bar ===== */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300">
              <option value="all">همه صنایع</option>
              {Object.keys(industryBaseTrends).map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
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
            <span className="text-xs text-slate-400 mr-auto">
              {filteredHeatmap.length} نتیجه
            </span>
          </div>
        </div>

        {/* ===== Tab Navigation ===== */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
          {[
            { key: 'overview', label: 'نمای کلی', icon: Layers },
            { key: 'trends', label: 'روندها', icon: TrendingUp },
            { key: 'competitors', label: 'تحلیل رقبا', icon: Users },
            { key: 'opportunities', label: 'فرصت‌ها', icon: Target },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl transition border-b-2 -mb-[2px] ${
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

        {/* ===== KPI Cards ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiData.map((kpi, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div className={`p-2 rounded-xl ${kpi.color}`}><kpi.icon size={16} /></div>
              </div>
              <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">{kpi.change} نسبت به ماه قبل</p>
            </div>
          ))}
        </div>

        {/* ===== Tab Content ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Trend Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <LineChart size={20} className="text-[#1E3A8A]" />
                روند تقاضا، عرضه و معاملات {selectedIndustry !== 'all' ? `(${selectedIndustry})` : selectedRegion !== 'all' ? `(${selectedRegion})` : selectedTech !== 'all' ? `(${selectedTech})` : '(همه)'}
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <ReLineChart data={filteredTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="تقاضا" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="عرضه" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="معاملات" stroke="#D4A547" strokeWidth={3} dot={{ r: 4 }} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap + Needs/Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Thermometer size={20} className="text-[#14B8A6]" />
                  نقشه حرارتی صنایع
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredHeatmap.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.activityLevel === 'hot' ? 'bg-red-500' : item.activityLevel === 'warm' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.industry}</p>
                          <p className="text-xs text-slate-500">{item.supplyCount} محصول | {item.dealValue.toLocaleString()} میلیون تومان</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">+{item.demandGrowth}٪</p>
                          <p className="text-xs text-slate-400">رشد تقاضا</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getActivityColor(item.activityLevel)}`}>
                          {getTrendIcon(item.trend)}
                          {getActivityLabel(item.activityLevel)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Lightbulb size={20} className="text-[#D4A547]" />
                    نیازهای پرتکرار
                  </h2>
                  <div className="space-y-3">
                    {filteredTopNeeds.map((need, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-6">{i + 1}</span>
                          <span className="text-sm font-medium text-slate-700">{need.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">{need.count} مورد</span>
                          <span className="text-xs text-emerald-600 font-medium">{need.growth}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Eye size={20} className="text-[#14B8A6]" />
                    محصولات پربازدید
                  </h2>
                  <div className="space-y-3">
                    {filteredTopProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-6">{i + 1}</span>
                          <span className="text-sm font-medium text-slate-700">{product.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <Star size={12} className="text-[#D4A547] fill-[#D4A547]" />
                            <span className="text-xs font-bold text-slate-600">{product.rating}</span>
                          </div>
                          <span className="text-xs text-slate-400">{product.views} بازدید</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Share + Emerging Tech */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart size={20} className="text-[#1E3A8A]" />
                  سهم بازار عرضه‌کنندگان
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <RePieChart>
                    <Pie data={allMarketShareData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value}%)`}>
                      {allMarketShareData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Cpu size={20} className="text-[#14B8A6]" />
                  فناوری‌های نوظهور
                </h2>
                <div className="space-y-3">
                  {filteredEmergingTechs.map((tech, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1E3A8A02] to-[#14B8A602] border border-[#14B8A610]">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{tech.name}</p>
                        <p className="text-xs text-slate-500">{tech.category} • {tech.maturityLevel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+{tech.growthRate}٪</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full" style={{ width: `${tech.opportunityScore}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{tech.opportunityScore}/۱۰۰</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4">روند تفصیلی تقاضا بر اساس صنعت</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={filteredTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="تقاضا" stroke="#1E3A8A" fill="#1E3A8A20" strokeWidth={2} />
                <Area type="monotone" dataKey="عرضه" stroke="#14B8A6" fill="#14B8A620" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'competitors' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 overflow-x-auto">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-[#1E3A8A]" />
              جدول تحلیل رقبا
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-right">
                  <th className="py-3 px-3 text-slate-500 font-medium">شرکت</th>
                  <th className="py-3 px-3 text-slate-500 font-medium text-center">محصولات</th>
                  <th className="py-3 px-3 text-slate-500 font-medium text-center">سهم بازار</th>
                  <th className="py-3 px-3 text-slate-500 font-medium text-center">امتیاز</th>
                  <th className="py-3 px-3 text-slate-500 font-medium hidden lg:table-cell">دلایل امتیاز</th>
                  <th className="py-3 px-3 text-slate-500 font-medium">نقاط قوت</th>
                  <th className="py-3 px-3 text-slate-500 font-medium">نقاط ضعف</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetitors.map((comp, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-800">{comp.name}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{comp.products}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full">
                          <div className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full" style={{ width: `${comp.marketShare}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{comp.marketShare}٪</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star size={14} className="text-[#D4A547] fill-[#D4A547]" />
                        <span className="font-bold text-slate-700">{comp.avgRating}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {comp.ratingReasons.map((reason, j) => (
                          <span key={j} className="px-2 py-0.5 rounded-full bg-[#1E3A8A10] text-[#1E3A8A] text-xs font-medium">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {comp.strengths.map((s, j) => (<span key={j} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">{s}</span>))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {comp.weaknesses.map((w, j) => (<span key={j} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs">{w}</span>))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* نمایش دلایل امتیاز در موبایل به صورت جداگانه */}
            <div className="lg:hidden mt-4 space-y-4">
              {filteredCompetitors.map((comp, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50">
                  <p className="font-bold text-slate-800 mb-2">{comp.name} — امتیاز {comp.avgRating}</p>
                  <div className="flex flex-wrap gap-1">
                    {comp.ratingReasons.map((reason, j) => (
                      <span key={j} className="px-2 py-0.5 rounded-full bg-[#1E3A8A10] text-[#1E3A8A] text-xs font-medium">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smartRecommendations.map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition group">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${rec.priority === 'high' ? 'bg-red-50' : rec.priority === 'medium' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                      <rec.icon size={24} className={rec.priority === 'high' ? 'text-red-600' : rec.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-extrabold text-slate-900">{rec.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(rec.priority)}`}>
                          {rec.priority === 'high' ? 'اولویت بالا' : rec.priority === 'medium' ? 'اولویت متوسط' : 'اولویت پایین'}
                        </span>
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
              ))}
            </div>

            {/* Gap Analysis */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-[#14B8A6]" />
                تحلیل شکاف عرضه و تقاضا
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gapData.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800 mb-2">{item.industry}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-16">تقاضا:</span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                            <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${item.demandGrowth * 2.5}%` }} />
                          </div>
                          <span className="text-xs font-bold text-[#1E3A8A]">+{item.demandGrowth}٪</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 w-16">عرضه:</span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                            <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: `${(item.supplyCount / 65) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-[#14B8A6]">{item.supplyCount} محصول</span>
                        </div>
                      </div>
                    </div>
                    {item.demandGrowth > 20 && item.supplyCount < 40 && (
                      <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">شکاف عرضه</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== Smart Recommendation Box ===== */}
        <div className="rounded-2xl border-2 border-[#D4A547] bg-gradient-to-r from-[#D4A54705] to-[#D4A54710] p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#D4A547] text-white"><Zap size={24} /></div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                پیشنهاد هوشمند اقدام
                <span className="text-xs font-medium text-[#D4A547] bg-[#D4A54715] px-2 py-0.5 rounded-full">AI-Powered</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                بر اساس تحلیل داده‌های بازار، <strong>صنعت انرژی</strong> با رشد ۳۲٪ تقاضا و شکاف عرضه قابل توجه، بهترین فرصت سرمایه‌گذاری در ۳ ماه آینده است. همچنین فناوری <strong>دوقلوی دیجیتال</strong> با رشد ۴۵٪ جستجوها، حوزه‌ای با رقابت کم و پتانسیل بالا محسوب می‌شود.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/needs/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] hover:shadow-md transition">
                  <Lightbulb size={14} /> ثبت نیاز در حوزه انرژی
                </Link>
                <Link href="/supply/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A05] transition">
                  <Package size={14} /> عرضه محصول دوقلوی دیجیتال
                </Link>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
                  <Bookmark size={14} /> ذخیره این تحلیل
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">مرکز هوشمند تحلیل بازار تحول — داده‌ها بر اساس آخرین فعالیت‌های پلتفرم به‌روزرسانی می‌شوند</p>
        </div>
      </footer>
    </div>
  );
}