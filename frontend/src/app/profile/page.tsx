// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  AlertTriangle,
  Star,
  Package,
  Calendar,
  Building2,
  Phone,
  Award,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ============================================================
// تایپ پروژه
// ============================================================
interface Project {
  id: string;
  title: string;
  contractTitle?: string;
  status: string;
  progressPercent?: number;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  finalScore?: number;
  buyer?: string;
  seller?: string;
  totalAmount?: number;
  completedMilestones?: number;
  totalMilestones?: number;
}

// ============================================================
// داده‌های فیک (Mock) برای پروژه‌ها
// ============================================================
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'سامانه مدیریت انرژی هوشمند',
    contractTitle: 'قرارداد توسعه سامانه انرژی',
    status: 'در حال اجرا',
    progressPercent: 65,
    startDate: '1404/01/15',
    expectedEndDate: '1404/09/15',
    finalScore: 4.7,
    buyer: 'شرکت فناوران انرژی',
    seller: 'دانش‌بنیان سیستم',
    totalAmount: 850000000,
    completedMilestones: 4,
    totalMilestones: 7,
  },
  {
    id: '2',
    title: 'بهینه‌سازی مصرف آب در صنایع',
    contractTitle: 'مطالعه امکان‌سنجی کاهش مصرف آب',
    status: 'خاتمه یافته',
    progressPercent: 100,
    startDate: '1403/08/01',
    expectedEndDate: '1404/02/01',
    actualEndDate: '1404/01/30',
    finalScore: 4.9,
    buyer: 'سازمان آب منطقه‌ای',
    seller: 'مشاوران صنعت سبز',
    totalAmount: 420000000,
    completedMilestones: 5,
    totalMilestones: 5,
  },
  {
    id: '3',
    title: 'طراحی پلتفرم آموزش مجازی',
    contractTitle: 'توسعه پلتفرم تعاملی آموزشی',
    status: 'در مرحله مذاکره',
    progressPercent: 15,
    startDate: '1404/03/10',
    expectedEndDate: '1404/12/10',
    buyer: 'وزارت آموزش و پرورش',
    seller: 'شرکت نوآوران دیجیتال',
    totalAmount: 1200000000,
    completedMilestones: 1,
    totalMilestones: 10,
  },
  {
    id: '4',
    title: 'سیستم پایش کیفیت هوا',
    contractTitle: 'پیاده‌سازی سامانه پایش لحظه‌ای',
    status: 'متوقف شده',
    progressPercent: 30,
    startDate: '1403/12/05',
    expectedEndDate: '1404/06/05',
    buyer: 'سازمان محیط زیست',
    seller: 'فناوران داده‌ورز',
    totalAmount: 620000000,
    completedMilestones: 2,
    totalMilestones: 6,
  },
  {
    id: '5',
    title: 'مطالعه شبکه توزیع برق هوشمند',
    contractTitle: 'طراحی شبکه توزیع با رویکرد هوشمندسازی',
    status: 'در انتظار تأیید',
    progressPercent: 5,
    startDate: '1404/05/20',
    expectedEndDate: '1404/11/20',
    buyer: 'شرکت توزیع نیروی برق',
    seller: 'مهندسان انرژی پاک',
    totalAmount: 350000000,
    completedMilestones: 0,
    totalMilestones: 8,
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, accessToken, logout } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS); // شروع با داده‌های فیک
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRealData, setIsRealData] = useState(false); // برای تشخیص داده واقعی یا فیک

  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================
  // دریافت پروژه‌های کاربر از بک‌اند (در پس‌زمینه)
  // ============================================================
  useEffect(() => {
    if (!mounted) return;
    // اگر احراز هویت نشده یا توکن نداریم، نیازی به درخواست نیست
    if (!isAuthenticated || !user || !accessToken) {
      setLoading(false);
      return;
    }

    const fetchUserProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

        const res = await fetch(`${API_URL}/execution/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            // اگر endpoint موجود نبود، داده‌های فیک را نگه دار
            setIsRealData(false);
            setError('هیچ پروژه‌ای یافت نشد (نمایش داده‌های نمونه)');
          } else if (res.status === 401) {
            throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
          } else {
            throw new Error(`خطا در دریافت پروژه‌ها: ${res.status}`);
          }
          return;
        }

        const data = await res.json();
        const projectList = Array.isArray(data) ? data : data.results || [];

        if (projectList.length === 0) {
          // اگر لیست خالی بود، داده‌های فیک را نگه دار
          setIsRealData(false);
          setError('هیچ پروژه‌ای برای شما ثبت نشده است (نمایش داده‌های نمونه)');
          return;
        }

        const formattedProjects: Project[] = projectList.map((p: any) => ({
          id: p.id.toString(),
          title: p.title || p.contract_title || 'پروژه بدون عنوان',
          contractTitle: p.contract_title || p.title,
          status: p.status || 'نامشخص',
          progressPercent: p.progress_percent || 0,
          startDate: p.start_date,
          expectedEndDate: p.expected_end_date,
          actualEndDate: p.actual_end_date,
          finalScore: p.final_score,
          buyer: p.buyer_name || p.buyer,
          seller: p.supplier_name || p.supplier,
          totalAmount: p.total_amount,
          completedMilestones: p.completed_milestones,
          totalMilestones: p.total_milestones,
        }));

        setProjects(formattedProjects);
        setIsRealData(true);
        setError(null);
      } catch (err: any) {
        console.error('❌ خطا در دریافت پروژه‌ها:', err);
        // در صورت خطا، داده‌های فیک باقی می‌مانند
        setIsRealData(false);
        if (err?.message?.includes('منقضی') || err?.message?.includes('401')) {
          logout();
          router.push('/login?next=/profile');
          return;
        }
        setError(err.message || 'خطا در دریافت اطلاعات پروژه‌ها (نمایش داده‌های نمونه)');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [mounted, isAuthenticated, user, accessToken, router, logout]);

  // ============================================================
  // نمایش وضعیت بارگذاری
  // ============================================================
  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#1E3A8A] mx-auto mb-4" />
          <p className="text-slate-500">در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // اگر کاربر لاگین نکرده باشد – نمایش پیام ورود
  // ============================================================
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center">
            <span className="text-white font-black text-2xl">ب ت</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">لطفاً وارد شوید</h2>
          <p className="text-slate-500 text-sm mb-6">برای مشاهده پروفایل و اطلاعات خود، باید وارد حساب کاربری شوید.</p>
          <Link
            href="/login?next=/profile"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold shadow-lg hover:shadow-xl transition"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // وضعیت مدارک (بر اساس داده‌های کاربر – در صورت نداشتن، پیش‌فرض)
  // ============================================================
  const getDocumentStatus = () => {
    if (user.role === 'admin') return null;
    return user.documentsStatus || 'red';
  };

  const docStatus = getDocumentStatus();

  const statusConfig: Record<string, any> = {
    red: {
      color: 'bg-red-100 text-red-700 border-red-300',
      icon: <XCircle size={20} className="text-red-500" />,
      text: 'هیچ مدرکی آپلود نشده یا تأیید نشده است',
      dot: 'bg-red-500',
    },
    yellow: {
      color: 'bg-amber-100 text-amber-700 border-amber-300',
      icon: <Clock size={20} className="text-amber-500" />,
      text: 'برخی مدارک تأیید شده‌اند،仍需 تکمیل',
      dot: 'bg-amber-500',
    },
    green: {
      color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      icon: <CheckCircle size={20} className="text-emerald-500" />,
      text: 'تمام مدارک تأیید شده‌اند',
      dot: 'bg-emerald-500',
    },
  };

  const roleMap: Record<string, string> = {
    admin: 'مدیر پلتفرم',
    buyer: 'خریدار',
    seller: 'عرضه‌کننده',
    consultant: 'مشاور',
    investor: 'سرمایه‌گذار',
    broker: 'کارگزار',
    partner: 'سازمان همکار',
  };

  // ============================================================
  // رندر اصلی
  // ============================================================
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* سربرگ */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition">
            <ArrowRight size={20} />
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">پروفایل کاربری</h1>
        </div>

        {/* ============================================================
            کارت اطلاعات کاربر
            ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center text-white text-2xl font-bold">
              {user.first_name ? user.first_name.charAt(0).toUpperCase() : <User size={28} />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {user.first_name || user.username} {user.last_name || ''}
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Award size={14} className="text-[#14B8A6]" />
                {roleMap[user.role] || user.role}
              </p>
              {user.company_name && (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 size={12} />
                  {user.company_name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={16} className="text-slate-400" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.username && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>نام کاربری: {user.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            وضعیت مدارک
            ============================================================ */}
        {docStatus && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[#1E3A8A]" />
              وضعیت احراز هویت و مدارک
            </h3>

            <div className={`rounded-xl border p-4 flex items-start gap-3 ${statusConfig[docStatus].color}`}>
              <div className="mt-0.5">{statusConfig[docStatus].icon}</div>
              <div>
                <p className="text-sm font-bold">
                  {docStatus === 'red' && 'تکمیل نشده'}
                  {docStatus === 'yellow' && 'در حال بررسی'}
                  {docStatus === 'green' && 'تأیید شده'}
                </p>
                <p className="text-xs mt-1 opacity-80">{statusConfig[docStatus].text}</p>
              </div>
            </div>

            {/* چراغ راهنما */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-4 h-4 rounded-full ${docStatus === 'red' ? 'bg-red-500 ring-4 ring-red-200' : 'bg-red-300'}`} />
                <span className="text-xs text-slate-500">ارسال مدارک</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200" />
              <div className="flex flex-col items-center gap-1">
                <div className={`w-4 h-4 rounded-full ${docStatus === 'yellow' ? 'bg-amber-500 ring-4 ring-amber-200' : docStatus === 'green' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-xs text-slate-500">بررسی کارشناس</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200" />
              <div className="flex flex-col items-center gap-1">
                <div className={`w-4 h-4 rounded-full ${docStatus === 'green' ? 'bg-emerald-500 ring-4 ring-emerald-200' : 'bg-slate-300'}`} />
                <span className="text-xs text-slate-500">تأیید نهایی</span>
              </div>
            </div>

            {docStatus !== 'green' && (
              <div className="mt-6 text-center">
                <Link
                  href="/register?step=documents"
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#1E3A8A] hover:underline"
                >
                  <AlertTriangle size={14} />
                  تکمیل مدارک
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            پیام مدیر
            ============================================================ */}
        {user.role === 'admin' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield size={16} className="text-[#1E3A8A]" />
              <span>حساب مدیر نیازی به احراز هویت ندارد.</span>
            </div>
          </div>
        )}

        {/* ============================================================
            پروژه‌های اختصاصی کاربر
            ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Package size={16} className="text-[#14B8A6]" />
            پروژه‌های من
            {!isRealData && (
              <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                داده‌های نمونه
              </span>
            )}
          </h3>

          {error && (
            <div className="text-center py-2 text-slate-500 text-sm">
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">هیچ پروژه‌ای برای شما یافت نشد.</p>
              <Link href="/market" className="text-xs text-[#1E3A8A] hover:underline mt-2 inline-block">
                شروع یک پروژه جدید
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/execution/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center">
                      <Package size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {project.contractTitle || project.title}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>وضعیت: {project.status}</span>
                        {project.progressPercent !== undefined && (
                          <span>پیشرفت: {project.progressPercent}%</span>
                        )}
                        {project.finalScore && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star size={12} className="fill-amber-400" />
                            {project.finalScore}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {project.expectedEndDate && (
                      <span>پایان پیش‌بینی: {project.expectedEndDate}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {projects.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href="/execution"
                className="text-xs font-bold text-[#1E3A8A] hover:underline"
              >
                مشاهده همه پروژه‌ها
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}