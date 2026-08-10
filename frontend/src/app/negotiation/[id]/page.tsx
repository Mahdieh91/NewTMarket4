'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Send,
  Clock,
  CheckCheck,
  Paperclip,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import {
  useAuthStore,
  authenticatedFetch,
  API_URL,
} from '@/store/auth-store';

/* ============================================================
   Types
   ============================================================ */

type NegotiationStatus =
  | 'created'
  | 'in_progress'
  | 'awaiting_proposal'
  | 'proposal_sent'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'contracted'
  | string;

interface ApiUser {
  id: number | string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  role?: string;
}

interface ApiMessage {
  id: number;
  negotiation: number | string;
  sender: number | string | ApiUser;
  text: string;
  file?: string | null;
  timestamp: string;
}

interface ApiNegotiation {
  id: number | string;

  product?: number | string | Record<string, unknown> | null;
  product_title?: string;
  product_seller?: number;

  need?: number | string | Record<string, unknown> | null;

  buyer: number | string | ApiUser;
  supplier: number | string | ApiUser;

  status: NegotiationStatus;

  created_at: string;
  updated_at: string;

  messages?: ApiMessage[];
}

interface MessageItem {
  id: number;
  senderId: number | string | null;
  senderName: string;
  text: string;
  timestamp: string;
  file?: string | null;
  isMe: boolean;
}

/* ============================================================
   Status labels
   ============================================================ */

const STATUS_LABELS: Record<string, string> = {
  created: 'ایجاد شده',
  in_progress: 'در حال مکاتبه',
  awaiting_proposal: 'در انتظار پیشنهاد',
  proposal_sent: 'پیشنهاد ارسال شده',
  under_review: 'در حال بررسی',
  accepted: 'پذیرفته شده',
  rejected: 'رد شده',
  contracted: 'ورود به قرارداد',
};

/* ============================================================
   URL helpers
   ============================================================ */

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

const API_BASE = normalizeBaseUrl(API_URL);

/* ============================================================
   Generic helpers
   ============================================================ */

function getObjectId(
  value:
    | number
    | string
    | ApiUser
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value === 'object') {
    return value.id;
  }

  return value;
}

