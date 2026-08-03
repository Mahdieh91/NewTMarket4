'use client';

import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  TrendingUp,
  User,
  Calendar,
  Search,
  Plus,
} from 'lucide-react';

interface Execution {
  id: number;
  title: string;
  description?: string;
  order: number;
  execution_status: string;
  progress_percent: number;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  responsible: { id: number; full_name: string };
}

interface Props {
  contractTitle: string;
  executions: Execution[];
}

const statusColumns = [
  { key: 'not_started', label: 'انجام نشده', color: '#6B7280' },
  { key: 'in_progress', label: 'در حال انجام', color: '#14B8A6' },
  { key: 'completed', label: 'تکمیل شده', color: '#1E3A8A' },
  { key: 'blocked', label: 'مسدود', color: '#EF4444' },
];

const getStatusKey = (status: string) => {
  if (status === 'completed' || status === 'done') return 'completed';
  if (status === 'in_progress' || status === 'doing') return 'in_progress';
  if (status === 'blocked') return 'blocked';
  return 'not_started';
};

export default function ExecutionDashboard({ contractTitle, executions }: Props) {
  const stats = {
    total: executions.length,
    completed: executions.filter(e => getStatusKey(e.execution_status) === 'completed').length,
    inProgress: executions.filter(e => getStatusKey(e.execution_status) === 'in_progress').length,
    blocked: executions.filter(e => getStatusKey(e.execution_status) === 'blocked').length,
  };

  const columns = statusColumns.map(col => ({
    ...col,
    items: executions.filter(e => getStatusKey(e.execution_status) === col.key),
  }));

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* هدر گرادینت */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#14B8A6] to-[#0D9488] p-8 text-white mb-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-white/80">برد اجرایی قرارداد</p>
              <h1 className="text-2xl md:text-3xl font-bold">{contractTitle}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10">
                  {stats.total} فعالیت
                </span>
                <span className="bg-teal-400/40 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-teal-400/40">
                  <CheckCircle className="w-3 h-3" /> {stats.completed} تکمیل‌شده
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
              <Search className="w-4 h-4 ml-1" />
              جستجو
            </button>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
              <Plus className="w-4 h-4 ml-1" />
              افزودن فعالیت
            </button>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'کل فعالیت‌ها', value: stats.total, icon: Package },
            { label: 'تکمیل شده', value: stats.completed, icon: CheckCircle },
            { label: 'در حال انجام', value: stats.inProgress, icon: TrendingUp },
            { label: 'مسدود', value: stats.blocked, icon: AlertCircle },
          ].map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-white/70">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">کل فعالیت‌ها</p>
              <p className="text-3xl font-bold text-[#1E3A8A] mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <Package className="w-6 h-6 text-[#1E3A8A]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">تکمیل شده</p>
              <p className="text-3xl font-bold text-[#14B8A6] mt-1">{stats.completed}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-[#14B8A6]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">در حال انجام</p>
              <p className="text-3xl font-bold text-[#14B8A6] mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-[#14B8A6]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">مسدود</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.blocked}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* برد کانبان */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
            <Package className="w-5 h-5" />
            برد اجرایی
          </h2>
          <button className="text-[#14B8A6] hover:text-teal-700 text-sm font-medium">
            مشاهده همه
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => (
            <div key={col.key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span style={{ color: col.color }}>
                    {col.key === 'completed' ? <CheckCircle className="w-5 h-5" /> : null}
                    {col.key === 'in_progress' ? <TrendingUp className="w-5 h-5" /> : null}
                    {col.key === 'blocked' ? <AlertCircle className="w-5 h-5" /> : null}
                    {col.key === 'not_started' ? <Clock className="w-5 h-5" /> : null}
                  </span>
                  <h3 className="font-bold text-sm" style={{ color: col.color }}>
                    {col.label}
                  </h3>
                </div>
                <span className="bg-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                  {col.items.length}
                </span>
              </div>

              <div className="space-y-3">
                {col.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">بدون فعالیت</div>
                ) : (
                  col.items.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h4 className="font-medium text-sm text-gray-800">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${item.progress_percent}%`,
                            backgroundColor: col.color,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{item.responsible?.full_name}</span>
                        </div>
                        <span>{item.progress_percent}%</span>
                      </div>
                      {item.planned_end && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>پایان: {item.planned_end}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}