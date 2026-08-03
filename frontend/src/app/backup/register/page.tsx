'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Wrench,
  Package,
  Settings,
  Lightbulb,
  TrendingUp,
  Users,
  Scale,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  FileText,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Clock,
  User,
  Building,
} from 'lucide-react';

type UserRole =
  | 'buyer_product'
  | 'buyer_service'
  | 'supplier_product'
  | 'supplier_service'
  | 'need_registerer'
  | 'investor'
  | 'consultant'
  | 'broker'
  | 'partner'
  | null;

type AccountType = 'INDIVIDUAL' | 'LEGAL';
type VerificationStatus = 'red' | 'yellow' | 'green';

type DocumentItem = {
  file: File | null;
  approved: boolean;
};

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
    id_card: DocumentItem;
    registration_doc: DocumentItem;
    license_doc: DocumentItem;
    representative_letter: DocumentItem;
  };

  verificationScore: number;
  verificationStatus: VerificationStatus;
};

const BRAND = {
  primary: '#1E3A8A',
  secondary: '#14B8A6',
};

const roleOptions: {
  id: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'buyer_product',
    label: 'خریدار محصول فناورانه',
    description: 'جستجو و خرید محصولات فناورانه',
    icon: <ShoppingBag size={28} />,
  },
  {
    id: 'buyer_service',
    label: 'خریدار خدمت نوآورانه',
    description: 'جستجو و خرید خدمات تخصصی و نوآورانه',
    icon: <Wrench size={28} />,
  },
  {
    id: 'supplier_product',
    label: 'عرضه‌کننده محصول',
    description: 'ثبت و عرضه محصولات فناورانه',
    icon: <Package size={28} />,
  },
  {
    id: 'supplier_service',
    label: 'عرضه‌کننده خدمت',
    description: 'ارائه خدمات تخصصی و مشاوره‌ای',
    icon: <Settings size={28} />,
  },
  {
    id: 'need_registerer',
    label: 'ثبت‌کننده نیاز فناورانه',
    description: 'اعلام نیازها و چالش‌های فناورانه',
    icon: <Lightbulb size={28} />,
  },
  {
    id: 'investor',
    label: 'سرمایه‌گذار',
    description: 'سرمایه‌گذاری در طرح‌ها و فرصت‌های نوآورانه',
    icon: <TrendingUp size={28} />,
  },
  {
    id: 'consultant',
    label: 'مشاور / ارزیاب',
    description: 'ارائه خدمات مشاوره و ارزیابی تخصصی',
    icon: <Users size={28} />,
  },
  {
    id: 'broker',
    label: 'کارگزار / کارشناس رسمی',
    description: 'تسهیل‌گری، ارزش‌گذاری و کارگزاری',
    icon: <Scale size={28} />,
  },
  {
    id: 'partner',
    label: 'سازمان همکار',
    description: 'همکاری نهادی و سازمانی با پلتفرم',
    icon: <Building2 size={28} />,
  },
];

const techOptions = [
  'هوش مصنوعی',
  'اینترنت اشیاء',
  'بلاکچین',
  'رباتیک',
  'اتوماسیون صنعتی',
  'کلان‌داده',
  'بینایی ماشین',
  'رایانش ابری',
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
];

const initialDocument = (): DocumentItem => ({
  file: null,
  approved: false,
});

const initialForm: FormDataType = {
  role: null,
  accountType: 'INDIVIDUAL',

  username: '',
  email: '',
  phone: '',
  password: '',
  password_confirm: '',

  first_name: '',
  last_name: '',
  national_id: '',

  organization_name: '',
  registration_number: '',
  economic_code: '',
  website: '',
  representative_name: '',

  specialization: '',
  activity_domain: '',
  experience_summary: '',

  tech_domains: [],
  industry_domains: [],

  documents: {
    id_card: initialDocument(),
    registration_doc: initialDocument(),
    license_doc: initialDocument(),
    representative_letter: initialDocument(),
  },

  verificationScore: 0,
  verificationStatus: 'red',
};

