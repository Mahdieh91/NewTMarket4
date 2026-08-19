// src/app/contract/[id]/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Calendar,
  DollarSign,
  Users,
  FileCheck,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  ListChecks,
  PlayCircle,
} from 'lucide-react';
import {
  authenticatedFetch,
  API_URL,
  useAuthStore,
} from '@/store/auth-store';

interface Milestone {
  id: number;
  contract: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status:
    | 'not_started'
    | 'in_progress'
    | 'awaiting_approval'
    | 'needs_revision'
    | 'completed'
    | string;
  deliverables: string | null;
  completed_at: string | null;
}

interface Contract {
  id: number;
  negotiation: number | null;
  buyer: number | string;
  supplier: number | string;
  terms: string;
  total_value: string | number;
  status:
    | 'draft'
    | 'legal_review'
    | 'valuation'
    | 'approved_buyer'
    | 'approved_supplier'
    | 'signed'
    | 'execution'
    | 'completed'
    | 'disputed'
    | string;
  contract_file: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  milestones: Milestone[];
}

interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, unknown>;
}

const CONTRACT_STATUS = {
  draft: {
    label: 'پیش‌نویس قرارداد',
    color: 'slate',
  },
  legal_review: {
    label: 'بررسی حقوقی',
    color: 'amber',
  },
  valuation: {
    label: 'ارزش‌گذاری',
    color: 'blue',
  },
  approved_buyer: {
    label: 'تأیید خریدار',
    color: 'indigo',
  },
  approved_supplier: {
    label: 'تأیید فروشنده',
    color: 'violet',
  },
  signed: {
    label: 'امضا شده',
    color: 'emerald',
  },
  execution: {
    label: 'در حال اجرا',
    color: 'cyan',
  },
  completed: {
    label: 'تکمیل شده',
    color: 'green',
  },
  disputed: {
    label: 'وارد اختلاف شده',
    color: 'red',
  },
} as const;

const CONTRACT_STEPS = [
  {
    status: 'draft',
    label: 'پیش‌نویس قرارداد',
  },
  {
    status: 'legal_review',
    label: 'بررسی حقوقی',
  },
  {
    status: 'valuation',
    label: 'ارزش‌گذاری',
  },
  {
    status: 'approved_buyer',
    label: 'تأیید خریدار',
  },
  {
    status: 'approved_supplier',
    label: 'تأیید فروشنده',
  },
  {
    status: 'signed',
    label: 'امضای قرارداد',
  },
  {
    status: 'execution',
    label: 'شروع اجرا',
  },
  {
    status: 'completed',
    label: 'تکمیل قرارداد',
  },
];

const MILESTONE_STATUS: Record<
  string,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle;
  }
