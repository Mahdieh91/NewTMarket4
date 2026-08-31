// ============================================================
// FILE: C:\Users\Fardad\tmarket4\frontend\src\app\dashboard\page.tsx
// ============================================================

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Activity,
  Award,
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  Lightbulb,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
  X,
  ChevronRight,
  Users,
  Briefcase,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  authenticatedFetch,
  useAuthStore,
} from '@/store/auth-store';


// ============================================================
// Types
// ============================================================

interface DashboardStats {
  totalProducts: number;
  activeNeeds: number;
  ongoingNegotiations: number;
  successfulDeals: number;
  totalActivities?: number;
  successRate?: number;
}

interface MonthlyDeal {
  month: string;
  deals: number;
}

interface ActivityItem {
  id: string;
  type?: string;
  title: string;
  user: string;
  time: string;
  status?: string;
  amount?: string;
}

interface SuggestionItem {
  title: string;
  match: number;
  reason: string;
  type?: 'need' | 'supply' | 'opportunity';
}

interface FunnelItem {
  label: string;
  value: number;
  percent: number;
}

interface SupplierItem {
  name: string;
  score: number;
  deals: number;
  avatar?: string;
  industry?: string;
}

interface NegotiationInsight {
  label: string;
  value: number;
  percent: number;
}

interface RecentNeed {
  id: number;
  title: string;
  status: string;
  created_at: string;
  industry?: string;
}

interface RecentSupply {
  id: number;
  title: string;
  status: string;
  created_at: string;
  category?: string;
}

interface DashboardData {
  stats: DashboardStats;
  industryData: unknown[];
  monthlyDeals: MonthlyDeal[];
  recentActivities: ActivityItem[];
  smartSuggestions: SuggestionItem[];
  conversionFunnel: FunnelItem[];
  topSuppliers: SupplierItem[];
  negotiationInsights: NegotiationInsight[];
  recentNeeds?: RecentNeed[];
  recentSupplies?: RecentSupply[];
}

interface DashboardApiResponse {
  stats?: Partial<DashboardStats>;
  industryData?: unknown[];
  monthlyDeals?: MonthlyDeal[];
  recentActivities?: ActivityItem[];
  smartSuggestions?: SuggestionItem[];
  conversionFunnel?: FunnelItem[];
  topSuppliers?: SupplierItem[];
  negotiationInsights?: NegotiationInsight[];
  recentNeeds?: RecentNeed[];
  recentSupplies?: RecentSupply[];
}


// ============================================================
// Empty data
// ============================================================

const EMPTY_DASHBOARD_DATA: DashboardData = {
  stats: {
    totalProducts: 0,
    activeNeeds: 0,
    ongoingNegotiations: 0,
    successfulDeals: 0,
    totalActivities: 0,
    successRate: 0,
  },
  industryData: [],
  monthlyDeals: [],
  recentActivities: [],
  smartSuggestions: [],
  conversionFunnel: [],
  topSuppliers: [],
  negotiationInsights: [],
  recentNeeds: [],
  recentSupplies: [],
};


// ============================================================
// Helpers
// ============================================================

function getApiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:8000/api';

  return url.replace(/\/+$/, '');
}


function normalizeDashboardData(
  data: DashboardApiResponse | null,
): DashboardData {
  if (!data) {
    return EMPTY_DASHBOARD_DATA;
  }

  const stats = data.stats || {};
  const totalProducts = Number(stats.totalProducts ?? 0);
  const activeNeeds = Number(stats.activeNeeds ?? 0);
  const ongoingNegotiations = Number(stats.ongoingNegotiations ?? 0);
  const successfulDeals = Number(stats.successfulDeals ?? 0);
  const totalActivities = totalProducts + activeNeeds + ongoingNegotiations + successfulDeals;

  let successRate = 0;
  const totalNegotiations = ongoingNegotiations + successfulDeals;
  if (totalNegotiations > 0) {
    successRate = Math.round((successfulDeals / totalNegotiations) * 100);
  }

  return {
    stats: {
      totalProducts,
      activeNeeds,
      ongoingNegotiations,
      successfulDeals,
      totalActivities,
      successRate,
    },
    industryData: Array.isArray(data.industryData) ? data.industryData : [],
    monthlyDeals: Array.isArray(data.monthlyDeals) ? data.monthlyDeals : [],
    recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : [],
    smartSuggestions: Array.isArray(data.smartSuggestions) ? data.smartSuggestions : [],
    conversionFunnel: Array.isArray(data.conversionFunnel) ? data.conversionFunnel : [],
    topSuppliers: Array.isArray(data.topSuppliers) ? data.topSuppliers : [],
    negotiationInsights: Array.isArray(data.negotiationInsights) ? data.negotiationInsights : [],
    recentNeeds: Array.isArray(data.recentNeeds) ? data.recentNeeds : [],
    recentSupplies: Array.isArray(data.recentSupplies) ? data.recentSupplies : [],
  };
}


