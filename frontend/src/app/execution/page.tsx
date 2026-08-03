// src/app/execution/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Calendar,
  ChevronLeft,
  BarChart3,
  Users,
  Star,
} from 'lucide-react';

// داده‌های نمونه برای پروژه‌های در حال اجرا
const executionsData = [
  {
    id: '1',
    productId: '2',
    contractTitle: 'قرارداد توسعه سامانه هوش مصنوعی',
    productTitle: 'سامانه هوش مصنوعی تحلیل داده',
    status: 'in_progress',
    progressPercent: 65,
    startDate: '۱۴۰۲/۰۴/۰۱',
    expectedEndDate: '۱۴۰۲/۰۷/۳۰',
    buyer: 'شرکت فناوران نوین',
    seller: 'تیم توسعه متا',
    totalAmount: 450,
    completedMilestones: 1,
    totalMilestones: 3,
  },
  {
    id: '2',
    productId: '5',
    contractTitle: 'قرارداد مشاوره تحول دیجیتال',
    productTitle: 'خدمات مشاوره تحول دیجیتال',
    status: 'delivered',
    progressPercent: 100,
    startDate: '۱۴۰۲/۰۲/۱۵',
    expectedEndDate: '۱۴۰۲/۰۵/۱۵',
    actualEndDate: '۱۴۰۲/۰۵/۱۰',
    buyer: 'هلدینگ صنعتی ایران',
    seller: 'مشاوران نوآور',
    totalAmount: 280,
    completedMilestones: 3,
    totalMilestones: 3,
    finalScore: 4.8,
  },
  {
    id: '3',
    productId: '8',
    contractTitle: 'قرارداد پیاده‌سازی IoT',
    productTitle: 'پلتفرم اینترنت اشیا صنعتی',
    status: 'not_started',
    progressPercent: 0,
    startDate: '۱۴۰۲/۰۵/۰۱',
    expectedEndDate: '۱۴۰۲/۰۹/۳۰',
    buyer: 'شرکت نفت و گاز پارس',
    seller: 'فناوران هوشمند',
    totalAmount: 850,
    completedMilestones: 0,
    totalMilestones: 4,
  },
  {
    id: '4',
    productId: '12',
    contractTitle: 'قرارداد طراحی و پیاده‌سازی ربات انبارداری',
    productTitle: 'ربات هوشمند انبار',
    status: 'completed',
    progressPercent: 100,
    startDate: '۱۴۰۱/۱۱/۰۱',
    expectedEndDate: '۱۴۰۲/۰۳/۳۰',
    actualEndDate: '۱۴۰۲/۰۳/۲۵',
    buyer: 'شرکت فولاد آلیاژی یزد',
    seller: 'رباتیک پیشرو',
    totalAmount: 1200,
    completedMilestones: 4,
    totalMilestones: 4,
    finalScore: 4.5,
  },
  {
    id: '5',
    productId: '15',
    contractTitle: 'قرارداد بهینه‌سازی فرآیند با هوش مصنوعی',
    productTitle: 'سیستم بهینه‌سازی مصرف انرژی',
    status: 'in_progress',
    progressPercent: 40,
    startDate: '۱۴۰۲/۰۴/۱۵',
    expectedEndDate: '۱۴۰۲/۰۸/۱۵',
    buyer: 'پتروشیمی خلیج فارس',
    seller: 'هوشمند پردازش',
    totalAmount: 650,
    completedMilestones: 1,
    totalMilestones: 4,
  },
];

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    not_started: 'شروع نشده',
    in_progress: 'در حال انجام',
    awaiting_approval: 'در انتظار تأیید',
    needs_revision: 'نیازمند اصلاح',
    completed: 'تکمیل شده',
    delivered: 'تحویل شده',
    suspended: 'متوقف شده',
  };
  return map[status] || status;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'not_started':
      return 'bg-slate-100 text-slate-600';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    case 'awaiting_approval':
      return 'bg-amber-100 text-amber-700';
    case 'needs_revision':
      return 'bg-red-100 text-red-700';
    case 'completed':
    case 'delivered':
      return 'bg-emerald-100 text-emerald-700';
    case 'suspended':
      return 'bg-slate-200 text-slate-500';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'not_started':
      return <Clock size={14} />;
    case 'in_progress':
      return <Play size={14} />;
    case 'awaiting_approval':
      return <Clock size={14} />;
    case 'needs_revision':
      return <AlertTriangle size={14} />;
    case 'completed':
    case 'delivered':
      return <CheckCircle size={14} />;
    case 'suspended':
      return <AlertTriangle size={14} />;
    default:
      return <FileText size={14} />;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount);
}

export default function ExecutionListPage() {
  const [filter, setFilter] = useState<string>('all');

  const filteredExecutions =
    filter === 'all'
      ? executionsData
      : executionsData.filter((e) => e.status === filter);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
      dir="rtl"
    >
      {/* نوار بالایی */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/market"
              className="flex items-center gap-1 text-slate-500 hover:text-[#1E3A8A] transition text-sm"
            >
              <ArrowRight size={18} />
              <span className="hidden sm:inline">بازار</span>
            </Link>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900">پروژه‌های در حال اجرا</h1>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* فیلترها */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'همه' },
            { value: 'in_progress', label: 'در حال انجام' },
            { value: 'not_started', label: 'شروع نشده' },
            { value: 'awaiting_approval', label: 'در انتظار تأیید' },
            { value: 'completed', label: 'تکمیل شده' },
            { value: 'delivered', label: 'تحویل شده' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === f.value
                  ? 'bg-[#1E3A8A] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* کارت‌های پروژه */}
        <div className="space-y-4">
          {filteredExecutions.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">هیچ پروژه‌ای یافت نشد.</p>
            </div>
          ) : (
            filteredExecutions.map((execution) => (
              <Link
                key={execution.id}
                href={`/execution/${execution.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all hover:border-[#1E3A8A]/30"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center flex-shrink-0">
                      <Package size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {execution.contractTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{execution.productTitle}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users size={12} />
                          فروشنده: {execution.seller}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={12} />
                          شروع: {execution.startDate}
                        </span>
                        {execution.finalScore && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Star size={12} className="fill-amber-400" />
                            امتیاز: {execution.finalScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full border-4 border-[#1E3A8A]/20 flex items-center justify-center">
                        <span className="text-sm font-extrabold text-[#1E3A8A]">
                          {execution.progressPercent}٪
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">پیشرفت</p>
                    </div>
                    <div className="text-left">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(
                          execution.status
                        )}`}
                      >
                        {getStatusIcon(execution.status)}
                        {getStatusLabel(execution.status)}
                      </span>
                      <p className="text-xs text-slate-400 mt-2">
                        {execution.completedMilestones} از {execution.totalMilestones} مرحله
                      </p>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        {formatCurrency(execution.totalAmount)} میلیون تومان
                      </p>
                    </div>
                    <ChevronLeft size={20} className="text-slate-300" />
                  </div>
                </div>
                {/* نوار پیشرفت */}
                <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full transition-all"
                    style={{ width: `${execution.progressPercent}%` }}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}