// src/app/execution/page.tsx
// نسخه اصلاح شده - استفاده از داده‌های یکپارچه Execution

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Users,
  Star,
  RefreshCw,
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
// Constants & Helpers
// ============================================================

const STATUS_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'in_progress', label: 'در حال انجام' },
  { value: 'not_started', label: 'شروع نشده' },
  { value: 'awaiting_approval', label: 'در انتظار تأیید' },
  { value: 'needs_revision', label: 'نیازمند اصلاح' },
  { value: 'completed', label: 'تکمیل شده' },
  { value: 'suspended', label: 'متوقف شده' },
  { value: 'disputed', label: 'اختلاف' },
];

function getStatusLabel(status: string): string {
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
      return 'bg-emerald-100 text-emerald-700';
    case 'suspended':
      return 'bg-slate-200 text-slate-600';
    case 'disputed':
      return 'bg-red-100 text-red-700';
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
      return <CheckCircle size={14} />;
    case 'suspended':
    case 'disputed':
      return <AlertTriangle size={14} />;
    default:
      return <Clock size={14} />;
  }
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value: unknown): string {
  const amount = normalizeNumber(value);
  return new Intl.NumberFormat('fa-IR').format(amount);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fa-IR').format(date);
}

// ============================================================
// Main Component
// ============================================================

export default function ExecutionListPage() {
  const [items, setItems] = useState<Execution[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecutions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // فقط یک درخواست به /api/execution/
      const response = await authenticatedFetch(`${API_URL}/execution/`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('نشست کاربری شما معتبر نیست. لطفاً دوباره وارد شوید.');
        }
        throw new Error(`دریافت پروژه‌های در حال اجرا ناموفق بود. کد خطا: ${response.status}`);
      }

      const data = (await response.json()) as Execution[] | ApiListResponse<Execution>;

      const executions = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

      setItems(executions);
    } catch (err) {
      console.error('❌ Failed to load executions:', err);
      setError(err instanceof Error ? err.message : 'خطا در دریافت پروژه‌های در حال اجرا');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  const filteredExecutions = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((execution) => execution.status === filter);
  }, [items, filter]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{
        fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
      dir="rtl"
    >
      {/* Navbar */}


      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === item.value ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3 mt-3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mt-3" />
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full mt-5" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
            <AlertTriangle size={42} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-base font-extrabold text-slate-800 mb-2">دریافت اطلاعات ناموفق بود</h2>
            <p className="text-sm text-slate-500 mb-5">{error}</p>
            <button
              type="button"
              onClick={() => loadExecutions()}
              className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold hover:bg-[#172F70] transition"
            >
              تلاش مجدد
            </button>
          </div>
        ) : filteredExecutions.length === 0 ? (
          // Empty
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">
              {items.length === 0 ? 'هنوز پروژه‌ای برای اجرا ثبت نشده است.' : 'هیچ پروژه‌ای با این وضعیت یافت نشد.'}
            </p>
          </div>
        ) : (
          // List
          <div className="space-y-4">
            {filteredExecutions.map((execution) => {
              const progress = Math.min(100, Math.max(0, normalizeNumber(execution.progress_percent)));
              const finalScore = execution.final_score !== null && execution.final_score !== undefined
                ? normalizeNumber(execution.final_score)
                : null;

              return (
                <Link
                  key={execution.id}
                  href={`/execution/${execution.contract}`}
                  className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all hover:border-[#1E3A8A]/30"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center flex-shrink-0">
                        <Package size={24} className="text-white" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-slate-900">{execution.contract_title}</h3>
                        <p className="text-xs text-slate-500 mt-1">قرارداد #{execution.contract}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users size={12} />
                            خریدار: {execution.buyer_name}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users size={12} />
                            فروشنده: {execution.supplier_name}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            شروع: {formatDate(execution.start_date)}
                          </span>
                          {finalScore !== null && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Star size={12} className="fill-amber-400" />
                              امتیاز: {new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(finalScore)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-full border-4 border-[#1E3A8A]/20 flex items-center justify-center">
                          <span className="text-sm font-extrabold text-[#1E3A8A]">
                            {new Intl.NumberFormat('fa-IR').format(progress)}٪
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">پیشرفت</p>
                      </div>

                      <div className="text-left">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(execution.status)}`}>
                          {getStatusIcon(execution.status)}
                          {getStatusLabel(execution.status)}
                        </span>
                        <p className="text-xs font-bold text-slate-700 mt-2">{formatCurrency(execution.total_amount)} تومان</p>
                        <p className="text-xs text-slate-400 mt-1">پایان پیش‌بینی‌شده: {formatDate(execution.expected_end_date)}</p>
                      </div>

                      <ChevronLeft size={20} className="text-slate-300" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6]'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}