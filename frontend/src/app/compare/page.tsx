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
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  Zap,
} from 'lucide-react';

import {
  API_URL,
  authenticatedFetch,
  useAuthStore,
} from '@/store/auth-store';

// ============================================================
// Types
// ============================================================

interface CompareItem {
  productId: number;
  matchId: number;
  needId: number;
}

interface MatchResultApi {
  id: number;
  need: number;

  product: number | null;
  product_title?: string | null;
  product_description?: string | null;
  product_price?: number | string | null;
  product_trl?: number | string | null;
  product_mrl?: number | string | null;
  product_industry?: string | null;
  product_category?: string | null;

  provider?: string | null;

  score?: number | string | null;
  match_percentage?: number | string | null;

  reason?: string | null;
  recommended_actions?: string | null;

  created_at?: string | null;
}

interface MatchResultListResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: MatchResultApi[];
}

interface ComparisonItem {
  productId: number;
  matchId: number;
  needId: number;

  entityType: 'product';
  entityId: number;

  title: string;
  description: string;
  provider: string;

  price: number | string | null;
  trl: number | string | null;
  mrl: number | string | null;

  industry: string;
  category: string;

  score: number | string | null;
  matchPercentage: number | string | null;

  reason: string;
  recommendedActions: string;

  createdAt: string;
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

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    const numeric = Number(value);

    return Number.isInteger(numeric) && numeric > 0
      ? numeric
      : null;
  }

  return null;
}

function normalizeArrayResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as MatchResultListResponse).results)
  ) {
    return ((data as MatchResultListResponse).results || []) as T[];
  }

  return [];
}

function getNextUrl(data: unknown): string | null {
  if (
    data &&
    typeof data === 'object' &&
    typeof (data as MatchResultListResponse).next === 'string'
  ) {
    return (data as MatchResultListResponse).next as string;
  }

  return null;
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
    return EMPTY;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return `${new Intl.NumberFormat('fa-IR').format(
    Math.round(numeric)
  )} تومان`;
}

function normalizePercentage(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric >= 0 && numeric <= 1) {
    return Math.round(numeric * 100);
  }

  if (numeric >= 0 && numeric <= 100) {
    return Math.round(numeric);
  }

  return null;
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

function getMatchPercentage(
  item: ComparisonItem
): number | null {
  return normalizePercentage(
    item.matchPercentage ?? item.score
  );
}

function getMatchClass(
  percentage: number | null
): string {
  if (percentage === null) {
    return 'bg-slate-100 text-slate-600';
  }

  if (percentage >= 90) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (percentage >= 75) {
    return 'bg-[#14B8A6]/10 text-[#0F766E]';
  }

  if (percentage >= 60) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-red-100 text-red-700';
}

function getMatchTextClass(
  percentage: number | null
): string {
  if (percentage === null) {
    return 'text-slate-500';
  }

  if (percentage >= 90) {
    return 'text-emerald-600';
  }

  if (percentage >= 75) {
    return 'text-[#0F766E]';
  }

  if (percentage >= 60) {
    return 'text-amber-600';
  }

  return 'text-red-600';
}

// ============================================================
// MatchResult -> ComparisonItem
// ============================================================

function normalizeMatchResult(
  match: MatchResultApi,
  selectedProductId: number
): ComparisonItem | null {
  const matchId = parsePositiveInteger(match.id);
  const needId = parsePositiveInteger(match.need);
  const productId = parsePositiveInteger(match.product);

  if (
    matchId === null ||
    needId === null ||
    productId === null
  ) {
    return null;
  }

  return {
    productId: selectedProductId || productId,
    matchId,
    needId,

    entityType: 'product',
    entityId: productId,

    title:
      match.product_title ||
      `محصول شماره ${formatNumber(productId)}`,

    description:
      match.product_description || EMPTY,

    provider:
      match.provider || EMPTY,

    price:
      match.product_price ?? null,

    trl:
      match.product_trl ?? null,

    mrl:
      match.product_mrl ?? null,

    industry:
      match.product_industry || EMPTY,

    category:
      match.product_category || 'محصول',

    score:
      match.score ?? null,

    matchPercentage:
      match.match_percentage ?? match.score ?? null,

    reason:
      match.reason || '',

    recommendedActions:
      match.recommended_actions || '',

    createdAt:
      match.created_at || '',
  };
}

