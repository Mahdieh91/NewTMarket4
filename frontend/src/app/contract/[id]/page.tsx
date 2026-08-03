// src/app/contract/[id]/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Calendar,
  DollarSign,
  Users,
  FileCheck,
  Download,
  Send,
  Printer,
  Edit3,
  X,
} from 'lucide-react';
import { mockProducts, formatPrice } from '@/app/data/products';

// مراحل قرارداد
const contractSteps = [
  { id: 1, label: 'پیش‌نویس قرارداد', status: 'done' },
  { id: 2, label: 'ارزش‌گذاری فناوری', status: 'done' },
  { id: 3, label: 'بررسی حقوقی', status: 'in-progress' },
  { id: 4, label: 'تأیید خریدار', status: 'pending' },
  { id: 5, label: 'تأیید فروشنده', status: 'pending' },
  { id: 6, label: 'امضای دیجیتال', status: 'pending' },
  { id: 7, label: 'شروع اجرا', status: 'pending' },
];

// داده‌های قرارداد برای matchId=1 (پروژه هوش مصنوعی)
const match1ContractData = {
  title: 'قرارداد توسعه سامانه هوش مصنوعی',
  parties: {
    buyer: {
      name: 'شرکت فناوران نوین (خریدار)',
      representative: 'نماینده حقوقی خریدار',
      address: 'تهران، خیابان ولیعصر',
    },
    seller: {
      name: 'تیم توسعه متا',
      representative: 'مدیرعامل / نماینده قانونی',
      address: 'اصفهان، ایران',
    },
  },
  subject: 'طراحی، پیاده‌سازی و استقرار یک سامانه هوش مصنوعی برای تحلیل داده‌های سازمانی و ارائه داشبورد مدیریتی',
  price: '۴۵۰ میلیون تومان',
  deliveryTime: '۴ ماه',
  paymentTerms: '۵۰٪ پیش‌پرداخت، ۳۰٪ پس از تحویل اولیه، ۲۰٪ پس از تأیید نهایی',
  warranty: '۶ ماه گارانتی و ۱۲ ماه پشتیبانی',
  ipClause: 'مالکیت فکری متعلق به فروشنده باقی می‌ماند، حق استفاده دائمی به خریدار اعطا می‌شود.',
  confidentiality: 'تمامی اطلاعات فنی و تجاری محرمانه تلقی شده و تا ۳ سال پس از اتمام قرارداد معتبر است.',
  disputeResolution: 'داوری در سازمان داوری اتاق بازرگانی ایران',
  createdAt: new Date().toLocaleDateString('fa-IR'),
  status: 'در حال بررسی حقوقی',
};

