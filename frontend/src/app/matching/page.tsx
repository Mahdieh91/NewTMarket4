'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Lightbulb,
  Package,
  MessageSquareText,
  Star,
  Shield,
  Clock,
  DollarSign,
  Building2,
  User,
  CheckCircle,
  AlertCircle,
  Zap,
  ArrowRight,
  Eye,
  Heart,
  BarChart3,
  X,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
} from 'lucide-react';

// ==================== Types ====================
interface MatchResult {
  id: number;
  type: 'product' | 'service' | 'consultant';
  title: string;
  provider: string;
  providerRating: number;
  matchPercentage: number;
  matchReason: string;
  riskLevel: 'low' | 'medium' | 'high';
  price: string;
  deliveryTime: string;
  trl: number;
  mrl: number;
  industry: string;
  description: string;
}

interface RegisteredNeed {
  id: number;
  title: string;
  industry: string;
  budget: string;
  timeline: string;
  status: string;
  description: string;
}

// ==================== Mock Data ====================
const mockNeed: RegisteredNeed = {
  id: 1,
  title: 'بهینه‌سازی مصرف انرژی در کوره واحد تقطیر',
  industry: 'نفت و گاز',
  budget: '۵۰۰ میلیون تا ۱ میلیارد تومان',
  timeline: '۳ تا ۶ ماه',
  status: 'منتشر شده',
  description:
    'نیاز به یک راهکار هوشمند برای کاهش مصرف گاز طبیعی و بهبود کیفیت نفت سفید با تنظیم دقیق دمای کوره. خروجی مورد انتظار: کاهش ۱۵٪ مصرف انرژی و افزایش ۲ واحدی کیفیت محصول.',
};

const mockMatches: MatchResult[] = [
  {
    id: 1,
    type: 'product',
    title: 'سامانه پایش هوشمند کوره',
    provider: 'شرکت فناوران نوین',
    providerRating: 4.8,
    matchPercentage: 94,
    matchReason: 'تخصص در بهینه‌سازی کوره، سابقه موفق در پالایشگاه اصفهان',
    riskLevel: 'low',
    price: '۴۵۰ میلیون تومان',
    deliveryTime: '۴ ماه',
    trl: 8,
    mrl: 7,
    industry: 'نفت و گاز',
    description:
      'سامانه مبتنی بر هوش مصنوعی برای پایش و بهینه‌سازی مصرف انرژی کوره‌های صنعتی با قابلیت پیش‌بینی دمای بهینه.',
  },
  {
    id: 2,
    type: 'service',
    title: 'خدمات مشاوره بهینه‌سازی انرژی',
    provider: 'مهندسین مشاور انرژی پویا',
    providerRating: 4.5,
    matchPercentage: 87,
    matchReason: 'تجربه ۱۰ ساله در ممیزی انرژی صنایع نفت و گاز',
    riskLevel: 'low',
    price: '۳۰۰ میلیون تومان',
    deliveryTime: '۶ ماه',
    trl: 9,
    mrl: 8,
    industry: 'نفت و گاز',
    description:
      'خدمات جامع ممیزی انرژی، تحلیل شکاف و ارائه راهکارهای بهینه‌سازی با ضمانت بازگشت سرمایه.',
  },
  {
    id: 3,
    type: 'product',
    title: 'دوقلوی دیجیتال کوره',
    provider: 'هوشمندسازان یزد',
    providerRating: 4.6,
    matchPercentage: 82,
    matchReason: 'فناوری نوین دوقلوی دیجیتال با قابلیت شبیه‌سازی دقیق',
    riskLevel: 'medium',
    price: '۸۰۰ میلیون تومان',
    deliveryTime: '۸ ماه',
    trl: 6,
    mrl: 5,
    industry: 'نفت و گاز',
    description:
      'مدل دوقلوی دیجیتال کوره با شبیه‌سازی دینامیک سیالات محاسباتی و یادگیری ماشین برای پیش‌بینی رفتار کوره.',
  },
  {
    id: 4,
    type: 'product',
    title: 'سیستم کنترل پیشرفته APC',
    provider: 'کنترل صنعتی پارس',
    providerRating: 4.3,
    matchPercentage: 76,
    matchReason: 'راهکار اثبات‌شده در صنایع فرآیندی',
    riskLevel: 'medium',
    price: '۶۰۰ میلیون تومان',
    deliveryTime: '۵ ماه',
    trl: 9,
    mrl: 9,
    industry: 'پتروشیمی',
    description:
      'سیستم کنترل پیشرفته فرآیند با الگوریتم‌های MPC برای بهینه‌سازی چندمتغیره کوره.',
  },
  {
    id: 5,
    type: 'consultant',
    title: 'مشاوره تخصصی احتراق صنعتی',
    provider: 'دکتر احمدی - متخصص احتراق',
    providerRating: 4.9,
    matchPercentage: 71,
    matchReason: 'متخصص برجسته احتراق با ۲۰ مقاله علمی',
    riskLevel: 'low',
    price: '۲۰۰ میلیون تومان',
    deliveryTime: '۳ ماه',
    trl: 9,
    mrl: 6,
    industry: 'نفت و گاز',
    description:
      'مشاوره تخصصی در زمینه بهینه‌سازی احتراق، تحلیل گازهای دودکش و بهبود راندمان حرارتی.',
  },
];

