'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Package,
  Tag,
  Layers,
  MapPin,
  Cpu,
  DollarSign,
  Hash,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ==================== Types ====================

type SupplyFormData = {
  title: string;
  category: string;
  industry: string;
  technology: string;
  city: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
  trl: string;
  images: File[];
  documents: File[];
};

// ==================== Constants ====================

const BRAND = {
  primary: '#1E3A8A',
  secondary: '#14B8A6',
};

const unitOptions = [
  'عدد',
  'کیلوگرم',
  'تن',
  'متر',
  'لیتر',
  'مگاوات',
  'ساعت',
  'نفر-ساعت',
  'دستگاه',
  'سرویس',
  'ماژول',
  'بسته',
  'پروژه',
  'سفارش',
  'سایر',
];

const categoryOptions = [
  'نرم‌افزار',
  'سخت‌افزار',
  'خدمات مشاوره',
  'خدمات فنی و مهندسی',
  'محصولات شیمیایی',
  'تجهیزات صنعتی',
  'اتوماسیون و کنترل',
  'انرژی',
  'مواد اولیه',
  'محصولات دانش‌بنیان',
  'سایر',
];

const industryOptions = [
  'نفت و گاز',
  'پالایش و پتروشیمی',
  'فولاد و معدن',
  'سلامت',
  'کشاورزی',
  'حمل‌ونقل',
  'خودروسازی',
  'انرژی',
  'فناوری اطلاعات',
  'محیط زیست',
  'سایر',
];

const cityOptions = [
  'تهران',
  'اصفهان',
  'شیراز',
  'تبریز',
  'مشهد',
  'یزد',
  'کرج',
  'اهواز',
  'رشت',
  'کرمان',
  'ارومیه',
  'اردبیل',
  'بندرعباس',
  'بوشهر',
  'زاهدان',
  'سنندج',
  'قزوین',
  'قم',
  'لرستان',
  'گرگان',
  'همدان',
  'سایر',
];

const wizardSteps = ['اطلاعات پایه', 'جزئیات عرضه', 'مستندات', 'تأیید و ارسال'];

const initialForm: SupplyFormData = {
  title: '',
  category: '',
  industry: '',
  technology: '',
  city: '',
  description: '',
  quantity: '',
  unit: '',
  price: '',
  trl: '',
  images: [],
  documents: [],
};

const MAX_IMAGES = 3;
const MAX_DOCUMENTS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ==================== Main Component ====================

