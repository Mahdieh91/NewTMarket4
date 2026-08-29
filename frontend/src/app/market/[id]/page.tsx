// ============================================================
// FILE: C:\Users\Fardad\tmarket4\frontend\src\app\market\[id]\page.tsx
// ============================================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowRight,
  MapPin,
  Clock,
  Shield,
  Wrench,
  Package,
  MessageCircle,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  Building2,
  Boxes,
  Cpu,
  Layers,
  Tag,
  Sparkles,
} from 'lucide-react';

/* ============================================================
   API
============================================================ */

const API_BASE_URL = 'http://127.0.0.1:8000';

const SUPPLIES_API_URL =
  `${API_BASE_URL}/api/products/supplies/`;

/* ============================================================
   Types
============================================================ */

interface SupplyImage {
  id: number;
  image: string;
  caption?: string | null;
  uploaded_at?: string;
}

interface Supply {
  id: number;
  seller: number | null;
  seller_name?: string;

  title: string;
  category: string;
  industry: string;
  technology: string;
  city: string;
  description: string;

  quantity: string;
  unit: string;
  price: string | number;

  trl: string;
  documents: string[];

  status: string;

  created_at: string;
  updated_at: string;

  images: SupplyImage[];
}

/* ============================================================
   Helpers
============================================================ */

function buildMediaUrl(
  path: string | null | undefined,
): string {
  if (!path) {
    return '';
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }

  if (path.startsWith('//')) {
    return `http:${path}`;
  }

  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
}

