// src/app/execution/[contractId]/page.tsx
// نسخه اصلاح شده - استفاده از داده‌های یکپارچه Execution

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Play,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
  Package,
  FileText,
} from 'lucide-react';

import {
  API_URL,
  authenticatedFetch,
} from '@/store/auth-store';

// ============================================================
// Types - مطابق با ExecutionSerializer
// ============================================================

interface Milestone {
  id: number;
  contract: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  deliverables: string | null;
  completed_at: string | null;
}

interface Execution {
  id: number;
  contract: number;
  contract_title: string;
  status: string;
  progress_percent: number;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  final_score: string | number | null;
  notes: string | null;
  total_amount: string | number | null;
  buyer_name: string;
  supplier_name: string;
  completed_milestones: number;
  total_milestones: number;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

interface ApiListResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// ============================================================
// Helpers
// ============================================================

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatNumber(value: unknown): string {
  return new Intl.NumberFormat('fa-IR').format(normalizeNumber(value));
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fa-IR').format(date);
}

function getExecutionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    not_started: 'شروع نشده',
    in_progress: 'در حال انجام',
    awaiting_approval: 'در انتظار تأیید',
    needs_revision: 'نیازمند اصلاح',
    completed: 'تکمیل شده',
    suspended: 'متوقف شده',
    disputed: 'وارد اختلاف شده',
  };
  return map[status] || status;
}

function getExecutionStatusColor(status: string): string {
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
      return 'bg-emerald-100 text-emerald-700';
    case 'suspended':
      return 'bg-slate-200 text-slate-600';
    case 'disputed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getMilestoneStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle size={16} className="text-emerald-500" />;
    case 'in_progress':
      return <Play size={16} className="text-blue-500" />;
    case 'awaiting_approval':
      return <Clock size={16} className="text-amber-500" />;
    case 'needs_revision':
      return <AlertTriangle size={16} className="text-red-500" />;
    default:
      return <Clock size={16} className="text-slate-400" />;
  }
}

function getMilestoneStatusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: 'تکمیل شده',
    in_progress: 'در حال انجام',
    not_started: 'شروع نشده',
    awaiting_approval: 'در انتظار تأیید',
    needs_revision: 'نیازمند اصلاح',
  };
  return map[status] || status;
}

function getMilestoneStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700';
    case 'awaiting_approval':
      return 'bg-amber-100 text-amber-700';
    case 'needs_revision':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

// ============================================================
// Main Component
// ============================================================

