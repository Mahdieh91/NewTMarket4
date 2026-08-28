'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================
// types
// ============================================================
type FormData = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone: string;
  national_id: string;
  company_name: string;
  registration_number: string;
  economic_code: string;
  website: string;
  representative_name: string;
  role: string;
  expertise: string;
  activity_domain: string;
  experience_summary: string;
  is_legal: boolean;
};

// ============================================================
// constants
// ============================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'خریدار محصول فناورانه' },
  { value: 'buyer_service', label: 'خریدار خدمت نوآورانه' },
  { value: 'supplier', label: 'عرضه‌کننده محصول' },
  { value: 'supplier_service', label: 'عرضه‌کننده خدمت' },
  { value: 'need_registerer', label: 'ثبت‌کننده نیاز فناورانه' },
  { value: 'investor', label: 'سرمایه‌گذار' },
  { value: 'consultant', label: 'مشاور / ارزیاب' },
  { value: 'broker', label: 'کارگزار / کارشناس رسمی' },
  { value: 'partner', label: 'سازمان همکار' },
  { value: 'admin', label: 'مدیر پلتفرم' },
];

const initialForm: FormData = {
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
  phone: '',
  national_id: '',
  company_name: '',
  registration_number: '',
  economic_code: '',
  website: '',
  representative_name: '',
  role: 'buyer',
  expertise: '',
  activity_domain: '',
  experience_summary: '',
  is_legal: false,
};

