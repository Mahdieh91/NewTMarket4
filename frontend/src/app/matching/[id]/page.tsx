// src/app/matching/[id]/page.tsx

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Lightbulb,
  MessageSquareText,
  Shield,
  Clock,
  DollarSign,
  Building2,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  Heart,
  BarChart3,
  X,
  Sparkles,
  Package,
  Plus,
} from 'lucide-react';

import {
  authenticatedFetch,
  API_URL,
  useAuthStore,
} from '@/store/auth-store';

/* ============================================================
   Types
============================================================ */

interface MatchResult {
  id: number;
  need: number;
  product: number;
  product_title: string;
  product_description: string;
  provider: string;
  product_price: number | string | null;
  product_trl: number | null;
  product_mrl: number | null;
  product_industry: string | null;
  product_category: string;
  score: number;
  match_percentage: number;
  reason: string | null;
  recommended_actions: string | null;
  created_at: string;
}

interface ApiListResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: MatchResult[];
}

interface NeedSummary {
  id: number;
  title: string;
  description: string;
  industry: string;
  budget: string;
  timeline: string;
  status: string;
  confidentiality?: string;
  expected_outcome?: string;
  created_at?: string;
  updated_at?: string;
}

type SortOption = 'match' | 'price' | 'rating';
type RiskLevel = 'low' | 'medium' | 'high';

/* ============================================================
   Helpers
============================================================ */

const getNumericPrice = (
  price: number | string | null | undefined
): number => {
  if (price === null || price === undefined || price === '') {
    return Number.POSITIVE_INFINITY;
  }

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice)
    ? numericPrice
    : Number.POSITIVE_INFINITY;
};

const formatPrice = (
  price: number | string | null | undefined
): string => {
  if (price === null || price === undefined || price === '') {
    return 'اعلام نشده';
  }

  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return 'اعلام نشده';
  }

  return `${new Intl.NumberFormat('fa-IR').format(numericPrice)} تومان`;
};

const formatNumber = (
  value: number | null | undefined
): string => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return '—';
  }

  return new Intl.NumberFormat('fa-IR').format(Number(value));
};

const normalizeScore = (value: number): number => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric >= 0 && numeric <= 1) {
    return Math.round(numeric * 100);
  }

  return Math.round(
    Math.max(0, Math.min(100, numeric))
  );
};

const getMatchPercentage = (
  match: MatchResult
): number => {
  const apiPercentage = Number(match.match_percentage);

  if (
    Number.isFinite(apiPercentage) &&
    apiPercentage >= 0 &&
    apiPercentage <= 100
  ) {
    return Math.round(apiPercentage);
  }

  return normalizeScore(match.score);
};

const getMatchColor = (
  percentage: number
): string => {
  if (percentage >= 90) return 'text-emerald-600';
  if (percentage >= 75) return 'text-[#14B8A6]';
  if (percentage >= 60) return 'text-amber-600';

  return 'text-red-600';
};

const getRiskLevel = (
  percentage: number
): RiskLevel => {
  if (percentage >= 85) return 'low';
  if (percentage >= 65) return 'medium';

  return 'high';
};

const getRiskFromMatch = (
  match: MatchResult
): RiskLevel => {
  const actions = match.recommended_actions || '';

  if (
    actions.includes('ریسک بالا') ||
    actions.toLowerCase().includes('high')
  ) {
    return 'high';
  }

  if (
    actions.includes('ریسک متوسط') ||
    actions.toLowerCase().includes('medium')
  ) {
    return 'medium';
  }

  if (
    actions.includes('ریسک پایین') ||
    actions.toLowerCase().includes('low')
  ) {
    return 'low';
  }

  return getRiskLevel(
    getMatchPercentage(match)
  );
};

const displayValue = (
  value: unknown,
  fallback = 'اعلام نشده'
): string => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return fallback;
  }

  return String(value);
};

/* ============================================================
   داده‌های Mock برای مواقع ضروری
============================================================ */

