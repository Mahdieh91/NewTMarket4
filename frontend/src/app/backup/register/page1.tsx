'use client';

import { useMemo, useState } from 'react';
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
    id_card: boolean;
    registration_doc: boolean;
    license_doc: boolean;
    representative_letter: boolean;
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
    id_card: false,
    registration_doc: false,
    license_doc: false,
    representative_letter: false,
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
    const values = Object.values(docs);
    const submittedCount = values.filter(Boolean).length;
    const total = values.length;
    const score = Math.round((submittedCount / total) * 100);

    let status: VerificationStatus = 'red';
    if (submittedCount === 0) status = 'red';
    else if (submittedCount < total) status = 'yellow';
    else status = 'green';

    return { score, status };
  };

  const currentVerification = useMemo(() => {
    return calculateVerification(form.documents);
  }, [form.documents]);

  const updateForm = <K extends keyof FormDataType>(key: K, value: FormDataType[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDocument = (key: keyof FormDataType['documents'], value: boolean) => {
    setForm((prev) => {
      const updatedDocuments = {
        ...prev.documents,
        [key]: value,
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

  const validateStep = () => {
    const newErrors: string[] = [];

    if (step === 0) {
      if (!form.role) newErrors.push('لطفاً نقش خود را انتخاب کنید.');
    }

    if (step === 1) {
      if (!form.username.trim()) newErrors.push('نام کاربری الزامی است.');
      if (!form.email.trim()) newErrors.push('ایمیل الزامی است.');
      if (!form.phone.trim()) newErrors.push('شماره موبایل الزامی است.');
      if (!form.password.trim()) newErrors.push('رمز عبور الزامی است.');
      if (!form.password_confirm.trim()) newErrors.push('تکرار رمز عبور الزامی است.');
      if (form.password !== form.password_confirm) {
        newErrors.push('رمز عبور و تکرار آن یکسان نیستند.');
      }

      if (form.accountType === 'INDIVIDUAL') {
        if (!form.first_name.trim()) newErrors.push('نام الزامی است.');
        if (!form.last_name.trim()) newErrors.push('نام خانوادگی الزامی است.');
        if (!form.national_id.trim()) newErrors.push('کد ملی الزامی است.');
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

    if (step === 3) {
      const docCount = Object.values(form.documents).filter(Boolean).length;
      if (docCount === 0) {
        newErrors.push('حداقل یک مدرک باید بارگذاری شود.');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setErrors([]);
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErrors([]);
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
      ? 'احراز هویت کامل'
      : currentVerification.status === 'yellow'
      ? 'احراز هویت ناقص / در انتظار بررسی'
      : 'هیچ مدرک هویتی ارسال نشده';

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgba(30,58,138,0.08),rgba(20,184,166,0.08),rgba(255,255,255,1))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        {/* Right/Form Section */}
        <div className="flex w-full items-center justify-center p-4 sm:p-6 lg:w-[56%] lg:p-10">
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
                      شخص حقوقی
                    </button>
                  </div>
                </div>

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
                  />
                  <InputField
                    label="شماره موبایل"
                    value={form.phone}
                    onChange={(v) => updateForm('phone', v)}
                  />

                  {form.accountType === 'INDIVIDUAL' ? (
                    <>
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
                      />
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

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
                    checked={form.documents.id_card}
                    onToggle={() => updateDocument('id_card', !form.documents.id_card)}
                  />

                  <DocumentCard
                    title="اسناد ثبتی"
                    description="ویژه اشخاص حقوقی / مدارک ثبتی شرکت"
                    checked={form.documents.registration_doc}
                    onToggle={() =>
                      updateDocument('registration_doc', !form.documents.registration_doc)
                    }
                  />

                  <DocumentCard
                    title="مجوز یا پروانه"
                    description="مجوزهای فعالیت یا مستندات معتبر"
                    checked={form.documents.license_doc}
                    onToggle={() =>
                      updateDocument('license_doc', !form.documents.license_doc)
                    }
                  />

                  <DocumentCard
                    title="معرفی‌نامه نماینده"
                    description="مدرک نمایندگی رسمی یا مسئولیت حقوقی"
                    checked={form.documents.representative_letter}
                    onToggle={() =>
                      updateDocument(
                        'representative_letter',
                        !form.documents.representative_letter
                      )
                    }
                  />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  پس از ارسال مدارک، کارشناس مربوطه آن‌ها را بررسی می‌کند. چراغ زرد یعنی بخشی
                  از مدارک ارسال شده یا در انتظار تأیید است، و چراغ سبز یعنی مدارک کامل
                  ارسال و تأیید شده‌اند.
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

                  <SummaryCard title="اطلاعات هویتی">
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

        {/* Left Banner */}
        <div
          className="relative hidden lg:flex lg:w-[44%] lg:flex-col lg:items-center lg:justify-center lg:overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${BRAND.primary}, ${BRAND.secondary})`,
          }}
        >
          <div className="absolute right-[-70px] top-[-70px] h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute bottom-[-80px] left-[-80px] h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />

          <div className="relative z-10 max-w-xl px-10 text-center text-white">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-[30px] bg-white/10 backdrop-blur-sm">
              <Image
                src="/logo.png"
                alt="متا پلتفرم"
                width={90}
                height={90}
                className="object-contain brightness-0 invert"
              />
            </div>

            <h2 className="text-3xl font-black leading-relaxed">
              پلتفرم هوشمند مدیریت تعاملات فناورانه
            </h2>
            <p className="mt-4 text-base leading-8 text-white/85">
              از ثبت نیاز و عرضه فناوری تا احراز هویت حرفه‌ای، ارزیابی تخصصی و ایجاد ارتباط
              مؤثر میان بازیگران زیست‌بوم نوآوری
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 text-right">
              <FeatureItem text="ثبت‌نام چندمرحله‌ای و حرفه‌ای" />
              <FeatureItem text="پشتیبانی از اشخاص حقیقی و حقوقی" />
              <FeatureItem text="چراغ وضعیت احراز هویت در پروفایل" />
              <FeatureItem text="طراحی مدرن، واکنش‌گرا و سازمانی" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#1E3A8A]"
      />
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
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
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

        {checked && (
          <div className="rounded-full bg-green-100 p-1 text-green-600">
            <Check size={16} />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
          checked
            ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            : 'text-white shadow-md'
        }`}
        style={
          checked
            ? {}
            : {
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
              }
        }
      >
        <Upload size={16} />
        {checked ? 'ارسال شده' : 'بارگذاری مدرک'}
      </button>
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

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
        <Check size={18} />
      </div>
      <span className="text-sm font-medium text-white">{text}</span>
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