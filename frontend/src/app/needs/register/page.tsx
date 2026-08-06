// ============================================================
// src/app/needs/register/page.tsx
// صفحه ثبت نیاز فناورانه - نسخه نهایی
// اصلاحات:
// 1. رفع خطای buyer با تنظیم read_only_fields در serializer (بک‌اند)
// 2. در فرانت‌اند: پس از ثبت موفق، پیام موفقیت با دکمه رفتن به داشبورد نمایش داده می‌شود
// 3. حذف redirect خودکار (کاربر خودش تصمیم می‌گیرد)
// 4. مدیریت کامل خطاهای اعتبارسنجی برگشتی از سرور
// ============================================================

'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Check, ChevronLeft, ChevronRight, FileText, ShieldCheck, AlertCircle, Sparkles,
  Lightbulb, Target, DollarSign, Lock, Send, Trash2, Plus,
  Building2, Globe, BarChart3, MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ============================================================
// Types
// ============================================================
type NeedFormData = {
  title: string;
  description: string;
  industry: number | '';
  technology: string;
  city: string;
  currentStatus: string;
  expectedOutput: string;
  constraints: string;
  budget: number | '';
  timeline: string;
  confidentiality: 'public' | 'private';
  evaluationCriteria: string;
  attachments: File[];
};

type Industry = {
  id: number;
  name: string;
};

// ============================================================
// Static options (به جز industry که از سرور می‌آید)
// ============================================================
const TECHNOLOGY_OPTIONS = [
  'هوش مصنوعی', 'اینترنت اشیاء', 'دوقلوی دیجیتال', 'رباتیک', 'بلاکچین',
  'داده‌کاوی', 'بینایی ماشین', 'پردازش زبان طبیعی', 'اتوماسیون صنعتی', 'رایانش ابری', 'سایر',
];

const CITY_OPTIONS = [
  'تهران', 'اصفهان', 'شیراز', 'تبریز', 'مشهد', 'یزد', 'کرج', 'اهواز',
  'رشت', 'کرمان', 'ارومیه', 'اردبیل', 'بندرعباس', 'بوشهر', 'زاهدان',
  'سنندج', 'قزوین', 'قم', 'لرستان', 'گرگان', 'همدان', 'سایر',
];

const TIMELINE_OPTIONS = [
  'کمتر از ۱ ماه', '۱ تا ۳ ماه', '۳ تا ۶ ماه', '۶ تا ۱۲ ماه', 'بیش از ۱۲ ماه', 'نامشخص',
];

const BUDGET_OPTIONS = [
  { label: 'کمتر از ۱۰۰ میلیون تومان', value: 100000000 },
  { label: '۱۰۰ تا ۵۰۰ میلیون تومان', value: 500000000 },
  { label: '۵۰۰ میلیون تا ۱ میلیارد تومان', value: 1000000000 },
  { label: '۱ تا ۵ میلیارد تومان', value: 5000000000 },
  { label: '۵ تا ۱۰ میلیارد تومان', value: 10000000000 },
  { label: 'بیش از ۱۰ میلیارد تومان', value: 20000000000 },
  { label: 'نامشخص', value: null },
];

// ============================================================
// Fallback industries (اگر سرور پاسخ ندهد)
// ============================================================
const DEFAULT_INDUSTRIES: Industry[] = [
  { id: 1, name: 'نفت و گاز' },
  { id: 2, name: 'پالایش و پتروشیمی' },
  { id: 3, name: 'فولاد و معدن' },
  { id: 4, name: 'سلامت' },
  { id: 5, name: 'کشاورزی' },
  { id: 6, name: 'حمل‌ونقل' },
  { id: 7, name: 'خودروسازی' },
  { id: 8, name: 'انرژی' },
  { id: 9, name: 'فناوری اطلاعات' },
  { id: 10, name: 'محیط زیست' },
  { id: 11, name: 'سایر' },
];

