'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Lightbulb,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Search,
  BarChart3,
  Activity,
  Award,
  Zap,
  Target,
  Building2,
  PieChart,
  Sparkles,
  Star,
} from 'lucide-react';

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import { useAuthStore } from '@/store/auth-store';

const COLORS = [
  '#1E3A8A',
  '#14B8A6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

/* =========================================================
   Mock / Fallback Data
   ========================================================= */

const MOCK_DATA = {
  stats: {
    totalProducts: 124,
    activeNeeds: 87,
    ongoingNegotiations: 34,
    successfulDeals: 156,
  },

  industryData: [
    { name: 'نفت و گاز', value: 45 },
    { name: 'فناوری اطلاعات', value: 38 },
    { name: 'سلامت', value: 29 },
    { name: 'کشاورزی', value: 22 },
    { name: 'خودروسازی', value: 18 },
    { name: 'سایر', value: 33 },
  ],

  monthlyDeals: [
    { month: 'فروردین', deals: 12 },
    { month: 'اردیبهشت', deals: 19 },
    { month: 'خرداد', deals: 15 },
    { month: 'تیر', deals: 27 },
    { month: 'مرداد', deals: 31 },
    { month: 'شهریور', deals: 25 },
  ],

  recentActivities: [
    {
      id: 1,
      type: 'product',
      title: 'سامانه مدیریت انرژی هوشمند',
      user: 'شرکت فناوران انرژی',
      time: '۲ ساعت پیش',
    },
    {
      id: 2,
      type: 'need',
      title: 'بهینه‌سازی مصرف آب در صنایع',
      user: 'سازمان آب منطقه‌ای',
      time: '۵ ساعت پیش',
    },
    {
      id: 3,
      type: 'negotiation',
      title: 'مذاکره برای تأمین تجهیزات',
      user: 'پتروشیمی',
      time: 'روز گذشته',
    },
    {
      id: 4,
      type: 'deal',
      title: 'انعقاد قرارداد همکاری',
      user: 'شرکت دانش‌بنیان',
      time: '۲ روز پیش',
    },
  ],

  smartSuggestions: [
    {
      title: 'همکاری با عرضه‌کننده باتری',
      match: 92,
      reason: 'بر اساس نیازهای قبلی شما',
    },
    {
      title: 'پروژه کاهش مصرف انرژی',
      match: 85,
      reason: 'همخوانی با صنعت شما',
    },
    {
      title: 'دوره آموزشی مدیریت ریسک',
      match: 78,
      reason: 'توصیه شده برای نقش شما',
    },
  ],

  conversionFunnel: [
    {
      label: 'بازدید از صفحه',
      value: 2450,
      percent: 100,
    },
    {
      label: 'ثبت درخواست',
      value: 980,
      percent: 40,
    },
    {
      label: 'مذاکره',
      value: 340,
      percent: 14,
    },
    {
      label: 'انعقاد قرارداد',
      value: 156,
      percent: 6,
    },
  ],

  topSuppliers: [
    {
      name: 'شرکت صنایع نوین',
      score: 4.9,
      deals: 28,
    },
    {
      name: 'تجهیزات پیشرو',
      score: 4.8,
      deals: 24,
    },
    {
      name: 'فناوران پایدار',
      score: 4.7,
      deals: 22,
    },
    {
      name: 'سیستم‌های هوشمند',
      score: 4.6,
      deals: 19,
    },
  ],
};

/* =========================================================
   Types
   ========================================================= */

type DashboardData = typeof MOCK_DATA;

type AuthUser = {
  first_name?: string;
  username?: string;
  role?: string;
  company_name?: string;
};

type AuthStoreShape = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  accessToken?: string | null;
  token?: string | null;
  access?: string | null;
  jwt?: string | null;
};

/* =========================================================
   Helpers
   ========================================================= */

function getApiBaseUrl(): string {
  /*
   * .env.local فعلی شما:
   *
   * NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   *
   * بنابراین اول همین متغیر استفاده می‌شود.
   *
   * NEXT_PUBLIC_API_BASE_URL نیز پشتیبانی می‌شود تا
   * اگر قبلاً در بخشی از پروژه استفاده شده بود، چیزی خراب نشود.
   */

  const configured =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:8000/api';

  return configured.replace(/\/+$/, '');
}

