'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, Send, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('لطفاً ایمیل خود را وارد کنید.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('لطفاً یک ایمیل معتبر وارد کنید.');
      return;
    }

    setIsLoading(true);

    // شبیه‌سازی ارسال درخواست به سرور
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8 flex items-center justify-center"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', Tahoma, sans-serif" }}
    >
      <div className="w-full max-w-md">
        {/* کارت اصلی */}
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
          {/* لوگو */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-0.5 shadow-lg">
              <img
                src="/logo.png"
                alt="لوگو"
                className="h-full w-full rounded-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </Link>
          </div>

          {!isSubmitted ? (
            <>
              {/* عنوان */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 mb-2">
                  فراموشی رمز عبور
                </h2>
                <p className="text-sm text-slate-500 leading-7">
                  ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برایتان ارسال شود.
                </p>
              </div>

              {/* نمایش خطا */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {/* فرم */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">
                    ایمیل
                  </label>
                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@domain.com"
                      autoComplete="email"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-11 pl-4 text-left text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* دکمه ارسال */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={19} className="animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      ارسال لینک بازیابی
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* پیام موفقیت */
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-3">
                ایمیل بازیابی ارسال شد
              </h2>
              <p className="text-sm text-slate-500 leading-7 mb-2">
                لینک بازیابی رمز عبور به آدرس زیر ارسال شد:
              </p>
              <p className="text-sm font-bold text-[#1E3A8A] mb-6">{email}</p>
              <p className="text-xs text-slate-400">
                اگر ایمیلی دریافت نکردید، پوشهٔ اسپم را بررسی کنید یا دوباره تلاش کنید.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="mt-6 text-sm font-bold text-[#1E3A8A] hover:text-[#14B8A6] transition"
              >
                ارسال مجدد
              </button>
            </div>
          )}

          {/* لینک بازگشت */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1E3A8A] transition"
            >
              <ArrowLeft size={16} />
              بازگشت به صفحه ورود
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}