// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Mail, Sparkles } from 'lucide-react';

const BRAND = { primary: '#1E3A8A', secondary: '#14B8A6' };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('لطفاً همه فیلدها را پر کنید.');
      return;
    }
    setLoading(true);
    // شبیه‌سازی درخواست به سرور
    setTimeout(() => {
      setLoading(false);
      // در اینجا می‌توانید به صفحه اصلی یا داشبورد هدایت کنید
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4"
      dir="rtl"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', Tahoma, sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/60 p-8">
          {/* لوگو یا عنوان */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] text-white shadow-lg mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">ورود به بازار</h1>
            <p className="text-sm text-slate-500 mt-1">
              به پلتفرم هوشمند فناوری و نوآوری خوش آمدید
            </p>
          </div>

          {/* فرم */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ایمیل یا نام کاربری
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition bg-white/70 backdrop-blur-sm"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 outline-none transition bg-white/70 backdrop-blur-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-all duration-300 ${
                loading
                  ? 'opacity-70 cursor-not-allowed bg-slate-400'
                  : 'hover:scale-[1.02] bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] hover:shadow-xl'
              }`}
            >
              {loading ? 'در حال ورود...' : 'ورود به بازار'}
            </button>
          </form>

          {/* لینک‌های پایین */}
          <div className="mt-6 text-center space-y-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-sm text-[#14B8A6] hover:text-[#1E3A8A] transition font-medium"
            >
              <ArrowLeft size={16} className="rotate-180" />
              ثبت‌نام نکرده‌اید؟ همین حالا عضو شوید
            </Link>
            <div>
              <Link
                href="/forgot-password"
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                رمز عبور خود را فراموش کرده‌اید؟
              </Link>
            </div>
          </div>

          {/* بازگشت به صفحه اصلی */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              <ArrowLeft size={16} />
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>

        {/* فوتر کوچک */}
        <p className="text-center text-xs text-slate-400 mt-6">
          ورود شما به معنای پذیرش{' '}
          <Link href="/terms" className="text-[#14B8A6] hover:underline">
            قوانین
          </Link>{' '}
          و{' '}
          <Link href="/privacy" className="text-[#14B8A6] hover:underline">
            حریم خصوصی
          </Link>{' '}
          است.
        </p>
      </div>
    </div>
  );
}