const MOCK_MATCHES: MatchResult[] = [
  {
    id: 9991,
    need: 1,
    product: 101,
    product_title: 'سامانه هوشمند مدیریت انرژی کوره (Mock)',
    product_description: 'سیستم مبتنی بر هوش مصنوعی برای بهینه‌سازی مصرف انرژی در کوره‌های صنعتی.',
    provider: 'شرکت فناوری انرژی پارس',
    product_price: 450000000,
    product_trl: 8,
    product_mrl: 7,
    product_industry: 'پتروشیمی',
    product_category: 'product',
    score: 78,
    match_percentage: 78,
    reason: 'تطابق مفهومی در حوزه بهینه‌سازی انرژی و کنترل فرآیند',
    recommended_actions: 'ریسک متوسط - بررسی مستندات فنی و مذاکره قیمت',
    created_at: new Date().toISOString(),
  },
  {
    id: 9992,
    need: 1,
    product: 102,
    product_title: 'سامانه پایش و کنترل فرآیند (Mock)',
    product_description: 'راهکار جامع برای پایش آنلاین پارامترهای فرآیندی و کنترل خودکار واحدهای تولید.',
    provider: 'صنعت هوشمند آریا',
    product_price: 620000000,
    product_trl: 7,
    product_mrl: 6,
    product_industry: 'پتروشیمی',
    product_category: 'product',
    score: 65,
    match_percentage: 65,
    reason: 'تطابق در حوزه کنترل فرآیند، اما قیمت بالاتر از بودجه',
    recommended_actions: 'ریسک متوسط - مذاکره برای کاهش قیمت',
    created_at: new Date().toISOString(),
  },
  {
    id: 9993,
    need: 1,
    product: 103,
    product_title: 'خدمات مشاوره بهینه‌سازی انرژی (Mock)',
    product_description: 'ارائه خدمات مشاوره تخصصی در زمینه بهینه‌سازی مصرف انرژی در صنایع.',
    provider: 'مشاوران انرژی سبز',
    product_price: 180000000,
    product_trl: 9,
    product_mrl: 9,
    product_industry: 'پتروشیمی',
    product_category: 'service',
    score: 55,
    match_percentage: 55,
    reason: 'خدمات مشاوره با TRL بالا، مناسب برای فاز اولیه مطالعه',
    recommended_actions: 'ریسک پایین - مناسب برای شروع',
    created_at: new Date().toISOString(),
  },
];

/* ============================================================
   Component
============================================================ */

