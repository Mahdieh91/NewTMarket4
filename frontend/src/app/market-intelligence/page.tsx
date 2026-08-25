// MarketIntelligencePage.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

import {
  BarChart3,
  TrendingUp,
  PieChart,
  Lightbulb,
  Filter,
  Calendar,
  Target,
  ArrowLeft,
  Star,
  Zap,
  Activity,
  Cpu,
  Thermometer,
  LineChart,
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
} from 'recharts';

import { authenticatedFetch } from '@/store/auth-store';

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

interface Competitor {
  name: string;
  products: number;
  marketShare: number;
  avgRating: number;
  strengths: string[];
  weaknesses: string[];
  industries: string[];
  regions: string[];
  techs: string[];
  ratingReasons: string[];
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
  kpiData: KPIItem[];
  trendData: TrendPoint[];
  heatmapData: HeatmapItem[];
  competitors: Competitor[];
  emergingTechs: EmergingTech[];
  topNeeds: TopItem[];
  topProducts: TopItem[];
  marketShare: MarketShareItem[];
  recommendations: Recommendation[];
  gapAnalysis: GapAnalysis[];
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

/**
 * پاسخ API را بدون نمایش HTML مربوط به Django Debug Toolbar
 * به یک پیام خطای قابل فهم تبدیل می‌کند.
 */
async function extractApiError(response: Response): Promise<string> {
  try {
    const contentType =
      response.headers.get('content-type')?.toLowerCase() || '';

    const text = await response.text();

    // ----------------------------------------------------------
    // JSON Error
    // ----------------------------------------------------------

    if (
      contentType.includes('application/json') ||
      text.trim().startsWith('{') ||
      text.trim().startsWith('[')
    ) {
      try {
        const json = JSON.parse(text);

        if (typeof json === 'string') {
          return json;
        }

        if (json.detail) {
          return String(json.detail);
        }

        if (json.message) {
          return String(json.message);
        }

        if (json.error) {
          return String(json.error);
        }

        if (json.errors && typeof json.errors === 'object') {
          const messages: string[] = [];

          Object.entries(json.errors).forEach(([field, value]) => {
            if (Array.isArray(value)) {
              messages.push(`${field}: ${value.join(', ')}`);
            } else {
              messages.push(`${field}: ${String(value)}`);
            }
          });

          if (messages.length > 0) {
            return messages.join(' | ');
          }
        }

        return `خطای سرور (${response.status})`;
      } catch {
        // JSON ناقص یا نامعتبر
      }
    }

    // ----------------------------------------------------------
    // HTML Error
    // ----------------------------------------------------------

    if (
      contentType.includes('text/html') ||
      text.trim().startsWith('<!DOCTYPE') ||
      text.trim().startsWith('<html')
    ) {
      switch (response.status) {
        case 400:
          return 'درخواست ارسال‌شده به سرور نامعتبر است.';
        case 401:
          return 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';
        case 403:
          return 'شما اجازه دسترسی به این اطلاعات را ندارید.';
        case 404:
          return 'مسیر API تحلیل بازار پیدا نشد.';
        case 500:
          return 'خطای داخلی سرور در دریافت تحلیل بازار رخ داده است.';
        case 502:
          return 'سرور واسط پاسخ معتبری از بک‌اند دریافت نکرد.';
        case 503:
          return 'سرویس تحلیل بازار موقتاً در دسترس نیست.';
        default:
          return `خطای سرور (${response.status})`;
      }
    }

    // ----------------------------------------------------------
    // Plain Text
    // ----------------------------------------------------------

    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText) {
      return cleanText.substring(0, 500);
    }

    return `خطای سرور (${response.status})`;
  } catch (error) {
    console.error('❌ Failed to parse API error:', error);

    return `خطا در ارتباط با سرور (${response.status})`;
  }
}

// ============================================================
// Main Component
// ============================================================