export default function ExecutionPage() {
  const params = useParams();

  const contractId = useMemo(() => {
    const value = params?.contractId;
    if (Array.isArray(value)) return value[0] || '';
    return typeof value === 'string' ? value : '';
  }, [params]);

  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExecution = useCallback(async () => {
    if (!contractId) {
      setError('شناسه قرارداد معتبر نیست.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const numericContractId = Number(contractId);
      if (!Number.isInteger(numericContractId) || numericContractId <= 0) {
        throw new Error('شناسه قرارداد معتبر نیست.');
      }

      // فقط یک درخواست به /api/execution/?contract={id}
      const response = await authenticatedFetch(`${API_URL}/execution/?contract=${numericContractId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('اجرای این قرارداد پیدا نشد.');
        }
        if (response.status === 401) {
          throw new Error('نشست کاربری شما معتبر نیست. لطفاً دوباره وارد شوید.');
        }
        throw new Error(`دریافت اطلاعات اجرا ناموفق بود. کد خطا: ${response.status}`);
      }

      const data = (await response.json()) as Execution[] | ApiListResponse<Execution>;

      const executions = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

      const currentExecution = executions.find((item) => Number(item.contract) === numericContractId) || null;

      if (!currentExecution) {
        throw new Error('برای این قرارداد هنوز رکورد اجرای پروژه ثبت نشده است.');
      }

      setExecution(currentExecution);
    } catch (err) {
      console.error('❌ Failed to load execution details:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات اجرای پروژه');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadExecution();
  }, [loadExecution]);

  const completedMilestones = execution?.milestones?.filter((item) => item.status === 'completed').length || 0;
  const totalMilestones = execution?.milestones?.length || 0;
  const progress = Math.min(100, Math.max(0, normalizeNumber(execution?.progress_percent)));

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-6" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-100 rounded w-1/3 mt-4" />
            <div className="h-3 bg-slate-100 rounded-full mt-6" />
          </div>
          <div className="space-y-4 mt-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-3/4 mt-4" />
                <div className="h-3 bg-slate-100 rounded w-1/3 mt-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Error
  // ============================================================

  if (error || !execution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <Link href="/execution" className="flex items-center gap-1 text-slate-500 hover:text-[#1E3A8A] mb-6 text-sm">
            <ArrowRight size={16} />
            بازگشت به پروژه‌ها
          </Link>

          <div className="bg-white border border-red-200 rounded-2xl p-10 text-center">
            <AlertTriangle size={44} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-lg font-extrabold text-slate-800 mb-2">اطلاعات اجرا در دسترس نیست</h1>
            <p className="text-sm text-slate-500 mb-6">{error || 'رکورد اجرای این قرارداد پیدا نشد.'}</p>
            <button
              type="button"
              onClick={loadExecution}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold hover:bg-[#172F70] transition"
            >
              <RefreshCw size={15} />
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/execution" className="flex items-center gap-1 text-slate-500 hover:text-[#1E3A8A] text-sm">
            <ArrowRight size={16} />
            بازگشت به پروژه‌ها
          </Link>

          <button
            type="button"
            onClick={loadExecution}
            title="به‌روزرسانی"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1E3A8A] hover:border-[#1E3A8A]/30 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Execution Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center flex-shrink-0">
                <Package size={27} className="text-white" />
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{execution.contract_title}</h1>
                <p className="text-xs text-slate-500 mt-2">قرارداد #{execution.contract}</p>

                <div className="flex flex-wrap gap-3 mt-4">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={13} />
                    خریدار: {execution.buyer_name}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={13} />
                    فروشنده: {execution.supplier_name}
                  </span>
                </div>
              </div>
            </div>

            <span className={`self-start px-3 py-1.5 rounded-full text-xs font-bold ${getExecutionStatusColor(execution.status)}`}>
              {getExecutionStatusLabel(execution.status)}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400">پیشرفت</p>
              <p className="text-xl font-black text-[#1E3A8A] mt-1">{formatNumber(progress)}٪</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400">مبلغ قرارداد</p>
              <p className="text-sm font-black text-slate-800 mt-2">{formatNumber(execution.total_amount)}</p>
              <p className="text-[10px] text-slate-400 mt-1">تومان</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400">شروع اجرا</p>
              <p className="text-sm font-bold text-slate-800 mt-2">{formatDate(execution.start_date)}</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400">پایان پیش‌بینی‌شده</p>
              <p className="text-sm font-bold text-slate-800 mt-2">{formatDate(execution.expected_end_date)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600">میزان پیشرفت پروژه</span>
              <span className="text-xs font-black text-[#1E3A8A]">{formatNumber(progress)}٪</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {execution.actual_end_date && (
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle size={14} />
              پایان واقعی: {formatDate(execution.actual_end_date)}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">مراحل اجرای پروژه</h2>
            <p className="text-xs text-slate-400 mt-1">
              {formatNumber(completedMilestones)} از {formatNumber(totalMilestones)} مرحله تکمیل شده
            </p>
          </div>
          <FileText size={22} className="text-[#1E3A8A]" />
        </div>

        {execution.milestones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Clock size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">هنوز مرحله‌ای برای این قرارداد ثبت نشده است.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {execution.milestones.map((milestone, index) => {
              const isCompleted = milestone.status === 'completed';
              return (
                <div key={milestone.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-emerald-50' : 'bg-slate-50'
                        }`}
                      >
                        {getMilestoneStatusIcon(milestone.status)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">مرحله {formatNumber(index + 1)}</span>
                          <h3 className="text-base font-bold text-slate-800">{milestone.title}</h3>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${getMilestoneStatusColor(milestone.status)}`}>
                            {getMilestoneStatusLabel(milestone.status)}
                          </span>
                        </div>

                        {milestone.description && <p className="text-sm text-slate-600 mt-2 leading-7">{milestone.description}</p>}

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            سررسید: {formatDate(milestone.due_date)}
                          </span>
                          {milestone.completed_at && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle size={12} />
                              تکمیل: {formatDate(milestone.completed_at)}
                            </span>
                          )}
                        </div>

                        {milestone.deliverables && (
                          <a
                            href={milestone.deliverables}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#1E3A8A] hover:underline"
                          >
                            <FileText size={13} />
                            مشاهده خروجی مرحله
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {execution.notes && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-6">
            <h2 className="text-sm font-extrabold text-slate-800 mb-2">یادداشت‌های اجرا</h2>
            <p className="text-sm text-slate-600 leading-7 whitespace-pre-wrap">{execution.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}