// ==================== Main Component ====================
export default function MatchingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // موقتاً همیشه لاگین فرض می‌شود
  const [isLoggedIn] = useState(true);
  const [userRole] = useState('buyer');
  const [matches, setMatches] = useState<MatchResult[]>(mockMatches);
  const [sortBy, setSortBy] = useState<'match' | 'price' | 'rating'>('match');
  const [filterOpen, setFilterOpen] = useState(false);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [compareList, setCompareList] = useState<number[]>([]);

  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedCompare = localStorage.getItem('compareList');
    if (savedCompare) {
      try {
        setCompareList(JSON.parse(savedCompare));
      } catch {
        localStorage.removeItem('compareList');
      }
    }
  }, []);

  const toggleCompare = (id: number) => {
    setCompareList((prev) => {
      let newList;
      if (prev.includes(id)) {
        newList = prev.filter((cid) => cid !== id);
      } else {
        if (prev.length >= 4) return prev;
        newList = [...prev, id];
      }
      localStorage.setItem('compareList', JSON.stringify(newList));
      return newList;
    });
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const startNegotiation = (match: MatchResult) => {
    router.push(`/negotiation?matchId=${match.id}`);
  };

  const openDetails = (match: MatchResult) => {
    setSelectedMatch(match);
  };

  const closeDetails = () => {
    setSelectedMatch(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] animate-pulse" />
          <p className="text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'match') return b.matchPercentage - a.matchPercentage;
    if (sortBy === 'rating') return b.providerRating - a.providerRating;
    return 0;
  });

  const getRiskBadge = (risk: string) => {
    const map: Record<string, { color: string; label: string; icon: any }> = {
      low: { color: 'bg-emerald-100 text-emerald-700', label: 'ریسک پایین', icon: CheckCircle },
      medium: { color: 'bg-amber-100 text-amber-700', label: 'ریسک متوسط', icon: AlertCircle },
      high: { color: 'bg-red-100 text-red-700', label: 'ریسک بالا', icon: AlertCircle },
    };
    const item = map[risk] || map.medium;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
        <item.icon size={12} />
        {item.label}
      </span>
    );
  };

  const getMatchColor = (percent: number) => {
    if (percent >= 90) return 'text-emerald-600';
    if (percent >= 75) return 'text-[#14B8A6]';
    if (percent >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-white"
      dir="rtl"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== Right Column: Registered Need (1/3) ===== */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                  <Lightbulb size={20} className="text-[#1E3A8A]" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">نیاز ثبت شده</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{mockNeed.title}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {mockNeed.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{mockNeed.description}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="font-medium">صنعت:</span> {mockNeed.industry}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <DollarSign size={14} className="text-slate-400" />
                    <span className="font-medium">بودجه:</span> {mockNeed.budget}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span className="font-medium">زمان‌بندی:</span> {mockNeed.timeline}
                  </div>
                </div>

                {/* همیشه لاگین فرض می‌شود */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => sortedMatches.length > 0 && startNegotiation(sortedMatches[0])}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] px-4 py-2.5 text-sm font-bold text-white hover:shadow-lg transition"
                  >
                    <MessageSquareText size={16} />
                    شروع مذاکره با برترین گزینه
                  </button>
                  {userRole === 'buyer' && (
                    <Link
                      href="/need/register"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#1E3A8A] px-4 py-2.5 text-sm font-bold text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition"
                    >
                      <Lightbulb size={16} />
                      ثبت نیاز جدید
                    </Link>
                  )}
                  {userRole === 'supplier' && (
                    <Link
                      href="/supply/register"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#14B8A6] px-4 py-2.5 text-sm font-bold text-[#14B8A6] hover:bg-[#14B8A6]/5 transition"
                    >
                      <Package size={16} />
                      ثبت محصول جدید
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#14B8A6]" />
                آمار تطبیق
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">راهکارهای یافت شده</span>
                  <span className="text-sm font-bold text-[#1E3A8A]">{matches.length} مورد</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">بالاترین انطباق</span>
                  <span className="text-sm font-bold text-emerald-600">۹۴٪</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">میانگین انطباق</span>
                  <span className="text-sm font-bold text-[#14B8A6]">۸۲٪</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Left Column: Match Results (2/3) ===== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sort & Filter Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Zap size={20} className="text-[#D4A547]" />
                راهکارهای پیشنهادی
                <span className="text-sm font-medium text-slate-500">({matches.length} مورد)</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <SlidersHorizontal size={16} />
                  فیلترها
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition cursor-pointer outline-none"
                >
                  <option value="match">مرتب‌سازی: بیشترین انطباق</option>
                  <option value="rating">مرتب‌سازی: بهترین امتیاز</option>
                  <option value="price">مرتب‌سازی: کمترین قیمت</option>
                </select>
              </div>
            </div>

            {/* Filter Panel */}
            {filterOpen && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-800">فیلترهای پیشرفته</h3>
                  <button onClick={() => setFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <select className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none">
                    <option>همه صنایع</option>
                    <option>نفت و گاز</option>
                    <option>پتروشیمی</option>
                    <option>فولاد</option>
                  </select>
                  <select className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none">
                    <option>همه TRL</option>
                    <option>TRL 7+</option>
                    <option>TRL 8+</option>
                    <option>TRL 9</option>
                  </select>
                  <select className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none">
                    <option>همه قیمت‌ها</option>
                    <option>زیر ۳۰۰ میلیون</option>
                    <option>۳۰۰ تا ۶۰۰ میلیون</option>
                    <option>بالای ۶۰۰ میلیون</option>
                  </select>
                  <select className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none">
                    <option>همه ریسک‌ها</option>
                    <option>ریسک پایین</option>
                    <option>ریسک متوسط</option>
                  </select>
                </div>
              </div>
            )}

            {/* Match Cards */}
            <div className="space-y-4">
              {sortedMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-[#14B8A6]/30 transition-all duration-300 group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Match Percentage Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1E3A8A]/5 to-[#14B8A6]/5 border border-[#14B8A6]/20">
                      <span className={`text-2xl font-black ${getMatchColor(match.matchPercentage)}`}>
                        {match.matchPercentage}٪
                      </span>
                      <span className="text-[10px] text-slate-500">انطباق</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#1E3A8A] transition">
                            {match.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{match.provider}</span>
                            <div className="flex items-center gap-0.5">
                              <Star size={12} className="text-[#D4A547] fill-[#D4A547]" />
                              <span className="text-xs font-bold text-slate-700">{match.providerRating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRiskBadge(match.riskLevel)}
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {match.type === 'product' ? 'محصول' : match.type === 'service' ? 'خدمت' : 'مشاور'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{match.description}</p>

                      {/* Match Reason */}
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-[#14B8A6]/5 border border-[#14B8A6]/10 mb-3">
                        <Sparkles size={14} className="text-[#14B8A6] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700">
                          <span className="font-bold">دلیل پیشنهاد:</span> {match.matchReason}
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="text-[10px] text-slate-400">TRL</p>
                          <p className="text-xs font-bold text-slate-700">{match.trl}/۹</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="text-[10px] text-slate-400">MRL</p>
                          <p className="text-xs font-bold text-slate-700">{match.mrl}/۹</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="text-[10px] text-slate-400">قیمت</p>
                          <p className="text-xs font-bold text-slate-700">{match.price}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50">
                          <p className="text-[10px] text-slate-400">زمان تحویل</p>
                          <p className="text-xs font-bold text-slate-700">{match.deliveryTime}</p>
                        </div>
                      </div>

                      {/* Action Buttons - always visible */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => startNegotiation(match)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] hover:shadow-lg transition"
                        >
                          <MessageSquareText size={14} />
                          شروع مذاکره
                        </button>
                        <button
                          onClick={() => toggleCompare(match.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            compareList.includes(match.id)
                              ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]'
                              : 'text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A]/5'
                          }`}
                        >
                          <BarChart3 size={14} />
                          {compareList.includes(match.id) ? 'انتخاب شده' : 'مقایسه'}
                        </button>
                        <button
                          onClick={() => openDetails(match)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                        >
                          <Eye size={14} />
                          جزئیات
                        </button>
                        <button
                          onClick={() => toggleFavorite(match.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                            favorites.includes(match.id)
                              ? 'text-red-500 bg-red-50'
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart
                            size={14}
                            fill={favorites.includes(match.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedMatches.length === 0 && (
              <div className="text-center py-16">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2">نتیجه‌ای یافت نشد</h3>
                <p className="text-sm text-slate-500">با تغییر فیلترها یا ثبت نیاز جدید، راهکارهای بیشتری کشف کنید.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== نوار مقایسه شناور ===== */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-[#1E3A8A]" />
              <span className="text-sm font-bold text-slate-800">
                {compareList.length} راهکار انتخاب شده
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCompareList([]);
                  localStorage.removeItem('compareList');
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
              >
                حذف همه
              </button>
              <Link
                href="/compare"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-sm font-bold hover:shadow-lg transition"
              >
                مشاهده مقایسه
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال جزئیات ===== */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeDetails}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDetails}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 mb-4">{selectedMatch.title}</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">ارائه‌دهنده:</span>
                <span className="text-sm text-slate-800">{selectedMatch.provider}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-[#D4A547] fill-[#D4A547]" />
                <span className="text-sm font-medium text-slate-600">امتیاز:</span>
                <span className="text-sm text-slate-800">{selectedMatch.providerRating}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[#14B8A6]" />
                <span className="text-sm font-medium text-slate-600">درصد انطباق:</span>
                <span className="text-sm font-bold text-emerald-600">{selectedMatch.matchPercentage}٪</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">نوع:</span>
                <span className="text-sm text-slate-800">
                  {selectedMatch.type === 'product' ? 'محصول' : selectedMatch.type === 'service' ? 'خدمت' : 'مشاور'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">قیمت:</span>
                <span className="text-sm text-slate-800">{selectedMatch.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">زمان تحویل:</span>
                <span className="text-sm text-slate-800">{selectedMatch.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">TRL:</span>
                <span className="text-sm text-slate-800">{selectedMatch.trl}/۹</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600">MRL:</span>
                <span className="text-sm text-slate-800">{selectedMatch.mrl}/۹</span>
              </div>
              <div className="flex items-center gap-2">
                {getRiskBadge(selectedMatch.riskLevel)}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-600 leading-relaxed">{selectedMatch.description}</p>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-[#14B8A6]/5 border border-[#14B8A6]/10">
                <p className="text-xs text-slate-700">
                  <span className="font-bold">دلیل پیشنهاد:</span> {selectedMatch.matchReason}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  closeDetails();
                  startNegotiation(selectedMatch);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-sm font-bold"
              >
                شروع مذاکره
              </button>
              <button
                onClick={() => {
                  toggleCompare(selectedMatch.id);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${
                  compareList.includes(selectedMatch.id)
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]'
                    : 'text-[#1E3A8A] border-[#1E3A8A]'
                }`}
              >
                {compareList.includes(selectedMatch.id) ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}