'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import {
  Send,
  Clock,
  CheckCheck,
  Building2,
  Calendar,
  Paperclip,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import {
  API_URL,
  authenticatedFetch,
  getAccessToken,
  useAuthStore,
} from '@/store/auth-store';


interface NegotiationMessage {
  id: number;
  negotiation: number;
  sender: number;
  sender_name: string;
  text: string;
  file: string | null;
  file_name: string | null;
  read_at: string | null;
  parent: number | null;
  timestamp: string;
}


interface NegotiationData {
  id: number;

  supply: number;

  supply_title: string;

  buyer: number;

  buyer_name: string;

  supplier: number;

  supplier_name: string;

  status: string;

  context_meta: Record<string, any>;

  context_title: string | null;

  expired_at: string | null;

  is_active: boolean;

  created_at: string;

  updated_at: string;

  messages: NegotiationMessage[];
}


const statusLabels: Record<string, string> = {
  created: 'ایجاد شده',
  in_progress: 'در حال مذاکره',
  awaiting_proposal: 'در انتظار پیشنهاد',
  proposal_sent: 'پیشنهاد ارسال شده',
  under_review: 'در حال بررسی',
  accepted: 'پذیرفته شده',
  rejected: 'رد شده',
  contracted: 'قرارداد شده',
};


