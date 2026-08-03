'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const negotiationInfo = {
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
  { id: 1, sender: 'کارفرما', text: 'سلام، در مورد قیمت پروژه می‌توانیم تخفیف بگیریم؟', time: '۱۰:۳۰', isMe: false },
  { id: 2, sender: 'پیمانکار', text: 'سلام، بستگی به شرایط پرداخت شما دارد. پیشنهاد شما چیست؟', time: '۱۰:۳۲', isMe: true },
  { id: 3, sender: 'کارفرما', text: 'اگر پرداخت را ۵۰٪ نقدی و ۵۰٪ سه ماهه انجام دهیم، چقدر تخفیف می‌دهید؟', time: '۱۰:۳۵', isMe: false },
  { id: 4, sender: 'پیمانکار', text: 'با این شرایط می‌توانیم ۸٪ تخفیف روی کل مبلغ قرارداد اعمال کنیم. همچنین یک ماه پشتیبانی رایگان اضافه می‌کنیم.', time: '۱۰:۳۸', isMe: true },
];

export default function NegotiationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // تشخیص نقش کاربر از localStorage (همانند قبل)
    let role = localStorage.getItem('userRole');
    if (!role) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.email === 'seller@test.com') {
            role = 'supplier';
          } else if (user.email === 'buyer@test.com') {
            role = 'buyer';
          } else if (user.role) {
            role = user.role;
          }
        } catch {}
      }
    }
    console.log('نقش تشخیص داده شده:', role);
    setUserRole(role || null);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'پیمانکار',
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

  const handleFinishWithContract = () => {
    router.push('/contract/1');
  };

  const handleFinishWithoutContract = () => {
    router.push('/matching');
  };

  const isSupplier = userRole === 'supplier';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <button className="flex items-center gap-1 text-gray-500 hover:text-[#1E3A8A] mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به قراردادها
        </button>

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

              {/* دکمه‌های اتمام مذاکره */}
              <div className="flex items-center gap-2">
                {/* دکمهٔ اتمام و قرارداد: فقط وقتی نقش کاربر مشخص شده باشد رندر می‌شود (رفع خطای hydration) */}
                {userRole !== null && (
                  <button
                    onClick={handleFinishWithContract}
                    disabled={!isSupplier}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition ${
                      isSupplier
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                    title={!isSupplier ? 'فقط فروشنده می‌تواند قرارداد را نهایی کند' : ''}
                  >
                    <CheckCircle className="w-4 h-4" />
                    اتمام و قرارداد
                  </button>
                )}
                {/* دکمهٔ اتمام بدون قرارداد: همیشه نمایش داده می‌شود */}
                <button
                  onClick={handleFinishWithoutContract}
                  className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white transition"
                >
                  <XCircle className="w-4 h-4" />
                  اتمام بدون قرارداد
                </button>
              </div>
            </div>
          </div>

          {/* اطلاعات طرفین */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-b border-gray-100">
            {negotiationInfo.parties.map((party, idx) => (
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

          {/* چت */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] md:max-w-[60%]`}>
                  {!msg.isMe && <p className="text-xs text-gray-500 mb-1 mr-2">{msg.sender}</p>}
                  <div
                    className={`p-4 rounded-2xl shadow-sm ${
                      msg.isMe ? 'bg-[#1E3A8A] text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${msg.isMe ? 'justify-end ml-2' : 'justify-start mr-2'}`}>
                    <span>{msg.time}</span>
                    {msg.isMe && <CheckCheck className="w-3 h-3 text-teal-500" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ارسال پیام */}
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
            <p className="text-xs text-gray-400 mt-2 text-center">آخرین فعالیت: {negotiationInfo.lastActivity}</p>
          </div>
        </div>
      </div>
    </div>
  );
}