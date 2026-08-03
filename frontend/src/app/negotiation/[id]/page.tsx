'use client';

import { useState, useRef, useEffect } from 'react';
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
  UserCheck,
} from 'lucide-react';
import { mockProducts } from '@/app/data/products';

// داده‌های مذاکره برای matchId=1 (پروژه هوش مصنوعی)
const match1Negotiation = {
  title: 'مذاکره قرارداد توسعه سامانه هوش مصنوعی',
  status: 'در حال مذاکره',
  startDate: '۱۴۰۲/۰۴/۰۱',
  lastActivity: '۱۰ دقیقه پیش',
  parties: [
    { name: 'شرکت فناوران نوین', role: 'کارفرما', avatar: null, color: '#1E3A8A' },
    { name: 'تیم توسعه متا', role: 'پیمانکار', avatar: null, color: '#14B8A6' },
  ],
};

const initialMessages = [
  { id: 1, sender: 'شما', text: 'سلام، در مورد این محصول/خدمت می‌خواستم بیشتر بدونم. شرایط پرداخت چطوریه؟', time: '۱۰:۳۰', isMe: true },
  { id: 2, sender: 'فروشنده', text: 'سلام، خوشحال می‌شم راهنمایی کنم. بستگی به حجم سفارش و شرایط پرداخت داره. پیشنهاد شما چیه؟', time: '۱۰:۳۲', isMe: false },
  { id: 3, sender: 'شما', text: 'اگر پرداخت ۵۰٪ نقدی و ۵۰٪ سه ماهه باشه، تخفیفی در نظر می‌گیرید؟', time: '۱۰:۳۵', isMe: true },
  { id: 4, sender: 'فروشنده', text: 'با این شرایط می‌تونیم ۸٪ تخفیف روی کل مبلغ قرارداد اعمال کنیم و یک ماه پشتیبانی رایگان اضافه کنیم.', time: '۱۰:۳۸', isMe: false },
];

export default function NegotiationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const product = mockProducts.find((p) => p.id === id);
  const isMatchMode = !product; // اگر محصولی با این id نبود، حالت matchId است

  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'buyer' | 'seller'>('buyer');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'شما',
      text: newMessage,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndWithoutContract = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید مذاکره را بدون عقد قرارداد پایان دهید؟')) {
      router.push(isMatchMode ? '/matching' : '/market');
    }
  };

  const toggleRole = () => {
    setCurrentUserRole((prev) => (prev === 'buyer' ? 'seller' : 'buyer'));
  };

  // داده‌های نمایشی بر اساس حالت
  const negotiationInfo = isMatchMode
    ? match1Negotiation
    : {
        title: `مذاکره برای ${product!.title}`,
        status: 'در حال مذاکره',
        startDate: '۱۴۰۲/۰۴/۰۱',
        lastActivity: '۱۰ دقیقه پیش',
      };

  const parties = isMatchMode
    ? match1Negotiation.parties
    : [
        { name: 'شما (خریدار)', role: 'خریدار', color: '#1E3A8A' },
        { name: product!.seller.name, role: 'فروشنده', color: '#14B8A6' },
      ];

  const backLink = isMatchMode ? '/matching' : `/market/${product!.id}`;
  const contractLink = `/contract/${id}`; // در هر دو حالت به contract با id می‌رود

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 md:p-6"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto">
        {/* دکمه بازگشت */}
        <Link
          href={backLink}
          className="flex items-center gap-1 text-gray-500 hover:text-[#1E3A8A] mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          بازگشت به {isMatchMode ? 'تطبیق هوشمند' : 'جزئیات محصول'}
        </Link>

        {/* دکمهٔ تست برای جابه‌جایی نقش (فقط برای توسعه) */}
        <div className="mb-2 flex justify-end">
          <button
            onClick={toggleRole}
            className="text-xs bg-slate-200 px-3 py-1 rounded-lg flex items-center gap-1"
          >
            <UserCheck size={14} />
            نقش فعلی: {currentUserRole === 'seller' ? 'فروشنده' : 'خریدار'} (کلیک برای تغییر)
          </button>
        </div>

        {/* کارت اصلی */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* هدر */}
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
                  <h1 className="text-2xl md:text-3xl font-bold">{negotiationInfo.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="bg-teal-400/40 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-teal-400/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {negotiationInfo.status}
                    </span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> شروع: {negotiationInfo.startDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* بخش اطلاعات طرفین */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-b border-gray-100">
            {parties.map((party, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: party.color }}
                >
                  {party.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{party.name}</p>
                  <p className="text-sm text-gray-500">{party.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* بخش چت */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] md:max-w-[60%]`}>
                  {!msg.isMe && (
                    <p className="text-xs text-gray-500 mb-1 mr-2">{msg.sender}</p>
                  )}
                  <div
                    className={`p-4 rounded-2xl shadow-sm ${
                      msg.isMe
                        ? 'bg-[#1E3A8A] text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div
                    className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                      msg.isMe ? 'justify-end ml-2' : 'justify-start mr-2'
                    }`}
                  >
                    <span>{msg.time}</span>
                    {msg.isMe && <CheckCheck className="w-3 h-3 text-teal-500" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* فیلد ارسال پیام */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-2">
              <button className="p-2 text-gray-400 hover:text-[#14B8A6] transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="پیام خود را بنویسید... (Enter برای ارسال)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent resize-none"
                  rows={2}
                  style={{ minHeight: '48px' }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="p-3 bg-[#14B8A6] hover:bg-teal-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              آخرین فعالیت: {negotiationInfo.lastActivity}
            </p>
          </div>

          {/* بخش نتیجه مذاکره */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">نتیجه مذاکره:</span>
              <div className="flex gap-2">
                {/* فقط فروشنده می‌تواند قرارداد را ببندد */}
                {currentUserRole === 'seller' && (
                  <Link
                    href={contractLink}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition"
                  >
                    <CheckCircle size={16} />
                    اتمام مذاکره و رفتن به قرارداد
                  </Link>
                )}
                <button
                  onClick={handleEndWithoutContract}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition"
                >
                  <XCircle size={16} />
                  اتمام مذاکره بدون قرارداد
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}