function getAccessToken(auth: AuthStoreShape): string | null {
  /*
   * برای سازگاری با نسخه‌های مختلف auth-store
   * چند نام رایج را بررسی می‌کنیم.
   */

  const candidates = [
    auth.accessToken,
    auth.token,
    auth.access,
    auth.jwt,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  /*
   * fallback برای زمانی که store توکن را نگه نمی‌دارد
   * ولی قبلاً در localStorage ذخیره شده است.
   */

  if (typeof window !== 'undefined') {
    const storageKeys = [
      'accessToken',
      'access_token',
      'token',
      'jwt',
    ];

    for (const key of storageKeys) {
      const value = window.localStorage.getItem(key);

      if (value && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}

function mergeDashboardData(
  incoming: Partial<DashboardData>,
): DashboardData {
  return {
    stats: incoming.stats || MOCK_DATA.stats,
    industryData: incoming.industryData || MOCK_DATA.industryData,
    monthlyDeals: incoming.monthlyDeals || MOCK_DATA.monthlyDeals,
    recentActivities:
      incoming.recentActivities || MOCK_DATA.recentActivities,
    smartSuggestions:
      incoming.smartSuggestions || MOCK_DATA.smartSuggestions,
    conversionFunnel:
      incoming.conversionFunnel || MOCK_DATA.conversionFunnel,
    topSuppliers:
      incoming.topSuppliers || MOCK_DATA.topSuppliers,
  };
}

/* =========================================================
   Dashboard
   ========================================================= */

export default function DashboardPage() {
  const auth = useAuthStore() as AuthStoreShape;

  const {
    user,
    isAuthenticated,
  } = auth;

  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [logoError, setLogoError] = useState(false);

  const [data, setData] =
    useState<DashboardData>(MOCK_DATA);

  const [loading, setLoading] = useState(true);

  const [apiError, setApiError] = useState<string | null>(null);

  /* =======================================================
     Mount + Greeting

     IMPORTANT:
     این useEffect dependency ندارد و فقط یک بار اجرا می‌شود.
     ======================================================= */

  useEffect(() => {
    setMounted(true);

    const hour = new Date().getHours();

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

  /* =======================================================
     Dashboard API

     IMPORTANT:
     dependency array ثابت است:

       [mounted, isAuthenticated]

     هرگز در renderهای مختلف تعداد dependencyها تغییر نمی‌کند.
     ======================================================= */

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboardData = async () => {
      const apiBaseUrl = getApiBaseUrl();

      const endpoint = `${apiBaseUrl}/dashboard/`;

      try {
        setLoading(true);
        setApiError(null);

        /*
         * برای گرفتن توکن، store فعلی را می‌خوانیم.
         */
        const token = getAccessToken(auth);

        /*
         * لاگ تشخیصی که خواسته بودی.
         * اطلاعات حساس توکن چاپ نمی‌شود.
         */
        console.log('[Dashboard] API endpoint:', endpoint);
        console.log(
          '[Dashboard] Authenticated:',
          isAuthenticated,
        );
        console.log(
          '[Dashboard] Access token available:',
          Boolean(token),
        );

        const startedAt = performance.now();

        const response = await fetch(endpoint, {
          method: 'GET',

          headers: {
            Accept: 'application/json',

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          /*
           * چون JWT استفاده می‌کنیم، نیازی به cookie نداریم.
           */
          credentials: 'omit',

          cache: 'no-store',
        });

        const elapsed = performance.now() - startedAt;

        console.timeEnd('[Dashboard] API request');

        console.log(
          '[Dashboard] API response:',
          response.status,
          `${Math.round(elapsed)}ms`,
        );

        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => '');

          console.error(
            '[Dashboard] API error:',
            response.status,
            errorText,
          );

          /*
           * 401 یعنی احراز هویت API توکن را نگرفته/قبول نکرده.
           *
           * در این حالت صفحه را خراب نمی‌کنیم.
           */
          if (response.status === 401) {
            if (!cancelled) {
              setApiError(
                'احراز هویت داشبورد انجام نشد. لطفاً یک‌بار خارج شوید و دوباره وارد شوید.',
              );
            }

            return;
          }

          if (response.status === 404) {
            if (!cancelled) {
              setApiError(
                'مسیر API داشبورد پیدا نشد. مسیر مورد انتظار: /api/dashboard/',
              );
            }

            return;
          }

          if (!cancelled) {
            setApiError(
              `خطا در دریافت اطلاعات داشبورد (${response.status})`,
            );
          }

          return;
        }

        const result = await response.json();

        console.log(
          '[Dashboard] API data received:',
          result,
        );

        if (cancelled) {
          return;
        }

        if (
          result &&
          typeof result === 'object' &&
          result.stats
        ) {
          setData(
            mergeDashboardData(
              result as Partial<DashboardData>,
            ),
          );
        } else {
          console.warn(
            '[Dashboard] API response has no valid stats. Using fallback data.',
          );

          setData(MOCK_DATA);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          '[Dashboard] fetch failed:',
          error,
        );

        setApiError(
          'ارتباط با سرور داشبورد برقرار نشد.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    /*
     * فقط برای اندازه‌گیری زمان درخواست.
     */
    console.time('[Dashboard] API request');

    fetchDashboardData();

    return () => {
      cancelled = true;
      console.timeEnd('[Dashboard] API request');
    };

    /*
     * VERY IMPORTANT:
     *
     * dependency array ثابت است.
     *
     * user یا object کامل auth-store را اینجا نگذار.
     */
  }, [mounted, isAuthenticated]);

  /* =======================================================
     Not authenticated
     ======================================================= */

  if (mounted && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {!logoError ? (
                <Image
                  src="/logo.png"
                  alt="بازار تحول"
                  width={100}
                  height={100}
                  className="object-contain p-2"
                  onError={() => setLogoError(true)}
                  priority
                />
              ) : (
                <span className="text-[#1E3A8A] font-black text-5xl">
                  ب ت
                </span>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            لطفاً وارد شوید
          </h2>

          <p className="text-slate-500 text-sm mb-6">
            برای مشاهده داشبورد و استفاده از امکانات،
            باید وارد حساب کاربری خود شوید.
          </p>

          <Link
            href="/login?next=/dashboard"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold shadow-lg hover:shadow-xl transition"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  /* =======================================================
     Initial loading
     ======================================================= */

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] p-1 animate-pulse shadow-lg">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-[#1E3A8A] font-black text-2xl">
                ب ت
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-lg">
            در حال بارگذاری داده‌ها...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     Data
     ======================================================= */

  const stats = data.stats;

  const industryData =
    data.industryData;

  const monthlyDeals =
    data.monthlyDeals;

  const recentActivities =
    data.recentActivities;

  const smartSuggestions =
    data.smartSuggestions;

  const conversionFunnel =
    data.conversionFunnel;

  const topSuppliers =
    data.topSuppliers;

  const userName =
    user?.first_name ||
    user?.username ||
    'کاربر بازار تحول';

  const userRole =
    user?.role || 'buyer';

  const orgName =
    user?.company_name ||
    'شرکت فناوران نوین';

  const roleMap: Record<string, string> = {
    admin: 'مدیر پلتفرم',
    buyer: 'خریدار',
    seller: 'عرضه‌کننده',
    consultant: 'مشاور',
    investor: 'سرمایه‌گذار',
    broker: 'کارگزار',
    partner: 'سازمان همکار',
  };

  /* =======================================================
     Render
     ======================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-4 md:p-6 lg:p-8">

      {/* ===================================================
          Header
          =================================================== */}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#14B8A6] p-6 md:p-8 text-white mb-8 shadow-xl shadow-[#1E3A8A20]">

        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#14B8A6] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/30 to-white/10 p-0.5 backdrop-blur-sm shadow-lg border border-white/20">

              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">

                {!logoError ? (
                  <Image
                    src="/logo.png"
                    alt="بازار تحول"
                    width={44}
                    height={44}
                    className="object-contain p-1"
                    onError={() => setLogoError(true)}
                    priority
                  />
                ) : (
                  <span className="text-[#1E3A8A] font-black text-lg">
                    ب
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

              <div className="flex flex-wrap items-center gap-2 mt-1">

                <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {orgName}
                </span>

                <span className="bg-[#14B8A6]/30 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-[#14B8A6]/30">
                  <Award className="w-3 h-3" />
                  {roleMap[userRole] || userRole}
                </span>

              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <Link
              href="/supply/register"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              ثبت محصول جدید
            </Link>

            <Link
              href="/market"
              className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              کاوش بازار
            </Link>

          </div>
        </div>

        {/* Quick Stats */}

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

          {[
            {
              label: 'محصولات فعال',
              value: stats.totalProducts,
              icon: Package,
              change: '+3',
            },
            {
              label: 'نیازهای بازار',
              value: stats.activeNeeds,
              icon: Lightbulb,
              change: '+5',
            },
            {
              label: 'مذاکرات جاری',
              value: stats.ongoingNegotiations,
              icon: MessageSquare,
              change: '+2',
            },
            {
              label: 'معاملات موفق',
              value: stats.successfulDeals,
              icon: CheckCircle,
              change: '+1',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-white/70" />

                <span className="text-xs text-[#14B8A6] bg-[#14B8A6]/20 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>

              <p className="text-2xl font-bold text-white">
                {stat.value}
              </p>

              <p className="text-xs text-white/70 mt-1">
                {stat.label}
              </p>
            </div>
          ))}

        </div>
      </div>

      {/* ===================================================
          API Warning
          =================================================== */}

      {apiError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          <div className="flex items-center gap-3">
            <div className="text-xl">⚠️</div>

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

      {/* ===================================================
          Main
          =================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {/* Quick Actions */}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#14B8A6]" />
              دسترسی سریع
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {[
                {
                  label: 'ثبت محصول',
                  icon: Package,
                  href: '/supply/register',
                  color: '#1E3A8A',
                },
                {
                  label: 'ثبت نیاز',
                  icon: Lightbulb,
                  href: '/needs/register',
                  color: '#14B8A6',
                },
                {
                  label: 'تطبیق هوشمند',
                  icon: Target,
                  href: '/matching',
                  color: '#F59E0B',
                },
                {
                  label: 'تحلیل بازار',
                  icon: BarChart3,
                  href: '/market-intelligence',
                  color: '#8B5CF6',
                },
              ].map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200/60 hover:shadow-md group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor:
                        action.color + '15',
                    }}
                  >
                    <action.icon
                      className="w-6 h-6"
                      style={{
                        color: action.color,
                      }}
                    />
                  </div>

                  <span className="text-sm font-bold text-slate-700 group-hover:text-[#1E3A8A] transition">
                    {action.label}
                  </span>
                </Link>
              ))}

            </div>
          </div>

          {/* Charts */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

              <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#14B8A6]" />
                توزیع صنایع
              </h3>

              <ResponsiveContainer
                width="100%"
                height={250}
              >
                <RePieChart>

                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {industryData.map(
                      (_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              index % COLORS.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />

                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

              <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#14B8A6]" />
                روند معاملات
              </h3>

              <ResponsiveContainer
                width="100%"
                height={250}
              >
                <AreaChart data={monthlyDeals}>

                  <defs>
                    <linearGradient
                      id="colorDeals"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#1E3A8A"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="#1E3A8A"
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
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="deals"
                    stroke="#1E3A8A"
                    fill="url(#colorDeals)"
                    strokeWidth={2}
                  />

                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Recent Activities */}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#14B8A6]" />
              آخرین فعالیت‌ها
            </h2>

            <div className="space-y-3">

              {recentActivities.map(
                (activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                  >

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor:
                          activity.type === 'product'
                            ? '#1E3A8A15'
                            : activity.type === 'need'
                            ? '#14B8A615'
                            : '#F59E0B15',
                      }}
                    >

                      {activity.type ===
                        'product' && (
                        <Package className="w-5 h-5 text-[#1E3A8A]" />
                      )}

                      {activity.type ===
                        'need' && (
                        <Lightbulb className="w-5 h-5 text-[#14B8A6]" />
                      )}

                      {activity.type ===
                        'negotiation' && (
                        <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
                      )}

                      {activity.type ===
                        'deal' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}

                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-bold text-slate-800 truncate">
                        {activity.title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {activity.user}
                      </p>

                    </div>

                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {activity.time}
                    </div>

                  </div>
                ),
              )}

            </div>
          </div>

        </div>

        {/* =================================================
            Right Column
            ================================================= */}

        <div className="space-y-6">

          {/* Smart Suggestions */}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              پیشنهادهای هوشمند
            </h2>

            <div className="space-y-3">

              {smartSuggestions.map(
                (item: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-gradient-to-r from-[#1E3A8A05] to-[#14B8A605] border border-slate-200/60 hover:shadow-md transition cursor-pointer"
                  >

                    <div className="flex items-center justify-between mb-1">

                      <span className="text-sm font-bold text-slate-800">
                        {item.title}
                      </span>

                      <span className="text-xs font-bold text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-0.5 rounded-full">
                        {item.match}%
                      </span>

                    </div>

                    <p className="text-xs text-slate-500">
                      {item.reason}
                    </p>

                  </div>
                ),
              )}

            </div>
          </div>

          {/* Conversion Funnel */}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#14B8A6]" />
              قیف تبدیل
            </h2>

            <div className="space-y-4">

              {conversionFunnel.map(
                (item: any, i: number) => (
                  <div key={i}>

                    <div className="flex justify-between text-sm mb-1">

                      <span className="text-slate-600">
                        {item.label}
                      </span>

                      <span
                        className="font-bold"
                        style={{
                          color:
                            COLORS[
                              i % COLORS.length
                            ],
                        }}
                      >
                        {item.value}
                      </span>

                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2">

                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor:
                            COLORS[
                              i % COLORS.length
                            ],
                        }}
                      />

                    </div>
                  </div>
                ),
              )}

            </div>
          </div>

          {/* Top Suppliers */}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">

            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#F59E0B]" />
              برترین عرضه‌کنندگان
            </h2>

            <div className="space-y-3">

              {topSuppliers.map(
                (supplier: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center text-white text-xs font-bold">
                        {i + 1}
                      </div>

                      <span className="text-sm font-medium text-slate-700">
                        {supplier.name}
                      </span>

                    </div>

                    <div className="flex items-center gap-2">

                      <span className="text-xs text-[#F59E0B]">
                        ★ {supplier.score}
                      </span>

                      <span className="text-xs text-slate-400">
                        {supplier.deals} معامله
                      </span>

                    </div>

                  </div>
                ),
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}