// src/app/market/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowRight,
  MapPin,
  Star,
  Eye,
  Clock,
  Shield,
  Wrench,
  Package,
  MessageCircle,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
} from 'lucide-react';

import {
  mockProducts,
  formatPrice,
  getTRLColor,
  getRiskColor,
  getRiskLabel,
} from '@/app/data/products';

export default function ProductDetailPage() {
  const params = useParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const product = mockProducts.find((item) => item.id === id);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /*
   * اگر آرایه images خالی باشد،
   * تصویر اصلی محصول یعنی image به عنوان تصویر گالری استفاده می‌شود.
   */
  const galleryImages =
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : [];

  const activeImage = selectedImage || galleryImages[0];

  useEffect(() => {
    if (galleryImages.length > 0) {
      setSelectedImage(galleryImages[0]);
    }
  }, [id, galleryImages.length]);

  if (!product) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50"
      >
        <div className="text-center">
          <p className="text-slate-500 text-lg font-bold">
            محصول یافت نشد
          </p>

          <Link
            href="/market"
            className="text-[#1E3A8A] underline mt-2 inline-block"
          >
            بازگشت به بازار
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{
        fontFamily:
          "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
    >
      {/* نوار بالا */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Link
            href="/market"
            className="flex items-center gap-2 text-slate-600 hover:text-[#1E3A8A] transition"
          >
            <ArrowRight size={20} />
            <span className="text-sm font-bold">بازگشت به بازار</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* هدر رنگی */}
          <div className="h-36 md:h-44 bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {product.category === 'service' ? (
                <Wrench size={38} className="text-white" />
              ) : (
                <Package size={38} className="text-white" />
              )}
            </div>
          </div>

          <div className="p-5 md:p-8">
            {/* گالری تصاویر */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon size={20} className="text-[#1E3A8A]" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  تصاویر محصول
                </h2>
              </div>

              {galleryImages.length > 0 && activeImage ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* تصویر اصلی */}
                  <div className="md:col-span-3">
                    <div className="relative w-full h-[280px] sm:h-[380px] md:h-[460px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <Image
                        src={activeImage}
                        alt={product.title}
                        fill
                        priority
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 75vw"
                      />
                    </div>
                  </div>

                  {/* تصاویر کوچک گالری */}
                  <div className="md:col-span-1">
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
                      {galleryImages.map((image, index) => {
                        const isSelected = activeImage === image;

                        return (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setSelectedImage(image)}
                            className={`relative h-24 md:h-28 rounded-xl overflow-hidden bg-slate-100 border-2 transition ${
                              isSelected
                                ? 'border-[#14B8A6] ring-2 ring-[#14B8A6]/30'
                                : 'border-slate-200 hover:border-[#14B8A6]/60'
                            }`}
                            aria-label={`نمایش تصویر ${index + 1}`}
                          >
                            <Image
                              src={image}
                              alt={`${product.title} - تصویر ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 33vw, 180px"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={42} />
                  <p className="mt-3 text-sm">
                    تصویری برای این محصول ثبت نشده است
                  </p>
                </div>
              )}
            </section>

            {/* عنوان و دکمه مذاکره */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {product.title}
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                  {product.shortDescription}
                </p>
              </div>

              <Link
                href={`/negotiation/${product.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#14B8A6] text-white rounded-xl text-sm font-bold hover:bg-[#0d9488] transition"
              >
                <MessageCircle size={16} />
                ارسال پیام / درخواست مذاکره
              </Link>
            </div>

            {/* دو ستون: توضیحات و مشخصات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* توضیحات */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold text-slate-900">
                  توضیحات کامل
                </h2>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {product.fullDescription}
                </p>
              </div>

              {/* مشخصات */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">
                    قیمت:
                  </span>

                  <span className="text-lg font-extrabold text-[#1E3A8A]">
                    {formatPrice(product)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-600">
                    فروشنده:
                  </span>

                  <span className="text-sm font-bold text-slate-800">
                    {product.seller.name}
                  </span>

                  {product.seller.verified && (
                    <Shield size={14} className="text-emerald-500" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Star
                    size={14}
                    className="text-[#D4A547] fill-[#D4A547]"
                  />

                  <span className="text-sm font-bold text-slate-600">
                    {product.seller.rating} / ۵
                  </span>

                  <span className="text-xs text-slate-400">
                    ({product.seller.totalSales} فروش)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />

                  <span className="text-sm text-slate-600">
                    {product.seller.location}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />

                  <span className="text-sm text-slate-600">
                    زمان تحویل: {product.deliveryTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-slate-400" />

                  <span className="text-sm text-slate-600">
                    {product.viewCount.toLocaleString('fa-IR')} بازدید
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />

                  <span className="text-sm text-slate-600">
                    تاریخ ثبت: {product.createdAt}
                  </span>
                </div>
              </div>
            </div>

            {/* برچسب‌ها */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getTRLColor(
                  product.trl,
                )}`}
              >
                TRL {product.trl}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                MRL {product.mrl}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(
                  product.riskLevel,
                )}`}
              >
                ریسک: {getRiskLabel(product.riskLevel)}
              </span>

              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* گواهینامه‌ها */}
            {product.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-600 mb-2">
                  گواهینامه‌ها
                </h3>

                <div className="flex flex-wrap gap-2">
                  {product.certifications.map((certification) => (
                    <span
                      key={certification}
                      className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1"
                    >
                      <CheckCircle size={12} />
                      {certification}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* وضعیت‌های اضافی */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Shield
                  size={14}
                  className={
                    product.afterSalesService
                      ? 'text-emerald-500'
                      : 'text-slate-300'
                  }
                />
                خدمات پس از فروش:{' '}
                {product.afterSalesService ? 'دارد' : 'ندارد'}
              </span>

              <span className="flex items-center gap-1">
                <Shield
                  size={14}
                  className={
                    product.ipStatus === 'registered'
                      ? 'text-emerald-500'
                      : product.ipStatus === 'pending'
                      ? 'text-amber-500'
                      : 'text-slate-300'
                  }
                />

                مالکیت فکری:{' '}
                {product.ipStatus === 'registered'
                  ? 'ثبت شده'
                  : product.ipStatus === 'pending'
                  ? 'در حال ثبت'
                  : 'ندارد'}
              </span>

              <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-emerald-500" />
                امتیاز انطباق: {product.complianceScore}٪
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}