export default function SupplyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<SupplyFormData>(initialForm);
  const [logoFailed, setLogoFailed] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const { accessToken, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // ایجاد پیش‌نمایش برای تصاویر
  useEffect(() => {
    const urls = form.images.map((file) => URL.createObjectURL(file));
    setPreviewImages(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.images]);

  const updateForm = (key: keyof SupplyFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleFileChange = (field: 'images' | 'documents', files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const maxFiles = field === 'images' ? MAX_IMAGES : MAX_DOCUMENTS;
    const currentCount = form[field].length;
    const total = currentCount + newFiles.length;

    if (total > maxFiles) {
      setErrors([`حداکثر ${maxFiles} فایل مجاز است.`]);
      const remaining = maxFiles - currentCount;
      if (remaining > 0) {
        const limited = newFiles.slice(0, remaining);
        setForm((prev) => ({
          ...prev,
          [field]: [...prev[field], ...limited],
        }));
      }
      return;
    }

    // بررسی حجم فایل‌ها
    const oversized = newFiles.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setErrors([`حجم هر فایل نباید بیشتر از ${MAX_FILE_SIZE / 1024 / 1024} مگابایت باشد.`]);
      const validFiles = newFiles.filter((f) => f.size <= MAX_FILE_SIZE);
      if (validFiles.length === 0) return;
      setForm((prev) => ({
        ...prev,
        [field]: [...prev[field], ...validFiles],
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], ...newFiles],
    }));
    setErrors([]);
  };

  const removeFile = (field: 'images' | 'documents', index: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const validateStep = (): boolean => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.title.trim()) newFieldErrors.title = 'عنوان الزامی است.';
      if (!form.category) newFieldErrors.category = 'دسته‌بندی الزامی است.';
      if (form.title.length < 3) newFieldErrors.title = 'عنوان حداقل ۳ کاراکتر باشد.';
      if (form.title.length > 200) newFieldErrors.title = 'عنوان حداکثر ۲۰۰ کاراکتر باشد.';
    }

    if (step === 1) {
      if (!form.description.trim()) newFieldErrors.description = 'توضیحات الزامی است.';
      if (form.description.length < 20) newFieldErrors.description = 'توضیحات حداقل ۲۰ کاراکتر باشد.';
      if (!form.quantity.trim()) newFieldErrors.quantity = 'مقدار الزامی است.';
      else if (!/^\d+(\.\d+)?$/.test(form.quantity)) newFieldErrors.quantity = 'فقط عدد وارد کنید.';
      if (!form.unit) newFieldErrors.unit = 'واحد الزامی است.';
      if (!form.price.trim()) newFieldErrors.price = 'قیمت الزامی است.';
      else if (!/^\d+(\.\d+)?$/.test(form.price)) newFieldErrors.price = 'فقط عدد وارد کنید.';
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0 && newErrors.length === 0;
  };

  const goToStep = (targetStep: number) => {
    if (targetStep > step && !validateStep()) return;
    setErrors([]);
    setFieldErrors({});
    setStep(targetStep);
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setErrors([]);
    setFieldErrors({});
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setErrors([]);
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  // ============================================================
  // ارسال فرم با پشتیبانی کامل از فایل‌ها
  // ============================================================
  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (!isAuthenticated || !accessToken) {
      setErrors(['لطفاً ابتدا وارد حساب کاربری خود شوید.']);
      return;
    }

    setLoading(true);
    setSubmitMessage('');
    setErrors([]);

    try {
      const formData = new FormData();

      // فیلدهای متنی
      const textFields: (keyof SupplyFormData)[] = [
        'title', 'category', 'industry', 'technology', 'city',
        'description', 'quantity', 'unit', 'price', 'trl'
      ];
      textFields.forEach(field => {
        const value = form[field];
        if (value) {
          formData.append(field, String(value));
        }
      });

      // تصاویر با کلید 'uploaded_images'
      form.images.forEach(file => {
        formData.append('uploaded_images', file);
      });

      // مستندات با کلید 'documents'
      form.documents.forEach(file => {
        formData.append('documents', file);
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      const response = await fetch(`${API_URL}/products/supplies/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const textResponse = await response.text();
      let data: any = null;
      let parseError = false;
      try {
        data = JSON.parse(textResponse);
      } catch {
        parseError = true;
      }

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          router.push('/login?session_expired=true');
          throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
        }

        let errorMsg = 'خطا در ثبت عرضه.';

        if (!parseError && data) {
          if (data?.errors && typeof data.errors === 'object') {
            const fieldErrors = Object.entries(data.errors)
              .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMsg = `خطاهای اعتبارسنجی: ${fieldErrors}`;
          } else if (data?.detail) {
            errorMsg = data.detail;
          } else if (data?.non_field_errors) {
            errorMsg = data.non_field_errors.join(', ');
          } else if (typeof data === 'string') {
            errorMsg = data;
          } else if (data?.message) {
            errorMsg = data.message;
          } else {
            errorMsg = JSON.stringify(data);
          }
        } else {
          errorMsg = `خطای سرور (کد ${response.status})`;
        }

        throw new Error(errorMsg);
      }

      if (parseError) throw new Error('پاسخ سرور نامعتبر است.');

      setSubmitMessage('✅ عرضه شما با موفقیت ثبت شد و برای بررسی کارشناس ارسال گردید.');
    } catch (error: any) {
      console.error('❌ خطا در ثبت عرضه:', error);
      setErrors([error.message || 'خطا در ثبت عرضه. لطفاً دوباره تلاش کنید.']);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // نمایش پیام لاگین در صورت عدم احراز هویت
  // ============================================================
  if (mounted && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {!logoFailed ? (
                <img
                  src="/logo.png"
                  alt="بازار تحول"
                  className="w-full h-full object-contain p-2"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-[#1E3A8A] font-black text-5xl">ب ت</span>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">لطفاً وارد شوید</h2>
          <p className="text-slate-500 text-sm mb-6">برای ثبت محصول، باید وارد حساب کاربری خود شوید.</p>
          <Link
            href="/login?next=/supply/register"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold shadow-lg hover:shadow-xl transition"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}10, #ffffff)` }}>
        <div className="w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm text-center">
          <img src="/logo.png" alt="بازار تحول" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">ثبت عرضه</h1>
          <p className="mt-4 text-sm text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}10, #ffffff)` }}>
      <div className="w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm sm:p-8">

        {/* ===== Header ===== */}
        <div className="mb-8 flex flex-col items-center text-center">
          {!logoFailed ? (
            <img
              src="/logo.png"
              alt="بازار تحول"
              className="h-16 w-auto mb-4 object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] text-white font-black text-xl">
              ب ت
            </div>
          )}
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">ثبت عرضه محصول / خدمت</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">
            محصول، خدمت یا راهکار فناورانه خود را برای عرضه در بازار تحول ثبت کنید.
          </p>
        </div>

        {/* ===== Stepper ===== */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {wizardSteps.map((label, index) => {
              const isActive = step === index;
              const isDone = step > index;
              return (
                <div key={label} className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    className="flex flex-col items-center transition-all cursor-pointer hover:scale-105"
                    title={`رفتن به ${label}`}
                  >
                    <div
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all ${
                        isActive ? 'scale-110 text-white shadow-lg' :
                        isDone ? 'text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                      style={{
                        background: (isActive || isDone)
                          ? `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`
                          : undefined,
                      }}
                    >
                      {isDone ? <Check size={14} /> : index + 1}
                    </div>
                    <span className={`mt-1 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                      isActive ? 'text-slate-900 font-extrabold' :
                      isDone ? 'text-teal-700' : 'text-slate-400'
                    }`}>
                      {label}
                    </span>
                  </button>
                  {index < wizardSteps.length - 1 && (
                    <div className={`h-0.5 w-4 sm:w-6 ${step > index ? 'bg-teal-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Error Box ===== */}
        {errors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="mb-2 flex items-center gap-2 font-bold"><AlertCircle size={18} /> خطاهای فرم</div>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* ===== Success Message ===== */}
        {submitMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <ShieldCheck className="h-14 w-14 text-emerald-600 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-emerald-800">{submitMessage}</h3>
            <p className="text-sm text-emerald-600 mt-1">عرضه شما با موفقیت در سامانه ثبت شد.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-5 px-8 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md"
            >
              رفتن به داشبورد
            </button>
          </div>
        )}

        {/* ===== اگر submitMessage وجود دارد، بقیه محتوا را مخفی می‌کنیم ===== */}
        {!submitMessage && (
          <>
            {/* ===== Step 0 - Basic Info ===== */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">اطلاعات پایه</h2>
                  <p className="mt-1 text-sm text-slate-500">عنوان، دسته‌بندی، صنعت، فناوری و شهر را مشخص کنید.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="عنوان محصول / خدمت"
                    value={form.title}
                    onChange={(v) => updateForm('title', v)}
                    error={fieldErrors.title}
                    icon={<Tag size={18} />}
                    placeholder="مثال: سامانه مدیریت انرژی"
                    required
                  />
                  <SelectField
                    label="دسته‌بندی"
                    value={form.category}
                    onChange={(v) => updateForm('category', v)}
                    options={categoryOptions}
                    error={fieldErrors.category}
                    icon={<Layers size={18} />}
                    required
                  />
                  <SelectField
                    label="صنعت"
                    value={form.industry}
                    onChange={(v) => updateForm('industry', v)}
                    options={industryOptions}
                    icon={<Package size={18} />}
                    placeholder="انتخاب صنعت"
                  />
                  <InputField
                    label="فناوری"
                    value={form.technology}
                    onChange={(v) => updateForm('technology', v)}
                    icon={<Cpu size={18} />}
                    placeholder="مثال: هوش مصنوعی، اینترنت اشیاء"
                  />
                  <SelectField
                    label="شهر"
                    value={form.city}
                    onChange={(v) => updateForm('city', v)}
                    options={cityOptions}
                    icon={<MapPin size={18} />}
                    placeholder="انتخاب شهر"
                  />
                </div>
              </div>
            )}

            {/* ===== Step 1 - Supply Details ===== */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">جزئیات عرضه</h2>
                  <p className="mt-1 text-sm text-slate-500">توضیحات، مقدار، قیمت و سطح آمادگی فناوری را وارد کنید.</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    توضیحات <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows={5}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
                      fieldErrors.description ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-transparent focus:ring-[#1E3A8A]'
                    }`}
                    placeholder="توضیحات کامل محصول یا خدمت، کاربردها و مزایا..."
                  />
                  {fieldErrors.description && <p className="mt-1 text-xs text-red-500">{fieldErrors.description}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="مقدار"
                    value={form.quantity}
                    onChange={(v) => updateForm('quantity', v)}
                    error={fieldErrors.quantity}
                    icon={<Hash size={18} />}
                    inputMode="numeric"
                    placeholder="مثلاً ۱۰۰"
                    required
                  />
                  <SelectField
                    label="واحد"
                    value={form.unit}
                    onChange={(v) => updateForm('unit', v)}
                    options={unitOptions}
                    error={fieldErrors.unit}
                    required
                  />
                  <InputField
                    label="قیمت (تومان)"
                    value={form.price}
                    onChange={(v) => updateForm('price', v)}
                    error={fieldErrors.price}
                    icon={<DollarSign size={18} />}
                    inputMode="numeric"
                    placeholder="مثلاً ۵۰۰۰۰۰۰۰"
                    required
                  />
                  <InputField
                    label="سطح آمادگی فناوری (TRL)"
                    value={form.trl}
                    onChange={(v) => updateForm('trl', v)}
                    icon={<Cpu size={18} />}
                    inputMode="numeric"
                    placeholder="۱ تا ۹"
                  />
                </div>
              </div>
            )}

            {/* ===== Step 2 - Documents (با محدودیت و پیش‌نمایش) ===== */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">مستندات و رسانه</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    تصاویر (حداکثر {MAX_IMAGES} عدد)، کاتالوگ، گواهی‌نامه‌ها و مستندات فنی را بارگذاری کنید (اختیاری).
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FileUploadCard
                    title="تصاویر محصول"
                    description={`فرمت‌های jpg, png, webp (حداکثر ${MAX_IMAGES} عدد)`}
                    files={form.images}
                    previewUrls={previewImages}
                    onAdd={(files) => handleFileChange('images', files)}
                    onRemove={(index) => removeFile('images', index)}
                    accept="image/*"
                    maxFiles={MAX_IMAGES}
                    currentCount={form.images.length}
                    type="image"
                  />
                  <FileUploadCard
                    title="مستندات فنی"
                    description="PDF, Word, Excel, ZIP (حداکثر ۱۰MB هر فایل)"
                    files={form.documents}
                    previewUrls={[]}
                    onAdd={(files) => handleFileChange('documents', files)}
                    onRemove={(index) => removeFile('documents', index)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                    maxFiles={MAX_DOCUMENTS}
                    currentCount={form.documents.length}
                    type="document"
                  />
                </div>
              </div>
            )}

            {/* ===== Step 3 - Review & Submit ===== */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">تأیید و ارسال</h2>
                  <p className="mt-1 text-sm text-slate-500">اطلاعات وارد شده را مرور کرده و عرضه را نهایی کنید.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SummaryCard title="اطلاعات پایه">
                    <SummaryRow label="عنوان" value={form.title} />
                    <SummaryRow label="دسته‌بندی" value={form.category} />
                    <SummaryRow label="صنعت" value={form.industry || '-'} />
                    <SummaryRow label="فناوری" value={form.technology || '-'} />
                    <SummaryRow label="شهر" value={form.city || '-'} />
                  </SummaryCard>
                  <SummaryCard title="جزئیات عرضه">
                    <SummaryRow label="توضیحات" value={form.description} />
                    <SummaryRow label="مقدار" value={form.quantity} />
                    <SummaryRow label="واحد" value={form.unit} />
                    <SummaryRow label="قیمت" value={`${form.price} تومان`} />
                    <SummaryRow label="TRL" value={form.trl || '-'} />
                  </SummaryCard>
                  <SummaryCard title="مستندات">
                    <SummaryRow label="تصاویر" value={form.images.length ? `${form.images.length} فایل` : 'بدون تصویر'} />
                    <SummaryRow label="مستندات" value={form.documents.length ? `${form.documents.length} فایل` : 'بدون مستندات'} />
                    {form.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.images.map((file, idx) => (
                          <img
                            key={idx}
                            src={previewImages[idx]}
                            alt={`تصویر ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </SummaryCard>
                </div>
              </div>
            )}

            {/* ===== Footer Navigation ===== */}
            <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0 || loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={18} /> مرحله قبل
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={14} /> مرحله {step + 1} از {wizardSteps.length}
              </div>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}
                >
                  مرحله بعد <ChevronLeft size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      در حال ثبت...
                    </span>
                  ) : (
                    <>ثبت عرضه <ShieldCheck size={18} /></>
                  )}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ==================== Sub-components ====================

function InputField({ label, value, onChange, type = 'text', error, icon, inputMode, placeholder, required = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  icon?: React.ReactNode;
  inputMode?: 'numeric' | 'text';
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-white py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
            icon ? 'pr-10 pl-4' : 'px-4'
          } ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-transparent focus:ring-[#1E3A8A]'
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, error, icon, placeholder, required = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-2xl border bg-white py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
            icon ? 'pr-10 pl-4' : 'px-4'
          } ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-transparent focus:ring-[#1E3A8A]'
          }`}
        >
          <option value="">{placeholder || 'انتخاب کنید...'}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FileUploadCard({
  title,
  description,
  files,
  previewUrls,
  onAdd,
  onRemove,
  accept,
  maxFiles,
  currentCount,
  type = 'file',
}: {
  title: string;
  description: string;
  files: File[];
  previewUrls: string[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  accept: string;
  maxFiles?: number;
  currentCount?: number;
  type?: 'image' | 'document' | 'file';
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFull = maxFiles !== undefined && currentCount !== undefined && currentCount >= maxFiles;
  const Icon = type === 'image' ? ImageIcon : FileText;

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['zip', 'rar'].includes(ext || '')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
          {isFull && <p className="text-xs text-red-500">تعداد مجاز تکمیل شده است.</p>}
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
          {currentCount || 0}/{maxFiles || '∞'}
        </span>
      </div>

      {/* نمایش فایل‌های آپلود شده */}
      {files.length > 0 && (
        <ul className="mb-4 space-y-2 max-h-52 overflow-y-auto">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {type === 'image' && previewUrls[i] ? (
                  <img
                    src={previewUrls[i]}
                    alt={file.name}
                    className="w-8 h-8 object-cover rounded border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <span className="text-lg flex-shrink-0">{getFileIcon(file)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-700">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                title="حذف فایل"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition ${
          isFull ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
        }`}
        style={{
          background: isFull ? '#9CA3AF' : `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`
        }}
        disabled={isFull}
      >
        <Upload size={16} /> بارگذاری {type === 'image' ? 'تصویر' : 'مستند'}
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onAdd(e.target.files)}
        className="hidden"
        accept={accept}
        multiple
      />
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-4 text-sm font-black text-slate-800">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value || '-'}</span>
    </div>
  );
}