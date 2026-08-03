// src/app/execution/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Play,
  Calendar,
  User,
} from 'lucide-react';

const mockExecutions = [
  {
    id: 1,
    title: 'تحلیل نیازمندی‌ها',
    description: 'بررسی نیازهای کارفرما و تدوین سند نیازمندی‌ها',
    status: 'completed',
    progress: 100,
    plannedStart: '۱۴۰۲/۰۴/۰۱',
    plannedEnd: '۱۴۰۲/۰۴/۱۵',
    actualStart: '۱۴۰۲/۰۴/۰۱',
    actualEnd: '۱۴۰۲/۰۴/۱۴',
    responsible: 'مهندس احمدی',
  },
  {
    id: 2,
    title: 'توسعه ماژول اصلی',
    description: 'پیاده‌سازی هسته اصلی سیستم و تست‌های واحد',
    status: 'in_progress',
    progress: 65,
    plannedStart: '۱۴۰۲/۰۴/۱۶',
    plannedEnd: '۱۴۰۲/۰۵/۱۰',
    responsible: 'علی محمدی',
  },
  {
    id: 3,
    title: 'تحویل نهایی و استقرار',
    description: 'نصب، راه‌اندازی، آموزش و تحویل نهایی',
    status: 'not_started',
    progress: 0,
    plannedStart: '۱۴۰۲/۰۵/۱۱',
    plannedEnd: '۱۴۰۲/۰۵/۳۰',
    responsible: 'تیم فنی',
  },
];

const statusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle size={16} className="text-emerald-500" />;
    case 'in_progress': return <Play size={16} className="text-blue-500" />;
    case 'delayed': return <Clock size={16} className="text-red-500" />;
    default: return <Clock size={16} className="text-slate-400" />;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'تکمیل شده';
    case 'in_progress': return 'در حال انجام';
    case 'not_started': return 'شروع نشده';
    case 'delayed': return 'تأخیر';
    default: return status;
  }
};

export default function ExecutionPage() {
  const params = useParams();
  const contractId = params?.id as string; // دقت: پارامتر [id] است

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6"
      dir="rtl"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
    >
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/contract/${contractId}`}
          className="flex items-center gap-1 text-slate-500 hover:text-[#1E3A8A] mb-4 text-sm"
        >
          <ArrowRight size={16} />
          بازگشت به قرارداد
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-6">اجرای پروژه</h1>

        <div className="space-y-4">
          {mockExecutions.map((exec) => (
            <div key={exec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {statusIcon(exec.status)}
                  <h3 className="text-lg font-bold text-slate-800">{exec.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {statusLabel(exec.status)}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#1E3A8A]">{exec.progress}٪</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{exec.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar size={12} /> شروع: {exec.plannedStart}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> پایان: {exec.plannedEnd}</span>
                <span className="flex items-center gap-1"><User size={12} /> مسئول: {exec.responsible}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full ${exec.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${exec.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}