export default function MatchingPage() {
  const params = useParams();
  const router = useRouter();

  const needId = params?.id
    ? Number(params.id)
    : undefined;

  const user = useAuthStore(
    (state) => state.user
  );

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const [mounted, setMounted] =
    useState(false);

  const [matches, setMatches] =
    useState<MatchResult[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [sortBy, setSortBy] =
    useState<SortOption>('match');

  const [filterOpen, setFilterOpen] =
    useState(false);

  // فیلتر صنعت حذف شد
  const [trlFilter, setTrlFilter] =
    useState('all');

  const [priceFilter, setPriceFilter] =
    useState('all');

  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const [favorites, setFavorites] =
    useState<number[]>([]);

  const [compareList, setCompareList] =
    useState<number[]>([]);

  const [selectedMatch, setSelectedMatch] =
    useState<MatchResult | null>(null);

  const [isNegotiating, setIsNegotiating] =
    useState(false);

  const [negotiatingProductId, setNegotiatingProductId] =
    useState<number | null>(null);

  const [needSummary, setNeedSummary] =
    useState<NeedSummary | null>(null);

  /* ============================================================
     Mount
  ============================================================ */

  useEffect(() => {
    setMounted(true);

    try {
      const savedFavorites =
        localStorage.getItem(
          'matchingFavorites'
        );

      if (savedFavorites) {
        const parsed =
          JSON.parse(savedFavorites);

        if (Array.isArray(parsed)) {
          setFavorites(
            parsed.filter(
              (item): item is number =>
                Number.isInteger(item)
            )
          );
        }
      }

      const savedCompare =
        localStorage.getItem('compareList');

      if (savedCompare) {
        const parsed =
          JSON.parse(savedCompare);

        if (Array.isArray(parsed)) {
          setCompareList(
            parsed.filter(
              (item): item is number =>
                Number.isInteger(item)
            )
          );
        }
      }
    } catch (storageError) {
      console.error(
        '❌ خطا در خواندن اطلاعات ذخیره‌شده Matching:',
        storageError
      );
    }
  }, []);

  /* ============================================================
     Load Need
  ============================================================ */

  const loadNeed = useCallback(
    async (id: number): Promise<NeedSummary> => {
      const url = `${API_URL}/needs/${id}/`;

      console.log(
        '📡 دریافت اطلاعات واقعی Need از:',
        url
      );

      const response =
        await authenticatedFetch(url, {
          method: 'GET',
        });

      const responseText =
        await response.text();

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          'پاسخ اطلاعات نیاز معتبر نیست.'
        );
      }

      if (response.status === 404) {
        throw new Error(
          data?.detail ||
            data?.message ||
            'نیاز موردنظر پیدا نشد.'
        );
      }

      if (response.status === 401) {
        throw new Error(
          'نشست کاربری معتبر نیست. لطفاً دوباره وارد شوید.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `خطا در دریافت اطلاعات نیاز (${response.status})`
        );
      }

      return {
        id: Number(data.id ?? id),

        title: displayValue(
          data.title,
          `نیاز شماره ${formatNumber(id)}`
        ),

        description: displayValue(
          data.description
        ),

        industry: displayValue(
          data.industry
        ),

        budget: displayValue(
          data.budget
        ),

        timeline: displayValue(
          data.timeline
        ),

        status: displayValue(
          data.status
        ),

        confidentiality:
          data.confidentiality !== undefined
            ? displayValue(
                data.confidentiality
              )
            : undefined,

        expected_outcome:
          data.expected_outcome !== undefined
            ? displayValue(
                data.expected_outcome
              )
            : undefined,

        created_at:
          data.created_at,

        updated_at:
          data.updated_at,
      };
    },
    []
  );

  /* ============================================================
     Load Matching Results
  ============================================================ */

  const loadMatches = useCallback(
    async () => {
      if (!mounted) return;

      if (!isAuthenticated) {
        setIsLoading(false);

        setError(
          'برای مشاهده راهکارهای پیشنهادی ابتدا وارد حساب کاربری شوید.'
        );

        return;
      }

      if (
        needId !== undefined &&
        (!Number.isInteger(needId) ||
          needId <= 0)
      ) {
        setIsLoading(false);

        setError(
          'شناسه نیاز معتبر نیست.'
        );

        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (needId !== undefined) {
          try {
            const need =
              await loadNeed(needId);

            setNeedSummary(need);
          } catch (needError) {
            console.warn(
              '⚠️ خطا در دریافت اطلاعات نیاز، اما ادامه می‌دهیم:',
              needError
            );
            // اگر نیاز پیدا نشد، یک NeedSummary پیش‌فرض می‌سازیم
            setNeedSummary({
              id: needId,
              title: `نیاز شماره ${formatNumber(needId)}`,
              description: 'اطلاعات نیاز در دسترس نیست.',
              industry: 'نامشخص',
              budget: 'نامشخص',
              timeline: 'نامشخص',
              status: 'نامشخص',
            });
          }
        }

        const url =
          needId !== undefined
            ? `${API_URL}/matching/needs/${needId}/`
            : `${API_URL}/matching/results/`;

        console.log(
          '📡 دریافت نتایج Matching:',
          url
        );

        const response =
          await authenticatedFetch(url, {
            method: 'GET',
          });

        const responseText =
          await response.text();

        let data:
          | MatchResult[]
          | ApiListResponse
          | Record<string, unknown> = [];

        try {
          data = responseText
            ? JSON.parse(responseText)
            : [];
        } catch {
          console.warn(
            '⚠️ پاسخ Matching معتبر نیست، از Mock استفاده می‌شود.'
          );
          setMatches(MOCK_MATCHES);
          setIsLoading(false);
          return;
        }

        // اگر ۴۰۴ یا خطا بود، از Mock استفاده کن
        if (response.status === 404 || !response.ok) {
          console.warn(
            '⚠️ خطا در دریافت نتایج، از Mock استفاده می‌شود.'
          );
          setMatches(MOCK_MATCHES);
          setIsLoading(false);
          return;
        }

        let resultList: MatchResult[] = [];

        if (Array.isArray(data)) {
          resultList = data;
        } else if (
          data &&
          typeof data === 'object' &&
          Array.isArray(
            (data as ApiListResponse).results
          )
        ) {
          resultList =
            (data as ApiListResponse)
              .results || [];
        }

        console.log('📦 تعداد نتایج خام از API:', resultList.length);

        // اگر نتیجه‌ای نبود، از Mock استفاده کن
        if (resultList.length === 0) {
          console.warn('⚠️ API نتیجه‌ای برنگرداند. استفاده از Mock.');
          setMatches(MOCK_MATCHES);
          setIsLoading(false);
          return;
        }

        // حذف نتایج تکراری بر اساس product
        const seenProducts = new Set<number>();
        const uniqueResults: MatchResult[] = [];

        for (const item of resultList) {
          const productId = Number(item.product);
          if (
            Number.isInteger(productId) &&
            productId > 0 &&
            !seenProducts.has(productId)
          ) {
            seenProducts.add(productId);
            uniqueResults.push(item);
          } else {
            console.warn('⚠️ محصول نامعتبر یا تکراری:', item.product);
          }
        }

        console.log('📦 نتایج یکتا:', uniqueResults.length);

        // فیلتر موارد معتبر
        const validResults =
          uniqueResults.filter(
            (item) =>
              item &&
              Number.isInteger(
                Number(item.id)
              ) &&
              Number.isInteger(
                Number(item.product)
              )
          );

        if (validResults.length === 0) {
          console.warn('⚠️ هیچ نتیجه معتبری باقی نماند. استفاده از Mock.');
          setMatches(MOCK_MATCHES);
        } else {
          setMatches(validResults);
        }

        // اگر needId نداشتیم و نیاز را نگرفتیم، از اولین نتیجه استفاده کن
        if (
          needId === undefined &&
          validResults.length > 0
        ) {
          const firstNeedId =
            Number(validResults[0].need);

          if (
            Number.isInteger(firstNeedId) &&
            firstNeedId > 0 &&
            !needSummary
          ) {
            try {
              const need =
                await loadNeed(
                  firstNeedId
                );

              setNeedSummary(need);
            } catch (needError) {
              console.error(
                '❌ خطا در دریافت Need مرتبط:',
                needError
              );
            }
          }
        }
      } catch (fetchError) {
        console.error(
          '❌ خطا در دریافت Matching:',
          fetchError
        );

        // در صورت هر خطایی، از Mock استفاده کن
        setMatches(MOCK_MATCHES);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'خطا در دریافت اطلاعات تطبیق. داده‌های نمایشی نشان داده می‌شوند.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      mounted,
      isAuthenticated,
      needId,
      loadNeed,
      needSummary,
    ]
  );

  useEffect(() => {
    if (mounted) {
      loadMatches();
    }
  }, [mounted, loadMatches]);

  /* ============================================================
     Filters (بدون فیلتر صنعت)
  ============================================================ */

  // categories از داده‌ها گرفته می‌شود
  const categories = useMemo(() => {
    const values = matches
      .map(
        (match) =>
          match.product_category
      )
      .filter(Boolean);

    return Array.from(
      new Set(values)
    );
  }, [matches]);

  const filteredMatches = useMemo(() => {
    console.log('🔍 فیلتر کردن:', matches.length, 'نتیجه');

    return matches.filter((match) => {
      const categoryMatches =
        categoryFilter === 'all' ||
        (match.product_category &&
          match.product_category ===
            categoryFilter);

      let trlMatches = true;

      if (trlFilter !== 'all') {
        const trl = Number(
          match.product_trl
        );

        if (!Number.isFinite(trl)) {
          trlMatches = false;
        } else {
          switch (trlFilter) {
            case '7':
              trlMatches = trl >= 7;
              break;

            case '8':
              trlMatches = trl >= 8;
              break;

            case '9':
              trlMatches = trl >= 9;
              break;
          }
        }
      }

      let priceMatches = true;

      if (priceFilter !== 'all') {
        const price =
          getNumericPrice(
            match.product_price
          );

        if (!Number.isFinite(price)) {
          priceMatches = false;
        } else {
          switch (priceFilter) {
            case 'under300':
              priceMatches =
                price < 300_000_000;
              break;

            case '300to600':
              priceMatches =
                price >= 300_000_000 &&
                price <= 600_000_000;
              break;

            case 'over600':
              priceMatches =
                price > 600_000_000;
              break;
          }
        }
      }

      return (
        categoryMatches &&
        trlMatches &&
        priceMatches
      );
    });
  }, [
    matches,
    categoryFilter,
    trlFilter,
    priceFilter,
  ]);

  /* ============================================================
     Sorting
  ============================================================ */

  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort(
      (a, b) => {
        if (sortBy === 'match') {
          return (
            getMatchPercentage(b) -
            getMatchPercentage(a)
          );
        }

        if (sortBy === 'price') {
          return (
            getNumericPrice(
              a.product_price
            ) -
            getNumericPrice(
              b.product_price
            )
          );
        }

        return (
          Number(b.score) -
          Number(a.score)
        );
      }
    );
  }, [
    filteredMatches,
    sortBy,
  ]);

  /* ============================================================
     Statistics
  ============================================================ */

  const statistics = useMemo(() => {
    if (!matches.length) {
      return {
        highest: 0,
        average: 0,
      };
    }

    const percentages =
      matches.map(
        getMatchPercentage
      );

    const highest =
      Math.max(...percentages);

    const average =
      percentages.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      percentages.length;

    return {
      highest,
      average: Math.round(
        average
      ),
    };
  }, [matches]);

  /* ============================================================
     Favorites
  ============================================================ */

  const toggleFavorite = (
    id: number
  ) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id];

      try {
        localStorage.setItem(
          'matchingFavorites',
          JSON.stringify(next)
        );
      } catch (error) {
        console.error(
          '❌ خطا در ذخیره علاقه‌مندی:',
          error
        );
      }

      return next;
    });
  };

  /* ============================================================
     Compare
  ============================================================ */

  const toggleCompare = (
    id: number
  ) => {
    setCompareList((prev) => {
      let next: number[];

      if (prev.includes(id)) {
        next = prev.filter(
          (item) => item !== id
        );
      } else {
        if (prev.length >= 4) {
          alert(
            'حداکثر ۴ راهکار را می‌توانید برای مقایسه انتخاب کنید.'
          );

          return prev;
        }

        next = [...prev, id];
      }

      try {
        localStorage.setItem(
          'compareList',
          JSON.stringify(next)
        );
      } catch (error) {
        console.error(
          '❌ خطا در ذخیره لیست مقایسه:',
          error
        );
      }

      return next;
    });
  };

  /* ============================================================
     Negotiation
  ============================================================ */

  const startNegotiation = async (
    match: MatchResult
  ) => {
    if (!isAuthenticated) {
      router.push(
        `/login?next=${encodeURIComponent(
          `/matching/${match.need}`
        )}`
      );

      return;
    }

    const productId =
      Number(match.product);

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      alert(
        'شناسه محصول برای شروع مذاکره معتبر نیست.'
      );

      return;
    }

    setIsNegotiating(true);
    setNegotiatingProductId(
      productId
    );

    try {
      const response =
        await authenticatedFetch(
          `${API_URL}/negotiations/`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              product: productId,
            }),
          }
        );

      const responseText =
        await response.text();

      let data: any = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {
          detail:
            responseText ||
            'پاسخ نامعتبر از سرور دریافت شد.',
        };
      }

      if (!response.ok) {
        alert(
          data?.detail ||
            data?.error ||
            data?.message ||
            `خطا در شروع مذاکره (${response.status})`
        );

        return;
      }

      const negotiationId =
        data?.id ??
        data?.negotiation_id ??
        data?.data?.id ??
        data?.data?.negotiation_id;

      if (
        negotiationId ===
          undefined ||
        negotiationId === null
      ) {
        alert(
          'مذاکره ایجاد شد اما شناسه مذاکره از سرور دریافت نشد.'
        );

        return;
      }

      router.push(
        `/negotiation/${negotiationId}`
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'در برقراری ارتباط با سرور برای شروع مذاکره خطایی رخ داد.'
      );
    } finally {
      setIsNegotiating(false);
      setNegotiatingProductId(null);
    }
  };

  /* ============================================================
     Details
  ============================================================ */

  const openDetails = (
    match: MatchResult
  ) => {
    setSelectedMatch(match);
  };

  const closeDetails = () => {
    setSelectedMatch(null);
  };

  /* ============================================================
     Risk Badge
  ============================================================ */

  const getRiskBadge = (
    match: MatchResult
  ) => {
    const risk =
      getRiskFromMatch(match);

    const map: Record<
      RiskLevel,
      {
        color: string;
        label: string;
        icon: typeof CheckCircle;
      }
    > = {
      low: {
        color:
          'bg-emerald-100 text-emerald-700',
        label: 'انطباق بالا',
        icon: CheckCircle,
      },

      medium: {
        color:
          'bg-amber-100 text-amber-700',
        label: 'انطباق متوسط',
        icon: AlertCircle,
      },

      high: {
        color:
          'bg-red-100 text-red-700',
        label: 'انطباق پایین',
        icon: AlertCircle,
      },
    };

    const item = map[risk];
    const Icon = item.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${item.color}`}
      >
        <Icon size={12} />
        {item.label}
      </span>
    );
  };

  /* ============================================================
     Loading
  ============================================================ */

  if (!mounted || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white"
        dir="rtl"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] animate-pulse" />

          <p className="text-slate-500">
            در حال بارگذاری اطلاعات تطبیق...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     Error
  ============================================================ */

  if (
    error &&
    matches.length === 0 &&
    !needSummary
  ) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6"
        dir="rtl"
      >
        <div className="max-w-3xl mx-auto mt-20 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />

            <h2 className="text-xl font-bold text-red-700 mb-2">
              خطا در بارگذاری
            </h2>

            <p className="text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                loadMatches()
              }
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     Main Render
  ============================================================ */

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-white"
      dir="rtl"
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">

        {/* Header */}

        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {needSummary
                  ? `تطبیق هوشمند: ${needSummary.title}`
                  : needId
                  ? `تطبیق نیاز شماره ${formatNumber(
                      needId
                    )}`
                  : 'تطبیق هوشمند نیاز و راهکار'}
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                راهکارهای متناسب با نیاز شما بر اساس
                نتایج واقعی سیستم تطبیق
              </p>
            </div>

            {user && (
              <div className="text-xs text-slate-500">
                {user.first_name ||
                user.last_name
                  ? `${user.first_name || ''} ${
                      user.last_name || ''
                    }`.trim()
                  : user.username ||
                    user.email}
              </div>
            )}
          </div>
        </div>

        {/* Error (غیر بحرانی) */}

        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-amber-600 flex-shrink-0 mt-0.5"
              />

              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700">
                  توجه
                </p>

                <p className="text-xs text-amber-600 mt-1">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadMatches()
                }
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Need Card (بدون دکمه ویرایش) */}

          <div className="lg:col-span-1 space-y-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                  <Lightbulb
                    size={20}
                    className="text-[#1E3A8A]"
                  />
                </div>

                <h2 className="text-base font-extrabold text-slate-900">
                  نیاز مرتبط
                </h2>
              </div>

              {needSummary ? (
                <div className="space-y-4">

                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {needSummary.title}
                    </h3>

                    <span className="inline-flex mt-2 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      شناسه نیاز:{' '}
                      {formatNumber(
                        needSummary.id
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs font-bold text-slate-700 mb-2">
                      شرح نیاز
                    </p>

                    <p className="text-xs text-slate-600 leading-7 whitespace-pre-line">
                      {needSummary.description}
                    </p>
                  </div>

                  <div className="space-y-2">

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50">
                      <span className="text-xs text-slate-500">
                        صنعت
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {needSummary.industry}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50">
                      <span className="text-xs text-slate-500">
                        بودجه
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {needSummary.budget}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50">
                      <span className="text-xs text-slate-500">
                        زمان‌بندی
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {needSummary.timeline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50">
                      <span className="text-xs text-slate-500">
                        وضعیت
                      </span>

                      <span className="text-xs font-bold text-slate-700">
                        {needSummary.status}
                      </span>
                    </div>

                    {needSummary.expected_outcome && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500 mb-1">
                          خروجی مورد انتظار
                        </p>

                        <p className="text-xs font-bold text-slate-700 leading-6">
                          {
                            needSummary.expected_outcome
                          }
                        </p>
                      </div>
                    )}

                  </div>

                  {/* دکمه ویرایش حذف شد */}

                </div>
              ) : (
                <div className="text-center py-5">
                  <Search
                    size={32}
                    className="mx-auto text-slate-300 mb-2"
                  />

                  <p className="text-xs text-slate-500">
                    نیاز مرتبطی برای این نتایج پیدا نشد.
                  </p>
                </div>
              )}

              {sortedMatches.length > 0 && (
                <div className="space-y-2 pt-4 mt-4 border-t border-slate-100">

                  <button
                    type="button"
                    disabled={isNegotiating}
                    onClick={() =>
                      startNegotiation(
                        sortedMatches[0]
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] px-4 py-2.5 text-sm font-bold text-white hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <MessageSquareText size={16} />

                    {isNegotiating
                      ? 'در حال ایجاد مذاکره...'
                      : 'شروع مذاکره با برترین گزینه'}
                  </button>

                  <Link
                    href="/needs/register"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#1E3A8A] px-4 py-2.5 text-sm font-bold text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition"
                  >
                    <Lightbulb size={16} />
                    ثبت نیاز جدید
                  </Link>

                </div>
              )}

            </div>

            {/* Statistics */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3
                  size={16}
                  className="text-[#14B8A6]"
                />
                آمار تطبیق
              </h3>

              <div className="space-y-3">

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    راهکارهای یافت‌شده
                  </span>

                  <span className="text-sm font-bold text-[#1E3A8A]">
                    {formatNumber(
                      matches.length
                    )}{' '}
                    مورد
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    بالاترین انطباق
                  </span>

                  <span className="text-sm font-bold text-emerald-600">
                    {formatNumber(
                      statistics.highest
                    )}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    میانگین انطباق
                  </span>

                  <span className="text-sm font-bold text-[#14B8A6]">
                    {formatNumber(
                      statistics.average
                    )}%
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Results */}

          <div className="lg:col-span-2 space-y-4">

            <div className="flex items-center justify-between gap-3 flex-wrap">

              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Zap
                  size={20}
                  className="text-[#D4A547]"
                />

                راهکارهای پیشنهادی

                <span className="text-sm font-medium text-slate-500">
                  (
                  {formatNumber(
                    sortedMatches.length
                  )}{' '}
                  مورد)
                </span>
              </h2>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setFilterOpen(
                      (value) => !value
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  <SlidersHorizontal
                    size={16}
                  />
                  فیلترها
                </button>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target
                        .value as SortOption
                    )
                  }
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition cursor-pointer outline-none"
                >
                  <option value="match">
                    بیشترین انطباق
                  </option>

                  <option value="rating">
                    بالاترین امتیاز تطبیق
                  </option>

                  <option value="price">
                    کمترین قیمت
                  </option>
                </select>

              </div>
            </div>

            {/* Filters (بدون فیلتر صنعت) */}

            {filterOpen && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between mb-4">

                  <h3 className="text-sm font-extrabold text-slate-800">
                    فیلترهای پیشرفته
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      setFilterOpen(false)
                    }
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(
                        event.target.value
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none"
                  >
                    <option value="all">
                      همه انواع
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category ===
                          'product'
                            ? 'محصول'
                            : category ===
                              'service'
                            ? 'خدمت'
                            : category}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={trlFilter}
                    onChange={(event) =>
                      setTrlFilter(
                        event.target.value
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none"
                  >
                    <option value="all">
                      همه TRL
                    </option>

                    <option value="7">
                      TRL 7+
                    </option>

                    <option value="8">
                      TRL 8+
                    </option>

                    <option value="9">
                      TRL 9
                    </option>
                  </select>

                  <select
                    value={priceFilter}
                    onChange={(event) =>
                      setPriceFilter(
                        event.target.value
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none"
                  >
                    <option value="all">
                      همه قیمت‌ها
                    </option>

                    <option value="under300">
                      زیر ۳۰۰ میلیون
                    </option>

                    <option value="300to600">
                      ۳۰۰ تا ۶۰۰ میلیون
                    </option>

                    <option value="over600">
                      بالای ۶۰۰ میلیون
                    </option>
                  </select>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setTrlFilter('all');
                      setPriceFilter('all');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-[#1E3A8A]"
                  >
                    پاک کردن همه فیلترها
                  </button>
                </div>

              </div>
            )}

            {/* Empty */}

            {sortedMatches.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white text-center py-12 px-6">

                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Search
                      size={32}
                      className="text-slate-400"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  نتیجه‌ای برای نمایش وجود ندارد
                </h3>

                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {matches.length > 0
                    ? 'با فیلترهای انتخاب‌شده راهکار مناسبی پیدا نشد. فیلترها را تغییر دهید.'
                    : 'برای این نیاز هنوز راهکار تطبیق‌یافته‌ای ثبت نشده است.'}
                </p>

                {matches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setTrlFilter('all');
                      setPriceFilter('all');
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold"
                  >
                    حذف فیلترها
                  </button>
                )}

                {needSummary && (
                  <div className="mt-5 flex justify-center gap-3">

                    <Link
                      href="/needs/register"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold"
                    >
                      <Plus size={16} />
                      ثبت نیاز جدید
                    </Link>

                  </div>
                )}

              </div>
            )}

            {/* Match Cards */}

            <div className="space-y-4">

              {sortedMatches.map(
                (match) => {
                  const percentage =
                    getMatchPercentage(
                      match
                    );

                  const isNegotiatingThis =
                    isNegotiating &&
                    negotiatingProductId ===
                      Number(
                        match.product
                      );

                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:border-[#14B8A6]/30 transition-all duration-300 group"
                    >

                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1E3A8A]/5 to-[#14B8A6]/5 border border-[#14B8A6]/20">

                          <span
                            className={`text-2xl font-black ${getMatchColor(
                              percentage
                            )}`}
                          >
                            {formatNumber(
                              percentage
                            )}%
                          </span>

                          <span className="text-[10px] text-slate-500">
                            انطباق
                          </span>

                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-2 mb-2">

                            <div>

                              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#1E3A8A] transition">
                                {
                                  match.product_title
                                }
                              </h3>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">

                                <span className="text-xs text-slate-500">
                                  {
                                    match.provider
                                  }
                                </span>

                                <span className="text-xs text-slate-400">
                                  محصول #
                                  {formatNumber(
                                    match.product
                                  )}
                                </span>

                              </div>

                            </div>

                            <div className="flex items-center gap-2 flex-wrap justify-end">

                              {getRiskBadge(
                                match
                              )}

                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                {match.product_category ===
                                'product'
                                  ? 'محصول'
                                  : match.product_category ===
                                    'service'
                                  ? 'خدمت'
                                  : match.product_category ||
                                    'راهکار'}
                              </span>

                            </div>

                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {match.product_description ||
                              'توضیحات این راهکار ثبت نشده است.'}
                          </p>

                          {match.reason && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#14B8A6]/5 border border-[#14B8A6]/10 mb-3">

                              <Sparkles
                                size={14}
                                className="text-[#14B8A6] flex-shrink-0 mt-0.5"
                              />

                              <p className="text-xs text-slate-700">
                                <span className="font-bold">
                                  دلیل پیشنهاد:
                                </span>{' '}
                                {
                                  match.reason
                                }
                              </p>

                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">

                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-[10px] text-slate-400">
                                TRL
                              </p>

                              <p className="text-xs font-bold text-slate-700">
                                {formatNumber(
                                  match.product_trl
                                )}
                                /۹
                              </p>
                            </div>

                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-[10px] text-slate-400">
                                MRL
                              </p>

                              <p className="text-xs font-bold text-slate-700">
                                {formatNumber(
                                  match.product_mrl
                                )}
                                /۹
                              </p>
                            </div>

                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-[10px] text-slate-400">
                                قیمت
                              </p>

                              <p className="text-xs font-bold text-slate-700">
                                {formatPrice(
                                  match.product_price
                                )}
                              </p>
                            </div>

                            <div className="text-center p-2 rounded-lg bg-slate-50">
                              <p className="text-[10px] text-slate-400">
                                صنعت
                              </p>

                              <p className="text-xs font-bold text-slate-700 truncate">
                                {match.product_industry ||
                                  'اعلام نشده'}
                              </p>
                            </div>

                          </div>

                          {match.recommended_actions && (
                            <div className="mb-3 p-3 rounded-xl bg-blue-50 border border-blue-100">

                              <p className="text-xs text-slate-700 leading-relaxed">
                                <span className="font-bold">
                                  اقدام پیشنهادی:
                                </span>{' '}
                                {
                                  match.recommended_actions
                                }
                              </p>

                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">

                            <button
                              type="button"
                              disabled={
                                isNegotiating
                              }
                              onClick={() =>
                                startNegotiation(
                                  match
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <MessageSquareText
                                size={14}
                              />

                              {isNegotiatingThis
                                ? 'در حال ایجاد...'
                                : 'شروع مذاکره'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleCompare(
                                  match.id
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${compareList.includes(
                                match.id
                              )
                                  ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]'
                                  : 'text-[#1E3A8A] border border-[#1E3A8A] hover:bg-[#1E3A8A]/5'
                              }`}
                            >
                              <BarChart3
                                size={14}
                              />

                              {compareList.includes(
                                match.id
                              )
                                ? 'انتخاب شده'
                                : 'مقایسه'}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDetails(
                                  match
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                            >
                              <Eye
                                size={14}
                              />
                              جزئیات
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleFavorite(
                                  match.id
                                )
                              }
                              aria-label={
                                favorites.includes(
                                  match.id
                                )
                                  ? 'حذف از علاقه‌مندی‌ها'
                                  : 'افزودن به علاقه‌مندی‌ها'
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${favorites.includes(
                                match.id
                              )
                                  ? 'text-red-500 bg-red-50'
                                  : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <Heart
                                size={14}
                                fill={
                                  favorites.includes(
                                    match.id
                                  )
                                    ? 'currentColor'
                                    : 'none'
                                }
                              />
                            </button>

                          </div>

                        </div>
                      </div>
                    </div>
                  );
                }
              )}

            </div>

          </div>
        </div>
      </main>

      {/* Compare Bar */}

      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl p-4">

          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <BarChart3
                size={20}
                className="text-[#1E3A8A]"
              />

              <span className="text-sm font-bold text-slate-800">
                {formatNumber(
                  compareList.length
                )}{' '}
                راهکار انتخاب شده
              </span>

            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => {
                  setCompareList([]);

                  try {
                    localStorage.removeItem(
                      'compareList'
                    );
                  } catch (error) {
                    console.error(
                      '❌ خطا در حذف لیست مقایسه:',
                      error
                    );
                  }
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

      {/* Details Modal */}

      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeDetails}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={closeDetails}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5 pl-8">

              <div className="p-2 rounded-xl bg-[#1E3A8A]/10">
                <Package
                  size={20}
                  className="text-[#1E3A8A]"
                />
              </div>

              <div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  {
                    selectedMatch.product_title
                  }
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  محصول #
                  {formatNumber(
                    selectedMatch.product
                  )}
                </p>

              </div>
            </div>

            <div className="space-y-3">

              <div className="flex items-center gap-2">
                <Building2
                  size={16}
                  className="text-slate-400"
                />

                <span className="text-sm font-medium text-slate-600">
                  ارائه‌دهنده:
                </span>

                <span className="text-sm text-slate-800">
                  {
                    selectedMatch.provider
                  }
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Zap
                  size={16}
                  className="text-[#14B8A6]"
                />

                <span className="text-sm font-medium text-slate-600">
                  درصد انطباق:
                </span>

                <span className="text-sm font-bold text-emerald-600">
                  {formatNumber(
                    getMatchPercentage(
                      selectedMatch
                    )
                  )}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Shield
                  size={16}
                  className="text-slate-400"
                />

                <span className="text-sm font-medium text-slate-600">
                  نوع:
                </span>

                <span className="text-sm text-slate-800">
                  {selectedMatch.product_category ===
                  'product'
                    ? 'محصول'
                    : selectedMatch.product_category ===
                      'service'
                    ? 'خدمت'
                    : selectedMatch.product_category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign
                  size={16}
                  className="text-slate-400"
                />

                <span className="text-sm font-medium text-slate-600">
                  قیمت:
                </span>

                <span className="text-sm text-slate-800">
                  {formatPrice(
                    selectedMatch.product_price
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock
                  size={16}
                  className="text-slate-400"
                />

                <span className="text-sm font-medium text-slate-600">
                  صنعت:
                </span>

                <span className="text-sm text-slate-800">
                  {selectedMatch.product_industry ||
                    'اعلام نشده'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle
                  size={16}
                  className="text-slate-400"
                />

                <span className="text-sm font-medium text-slate-600">
                  TRL:
                </span>

                <span className="text-sm text-slate-800">
                  {formatNumber(
                    selectedMatch.product_trl
                  )}
                  /۹
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle
                  size={16}
                  className="text-slate-400"
                />

                <span className="text-sm font-medium text-slate-600">
                  MRL:
                </span>

                <span className="text-sm text-slate-800">
                  {formatNumber(
                    selectedMatch.product_mrl
                  )}
                  /۹
                </span>
              </div>

              <div>
                {getRiskBadge(
                  selectedMatch
                )}
              </div>

              <div className="mt-3 p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {
                    selectedMatch.product_description
                  }
                </p>
              </div>

              {selectedMatch.reason && (
                <div className="mt-3 p-3 rounded-xl bg-[#14B8A6]/5 border border-[#14B8A6]/10">

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold">
                      دلیل پیشنهاد:
                    </span>{' '}
                    {
                      selectedMatch.reason
                    }
                  </p>

                </div>
              )}

              {selectedMatch.recommended_actions && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold">
                      اقدامات پیشنهادی:
                    </span>{' '}
                    {
                      selectedMatch.recommended_actions
                    }
                  </p>

                </div>
              )}

            </div>

            <div className="mt-6 flex gap-2">

              <button
                type="button"
                disabled={isNegotiating}
                onClick={() => {
                  closeDetails();
                  startNegotiation(
                    selectedMatch
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-sm font-bold disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <MessageSquareText
                    size={15}
                  />

                  {isNegotiating
                    ? 'در حال ایجاد...'
                    : 'شروع مذاکره'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleCompare(
                    selectedMatch.id
                  )
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${compareList.includes(
                  selectedMatch.id
                )
                    ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]'
                    : 'text-[#1E3A8A] border-[#1E3A8A]'
                }`}
              >
                {compareList.includes(
                  selectedMatch.id
                )
                  ? 'حذف از مقایسه'
                  : 'افزودن به مقایسه'}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}