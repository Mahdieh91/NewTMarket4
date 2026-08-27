// ============================================================
// src/app/login/page.tsx
// نسخه نهایی - مدیریت خطا بدون Console Error برای کپچا
// ============================================================

'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  User,
  ArrowLeft,
  Loader2,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({ username: '', password: '', captcha_answer: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    captcha?: string;
    general?: string;
  }>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const isSubmitDisabled = Boolean(
    isLoading || captchaLoading || captchaError || !captchaQuestion
  );

  const fetchCaptchaChallenge = async (clearCaptchaError: boolean = true) => {
    setCaptchaLoading(true);
    setCaptchaError(false);
    setCaptchaQuestion('');
    setForm((prev) => ({ ...prev, captcha_answer: '' }));

    if (clearCaptchaError) {
      setFieldErrors((prev) => ({ ...prev, captcha: undefined }));
    }

    try {
      const response = await fetch(`${API_URL}/users/captcha/challenge/`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        let errorMessage = `خطا در دریافت کپچا (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData?.message) errorMessage = errorData.message;
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data?.question) {
        throw new Error('پاسخ CAPTCHA از سرور ناقص است.');
      }

      setCaptchaQuestion(String(data.question));
      setCaptchaError(false);
    } catch (err) {
      console.error('❌ خطا در دریافت کپچا:', err);
      setCaptchaQuestion('');
      setCaptchaError(true);
      if (clearCaptchaError) {
        setFieldErrors({ general: 'مشکل در ارتباط با سرور کپچا' });
      }
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptchaChallenge();
  }, []);

  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem('rememberedUsername');
      if (savedUsername) {
        setForm((prev) => ({ ...prev, username: savedUsername }));
        setRememberMe(true);
      }
    } catch (err) {
      console.warn('⚠️ خطا در خواندن نام کاربری ذخیره‌شده:', err);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    if (error) clearError();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setFieldErrors({});
    clearError();

    const username = form.username.trim();
    const password = form.password;
    const captcha_answer = form.captcha_answer.trim();

    if (!username) {
      setFieldErrors({ username: 'لطفاً نام کاربری خود را وارد کنید.' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'لطفاً رمز عبور خود را وارد کنید.' });
      return;
    }
    if (!captcha_answer) {
      setFieldErrors({ captcha: 'لطفاً پاسخ کپچا را وارد کنید.' });
      return;
    }

    // ============================================================
    // فراخوانی login و بررسی نتیجه
    // ============================================================
    const success = await login(username, password, captcha_answer);

    if (!success) {
      // دریافت جدیدترین خطا از store
      const loginError = useAuthStore.getState().error || '';
      const errorText = loginError.toLowerCase();

      // تشخیص خطای کپچا
      const isCaptchaError =
        errorText.includes('captcha') ||
        errorText.includes('کپچا') ||
        errorText.includes('پاسخ کپچا') ||
        errorText.includes('نشست معتبر');

      if (isCaptchaError) {
        setFieldErrors({ captcha: loginError });
        setForm((prev) => ({ ...prev, captcha_answer: '' }));
        await fetchCaptchaChallenge(false); // خطای کپچا را پاک نمی‌کند
        return;
      }

      // تشخیص خطای نام کاربری
      const isUsernameError =
        errorText.includes('نام کاربری') ||
        errorText.includes('username') ||
        errorText.includes('user');

      if (isUsernameError) {
        setFieldErrors({ username: loginError });
        return;
      }

      // تشخیص خطای رمز عبور
      const isPasswordError =
        errorText.includes('رمز عبور') ||
        errorText.includes('password') ||
        errorText.includes('pass');

      if (isPasswordError) {
        setFieldErrors({ password: loginError });
        return;
      }

      // سایر خطاها
      setFieldErrors({ general: loginError || 'خطا در ورود به حساب کاربری' });
      return;
    }

    // ============================================================
    // ورود موفق
    // ============================================================
    if (rememberMe) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

    window.dispatchEvent(new Event('auth-change'));

    const nextPage = searchParams.get('next');
    const redirectPath = nextPage && nextPage.startsWith('/') ? nextPage : '/dashboard';
    router.push(redirectPath);
    router.refresh();
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', Tahoma, sans-serif" }}
    >
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8 order-2 lg:order-1">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Link
              href="/"
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-0.5 shadow-lg"
            >
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {!logoError ? (
                  <img
                    src="/logo.png"
                    alt="لوگو"
                    className="h-full w-full rounded-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-[#1E3A8A] font-black text-xl">ب</span>
                )}
              </div>
            </Link>
            <h1 className="text-xl font-black text-[#1E3A8A]">
              بازار هوشمند محصولات و خدمات فناورانه و نوآورانه
            </h1>
          </div>

          <div className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-black text-slate-800">ورود به حساب کاربری</h2>
            <p className="text-sm leading-7 text-slate-500">
              برای ادامه فعالیت در بازار تحول وارد حساب خود شوید.
            </p>
          </div>

          {fieldErrors.general && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {fieldErrors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-bold text-slate-700">
                نام کاربری
              </label>
              <div className="relative">
                <User size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="نام کاربری خود را وارد کنید"
                  autoComplete="username"
                  disabled={Boolean(isLoading)}
                  className={`w-full rounded-xl border py-3.5 pr-11 pl-4 text-left text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                    fieldErrors.username
                      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-blue-100'
                  }`}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700">
                رمز عبور
              </label>
              <div className="relative">
                <LockKeyhole size={19} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="رمز عبور خود را وارد کنید"
                  autoComplete="current-password"
                  disabled={Boolean(isLoading)}
                  className={`w-full rounded-xl border py-3.5 pr-11 pl-12 text-left text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                    fieldErrors.password
                      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={Boolean(isLoading)}
                  aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="captcha_answer" className="mb-2 block text-sm font-bold text-slate-700">
                کد امنیتی
                {captchaLoading && <span className="mr-2 text-xs text-slate-400">(در حال بارگذاری...)</span>}
              </label>
              <div className="flex items-center gap-3">
                <div
                  dir="ltr"
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold text-slate-800 text-center min-h-[48px] flex items-center justify-center ${
                    fieldErrors.captcha ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  {captchaLoading ? (
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  ) : captchaError ? (
                    <span className="text-red-500">خطا در دریافت کپچا</span>
                  ) : (
                    captchaQuestion || '---'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fetchCaptchaChallenge(true)}
                  disabled={Boolean(captchaLoading || isLoading)}
                  className="flex-shrink-0 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                  aria-label="بارگذاری مجدد کپچا"
                >
                  <RefreshCw size={20} className="text-slate-500" />
                </button>
              </div>
              <input
                id="captcha_answer"
                name="captcha_answer"
                type="text"
                value={form.captcha_answer}
                onChange={handleChange}
                placeholder="پاسخ را وارد کنید"
                autoComplete="off"
                disabled={Boolean(isLoading || captchaLoading || captchaError)}
                className={`mt-2 w-full rounded-xl border py-3 pr-4 pl-4 text-left text-sm outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.captcha
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-blue-100'
                }`}
                dir="ltr"
              />
              {fieldErrors.captcha && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.captcha}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">پاسخ عددی را وارد کنید (مثال: ۱۲)</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={Boolean(isLoading)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>مرا به خاطر بسپار</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-bold text-[#1E3A8A] hover:text-[#14B8A6]">
                فراموشی رمز عبور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              suppressHydrationWarning
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 size={19} className="animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  ورود به حساب کاربری
                  <ArrowLeft size={18} />
                </>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">حساب کاربری ندارید؟</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <Link
            href="/register"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1E3A8A] py-3 text-sm font-black text-[#1E3A8A] transition hover:bg-blue-50"
          >
            <UserPlus size={18} />
            ایجاد حساب جدید
          </Link>
          <Link href="/" className="mt-6 block text-center text-sm font-bold text-slate-500 transition hover:text-[#1E3A8A]">
            بازگشت به صفحه اصلی
          </Link>
        </section>

        <section className="hidden min-h-[620px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#14B8A6] p-10 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between order-1 lg:order-2">
          <div>
            <Link href="/" className="mb-12 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-0.5 shadow-lg">
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {!logoError ? (
                    <img
                      src="/logo.png"
                      alt="لوگو"
                      className="h-full w-full rounded-full object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <span className="text-[#1E3A8A] font-black text-2xl">ب</span>
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-black leading-tight">
                بازار هوشمند محصولات و خدمات فناورانه و نوآورانه
              </h1>
            </Link>
            <div className="max-w-md">
              <p className="mb-4 text-sm font-bold text-cyan-100">پلتفرم هوشمند مدیریت تعاملات فناورانه</p>
              <p className="text-base leading-8 text-blue-50">
                در بازار تحول، نیازهای فناورانه و راهکارهای تخصصی را به یکدیگر متصل کنید و مسیر اجرای پروژه را با اطمینان
                بیشتری پیش ببرید.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-1 text-2xl font-black">۱۰۰+</div>
              <div className="text-xs text-blue-100">راهکار فناورانه</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-1 text-2xl font-black">۵۰+</div>
              <div className="text-xs text-blue-100">شرکت فعال</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="mb-1 text-2xl font-black">۲۴/۷</div>
              <div className="text-xs text-blue-100">پشتیبانی</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}