export default function RegisterPage() {
  const [step, setStep] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormDataType>(initialForm);

  const wizardSteps = [
    'انتخاب نقش',
    'اطلاعات پایه',
    'اطلاعات تخصصی',
    'اسناد و مدارک',
    'علاقه‌مندی‌ها',
    'تأیید نهایی',
  ];

  const calculateVerification = (docs: FormDataType['documents']) => {
    const docKeys = Object.keys(docs) as (keyof FormDataType['documents'])[];
    const approvedCount = docKeys.filter((key) => docs[key].approved).length;
    const total = docKeys.length;
    const score = Math.round((approvedCount / total) * 100);

    let status: VerificationStatus = 'red';
    if (approvedCount === 0) status = 'red';
    else if (approvedCount < total) status = 'yellow';
    else status = 'green';

    return { score, status };
  };

  const currentVerification = useMemo(() => {
    return calculateVerification(form.documents);
  }, [form.documents]);

  const updateForm = <K extends keyof FormDataType>(key: K, value: FormDataType[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user types
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const updateDocumentFile = (key: keyof FormDataType['documents'], file: File | null) => {
    setForm((prev) => {
      const updatedDocuments = {
        ...prev.documents,
        [key]: { ...prev.documents[key], file },
      };
      const verification = calculateVerification(updatedDocuments);
      return {
        ...prev,
        documents: updatedDocuments,
        verificationScore: verification.score,
        verificationStatus: verification.status,
      };
    });
  };

  const toggleDocumentApproval = (key: keyof FormDataType['documents']) => {
    setForm((prev) => {
      const updatedDocuments = {
        ...prev.documents,
        [key]: { ...prev.documents[key], approved: !prev.documents[key].approved },
      };
      const verification = calculateVerification(updatedDocuments);
      return {
        ...prev,
        documents: updatedDocuments,
        verificationScore: verification.score,
        verificationStatus: verification.status,
      };
    });
  };

  const toggleArrayItem = (
    field: 'tech_domains' | 'industry_domains',
    item: string
  ) => {
    setForm((prev) => {
      const exists = prev[field].includes(item);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((x) => x !== item)
          : [...prev[field], item],
      };
    });
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'فرمت ایمیل نادرست است.';
        return '';
      case 'phone':
        if (value && !/^\d+$/.test(value))
          return 'شماره موبایل باید فقط شامل اعداد باشد.';
        return '';
      case 'national_id':
        if (value && !/^\d+$/.test(value))
          return 'کد ملی باید فقط شامل اعداد باشد.';
        return '';
      default:
        return '';
    }
  };

  const validateStep = () => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    if (step === 0) {
      if (!form.role) newErrors.push('لطفاً نقش خود را انتخاب کنید.');
    }

    if (step === 1) {
      if (!form.username.trim()) newErrors.push('نام کاربری الزامی است.');

      if (!form.email.trim()) newErrors.push('ایمیل الزامی است.');
      else {
        const emailErr = validateField('email', form.email);
        if (emailErr) newFieldErrors.email = emailErr;
      }

      if (!form.phone.trim()) newErrors.push('شماره موبایل الزامی است.');
      else {
        const phoneErr = validateField('phone', form.phone);
        if (phoneErr) newFieldErrors.phone = phoneErr;
      }

      if (!form.password.trim()) newErrors.push('رمز عبور الزامی است.');
      if (!form.password_confirm.trim()) newErrors.push('تکرار رمز عبور الزامی است.');
      if (form.password !== form.password_confirm) {
        newErrors.push('رمز عبور و تکرار آن یکسان نیستند.');
      }

      if (form.accountType === 'INDIVIDUAL') {
        if (!form.first_name.trim()) newErrors.push('نام الزامی است.');
        if (!form.last_name.trim()) newErrors.push('نام خانوادگی الزامی است.');
        if (!form.national_id.trim()) newErrors.push('کد ملی الزامی است.');
        else {
          const idErr = validateField('national_id', form.national_id);
          if (idErr) newFieldErrors.national_id = idErr;
        }
      }

      if (form.accountType === 'LEGAL') {
        if (!form.organization_name.trim()) newErrors.push('نام سازمان الزامی است.');
        if (!form.registration_number.trim()) newErrors.push('شماره ثبت الزامی است.');
        if (!form.economic_code.trim()) newErrors.push('کد اقتصادی الزامی است.');
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

  const nextStep = () => {
    if (!validateStep()) return;
    setErrors([]);
    setFieldErrors({});
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErrors([]);
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinalSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setSubmitMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const finalVerification = calculateVerification(form.documents);

      setForm((prev) => ({
        ...prev,
        verificationScore: finalVerification.score,
        verificationStatus: finalVerification.status,
      }));

      setSubmitMessage(
        'ثبت‌نام با موفقیت انجام شد. اطلاعات و مدارک شما برای بررسی کارشناس ارسال شد.'
      );
    } catch {
      setErrors(['خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.']);
    } finally {
      setLoading(false);
    }
  };

  const verificationLabel =
    currentVerification.status === 'green'
      ? 'احراز هویت کامل (تأیید شده)'
      : currentVerification.status === 'yellow'
      ? 'بخشی از مدارک تأیید شده'
      : 'هیچ مدرکی تأیید نشده است';

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(30,58,138,0.08),rgba(20,184,166,0.08),rgba(255,255,255,1))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_70px_rgba(30,58,138,0.12)] backdrop-blur-sm sm:p-8">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
              }}
            >
              <Image
                src="/logo.png"
                alt="متا پلتفرم"
                width={54}
                height={54}
                className="object-contain brightness-0 invert"
              />
            </div>

            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              ثبت‌نام در بازار تحول
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-500 sm:text-base">
              ایجاد حساب کاربری حرفه‌ای برای ورود به اکوسیستم فناوری، نوآوری و همکاری
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex min-w-max items-center justify-between gap-2">
              {wizardSteps.map((label, index) => {
                const isActive = step === index;
                const isDone = step > index;

                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          isActive
                            ? 'scale-105 text-white shadow-lg'
                            : isDone
                            ? 'text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                        style={{
                          background:
                            isActive || isDone
                              ? `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`
                              : undefined,
                        }}
                      >
                        {isDone ? <Check size={18} /> : index + 1}
                      </div>
                      <span
                        className={`mt-2 text-[11px] font-medium sm:text-xs ${
                          isActive
                            ? 'text-slate-900'
                            : isDone
                            ? 'text-teal-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {index < wizardSteps.length - 1 && (
                      <div
                        className={`h-0.5 w-8 sm:w-12 ${
                          step > index ? 'bg-teal-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Box */}
          {errors.length > 0 && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <AlertCircle size={18} />
                خطاهای فرم
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Box */}
          {submitMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <div className="mb-1 flex items-center gap-2 font-bold">
                <ShieldCheck size={18} />
                عملیات موفق
              </div>
              <p className="text-sm">{submitMessage}</p>
            </div>
          )}

          {/* Step 0 - Role */}
          {step === 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-900">انتخاب نقش</h2>
                <p className="mt-1 text-sm text-slate-500">
                  مشخص کنید قصد دارید با چه نقشی در پلتفرم فعالیت کنید.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {roleOptions.map((role) => {
                  const selected = form.role === role.id;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => updateForm('role', role.id)}
                      className={`group rounded-2xl border p-5 text-right transition-all duration-300 ${
                        selected
                          ? 'border-transparent bg-slate-900 text-white shadow-[0_16px_40px_rgba(30,58,138,0.22)]'
                          : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg'
                      }`}
                      style={
                        selected
                          ? {
                              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                            }
                          : {}
                      }
                    >
                      <div
                        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                          selected
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {role.icon}
                      </div>
                      <div className="mb-1 text-base font-bold">{role.label}</div>
                      <div
                        className={`text-sm leading-6 ${
                          selected ? 'text-white/85' : 'text-slate-500'
                        }`}
                      >
                        {role.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1 - Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">اطلاعات پایه</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    اطلاعات هویتی و دسترسی حساب را تکمیل کنید.
                  </p>
                </div>

                <div className="flex rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => updateForm('accountType', 'INDIVIDUAL')}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      form.accountType === 'INDIVIDUAL'
                        ? 'text-white shadow-md'
                        : 'text-slate-600'
                    }`}
                    style={
                      form.accountType === 'INDIVIDUAL'
                        ? {
                            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                          }
                        : {}
                    }
                  >
                    <User size={16} className="inline-block ml-1" />
                    شخص حقیقی
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm('accountType', 'LEGAL')}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      form.accountType === 'LEGAL'
                        ? 'text-white shadow-md'
                        : 'text-slate-600'
                    }`}
                    style={
                      form.accountType === 'LEGAL'
                        ? {
                            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                          }
                        : {}
                    }
                  >
                    <Building size={16} className="inline-block ml-1" />
                    شخص حقوقی
                  </button>
                </div>
              </div>

              {/* فیلدهای مشترک */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="نام کاربری"
                  value={form.username}
                  onChange={(v) => updateForm('username', v)}
                />
                <InputField
                  label="ایمیل"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateForm('email', v)}
                  error={fieldErrors.email}
                />
                <InputField
                  label="شماره موبایل"
                  value={form.phone}
                  onChange={(v) => updateForm('phone', v)}
                  error={fieldErrors.phone}
                  inputMode="numeric"
                />
              </div>

              {/* کارت اطلاعات شخص حقیقی */}
              {form.accountType === 'INDIVIDUAL' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-700">
                    <User size={18} />
                    اطلاعات شخص حقیقی
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="نام"
                      value={form.first_name}
                      onChange={(v) => updateForm('first_name', v)}
                    />
                    <InputField
                      label="نام خانوادگی"
                      value={form.last_name}
                      onChange={(v) => updateForm('last_name', v)}
                    />
                    <InputField
                      label="کد ملی"
                      value={form.national_id}
                      onChange={(v) => updateForm('national_id', v)}
                      error={fieldErrors.national_id}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              )}

              {/* کارت اطلاعات شخص حقوقی */}
              {form.accountType === 'LEGAL' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-700">
                    <Building size={18} />
                    اطلاعات سازمانی
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="نام سازمان / شرکت"
                      value={form.organization_name}
                      onChange={(v) => updateForm('organization_name', v)}
                    />
                    <InputField
                      label="شماره ثبت"
                      value={form.registration_number}
                      onChange={(v) => updateForm('registration_number', v)}
                    />
                    <InputField
                      label="کد اقتصادی"
                      value={form.economic_code}
                      onChange={(v) => updateForm('economic_code', v)}
                    />
                    <InputField
                      label="وب‌سایت"
                      value={form.website}
                      onChange={(v) => updateForm('website', v)}
                    />
                    <InputField
                      label="نام نماینده رسمی"
                      value={form.representative_name}
                      onChange={(v) => updateForm('representative_name', v)}
                    />
                  </div>
                </div>
              )}

              {/* رمز عبور */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PasswordField
                  label="رمز عبور"
                  value={form.password}
                  show={showPassword}
                  toggle={() => setShowPassword((prev) => !prev)}
                  onChange={(v) => updateForm('password', v)}
                />
                <PasswordField
                  label="تکرار رمز عبور"
                  value={form.password_confirm}
                  show={showPasswordConfirm}
                  toggle={() => setShowPasswordConfirm((prev) => !prev)}
                  onChange={(v) => updateForm('password_confirm', v)}
                />
              </div>
            </div>
          )}

          {/* Step 2 - Professional */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">اطلاعات تخصصی</h2>
                <p className="mt-1 text-sm text-slate-500">
                  حوزه تخصص، فعالیت و سوابق حرفه‌ای خود را ثبت کنید.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  label="تخصص"
                  value={form.specialization}
                  onChange={(v) => updateForm('specialization', v)}
                />
                <InputField
                  label="حوزه فعالیت"
                  value={form.activity_domain}
                  onChange={(v) => updateForm('activity_domain', v)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  سوابق حرفه‌ای
                </label>
                <textarea
                  value={form.experience_summary}
                  onChange={(e) => updateForm('experience_summary', e.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: BRAND.primary }}
                />
              </div>
            </div>
          )}

          {/* Step 3 - Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">اسناد و مدارک</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    وضعیت مدارک شما به شکل چراغ در پروفایل نمایش داده می‌شود.
                  </p>
                </div>

                <div className="min-w-[270px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`h-4 w-4 rounded-full ${
                          currentVerification.status === 'green'
                            ? 'bg-green-500'
                            : currentVerification.status === 'yellow'
                            ? 'bg-yellow-400'
                            : 'bg-red-500'
                        }`}
                      />
                      {currentVerification.status === 'yellow' && (
                        <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-yellow-400 opacity-60" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      وضعیت احراز هویت
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{verificationLabel}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    امتیاز: {currentVerification.score} از 100
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DocumentCard
                  title="کارت ملی"
                  description="مدرک هویتی فرد"
                  doc={form.documents.id_card}
                  onFileChange={(file) => updateDocumentFile('id_card', file)}
                  onToggleApproval={() => toggleDocumentApproval('id_card')}
                />

                <DocumentCard
                  title="اسناد ثبتی"
                  description="ویژه اشخاص حقوقی / مدارک ثبتی شرکت"
                  doc={form.documents.registration_doc}
                  onFileChange={(file) => updateDocumentFile('registration_doc', file)}
                  onToggleApproval={() => toggleDocumentApproval('registration_doc')}
                />

                <DocumentCard
                  title="مجوز یا پروانه"
                  description="مجوزهای فعالیت یا مستندات معتبر"
                  doc={form.documents.license_doc}
                  onFileChange={(file) => updateDocumentFile('license_doc', file)}
                  onToggleApproval={() => toggleDocumentApproval('license_doc')}
                />

                <DocumentCard
                  title="معرفی‌نامه نماینده"
                  description="مدرک نمایندگی رسمی یا مسئولیت حقوقی"
                  doc={form.documents.representative_letter}
                  onFileChange={(file) => updateDocumentFile('representative_letter', file)}
                  onToggleApproval={() => toggleDocumentApproval('representative_letter')}
                />
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <strong>نکته مهم:</strong> تا زمانی که کارشناس مدارک شما را تأیید نکند، چراغ
                احراز هویت قرمز باقی می‌ماند. پس از تأیید هر مدرک، وضعیت به زرد و در نهایت
                سبز تغییر می‌کند. دکمه «شبیه‌سازی تأیید» فقط برای تست این بخش است.
              </div>
            </div>
          )}

          {/* Step 4 - Interests */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">حوزه‌های علاقه‌مندی</h2>
                <p className="mt-1 text-sm text-slate-500">
                  حوزه‌های فناوری و صنعتی مورد علاقه خود را انتخاب کنید.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-extrabold text-slate-700">حوزه‌های فناوری</h3>
                <div className="flex flex-wrap gap-3">
                  {techOptions.map((item) => {
                    const active = form.tech_domains.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('tech_domains', item)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? 'border-transparent text-white shadow-md'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                        }`}
                        style={
                          active
                            ? {
                                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                              }
                            : {}
                        }
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-extrabold text-slate-700">حوزه‌های صنعتی</h3>
                <div className="flex flex-wrap gap-3">
                  {industryOptions.map((item) => {
                    const active = form.industry_domains.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('industry_domains', item)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? 'border-transparent text-white shadow-md'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                        }`}
                        style={
                          active
                            ? {
                                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                              }
                            : {}
                        }
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 5 - Confirmation */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">تأیید نهایی اطلاعات</h2>
                <p className="mt-1 text-sm text-slate-500">
                  لطفاً اطلاعات ثبت‌شده را یک بار دیگر بررسی کنید.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SummaryCard title="اطلاعات حساب">
                  <SummaryRow label="نقش" value={getRoleLabel(form.role)} />
                  <SummaryRow
                    label="نوع حساب"
                    value={form.accountType === 'INDIVIDUAL' ? 'شخص حقیقی' : 'شخص حقوقی'}
                  />
                  <SummaryRow label="نام کاربری" value={form.username} />
                  <SummaryRow label="ایمیل" value={form.email} />
                  <SummaryRow label="شماره موبایل" value={form.phone} />
                </SummaryCard>

                <SummaryCard
                  title={
                    form.accountType === 'INDIVIDUAL'
                      ? 'اطلاعات شخص حقیقی'
                      : 'اطلاعات سازمانی'
                  }
                >
                  {form.accountType === 'INDIVIDUAL' ? (
                    <>
                      <SummaryRow label="نام" value={form.first_name} />
                      <SummaryRow label="نام خانوادگی" value={form.last_name} />
                      <SummaryRow label="کد ملی" value={form.national_id} />
                    </>
                  ) : (
                    <>
                      <SummaryRow label="سازمان" value={form.organization_name} />
                      <SummaryRow label="شماره ثبت" value={form.registration_number} />
                      <SummaryRow label="کد اقتصادی" value={form.economic_code} />
                      <SummaryRow label="نماینده رسمی" value={form.representative_name} />
                    </>
                  )}
                </SummaryCard>

                <SummaryCard title="اطلاعات تخصصی">
                  <SummaryRow label="تخصص" value={form.specialization} />
                  <SummaryRow label="حوزه فعالیت" value={form.activity_domain} />
                  <SummaryRow label="سوابق" value={form.experience_summary} />
                </SummaryCard>

                <SummaryCard title="وضعیت احراز هویت">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3.5 w-3.5 rounded-full ${
                        currentVerification.status === 'green'
                          ? 'bg-green-500'
                          : currentVerification.status === 'yellow'
                          ? 'bg-yellow-400'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {verificationLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    امتیاز احراز هویت: {currentVerification.score} از 100
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    تعداد حوزه‌های فناوری انتخاب‌شده: {form.tech_domains.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    تعداد حوزه‌های صنعتی انتخاب‌شده: {form.industry_domains.length}
                  </p>
                </SummaryCard>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0 || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight size={18} />
              مرحله قبل
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles size={14} />
              <span>
                مرحله {step + 1} از {wizardSteps.length}
              </span>
            </div>

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                }}
              >
                مرحله بعد
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
                }}
              >
                {loading ? 'در حال ثبت‌نام...' : 'تکمیل ثبت‌نام'}
                <ShieldCheck size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Components ----------

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  inputMode?: 'numeric' | 'text';
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-slate-200 focus:border-transparent focus:ring-[#1E3A8A]'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-4 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#1E3A8A]"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function DocumentCard({
  title,
  description,
  doc,
  onFileChange,
  onToggleApproval,
}: {
  title: string;
  description: string;
  doc: DocumentItem;
  onFileChange: (file: File | null) => void;
  onToggleApproval: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleRemove = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isUploaded = doc.file !== null;
  const isApproved = doc.approved;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
            <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        {isUploaded && (
          <div className="flex items-center gap-1">
            {isApproved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                <Check size={12} /> تأیید شده
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                <Clock size={12} /> در انتظار تأیید
              </span>
            )}
          </div>
        )}
      </div>

      {isUploaded ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <span className="text-xs text-slate-600 truncate max-w-[160px]">{doc.file!.name}</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              حذف
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleApproval}
            className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              isApproved
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            {isApproved ? 'لغو تأیید (شبیه‌سازی)' : 'شبیه‌سازی تأیید کارشناس'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
          }}
        >
          <Upload size={16} />
          بارگذاری مدرک
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

function getRoleLabel(role: UserRole) {
  switch (role) {
    case 'buyer_product':
      return 'خریدار محصول فناورانه';
    case 'buyer_service':
      return 'خریدار خدمت نوآورانه';
    case 'supplier_product':
      return 'عرضه‌کننده محصول';
    case 'supplier_service':
      return 'عرضه‌کننده خدمت';
    case 'need_registerer':
      return 'ثبت‌کننده نیاز فناورانه';
    case 'investor':
      return 'سرمایه‌گذار';
    case 'consultant':
      return 'مشاور / ارزیاب';
    case 'broker':
      return 'کارگزار / کارشناس رسمی';
    case 'partner':
      return 'سازمان همکار';
    default:
      return '-';
  }
}