// ============================================================
// API
// ============================================================

async function fetchAllMatchResults(): Promise<MatchResultApi[]> {
  const allResults: MatchResultApi[] = [];

  let requestUrl = buildApiUrl('/matching/results/');

  const visitedUrls = new Set<string>();

  while (requestUrl && !visitedUrls.has(requestUrl)) {
    visitedUrls.add(requestUrl);

    const response = await authenticatedFetch(requestUrl, {
      method: 'GET',
    });

    const responseText = await response.text();

    let data: unknown = {};

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        'پاسخ دریافتی از سرور معتبر نیست.'
      );
    }

    if (response.status === 401) {
      throw new Error(
        'نشست کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.'
      );
    }

    if (response.status === 403) {
      throw new Error(
        'شما اجازه مشاهده نتایج تطبیق را ندارید.'
      );
    }

    if (!response.ok) {
      const detail =
        data &&
        typeof data === 'object' &&
        'detail' in data
          ? String(
              (data as { detail?: unknown }).detail || ''
            )
          : '';

      throw new Error(
        detail ||
          `خطا در دریافت نتایج تطبیق (${response.status})`
      );
    }

    const results =
      normalizeArrayResponse<MatchResultApi>(data);

    allResults.push(...results);

    const next = getNextUrl(data);

    if (!next) {
      break;
    }

    requestUrl = next;
  }

  return allResults;
}

// ============================================================
// Page
// ============================================================