const formatTime = (
  timestamp: string
): string => {

  try {

    return new Date(
      timestamp
    ).toLocaleTimeString(
      'fa-IR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );

  } catch {

    return '';
  }
};


const formatDate = (
  timestamp: string
): string => {

  try {

    return new Date(
      timestamp
    ).toLocaleDateString(
      'fa-IR'
    );

  } catch {

    return '';
  }
};


export default function NegotiationPage() {

  const router = useRouter();

  const params = useParams();

  const negotiationId = Number(
    params?.id
  );

  const user = useAuthStore(
    state => state.user
  );

  const [negotiation, setNegotiation] =
    useState<NegotiationData | null>(null);

  const [messages, setMessages] =
    useState<NegotiationMessage[]>([]);

  const [newMessage, setNewMessage] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [wsConnected, setWsConnected] =
    useState(false);

  const wsRef =
    useRef<WebSocket | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);


  /*
   * ---------------------------------------------------------
   * Load real negotiation from PostgreSQL
   * ---------------------------------------------------------
   */

  useEffect(() => {

    if (
      !negotiationId ||
      Number.isNaN(negotiationId)
    ) {

      setError(
        'شناسه مذاکره معتبر نیست.'
      );

      setLoading(false);

      return;
    }


    let cancelled = false;


    const loadNegotiation =
      async () => {

        try {

          setLoading(true);

          setError(null);


          const response =
            await authenticatedFetch(
              `${API_URL}/negotiations/${negotiationId}/`
            );


          if (!response.ok) {

            const data =
              await response
                .json()
                .catch(() => ({}));

            throw new Error(
              data?.detail ||
              data?.error ||
              'دریافت اطلاعات مذاکره ناموفق بود.'
            );
          }


          const data:
            NegotiationData =
            await response.json();


          if (cancelled) {
            return;
          }


          setNegotiation(data);

          setMessages(
            Array.isArray(data.messages)
              ? data.messages
              : []
          );

        } catch (err: any) {

          console.error(
            '❌ Failed to load negotiation:',
            err
          );

          if (!cancelled) {

            setError(
              err?.message ||
              'خطا در دریافت مذاکره.'
            );
          }

        } finally {

          if (!cancelled) {
            setLoading(false);
          }
        }
      };


    loadNegotiation();


    return () => {
      cancelled = true;
    };

  }, [negotiationId]);


  /*
   * ---------------------------------------------------------
   * Real WebSocket
   * ---------------------------------------------------------
   */

  useEffect(() => {

    if (
      !negotiationId ||
      Number.isNaN(negotiationId)
    ) {
      return;
    }


    const token =
      getAccessToken();


    if (!token) {

      console.warn(
        '⚠️ No access token for WebSocket'
      );

      return;
    }


    const wsBase =
      (
        process.env
          .NEXT_PUBLIC_WS_URL ||
        'ws://127.0.0.1:8000'
      ).replace(/\/$/, '');


    const wsUrl =
      `${wsBase}/ws/negotiation/${negotiationId}/`;


    console.log(
      '🔌 Connecting WebSocket:',
      wsUrl
    );


    const socket =
      new WebSocket(
        wsUrl,
        [
          'jwt',
          token,
        ]
      );


    wsRef.current = socket;


    socket.onopen = () => {

      console.log(
        '✅ WebSocket connected'
      );

      setWsConnected(true);
    };


    socket.onmessage = (
      event
    ) => {

      try {

        const data =
          JSON.parse(
            event.data
          );


        /*
         * پیام واقعی که از DB آمده
         */

        if (
          data.type === 'message'
        ) {

          const incoming:
            NegotiationMessage = {
            id: data.id,
            negotiation:
              data.negotiation_id,
            sender:
              data.sender_id,
            sender_name:
              data.sender_name || '',
            text:
              data.text || '',
            file:
              data.file || null,
            file_name:
              data.file_name || null,
            read_at:
              data.read_at || null,
            parent:
              data.parent || null,
            timestamp:
              data.timestamp,
          };


          setMessages(
            previous => {

              /*
               * جلوگیری از duplicate
               * مخصوصاً در reconnect
               */

              if (
                previous.some(
                  message =>
                    message.id ===
                    incoming.id
                )
              ) {

                return previous;
              }


              return [
                ...previous,
                incoming,
              ].sort(
                (a, b) =>
                  new Date(
                    a.timestamp
                  ).getTime()
                  -
                  new Date(
                    b.timestamp
                  ).getTime()
              );
            }
          );


          setNegotiation(
            previous => {

              if (!previous) {
                return previous;
              }

              return {
                ...previous,
                status:
                  previous.status ===
                  'created'
                    ? 'in_progress'
                    : previous.status,
                updated_at:
                  incoming.timestamp,
              };
            }
          );

          return;
        }


        /*
         * تغییر وضعیت واقعی مذاکره
         */

        if (
          data.type ===
          'status_updated'
        ) {

          setNegotiation(
            previous => {

              if (!previous) {
                return previous;
              }

              return {
                ...previous,
                status:
                  data.status,
                is_active:
                  ![
                    'rejected',
                    'contracted',
                  ].includes(
                    data.status
                  ),
                updated_at:
                  new Date().toISOString(),
              };
            }
          );

          return;
        }


        if (
          data.type === 'error'
        ) {

          console.error(
            '❌ WebSocket error:',
            data.error
          );

          setError(
            data.error ||
            'خطا در ارتباط WebSocket'
          );
        }

      } catch (error) {

        console.error(
          '❌ Invalid WebSocket message:',
          error
        );
      }
    };


    socket.onerror = (
      error
    ) => {

      console.error(
        '❌ WebSocket error:',
        error
      );

      setWsConnected(false);
    };


    socket.onclose = (
      event
    ) => {

      console.log(
        '🔌 WebSocket closed:',
        event.code,
        event.reason
      );

      setWsConnected(false);
    };


    return () => {

      socket.close();

      wsRef.current = null;
    };

  }, [negotiationId]);


  /*
   * ---------------------------------------------------------
   * Scroll
   * ---------------------------------------------------------
   */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });

  }, [messages]);


  /*
   * ---------------------------------------------------------
   * Send real WebSocket message
   * ---------------------------------------------------------
   */

  const handleSend = () => {

    const text =
      newMessage.trim();


    if (!text) {
      return;
    }


    const socket =
      wsRef.current;


    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {

      setError(
        'ارتباط با سرور برقرار نیست.'
      );

      return;
    }


    if (
      negotiation?.status ===
        'rejected' ||
      negotiation?.status ===
        'contracted'
    ) {

      setError(
        'این مذاکره به پایان رسیده است.'
      );

      return;
    }


    setSending(true);

    setError(null);


    socket.send(
      JSON.stringify({
        type: 'message',
        text,
      })
    );


    /*
     * اینجا دیگر پیام را دستی به State
     * اضافه نمی‌کنیم.
     *
     * Consumer:
     *
     * PostgreSQL
     *      ↓
     * Message.objects.create()
     *      ↓
     * group_send()
     *      ↓
     * onmessage()
     *      ↓
     * setMessages()
     */


    setNewMessage('');

    setSending(false);
  };


  /*
   * ---------------------------------------------------------
   * Enter
   * ---------------------------------------------------------
   */

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {

    if (
      e.key === 'Enter' &&
      !e.shiftKey
    ) {

      e.preventDefault();

      handleSend();
    }
  };


  /*
   * ---------------------------------------------------------
   * Status update through WebSocket
   * ---------------------------------------------------------
   */

  const updateNegotiationStatus = (
    status: string
  ) => {

    const socket =
      wsRef.current;


    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {

      setError(
        'ارتباط با سرور برقرار نیست.'
      );

      return;
    }


    socket.send(
      JSON.stringify({
        type: 'status_update',
        status,
      })
    );
  };


  const handleFinishWithContract = () => {

    if (!negotiation) {
      return;
    }


    if (
      negotiation.supplier !==
      Number(user?.id)
    ) {

      setError(
        'فقط تأمین‌کننده می‌تواند مذاکره را وارد قرارداد کند.'
      );

      return;
    }


    updateNegotiationStatus(
      'contracted'
    );


    /*
     * انتقال به قرارداد بعد از
     * دریافت status_updated
     * بهتر است انجام شود.
     */

    setTimeout(() => {

      router.push(
        `/contract/${negotiation.id}`
      );

    }, 500);
  };


  const handleFinishWithoutContract =
    () => {

      if (!negotiation) {
        return;
      }


      updateNegotiationStatus(
        'rejected'
      );


      setTimeout(() => {

        router.push(
          '/matching'
        );

      }, 500);
    };


  /*
   * ---------------------------------------------------------
   * Loading
   * ---------------------------------------------------------
   */

  if (loading) {

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        dir="rtl"
      >
        <div className="text-gray-500">
          در حال دریافت اطلاعات مذاکره...
        </div>
      </div>
    );
  }


  if (
    error &&
    !negotiation
  ) {

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50 p-6"
        dir="rtl"
      >

        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">

          <p className="text-red-500 mb-4">
            {error}
          </p>

          <button
            onClick={() =>
              router.back()
            }
            className="px-5 py-2 bg-[#1E3A8A] text-white rounded-lg"
          >
            بازگشت
          </button>

        </div>

      </div>
    );
  }


  if (!negotiation) {
    return null;
  }


  const isSupplier =
    Number(user?.id) ===
    negotiation.supplier;


  const isBuyer =
    Number(user?.id) ===
    negotiation.buyer;


  return (

    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 md:p-6"
      dir="rtl"
    >

      <div className="max-w-5xl mx-auto">

        <button
          onClick={() =>
            router.back()
          }
          className="flex items-center gap-1 text-gray-500 hover:text-[#1E3A8A] mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />

          بازگشت
        </button>


        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">


          {/* HEADER */}

          <div className="relative overflow-hidden bg-gradient-to-r from-[#1E3A8A] via-[#1A56B0] to-[#14B8A6] p-6 text-white">

            <div className="absolute inset-0 opacity-10">

              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            </div>


            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">

                  <Building2 className="w-8 h-8" />

                </div>


                <div>

                  <h1 className="text-2xl md:text-3xl font-bold">

                    {negotiation.context_title ||
                      negotiation.supply_title}

                  </h1>


                  <div className="flex flex-wrap items-center gap-2 mt-2">

                    <span className="bg-teal-400/40 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-teal-400/40 flex items-center gap-1">

                      <Clock className="w-3 h-3" />

                      {statusLabels[
                        negotiation.status
                      ] ||
                        negotiation.status}

                    </span>


                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">

                      <Calendar className="w-3 h-3" />

                      شروع:
                      {' '}
                      {formatDate(
                        negotiation.created_at
                      )}

                    </span>


                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        wsConnected
                          ? 'bg-emerald-500/30'
                          : 'bg-red-500/30'
                      }`}
                    >

                      {wsConnected
                        ? '● ارتباط آنلاین'
                        : '● WebSocket قطع است'}

                    </span>

                  </div>

                </div>

              </div>


              {/* STATUS BUTTONS */}

              <div className="flex items-center gap-2">

                <button
                  onClick={
                    handleFinishWithContract
                  }
                  disabled={
                    !isSupplier ||
                    !negotiation.is_active
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition ${
                    isSupplier &&
                    negotiation.is_active
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >

                  <CheckCircle className="w-4 h-4" />

                  اتمام و قرارداد

                </button>


                <button
                  onClick={
                    handleFinishWithoutContract
                  }
                  disabled={
                    !negotiation.is_active
                  }
                  className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition"
                >

                  <XCircle className="w-4 h-4" />

                  اتمام بدون قرارداد

                </button>

              </div>

            </div>

          </div>


          {/* PARTIES */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-b border-gray-100">

            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">

              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-[#1E3A8A]">

                {negotiation.buyer_name?.charAt(0)}

              </div>

              <div>

                <p className="font-bold text-gray-800">

                  {negotiation.buyer_name}

                </p>

                <p className="text-sm text-gray-500">

                  خریدار

                </p>

              </div>

            </div>


            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">

              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-[#14B8A6]">

                {negotiation.supplier_name?.charAt(0)}

              </div>

              <div>

                <p className="font-bold text-gray-800">

                  {negotiation.supplier_name}

                </p>

                <p className="text-sm text-gray-500">

                  تأمین‌کننده

                </p>

              </div>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">

              {error}

            </div>

          )}


          {/* CHAT */}

          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50/50">

            {messages.length === 0 && (

              <div className="text-center text-gray-400 py-20">

                هنوز پیامی در این مذاکره ثبت نشده است.

              </div>

            )}


            {messages.map(
              (msg) => {

                const isMe =
                  Number(msg.sender) ===
                  Number(user?.id);


                return (

                  <div
                    key={msg.id}
                    className={`flex ${
                      isMe
                        ? 'justify-start'
                        : 'justify-end'
                    }`}
                  >

                    <div className="max-w-[75%] md:max-w-[60%]">

                      {!isMe && (

                        <p className="text-xs text-gray-500 mb-1 mr-2">

                          {msg.sender_name}

                        </p>

                      )}


                      <div
                        className={`p-4 rounded-2xl shadow-sm ${
                          isMe
                            ? 'bg-[#1E3A8A] text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                        }`}
                      >

                        {msg.text && (

                          <p className="text-sm leading-relaxed whitespace-pre-wrap">

                            {msg.text}

                          </p>

                        )}


                        {msg.file && (

                          <a
                            href={msg.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block underline text-sm"
                          >

                            📎 {msg.file_name || 'فایل پیوست'}

                          </a>

                        )}

                      </div>


                      <div
                        className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                          isMe
                            ? 'justify-start ml-2'
                            : 'justify-end mr-2'
                        }`}
                      >

                        <span>
                          {formatTime(
                            msg.timestamp
                          )}
                        </span>


                        {isMe && (

                          <CheckCheck
                            className={`w-3 h-3 ${
                              msg.read_at
                                ? 'text-teal-500'
                                : 'text-gray-400'
                            }`}
                          />

                        )}

                      </div>

                    </div>

                  </div>

                );
              }
            )}


            <div ref={messagesEndRef} />

          </div>


          {/* SEND */}

          <div className="p-4 border-t border-gray-100 bg-white">

            <div className="flex items-end gap-2">

              <button
                type="button"
                className="p-2 text-gray-400 hover:text-[#14B8A6] transition-colors"
                title="پیوست فایل"
              >

                <Paperclip className="w-5 h-5" />

              </button>


              <div className="flex-1 relative">

                <textarea
                  value={newMessage}
                  onChange={(e) =>
                    setNewMessage(
                      e.target.value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  disabled={
                    !wsConnected ||
                    !negotiation.is_active
                  }
                  placeholder={
                    negotiation.is_active
                      ? 'پیام خود را بنویسید... (Enter برای ارسال)'
                      : 'این مذاکره به پایان رسیده است.'
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent resize-none disabled:bg-gray-100"
                  rows={2}
                />

              </div>


              <button
                onClick={handleSend}
                disabled={
                  !newMessage.trim() ||
                  sending ||
                  !wsConnected ||
                  !negotiation.is_active
                }
                className="p-3 bg-[#14B8A6] hover:bg-teal-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >

                <Send className="w-5 h-5" />

              </button>

            </div>


            <p className="text-xs text-gray-400 mt-2 text-center">

              {wsConnected
                ? 'ارتباط زنده با سرور برقرار است'
                : 'در حال اتصال به سرور...'}

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}