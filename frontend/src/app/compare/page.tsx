// ============================================================
// FILE: frontend/src/app/compare/page.tsx
// ============================================================
// اصلاح‌شده: مدیریت پایدار localStorage + هماهنگی با کلید 'compareList'
// ============================================================

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Loader2,
  Package,
  Scale,
  Trash2,
  TriangleAlert,
  X,
  Zap,
  Heart,
  Eye,
} from 'lucide-react';

import {
  API_URL,
  useAuthStore,
} from '@/store/auth-store';

// ============================================================
// Types (مطابق با Supply از بازار)
// ============================================================

interface SupplyImage {
  id: number;
  image: string;
  caption?: string | null;
  uploaded_at?: string;
}

interface Supply {
  id: number;
  seller: number | null;
  seller_name?: string;

  title: string;
  category: string;
  industry: string;
  technology: string;
  city: string;
  description: string;

  quantity: string;
  unit: string;
  price: string | number;

  trl: string;
  documents: string[];

  status: string;

  view_count?: number;

  created_at: string;
  updated_at: string;

  images: SupplyImage[];
}

interface ComparisonItem {
  productId: number;
  title: string;
  description: string;
  provider: string;
  price: number | string | null;
  trl: number | string | null;
  mrl: number | string | null;
  industry: string;
  category: string;
  supplyType: 'product' | 'service';
  viewCount: number;
  createdAt: string;
  images: string[];
}

// ============================================================
// Constants
// ============================================================

const COMPARE_STORAGE_KEY = 'compareList';
const MAX_COMPARE_ITEMS = 4;
const EMPTY = 'اعلام نشده';

const CHART_COLORS = [
  '#1E3A8A',
  '#14B8A6',
  '#D4A547',
  '#EF4444',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#6366F1',
  '#F97316',
];

// ============================================================
// Helpers
// ============================================================