// ============================================================
// main component
// ============================================================
export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
    if (error) setError(null);
  };

  const validateForm = (): string | null => {
    if (!form.username.trim()) return 'نام کاربری الزامی است.';
    if (form.username.length < 3) return 'نام کاربری حداقل ۳ کاراکتر باشد.';
    if (!form.email.trim()) return 'ایمیل الزامی است.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'ایمیل معتبر نیست.';
    if (!form.first_name.trim()) return 'نام الزامی است.';
    if (!form.last_name.trim()) return 'نام خانوادگی الزامی است.';
    if (!form.password) return 'رمز عبور الزامی است.';
    if (form.password.length < 8) return 'رمز عبور حداقل ۸ کاراکتر باشد.';
    if (form.password !== form.password_confirm) return 'رمز عبور و تکرار آن یکسان نیستند.';

    // ============================================================
    // اعتبارسنجی کد ملی / کد اقتصادی بر اساس is_legal
    // ============================================================
    if (!form.is_legal) {
      // شخص حقیقی → کد ملی اجباری
      if (!form.national_id.trim()) {
        return 'کد ملی برای اشخاص حقیقی الزامی است.';
      }
      if (!/^\d{10}$/.test(form.national_id.trim())) {
        return 'کد ملی باید ۱۰ رقم باشد.';
      }
    } else {
      // شخص حقوقی → کد اقتصادی اجباری
      if (!form.economic_code.trim()) {
        return 'کد اقتصادی برای اشخاص حقوقی الزامی است.';
      }
      if (!/^\d{12}$/.test(form.economic_code.trim())) {
        return 'کد اقتصادی باید ۱۲ رقم باشد.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_URL}/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let message = 'خطا در ثبت‌نام.';
        if (data?.username) message = Array.isArray(data.username) ? data.username[0] : data.username;
        else if (data?.email) message = Array.isArray(data.email) ? data.email[0] : data.email;
        else if (data?.password) message = Array.isArray(data.password) ? data.password[0] : data.password;
        else if (data?.national_id) message = Array.isArray(data.national_id) ? data.national_id[0] : data.national_id;
        else if (data?.economic_code) message = Array.isArray(data.economic_code) ? data.economic_code[0] : data.economic_code;
        else if (data?.detail) message = Array.isArray(data.detail) ? data.detail[0] : data.detail;
        else if (data?.message) message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message);
      }

      setSuccessMessage(
        '✅ ثبت‌نام شما با موفقیت انجام شد. حساب کاربری شما در انتظار تأیید مدیر سامانه است. پس از تأیید، می‌توانید وارد شوید.'
      );
      setForm(initialForm);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
        {/* header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">ثبت‌نام در بازار تحول</h1>
          <p className="mt-2 text-sm text-slate-500">
            پس از ثبت‌نام، حساب کاربری شما توسط مدیر سامانه تأیید می‌شود.
          </p>
        </div>

        {/* error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* success */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <p className="text-emerald-800 font-medium">{successMessage}</p>
            <Link
              href="/login"
              className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
            >
              رفتن به صفحه ورود
            </Link>
          </div>
        )}

        {/* form - فقط در صورت عدم نمایش پیام موفقیت */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ردیف ۱: نام و نام خانوادگی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نام <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="نام"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نام خانوادگی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="نام خانوادگی"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* ردیف ۲: نام کاربری و ایمیل */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نام کاربری <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="نام کاربری"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ایمیل <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* ردیف ۳: رمز عبور و تکرار */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  رمز عبور <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="حداقل ۸ کاراکتر"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  تکرار رمز عبور <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    name="password_confirm"
                    value={form.password_confirm}
                    onChange={handleChange}
                    placeholder="تکرار رمز عبور"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ردیف ۴: تلفن و نقش */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  تلفن همراه
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نقش <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition bg-white"
                  required
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ردیف ۵: چک‌باکس شخص حقوقی (جابه‌جا شده به بالا) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_legal"
                    checked={form.is_legal}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>شخص حقوقی (شرکت / سازمان)</span>
                </label>
                <p className="text-xs text-slate-400 mt-1">
                  {form.is_legal ? 'کد اقتصادی الزامی است.' : 'کد ملی الزامی است.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  شماره ثبت شرکت
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={form.registration_number}
                  onChange={handleChange}
                  placeholder="شماره ثبت"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* ردیف ۶: کد ملی / کد اقتصادی (شرطی) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-2">
                    کد ملی
                    {!form.is_legal && <span className="text-red-500">*</span>}
                  </span>
                </label>
                <input
                  type="text"
                  name="national_id"
                  value={form.national_id}
                  onChange={handleChange}
                  placeholder="۱۰ رقم"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition ${
                    !form.is_legal && !form.national_id.trim() && error?.includes('کد ملی')
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200'
                  }`}
                />
                {!form.is_legal && (
                  <p className="text-xs text-slate-400 mt-1">برای اشخاص حقیقی الزامی است.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-2">
                    کد اقتصادی
                    {form.is_legal && <span className="text-red-500">*</span>}
                  </span>
                </label>
                <input
                  type="text"
                  name="economic_code"
                  value={form.economic_code}
                  onChange={handleChange}
                  placeholder="۱۲ رقم"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition ${
                    form.is_legal && !form.economic_code.trim() && error?.includes('کد اقتصادی')
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200'
                  }`}
                />
                {form.is_legal && (
                  <p className="text-xs text-slate-400 mt-1">برای اشخاص حقوقی الزامی است.</p>
                )}
              </div>
            </div>

            {/* ردیف ۷: وب‌سایت و نام نماینده */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  وب‌سایت
                </label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  نام نماینده (برای اشخاص حقوقی)
                </label>
                <input
                  type="text"
                  name="representative_name"
                  value={form.representative_name}
                  onChange={handleChange}
                  placeholder="نام نماینده"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* ردیف ۸: شرکت / سازمان */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                نام شرکت / سازمان
              </label>
              <input
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="نام شرکت یا سازمان"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
              />
            </div>

            {/* ردیف ۹: حوزه تخصص و فعالیت */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  تخصص‌ها
                </label>
                <input
                  type="text"
                  name="expertise"
                  value={form.expertise}
                  onChange={handleChange}
                  placeholder="مثلاً: هوش مصنوعی، اینترنت اشیاء"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  حوزه فعالیت
                </label>
                <input
                  type="text"
                  name="activity_domain"
                  value={form.activity_domain}
                  onChange={handleChange}
                  placeholder="مثلاً: انرژی، سلامت"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* ردیف ۱۰: خلاصه سوابق */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                خلاصه سوابق و تجربیات
              </label>
              <textarea
                name="experience_summary"
                value={form.experience_summary}
                onChange={handleChange}
                rows={3}
                placeholder="سوابق کاری، پروژه‌ها، دستاوردها..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-y"
              />
            </div>

            {/* دکمه ثبت‌نام */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-700 to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ثبت‌نام...
                </>
              ) : (
                'ثبت‌نام'
              )}
            </button>

            {/* لینک به صفحه ورود */}
            <p className="text-center text-sm text-slate-500 mt-4">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link href="/login" className="text-blue-700 font-bold hover:underline">
                وارد شوید
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}