function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'پیش‌نویس',
    pending: 'در انتظار',
    published: 'منتشر شده',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    in_progress: 'در حال مذاکره',
    completed: 'تکمیل شده',
    closed: 'بسته شده',
    active: 'فعال',
    in_negotiation: 'در حال مذاکره',
    contracted: 'قرارداد',
    executing: 'در حال اجرا',
    submitted: 'ارسال شده',
    evaluating: 'در حال بررسی',
    needs_revision: 'نیازمند اصلاح',
    suspended: 'تعلیق',
  };
  return map[status] || status || 'نامشخص';
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-teal-100 text-teal-700',
    closed: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    in_negotiation: 'bg-orange-100 text-orange-700',
    contracted: 'bg-indigo-100 text-indigo-700',
    executing: 'bg-cyan-100 text-cyan-700',
    submitted: 'bg-blue-100 text-blue-700',
    evaluating: 'bg-purple-100 text-purple-700',
    needs_revision: 'bg-orange-100 text-orange-700',
    suspended: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-slate-100 text-slate-600';
}


// ============================================================
// Component
// ============================================================

export default function DashboardPage() {

  const router = useRouter();

  const user =
    useAuthStore((state) => state.user);

  const isAuthenticated =
    useAuthStore(
      (state) => state.isAuthenticated,
    );


  const [
    mounted,
    setMounted,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    apiError,
    setApiError,
  ] = useState<string | null>(null);


  const [
    data,
    setData,
  ] = useState<DashboardData>(
    EMPTY_DASHBOARD_DATA,
  );


  const [
    logoError,
    setLogoError,
  ] = useState(false);


  const [
    greeting,
    setGreeting,
  ] = useState('');


  const [
    showMatchModal,
    setShowMatchModal,
  ] = useState(false);


  // ==========================================================
  // Mount
  // ==========================================================

  useEffect(() => {
    setMounted(true);

    const hour =
      new Date().getHours();

    if (hour < 12) {
      setGreeting('صبح بخیر ☀️');
    } else if (hour < 17) {
      setGreeting('ظهر بخیر 🌤️');
    } else if (hour < 21) {
      setGreeting('عصر بخیر 🌅');
    } else {
      setGreeting('شب بخیر 🌙');
    }
  }, []);


  // ==========================================================
  // Dashboard API
  // ==========================================================

  const fetchDashboardData =
    useCallback(
      async (
        fullLoading = true,
      ) => {

        if (!isAuthenticated) {
          setLoading(false);
          return;
        }


        try {

          if (fullLoading) {
            setLoading(true);
          }


          setApiError(null);


          const apiBaseUrl =
            getApiBaseUrl();


          const endpoint =
            `${apiBaseUrl}/analytics/dashboard/`;


          console.log(
            '[Dashboard] GET:',
            endpoint,
          );


          const response =
            await authenticatedFetch(
              endpoint,
              {
                method: 'GET',
                cache: 'no-store',
                headers: {
                  Accept:
                    'application/json',
                },
              },
            );


          console.log(
            '[Dashboard] Status:',
            response.status,
          );


          if (!response.ok) {

            const text =
              await response
                .text()
                .catch(
                  () => '',
                );


            console.error(
              '[Dashboard] Error:',
              response.status,
              text,
            );


            if (
              response.status === 401
            ) {

              setApiError(
                'نشست کاربری معتبر نیست. لطفاً دوباره وارد شوید.',
              );

            } else if (
              response.status === 404
            ) {

              setApiError(
                'API داشبورد در بک‌اند پیدا نشد. مسیر مورد انتظار /api/analytics/dashboard/ است.',
              );

            } else {

              setApiError(
                `خطا در دریافت داشبورد. کد خطا: ${response.status}`,
              );
            }


            return;
          }


          const result =
            await response.json();


          console.log(
            '[Dashboard] Data:',
            result,
          );


          const normalized =
            normalizeDashboardData(
              result,
            );


          setData(normalized);

        } catch (error) {

          console.error(
            '[Dashboard] Network error:',
            error,
          );


          setApiError(
            'ارتباط با سرور داشبورد برقرار نشد.',
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [
        isAuthenticated,
      ],
    );


  // ==========================================================
  // Initial fetch
  // ==========================================================

  useEffect(() => {

    if (!mounted) {
      return;
    }


    if (!isAuthenticated) {

      setLoading(false);

      return;
    }


    fetchDashboardData(true);

  }, [
    mounted,
    isAuthenticated,
    fetchDashboardData,
  ]);


  // ==========================================================
  // Refresh
  // ==========================================================

  const handleRefresh =
    useCallback(() => {

      setRefreshing(true);

      fetchDashboardData(false);

    }, [
      fetchDashboardData,
    ]);


  // ==========================================================
  // Smart Intelligence
  // ==========================================================

  const intelligence =
    useMemo(() => {

      const stats =
        data.stats;


      const totalActivity =
        stats.totalActivities ||
        stats.activeNeeds +
        stats.totalProducts +
        stats.ongoingNegotiations +
        stats.successfulDeals;


      const successRate =
        stats.successRate ?? 0;


      const activityBalance =
        stats.totalProducts +
        stats.activeNeeds;


      let title =
        'وضعیت فعالیت حساب شما';


      let description =
        'برای تحلیل دقیق‌تر، داده‌های بیشتری در حساب شما لازم است.';


      let icon =
        Sparkles;

      let variant: 'success' | 'warning' | 'info' | 'default' = 'default';


      if (
        stats.successfulDeals > 0 &&
        successRate >= 50
      ) {

        title =
          'عملکرد معاملاتی مناسب 🚀';


        description =
          `بر اساس داده‌های فعلی، ${successRate}% از مجموع معاملات جاری و موفق شما در وضعیت موفق قرار دارد.`;
        
        icon =
          TrendingUp;

        variant = 'success';

      } else if (
        stats.ongoingNegotiations > 0
      ) {

        title =
          'تمرکز فعلی روی مذاکره 📋';


        description =
          `در حال حاضر ${stats.ongoingNegotiations} مذاکره فعال دارید. تمرکز روی تبدیل مذاکرات جاری به معامله موفق بیشترین اثر را روی عملکرد شما دارد.`;

        icon =
          Target;

        variant = 'warning';

      } else if (
        stats.activeNeeds > 0 &&
        stats.totalProducts === 0
      ) {

        title =
          'فرصت مناسب برای تکمیل سمت عرضه ⚡';


        description =
          `شما ${stats.activeNeeds} نیاز فعال دارید اما محصول فعالی ثبت نشده است. تکمیل بخش عرضه می‌تواند فرآیند تطبیق را تقویت کند.`;

        icon =
          Lightbulb;

        variant = 'info';

      } else if (
        stats.totalProducts > 0 &&
        stats.activeNeeds === 0
      ) {

        title =
          'نیازهای بازار را بیشتر دنبال کنید 🔍';


        description =
          `شما ${stats.totalProducts} محصول فعال دارید اما نیاز فعالی ثبت نشده است. بررسی نیازهای بازار می‌تواند فرصت‌های جدیدی ایجاد کند.`;

        icon =
          Search;

        variant = 'info';

      } else if (
        activityBalance > 0
      ) {

        title =
          'حساب شما در حال فعالیت است 📊';


        description =
          'برای ایجاد تحلیل هوشمندتر، ادامه فعالیت در بخش نیازها، محصولات و مذاکرات باعث افزایش کیفیت تحلیل خواهد شد.';

        icon =
          Activity;

        variant = 'default';
      }


      return {
        title,
        description,
        icon,
        variant,
        successRate,
        totalActivity,
      };

    }, [
      data.stats,
    ]);


  // ==========================================================
  // Role
  // ==========================================================

  const roleMap: Record<
    string,
    string
  > = {

    admin:
      'مدیر پلتفرم',

    buyer:
      'خریدار',

    seller:
      'عرضه‌کننده',

    consultant:
      'مشاور',

    investor:
      'سرمایه‌گذار',

    broker:
      'کارگزار',

    partner:
      'سازمان همکار',
  };


  const userName =
    user?.first_name ||
    user?.username ||
    'کاربر بازار تحول';


  const userRole =
    user?.role || '';


  const companyName =
    user?.company_name || '';


  // ==========================================================
  // Authentication
  // ==========================================================

  if (
    mounted &&
    !isAuthenticated
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">

          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-1">

            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">

              {!logoError ? (

                <Image
                  src="/logo.png"
                  alt="بازار تحول"
                  width={80}
                  height={80}
                  className="object-contain p-2"
                  onError={() =>
                    setLogoError(true)
                  }
                />

              ) : (

                <span className="font-black text-3xl text-[#1E3A8A]">
                  ب ت
                </span>

              )}

            </div>

          </div>


          <h2 className="text-2xl font-black text-slate-800">
            ورود به داشبورد
          </h2>


          <p className="text-sm text-slate-500 mt-3 mb-6">
            برای مشاهده اطلاعات شخصی و تحلیل هوشمند حساب خود وارد شوید.
          </p>


          <Link
            href="/login?next=/dashboard"
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold"
          >
            ورود به حساب
          </Link>

        </div>

      </div>
    );
  }


  // ==========================================================
  // Loading
  // ==========================================================

  if (
    !mounted ||
    loading
  ) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] animate-pulse flex items-center justify-center">

            <Sparkles className="w-7 h-7 text-white" />

          </div>


          <p className="mt-5 text-slate-500">
            در حال تحلیل اطلاعات داشبورد...
          </p>

        </div>

      </div>
    );
  }


  const stats =
    data.stats;


  // ==========================================================
  // Render
  // ==========================================================

  return (

    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8"
    >

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white p-6 md:p-8 mb-6 shadow-xl">

        <div className="absolute inset-0 opacity-10 pointer-events-none">

          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white rounded-full blur-3xl" />

          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white rounded-full blur-3xl" />

        </div>


        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-1 shadow-lg border border-white/20 shrink-0">

              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">

                {!logoError ? (

                  <Image
                    src="/logo.png"
                    alt="بازار تحول"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain p-1"
                    onError={() =>
                      setLogoError(true)
                    }
                  />

                ) : (

                  <span className="font-black text-xl text-[#1E3A8A]">
                    ب ت
                  </span>

                )}

              </div>

            </div>


            <div>

              <p className="text-sm text-white/80">
                {greeting}
              </p>


              <h1 className="text-2xl md:text-3xl font-black">
                {userName}
              </h1>


              <div className="flex flex-wrap gap-2 mt-2">

                {companyName && (

                  <span className="flex items-center gap-1 text-xs bg-white/15 px-3 py-1 rounded-full">

                    <Building2 className="w-3 h-3" />

                    {companyName}

                  </span>

                )}


                {userRole && (

                  <span className="flex items-center gap-1 text-xs bg-white/15 px-3 py-1 rounded-full">

                    <Award className="w-3 h-3" />

                    {roleMap[userRole] || userRole}

                  </span>

                )}

              </div>

            </div>

          </div>


          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-50 border border-white/20 transition"
            >

              <RefreshCw
                className={`w-4 h-4 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />

              بروزرسانی

            </button>

          </div>

        </div>


        {/* ====================================================
            STATS
            ==================================================== */}

        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">

          {[
            {
              label: 'محصولات فعال',
              value: stats.totalProducts,
              icon: Package,
              color: 'text-blue-300',
            },

            {
              label: 'نیازهای فعال',
              value: stats.activeNeeds,
              icon: Lightbulb,
              color: 'text-yellow-300',
            },

            {
              label: 'مذاکرات جاری',
              value: stats.ongoingNegotiations,
              icon: MessageSquare,
              color: 'text-teal-300',
            },

            {
              label: 'معاملات موفق',
              value: stats.successfulDeals,
              icon: CheckCircle,
              color: 'text-green-300',
            },
          ].map(
            (
              item,
              index,
            ) => {

              const Icon =
                item.icon;

              return (

                <div
                  key={index}
                  className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm p-4 hover:bg-white/15 transition"
                >

                  <div className="flex items-center justify-between">

                    <Icon className={`w-5 h-5 ${item.color}`} />

                    {index === 3 && stats.successRate !== undefined && stats.successRate > 0 && (
                      <span className="text-xs bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full">
                        {stats.successRate}%
                      </span>
                    )}

                  </div>


                  <div className="text-3xl font-black mt-2">
                    {item.value}
                  </div>


                  <div className="text-xs text-white/70 mt-1">
                    {item.label}
                  </div>

                </div>
              );
            },
          )}

        </div>

      </div>


      {/* ======================================================
          API ERROR
          ====================================================== */}

      {apiError && (

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">

          <div className="flex items-start gap-3">

            <span className="text-xl">
              ⚠️
            </span>

            <div>

              <p className="font-bold">
                اطلاعات زنده داشبورد در دسترس نیست
              </p>

              <p className="text-sm mt-1">
                {apiError}
              </p>

            </div>

          </div>

        </div>
      )}


      {/* ======================================================
          AI INTELLIGENCE
          ====================================================== */}

      <div className="mb-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-6">

          <div className="flex items-start gap-4">

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              intelligence.variant === 'success' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
              intelligence.variant === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
              intelligence.variant === 'info' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
              'bg-gradient-to-br from-[#14B8A6] to-[#1E3A8A]'
            }`}>

              {(() => {
                const Icon = intelligence.icon;
                return <Icon className="w-6 h-6 text-white" />;
              })()}

            </div>


            <div className="flex-1">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                <div>

                  <p className="text-xs font-bold text-[#14B8A6]">
                    SMART BUSINESS INSIGHT
                  </p>

                  <h2 className="text-xl font-black text-slate-800 mt-1">
                    {intelligence.title}
                  </h2>

                </div>


                {intelligence.successRate > 0 && (

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700">

                    <TrendingUp className="w-4 h-4" />

                    <span className="text-sm font-bold">
                      نرخ موفقیت {intelligence.successRate}٪
                    </span>

                  </div>

                )}

              </div>


              <p className="text-sm text-slate-500 mt-3 leading-7">
                {intelligence.description}
              </p>

            </div>

          </div>

        </div>


        <div className="grid grid-cols-2 md:grid-cols-5 border-t border-slate-100 divide-x divide-slate-100">

          <div className="p-4">

            <p className="text-xs text-slate-400">
              فعالیت کل
            </p>

            <p className="text-xl font-black text-slate-800 mt-1">
              {intelligence.totalActivity}
            </p>

          </div>


          <div className="p-4">

            <p className="text-xs text-slate-400">
              محصولات
            </p>

            <p className="text-xl font-black text-slate-800 mt-1">
              {stats.totalProducts}
            </p>

          </div>


          <div className="p-4">

            <p className="text-xs text-slate-400">
              نیازها
            </p>

            <p className="text-xl font-black text-slate-800 mt-1">
              {stats.activeNeeds}
            </p>

          </div>


          <div className="p-4">

            <p className="text-xs text-slate-400">
              مذاکرات
            </p>

            <p className="text-xl font-black text-slate-800 mt-1">
              {stats.ongoingNegotiations}
            </p>

          </div>


          <div className="p-4">

            <p className="text-xs text-slate-400">
              معاملات موفق
            </p>

            <p className="text-xl font-black text-slate-800 mt-1">
              {stats.successfulDeals}
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          QUICK ACTIONS
          ====================================================== */}

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">

        <div className="flex items-center gap-2 mb-5">

          <Zap className="w-5 h-5 text-[#F59E0B]" />

          <h2 className="text-lg font-black text-slate-800">
            دسترسی سریع
          </h2>

        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {[
            {
              label: 'ثبت محصول',
              href: '/supply/register',
              icon: Package,
              color: 'from-blue-500 to-indigo-600',
            },

            {
              label: 'ثبت نیاز',
              href: '/needs/register',
              icon: Lightbulb,
              color: 'from-amber-500 to-orange-600',
            },

            {
              label: 'تطبیق هوشمند',
              icon: Target,
              color: 'from-teal-500 to-emerald-600',
              isButton: true,
              onClick: () => setShowMatchModal(true),
            },

            {
              label: 'تحلیل بازار',
              href: '/market-intelligence',
              icon: BarChart3,
              color: 'from-purple-500 to-pink-600',
            },
          ].map(
            (
              item,
              index,
            ) => {

              const Icon =
                item.icon;

              if (item.isButton) {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition group text-right relative overflow-hidden"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-[#1E3A8A]">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.href!}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition group text-right relative overflow-hidden"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-[#1E3A8A]">
                    {item.label}
                  </span>
                </Link>
              );
            },
          )}

        </div>

      </div>


      {/* ======================================================
          MAIN GRID
          ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


        {/* ====================================================
            LEFT COLUMN (2/3)
            ==================================================== */}

        <div className="lg:col-span-2 space-y-6">


          {/* ==================================================
              MONTHLY DEALS
              ================================================== */}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

            <div className="flex items-center justify-between mb-5">

              <div>

                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">

                  <TrendingUp className="w-5 h-5 text-[#14B8A6]" />

                  روند معاملات
                </h2>

                <p className="text-xs text-slate-400 mt-1">
                  معاملات تکمیل‌شده بر اساس داده واقعی
                </p>

              </div>

              {data.monthlyDeals.length > 0 && (
                <span className="text-xs text-slate-400">
                  {data.monthlyDeals.reduce((sum, d) => sum + d.deals, 0).toLocaleString('fa-IR')} معامله
                </span>
              )}

            </div>


            {data.monthlyDeals.length === 0 ? (

              <div className="h-[260px] flex items-center justify-center">

                <div className="text-center">

                  <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                  <p className="text-sm text-slate-400">
                    هنوز داده‌ای برای نمایش روند معاملات وجود ندارد.
                  </p>

                </div>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <AreaChart
                  data={data.monthlyDeals}
                >

                  <defs>

                    <linearGradient
                      id="dealGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopColor="#14B8A6"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="#14B8A6"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>


                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                  />


                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                    }}
                  />


                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                    }}
                  />


                  <Tooltip />


                  <Area
                    type="monotone"
                    dataKey="deals"
                    stroke="#14B8A6"
                    fill="url(#dealGradient)"
                    strokeWidth={3}
                  />

                </AreaChart>

              </ResponsiveContainer>

            )}

          </div>


          {/* ==================================================
              RECENT NEEDS & SUPPLIES (اخیر = ۵ مورد آخر)
              ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Recent Needs */}

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">

                  <Target className="w-4 h-4 text-[#1E3A8A]" />

                  نیازهای اخیر
                </h3>

                <Link
                  href="/profile?tab=myNeeds"
                  className="text-xs text-[#14B8A6] hover:underline flex items-center gap-1"
                >
                  مشاهده همه
                  <ChevronRight size={14} />
                </Link>

              </div>

              {(data.recentNeeds && data.recentNeeds.length > 0) ? (

                <div className="space-y-3">

                  {data.recentNeeds.slice(0, 5).map((need) => (

                    <div
                      key={need.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {need.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {need.industry && (
                            <span className="text-xs text-slate-400">
                              {need.industry}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(need.status)}`}>
                            {getStatusLabel(need.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* دکمه تطبیق هوشمند برای هر نیاز */}
                        <Link
                          href={`/matching/${need.id}`}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                          title="تطبیق هوشمند"
                        >
                          <Target size={14} />
                        </Link>
                        <span className="text-xs text-slate-400">
                          {new Date(need.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>

                  ))}

                </div>

              ) : (

                <div className="text-center py-6">

                  <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                  <p className="text-sm text-slate-400">
                    هیچ نیازی ثبت نشده است
                  </p>

                  <Link
                    href="/needs/register"
                    className="text-xs text-[#1E3A8A] hover:underline mt-1 inline-block"
                  >
                    ثبت نیاز جدید
                  </Link>

                </div>

              )}

            </div>


            {/* Recent Supplies */}

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">

                  <Package className="w-4 h-4 text-[#1E3A8A]" />

                  محصولات اخیر
                </h3>

                <Link
                  href="/profile?tab=myProducts"
                  className="text-xs text-[#14B8A6] hover:underline flex items-center gap-1"
                >
                  مشاهده همه
                  <ChevronRight size={14} />
                </Link>

              </div>

              {(data.recentSupplies && data.recentSupplies.length > 0) ? (

                <div className="space-y-3">

                  {data.recentSupplies.slice(0, 5).map((supply) => (

                    <div
                      key={supply.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                    >

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-medium text-slate-800 truncate">
                          {supply.title}
                        </p>

                        <div className="flex items-center gap-2 mt-1">

                          {supply.category && (
                            <span className="text-xs text-slate-400">
                              {supply.category}
                            </span>
                          )}

                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(supply.status)}`}>
                            {getStatusLabel(supply.status)}
                          </span>

                        </div>

                      </div>

                      <div className="text-xs text-slate-400 shrink-0 mr-2">
                        {new Date(supply.created_at).toLocaleDateString('fa-IR')}
                      </div>

                    </div>

                  ))}

                </div>

              ) : (

                <div className="text-center py-6">

                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                  <p className="text-sm text-slate-400">
                    هیچ محصولی ثبت نشده است
                  </p>

                  <Link
                    href="/supply/register"
                    className="text-xs text-[#1E3A8A] hover:underline mt-1 inline-block"
                  >
                    ثبت محصول جدید
                  </Link>

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              RECENT ACTIVITIES
              ================================================== */}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-5">

              <Clock className="w-5 h-5 text-[#1E3A8A]" />

              آخرین فعالیت‌ها
            </h2>


            {data.recentActivities.length === 0 ? (

              <div className="py-10 text-center">

                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                <p className="text-sm text-slate-400">
                  هنوز فعالیتی برای شما ثبت نشده است.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {data.recentActivities.slice(0, 5).map(
                  (
                    activity,
                  ) => (

                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                    >

                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">

                        {activity.type === 'negotiation' ? (
                          <MessageSquare className="w-5 h-5 text-[#1E3A8A]" />
                        ) : activity.type === 'need' ? (
                          <Target className="w-5 h-5 text-amber-500" />
                        ) : activity.type === 'supply' ? (
                          <Package className="w-5 h-5 text-emerald-500" />
                        ) : activity.type === 'deal' ? (
                          <CheckCircle className="w-5 h-5 text-teal-500" />
                        ) : (
                          <Activity className="w-5 h-5 text-slate-400" />
                        )}

                      </div>


                      <div className="flex-1 min-w-0">

                        <p className="font-bold text-sm text-slate-800 truncate">
                          {activity.title}
                        </p>

                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>{activity.user}</span>
                          {activity.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                              {getStatusLabel(activity.status)}
                            </span>
                          )}
                          {activity.amount && (
                            <span className="text-emerald-600 font-medium">
                              {activity.amount}
                            </span>
                          )}
                        </p>

                      </div>


                      <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                        {formatActivityTime(
                          activity.time,
                        )}
                      </span>

                    </div>
                  ),
                )}

              </div>

            )}

          </div>

        </div>


        {/* ====================================================
            RIGHT COLUMN (1/3)
            ==================================================== */}

        <div className="space-y-6">


          {/* ==================================================
              SMART SUGGESTIONS
              ================================================== */}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">

                <Sparkles className="w-4 h-4 text-[#F59E0B]" />

                پیشنهادات هوشمند
              </h2>

              <span className="text-[10px] text-slate-400">
                {data.smartSuggestions.length} مورد
              </span>

            </div>


            {data.smartSuggestions.length === 0 ? (

              <div className="py-8 text-center">

                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />

                <p className="text-xs text-slate-400 leading-6">
                  پس از ثبت داده‌های بیشتر، سیستم می‌تواند پیشنهادهای شخصی‌سازی‌شده ارائه کند.
                </p>

              </div>

            ) : (

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">

                {data.smartSuggestions.map(
                  (
                    item,
                    index,
                  ) => {

                    const bgColor = item.type === 'need' ? 'bg-amber-50 border-amber-200' :
                                    item.type === 'supply' ? 'bg-emerald-50 border-emerald-200' :
                                    item.type === 'opportunity' ? 'bg-purple-50 border-purple-200' :
                                    'bg-slate-50 border-slate-200';

                    const textColor = item.match >= 80 ? 'text-emerald-600' :
                                     item.match >= 60 ? 'text-amber-600' :
                                     'text-slate-500';

                    return (
                      <div
                        key={`${item.title}-${index}`}
                        className={`rounded-2xl border ${bgColor} p-4 transition hover:shadow-sm`}
                      >

                        <div className="flex items-center justify-between gap-2">

                          <p className="font-bold text-sm text-slate-800 flex-1">
                            {item.title}
                          </p>


                          <span className={`text-xs font-black ${textColor}`}>
                            {item.match}٪
                          </span>

                        </div>


                        <p className="text-xs text-slate-500 mt-2 leading-6">
                          {item.reason}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>


          {/* ==================================================
              FUNNEL
              ================================================== */}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-5">

              <Layers className="w-4 h-4 text-[#14B8A6]" />

              قیف مذاکرات
            </h2>


            {data.conversionFunnel.length === 0 ? (

              <div className="py-8 text-center">

                <Target className="w-8 h-8 text-slate-300 mx-auto mb-3" />

                <p className="text-xs text-slate-400">
                  داده‌ای برای تشکیل قیف مذاکرات وجود ندارد.
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {data.conversionFunnel.map(
                  (
                    item,
                    index,
                  ) => {

                    const colors = [
                      'from-[#1E3A8A] to-blue-600',
                      'from-blue-500 to-blue-400',
                      'from-teal-500 to-cyan-500',
                      'from-emerald-500 to-teal-500',
                      'from-green-400 to-emerald-400',
                    ];

                    const colorIndex = Math.min(index, colors.length - 1);

                    return (
                      <div
                        key={`${item.label}-${index}`}
                      >

                        <div className="flex justify-between mb-1">

                          <span className="text-xs text-slate-600">
                            {item.label}
                          </span>


                          <span className="text-xs font-black text-[#1E3A8A]">
                            {item.value}
                          </span>

                        </div>


                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colors[colorIndex]}`}
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    Number(
                                      item.percent,
                                    ),
                                  ),
                                )}%`,
                            }}
                          />

                        </div>

                      </div>
                    );
                  },
                )}

              </div>

            )}

          </div>


          {/* ==================================================
              TOP SUPPLIERS
              ================================================== */}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-5">

              <Star className="w-4 h-4 text-[#F59E0B]" />

              برترین طرف‌های معامله
            </h2>


            {data.topSuppliers.length === 0 ? (

              <div className="py-8 text-center">

                <Star className="w-8 h-8 text-slate-300 mx-auto mb-3" />

                <p className="text-xs text-slate-400">
                  هنوز معامله تکمیل‌شده‌ای برای نمایش وجود ندارد.
                </p>

              </div>

            ) : (

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">

                {data.topSuppliers.slice(0, 5).map(
                  (
                    supplier,
                    index,
                  ) => (

                    <div
                      key={`${supplier.name}-${index}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                    >

                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] text-white flex items-center justify-center text-xs font-black">
                          {index + 1}
                        </div>


                        <div>

                          <p className="text-sm font-bold text-slate-700">
                            {supplier.name}
                          </p>

                          <div className="flex items-center gap-2">

                            {supplier.industry && (
                              <span className="text-[10px] text-slate-400">
                                {supplier.industry}
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400">
                              {supplier.deals} معامله
                            </span>

                          </div>

                        </div>

                      </div>


                      {supplier.score > 0 && (

                        <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                          {supplier.score}
                        </span>

                      )}

                    </div>
                  ),
                )}

              </div>

            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          MODAL: تطبیق هوشمند
          ====================================================== */}

      {showMatchModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowMatchModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMatchModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 transition text-slate-500"
            >
              <X size={24} />
            </button>

            <div className="text-center mt-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2">
                انتخاب نیاز برای تطبیق هوشمند
              </h3>

              <p className="text-sm text-slate-500 leading-7">
                برای استفاده از تطبیق هوشمند، ابتدا یکی از نیازهای ثبت‌شده خود را انتخاب کنید.
                <br />
                سپس می‌توانید بهترین شرکا و محصولات مرتبط را پیدا کنید.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowMatchModal(false);
                    router.push('/profile?tab=myNeeds');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold hover:shadow-lg transition"
                >
                  رفتن به لیست نیازها
                </button>
                <button
                  onClick={() => setShowMatchModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


// ============================================================
// Activity Time
// ============================================================

function formatActivityTime(
  value: string,
): string {

  if (!value) {
    return '';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return value;
  }


  const now =
    new Date();


  const diffMinutes =
    Math.floor(
      (
        now.getTime() -
        date.getTime()
      ) / 60000,
    );


  if (diffMinutes < 1) {
    return 'همین الان';
  }


  if (diffMinutes < 60) {
    return `${diffMinutes} دقیقه پیش`;
  }


  const diffHours =
    Math.floor(
      diffMinutes / 60,
    );


  if (diffHours < 24) {
    return `${diffHours} ساعت پیش`;
  }


  const diffDays =
    Math.floor(
      diffHours / 24,
    );


  if (diffDays < 7) {
    return `${diffDays} روز پیش`;
  }


  return date.toLocaleDateString(
    'fa-IR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  );
}