export default function MarketIntelligencePage() {
  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [data, setData] =
    useState<MarketIntelligenceData | null>(null);

  // ----------------------------------------------------------
  // Filters
  // ----------------------------------------------------------

  const [selectedIndustry, setSelectedIndustry] =
    useState('all');

  const [selectedRegion, setSelectedRegion] =
    useState('all');

  const [selectedTech, setSelectedTech] =
    useState('all');

  const [selectedTimeRange, setSelectedTimeRange] =
    useState('12m');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'trends' | 'competitors' | 'opportunities'
  >('overview');

  const [toast, setToast] = useState<string | null>(null);

  // ==========================================================
  // Fetch Data
  // ==========================================================

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        // ------------------------------------------------------
        // Build API URL
        // ------------------------------------------------------

        const apiBaseUrl = getApiBaseUrl();

        // ⚠️ مسیر صحیح بر اساس urls.py بک‌اند
        const endpoint =
          `${apiBaseUrl}/analytics/services/`;

        const params = new URLSearchParams();

        if (selectedIndustry !== 'all') {
          params.append(
            'industry',
            selectedIndustry
          );
        }

        if (selectedRegion !== 'all') {
          params.append(
            'region',
            selectedRegion
          );
        }

        if (selectedTech !== 'all') {
          params.append(
            'tech',
            selectedTech
          );
        }

        if (selectedTimeRange !== '12m') {
          params.append(
            'timeRange',
            selectedTimeRange
          );
        }

        const queryString = params.toString();

        const url = queryString
          ? `${endpoint}?${queryString}`
          : endpoint;

        console.log(
          '📊 Market Intelligence API:',
          {
            url,
            method: 'GET',
            filters: {
              industry: selectedIndustry,
              region: selectedRegion,
              tech: selectedTech,
              timeRange: selectedTimeRange,
            },
          }
        );

        // ------------------------------------------------------
        // Authenticated Fetch
        // ------------------------------------------------------

        const response = await authenticatedFetch(
          url,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        console.log(
          '📡 Market Intelligence Status:',
          response.status
        );

        // ------------------------------------------------------
        // Unauthorized
        // ------------------------------------------------------

        if (response.status === 401) {
          const message =
            'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.';

          setError(message);

          setToast(message);

          return;
        }

        // ------------------------------------------------------
        // Forbidden
        // ------------------------------------------------------

        if (response.status === 403) {
          setError(
            'شما اجازه دسترسی به مرکز تحلیل بازار را ندارید.'
          );

          return;
        }

        // ------------------------------------------------------
        // Any other HTTP error
        // ------------------------------------------------------

        if (!response.ok) {
          const errorMessage =
            await extractApiError(response);

          console.error(
            '❌ Market Intelligence API Error:',
            {
              url: response.url,
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              contentType:
                response.headers.get('content-type'),
              message: errorMessage,
            }
          );

          setError(errorMessage);

          return;
        }

        // ------------------------------------------------------
        // Content Type Validation
        // ------------------------------------------------------

        const contentType =
          response.headers
            .get('content-type')
            ?.toLowerCase() || '';

        if (
          !contentType.includes(
            'application/json'
          )
        ) {
          console.error(
            '❌ API returned non-JSON response:',
            contentType
          );

          setError(
            'پاسخ دریافتی از سرور معتبر نیست. انتظار JSON داشتیم.'
          );

          return;
        }

        // ------------------------------------------------------
        // Parse JSON
        // ------------------------------------------------------

        let result: any;

        try {
          result = await response.json();
        } catch (jsonError) {
          console.error(
            '❌ Invalid JSON response:',
            jsonError
          );

          setError(
            'پاسخ سرور قابل پردازش نیست.'
          );

          return;
        }

        console.log(
          '✅ Market Intelligence Response:',
          result
        );

        // ------------------------------------------------------
        // Validate API Structure
        // ------------------------------------------------------

        if (
          result?.status === 'success' &&
          result?.data
        ) {
          setData(result.data);
          setError(null);

          return;
        }

        // Some APIs may return data directly
        if (
          result &&
          typeof result === 'object' &&
          result.kpiData
        ) {
          setData(result);
          setError(null);

          return;
        }

        // ------------------------------------------------------
        // API returned unsuccessful response
        // ------------------------------------------------------

        const backendMessage =
          result?.message ||
          result?.detail ||
          'ساختار پاسخ API معتبر نیست.';

        console.error(
          '❌ Invalid API structure:',
          result
        );

        setError(
          String(backendMessage)
        );
      } catch (err: unknown) {
        console.error(
          '❌ Error fetching market intelligence:',
          err
        );

        // ------------------------------------------------------
        // Network Error
        // ------------------------------------------------------

        if (
          err instanceof TypeError &&
          err.message
            .toLowerCase()
            .includes('fetch')
        ) {
          setError(
            'ارتباط با سرور برقرار نشد. لطفاً مطمئن شوید بک‌اند Django در حال اجرا است.'
          );

          return;
        }

        // ------------------------------------------------------
        // Standard Error
        // ------------------------------------------------------

        if (err instanceof Error) {
          setError(
            err.message ||
              'خطا در دریافت اطلاعات بازار.'
          );

          return;
        }

        setError(
          'خطای غیرمنتظره‌ای در دریافت اطلاعات رخ داد.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      selectedIndustry,
      selectedRegion,
      selectedTech,
      selectedTimeRange,
    ]
  );

  // ==========================================================
  // Initial Load
  // ==========================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    fetchData(true);
  }, [mounted]);

  // ==========================================================
  // Refetch when filters change
  // ==========================================================

  useEffect(() => {
    if (!mounted) {
      return;
    }

    // در اولین render دوباره درخواست نزن
    if (loading) {
      return;
    }

    fetchData(false);
  }, [
    selectedIndustry,
    selectedRegion,
    selectedTech,
    selectedTimeRange,
  ]);

  // ==========================================================
  // Filtered Data
  // ==========================================================

  const filteredHeatmap = useMemo(() => {
    if (!data?.heatmapData) {
      return [];
    }

    return data.heatmapData.filter((item) => {
      if (
        selectedIndustry !== 'all' &&
        item.industry !== selectedIndustry
      ) {
        return false;
      }

      if (
        selectedRegion !== 'all' &&
        item.region !== selectedRegion
      ) {
        return false;
      }

      if (
        selectedTech !== 'all' &&
        item.tech !== selectedTech
      ) {
        return false;
      }

      return true;
    });
  }, [
    data?.heatmapData,
    selectedIndustry,
    selectedRegion,
    selectedTech,
  ]);

  const filteredTrendData = useMemo(() => {
    return data?.trendData || [];
  }, [data?.trendData]);

  const filteredCompetitors = useMemo(() => {
    if (!data?.competitors) {
      return [];
    }

    return data.competitors.filter((comp) => {
      if (
        selectedIndustry !== 'all' &&
        !comp.industries.includes(
          selectedIndustry
        )
      ) {
        return false;
      }

      if (
        selectedRegion !== 'all' &&
        !comp.regions.includes(selectedRegion)
      ) {
        return false;
      }

      if (
        selectedTech !== 'all' &&
        !comp.techs.includes(selectedTech)
      ) {
        return false;
      }

      return true;
    });
  }, [
    data?.competitors,
    selectedIndustry,
    selectedRegion,
    selectedTech,
  ]);

  const filteredEmergingTechs = useMemo(() => {
    if (!data?.emergingTechs) {
      return [];
    }

    return data.emergingTechs.filter((tech) => {
      if (
        selectedIndustry !== 'all' &&
        !tech.industries.includes(
          selectedIndustry
        )
      ) {
        return false;
      }

      if (
        selectedRegion !== 'all' &&
        !tech.regions.includes(selectedRegion)
      ) {
        return false;
      }

      return true;
    });
  }, [
    data?.emergingTechs,
    selectedIndustry,
    selectedRegion,
  ]);

  const filteredTopNeeds = useMemo(() => {
    if (!data?.topNeeds) {
      return [];
    }

    return data.topNeeds.filter((need) => {
      if (
        selectedIndustry !== 'all' &&
        need.industry !== selectedIndustry
      ) {
        return false;
      }

      if (
        selectedTech !== 'all' &&
        need.tech !== selectedTech
      ) {
        return false;
      }

      return true;
    });
  }, [
    data?.topNeeds,
    selectedIndustry,
    selectedTech,
  ]);

  const filteredTopProducts = useMemo(() => {
    if (!data?.topProducts) {
      return [];
    }

    return data.topProducts.filter((product) => {
      if (
        selectedIndustry !== 'all' &&
        product.industry !== selectedIndustry
      ) {
        return false;
      }

      if (
        selectedTech !== 'all' &&
        product.tech !== selectedTech
      ) {
        return false;
      }

      return true;
    });
  }, [
    data?.topProducts,
    selectedIndustry,
    selectedTech,
  ]);

  const filteredGapData = useMemo(() => {
    return data?.gapAnalysis || [];
  }, [data?.gapAnalysis]);

  // ==========================================================
  // Helpers
  // ==========================================================

  const getActivityColor = (
    level: string
  ) => {
    switch (level) {
      case 'hot':
        return 'bg-red-100 text-red-700 border-red-200';

      case 'warm':
        return 'bg-amber-100 text-amber-700 border-amber-200';

      case 'cold':
        return 'bg-blue-100 text-blue-700 border-blue-200';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getActivityLabel = (
    level: string
  ) => {
    switch (level) {
      case 'hot':
        return 'داغ 🔥';

      case 'warm':
        return 'گرم 🌤️';

      case 'cold':
        return 'سرد ❄️';

      default:
        return level;
    }
  };

  const getTrendIcon = (
    trend: string
  ) => {
    switch (trend) {
      case 'up':
        return (
          <TrendingUp
            size={14}
            className="text-emerald-600"
          />
        );

      case 'down':
        return (
          <TrendingUp
            size={14}
            className="text-red-600 rotate-180"
          />
        );

      case 'stable':
        return (
          <Activity
            size={14}
            className="text-slate-600"
          />
        );

      default:
        return null;
    }
  };

  const getPriorityBadge = (
    priority: string
  ) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';

      case 'medium':
        return 'bg-amber-100 text-amber-700';

      case 'low':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getPriorityLabel = (
    priority: string
  ) => {
    switch (priority) {
      case 'high':
        return 'اولویت بالا';

      case 'medium':
        return 'اولویت متوسط';

      case 'low':
        return 'اولویت پایین';

      default:
        return priority;
    }
  };

  const getIconComponent = (
    iconName: string
  ) => {
    switch (iconName) {
      case 'Activity':
        return Activity;

      case 'Cpu':
        return Cpu;

      case 'AlertCircle':
        return AlertCircle;

      case 'Lightbulb':
        return Lightbulb;

      case 'Package':
        return Package;

      case 'CheckCircle':
        return CheckCircle;

      case 'Target':
        return Target;

      case 'Zap':
      default:
        return Zap;
    }
  };

  // ==========================================================
  // Empty State
  // ==========================================================

  const EmptyState = ({
    message,
    subMessage,
  }: {
    message: string;
    subMessage?: string;
  }) => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Activity
          size={40}
          className="text-slate-300"
        />
      </div>

      <p className="text-slate-500 font-medium">
        {message}
      </p>

      {subMessage && (
        <p className="text-xs text-slate-400 mt-1">
          {subMessage}
        </p>
      )}
    </div>
  );

  // ==========================================================
  // Loading
  // ==========================================================

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>

          <p className="text-slate-500">
            در حال بارگذاری تحلیل بازار...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Error
  // ==========================================================

  if (error) {
    const isAuthError =
      error.includes('نشست') ||
      error.includes('وارد');

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4"
        dir="rtl"
      >
        <div className="max-w-lg w-full text-center">
          <div
            className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
              isAuthError
                ? 'bg-amber-50'
                : 'bg-red-50'
            }`}
          >
            {isAuthError ? (
              <Lock
                size={40}
                className="text-amber-500"
              />
            ) : (
              <AlertCircle
                size={40}
                className="text-red-500"
              />
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {isAuthError
              ? 'نیاز به ورود مجدد'
              : 'خطا در دریافت اطلاعات'}
          </h3>

          <p className="text-sm text-slate-500 mb-6 leading-7">
            {error}
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchData(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold hover:shadow-lg transition"
            >
              <RefreshCw size={18} />
              تلاش مجدد
            </button>

            {isAuthError && (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition"
              >
                ورود مجدد
              </Link>
            )}
          </div>

          {!isAuthError && (
            <p className="text-xs text-slate-400 mt-6">
              اگر این خطا ادامه داشت، لاگ Django را بررسی کنید.
            </p>
          )}
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
      style={{
        fontFamily:
          "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
      dir="rtl"
    >
      {/* Toast */}

      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-700 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <Lock size={16} />

          <span className="text-sm font-bold">
            {toast}
          </span>

          <button
            onClick={() => setToast(null)}
            className="mr-2 text-amber-500 hover:text-amber-700"
          >
            ×
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ======================================================
            Header
        ====================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#14B8A6] p-6 sm:p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4A547] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">
                مرکز هوشمند تحلیل بازار
              </h1>

              <p className="mt-2 text-white/80 text-sm sm:text-base">
                تحلیل روندها، رقبا، فرصت‌ها و شکاف‌های بازار فناوری — داده‌محور و به‌روز
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(false)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs font-medium disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                {refreshing
                  ? 'در حال به‌روزرسانی...'
                  : 'به‌روزرسانی'}
              </button>

              <div className="flex items-center gap-2 text-xs text-white/70">
                <Clock size={14} />

                آخرین به‌روزرسانی:
                {' '}
                {new Date().toLocaleDateString(
                  'fa-IR'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            Filters
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Filter
              size={18}
              className="text-slate-400"
            />

            <select
              value={selectedIndustry}
              onChange={(e) =>
                setSelectedIndustry(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">
                همه صنایع
              </option>

              <option value="نفت و گاز">
                نفت و گاز
              </option>

              <option value="پتروشیمی">
                پتروشیمی
              </option>

              <option value="فولاد و معدن">
                فولاد و معدن
              </option>

              <option value="سلامت">
                سلامت
              </option>

              <option value="کشاورزی">
                کشاورزی
              </option>

              <option value="حمل‌ونقل">
                حمل‌ونقل
              </option>

              <option value="خودروسازی">
                خودروسازی
              </option>

              <option value="انرژی">
                انرژی
              </option>

              <option value="فناوری اطلاعات">
                فناوری اطلاعات
              </option>

              <option value="محیط زیست">
                محیط زیست
              </option>
            </select>

            <select
              value={selectedRegion}
              onChange={(e) =>
                setSelectedRegion(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">
                همه مناطق
              </option>

              <option value="تهران">
                تهران
              </option>

              <option value="اصفهان">
                اصفهان
              </option>

              <option value="شیراز">
                شیراز
              </option>

              <option value="تبریز">
                تبریز
              </option>

              <option value="مشهد">
                مشهد
              </option>
            </select>

            <select
              value={selectedTech}
              onChange={(e) =>
                setSelectedTech(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">
                همه فناوری‌ها
              </option>

              <option value="هوش مصنوعی">
                هوش مصنوعی
              </option>

              <option value="اینترنت اشیاء">
                اینترنت اشیاء
              </option>

              <option value="دوقلوی دیجیتال">
                دوقلوی دیجیتال
              </option>

              <option value="رباتیک">
                رباتیک
              </option>

              <option value="بلاکچین">
                بلاکچین
              </option>

              <option value="داده‌کاوی">
                داده‌کاوی
              </option>
            </select>

            <select
              value={selectedTimeRange}
              onChange={(e) =>
                setSelectedTimeRange(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="3m">
                ۳ ماه اخیر
              </option>

              <option value="6m">
                ۶ ماه اخیر
              </option>

              <option value="12m">
                ۱۲ ماه اخیر
              </option>

              <option value="24m">
                ۲۴ ماه اخیر
              </option>
            </select>

            <span className="text-xs text-slate-400 mr-auto">
              {filteredHeatmap.length}
              {' '}
              نتیجه
            </span>
          </div>
        </div>

        {/* ======================================================
            Tabs
        ====================================================== */}

        <div className="flex items-center gap-1 border-b border-slate-200 pb-0 overflow-x-auto">
          {[
            {
              key: 'overview',
              label: 'نمای کلی',
              icon: Layers,
            },
            {
              key: 'trends',
              label: 'روندها',
              icon: TrendingUp,
            },
            {
              key: 'competitors',
              label: 'تحلیل رقبا',
              icon: Users,
            },
            {
              key: 'opportunities',
              label: 'فرصت‌ها',
              icon: Target,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(
                  tab.key as
                    | 'overview'
                    | 'trends'
                    | 'competitors'
                    | 'opportunities'
                )
              }
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

        {/* ======================================================
            KPI
        ====================================================== */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.kpiData &&
          data.kpiData.length > 0 ? (
            data.kpiData.map(
              (kpi, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">
                      {kpi.label}
                    </span>

                    <div
                      className={`p-2 rounded-xl ${kpi.color}`}
                    >
                      {kpi.icon ===
                        'Lightbulb' && (
                        <Lightbulb size={16} />
                      )}

                      {kpi.icon ===
                        'Package' && (
                        <Package size={16} />
                      )}

                      {kpi.icon ===
                        'CheckCircle' && (
                        <CheckCircle size={16} />
                      )}

                      {kpi.icon === 'Target' && (
                        <Target size={16} />
                      )}

                      {kpi.icon === 'Activity' && (
                        <Activity size={16} />
                      )}

                      {kpi.icon === 'Zap' && (
                        <Zap size={16} />
                      )}
                    </div>
                  </div>

                  <p className="text-2xl font-black text-slate-900">
                    {kpi.value}
                  </p>

                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    {kpi.change}
                    {' '}
                    نسبت به ماه قبل
                  </p>
                </div>
              )
            )
          ) : (
            <div className="col-span-4">
              <EmptyState
                message="هیچ داده‌ای برای نمایش وجود ندارد"
                subMessage="لطفاً فیلترهای خود را تغییر دهید"
              />
            </div>
          )}
        </div>

        {/* ======================================================
            Overview
        ====================================================== */}

        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Trend */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <LineChart
                  size={20}
                  className="text-[#1E3A8A]"
                />

                روند تقاضا، عرضه و معاملات

                {selectedIndustry !==
                'all'
                  ? ` (${selectedIndustry})`
                  : selectedRegion !==
                    'all'
                  ? ` (${selectedRegion})`
                  : selectedTech !==
                    'all'
                  ? ` (${selectedTech})`
                  : ''}
              </h2>

              {filteredTrendData.length >
              0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={350}
                >
                  <ReLineChart
                    data={
                      filteredTrendData
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      dataKey="month"
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="تقاضا"
                      stroke="#1E3A8A"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="عرضه"
                      stroke="#14B8A6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="معاملات"
                      stroke="#D4A547"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </ReLineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  message="داده‌ای برای نمایش روند وجود ندارد"
                  subMessage="هیچ داده‌ای در بازه زمانی انتخاب‌شده یافت نشد"
                />
              )}
            </div>

            {/* Heatmap */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Thermometer
                    size={20}
                    className="text-[#14B8A6]"
                  />

                  نقشه حرارتی صنایع
                </h2>

                {filteredHeatmap.length >
                0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredHeatmap.map(
                      (item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                item.activityLevel ===
                                'hot'
                                  ? 'bg-red-500'
                                  : item.activityLevel ===
                                    'warm'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                            />

                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {
                                  item.industry
                                }
                              </p>

                              <p className="text-xs text-slate-500">
                                {
                                  item.supplyCount
                                }
                                {' '}
                                محصول |
                                {' '}
                                {Number(
                                  item.dealValue ||
                                    0
                                ).toLocaleString()}
                                {' '}
                                میلیون تومان
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">
                                +
                                {
                                  item.demandGrowth
                                }
                                ٪
                              </p>

                              <p className="text-xs text-slate-400">
                                رشد تقاضا
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getActivityColor(
                                item.activityLevel
                              )}`}
                            >
                              {getTrendIcon(
                                item.trend
                              )}

                              {getActivityLabel(
                                item.activityLevel
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState
                    message="هیچ داده‌ای برای نقشه حرارتی وجود ندارد"
                    subMessage="فیلترهای خود را تغییر دهید"
                  />
                )}
              </div>

              {/* Needs / Products */}

              <div className="space-y-6">

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Lightbulb
                      size={20}
                      className="text-[#D4A547]"
                    />

                    نیازهای پرتکرار
                  </h2>

                  {filteredTopNeeds.length >
                  0 ? (
                    <div className="space-y-3">
                      {filteredTopNeeds.map(
                        (need, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-6">
                                {i + 1}
                              </span>

                              <span className="text-sm font-medium text-slate-700">
                                {
                                  need.title
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600">
                                {need.count ??
                                  0}
                                {' '}
                                مورد
                              </span>

                              <span className="text-xs text-emerald-600 font-medium">
                                {
                                  need.growth
                                }
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState message="هیچ نیازی یافت نشد" />
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <Eye
                      size={20}
                      className="text-[#14B8A6]"
                    />

                    محصولات پربازدید
                  </h2>

                  {filteredTopProducts.length >
                  0 ? (
                    <div className="space-y-3">
                      {filteredTopProducts.map(
                        (product, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-6">
                                {i + 1}
                              </span>

                              <span className="text-sm font-medium text-slate-700">
                                {
                                  product.title
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                <Star
                                  size={12}
                                  className="text-[#D4A547] fill-[#D4A547]"
                                />

                                <span className="text-xs font-bold text-slate-600">
                                  {product.rating ??
                                    0}
                                </span>
                              </div>

                              <span className="text-xs text-slate-400">
                                {product.views ??
                                  0}
                                {' '}
                                بازدید
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyState message="هیچ محصولی یافت نشد" />
                  )}
                </div>
              </div>
            </div>

            {/* Market Share + Emerging */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart
                    size={20}
                    className="text-[#1E3A8A]"
                  />

                  سهم بازار عرضه‌کنندگان
                </h2>

                {data?.marketShare &&
                data.marketShare.length >
                  0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >
                    <RePieChart>
                      <Pie
                        data={
                          data.marketShare
                        }
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({
                          name,
                          value,
                        }) =>
                          `${name} (${value}%)`
                        }
                      >
                        {data.marketShare.map(
                          (_, i) => (
                            <Cell
                              key={i}
                              fill={
                                COLORS[
                                  i %
                                    COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="داده‌ای برای سهم بازار وجود ندارد" />
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Cpu
                    size={20}
                    className="text-[#14B8A6]"
                  />

                  فناوری‌های نوظهور
                </h2>

                {filteredEmergingTechs.length >
                0 ? (
                  <div className="space-y-3">
                    {filteredEmergingTechs.map(
                      (tech, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1E3A8A02] to-[#14B8A602] border border-[#14B8A610]"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {tech.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {tech.category}
                              {' • '}
                              {
                                tech.maturityLevel
                              }
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600">
                              +
                              {
                                tech.growthRate
                              }
                              ٪
                            </p>

                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        tech.opportunityScore ||
                                          0
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-xs text-slate-500">
                                {
                                  tech.opportunityScore
                                }
                                /۱۰۰
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState message="هیچ فناوری نوظهوری یافت نشد" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            Trends
        ====================================================== */}

        {activeTab === 'trends' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4">
              روند تفصیلی تقاضا بر اساس صنعت
            </h2>

            {filteredTrendData.length >
            0 ? (
              <ResponsiveContainer
                width="100%"
                height={400}
              >
                <AreaChart
                  data={
                    filteredTrendData
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <Tooltip />

                  <Legend />

                  <Area
                    type="monotone"
                    dataKey="تقاضا"
                    stroke="#1E3A8A"
                    fill="#1E3A8A20"
                    strokeWidth={2}
                  />

                  <Area
                    type="monotone"
                    dataKey="عرضه"
                    stroke="#14B8A6"
                    fill="#14B8A620"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                message="داده‌ای برای نمایش روند وجود ندارد"
                subMessage="هیچ داده‌ای در بازه زمانی انتخاب‌شده یافت نشد"
              />
            )}
          </div>
        )}

        {/* ======================================================
            Competitors
        ====================================================== */}

        {activeTab === 'competitors' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 overflow-x-auto">
            <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Users
                size={20}
                className="text-[#1E3A8A]"
              />

              جدول تحلیل رقبا
            </h2>

            {filteredCompetitors.length >
            0 ? (
              <>
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-right">
                      <th className="py-3 px-3 text-slate-500 font-medium">
                        شرکت
                      </th>

                      <th className="py-3 px-3 text-slate-500 font-medium text-center">
                        محصولات
                      </th>

                      <th className="py-3 px-3 text-slate-500 font-medium text-center">
                        سهم بازار
                      </th>

                      <th className="py-3 px-3 text-slate-500 font-medium text-center">
                        امتیاز
                      </th>

                      <th className="py-3 px-3 text-slate-500 font-medium hidden lg:table-cell">
                        دلایل امتیاز
                      </th>

                      <th className="py-3 px-3 text-slate-500 font-medium">
                        نقاط قوت
                      </th>

                      <th className="py-3 px-3 text-slate-500 font-medium">
                        نقاط ضعف
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCompetitors.map(
                      (comp, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 hover:bg-slate-50 transition"
                        >
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {comp.name}
                          </td>

                          <td className="py-3 px-3 text-center text-slate-600">
                            {
                              comp.products
                            }
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full">
                                <div
                                  className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        comp.marketShare ||
                                          0
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-xs font-bold text-slate-600">
                                {Math.round(
                                  comp.marketShare ||
                                    0
                                )}
                                ٪
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star
                                size={14}
                                className="text-[#D4A547] fill-[#D4A547]"
                              />

                              <span className="font-bold text-slate-700">
                                {Number(
                                  comp.avgRating ||
                                    0
                                ).toFixed(1)}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(comp.ratingReasons ||
                                [])
                                .slice(0, 3)
                                .map(
                                  (
                                    reason,
                                    j
                                  ) => (
                                    <span
                                      key={j}
                                      className="px-2 py-0.5 rounded-full bg-[#1E3A8A10] text-[#1E3A8A] text-xs font-medium"
                                    >
                                      {reason}
                                    </span>
                                  )
                                )}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(comp.strengths ||
                                [])
                                .slice(0, 2)
                                .map(
                                  (
                                    strength,
                                    j
                                  ) => (
                                    <span
                                      key={j}
                                      className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs"
                                    >
                                      {strength}
                                    </span>
                                  )
                                )}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(comp.weaknesses ||
                                [])
                                .slice(0, 2)
                                .map(
                                  (
                                    weakness,
                                    j
                                  ) => (
                                    <span
                                      key={j}
                                      className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs"
                                    >
                                      {weakness}
                                    </span>
                                  )
                                )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                <div className="lg:hidden mt-4 space-y-4">
                  {filteredCompetitors.map(
                    (comp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50"
                      >
                        <p className="font-bold text-slate-800 mb-2">
                          {comp.name}
                          {' — امتیاز '}
                          {Number(
                            comp.avgRating ||
                              0
                          ).toFixed(1)}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {(comp.ratingReasons ||
                            [])
                            .slice(0, 2)
                            .map(
                              (
                                reason,
                                j
                              ) => (
                                <span
                                  key={j}
                                  className="px-2 py-0.5 rounded-full bg-[#1E3A8A10] text-[#1E3A8A] text-xs font-medium"
                                >
                                  {reason}
                                </span>
                              )
                            )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                message="هیچ رقیبی برای نمایش وجود ندارد"
                subMessage="فیلترهای خود را تغییر دهید"
              />
            )}
          </div>
        )}

        {/* ======================================================
            Opportunities
        ====================================================== */}

        {activeTab ===
          'opportunities' && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.recommendations &&
              data.recommendations.length >
                0 ? (
                data.recommendations.map(
                  (rec) => {
                    const IconComponent =
                      getIconComponent(
                        rec.icon
                      );

                    return (
                      <div
                        key={rec.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition group"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-xl ${
                              rec.priority ===
                              'high'
                                ? 'bg-red-50'
                                : rec.priority ===
                                  'medium'
                                ? 'bg-amber-50'
                                : 'bg-blue-50'
                            }`}
                          >
                            <IconComponent
                              size={24}
                              className={
                                rec.priority ===
                                'high'
                                  ? 'text-red-600'
                                  : rec.priority ===
                                    'medium'
                                  ? 'text-amber-600'
                                  : 'text-blue-600'
                              }
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-sm font-extrabold text-slate-900">
                                {
                                  rec.title
                                }
                              </h3>

                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(
                                  rec.priority
                                )}`}
                              >
                                {getPriorityLabel(
                                  rec.priority
                                )}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mb-3">
                              {
                                rec.description
                              }
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                تأثیر:
                                {' '}
                                <strong>
                                  {
                                    rec.impact
                                  }
                                </strong>
                              </span>

                              <button className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] hover:text-[#14B8A6] transition">
                                {
                                  rec.action
                                }

                                <ArrowLeft
                                  size={12}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              ) : (
                <div className="col-span-2">
                  <EmptyState
                    message="هیچ پیشنهادی وجود ندارد"
                    subMessage="بر اساس داده‌های موجود، پیشنهادی یافت نشد"
                  />
                </div>
              )}
            </div>

            {/* Gap Analysis */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Activity
                  size={20}
                  className="text-[#14B8A6]"
                />

                تحلیل شکاف عرضه و تقاضا
              </h2>

              {filteredGapData.length >
              0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredGapData.map(
                    (item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-3 rounded-xl bg-slate-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 mb-2">
                            {
                              item.industry
                            }
                          </p>

                          <div className="space-y-1.5">

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-16">
                                تقاضا:
                              </span>

                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                                <div
                                  className="h-full bg-[#1E3A8A] rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        item.demandGrowth *
                                          2.5
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-xs font-bold text-[#1E3A8A]">
                                +
                                {
                                  item.demandGrowth
                                }
                                ٪
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-16">
                                عرضه:
                              </span>

                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                                <div
                                  className="h-full bg-[#14B8A6] rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(
                                        0,
                                        item.supplyCount *
                                          1.5
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-xs font-bold text-[#14B8A6]">
                                {
                                  item.supplyCount
                                }
                                {' '}
                                محصول
                              </span>
                            </div>

                          </div>
                        </div>

                        {item.gap ===
                          'شکاف عرضه' && (
                          <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium whitespace-nowrap">
                            شکاف عرضه
                          </span>
                        )}

                        {item.gap ===
                          'شکاف تقاضا' && (
                          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium whitespace-nowrap">
                            شکاف تقاضا
                          </span>
                        )}

                        {item.gap ===
                          'متوازن' && (
                          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium whitespace-nowrap">
                            متوازن
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <EmptyState message="داده‌ای برای تحلیل شکاف وجود ندارد" />
              )}
            </div>
          </div>
        )}

        {/* ======================================================
            Smart Recommendation
        ====================================================== */}

        <div className="rounded-2xl border-2 border-[#D4A547] bg-gradient-to-r from-[#D4A54705] to-[#D4A54710] p-6">
          <div className="flex items-start gap-4">

            <div className="p-3 rounded-xl bg-[#D4A547] text-white">
              <Zap size={24} />
            </div>

            <div className="flex-1">

              <h2 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                پیشنهاد هوشمند اقدام

                <span className="text-xs font-medium text-[#D4A547] bg-[#D4A54715] px-2 py-0.5 rounded-full">
                  AI-Powered
                </span>
              </h2>

              {data?.recommendations &&
              data.recommendations.length >
                0 ? (
                <>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    بر اساس تحلیل داده‌های بازار، بهترین فرصت‌های سرمایه‌گذاری در صنایع زیر شناسایی شده است:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {data.recommendations
                      .slice(0, 2)
                      .map((rec, i) => (
                        <Link
                          key={i}
                          href="/needs/register"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] hover:shadow-md transition"
                        >
                          <Lightbulb
                            size={14}
                          />

                          {rec.action}
                        </Link>
                      ))}

                    <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition">
                      <Bookmark
                        size={14}
                      />

                      ذخیره این تحلیل
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed">
                  برای دریافت پیشنهادات هوشمند، ابتدا نیازها یا محصولات خود را در پلتفرم ثبت کنید.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          Footer
      ======================================================== */}

      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">
            مرکز هوشمند تحلیل بازار تحول — داده‌ها بر اساس آخرین فعالیت‌های پلتفرم به‌روزرسانی می‌شوند
          </p>
        </div>
      </footer>
    </div>
  );
}