function getUserDisplayName(
  value:
    | number
    | string
    | ApiUser
    | null
    | undefined,
  fallback: string,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (typeof value === 'object') {
    const fullName = [
      value.first_name,
      value.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (fullName) {
      return fullName;
    }

    if (value.company_name) {
      return value.company_name;
    }

    if (value.username) {
      return value.username;
    }

    if (value.email) {
      return value.email;
    }

    return fallback;
  }

  return fallback;
}

function formatPersianDate(
  value?: string,
) {
  if (!value) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(
      'fa-IR',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTime(
  value?: string,
) {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(
      'fa-IR',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(new Date(value));
  } catch {
    return '';
  }
}

/* ============================================================
   Page
   ============================================================ */

export default function NegotiationPage() {
  const params = useParams();
  const router = useRouter();

  const negotiationKey = useMemo(() => {
    const rawId = params?.id;

    if (Array.isArray(rawId)) {
      return rawId[0] || '';
    }

    return typeof rawId === 'string'
      ? rawId
      : '';
  }, [params]);

  const {
    user,
    isAuthenticated,
  } = useAuthStore();

  const [negotiation, setNegotiation] =
    useState<ApiNegotiation | null>(null);

  const [messages, setMessages] =
    useState<MessageItem[]>([]);

  const [newMessage, setNewMessage] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSending, setIsSending] =
    useState(false);

  const [isEnding, setIsEnding] =
    useState(false);

  const [isStarting, setIsStarting] =
    useState(false);

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  // State برای مدیریت شروع مذاکره
  const [canStart, setCanStart] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /* ============================================================
     نقش کاربر
     ============================================================ */

  const isSeller =
    user?.role === 'seller';

  /* ============================================================
     API Fetch
     ============================================================ */

  const apiFetch = useCallback(
    async (
      path: string,
      init: RequestInit = {},
    ): Promise<Response> => {
      const url = `${API_BASE}${path}`;

      let response: Response;

      try {
        response =
          await authenticatedFetch(
            url,
            init,
          );
      } catch (err) {
        console.error(
          '❌ API FETCH ERROR:',
          err,
        );

        throw new Error(
          'خطا در ارتباط با سرور. لطفاً Backend را بررسی کنید.',
        );
      }

      if (!response.ok) {
        let message =
          `خطای سرور (${response.status})`;

        try {
          const data =
            await response.json();

          if (
            typeof data?.detail ===
            'string'
          ) {
            message =
              data.detail;
          } else if (
            typeof data?.message ===
            'string'
          ) {
            message =
              data.message;
          } else if (
            typeof data === 'object' &&
            data !== null
          ) {
            const firstError =
              Object.values(data)
                .flat()
                .find(
                  (item) =>
                    typeof item ===
                    'string',
                );

            if (firstError) {
              message =
                firstError as string;
            }
          }
        } catch {
          // پاسخ JSON نبود
        }

        console.error(
          `❌ API ERROR ${response.status}:`,
          url,
        );

        throw new Error(message);
      }

      return response;
    },
    [],
  );

  /* ============================================================
     Map message
     ============================================================ */

  const mapMessage = useCallback(
    (
      message: ApiMessage,
    ): MessageItem => {
      const senderId =
        getObjectId(
          message.sender,
        );

      const currentUserId =
        user?.id;

      const isMe =
        currentUserId !==
          undefined &&
        currentUserId !== null &&
        senderId !== null &&
        String(senderId) ===
          String(currentUserId);

      return {
        id: message.id,

        senderId,

        senderName:
          getUserDisplayName(
            message.sender,
            isMe
              ? 'شما'
              : 'طرف مذاکره',
          ),

        text:
          message.text || '',

        timestamp:
          message.timestamp,

        file:
          message.file || null,

        isMe,
      };
    },
    [user?.id],
  );

  /* ============================================================
     دریافت مذاکره
     ============================================================ */

  const loadNegotiation =
    useCallback(async () => {
      if (!negotiationKey) {
        setNegotiation(null);
        setMessages([]);
        setError('شناسه مذاکره مشخص نیست.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      setCanStart(false);
      setProductId(null);

      try {
        const negotiationEndpoint =
          `/negotiations/${encodeURIComponent(
            negotiationKey,
          )}/`;

        console.log(
          '🔵 GET NEGOTIATION:',
          `${API_BASE}${negotiationEndpoint}`,
        );

        const response =
          await apiFetch(
            negotiationEndpoint,
          );

        const data =
          (await response.json()) as ApiNegotiation & {
            exists?: boolean;
            role?: string;
            can_start?: boolean;
            product_id?: number;
            product_title?: string;
            message?: string;
          };

        // ---- بررسی حالت بدون مذاکره ----
        if (data.exists === false) {
          setNegotiation(null);
          setMessages([]);
          setError(data.message || 'هنوز مذاکره‌ای آغاز نشده است.');
          setCanStart(data.can_start === true);
          setProductId(data.product_id ?? null);
          setIsLoading(false);
          return;
        }

        // ---- حالت عادی: مذاکره وجود دارد ----
        setNegotiation(data);
        setCanStart(false);
        setProductId(null);

        if (
          Array.isArray(
            data.messages,
          )
        ) {
          setMessages(
            data.messages.map(
              mapMessage,
            ),
          );
        } else {
          const messagesResponse =
            await apiFetch(
              `/messages/?negotiation=${encodeURIComponent(
                String(data.id),
              )}&ordering=timestamp`,
            );

          const messagesData =
            await messagesResponse.json();

          const rawMessages =
            Array.isArray(
              messagesData,
            )
              ? messagesData
              : Array.isArray(
                    messagesData?.results,
                  )
                ? messagesData.results
                : [];

          setMessages(
            rawMessages.map(
              mapMessage,
            ),
          );
        }
      } catch (err: any) {
        console.error(
          '❌ loadNegotiation:',
          err,
        );

        setNegotiation(null);
        setMessages([]);

        setError(
          err?.message ||
            'خطا در دریافت مذاکره.',
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      negotiationKey,
      apiFetch,
      mapMessage,
    ]);

  /* ============================================================
     شروع مذاکره (برای خریدار)
     ============================================================ */

  const handleStartNegotiation =
    async () => {
      if (!productId || isStarting) {
        return;
      }

      setIsStarting(true);
      setError('');

      try {
        const response =
          await apiFetch(
            '/negotiations/',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                product: productId,
              }),
            },
          );

        const data =
          await response.json();

        // بعد از ایجاد، به صفحه مذاکره جدید بروید
        router.push(
          `/negotiation/${data.id}`,
        );
      } catch (err: any) {
        console.error(
          '❌ start negotiation:',
          err,
        );
        setError(
          err?.message ||
            'خطا در شروع مذاکره.',
        );
      } finally {
        setIsStarting(false);
      }
    };

  /* ============================================================
     Load
     ============================================================ */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadNegotiation();
  }, [
    isAuthenticated,
    loadNegotiation,
  ]);

  /* ============================================================
     Scroll
     ============================================================ */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: 'smooth',
      },
    );
  }, [messages]);

  /* ============================================================
     ارسال پیام
     ============================================================ */

  const handleSend =
    async () => {
      const text =
        newMessage.trim();

      if (
        !text ||
        !negotiation ||
        isSending
      ) {
        return;
      }

      setIsSending(true);
      setError('');
      setSuccessMessage('');

      try {
        const response =
          await apiFetch(
            '/messages/',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                negotiation:
                  negotiation.id,
                text,
              }),
            },
          );

        const createdMessage =
          (await response.json()) as ApiMessage;

        setMessages(
          (previous) => [
            ...previous,
            mapMessage(
              createdMessage,
            ),
          ],
        );

        setNewMessage('');
      } catch (err: any) {
        console.error(
          '❌ send message:',
          err,
        );

        setError(
          err?.message ||
            'ارسال پیام انجام نشد.',
        );
      } finally {
        setIsSending(false);
      }
    };

  /* ============================================================
     Enter
     ============================================================ */

  const handleKeyDown = (
    event: React.KeyboardEvent,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  /* ============================================================
     پایان مذاکره بدون قرارداد
     ============================================================ */

  const handleEndWithoutContract =
    async () => {
      if (
        !negotiation ||
        isEnding
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          'آیا مطمئن هستید که می‌خواهید مذاکره را بدون عقد قرارداد پایان دهید؟',
        );

      if (!confirmed) {
        return;
      }

      setIsEnding(true);
      setError('');
      setSuccessMessage('');

      try {
        const endpoint =
          `/negotiations/${encodeURIComponent(
            negotiationKey,
          )}/`;

        await apiFetch(
          endpoint,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              status: 'rejected',
            }),
          },
        );

        setNegotiation(
          (previous) =>
            previous
              ? {
                  ...previous,
                  status:
                    'rejected',
                }
              : previous,
        );

        setSuccessMessage(
          'مذاکره بدون قرارداد پایان یافت.',
        );

        setTimeout(() => {
          router.push(
            '/matching',
          );
        }, 800);
      } catch (err: any) {
        console.error(
          '❌ end negotiation:',
          err,
        );

        setError(
          err?.message ||
            'پایان مذاکره انجام نشد.',
        );
      } finally {
        setIsEnding(false);
      }
    };

  /* ============================================================
     انتقال به قرارداد
     ============================================================ */

  const handleContract =
    async () => {
      if (
        !negotiation ||
        !isSeller ||
        isEnding
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          'آیا می‌خواهید این مذاکره را به قرارداد منتقل کنید؟',
        );

      if (!confirmed) {
        return;
      }

      setIsEnding(true);
      setError('');
      setSuccessMessage('');

      try {
        const endpoint =
          `/negotiations/${encodeURIComponent(
            negotiationKey,
          )}/`;

        await apiFetch(
          endpoint,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              status:
                'contracted',
            }),
          },
        );

        setNegotiation(
          (previous) =>
            previous
              ? {
                  ...previous,
                  status:
                    'contracted',
                }
              : previous,
        );

        router.push(
          `/contract/${encodeURIComponent(
            String(
              negotiation.id,
            ),
          )}`,
        );
      } catch (err: any) {
        console.error(
          '❌ contract:',
          err,
        );

        setError(
          err?.message ||
            'انتقال مذاکره به قرارداد انجام نشد.',
        );
      } finally {
        setIsEnding(false);
      }
    };

  /* ============================================================
     Loading - Auth
     ============================================================ */

  if (!isAuthenticated) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', Tahoma, sans-serif",
        }}
      >
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <Loader2
            className="mx-auto h-8 w-8 animate-spin text-[#1E3A8A]"
          />

          <p className="mt-4 font-bold text-gray-700">
            در حال بررسی ورود کاربر...
          </p>
        </div>
      </main>
    );
  }

  /* ============================================================
     Loading - Negotiation
     ============================================================ */

  if (isLoading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', Tahoma, sans-serif",
        }}
      >
        <div className="rounded-3xl bg-white p-10 text-center shadow-xl">
          <Loader2
            className="mx-auto h-10 w-10 animate-spin text-[#14B8A6]"
          />

          <h2 className="mt-5 text-lg font-black text-gray-800">
            در حال دریافت مذاکره
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            لطفاً چند لحظه صبر کنید...
          </p>
        </div>
      </main>
    );
  }

  /* ============================================================
     Error - No Negotiation (but can start)
     ============================================================ */

  if (!negotiation && canStart) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', Tahoma, sans-serif",
        }}
      >
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Building2 className="h-8 w-8 text-[#1E3A8A]" />
          </div>

          <h1 className="mt-5 text-center text-xl font-black text-gray-800">
            شروع مذاکره
          </h1>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm leading-7 text-blue-700">
            {error || 'هنوز مذاکره‌ای برای این محصول آغاز نشده است.'}
          </div>

          <button
            onClick={
              handleStartNegotiation
            }
            disabled={isStarting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {isStarting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'شروع مذاکره'
            )}
          </button>

          <button
            onClick={() =>
              router.back()
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            بازگشت
          </button>
        </div>
      </main>
    );
  }

  /* ============================================================
     Error - General
     ============================================================ */

  if (!negotiation) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', Tahoma, sans-serif",
        }}
      >
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="mt-5 text-center text-xl font-black text-gray-800">
            مذاکره پیدا نشد
          </h1>

          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm leading-7 text-red-700">
            {error ||
              'خطا در دریافت اطلاعات مذاکره'}
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
            <p className="text-xs text-gray-500">
              Endpoint مذاکره
            </p>

            <p className="mt-2 break-all text-xs font-bold text-[#1E3A8A]">
              {API_BASE}
              /negotiations/
              {negotiationKey}/
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={
                loadNegotiation
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              <RefreshCw size={17} />
              تلاش مجدد
            </button>

            <button
              onClick={() =>
                router.back()
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={17} />
              بازگشت
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ============================================================
     Parties
     ============================================================ */

  const buyerId =
    getObjectId(
      negotiation.buyer,
    );

  const supplierId =
    getObjectId(
      negotiation.supplier,
    );

  const buyerName =
    getUserDisplayName(
      negotiation.buyer,
      `خریدار #${buyerId ?? '—'}`,
    );

  const supplierName =
    getUserDisplayName(
      negotiation.supplier,
      `تأمین‌کننده #${supplierId ?? '—'}`,
    );

  /* ============================================================
     Render
     ============================================================ */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 md:p-6"
      style={{
        fontFamily:
          "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Back */}

        <div className="mb-5">
          <button
            onClick={() =>
              router.back()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition hover:text-[#1E3A8A] hover:shadow-md"
          >
            <ArrowLeft size={17} />
            بازگشت
          </button>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-bold">
                خطا
              </p>

              <p className="mt-1 leading-6">
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                setError('')
              }
              className="text-red-400 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Success */}

        {successMessage && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Main Card */}

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">

          {/* Header */}

          <div className="relative overflow-hidden bg-gradient-to-r from-[#1E3A8A] via-[#1A56B0] to-[#14B8A6] p-6 text-white md:p-8">

            <div className="absolute inset-0 opacity-10">
              <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl" />

              <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur">
                  <Building2 className="h-8 w-8" />
                </div>

                <div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">

                    <span className="rounded-full border border-teal-300/40 bg-teal-400/30 px-3 py-1 text-xs font-bold backdrop-blur">
                      <Clock className="ml-1 inline h-3 w-3" />

                      {STATUS_LABELS[
                        negotiation.status
                      ] ||
                        negotiation.status}
                    </span>

                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
                      <Calendar className="ml-1 inline h-3 w-3" />

                      شروع:{' '}
                      {formatPersianDate(
                        negotiation.created_at,
                      )}
                    </span>

                  </div>

                  <h1 className="text-xl font-black md:text-3xl">
                    مذاکره شماره #
                    {negotiation.id}
                  </h1>

                  <p className="mt-2 text-xs text-blue-100">
                    شناسه مسیر:{' '}
                    {negotiationKey}
                  </p>

                  {negotiation.product_title && (
                    <p className="mt-1 text-sm text-blue-200">
                      محصول: {negotiation.product_title}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}

              <div className="flex flex-wrap gap-2">

                {isSeller &&
                  negotiation.status !==
                    'contracted' &&
                  negotiation.status !==
                    'rejected' && (
                    <button
                      onClick={
                        handleContract
                      }
                      disabled={
                        isEnding
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isEnding ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle
                          size={17}
                        />
                      )}

                      اتمام مذاکره و قرارداد
                    </button>
                  )}

                {negotiation.status !==
                  'contracted' &&
                  negotiation.status !==
                    'rejected' && (
                    <button
                      onClick={
                        handleEndWithoutContract
                      }
                      disabled={
                        isEnding
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle size={17} />

                      بدون قرارداد
                    </button>
                  )}

              </div>
            </div>
          </div>

          {/* Parties */}

          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-5 md:grid-cols-2 md:p-6">

            <div className="flex items-center gap-4 rounded-2xl bg-blue-50/60 p-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-lg font-black text-white">
                {buyerName.charAt(0)}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400">
                  خریدار
                </p>

                <p className="font-black text-gray-800">
                  {buyerName}
                </p>

                <p className="text-xs text-gray-500">
                  شناسه:{' '}
                  {buyerId ?? '—'}
                </p>
              </div>

            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-teal-50/60 p-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#14B8A6] text-lg font-black text-white">
                {supplierName.charAt(0)}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400">
                  تأمین‌کننده
                </p>

                <p className="font-black text-gray-800">
                  {supplierName}
                </p>

                <p className="text-xs text-gray-500">
                  شناسه:{' '}
                  {supplierId ?? '—'}
                </p>
              </div>

            </div>

          </div>

          {/* Chat */}

          <div className="h-[520px] overflow-y-auto bg-gray-50/70 p-5 md:p-7">

            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Send className="h-7 w-7 text-gray-300" />
                  </div>

                  <p className="font-bold text-gray-600">
                    هنوز پیامی ارسال نشده است.
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    اولین پیام مذاکره را ارسال کنید.
                  </p>

                </div>
              </div>
            ) : (
              <div className="space-y-5">

                {messages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isMe
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div className="max-w-[85%] md:max-w-[65%]">

                        {!message.isMe && (
                          <p className="mb-1 mr-2 text-xs font-bold text-gray-400">
                            {
                              message.senderName
                            }
                          </p>
                        )}

                        <div
                          className={`rounded-2xl p-4 shadow-sm ${
                            message.isMe
                              ? 'rounded-br-md bg-[#1E3A8A] text-white'
                              : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                          }`}
                        >

                          <p className="whitespace-pre-wrap text-sm leading-7">
                            {
                              message.text
                            }
                          </p>

                          {message.file && (
                            <a
                              href={
                                message.file
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-3 block text-xs underline ${
                                message.isMe
                                  ? 'text-blue-100'
                                  : 'text-blue-600'
                              }`}
                            >
                              مشاهده فایل پیوست
                            </a>
                          )}

                        </div>

                        <div
                          className={`mt-1 flex items-center gap-1 text-[11px] text-gray-400 ${
                            message.isMe
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <span>
                            {formatTime(
                              message.timestamp,
                            )}
                          </span>

                          {message.isMe && (
                            <CheckCheck className="h-3.5 w-3.5 text-teal-500" />
                          )}
                        </div>

                      </div>
                    </div>
                  ),
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />

              </div>
            )}

          </div>

          {/* Message Composer */}

          {negotiation.status !==
            'rejected' &&
            negotiation.status !==
              'contracted' && (

            <div className="border-t border-gray-100 bg-white p-4 md:p-5">

              <div className="flex items-end gap-2">

                <button
                  type="button"
                  disabled
                  title="ضمیمه فایل به‌زودی فعال می‌شود"
                  className="rounded-xl p-3 text-gray-300"
                >
                  <Paperclip size={20} />
                </button>

                <div className="relative flex-1">

                  <textarea
                    value={
                      newMessage
                    }
                    onChange={(
                      event,
                    ) =>
                      setNewMessage(
                        event.target
                          .value,
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                    disabled={
                      isSending
                    }
                    rows={2}
                    placeholder="پیام خود را بنویسید... (Enter برای ارسال)"
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#14B8A6] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                <button
                  type="button"
                  onClick={
                    handleSend
                  }
                  disabled={
                    !newMessage.trim() ||
                    isSending
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6] text-white shadow-md transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSending ? (
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={20} />
                  )}
                </button>

              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-gray-400">

                <span>
                  آخرین بروزرسانی:{' '}
                  {formatPersianDate(
                    negotiation.updated_at,
                  )}
                </span>

                <span>
                  Enter = ارسال
                </span>

              </div>

            </div>
          )}

          {/* Final status */}

          {(negotiation.status ===
            'contracted' ||
            negotiation.status ===
              'rejected') && (

            <div className="border-t border-gray-100 bg-white p-5">

              <div
                className={`rounded-2xl p-4 text-center ${
                  negotiation.status ===
                  'contracted'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-red-200 bg-red-50 text-red-700'
                }`}
              >

                <p className="font-black">
                  {negotiation.status ===
                  'contracted'
                    ? 'این مذاکره به قرارداد منتقل شده است.'
                    : 'این مذاکره بدون قرارداد پایان یافته است.'}
                </p>

                {negotiation.status ===
                  'contracted' && (
                  <Link
                    href={`/contract/${encodeURIComponent(
                      String(
                        negotiation.id,
                      ),
                    )}`}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    مشاهده قرارداد
                    <ArrowLeft size={16} />
                  </Link>
                )}

              </div>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}