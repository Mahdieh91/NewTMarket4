// src/components/AIAssistant/AIAssistant.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import Image from 'next/image';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'سلام 👋 من دستیار هوشمند بازار هستم. چطور می‌تونم کمکتون کنم؟',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAssistant = () => setIsOpen((prev) => !prev);

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('کلید API تنظیم نشده است. لطفاً .env.local را بررسی کنید.');
      }

      const conversationHistory = messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      }));

      // ====================================================
      // 🔥 هدرها به‌روزرسانی شدند (فقط ASCII)
      // ====================================================
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          // X-Title به انگلیسی تغییر کرد
          'X-Title': 'Bazar AI Assistant',
        },
        body: JSON.stringify({
          //model: 'x-ai/grok-4.6',
          model: 'deepseek/deepseek-v3.2',
          messages: [
            {
              role: 'system',
              content:
                'تو یک دستیار هوشمند برای پلتفرم "بازار" هستی که به کاربران در زمینه فناوری، نوآوری، نیازها و راهکارها کمک می‌کند.',
            },
            ...conversationHistory,
            { role: 'user', content: trimmed },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `خطای ${response.status}`);
      }

      const data = await response.json();
      const botReplyText =
        data.choices?.[0]?.message?.content || 'متأسفم، پاسخی دریافت نشد.';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botReplyText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('❌ خطا در ارتباط با OpenRouter:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ خطا: ${error instanceof Error ? error.message : 'لطفاً دوباره تلاش کنید.'}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* دکمه شناور */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none"
        aria-label="دستیار هوشمند"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative w-8 h-8">
            <Image
              src="/logo-icon.png"
              alt="دستیار بازار"
              width={32}
              height={32}
              className="rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Bot className="w-8 h-8 text-white absolute inset-0" />
          </div>
        )}
      </button>

      {/* پنل چت */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
          {/* هدر */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-bold text-sm">دستیار هوشمند بازار</span>
            </div>
            <button
              onClick={toggleAssistant}
              className="p-1 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* پیام‌ها */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#1E3A8A] text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[10px] mt-1 ${
                      msg.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin" />
                  <span className="text-xs text-slate-500">در حال فکر کردن...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ورودی */}
          <div className="border-t border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent"
                dir="rtl"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </>
  );
}