export default function ComparePage() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const [mounted, setMounted] = useState(false);

  const [compareItems, setCompareItems] =
    useState<CompareItem[]>([]);

  const [items, setItems] =
    useState<ComparisonItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [expandedRows, setExpandedRows] =
    useState<Record<string, boolean>>({});

  // ==========================================================
  // Mount + localStorage
  // ==========================================================

  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(
        COMPARE_STORAGE_KEY
      );

      if (!saved) {
        setCompareItems([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        localStorage.removeItem(
          COMPARE_STORAGE_KEY
        );

        setCompareItems([]);
        return;
      }

      const validItems: CompareItem[] = parsed
        .filter(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            Number.isInteger(item.productId) &&
            Number.isInteger(item.matchId) &&
            Number.isInteger(item.needId)
        )
        .map((item) => ({
          productId: Number(item.productId),
          matchId: Number(item.matchId),
          needId: Number(item.needId),
        }));

      // حذف تکراری‌ها بر اساس matchId
      const uniqueMap =
        new Map<number, CompareItem>();

      for (const item of validItems) {
        if (!uniqueMap.has(item.matchId)) {
          uniqueMap.set(item.matchId, item);
        }
      }

      const uniqueItems =
        Array.from(uniqueMap.values()).slice(
          0,
          MAX_COMPARE_ITEMS
        );

      setCompareItems(uniqueItems);

      if (
        uniqueItems.length !== validItems.length
      ) {
        localStorage.setItem(
          COMPARE_STORAGE_KEY,
          JSON.stringify(uniqueItems)
        );
      }
    } catch (storageError) {
      console.error(
        '❌ خطا در خواندن compareList:',
        storageError
      );

      localStorage.removeItem(
        COMPARE_STORAGE_KEY
      );

      setCompareItems([]);
    }
  }, []);

  // ==========================================================
  // Load comparison data
  // ==========================================================

  const loadComparisonData = useCallback(
    async (selectedItems: CompareItem[]) => {
      if (selectedItems.length === 0) {
        setItems([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated) {
        setItems([]);
        setError(
          'برای مشاهده مقایسه باید وارد حساب کاربری شوید.'
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        /*
         * مهم:
         * کل نتایج Matching را دریافت می‌کنیم و سپس
         * فقط matchIdهای انتخاب‌شده را جدا می‌کنیم.
         *
         * همچنین pagination دنبال می‌شود تا اگر نتیجه
         * در صفحه اول نبود، Compare آن را از دست ندهد.
         */
        const results =
          await fetchAllMatchResults();

        const selectedByMatchId =
          new Map<number, CompareItem>();

        for (const selected of selectedItems) {
          selectedByMatchId.set(
            selected.matchId,
            selected
          );
        }

        const normalizedItems: ComparisonItem[] = [];

        /*
         * برای هر MatchResult دقیقاً بررسی می‌کنیم
         * که آیا توسط کاربر انتخاب شده یا خیر.
         */
        for (const match of results) {
          const matchId =
            parsePositiveInteger(match.id);

          if (matchId === null) {
            continue;
          }

          const selected =
            selectedByMatchId.get(matchId);

          if (!selected) {
            continue;
          }

          const normalized =
            normalizeMatchResult(
              match,
              selected.productId
            );

          if (!normalized) {
            continue;
          }

          /*
           * needId از localStorage به عنوان مقدار
           * انتخاب‌شده حفظ می‌شود.
           */
          normalized.needId =
            selected.needId;

          normalizedItems.push(normalized);
        }

        /*
         * جلوگیری از تکرار یک محصول در Compare.
         * اگر به هر دلیل چند MatchResult برای یک محصول
         * انتخاب شده باشد، بهترین درصد تطبیق نگه داشته می‌شود.
         */
        const productMap =
          new Map<number, ComparisonItem>();

        for (const item of normalizedItems) {
          const existing =
            productMap.get(item.productId);

          if (!existing) {
            productMap.set(
              item.productId,
              item
            );
            continue;
          }

          const oldPercentage =
            getMatchPercentage(existing);

          const newPercentage =
            getMatchPercentage(item);

          if (
            newPercentage !== null &&
            (
              oldPercentage === null ||
              newPercentage > oldPercentage
            )
          ) {
            productMap.set(
              item.productId,
              item
            );
          }
        }

        /*
         * ترتیب نهایی مطابق ترتیب انتخاب کاربر.
         */
        const orderedItems: ComparisonItem[] = [];

        for (const selected of selectedItems) {
          const found =
            productMap.get(selected.productId);

          if (!found) {
            continue;
          }

          orderedItems.push(found);
          productMap.delete(
            selected.productId
          );
        }

        /*
         * موارد باقی‌مانده را نیز اضافه می‌کنیم.
         */
        for (const remaining of productMap.values()) {
          orderedItems.push(remaining);
        }

        setItems(orderedItems);

        /*
         * مواردی که دیگر در API وجود ندارند،
         * از compareList حذف می‌شوند.
         */
        if (
          orderedItems.length !==
          selectedItems.length
        ) {
          const validMatchIds =
            new Set(
              orderedItems.map(
                (item) => item.matchId
              )
            );

          const updatedCompareItems =
            selectedItems.filter(
              (item) =>
                validMatchIds.has(item.matchId)
            );

          setCompareItems(
            updatedCompareItems
          );

          localStorage.setItem(
            COMPARE_STORAGE_KEY,
            JSON.stringify(
              updatedCompareItems
            )
          );
        }

        if (orderedItems.length === 0) {
          setError(
            'گزینه‌های انتخاب‌شده در نتایج فعلی تطبیق موجود نیستند.'
          );
        }
      } catch (fetchError) {
        console.error(
          '❌ خطا در بارگذاری مقایسه:',
          fetchError
        );

        setItems([]);

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'خطا در دریافت اطلاعات مقایسه.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

    loadComparisonData(compareItems);
  }, [
    mounted,
    compareItems,
    loadComparisonData,
  ]);

  // ==========================================================
  // Actions
  // ==========================================================

  const removeItem = useCallback(
    (productId: number) => {
      setCompareItems((prev) => {
        const next = prev.filter(
          (item) =>
            item.productId !== productId
        );

        try {
          localStorage.setItem(
            COMPARE_STORAGE_KEY,
            JSON.stringify(next)
          );
        } catch (storageError) {
          console.error(
            '❌ خطا در ذخیره compareList:',
            storageError
          );
        }

        return next;
      });

      setItems((prev) =>
        prev.filter(
          (item) =>
            item.productId !== productId
        )
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    setCompareItems([]);
    setItems([]);
    setError(null);

    try {
      localStorage.removeItem(
        COMPARE_STORAGE_KEY
      );
    } catch (storageError) {
      console.error(
        '❌ خطا در حذف compareList:',
        storageError
      );
    }
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
    const percentages = items
      .map(getMatchPercentage)
      .filter(
        (value): value is number =>
          value !== null
      );

    const prices = items
      .map((item) => Number(item.price))
      .filter(
        (value) =>
          Number.isFinite(value) &&
          value >= 0
      );

    return {
      count: items.length,

      highestMatch:
        percentages.length
          ? Math.max(...percentages)
          : null,

      averageMatch:
        percentages.length
          ? Math.round(
              percentages.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
                percentages.length
            )
          : null,

      lowestPrice:
        prices.length
          ? Math.min(...prices)
          : null,
    };
  }, [items]);

  // ==========================================================
  // Table rows
  // ==========================================================

  const rows = useMemo(
    () => [
    //  {        key: 'provider',        label: 'ارائه‌دهنده',        icon: Building2,        value: (item: ComparisonItem) =>          item.provider,      },

      {
        key: 'type',
        label: 'نوع',
        icon: Package,
        value: (item: ComparisonItem) =>
          item.category || 'محصول',
      },

      {
        key: 'industry',
        label: 'صنعت',
        icon: Building2,
        value: (item: ComparisonItem) =>
          item.industry,
      },

      {
        key: 'price',
        label: 'قیمت',
        icon: DollarSign,
        value: (item: ComparisonItem) =>
          formatPrice(item.price),
      },

      {
        key: 'trl',
        label: 'TRL',
        icon: Zap,
        value: (item: ComparisonItem) =>
          item.trl !== null &&
          item.trl !== undefined &&
          item.trl !== ''
            ? `${formatNumber(item.trl)}/۹`
            : EMPTY,
      },

      {
        key: 'mrl',
        label: 'MRL',
        icon: CheckCircle2,
        value: (item: ComparisonItem) =>
          item.mrl !== null &&
          item.mrl !== undefined &&
          item.mrl !== ''
            ? `${formatNumber(item.mrl)}/۹`
            : 'ثبت نشده',
      },

      {
        key: 'match',
        label: 'درصد انطباق',
        icon: Sparkles,
        value: (item: ComparisonItem) => {
          const percentage =
            getMatchPercentage(item);

          return percentage !== null
            ? `${formatNumber(
                percentage
              )}٪`
            : 'ثبت نشده';
        },
      },

      {
        key: 'description',
        label: 'توضیحات',
        icon: FileText,
        expandable: true,
        value: (item: ComparisonItem) =>
          item.description ||
          EMPTY,
      },

      {
        key: 'reason',
        label: 'دلیل پیشنهاد',
        icon: Sparkles,
        expandable: true,
        value: (item: ComparisonItem) =>
          item.reason ||
          'برای این نتیجه ثبت نشده است.',
      },

      {
        key: 'recommended-actions',
        label: 'اقدام پیشنهادی',
        icon: Zap,
        expandable: true,
        value: (item: ComparisonItem) =>
          item.recommendedActions ||
          'برای این نتیجه ثبت نشده است.',
      },

      {
        key: 'created',
        label: 'تاریخ نتیجه',
        icon: Clock3,
        value: (item: ComparisonItem) =>
          formatDate(item.createdAt),
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
          <Loader2
            size={48}
            className="mx-auto mb-4 text-[#14B8A6] animate-spin"
          />

          <p className="text-sm font-bold text-slate-700">
            در حال دریافت اطلاعات واقعی مقایسه...
          </p>

          <p className="text-xs text-slate-500 mt-2">
            اطلاعات مستقیماً از نتایج تطبیق دریافت می‌شوند.
          </p>
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
          <TriangleAlert
            size={48}
            className="mx-auto text-amber-500 mb-4"
          />

          <h1 className="text-xl font-black text-slate-900 mb-3">
            ورود به سامانه
          </h1>

          <p className="text-sm text-slate-500 leading-7 mb-6">
            برای مشاهده مقایسه راهکارهای واقعی
            ابتدا وارد حساب کاربری شوید.
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

  if (items.length === 0) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link
              href="/matching"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#1E3A8A]"
            >
              <ArrowRight size={17} />
              بازگشت به تطبیق
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <BarChart3
              size={48}
              className="mx-auto text-slate-300 mb-4"
            />

            <h1 className="text-xl font-black text-slate-800 mb-3">
              موردی برای مقایسه وجود ندارد
            </h1>

            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-7">
              ابتدا در صفحه تطبیق راهکارها را
              انتخاب کنید و سپس وارد بخش مقایسه شوید.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                {error}
              </div>
            )}

            <Link
              href="/matching"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-sm font-bold"
            >
              انتخاب راهکار
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // Main
  // ==========================================================

  const firstNeedId =
    items.length > 0
      ? items[0].needId
      : null;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">

        {/* ==================================================
            Header
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E3A8A]/10">
                <Scale
                  size={23}
                  className="text-[#1E3A8A]"
                />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  مقایسه راهکارها
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  مقایسه مستقیم نتایج واقعی انتخاب‌شده
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">
              {formatNumber(
                statistics.count
              )}{' '}
              مورد انتخاب شده
            </span>

            <Link
              href={
                firstNeedId
                  ? `/matching/${firstNeedId}`
                  : '/matching'
              }
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

        {/* ==================================================
            Error
        ================================================== */}

        {error && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={19}
                className="text-amber-600 mt-0.5 flex-shrink-0"
              />

              <p className="text-xs text-amber-700 leading-6">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            Summary
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">
              تعداد انتخاب‌ها
            </p>

            <p className="text-2xl font-black text-[#1E3A8A]">
              {formatNumber(
                statistics.count
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">
              بالاترین انطباق
            </p>

            <p className="text-2xl font-black text-[#14B8A6]">
              {statistics.highestMatch !==
              null
                ? `${formatNumber(
                    statistics.highestMatch
                  )}٪`
                : '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">
              پایین‌ترین قیمت
            </p>

            <p className="text-lg font-black text-slate-800">
              {statistics.lowestPrice !==
              null
                ? formatPrice(
                    statistics.lowestPrice
                  )
                : '—'}
            </p>
          </div>

        </div>

        {/* ==================================================
            Charts
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 mb-6">

          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart3
                  size={21}
                  className="text-[#1E3A8A]"
                />
                نمودار مقایسه
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                نمودارها فقط بر اساس مقادیر واقعی موجود
                در نتایج انتخاب‌شده ساخته شده‌اند.
              </p>
            </div>
          </div>

          {/* Match */}

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 mb-5">

            <div className="flex items-center gap-2 mb-5">
              <Sparkles
                size={18}
                className="text-[#14B8A6]"
              />

              <h3 className="text-sm font-black text-slate-800">
                درصد انطباق
              </h3>
            </div>

            <div className="space-y-4">
              {items.map(
                (item, index) => {
                  const value =
                    getMatchPercentage(
                      item
                    );

                  const width =
                    value === null
                      ? 0
                      : Math.max(
                          0,
                          Math.min(
                            value,
                            100
                          )
                        );

                  const color =
                    CHART_COLORS[
                      index %
                        CHART_COLORS.length
                    ];

                  return (
                    <div
                      key={`match-chart-${item.matchId}`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">

                        <span
                          className="text-xs font-bold text-slate-700 truncate"
                          title={item.title}
                          style={{
                            color,
                          }}
                        >
                          {item.title}
                        </span>

                        <span
                          className={`text-xs font-black ${getMatchTextClass(
                            value
                          )}`}
                        >
                          {value !== null
                            ? `${formatNumber(
                                value
                              )}٪`
                            : '—'}
                        </span>

                      </div>

                      <div className="h-7 rounded-full bg-white border border-slate-200 overflow-hidden">

                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${width}%`,
                            backgroundColor:
                              color,
                          }}
                        />

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* TRL + MRL */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* TRL */}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">

              <div className="flex items-center gap-2 mb-5">
                <Zap
                  size={18}
                  className="text-[#1E3A8A]"
                />

                <h3 className="text-sm font-black text-slate-800">
                  مقایسه TRL
                </h3>
              </div>

              <div className="space-y-4">

                {items.map(
                  (item, index) => {
                    const numeric =
                      Number(item.trl);

                    const value =
                      Number.isFinite(
                        numeric
                      ) &&
                      numeric >= 0
                        ? numeric
                        : null;

                    const width =
                      value === null
                        ? 0
                        : Math.max(
                            0,
                            Math.min(
                              value *
                                (100 / 9),
                              100
                            )
                          );

                    const color =
                      CHART_COLORS[
                        (index + 2) %
                          CHART_COLORS.length
                      ];

                    return (
                      <div
                        key={`trl-chart-${item.matchId}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">

                          <span
                            className="text-xs font-bold text-slate-700 truncate"
                            title={item.title}
                            style={{
                              color,
                            }}
                          >
                            {item.title}
                          </span>

                          <span className="text-xs font-black text-slate-700">
                            {value !== null
                              ? `${formatNumber(
                                  value
                                )}/۹`
                              : '—'}
                          </span>

                        </div>

                        <div className="h-6 rounded-full bg-white border border-slate-200 overflow-hidden">

                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${width}%`,
                              backgroundColor:
                                color,
                            }}
                          />

                        </div>
                      </div>
                    );
                  }
                )}

              </div>
            </div>

            {/* MRL */}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">

              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2
                  size={18}
                  className="text-[#14B8A6]"
                />

                <h3 className="text-sm font-black text-slate-800">
                  مقایسه MRL
                </h3>
              </div>

              <div className="space-y-4">

                {items.map(
                  (item, index) => {
                    const numeric =
                      Number(item.mrl);

                    const value =
                      Number.isFinite(
                        numeric
                      ) &&
                      numeric >= 0
                        ? numeric
                        : null;

                    const width =
                      value === null
                        ? 0
                        : Math.max(
                            0,
                            Math.min(
                              value *
                                (100 / 9),
                              100
                            )
                          );

                    const color =
                      CHART_COLORS[
                        (index + 4) %
                          CHART_COLORS.length
                      ];

                    return (
                      <div
                        key={`mrl-chart-${item.matchId}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">

                          <span
                            className="text-xs font-bold text-slate-700 truncate"
                            title={item.title}
                            style={{
                              color,
                            }}
                          >
                            {item.title}
                          </span>

                          <span className="text-xs font-black text-slate-700">
                            {value !== null
                              ? `${formatNumber(
                                  value
                                )}/۹`
                              : '—'}
                          </span>

                        </div>

                        <div className="h-6 rounded-full bg-white border border-slate-200 overflow-hidden">

                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${width}%`,
                              backgroundColor:
                                color,
                            }}
                          />

                        </div>
                      </div>
                    );
                  }
                )}

              </div>
            </div>
          </div>

          {/* Price */}

          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 mt-5">

            <div className="flex items-center gap-2 mb-5">
              <DollarSign
                size={18}
                className="text-[#D4A547]"
              />

              <h3 className="text-sm font-black text-slate-800">
                مقایسه قیمت
              </h3>
            </div>

            {(() => {
              const prices = items
                .map((item) =>
                  Number(item.price)
                )
                .filter(
                  (value) =>
                    Number.isFinite(
                      value
                    ) &&
                    value >= 0
                );

              const maxPrice =
                prices.length
                  ? Math.max(
                      ...prices
                    )
                  : 0;

              return (
                <div className="space-y-4">

                  {items.map(
                    (item, index) => {
                      const numeric =
                        Number(
                          item.price
                        );

                      const value =
                        Number.isFinite(
                          numeric
                        ) &&
                        numeric >= 0
                          ? numeric
                          : null;

                      const width =
                        value === null ||
                        maxPrice <= 0
                          ? 0
                          : Math.max(
                              0,
                              Math.min(
                                (value /
                                  maxPrice) *
                                  100,
                                100
                              )
                            );

                      const color =
                        CHART_COLORS[
                          (index + 6) %
                            CHART_COLORS.length
                        ];

                      return (
                        <div
                          key={`price-chart-${item.matchId}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">

                            <span
                              className="text-xs font-bold text-slate-700 truncate"
                              title={
                                item.title
                              }
                              style={{
                                color,
                              }}
                            >
                              {item.title}
                            </span>

                            <span className="text-xs font-black text-slate-700 whitespace-nowrap">
                              {value !==
                              null
                                ? formatPrice(
                                    value
                                  )
                                : '—'}
                            </span>

                          </div>

                          <div className="h-7 rounded-full bg-white border border-slate-200 overflow-hidden">

                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${width}%`,
                                backgroundColor:
                                  color,
                              }}
                            />

                          </div>
                        </div>
                      );
                    }
                  )}

                  {!prices.length && (
                    <div className="text-center py-5 text-xs text-slate-500">
                      برای گزینه‌های انتخاب‌شده
                      قیمت عددی ثبت نشده است.
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        </section>

        {/* ==================================================
            Table
        ================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">

            <div>
              <h2 className="text-lg font-black text-slate-900">
                جدول مقایسه
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                هر ستون مربوط به یک محصول منحصربه‌فرد است.
              </p>
            </div>

            <BarChart3
              size={21}
              className="text-[#1E3A8A]"
            />

          </div>

          <div className="overflow-x-auto">

            <table className="w-full border-collapse min-w-[900px]">

              <thead>

                <tr className="bg-slate-50 border-b border-slate-200">

                  <th className="sticky right-0 z-20 bg-slate-50 p-4 text-right min-w-[190px] text-sm font-black text-slate-700">
                    ویژگی
                  </th>

                  {items.map(
                    (item, index) => {
                      const percentage =
                        getMatchPercentage(
                          item
                        );

                      const headerColor =
                        CHART_COLORS[
                          index %
                            CHART_COLORS.length
                        ];

                      return (
                        <th
                          key={item.matchId}
                          className="p-4 text-center min-w-[235px] align-top"
                        >

                          <div className="flex flex-col items-center">

                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                              style={{
                                backgroundColor: `${headerColor}20`,
                              }}
                            >
                              <Package
                                size={22}
                                style={{
                                  color:
                                    headerColor,
                                }}
                              />
                            </div>

                            <p className="text-sm font-black text-slate-900 leading-6">
                              {item.title}
                            </p>

                            <p className="text-[11px] text-slate-400 mt-1">
                              Product #
                              {formatNumber(
                                item.entityId
                              )}
                            </p>

                            {percentage !==
                              null && (
                              <span
                                className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${getMatchClass(
                                  percentage
                                )}`}
                              >
                                <Sparkles
                                  size={12}
                                />

                                {formatNumber(
                                  percentage
                                )}
                                ٪ انطباق
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  item.productId
                                )
                              }
                              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                            >
                              <X size={13} />
                              حذف
                            </button>

                          </div>
                        </th>
                      );
                    }
                  )}

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {rows.map(
                  (row) => {
                    const Icon =
                      row.icon;

                    return (
                      <tr
                        key={row.key}
                      >

                        <td className="sticky right-0 z-10 bg-white p-4 align-top">

                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">

                            <Icon
                              size={15}
                              className="text-slate-400"
                            />

                            {row.label}

                          </div>

                        </td>

                        {items.map(
                          (item) => {
                            const value =
                              row.value(
                                item
                              );

                            const cellKey =
                              `${item.matchId}-${row.key}`;

                            const expanded =
                              Boolean(
                                expandedRows[
                                  cellKey
                                ]
                              );

                            const longText =
                              Boolean(
                                row.expandable
                              ) &&
                              String(
                                value
                              ).length >
                                120;

                            return (
                              <td
                                key={
                                  cellKey
                                }
                                className="p-4 text-center align-top text-xs text-slate-700"
                              >

                                <div
                                  className={
                                    longText &&
                                    !expanded
                                      ? 'max-h-14 overflow-hidden leading-6'
                                      : 'leading-6 whitespace-pre-line'
                                  }
                                >
                                  {value}
                                </div>

                                {longText && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleRow(
                                        cellKey
                                      )
                                    }
                                    className="mt-2 text-[11px] font-bold text-[#1E3A8A]"
                                  >
                                    {expanded
                                      ? 'بستن'
                                      : 'نمایش کامل'}
                                  </button>
                                )}

                              </td>
                            );
                          }
                        )}

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        </section>

        {/* ==================================================
            Footer
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-5">

          <div className="flex items-start gap-3">

            <CheckCircle2
              size={20}
              className="text-[#14B8A6] mt-0.5 flex-shrink-0"
            />

            <div>

              <h3 className="text-sm font-black text-slate-800">
                مقایسه بر اساس داده واقعی
              </h3>

              <p className="text-xs text-slate-600 mt-1 leading-7">
                اطلاعات جدول و نمودارها از نتایج واقعی
                تطبیق انتخاب‌شده دریافت شده‌اند.
                هیچ قیمت، امتیاز، زمان تحویل یا شاخص
                ساختگی در این صفحه تولید نمی‌شود.
              </p>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}