export default function ContractPage() {
  const params = useParams();
  const id = params?.id as string;
  const product = id === '1' ? null : mockProducts.find((p) => p.id === id);
  const [activeStep, setActiveStep] = useState(3);
  const [toast, setToast] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const showToastMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // اگر نه محصولی پیدا شد و نه id=1 بود
  if (!product && id !== '1') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="text-center">
          <p className="text-slate-500">قرارداد مورد نظر یافت نشد.</p>
          <Link href="/market" className="text-[#1E3A8A] underline mt-2 inline-block">
            بازگشت به بازار
          </Link>
        </div>
      </div>
    );
  }

  // انتخاب داده‌های قرارداد بر اساس id
  const contractData = id === '1' ? match1ContractData : {
    title: `قرارداد ${product!.title}`,
    parties: {
      buyer: {
        name: 'شرکت فناوران نوین (خریدار)',
        representative: 'نماینده حقوقی خریدار',
        address: 'تهران، خیابان ولیعصر',
      },
      seller: {
        name: product!.seller.name,
        representative: 'مدیرعامل / نماینده قانونی',
        address: `${product!.seller.location}، ایران`,
      },
    },
    subject: product!.fullDescription,
    price:
      product!.priceType === 'range' && product!.priceRange
        ? `${product!.priceRange.min.toLocaleString('fa-IR')} - ${product!.priceRange.max.toLocaleString('fa-IR')} میلیون تومان`
        : formatPrice(product!),
    deliveryTime: product!.deliveryTime,
    paymentTerms: '۵۰٪ پیش‌پرداخت، ۳۰٪ پس از تحویل اولیه، ۲۰٪ پس از تأیید نهایی',
    warranty: '۶ ماه گارانتی و ۱۲ ماه پشتیبانی',
    ipClause:
      product!.ipStatus === 'registered'
        ? 'مالکیت فکری متعلق به فروشنده باقی می‌ماند، حق استفاده دائمی به خریدار اعطا می‌شود.'
        : 'حقوق مالکیت فکری مطابق توافق طرفین تعیین می‌شود.',
    confidentiality:
      'تمامی اطلاعات فنی و تجاری محرمانه تلقی شده و تا ۳ سال پس از اتمام قرارداد معتبر است.',
    disputeResolution: 'داوری در سازمان داوری اتاق بازرگانی ایران',
    createdAt: new Date().toLocaleDateString('fa-IR'),
    status: 'در حال بررسی حقوقی',
  };

  // دانلود پیش‌نویس
  const handleDownloadDraft = () => {
    const content = `پیش‌نویس قرارداد\n\nعنوان: ${contractData.title}\n\nخریدار: ${contractData.parties.buyer.name}\nفروشنده: ${contractData.parties.seller.name}\n\nموضوع: ${contractData.subject}\n\nمبلغ: ${contractData.price}\nزمان تحویل: ${contractData.deliveryTime}\nشرایط پرداخت: ${contractData.paymentTerms}\n\nضمانت: ${contractData.warranty}\nمالکیت فکری: ${contractData.ipClause}\nمحرمانگی: ${contractData.confidentiality}\nحل اختلاف: ${contractData.disputeResolution}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `پیش‌نویس-قرارداد-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToastMessage('پیش‌نویس قرارداد با موفقیت دانلود شد.');
  };

  // ارسال برای تأیید
  const handleSendForApproval = () => {
    showToastMessage('قرارداد برای بررسی کارشناس حقوقی ارسال شد.');
  };

  // پرینت
  const handlePrint = () => {
    window.print();
  };

  // ویرایش (مودال)
  const handleEdit = () => {
    setShowEditModal(true);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa] print:bg-white"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
      dir="rtl"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      {/* مودال ویرایش */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">ویرایش قرارداد</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              امکان ویرایش مستقیم قرارداد در نسخهٔ فعلی وجود ندارد. لطفاً برای اعمال تغییرات با پشتیبانی تماس بگیرید.
            </p>
            <button
              onClick={() => setShowEditModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold hover:bg-[#1E3A8A]/90 transition"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* نوار بالا */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16 justify-between">
          <Link
            href={id === '1' ? '/negotiation?matchId=1' : `/negotiation/${id}`}
            className="flex items-center gap-2 text-slate-600 hover:text-[#1E3A8A] transition"
          >
            <ArrowRight size={20} />
            <span className="text-sm font-bold">بازگشت به مذاکره</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDraft}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition"
            >
              <Download size={14} />
              دانلود پیش‌نویس
            </button>
            <button
              onClick={handleSendForApproval}
              className="px-3 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#1E3A8A]/90 flex items-center gap-1 transition"
            >
              <Send size={14} />
              ارسال برای تأیید
            </button>
            <button
              onClick={handleEdit}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition"
            >
              <Edit3 size={14} />
              ویرایش
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition"
            >
              <Printer size={14} />
              پرینت
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* هدر قرارداد */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] p-6 text-white mb-6 print:shadow-none print:border print:border-slate-200">
          <div className="absolute inset-0 opacity-10 print:hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative flex items-center gap-4">
            <FileText size={32} />
            <div>
              <h1 className="text-2xl font-extrabold">{contractData.title}</h1>
            </div>
          </div>
        </div>

        {/* تایم‌لاین وضعیت */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-[#1E3A8A]" />
            وضعیت قرارداد
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {contractSteps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
                    step.id === activeStep
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : step.id < activeStep
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.id < activeStep ? (
                    <CheckCircle size={14} />
                  ) : step.id === activeStep ? (
                    <Clock size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  {step.label}
                </div>
                {idx < contractSteps.length - 1 && (
                  <div className="w-4 h-0.5 bg-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* جزئیات قرارداد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* مشخصات طرفین */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={18} className="text-[#1E3A8A]" />
              طرفین قرارداد
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <p className="text-sm font-bold text-blue-800">خریدار</p>
                <p className="text-xs text-blue-700 mt-1">{contractData.parties.buyer.name}</p>
                <p className="text-xs text-blue-600">
                  نماینده: {contractData.parties.buyer.representative}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50">
                <p className="text-sm font-bold text-teal-800">فروشنده</p>
                <p className="text-xs text-teal-700 mt-1">{contractData.parties.seller.name}</p>
                <p className="text-xs text-teal-600">
                  نماینده: {contractData.parties.seller.representative}
                </p>
              </div>
            </div>
          </div>

          {/* اطلاعات مالی و زمان‌بندی */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-[#14B8A6]" />
              اطلاعات مالی و زمان‌بندی
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">مبلغ قرارداد:</span>
                <span className="font-bold text-[#1E3A8A]">{contractData.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شرایط پرداخت:</span>
                <span className="text-slate-700 text-xs max-w-[200px] text-left">
                  {contractData.paymentTerms}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">زمان تحویل:</span>
                <span className="font-bold text-slate-700">{contractData.deliveryTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ضمانت:</span>
                <span className="text-slate-700">{contractData.warranty}</span>
              </div>
            </div>
          </div>

          {/* موضوع و شرح */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-2 print:shadow-none">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck size={18} className="text-[#1E3A8A]" />
              موضوع قرارداد و شرایط
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-bold text-slate-700 mb-1">موضوع:</p>
                <p className="text-slate-600">{contractData.subject}</p>
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">مالکیت فکری:</p>
                <p className="text-slate-600">{contractData.ipClause}</p>
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">محرمانگی:</p>
                <p className="text-slate-600">{contractData.confidentiality}</p>
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-1">حل اختلاف:</p>
                <p className="text-slate-600">{contractData.disputeResolution}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-xs text-slate-500">تاریخ ایجاد: {contractData.createdAt}</span>
                <Shield size={14} className="text-slate-400 mr-4" />
                <span className="text-xs text-slate-500">وضعیت: {contractData.status}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}