// ============================================================
// Initial form
// ============================================================
const initialForm: NeedFormData = {
  title: '',
  description: '',
  industry: '',
  technology: '',
  city: '',
  currentStatus: '',
  expectedOutput: '',
  constraints: '',
  budget: '',
  timeline: '',
  confidentiality: 'public',
  evaluationCriteria: '',
  attachments: [],
};

const wizardSteps = [
  'تعریف مسئله',
  'زمینه صنعتی',
  'خروجی مورد انتظار',
  'معیارهای انتخاب',
  'بودجه و زمان',
  'سطح محرمانگی',
  'انتشار یا ارسال',
];

const BRAND = { primary: '#1E3A8A', secondary: '#14B8A6' };

// ============================================================
// Main Component
// ============================================================
export default function NeedRegisterPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<NeedFormData>(initialForm);
  const [logoError, setLogoError] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>(DEFAULT_INDUSTRIES);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  // ============================================================
  // Fetch industries from server
  // ============================================================
  useEffect(() => {
    const fetchIndustries = async () => {
      if (!isAuthenticated || !accessToken) {
        setIndustries(DEFAULT_INDUSTRIES);
        return;
      }
      setLoadingIndustries(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
        const res = await fetch(`${API_URL}/industries/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          let industriesData: Industry[] = [];
          if (data.results && Array.isArray(data.results)) {
            industriesData = data.results;
          } else if (Array.isArray(data)) {
            industriesData = data;
          } else {
            industriesData = DEFAULT_INDUSTRIES;
          }
          setIndustries(industriesData.length ? industriesData : DEFAULT_INDUSTRIES);
        } else {
          setIndustries(DEFAULT_INDUSTRIES);
        }
      } catch (error) {
        console.error('Error fetching industries:', error);
        setIndustries(DEFAULT_INDUSTRIES);
      } finally {
        setLoadingIndustries(false);
      }
    };
    fetchIndustries();
  }, [isAuthenticated, accessToken]);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}10, #fff)` }}>
        <div className="w-full max-w-5xl rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}>
              <span className="text-2xl font-black text-white">ب ت</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">ثبت نیاز فناورانه</h1>
            <p className="mt-4 text-sm text-slate-500">در حال بارگذاری...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {!logoError ? (
                <img src="/logo.png" alt="بازار تحول" className="w-full h-full object-contain p-2" onError={() => setLogoError(true)} />
              ) : (
                <span className="text-[#1E3A8A] font-black text-5xl">ب ت</span>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">لطفاً وارد شوید</h2>
          <p className="text-slate-500 text-sm mb-6">برای ثبت نیاز فناورانه، باید وارد حساب کاربری خود شوید.</p>
          <a href="/login?next=/need/register" className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold shadow-lg hover:shadow-xl transition">
            ورود به حساب کاربری
          </a>
        </div>
      </div>
    );
  }

  // ============================================================
  // Form handlers
  // ============================================================
  const updateField = (field: keyof NeedFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
  };

  const removeFile = (index: number) => {
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

  const validateStep = (stepIndex: number): boolean => {
    const errs: string[] = [];
    if (stepIndex === 0) {
      if (!form.title.trim()) errs.push('عنوان نیاز الزامی است.');
      if (!form.description.trim()) errs.push('شرح مسئله الزامی است.');
    }
    if (stepIndex === 1) {
      if (!form.industry) errs.push('صنعت مرتبط الزامی است.');
      if (!form.currentStatus.trim()) errs.push('وضعیت فعلی الزامی است.');
    }
    if (stepIndex === 2) {
      if (!form.expectedOutput.trim()) errs.push('خروجی مورد انتظار الزامی است.');
    }
    if (stepIndex === 3) {
      if (!form.evaluationCriteria.trim()) errs.push('معیارهای ارزیابی راهکار الزامی است.');
    }
    if (stepIndex === 4) {
      if (!form.budget) errs.push('بودجه تقریبی الزامی است.');
      if (!form.timeline.trim()) errs.push('زمان‌بندی الزامی است.');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep <= step) {
      setErrors([]);
      setStep(targetStep);
      return;
    }
    for (let s = step; s < targetStep; s++) {
      if (!validateStep(s)) return;
    }
    setErrors([]);
    setStep(targetStep);
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setErrors([]);
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setErrors([]);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  // ============================================================
  // Submit handler with FormData
  // ============================================================
  const handleSubmit = async () => {
    if (!validateStep(6)) return;
    if (!isAuthenticated || !accessToken) {
      setErrors(['لطفاً ابتدا وارد حساب کاربری خود شوید.']);
      return;
    }

    setLoading(true);
    setSubmitMessage('');
    setErrors([]);

    try {
      const formData = new FormData();

      // ---- فیلدهای اجباری ----
      formData.append('title', form.title);
      formData.append('description', form.description);
      if (form.industry) formData.append('industry', String(form.industry));
      if (form.currentStatus) formData.append('current_status', form.currentStatus);
      if (form.expectedOutput) formData.append('expected_outcome', form.expectedOutput);
      if (form.evaluationCriteria) formData.append('evaluation_criteria', form.evaluationCriteria);
      if (form.budget) formData.append('budget', String(form.budget));
      if (form.timeline) formData.append('timeline', form.timeline);
      formData.append('confidentiality', form.confidentiality);

      // ---- فیلدهای اختیاری ----
      if (form.constraints) formData.append('constraints', form.constraints);
      // technology و city در مدل وجود ندارند – ارسال نمی‌شوند
      // attachments
      form.attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(`${API_URL}/needs/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const textResponse = await response.text();
      console.log('📨 وضعیت:', response.status);
      console.log('📨 پاسخ خام:', textResponse);

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

        let errorMsg = 'خطا در ثبت نیاز.';
        if (!parseError && data) {
          if (data?.errors && typeof data.errors === 'object') {
            const fieldErrors = Object.entries(data.errors)
              .map(([f, msgs]) => `${f}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
              .join('; ');
            errorMsg = `خطاهای اعتبارسنجی: ${fieldErrors}`;
          } else if (data?.detail) {
            errorMsg = data.detail;
          } else if (data?.message) {
            errorMsg = data.message;
          } else if (typeof data === 'object') {
            errorMsg = JSON.stringify(data);
          }
        } else {
          errorMsg = `خطای سرور (کد ${response.status})`;
        }
        throw new Error(errorMsg);
      }

      if (parseError) throw new Error('پاسخ سرور نامعتبر است.');

      // ===== ثبت موفق =====
      setSubmitMessage('✅ نیاز فناورانه شما با موفقیت ثبت شد.');
      // دیگر redirect خودکار انجام نمی‌شود – کاربر با کلیک روی دکمه به داشبورد می‌رود
    } catch (error: any) {
      console.error('❌ خطا:', error);
      setErrors([error.message || 'خطا در ثبت نیاز. لطفاً دوباره تلاش کنید.']);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif", background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}10, #fff)` }}>
      <div className="w-full max-w-5xl rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm sm:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          {!logoError ? (
            <Image src="/logo.png" alt="بازار تحول" width={64} height={64} className="mb-4 object-contain" onError={() => setLogoError(true)} priority />
          ) : (
            <span className="mb-4 text-2xl font-black text-slate-700">ب ت</span>
          )}
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">ثبت نیاز فناورانه</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">مسئله، چالش یا نیاز فناورانه خود را برای دریافت راهکار ثبت کنید</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {wizardSteps.map((label, index) => {
              const isActive = step === index;
              const isDone = step > index;
              return (
                <div key={label} className="flex items-center gap-1 sm:gap-2">
                  <button type="button" onClick={() => handleStepClick(index)} className="flex flex-col items-center transition-all hover:scale-105 cursor-pointer" title={`رفتن به ${label}`}>
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all ${
                      isActive ? 'scale-110 text-white shadow-lg ring-4 ring-white/60' :
                      isDone ? 'text-white shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    }`}
                      style={{ background: (isActive || isDone) ? `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` : undefined }}>
                      {isDone ? <Check size={14} /> : index + 1}
                    </div>
                    <span className={`mt-1 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                      isActive ? 'text-slate-900 font-bold' : isDone ? 'text-teal-700' : 'text-slate-400'
                    }`}>{label}</span>
                  </button>
                  {index < wizardSteps.length - 1 && (
                    <div className={`h-0.5 w-4 sm:w-6 rounded-full ${step > index ? 'bg-teal-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="mb-2 flex items-center gap-2 font-bold"><AlertCircle size={18} /> خطاهای فرم</div>
            <ul className="list-inside list-disc space-y-1 text-sm whitespace-pre-wrap">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Success Message with button */}
        {submitMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <ShieldCheck className="h-14 w-14 text-emerald-600 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-emerald-800">{submitMessage}</h3>
            <p className="text-sm text-emerald-600 mt-1">نیاز شما با موفقیت در سامانه ثبت شد.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-5 px-8 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md"
            >
              رفتن به داشبورد
            </button>
          </div>
        )}

        {/* اگر submitMessage وجود دارد، بقیه محتوا را مخفی می‌کنیم (اختیاری) */}
        {!submitMessage && (
          <>
            {/* Steps */}
            {step === 0 && <ProblemDefinitionStep form={form} updateField={updateField} />}
            {step === 1 && <IndustryContextStep form={form} updateField={updateField} industries={industries} loadingIndustries={loadingIndustries} />}
            {step === 2 && <ExpectedOutputStep form={form} updateField={updateField} />}
            {step === 3 && <EvaluationCriteriaStep form={form} updateField={updateField} />}
            {step === 4 && <BudgetTimelineStep form={form} updateField={updateField} />}
            {step === 5 && <ConfidentialityStep form={form} updateField={updateField} />}
            {step === 6 && <ReviewPublishStep form={form} loading={loading} handleFileChange={handleFileChange} removeFile={removeFile} industries={industries} />}

            {/* Navigation */}
            <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={prevStep} disabled={step === 0 || loading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronRight size={18} /> مرحله قبل
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400"><Sparkles size={14} /> مرحله {step + 1} از {wizardSteps.length}</div>
              {step < 6 ? (
                <button type="button" onClick={nextStep} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}>
                  مرحله بعد <ChevronLeft size={18} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}>
                  {loading ? 'در حال ارسال...' : 'انتشار نیاز'} <Send size={18} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step Components
// ============================================================

function ProblemDefinitionStep({ form, updateField }: { form: NeedFormData; updateField: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Lightbulb size={24} className="text-teal-500" /> تعریف مسئله</h2>
        <p className="mt-1 text-sm text-slate-500">عنوان و شرح دقیق نیاز یا چالش فناورانه خود را بنویسید.</p>
      </div>
      <InputField label="عنوان نیاز" value={form.title} onChange={v => updateField('title', v)} placeholder="مثلاً: بهینه‌سازی مصرف انرژی در کوره واحد تقطیر" />
      <TextareaField label="شرح مسئله" value={form.description} onChange={v => updateField('description', v)} rows={6} placeholder="توضیح دهید چه مشکلی دارید، چرا مهم است و چه تأثیری بر کسب‌وکار شما دارد." />
    </div>
  );
}

function IndustryContextStep({ form, updateField, industries, loadingIndustries }: { form: NeedFormData; updateField: any; industries: Industry[]; loadingIndustries: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Building2 size={24} className="text-teal-500" /> زمینه صنعتی</h2>
        <p className="mt-1 text-sm text-slate-500">صنعت، فناوری، شهر و وضعیت فعلی را مشخص کنید.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">صنعت مرتبط</label>
          <select
            value={form.industry}
            onChange={(e) => updateField('industry', e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2"
            style={{ '--tw-ring-color': '#1E3A8A' } as any}
            disabled={loadingIndustries}
          >
            <option value="">انتخاب صنعت...</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
          </select>
          {loadingIndustries && <p className="mt-1 text-xs text-slate-400">در حال بارگذاری صنایع...</p>}
        </div>
        <SelectField label="فناوری مرتبط" value={form.technology} onChange={(v) => updateField('technology', v)} options={TECHNOLOGY_OPTIONS} placeholder="انتخاب فناوری..." />
        <SelectField label="شهر / استان" value={form.city} onChange={(v) => updateField('city', v)} options={CITY_OPTIONS} placeholder="انتخاب شهر..." />
      </div>
      <TextareaField label="وضعیت فعلی" value={form.currentStatus} onChange={(v) => updateField('currentStatus', v)} rows={4} placeholder="شرح دهید اکنون چه فرآیندی دارید، چه ابزار یا روشی استفاده می‌کنید و چه محدودیت‌هایی وجود دارد." />
    </div>
  );
}

function ExpectedOutputStep({ form, updateField }: { form: NeedFormData; updateField: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Target size={24} className="text-teal-500" /> خروجی مورد انتظار</h2>
        <p className="mt-1 text-sm text-slate-500">دقیقاً چه خروجی یا نتیجه‌ای از راهکار مورد نظر انتظار دارید؟</p>
      </div>
      <TextareaField label="خروجی مورد انتظار" value={form.expectedOutput} onChange={(v) => updateField('expectedOutput', v)} rows={5} placeholder="مثلاً: کاهش ۱۵٪ مصرف گاز طبیعی، افزایش کیفیت نفت سفید به میزان ۲ واحد، یا یک سامانه پایش آنلاین." />
      <TextareaField label="محدودیت‌ها" value={form.constraints} onChange={(v) => updateField('constraints', v)} rows={3} placeholder="محدودیت‌های فنی، بودجه‌ای، زمانی، محیطی یا سازمانی که باید در نظر گرفته شود." />
    </div>
  );
}

function EvaluationCriteriaStep({ form, updateField }: { form: NeedFormData; updateField: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><BarChart3 size={24} className="text-teal-500" /> معیارهای انتخاب</h2>
        <p className="mt-1 text-sm text-slate-500">معیارهایی که بر اساس آن‌ها راهکارهای پیشنهادی را ارزیابی خواهید کرد.</p>
      </div>
      <TextareaField label="معیارهای ارزیابی راهکار" value={form.evaluationCriteria} onChange={(v) => updateField('evaluationCriteria', v)} rows={5} placeholder="مثلاً: دقت پیش‌بینی، هزینه پیاده‌سازی، زمان اجرا، سابقه فروشنده، قابلیت یکپارچه‌سازی با سیستم‌های موجود." />
    </div>
  );
}

function BudgetTimelineStep({ form, updateField }: { form: NeedFormData; updateField: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><DollarSign size={24} className="text-teal-500" /> بودجه و زمان</h2>
        <p className="mt-1 text-sm text-slate-500">بودجه و بازه زمانی مورد انتظار را مشخص کنید.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">بودجه تقریبی</label>
          <select
            value={form.budget}
            onChange={(e) => updateField('budget', e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2"
            style={{ '--tw-ring-color': '#1E3A8A' } as any}
          >
            <option value="">انتخاب بازه بودجه...</option>
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value || ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <SelectField label="زمان‌بندی مورد انتظار" value={form.timeline} onChange={(v) => updateField('timeline', v)} options={TIMELINE_OPTIONS} placeholder="انتخاب بازه زمانی..." />
      </div>
    </div>
  );
}

function ConfidentialityStep({ form, updateField }: { form: NeedFormData; updateField: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Lock size={24} className="text-teal-500" /> سطح محرمانگی</h2>
        <p className="mt-1 text-sm text-slate-500">تعیین کنید آیا این نیاز به صورت عمومی منتشر شود یا فقط برای عرضه‌کنندگان منتخب قابل مشاهده باشد.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => updateField('confidentiality', 'public')}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
            form.confidentiality === 'public' ? 'border-transparent text-white shadow-lg' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          style={form.confidentiality === 'public' ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}
        >
          <Globe size={32} />
          <span className="font-bold">انتشار عمومی</span>
          <span className="text-xs text-center opacity-80">همه کاربران بازار می‌توانند این نیاز را ببینند</span>
        </button>
        <button
          type="button"
          onClick={() => updateField('confidentiality', 'private')}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
            form.confidentiality === 'private' ? 'border-transparent text-white shadow-lg' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          style={form.confidentiality === 'private' ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}
        >
          <Lock size={32} />
          <span className="font-bold">انتشار خصوصی</span>
          <span className="text-xs text-center opacity-80">فقط عرضه‌کنندگان تأییدشده می‌توانند این نیاز را ببینند</span>
        </button>
      </div>
    </div>
  );
}

function ReviewPublishStep({ form, loading, handleFileChange, removeFile, industries }: {
  form: NeedFormData;
  loading: boolean;
  handleFileChange: (files: FileList | null) => void;
  removeFile: (index: number) => void;
  industries: Industry[];
}) {
  const getIndustryName = (id: number | '') => {
    if (!id) return '-';
    const found = industries.find((i) => i.id === id);
    return found ? found.name : String(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Send size={24} className="text-teal-500" /> بازبینی و انتشار</h2>
        <p className="mt-1 text-sm text-slate-500">اطلاعات را مرور کنید، فایل‌ها را اضافه کنید و نیاز خود را منتشر نمایید.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard title="تعریف مسئله">
          <SummaryRow label="عنوان" value={form.title} />
          <SummaryRow label="شرح مسئله" value={form.description} />
        </SummaryCard>
        <SummaryCard title="زمینه صنعتی">
          <SummaryRow label="صنعت" value={getIndustryName(form.industry)} />
          <SummaryRow label="فناوری" value={form.technology || '-'} />
          <SummaryRow label="شهر" value={form.city || '-'} />
          <SummaryRow label="وضعیت فعلی" value={form.currentStatus} />
        </SummaryCard>
        <SummaryCard title="خروجی و محدودیت‌ها">
          <SummaryRow label="خروجی مورد انتظار" value={form.expectedOutput} />
          <SummaryRow label="محدودیت‌ها" value={form.constraints} />
        </SummaryCard>
        <SummaryCard title="معیارها، بودجه و زمان">
          <SummaryRow label="معیارهای ارزیابی" value={form.evaluationCriteria} />
          <SummaryRow label="بودجه" value={form.budget ? new Intl.NumberFormat('fa-IR').format(Number(form.budget)) + ' تومان' : '-'} />
          <SummaryRow label="زمان‌بندی" value={form.timeline} />
        </SummaryCard>
        <SummaryCard title="محرمانگی">
          <SummaryRow label="سطح انتشار" value={form.confidentiality === 'public' ? 'عمومی' : 'خصوصی'} />
        </SummaryCard>
        <SummaryCard title="فایل‌های پیوست">
          <div className="space-y-2">
            {form.attachments.length > 0 ? (
              form.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-teal-600" />
                    <span className="text-slate-700 max-w-[160px] truncate">{file.name}</span>
                  </div>
                  <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400">فایلی بارگذاری نشده است</span>
            )}
            <button type="button" onClick={() => document.getElementById('need-file-upload')?.click()} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal-700 border border-teal-200 hover:bg-teal-50">
              <Plus size={16} /> افزودن فایل
            </button>
            <input id="need-file-upload" type="file" multiple className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}

// ============================================================
// Reusable Components
// ============================================================

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': BRAND.primary } as any} />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 4, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': BRAND.primary } as any} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': BRAND.primary } as any}>
        <option value="">{placeholder || 'انتخاب کنید...'}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
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