function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildApiUrl(path: string): string {
  const base = normalizeApiBaseUrl(API_URL);
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

function formatNumber(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return new Intl.NumberFormat('fa-IR').format(numeric);
}

function formatPrice(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return 'قابل مذاکره';
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric === 0) {
    return 'قابل مذاکره';
  }

  return `${new Intl.NumberFormat('fa-IR').format(
    Math.round(numeric)
  )} تومان`;
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return EMPTY;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return EMPTY;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
  }).format(date);
}

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = normalizeApiBaseUrl(API_URL);
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${base}${clean}`;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'در انتظار بررسی',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    draft: 'پیش‌نویس',
    submitted: 'ارسال برای بررسی',
    evaluating: 'در حال ارزیابی',
    needs_revision: 'نیازمند اصلاح',
    published: 'منتشر شده',
    suspended: 'تعلیق شده',
  };
  return map[status] || status || 'ثبت نشده';
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    published: 'bg-blue-50 text-blue-700 border border-blue-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    suspended: 'bg-slate-100 text-slate-600 border border-slate-200',
    draft: 'bg-slate-100 text-slate-600 border border-slate-200',
    submitted: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    evaluating: 'bg-purple-50 text-purple-700 border border-purple-200',
    needs_revision: 'bg-orange-50 text-orange-700 border border-orange-200',
  };
  return map[status] || 'bg-slate-100 text-slate-600 border border-slate-200';
}

function getMatchClass(percentage: number | null): string {
  if (percentage === null) return 'bg-slate-100 text-slate-600';
  if (percentage >= 90) return 'bg-emerald-100 text-emerald-700';
  if (percentage >= 75) return 'bg-[#14B8A6]/10 text-[#0F766E]';
  if (percentage >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function getMatchTextClass(percentage: number | null): string {
  if (percentage === null) return 'text-slate-500';
  if (percentage >= 90) return 'text-emerald-600';
  if (percentage >= 75) return 'text-[#0F766E]';
  if (percentage >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getSupplyType(category: string): 'product' | 'service' {
  if (!category) return 'product';
  const cat = category.trim();
  const serviceKeywords = ['خدمات مشاوره', 'خدمات فنی و مهندسی', 'سرویس', 'خدمت'];
  if (cat.includes('خدمت') || serviceKeywords.some(kw => cat.includes(kw))) {
    return 'service';
  }
  return 'product';
}

// ============================================================
// Component
// ============================================================

export default function ComparePage() {
  const { isAuthenticated, accessToken } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // ==========================================================
  // مدیریت localStorage با دو useEffect مجزا و پایدار
  // ==========================================================

  // ۱) خواندن از localStorage هنگام mount
  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (!saved) {
        setCompareIds([]);
        return;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(COMPARE_STORAGE_KEY);
        setCompareIds([]);
        return;
      }
      const ids = parsed
        .map((item) => Number(item))
        .filter((id) => Number.isInteger(id) && id > 0)
        .slice(0, MAX_COMPARE_ITEMS);
      setCompareIds(ids);
      // اگر تعداد آیتم‌ها تغییر کرده، دوباره ذخیره کن
      if (ids.length !== parsed.length) {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
      }
    } catch (storageError) {
      console.error('❌ خطا در خواندن compareList:', storageError);
      localStorage.removeItem(COMPARE_STORAGE_KEY);
      setCompareIds([]);
    }
  }, []);

  // ۲) ذخیره‌سازی در localStorage هر بار که compareIds تغییر کند (فقط پس از mount)
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch (storageError) {
      console.error('❌ خطا در ذخیره compareList:', storageError);
    }
  }, [compareIds, mounted]);

  // ==========================================================
  // بارگذاری عرضه‌ها از API
  // ==========================================================

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      setError('برای مشاهده مقایسه باید وارد حساب کاربری شوید.');
      setIsLoading(false);
      return;
    }
    if (compareIds.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSupplies() {
      try {
        setIsLoading(true);
        setError(null);

        // پیشنهاد: اگر API از فیلتر با ids پشتیبانی می‌کند، از آن استفاده کنید
        // const idsParam = compareIds.join(',');
        // const response = await fetch(buildApiUrl(`/products/supplies/?ids=${idsParam}`), ...);

        const response = await fetch(buildApiUrl('/products/supplies/'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('نشست کاربری منقضی شده است. لطفاً دوباره وارد شوید.');
          }
          throw new Error(`خطا در دریافت عرضه‌ها (کد ${response.status})`);
        }

        const data = await response.json();
        const items: Supply[] = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

        if (!cancelled) {
          setSupplies(items);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('❌ خطا در بارگذاری عرضه‌ها:', err);
          setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات.');
          setSupplies([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSupplies();

    return () => {
      cancelled = true;
    };
  }, [mounted, isAuthenticated, accessToken, compareIds]);

  // ==========================================================
  // ساخت آیتم‌های مقایسه از supplies و compareIds
  // ==========================================================

  const comparisonItems = useMemo(() => {
    const items: ComparisonItem[] = [];
    const idSet = new Set(compareIds);

    for (const supply of supplies) {
      if (!idSet.has(supply.id)) continue;

      const images = (supply.images || [])
        .map((img) => resolveMediaUrl(img.image))
        .filter(Boolean);

      items.push({
        productId: supply.id,
        title: supply.title,
        description: supply.description || EMPTY,
        provider: supply.seller_name || 'نامشخص',
        price: supply.price ?? null,
        trl: supply.trl ?? null,
        mrl: null, // MRL در supply وجود ندارد
        industry: supply.industry || EMPTY,
        category: supply.category || 'محصول',
        supplyType: getSupplyType(supply.category),
        viewCount: supply.view_count || 0,
        createdAt: supply.created_at || '',
        images,
      });
    }

    // مرتب‌سازی بر اساس ترتیب انتخاب کاربر
    const ordered: ComparisonItem[] = [];
    for (const id of compareIds) {
      const found = items.find((item) => item.productId === id);
      if (found) ordered.push(found);
    }

    return ordered;
  }, [supplies, compareIds]);

  // ==========================================================
  // Actions
  // ==========================================================

  const removeItem = useCallback(
    (productId: number) => {
      setCompareIds((prev) => prev.filter((id) => id !== productId));
    },
    []
  );

  const clearAll = useCallback(() => {
    setCompareIds([]);
  }, []);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ==========================================================
  // Statistics
  // ==========================================================

  const statistics = useMemo(() => {
    const percentages = comparisonItems
      .map((item) => {
        // تخمین درصد تطابق بر اساس TRL و قیمت (فقط برای نمایش)
        let score = 50;
        const trl = Number(item.trl);
        if (trl >= 8) score += 20;
        else if (trl >= 6) score += 10;
        const price = Number(item.price);
        if (price > 0 && price < 100000000) score += 15;
        else if (price >= 100000000 && price < 500000000) score += 5;
        return Math.min(100, Math.max(0, score));
      })
      .filter((value): value is number => value !== null);

    const prices = comparisonItems
      .map((item) => Number(item.price))
      .filter((value) => Number.isFinite(value) && value >= 0);

    return {
      count: comparisonItems.length,
      highestMatch: percentages.length ? Math.max(...percentages) : null,
      averageMatch: percentages.length
        ? Math.round(percentages.reduce((s, v) => s + v, 0) / percentages.length)
        : null,
      lowestPrice: prices.length ? Math.min(...prices) : null,
    };
  }, [comparisonItems]);

  // ==========================================================
  // Table rows
  // ==========================================================

  const rows = useMemo(
    () => [
      {
        key: 'type',
        label: 'نوع',
        icon: Package,
        value: (item: ComparisonItem) =>
          item.supplyType === 'service' ? 'خدمت' : 'محصول',
      },
      {
        key: 'industry',
        label: 'صنعت',
        icon: Building2,
        value: (item: ComparisonItem) => item.industry,
      },
      {
        key: 'price',
        label: 'قیمت',
        icon: DollarSign,
        value: (item: ComparisonItem) => formatPrice(item.price),
      },
      {
        key: 'trl',
        label: 'TRL',
        icon: Zap,
        value: (item: ComparisonItem) =>
          item.trl !== null && item.trl !== '' ? `${formatNumber(item.trl)}/۹` : EMPTY,
      },
      {
        key: 'viewCount',
        label: 'بازدید',
        icon: Eye,
        value: (item: ComparisonItem) => formatNumber(item.viewCount),
      },
      {
        key: 'description',
        label: 'توضیحات',
        icon: FileText,
        expandable: true,
        value: (item: ComparisonItem) => item.description || EMPTY,
      },
      {
        key: 'created',
        label: 'تاریخ ثبت',
        icon: Clock3,
        value: (item: ComparisonItem) => formatDate(item.createdAt),
      },
    ],
    []
  );

  // ==========================================================
  // Loading
  // ==========================================================

  if (!mounted || isLoading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6"
      >
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-[#14B8A6] animate-spin" />
          <p className="text-sm font-bold text-slate-700">در حال دریافت اطلاعات...</p>
          <p className="text-xs text-slate-500 mt-2">اطلاعات از عرضه‌های ثبت‌شده دریافت می‌شوند.</p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // Authentication
  // ==========================================================

  if (!isAuthenticated) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <TriangleAlert size={48} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-3">ورود به سامانه</h1>
          <p className="text-sm text-slate-500 leading-7 mb-6">
            برای مشاهده مقایسه محصولات ابتدا وارد حساب کاربری شوید.
          </p>
          <Link
            href="/login?next=%2Fcompare"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold"
          >
            ورود
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================================
  // Empty
  // ==========================================================

  if (compareIds.length === 0 || comparisonItems.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link
              href="/market"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#1E3A8A]"
            >
              <ArrowRight size={17} />
              بازگشت به بازار
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <Scale size={48} className="mx-auto text-slate-300 mb-4" />
            <h1 className="text-xl font-black text-slate-800 mb-3">موردی برای مقایسه وجود ندارد</h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-7">
              ابتدا در بازار محصولات را انتخاب کنید و سپس به بخش مقایسه بروید.
            </p>
            {error && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                {error}
              </div>
            )}
            <Link
              href="/market"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-sm font-bold"
            >
              رفتن به بازار
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // Main
  // ==========================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E3A8A]/10">
                <Scale size={23} className="text-[#1E3A8A]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">مقایسه راهکارها</h1>
                <p className="text-sm text-slate-500 mt-1">مقایسه مستقیم محصولات و خدمات انتخاب‌شده</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">{comparisonItems.length} مورد انتخاب شده</span>
            <Link
              href="/market"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <ArrowRight size={16} />
              بازگشت
            </Link>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              <Trash2 size={16} />
              حذف همه
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={19} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-6">{error}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">تعداد انتخاب‌ها</p>
            <p className="text-2xl font-black text-[#1E3A8A]">{comparisonItems.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">بالاترین انطباق (تخمینی)</p>
            <p className="text-2xl font-black text-[#14B8A6]">
              {statistics.highestMatch !== null ? `${statistics.highestMatch}%` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">پایین‌ترین قیمت</p>
            <p className="text-lg font-black text-slate-800">
              {statistics.lowestPrice !== null ? formatPrice(statistics.lowestPrice) : '—'}
            </p>
          </div>
        </div>

        {/* Charts */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3 size={21} className="text-[#1E3A8A]" />
                نمودار مقایسه
              </h2>
              <p className="text-xs text-slate-500 mt-1">بر اساس اطلاعات واقعی عرضه‌های ثبت‌شده</p>
            </div>
          </div>

          {/* TRL Chart */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={18} className="text-[#1E3A8A]" />
              <h3 className="text-sm font-black text-slate-800">مقایسه TRL</h3>
            </div>
            <div className="space-y-4">
              {comparisonItems.map((item, index) => {
                const numeric = Number(item.trl);
                const value = Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
                const width = value === null ? 0 : Math.max(0, Math.min((value / 9) * 100, 100));
                const color = CHART_COLORS[index % CHART_COLORS.length];

                return (
                  <div key={`trl-${item.productId}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-slate-700 truncate" style={{ color }} title={item.title}>
                        {item.title}
                      </span>
                      <span className="text-xs font-black text-slate-700">
                        {value !== null ? `${formatNumber(value)}/۹` : '—'}
                      </span>
                    </div>
                    <div className="h-6 rounded-full bg-white border border-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${width}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Chart */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 mt-5">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign size={18} className="text-[#D4A547]" />
              <h3 className="text-sm font-black text-slate-800">مقایسه قیمت</h3>
            </div>
            {(() => {
              const prices = comparisonItems
                .map((item) => Number(item.price))
                .filter((value) => Number.isFinite(value) && value >= 0);
              const maxPrice = prices.length ? Math.max(...prices) : 0;

              return (
                <div className="space-y-4">
                  {comparisonItems.map((item, index) => {
                    const numeric = Number(item.price);
                    const value = Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
                    const width = value === null || maxPrice <= 0 ? 0 : Math.max(0, Math.min((value / maxPrice) * 100, 100));
                    const color = CHART_COLORS[(index + 2) % CHART_COLORS.length];

                    return (
                      <div key={`price-${item.productId}`}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-xs font-bold text-slate-700 truncate" style={{ color }} title={item.title}>
                            {item.title}
                          </span>
                          <span className="text-xs font-black text-slate-700 whitespace-nowrap">
                            {value !== null ? formatPrice(value) : '—'}
                          </span>
                        </div>
                        <div className="h-7 rounded-full bg-white border border-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${width}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!prices.length && (
                    <div className="text-center py-5 text-xs text-slate-500">
                      برای گزینه‌های انتخاب‌شده قیمت عددی ثبت نشده است.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">جدول مقایسه</h2>
              <p className="text-xs text-slate-500 mt-1">هر ستون مربوط به یک محصول منحصربه‌فرد است.</p>
            </div>
            <BarChart3 size={21} className="text-[#1E3A8A]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky right-0 z-20 bg-slate-50 p-4 text-right min-w-[150px] text-sm font-black text-slate-700">
                    ویژگی
                  </th>
                  {comparisonItems.map((item, index) => {
                    const color = CHART_COLORS[index % CHART_COLORS.length];
                    return (
                      <th key={item.productId} className="p-4 text-center min-w-[200px] align-top">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Package size={22} style={{ color }} />
                          </div>
                          <p className="text-sm font-black text-slate-900 leading-6">{item.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1">#{item.productId}</p>
                          <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700">
                            {item.supplyType === 'service' ? 'خدمت' : 'محصول'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                          >
                            <X size={13} />
                            حذف
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <tr key={row.key}>
                      <td className="sticky right-0 z-10 bg-white p-4 align-top">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Icon size={15} className="text-slate-400" />
                          {row.label}
                        </div>
                      </td>
                      {comparisonItems.map((item) => {
                        const value = row.value(item);
                        const cellKey = `${item.productId}-${row.key}`;
                        const expanded = Boolean(expandedRows[cellKey]);
                        const longText = Boolean(row.expandable) && String(value).length > 100;

                        return (
                          <td key={cellKey} className="p-4 text-center align-top text-xs text-slate-700">
                            <div
                              className={
                                longText && !expanded
                                  ? 'max-h-14 overflow-hidden leading-6'
                                  : 'leading-6 whitespace-pre-line'
                              }
                            >
                              {value}
                            </div>
                            {longText && (
                              <button
                                type="button"
                                onClick={() => toggleRow(cellKey)}
                                className="mt-2 text-[11px] font-bold text-[#1E3A8A]"
                              >
                                {expanded ? 'بستن' : 'نمایش کامل'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}