function formatSupplyPrice(
  price: string | number | null | undefined,
): string {
  if (
    price === null ||
    price === undefined ||
    price === '' ||
    Number(price) === 0
  ) {
    return 'قابل مذاکره';
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return `${numericPrice.toLocaleString('fa-IR')} تومان`;
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('fa-IR');
}

function getStatusLabel(
  status: string,
): string {
  const labels: Record<string, string> = {
    pending: 'در انتظار بررسی',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    draft: 'پیش‌نویس',
    submitted: 'ارسال برای بررسی',
    evaluating: 'در حال ارزیابی',
    needs_revision: 'نیازمند اصلاح',
    published: 'منتشر شده',
    suspended: 'تعلیق شده',
  };

  return (
    labels[status] ||
    status ||
    'ثبت نشده'
  );
}

function getStatusClass(
  status: string,
): string {
  const classes: Record<string, string> = {
    pending:
      'bg-amber-50 text-amber-700 border border-amber-200',

    approved:
      'bg-emerald-50 text-emerald-700 border border-emerald-200',

    published:
      'bg-blue-50 text-blue-700 border border-blue-200',

    rejected:
      'bg-red-50 text-red-700 border border-red-200',

    suspended:
      'bg-slate-100 text-slate-600 border border-slate-200',

    draft:
      'bg-slate-100 text-slate-600 border border-slate-200',

    submitted:
      'bg-indigo-50 text-indigo-700 border border-indigo-200',

    evaluating:
      'bg-purple-50 text-purple-700 border border-purple-200',

    needs_revision:
      'bg-orange-50 text-orange-700 border border-orange-200',
  };

  return (
    classes[status] ||
    'bg-slate-100 text-slate-600 border border-slate-200'
  );
}

function getFileName(url: string): string {
  try {
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    const fileName =
      parts[parts.length - 1];

    return decodeURIComponent(
      fileName || 'مستند',
    );
  } catch {
    return 'مستند';
  }
}

/* ============================================================
   Reusable Components
============================================================ */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    return null;
  }

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#14B8A6]/40 hover:shadow-md">
      <div className="flex items-center gap-2 text-slate-400 mb-3">
        {icon}

        <span className="text-xs font-bold">
          {label}
        </span>
      </div>

      <p className="text-sm font-extrabold text-slate-800 leading-7">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          {icon}
        </div>

        <h2 className="text-lg font-extrabold text-slate-900">
          {title}
        </h2>
      </div>

      {count && (
        <span className="text-xs text-slate-400">
          {count}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   Component
============================================================ */

export default function ProductDetailPage() {
  const params = useParams();

  const rawId = params?.id;

  const routeId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const [supply, setSupply] =
    useState<Supply | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  /* ============================================================
     تشخیص Supply واقعی
  ============================================================ */

  const supplyId = useMemo(() => {
    if (!routeId) {
      return null;
    }

    const value = String(routeId);

    if (value.startsWith('supply-')) {
      const numericPart =
        value.replace(
          'supply-',
          '',
        );

      const parsed =
        Number(numericPart);

      return Number.isFinite(parsed)
        ? parsed
        : null;
    }

    return null;
  }, [routeId]);

  /* ============================================================
     دریافت Supply واقعی از Django
  ============================================================ */

  useEffect(() => {
    if (supplyId === null) {
      return;
    }

    let cancelled = false;

    async function loadSupply() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            SUPPLIES_API_URL,
            {
              method: 'GET',
              headers: {
                Accept:
                  'application/json',
              },
              credentials: 'include',
              cache: 'no-store',
            },
          );

        if (!response.ok) {
          if (
            response.status === 401
          ) {
            throw new Error(
              'دریافت اطلاعات عرضه از سرور نیازمند دسترسی مناسب است.',
            );
          }

          if (
            response.status === 403
          ) {
            throw new Error(
              'دسترسی به اطلاعات این عرضه از طرف سرور محدود شده است.',
            );
          }

          throw new Error(
            `خطا در دریافت عرضه‌ها. کد خطا: ${response.status}`,
          );
        }

        const data =
          await response.json();

        const supplies: Supply[] =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.results,
              )
            ? data.results
            : [];

        const foundSupply =
          supplies.find(
            (item) =>
              Number(item.id) ===
              Number(supplyId),
          );

        if (!foundSupply) {
          throw new Error(
            `عرضه شماره ${supplyId} در داده‌های دریافتی پیدا نشد.`,
          );
        }

        if (cancelled) {
          return;
        }

        setSupply(
          foundSupply,
        );

        if (
          Array.isArray(
            foundSupply.images,
          ) &&
          foundSupply.images.length >
            0
        ) {
          const firstImage =
            buildMediaUrl(
              foundSupply.images[0]
                ?.image,
            );

          setSelectedImage(
            firstImage || null,
          );
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'خطا در دریافت جزئیات Supply:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'خطا در دریافت اطلاعات عرضه.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSupply();

    return () => {
      cancelled = true;
    };
  }, [supplyId]);

  /* ============================================================
     Loading
  ============================================================ */

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa] flex items-center justify-center"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
        }}
      >
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-lg border border-slate-200 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#14B8A6] animate-spin" />
          </div>

          <p className="text-sm font-bold text-slate-600 mt-5">
            در حال دریافت اطلاعات عرضه...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     Supply Error / Not Found
  ============================================================ */

  if (!supply) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa] flex items-center justify-center p-5"
        style={{
          fontFamily:
            "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
        }}
      >
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <Package size={30} />
          </div>

          <h1 className="text-xl font-extrabold text-slate-900 mt-5">
            دریافت اطلاعات عرضه ناموفق بود
          </h1>

          <p className="text-sm text-slate-500 mt-3 leading-7">
            {error ||
              'اطلاعات عرضه موردنظر در سرور پیدا نشد.'}
          </p>

          <Link
            href="/market"
            className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#172f72] transition"
          >
            <ArrowRight size={18} />
            بازگشت به بازار
          </Link>
        </div>
      </div>
    );
  }

  /* ============================================================
     REAL SUPPLY
  ============================================================ */

  const supplyImages =
    supply?.images
      ?.map((item) =>
        buildMediaUrl(
          item.image,
        ),
      )
      .filter(Boolean) || [];

  const hasImages =
    supplyImages.length > 0;

  const activeSupplyImage =
    selectedImage ||
    supplyImages[0] ||
    '';

  const documents =
    Array.isArray(
      supply?.documents,
    )
      ? supply.documents.filter(
          (item) =>
            typeof item ===
              'string' &&
            item.trim().length > 0,
        )
      : [];

  const hasDocuments =
    documents.length > 0;

  const isService =
    supply!.category
      ?.toLowerCase()
      .includes('service') ||
    supply!.category
      ?.toLowerCase()
      .includes('خدمت');

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{
        fontFamily:
          "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
    >

      {/* ======================================================
          Header
      ====================================================== */}

      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">

          <Link
            href="/market"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#1E3A8A] hover:text-[#14B8A6] transition"
          >
            <ArrowRight
              size={18}
            />
            بازگشت به بازار
          </Link>

          {supply!.status && (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusClass(
                supply!.status,
              )}`}
            >
              {getStatusLabel(
                supply!.status,
              )}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ==================================================
            Layout
        ================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">

          {/* ==================================================
              Main Content
          ================================================== */}

          <div className="min-w-0 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">

            {/* Hero */}

            <div className="relative h-36 md:h-44 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#14B8A6] overflow-hidden">

              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                  {isService ? (
                    <Wrench
                      size={42}
                      className="text-white"
                    />
                  ) : (
                    <Package
                      size={42}
                      className="text-white"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8">

              {/* ==================================================
                  Title
              ================================================== */}

              <div className="mb-8">

                <div className="flex flex-wrap items-center gap-2 mb-4">

                  <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                    عرضه ثبت‌شده
                  </span>

                  {supply!.category && (
                    <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      {
                        supply!.category
                      }
                    </span>
                  )}

                  <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                    شناسه: {supply!.id}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                  {supply!.title}
                </h1>

                {supply!.description && (
                  <p className="text-sm text-slate-500 mt-4 leading-8 max-w-3xl">
                    {
                      supply!.description
                    }
                  </p>
                )}
              </div>

              {/* ==================================================
                  Gallery
              ================================================== */}

              {hasImages && (
                <section className="mb-10">

                  <SectionTitle
                    icon={
                      <ImageIcon
                        size={18}
                        className="text-[#1E3A8A]"
                      />
                    }
                    title="تصاویر عرضه"
                    count={`${supplyImages.length.toLocaleString(
                      'fa-IR',
                    )} تصویر`}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    <div className="md:col-span-3">
                      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <Image
                          src={
                            activeSupplyImage
                          }
                          alt={
                            supply!.title
                          }
                          fill
                          priority
                          unoptimized
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 75vw"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="grid grid-cols-3 md:grid-cols-1 gap-3">

                        {supplyImages.map(
                          (
                            image,
                            index,
                          ) => {
                            const isSelected =
                              activeSupplyImage ===
                              image;

                            const originalImage =
                              supply!
                                .images[
                                index
                              ];

                            return (
                              <button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() =>
                                  setSelectedImage(
                                    image,
                                  )
                                }
                                className={`relative h-24 md:h-28 rounded-xl overflow-hidden bg-slate-100 border-2 transition ${
                                  isSelected
                                    ? 'border-[#14B8A6] ring-2 ring-[#14B8A6]/30'
                                    : 'border-slate-200 hover:border-[#14B8A6]/60'
                                }`}
                              >
                                <Image
                                  src={
                                    image
                                  }
                                  alt={
                                    originalImage?.caption ||
                                    `${supply!.title} - تصویر ${
                                      index +
                                      1
                                    }`
                                  }
                                  fill
                                  unoptimized
                                  className="object-cover"
                                  sizes="180px"
                                />
                              </button>
                            );
                          },
                        )}

                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ==================================================
                  Basic Information
              ================================================== */}

              <section className="mb-10">

                <SectionTitle
                  icon={
                    <Boxes
                      size={18}
                      className="text-[#1E3A8A]"
                    />
                  }
                  title="اطلاعات عرضه"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <InfoItem
                    icon={
                      <Tag size={16} />
                    }
                    label="دسته‌بندی"
                    value={
                      supply!.category
                    }
                  />

                  <InfoItem
                    icon={
                      <Building2
                        size={16}
                      />
                    }
                    label="صنعت"
                    value={
                      supply!.industry
                    }
                  />

                  <InfoItem
                    icon={
                      <Cpu size={16} />
                    }
                    label="فناوری"
                    value={
                      supply!.technology
                    }
                  />

                  <InfoItem
                    icon={
                      <MapPin
                        size={16}
                      />
                    }
                    label="محل عرضه"
                    value={
                      supply!.city
                    }
                  />

                  <InfoItem
                    icon={
                      <Boxes
                        size={16}
                      />
                    }
                    label="مقدار عرضه"
                    value={
                      supply!.quantity
                        ? `${supply!.quantity}${
                            supply!.unit
                              ? ` ${supply!.unit}`
                              : ''
                          }`
                        : null
                    }
                  />

                </div>
              </section>

              {/* ==================================================
                  Description
              ================================================== */}

              {supply!.description && (
                <section className="mb-10">

                  <SectionTitle
                    icon={
                      <FileText
                        size={18}
                        className="text-[#1E3A8A]"
                      />
                    }
                    title="توضیحات کامل عرضه"
                  />

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 md:p-6">

                    <p className="text-sm text-slate-700 leading-8 whitespace-pre-line">
                      {
                        supply!.description
                      }
                    </p>

                  </div>
                </section>
              )}

              {/* ==================================================
                  Technical / Status Information
              ================================================== */}

              <section className="mb-10">

                <SectionTitle
                  icon={
                    <Layers
                      size={18}
                      className="text-[#1E3A8A]"
                    />
                  }
                  title="اطلاعات تکمیلی"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {supply!.trl && (
                    <InfoItem
                      icon={
                        <Layers
                          size={16}
                        />
                      }
                      label="سطح آمادگی فناوری"
                      value={`TRL ${supply!.trl}`}
                    />
                  )}

                  {supply!.status && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center gap-2 text-slate-400 mb-3">
                        <CheckCircle
                          size={16}
                        />

                        <span className="text-xs font-bold">
                          وضعیت عرضه
                        </span>
                      </div>

                      <span
                        className={`inline-flex px-3 py-1.5 rounded-full text-xs font-extrabold ${getStatusClass(
                          supply!.status,
                        )}`}
                      >
                        {getStatusLabel(
                          supply!.status,
                        )}
                      </span>
                    </div>
                  )}

                  {supply!.created_at && (
                    <InfoItem
                      icon={
                        <Calendar
                          size={16}
                        />
                      }
                      label="تاریخ ثبت"
                      value={formatDate(
                        supply!
                          .created_at,
                      )}
                    />
                  )}

                  {supply!.updated_at && (
                    <InfoItem
                      icon={
                        <Clock
                          size={16}
                        />
                      }
                      label="آخرین بروزرسانی"
                      value={formatDate(
                        supply!
                          .updated_at,
                      )}
                    />
                  )}

                </div>
              </section>

              {/* ==================================================
                  Seller
              ================================================== */}

              {(supply!.seller_name ||
                supply!.seller) && (
                <section className="mb-10">

                  <SectionTitle
                    icon={
                      <Shield
                        size={18}
                        className="text-[#1E3A8A]"
                      />
                    }
                    title="اطلاعات عرضه‌کننده"
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">

                    <div className="flex flex-wrap items-center justify-between gap-4">

                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          عرضه‌کننده
                        </p>

                        <p className="text-base font-extrabold text-slate-800">
                          {supply!
                            .seller_name ||
                            `کاربر شماره ${
                              supply!
                                .seller ||
                              'نامشخص'
                            }`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50">
                        <Shield
                          size={16}
                          className="text-emerald-500"
                        />

                        <span className="text-xs font-bold text-emerald-700">
                          اطلاعات ثبت‌شده در سامانه
                        </span>
                      </div>

                    </div>
                  </div>
                </section>
              )}

              {/* ==================================================
                  Documents
              ================================================== */}

              {hasDocuments && (
                <section className="mb-10">

                  <SectionTitle
                    icon={
                      <FileText
                        size={18}
                        className="text-[#1E3A8A]"
                      />
                    }
                    title="مستندات عرضه"
                    count={`${documents.length.toLocaleString(
                      'fa-IR',
                    )} فایل`}
                  />

                  <div className="space-y-3">

                    {documents.map(
                      (
                        documentUrl,
                        index,
                      ) => {
                        const url =
                          buildMediaUrl(
                            documentUrl,
                          );

                        const fileName =
                          getFileName(
                            documentUrl,
                          );

                        return (
                          <div
                            key={`${documentUrl}-${index}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-[#14B8A6]/40 transition"
                          >

                            <div className="flex items-center gap-3 min-w-0">

                              <div className="w-11 h-11 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                <FileText
                                  size={20}
                                  className="text-[#1E3A8A]"
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {
                                    fileName
                                  }
                                </p>

                                <p className="text-xs text-slate-400 mt-1">
                                  مستند عرضه شماره{' '}
                                  {(
                                    index +
                                    1
                                  ).toLocaleString(
                                    'fa-IR',
                                  )}
                                </p>
                              </div>

                            </div>

                            <div className="flex items-center gap-2">

                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:border-[#14B8A6] hover:text-[#0d9488] transition"
                              >
                                <ExternalLink
                                  size={15}
                                />
                                مشاهده
                              </a>

                              <a
                                href={url}
                                download
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172f72] transition"
                              >
                                <Download
                                  size={15}
                                />
                                دریافت
                              </a>

                            </div>
                          </div>
                        );
                      },
                    )}

                  </div>
                </section>
              )}

            </div>
          </div>

          {/* ==================================================
              STICKY SUMMARY PANEL
          ================================================== */}

          <aside className="lg:sticky lg:top-24 self-start">

            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">

              {/* Panel Header */}

              <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#14B8A6] p-6 text-white">

                <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

                <div className="relative">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-2">
                      <Sparkles
                        size={17}
                        className="text-white/80"
                      />

                      <span className="text-xs font-bold text-white/80">
                        خلاصه عرضه
                      </span>
                    </div>

                    {supply!.status && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/95 ${
                          supply!.status ===
                          'approved' ||
                          supply!.status ===
                          'published'
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {getStatusLabel(
                          supply!.status,
                        )}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-extrabold leading-8 mt-5">
                    {supply!.title}
                  </h2>

                  <p className="text-xs text-white/70 mt-2">
                    شناسه عرضه:{" "}
                    {supply!.id.toLocaleString(
                      'fa-IR',
                    )}
                  </p>

                </div>
              </div>

              {/* Summary */}

              <div className="p-5">

                <div className="space-y-3">

                  {/* City */}

                  {supply!.city && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                          <MapPin
                            size={17}
                            className="text-[#1E3A8A]"
                          />
                        </div>

                        <span className="text-xs text-slate-500">
                          محل عرضه
                        </span>
                      </div>

                      <span className="text-sm font-extrabold text-slate-800">
                        {supply!.city}
                      </span>
                    </div>
                  )}

                  {/* Quantity */}

                  {supply!.quantity && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                          <Boxes
                            size={17}
                            className="text-[#1E3A8A]"
                          />
                        </div>

                        <span className="text-xs text-slate-500">
                          مقدار
                        </span>
                      </div>

                      <span className="text-sm font-extrabold text-slate-800">
                        {
                          supply!.quantity
                        }{' '}
                        {
                          supply!.unit
                        }
                      </span>
                    </div>
                  )}

                  {/* TRL */}

                  {supply!.trl && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                          <Layers
                            size={17}
                            className="text-[#1E3A8A]"
                          />
                        </div>

                        <span className="text-xs text-slate-500">
                          آمادگی فناوری
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-extrabold">
                        TRL{' '}
                        {
                          supply!.trl
                        }
                      </span>
                    </div>
                  )}

                  {/* Price */}

                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 p-5 mt-4">

                    <div className="flex items-center gap-2">
                      <Tag
                        size={17}
                        className="text-[#1E3A8A]"
                      />

                      <span className="text-xs font-bold text-blue-600">
                        قیمت
                      </span>
                    </div>

                    <p className="text-xl font-black text-[#1E3A8A] mt-2">
                      {formatSupplyPrice(
                        supply!.price,
                      )}
                    </p>

                  </div>

                </div>

                {/* CTA */}

                <div className="mt-5 pt-5 border-t border-slate-100">

                  <Link
                    href={`/negotiation/supply-${supply!.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-[#14B8A6] text-white rounded-2xl text-sm font-extrabold hover:bg-[#0d9488] transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/25 hover:-translate-y-0.5"
                  >
                    <MessageCircle
                      size={19}
                    />

                    درخواست مذاکره
                  </Link>

                  <p className="text-[11px] text-slate-400 text-center mt-3 leading-6">
                    برای دریافت اطلاعات بیشتر یا
                    شروع گفت‌وگو با عرضه‌کننده
                    درخواست مذاکره ارسال کنید.
                  </p>

                </div>

              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}