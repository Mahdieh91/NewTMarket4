'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Wrench, Package, Settings, Lightbulb, TrendingUp,
  Users, Scale, Building2, Check, ChevronLeft, ChevronRight,
  Eye, EyeOff, Upload, FileText, ShieldCheck, AlertCircle, Sparkles, User, Building,
} from 'lucide-react';

type UserRole = 'buyer_product' | 'buyer_service' | 'supplier_product' | 'supplier_service' |
  'need_registerer' | 'investor' | 'consultant' | 'broker' | 'partner' | null;
type AccountType = 'INDIVIDUAL' | 'LEGAL';

type FormDataType = {
  role: UserRole;
  accountType: AccountType;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  national_id: string;
  organization_name: string;
  registration_number: string;
  economic_code: string;
  website: string;
  representative_name: string;
  specialization: string;
  activity_domain: string;
  experience_summary: string;
  tech_domains: string[];
  industry_domains: string[];
  documents: {
    id_card: File | null;
    registration_doc: File | null;
    license_doc: File | null;
    representative_letter: File | null;
  };
  verificationScore: number;
  verificationStatus: 'red' | 'yellow' | 'green';
};

const BRAND = { primary: '#1E3A8A', secondary: '#14B8A6' };

const roleOptions = [
  { id: 'buyer_product', label: 'خریدار محصول فناورانه', description: 'جستجو و خرید محصولات فناورانه', icon: <ShoppingBag size={28} /> },
  { id: 'buyer_service', label: 'خریدار خدمت نوآورانه', description: 'جستجو و خرید خدمات تخصصی و نوآورانه', icon: <Wrench size={28} /> },
  { id: 'supplier_product', label: 'عرضه‌کننده محصول', description: 'ثبت و عرضه محصولات فناورانه', icon: <Package size={28} /> },
  { id: 'supplier_service', label: 'عرضه‌کننده خدمت', description: 'ارائه خدمات تخصصی و مشاوره‌ای', icon: <Settings size={28} /> },
  { id: 'need_registerer', label: 'ثبت‌کننده نیاز فناورانه', description: 'اعلام نیازها و چالش‌های فناورانه', icon: <Lightbulb size={28} /> },
  { id: 'investor', label: 'سرمایه‌گذار', description: 'سرمایه‌گذاری در طرح‌ها و فرصت‌های نوآورانه', icon: <TrendingUp size={28} /> },
  { id: 'consultant', label: 'مشاور / ارزیاب', description: 'ارائه خدمات مشاوره و ارزیابی تخصصی', icon: <Users size={28} /> },
  { id: 'broker', label: 'کارگزار / کارشناس رسمی', description: 'تسهیل‌گری، ارزش‌گذاری و کارگزاری', icon: <Scale size={28} /> },
  { id: 'partner', label: 'سازمان همکار', description: 'همکاری نهادی و سازمانی با پلتفرم', icon: <Building2 size={28} /> },
];