> = {
  not_started: {
    label: 'شروع نشده',
    className: 'bg-slate-100 text-slate-600',
    icon: Clock,
  },
  in_progress: {
    label: 'در حال انجام',
    className: 'bg-blue-100 text-blue-700',
    icon: PlayCircle,
  },
  awaiting_approval: {
    label: 'در انتظار تأیید',
    className: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  needs_revision: {
    label: 'نیازمند اصلاح',
    className: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
  completed: {
    label: 'تکمیل شده',
    className: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle,
  },
};

function getContractStatus(status: string) {
  return (
    CONTRACT_STATUS[
      status as keyof typeof CONTRACT_STATUS
    ] || {
      label: status || 'نامشخص',
      color: 'slate',
    }
  );
}

function getStatusIndex(status: string): number {
  return CONTRACT_STEPS.findIndex(
    (step) => step.status === status
  );
}

function formatCurrency(value: string | number): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat('fa-IR').format(
    numericValue
  );
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getFileUrl(
  file: string | null | undefined
): string | null {
  if (!file) {
    return null;
  }

  if (
    file.startsWith('http://') ||
    file.startsWith('https://')
  ) {
    return file;
  }

  const apiOrigin = API_URL.replace(/\/api\/?$/, '');

  if (file.startsWith('/')) {
    return `${apiOrigin}${file}`;
  }

  return `${apiOrigin}/${file}`;
}

function getMilestoneStatus(
  status: string
) {
  return (
    MILESTONE_STATUS[status] || {
      label: status || 'نامشخص',
      className: 'bg-slate-100 text-slate-600',
      icon: Clock,
    }
  );
}

export default function ContractPage() {
  const params = useParams();

  const idParam = params?.id;

  const contractId = Array.isArray(idParam)
    ? idParam[0]
    : idParam;

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const [contract, setContract] =
    useState<Contract | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [toast, setToast] =
    useState<string | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setToast(message);

      window.setTimeout(() => {
        setToast(null);
      }, 3000);
    },
    []
  );

  const loadContract = useCallback(
    async (showLoading = true) => {
      if (!contractId) {
        setError(
          'شناسه قرارداد مشخص نیست.'
        );

        setIsLoading(false);

        return;
      }

      if (showLoading) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response =
          await authenticatedFetch(
            `${API_URL}/contracts/${encodeURIComponent(
              contractId
            )}/`,
            {
              method: 'GET',
            }
          );

        if (response.status === 401) {
          setError(
            'احراز هویت شما معتبر نیست. لطفاً دوباره وارد حساب شوید.'
          );

          setContract(null);

          return;
        }

        if (response.status === 404) {
          setError(
            'قرارداد مورد نظر یافت نشد.'
          );

          setContract(null);

          return;
        }

        if (!response.ok) {
          let errorData: ApiError = {};

          try {
            errorData =
              await response.json();
          } catch {
            // پاسخ JSON نبود
          }

          const serverMessage =
            errorData.detail ||
            errorData.message;

          setError(
            serverMessage ||
              `خطا در دریافت قرارداد. کد خطا: ${response.status}`
          );

          setContract(null);

          return;
        }

        const data =
          (await response.json()) as Contract;

        if (
          !data ||
          typeof data !== 'object' ||
          typeof data.id === 'undefined'
        ) {
          setError(
            'پاسخ دریافتی از سرور برای قرارداد معتبر نیست.'
          );

          setContract(null);

          return;
        }

        setContract({
          ...data,
          milestones: Array.isArray(
            data.milestones
          )
            ? data.milestones
            : [],
        });
      } catch (requestError) {
        console.error(
          '❌ Contract request failed:',
          requestError
        );

        setError(
          'ارتباط با سرور برقرار نشد. اتصال Django و API را بررسی کنید.'
        );

        setContract(null);
      } finally {
        setIsLoading(false);
      }
    },
    [contractId]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);

      return;
    }

    void loadContract();
  }, [
    isAuthenticated,
    loadContract,
  ]);

  const statusInfo = useMemo(() => {
    if (!contract) {
      return null;
    }

    return getContractStatus(
      contract.status
    );
  }, [contract]);

  const currentStatusIndex = useMemo(() => {
    if (!contract) {
      return -1;
    }

    return getStatusIndex(
      contract.status
    );
  }, [contract]);

  const completedMilestones = useMemo(() => {
    if (!contract) {
      return 0;
    }

    return contract.milestones.filter(
      (milestone) =>
        milestone.status === 'completed'
    ).length;
  }, [contract]);

  const milestoneProgress = useMemo(() => {
    if (
      !contract ||
      contract.milestones.length === 0
    ) {
      return 0;
    }

    return Math.round(
      (completedMilestones /
        contract.milestones.length) *
        100
    );
  }, [
    contract,
    completedMilestones,
  ]);

  const handleDownloadContract = async () => {
    if (!contract?.contract_file) {
      showToast(
        'برای این قرارداد فایل قرارداد ثبت نشده است.'
      );

      return;
    }

    const fileUrl = getFileUrl(
      contract.contract_file
    );

    if (!fileUrl) {
      showToast(
        'آدرس فایل قرارداد معتبر نیست.'
      );

      return;
    }

    setIsDownloading(true);

    try {
      const response =
        await authenticatedFetch(fileUrl, {
          method: 'GET',
        });

      if (!response.ok) {
        showToast(
          'دریافت فایل قرارداد با خطا مواجه شد.'
        );

        return;
      }

      const blob =
        await response.blob();

      const blobUrl =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href = blobUrl;
      anchor.download =
        `contract-${contract.id}`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(blobUrl);

      showToast(
        'فایل قرارداد با موفقیت دریافت شد.'
      );
    } catch (downloadError) {
      console.error(
        '❌ Contract file download failed:',
        downloadError
      );

      showToast(
        'خطا در دریافت فایل قرارداد.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50"
        dir="rtl"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
        }}
      >
        <div className="text-center">
          <AlertCircle
            size={48}
            className="mx-auto text-amber-500 mb-4"
          />

          <h1 className="text-lg font-extrabold text-slate-800">
            نیاز به ورود به حساب کاربری دارید
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            برای مشاهده اطلاعات قرارداد ابتدا وارد حساب خود شوید.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50"
        dir="rtl"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-40 bg-slate-200 rounded-lg" />

            <div className="h-36 bg-slate-200 rounded-2xl" />

            <div className="h-32 bg-slate-200 rounded-2xl" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-slate-200 rounded-2xl" />
              <div className="h-48 bg-slate-200 rounded-2xl" />
            </div>

            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50"
        dir="rtl"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
        }}
      >
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle
              size={30}
              className="text-red-500"
            />
          </div>

          <h1 className="text-lg font-extrabold text-slate-900">
            دریافت قرارداد ناموفق بود
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-7">
            {error ||
              'اطلاعات قرارداد در دسترس نیست.'}
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={() =>
                void loadContract()
              }
              className="px-4 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold flex items-center gap-2 hover:bg-[#172f70] transition"
            >
              <RefreshCw size={15} />
              تلاش مجدد
            </button>

            <Link
              href="/market"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition"
            >
              بازگشت به بازار
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa] print:bg-white"
      style={{
        fontFamily:
          "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
      dir="rtl"
    >
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle size={16} />

          <span className="text-sm font-bold">
            {toast}
          </span>
        </div>
      )}

      {/* نوار بالا */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
          <Link
            href={
              contract.negotiation
                ? `/negotiation/${contract.negotiation}`
                : '/market'
            }
            className="flex items-center gap-2 text-slate-600 hover:text-[#1E3A8A] transition flex-shrink-0"
          >
            <ArrowRight size={20} />

            <span className="text-sm font-bold">
              {contract.negotiation
                ? 'بازگشت به مذاکره'
                : 'بازگشت به بازار'}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {contract.status ===
              'execution' && (
              <Link
                href={`/execution/${contract.id}`}
                className="px-3 py-2 rounded-xl bg-[#14B8A6] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#0f9f91] transition"
              >
                <PlayCircle size={14} />
                مشاهده اجرا
              </Link>
            )}

            {contract.contract_file && (
              <button
                type="button"
                onClick={
                  handleDownloadContract
                }
                disabled={isDownloading}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 transition"
              >
                {isDownloading ? (
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={14} />
                )}

                دانلود قرارداد
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition"
            >
              <Printer size={14} />
              پرینت
            </button>

            <button
              type="button"
              onClick={() =>
                void loadContract(
                  false
                )
              }
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              title="به‌روزرسانی اطلاعات"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* هدر قرارداد */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] p-6 text-white mb-6 print:shadow-none print:border print:border-slate-200">
          <div className="absolute inset-0 opacity-10 print:hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <FileText size={30} />
              </div>

              <div>
                <p className="text-xs text-white/70 mb-1">
                  قرارداد شماره {contract.id}
                </p>

                <h1 className="text-xl md:text-2xl font-extrabold">
                  قرارداد شماره {contract.id}
                </h1>

                <p className="text-xs text-white/80 mt-2">
                  آخرین به‌روزرسانی:{' '}
                  {formatDateTime(
                    contract.updated_at
                  )}
                </p>
              </div>
            </div>

            {statusInfo && (
              <div className="self-start md:self-center px-4 py-2 rounded-xl bg-white/15 border border-white/20 text-sm font-bold">
                {statusInfo.label}
              </div>
            )}
          </div>
        </div>

        {/* وضعیت قرارداد */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle
                size={20}
                className="text-[#1E3A8A]"
              />
              وضعیت قرارداد
            </h2>

            <span className="text-xs text-slate-400">
              وضعیت فعلی: {statusInfo?.label}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex items-center min-w-max">
              {CONTRACT_STEPS.map(
                (step, index) => {
                  const stepIndex =
                    index;

                  const isCompleted =
                    currentStatusIndex >=
                    0 &&
                    stepIndex <
                      currentStatusIndex;

                  const isCurrent =
                    step.status ===
                    contract.status;

                  return (
                    <div
                      key={step.status}
                      className="flex items-center"
                    >
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                          isCurrent
                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border-transparent'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle
                            size={14}
                          />
                        ) : isCurrent ? (
                          <Clock
                            size={14}
                          />
                        ) : (
                          <AlertCircle
                            size={14}
                          />
                        )}

                        {step.label}
                      </div>

                      {index <
                        CONTRACT_STEPS.length -
                          1 && (
                        <div
                          className={`w-5 h-0.5 mx-1 ${
                            isCompleted
                              ? 'bg-emerald-300'
                              : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* اطلاعات اصلی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* طرفین */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none">
            <h3 className="text-sm font-extrabold text-slate-900 mb-5 flex items-center gap-2">
              <Users
                size={18}
                className="text-[#1E3A8A]"
              />
              طرفین قرارداد
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-600 mb-1">
                  خریدار
                </p>

                <p className="text-lg font-extrabold text-blue-900">
                  کاربر #{String(contract.buyer)}
                </p>

                <p className="text-xs text-blue-600 mt-2">
                  شناسه کاربر ثبت‌شده در قرارداد
                </p>
              </div>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-xs font-bold text-teal-600 mb-1">
                  فروشنده
                </p>

                <p className="text-lg font-extrabold text-teal-900">
                  کاربر #{String(contract.supplier)}
                </p>

                <p className="text-xs text-teal-600 mt-2">
                  شناسه کاربر ثبت‌شده در قرارداد
                </p>
              </div>
            </div>
          </div>

          {/* اطلاعات مالی */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none">
            <h3 className="text-sm font-extrabold text-slate-900 mb-5 flex items-center gap-2">
              <DollarSign
                size={18}
                className="text-[#14B8A6]"
              />
              اطلاعات مالی و زمانی
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  مبلغ قرارداد
                </span>

                <span className="text-lg font-extrabold text-[#1E3A8A]">
                  {formatCurrency(
                    contract.total_value
                  )}{' '}
                  تومان
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  تاریخ ایجاد
                </span>

                <span className="text-sm font-bold text-slate-700">
                  {formatDate(
                    contract.created_at
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  آخرین تغییر
                </span>

                <span className="text-sm font-bold text-slate-700">
                  {formatDate(
                    contract.updated_at
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  تاریخ امضا
                </span>

                <span className="text-sm font-bold text-slate-700">
                  {formatDateTime(
                    contract.signed_at
                  )}
                </span>
              </div>

              {contract.negotiation !==
                null && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    مذاکره مرتبط
                  </span>

                  <Link
                    href={`/negotiation/${contract.negotiation}`}
                    className="text-sm font-bold text-[#1E3A8A] hover:underline"
                  >
                    مذاکره #
                    {contract.negotiation}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* شرایط قرارداد */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none">
          <h3 className="text-sm font-extrabold text-slate-900 mb-5 flex items-center gap-2">
            <FileCheck
              size={18}
              className="text-[#1E3A8A]"
            />
            شرایط و مفاد قرارداد
          </h3>

          <div
            className="prose prose-sm max-w-none text-slate-700 leading-8
              [&_p]:mb-3
              [&_ul]:pr-5
              [&_ol]:pr-5
              [&_li]:mb-1
              [&_strong]:font-extrabold
              [&_h1]:font-extrabold
              [&_h2]:font-extrabold
              [&_h3]:font-extrabold"
            dangerouslySetInnerHTML={{
              __html:
                contract.terms ||
                '<p>شرایطی برای این قرارداد ثبت نشده است.</p>',
            }}
          />
        </div>

        {/* نقاط عطف */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ListChecks
                size={18}
                className="text-[#14B8A6]"
              />
              مراحل و نقاط عطف قرارداد
            </h3>

            <div className="text-xs text-slate-500">
              {completedMilestones} از{' '}
              {contract.milestones.length}{' '}
              مرحله تکمیل شده
            </div>
          </div>

          {contract.milestones.length >
          0 ? (
            <>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] rounded-full transition-all"
                  style={{
                    width: `${milestoneProgress}%`,
                  }}
                />
              </div>

              <div className="space-y-4">
                {contract.milestones.map(
                  (milestone) => {
                    const milestoneStatus =
                      getMilestoneStatus(
                        milestone.status
                      );

                    const StatusIcon =
                      milestoneStatus.icon;

                    return (
                      <div
                        key={
                          milestone.id
                        }
                        className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <StatusIcon
                                size={17}
                                className={
                                  milestone.status ===
                                  'completed'
                                    ? 'text-emerald-500'
                                    : milestone.status ===
                                      'in_progress'
                                    ? 'text-blue-500'
                                    : 'text-slate-500'
                                }
                              />
                            </div>

                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800">
                                {
                                  milestone.title
                                }
                              </h4>

                              {milestone.description && (
                                <p className="text-xs text-slate-500 mt-2 leading-6">
                                  {
                                    milestone.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`self-start px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${milestoneStatus.className}`}
                          >
                            {
                              milestoneStatus.label
                            }
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4 mr-12 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar
                              size={13}
                            />
                            سررسید:{' '}
                            {formatDate(
                              milestone.due_date
                            )}
                          </span>

                          <span className="flex items-center gap-1">
                            <CheckCircle
                              size={13}
                            />
                            تکمیل:{' '}
                            {formatDateTime(
                              milestone.completed_at
                            )}
                          </span>

                          {milestone.deliverables && (
                            <a
                              href={
                                getFileUrl(
                                  milestone.deliverables
                                ) || '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1E3A8A] font-bold hover:underline"
                            >
                              مشاهده خروجی
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-8 text-center">
              <ListChecks
                size={36}
                className="mx-auto text-slate-300 mb-3"
              />

              <p className="text-sm font-bold text-slate-500">
                هنوز نقطه عطفی برای این قرارداد ثبت نشده است.
              </p>
            </div>
          )}
        </div>

        {/* فایل قرارداد */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <FileText
              size={18}
              className="text-[#1E3A8A]"
            />
            فایل قرارداد
          </h3>

          {contract.contract_file ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText
                    size={19}
                    className="text-blue-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    فایل قرارداد
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    فایل ثبت‌شده در سامانه
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleDownloadContract
                }
                disabled={isDownloading}
                className="px-4 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#172f70] disabled:opacity-50 transition"
              >
                {isDownloading ? (
                  <RefreshCw
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={14} />
                )}

                دریافت فایل
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-6 text-center">
              <FileText
                size={32}
                className="mx-auto text-slate-300 mb-2"
              />

              <p className="text-sm text-slate-500">
                هنوز فایل قرارداد برای این قرارداد ثبت نشده است.
              </p>
            </div>
          )}
        </div>

        {/* اطلاعات فنی واقعی */}
        <div className="mt-6 bg-slate-50 rounded-2xl border border-slate-200 p-4 print:hidden">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span>
              شناسه قرارداد:{' '}
              <strong className="text-slate-700">
                {contract.id}
              </strong>
            </span>

            <span>
              وضعیت API:{' '}
              <strong className="text-emerald-600">
                متصل
              </strong>
            </span>

            <span>
              منبع اطلاعات:{' '}
              <strong className="text-slate-700">
                Django REST API
              </strong>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}