const techOptions = ['هوش مصنوعی', 'اینترنت اشیاء', 'بلاکچین', 'رباتیک', 'اتوماسیون صنعتی', 'کلان‌داده', 'بینایی ماشین', 'رایانش ابری'];
const industryOptions = ['نفت و گاز', 'پالایش و پتروشیمی', 'فولاد و معدن', 'سلامت', 'کشاورزی', 'حمل‌ونقل', 'خودروسازی', 'انرژی'];
const wizardSteps = ['انتخاب نقش', 'اطلاعات پایه', 'اطلاعات تخصصی', 'اسناد و مدارک', 'علاقه‌مندی‌ها', 'تأیید نهایی'];
const initialForm: FormDataType = {
  role: null, accountType: 'INDIVIDUAL', username: '', email: '', phone: '', password: '', password_confirm: '',
  first_name: '', last_name: '', national_id: '', organization_name: '', registration_number: '', economic_code: '',
  website: '', representative_name: '', specialization: '', activity_domain: '', experience_summary: '',
  tech_domains: [], industry_domains: [],
  documents: { id_card: null, registration_doc: null, license_doc: null, representative_letter: null },
  verificationScore: 0, verificationStatus: 'red',
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(initialForm);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updateForm = <K extends keyof FormDataType>(key: K, value: FormDataType[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => ({ ...prev, [key]: '' }));
  };

  const updateDocument = (key: keyof FormDataType['documents'], file: File | null) => {
    setForm(prev => ({ ...prev, documents: { ...prev.documents, [key]: file } }));
  };

  const toggleArrayItem = (field: 'tech_domains' | 'industry_domains', item: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(x => x !== item) : [...prev[field], item]
    }));
  };

  const validateField = (name: string, value: string): string => {
    if (!value) return '';
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'فرمت ایمیل نادرست است.';
    if (['phone', 'national_id', 'registration_number', 'economic_code'].includes(name) && !/^\d+$/.test(value)) return 'فقط اعداد مجاز است.';
    return '';
  };

  const validateStep = (): boolean => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    if (step === 0 && !form.role) newErrors.push('لطفاً نقش خود را انتخاب کنید.');

    if (step === 1) {
      if (!form.username.trim()) newErrors.push('نام کاربری الزامی است.');
      if (!form.email.trim()) newErrors.push('ایمیل الزامی است.');
      else { const e = validateField('email', form.email); if (e) newFieldErrors.email = e; }
      if (!form.phone.trim()) newErrors.push('شماره موبایل الزامی است.');
      else { const e = validateField('phone', form.phone); if (e) newFieldErrors.phone = e; }
      if (!form.password.trim()) newErrors.push('رمز عبور الزامی است.');
      if (!form.password_confirm.trim()) newErrors.push('تکرار رمز عبور الزامی است.');
      if (form.password !== form.password_confirm) newErrors.push('رمز عبور و تکرار آن یکسان نیستند.');

      if (form.accountType === 'INDIVIDUAL') {
        if (!form.first_name.trim()) newErrors.push('نام الزامی است.');
        if (!form.last_name.trim()) newErrors.push('نام خانوادگی الزامی است.');
        if (!form.national_id.trim()) newErrors.push('کد ملی الزامی است.');
        else { const e = validateField('national_id', form.national_id); if (e) newFieldErrors.national_id = e; }
      } else {
        if (!form.organization_name.trim()) newErrors.push('نام سازمان الزامی است.');
        if (!form.registration_number.trim()) newErrors.push('شماره ثبت الزامی است.');
        else { const e = validateField('registration_number', form.registration_number); if (e) newFieldErrors.registration_number = e; }
        if (!form.economic_code.trim()) newErrors.push('کد اقتصادی الزامی است.');
        else { const e = validateField('economic_code', form.economic_code); if (e) newFieldErrors.economic_code = e; }
        if (!form.representative_name.trim()) newErrors.push('نام نماینده رسمی الزامی است.');
      }
    }

    if (step === 2) {
      if (!form.specialization.trim()) newErrors.push('تخصص الزامی است.');
      if (!form.activity_domain.trim()) newErrors.push('حوزه فعالیت الزامی است.');
      if (!form.experience_summary.trim()) newErrors.push('شرح سوابق حرفه‌ای الزامی است.');
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    return newErrors.length === 0 && Object.keys(newFieldErrors).length === 0;
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
    setStep(Math.min(step + 1, 5));
  };

  const prevStep = () => {
    setErrors([]);
    setFieldErrors({});
    setStep(Math.max(step - 1, 0));
  };

  // ============================================================
  // ارسال واقعی به بک‌اند
  // ============================================================
  const handleFinalSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setSubmitMessage('');
    setErrors([]);

    try {
      const formData = new FormData();
      const roleMap: Record<string, string> = {
        'buyer_product': 'buyer', 'buyer_service': 'buyer', 'supplier_product': 'supplier',
        'supplier_service': 'supplier', 'need_registerer': 'buyer', 'investor': 'investor',
        'consultant': 'consultant', 'broker': 'broker', 'partner': 'partner',
      };
      const mappedRole = roleMap[form.role as string] || 'buyer';

      const textFields: (keyof FormDataType)[] = [
        'username', 'email', 'password', 'first_name', 'last_name', 'phone', 'national_id',
        'organization_name', 'registration_number', 'economic_code', 'website', 'representative_name',
        'specialization', 'activity_domain', 'experience_summary'
      ];
      textFields.forEach(field => { if (form[field]) formData.append(field, String(form[field])); });

      formData.append('role', mappedRole);
      formData.append('tech_domains', JSON.stringify(form.tech_domains));
      formData.append('industry_domains', JSON.stringify(form.industry_domains));

      const docKeys: (keyof FormDataType['documents'])[] = ['id_card', 'registration_doc', 'license_doc', 'representative_letter'];
      docKeys.forEach(key => { if (form.documents[key]) formData.append(key, form.documents[key]); });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(`${API_URL}/users/register/`, { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        let errorMsg = 'خطا در ثبت‌نام.';
        if (data?.username) errorMsg = 'نام کاربری قبلاً ثبت شده است.';
        else if (data?.email) errorMsg = 'ایمیل قبلاً ثبت شده است.';
        else if (data?.password) errorMsg = 'رمز عبور معتبر نیست.';
        else if (data?.detail) errorMsg = data.detail;
        throw new Error(errorMsg);
      }

      setSubmitMessage('✅ ثبت‌نام با موفقیت انجام شد. اطلاعات و مدارک شما برای بررسی کارشناس ارسال شد.');
      setTimeout(() => router.push('/login?registered=true'), 2000);
    } catch (error: any) {
      console.error('❌ خطا:', error);
      setErrors([error.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.']);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}10, #fff)` }}>
      <div className="w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/90 p-8 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm text-center">
        <img src="/logo.png" alt="بازار تحول" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">ثبت‌نام در بازار تحول</h1>
        <p className="mt-4 text-sm text-slate-500">در حال بارگذاری...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}10, #fff)` }}>
      <div className="w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm sm:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          {!logoFailed ? (
            <img src="/logo.png" alt="بازار تحول" className="h-16 w-auto mb-4 object-contain" onError={() => setLogoFailed(true)} />
          ) : (
            <span className="mb-4 text-3xl font-black text-slate-400">ب ت</span>
          )}
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">ثبت‌نام در بازار تحول</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">ایجاد حساب کاربری حرفه‌ای برای ورود به اکوسیستم فناوری، نوآوری و همکاری</p>
        </div>

        {/* Stepper */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max items-center justify-between gap-2">
            {wizardSteps.map((label, index) => {
              const isActive = step === index, isDone = step > index;
              return (
                <div key={label} className="flex items-center gap-2">
                  <button onClick={() => goToStep(index)} className="flex flex-col items-center transition-all cursor-pointer hover:scale-105" title={`رفتن به ${label}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${isActive ? 'scale-110 text-white shadow-lg' : isDone ? 'text-white' : 'bg-slate-200 text-slate-500'}`} style={{ background: (isActive || isDone) ? `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` : undefined }}>
                      {isDone ? <Check size={18} /> : index + 1}
                    </div>
                    <span className={`mt-2 text-[11px] font-medium sm:text-xs whitespace-nowrap ${isActive ? 'text-slate-900 font-extrabold' : isDone ? 'text-teal-700' : 'text-slate-400'}`}>{label}</span>
                  </button>
                  {index < wizardSteps.length - 1 && <div className={`h-0.5 w-6 sm:w-10 ${step > index ? 'bg-teal-500' : 'bg-slate-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error & Success Boxes */}
        {errors.length > 0 && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="mb-2 flex items-center gap-2 font-bold"><AlertCircle size={18} /> خطاهای فرم</div>
            <ul className="list-inside list-disc space-y-1 text-sm">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
          </div>
        )}
        {submitMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck size={18} /> عملیات موفق</div>
            <p className="text-sm">{submitMessage}</p>
          </div>
        )}

        {/* Step 0 */}
        {step === 0 && (
          <div>
            <div className="mb-6"><h2 className="text-xl font-extrabold text-slate-900">انتخاب نقش</h2><p className="mt-1 text-sm text-slate-500">مشخص کنید قصد دارید با چه نقشی در پلتفرم فعالیت کنید.</p></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roleOptions.map(role => {
                const selected = form.role === role.id;
                return (
                  <button key={role.id} onClick={() => updateForm('role', role.id)} className={`group rounded-2xl border p-5 text-right transition-all duration-300 ${selected ? 'border-transparent text-white shadow-[0_16px_40px_rgba(30,58,138,0.22)]' : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg'}`} style={selected ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}>
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'}`}>{role.icon}</div>
                    <div className="mb-1 text-base font-bold">{role.label}</div>
                    <div className={`text-sm leading-6 ${selected ? 'text-white/85' : 'text-slate-500'}`}>{role.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-xl font-extrabold text-slate-900">اطلاعات پایه</h2><p className="mt-1 text-sm text-slate-500">اطلاعات هویتی و دسترسی حساب را تکمیل کنید.</p></div>
              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button onClick={() => updateForm('accountType', 'INDIVIDUAL')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${form.accountType === 'INDIVIDUAL' ? 'text-white shadow-md' : 'text-slate-600'}`} style={form.accountType === 'INDIVIDUAL' ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}><User size={16} className="inline-block ml-1" /> شخص حقیقی</button>
                <button onClick={() => updateForm('accountType', 'LEGAL')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${form.accountType === 'LEGAL' ? 'text-white shadow-md' : 'text-slate-600'}`} style={form.accountType === 'LEGAL' ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}><Building size={16} className="inline-block ml-1" /> شخص حقوقی</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField label="نام کاربری" value={form.username} onChange={v => updateForm('username', v)} />
              <InputField label="ایمیل" type="email" value={form.email} onChange={v => updateForm('email', v)} error={fieldErrors.email} />
              <InputField label="شماره موبایل" value={form.phone} onChange={v => updateForm('phone', v)} error={fieldErrors.phone} inputMode="numeric" />
            </div>
            {form.accountType === 'INDIVIDUAL' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-700"><User size={18} /> اطلاعات شخص حقیقی</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField label="نام" value={form.first_name} onChange={v => updateForm('first_name', v)} />
                  <InputField label="نام خانوادگی" value={form.last_name} onChange={v => updateForm('last_name', v)} />
                  <InputField label="کد ملی" value={form.national_id} onChange={v => updateForm('national_id', v)} error={fieldErrors.national_id} inputMode="numeric" />
                </div>
              </div>
            )}
            {form.accountType === 'LEGAL' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-700"><Building size={18} /> اطلاعات سازمانی</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField label="نام سازمان / شرکت" value={form.organization_name} onChange={v => updateForm('organization_name', v)} />
                  <InputField label="شماره ثبت" value={form.registration_number} onChange={v => updateForm('registration_number', v)} error={fieldErrors.registration_number} inputMode="numeric" />
                  <InputField label="کد اقتصادی" value={form.economic_code} onChange={v => updateForm('economic_code', v)} error={fieldErrors.economic_code} inputMode="numeric" />
                  <InputField label="وب‌سایت" value={form.website} onChange={v => updateForm('website', v)} />
                  <InputField label="نام نماینده رسمی" value={form.representative_name} onChange={v => updateForm('representative_name', v)} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PasswordField label="رمز عبور" value={form.password} show={showPassword} toggle={() => setShowPassword(p => !p)} onChange={v => updateForm('password', v)} />
              <PasswordField label="تکرار رمز عبور" value={form.password_confirm} show={showPasswordConfirm} toggle={() => setShowPasswordConfirm(p => !p)} onChange={v => updateForm('password_confirm', v)} />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div><h2 className="text-xl font-extrabold text-slate-900">اطلاعات تخصصی</h2><p className="mt-1 text-sm text-slate-500">حوزه تخصص، فعالیت و سوابق حرفه‌ای خود را ثبت کنید.</p></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField label="تخصص" value={form.specialization} onChange={v => updateForm('specialization', v)} />
              <InputField label="حوزه فعالیت" value={form.activity_domain} onChange={v => updateForm('activity_domain', v)} />
            </div>
            <div><label className="mb-2 block text-sm font-bold text-slate-700">سوابق حرفه‌ای</label><textarea value={form.experience_summary} onChange={e => updateForm('experience_summary', e.target.value)} rows={6} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2" style={{ '--tw-ring-color': BRAND.primary } as any} /></div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><h2 className="text-xl font-extrabold text-slate-900">اسناد و مدارک</h2><p className="mt-1 text-sm text-slate-500">مدارک خود را بارگذاری کنید. وضعیت احراز هویت پس از تأیید کارشناس به‌روز می‌شود.</p></div>
              <div className="min-w-[270px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-3"><div className="h-4 w-4 rounded-full bg-red-500" /><span className="text-sm font-bold text-slate-700">وضعیت احراز هویت</span></div>
                <p className="text-sm text-slate-600">مدارک شما هنوز توسط کارشناس تأیید نشده است</p>
                <p className="mt-2 text-xs text-slate-500">امتیاز: 0 از 100</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DocumentCard title="کارت ملی" description="مدرک هویتی فرد" file={form.documents.id_card} onFileChange={f => updateDocument('id_card', f)} />
              <DocumentCard title="اسناد ثبتی" description="ویژه اشخاص حقوقی / مدارک ثبتی شرکت" file={form.documents.registration_doc} onFileChange={f => updateDocument('registration_doc', f)} />
              <DocumentCard title="مجوز یا پروانه" description="مجوزهای فعالیت یا مستندات معتبر" file={form.documents.license_doc} onFileChange={f => updateDocument('license_doc', f)} />
              <DocumentCard title="معرفی‌نامه نماینده" description="مدرک نمایندگی رسمی یا مسئولیت حقوقی" file={form.documents.representative_letter} onFileChange={f => updateDocument('representative_letter', f)} />
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">چراغ احراز هویت تا زمان تأیید توسط کارشناس قرمز باقی می‌ماند. پس از تأیید، وضعیت به سبز تغییر خواهد کرد.</div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-8">
            <div><h2 className="text-xl font-extrabold text-slate-900">حوزه‌های علاقه‌مندی</h2><p className="mt-1 text-sm text-slate-500">حوزه‌های فناوری و صنعتی مورد علاقه خود را انتخاب کنید.</p></div>
            <div><h3 className="mb-3 text-sm font-extrabold text-slate-700">حوزه‌های فناوری</h3><div className="flex flex-wrap gap-3">{techOptions.map(item => { const active = form.tech_domains.includes(item); return <button key={item} onClick={() => toggleArrayItem('tech_domains', item)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-transparent text-white shadow-md' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`} style={active ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}>{item}</button>; })}</div></div>
            <div><h3 className="mb-3 text-sm font-extrabold text-slate-700">حوزه‌های صنعتی</h3><div className="flex flex-wrap gap-3">{industryOptions.map(item => { const active = form.industry_domains.includes(item); return <button key={item} onClick={() => toggleArrayItem('industry_domains', item)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-transparent text-white shadow-md' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`} style={active ? { background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` } : {}}>{item}</button>; })}</div></div>
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-6">
            <div><h2 className="text-xl font-extrabold text-slate-900">تأیید نهایی اطلاعات</h2><p className="mt-1 text-sm text-slate-500">لطفاً اطلاعات ثبت‌شده را یک بار دیگر بررسی کنید.</p></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SummaryCard title="اطلاعات حساب"><SummaryRow label="نقش" value={getRoleLabel(form.role)} /><SummaryRow label="نوع حساب" value={form.accountType === 'INDIVIDUAL' ? 'شخص حقیقی' : 'شخص حقوقی'} /><SummaryRow label="نام کاربری" value={form.username} /><SummaryRow label="ایمیل" value={form.email} /><SummaryRow label="شماره موبایل" value={form.phone} /></SummaryCard>
              <SummaryCard title={form.accountType === 'INDIVIDUAL' ? 'اطلاعات شخص حقیقی' : 'اطلاعات سازمانی'}>
                {form.accountType === 'INDIVIDUAL' ? (
                  <><SummaryRow label="نام" value={form.first_name} /><SummaryRow label="نام خانوادگی" value={form.last_name} /><SummaryRow label="کد ملی" value={form.national_id} /></>
                ) : (
                  <><SummaryRow label="سازمان" value={form.organization_name} /><SummaryRow label="شماره ثبت" value={form.registration_number} /><SummaryRow label="کد اقتصادی" value={form.economic_code} /><SummaryRow label="نماینده رسمی" value={form.representative_name} /></>
                )}
              </SummaryCard>
              <SummaryCard title="اطلاعات تخصصی"><SummaryRow label="تخصص" value={form.specialization} /><SummaryRow label="حوزه فعالیت" value={form.activity_domain} /><SummaryRow label="سوابق" value={form.experience_summary} /></SummaryCard>
              <SummaryCard title="وضعیت احراز هویت">
                <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded-full bg-red-500" /><span className="text-sm font-medium text-slate-700">مدارک شما هنوز توسط کارشناس تأیید نشده است</span></div>
                <p className="mt-3 text-sm text-slate-500">امتیاز احراز هویت: 0 از 100</p>
                <p className="mt-2 text-sm text-slate-500">حوزه‌های فناوری: {form.tech_domains.length}</p>
                <p className="mt-1 text-sm text-slate-500">حوزه‌های صنعتی: {form.industry_domains.length}</p>
              </SummaryCard>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={prevStep} disabled={step === 0 || loading} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><ChevronRight size={18} /> مرحله قبل</button>
          <div className="flex items-center gap-2 text-xs text-slate-400"><Sparkles size={14} /> مرحله {step + 1} از {wizardSteps.length}</div>
          {step < 5 ? (
            <button onClick={nextStep} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}>مرحله بعد <ChevronLeft size={18} /></button>
          ) : (
            <button onClick={handleFinalSubmit} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}>{loading ? 'در حال ثبت‌نام...' : 'تکمیل ثبت‌نام'} <ShieldCheck size={18} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

const InputField = ({ label, value, onChange, type = 'text', error, inputMode }: any) => (
  <div><label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} inputMode={inputMode} className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-transparent focus:ring-[#1E3A8A]'}`} />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const PasswordField = ({ label, value, onChange, show, toggle }: any) => (
  <div><label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-4 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#1E3A8A]" />
      <button onClick={toggle} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  </div>
);

const DocumentCard = ({ title, description, file, onFileChange }: any) => {
  const ref = useRef<HTMLInputElement>(null);
  const isUploaded = file !== null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><FileText size={20} /></div><div><h3 className="text-sm font-extrabold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{description}</p></div></div>
        {isUploaded && <div className="rounded-full bg-green-100 p-1 text-green-600"><Check size={16} /></div>}
      </div>
      {isUploaded ? (
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-600 truncate max-w-[160px]">{file!.name}</span><button onClick={() => { onFileChange(null); if (ref.current) ref.current.value = ''; }} className="text-xs text-red-500 hover:text-red-700 font-medium">حذف</button></div>
      ) : (
        <button onClick={() => ref.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})` }}><Upload size={16} /> بارگذاری مدرک</button>
      )}
      <input type="file" ref={ref} onChange={e => onFileChange(e.target.files?.[0] || null)} className="hidden" accept="image/*,.pdf" />
    </div>
  );
};

const SummaryCard = ({ title, children }: any) => <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="mb-4 text-sm font-black text-slate-800">{title}</h3><div className="space-y-3">{children}</div></div>;
const SummaryRow = ({ label, value }: any) => <div className="flex flex-col gap-1 border-b border-slate-200 pb-2 last:border-b-0 last:pb-0"><span className="text-xs font-bold text-slate-500">{label}</span><span className="text-sm text-slate-800">{value || '-'}</span></div>;

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'buyer_product': return 'خریدار محصول فناورانه';
    case 'buyer_service': return 'خریدار خدمت نوآورانه';
    case 'supplier_product': return 'عرضه‌کننده محصول';
    case 'supplier_service': return 'عرضه‌کننده خدمت';
    case 'need_registerer': return 'ثبت‌کننده نیاز فناورانه';
    case 'investor': return 'سرمایه‌گذار';
    case 'consultant': return 'مشاور / ارزیاب';
    case 'broker': return 'کارگزار / کارشناس رسمی';
    case 'partner': return 'سازمان همکار';
    default: return '-';
  }
};