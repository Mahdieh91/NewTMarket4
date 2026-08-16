'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  Clock,
  Package,
  Wrench,
  MessageCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Eye,
  Heart,
} from 'lucide-react';
import { useAuthStore, API_URL } from '@/store/auth-store';

// ============================================================
// Helpers
// ============================================================

const API_BASE = (API_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatPrice(price?: number): string {
  if (!price) return '—';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

function formatPersianDate(value?: string) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

// ============================================================
// Types
// ============================================================

interface ProductDetail {
  id: number;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  industry?: string;
  technology?: string;
  city?: string;
  seller: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    company_name?: string;
    location?: string;
    rating?: number;
  };
  images?: Array<{ id: number; image: string; caption?: string }>;
  trl?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  quantity?: string;
  unit?: string;
}

// ============================================================
// Page Component
// ============================================================

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken, isAuthenticated } = useAuthStore();

  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // ============================================================
  // Fetch product details
  // ============================================================

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError('شناسه محصول مشخص نیست.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = `${API_BASE}/products/supplies/${productId}/`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('محصول با این شناسه وجود ندارد.');
        }
        throw new Error(`خطا در دریافت محصول: ${response.status}`);
      }

      const data = await response.json();
      setProduct(data);
    } catch (err: any) {
      console.error('❌ Load product error:', err);
      setError(err.message || 'خطا در دریافت اطلاعات محصول.');
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId, accessToken]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProduct();
    } else {
      setIsLoading(false);
      setError('لطفاً وارد حساب کاربری خود شوید.');
    }
  }, [isAuthenticated, loadProduct]);

  // ============================================================
  // Toast helper
  // ============================================================

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ============================================================
  // Toggle favorite (mock)
  // ============================================================

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showToast(isFavorite ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد');
  };

  // ============================================================
  // Start negotiation (POST)
  // ============================================================

  const handleStartNegotiation = async () => {
    if (!user) {
      router.push('/login?next=' + encodeURIComponent(`/market/${productId}`));
      return;
    }

    if (!product || !product.id) {
      showToast('اطلاعات محصول در دسترس نیست.');
      return;
    }

    setIsNegotiating(true);

    try {
      const res = await fetch(`${API_BASE}/negotiations/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product: product.id }),
      });

      if (!res.ok) {
        let errorMsg = 'خطا در شروع مذاکره';
        try {
          const err = await res.json();
          errorMsg = err.detail || err.message || errorMsg;
        } catch {}
        showToast(errorMsg);
        setIsNegotiating(false);
        return;
      }

      const data = await res.json();
      router.push(`/negotiation/${data.id}`);
    } catch (error) {
      console.error('❌ Error starting negotiation:', error);
      showToast('خطا در ارتباط با سرور');
      setIsNegotiating(false);
    }
  };

  // ============================================================
  // UI States
  // ============================================================

  if (!isAuthenticated) {
    return (
      <main dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1E3A8A]" />
          <p className="mt-4 font-bold text-gray-700">در حال بررسی ورود...</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 text-center shadow-xl">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#14B8A6]" />
          <h2 className="mt-5 text-lg font-black text-gray-800">در حال دریافت محصول</h2>
          <p className="mt-2 text-sm text-gray-500">لطفاً چند لحظه صبر کنید...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mt-5 text-xl font-black text-gray-800">محصول پیدا نشد</h1>
          <p className="mt-2 text-sm text-gray-500">{error || 'محصول با این شناسه وجود ندارد.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-bold text-white hover:bg-blue-800 transition"
          >
            <ArrowLeft size={17} />
            بازگشت
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Main Render
  // ============================================================

  const productImage = product.images?.[0]?.image ? resolveMediaUrl(product.images[0].image) : null;
  const sellerName =
    product.seller?.company_name ||
    [product.seller?.first_name, product.seller?.last_name].filter(Boolean).join(' ') ||
    product.seller?.username ||
    'فروشنده';

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 md:p-6"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif" }}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm hover:text-[#1E3A8A] hover:shadow-md transition mb-6 border border-gray-100"
        >
          <ArrowLeft size={17} />
          بازگشت به بازار
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Image */}
              <div className="relative h-80 bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] flex items-center justify-center">
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={product.title || 'محصول'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center">
                    {product.category?.includes('خدمت') ? (
                      <Wrench size={48} className="text-white" />
                    ) : (
                      <Package size={48} className="text-white" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Title & Status */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                      {product.title || 'بدون عنوان'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {product.category && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {product.category === 'service' ? 'خدمت' : 'محصول'}
                        </span>
                      )}
                      {product.industry && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                          {product.industry}
                        </span>
                      )}
                      {product.technology && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                          {product.technology}
                        </span>
                      )}
                      {product.trl && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                          TRL {product.trl}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-xl border transition ${isFavorite ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:text-red-400'}`}
                    aria-label="افزودن به علاقه‌مندی‌ها"
                  >
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">توضیحات</h3>
                    <p className="text-sm text-gray-600 leading-7 whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 mb-6">
                  {product.price && (
                    <div>
                      <p className="text-xs text-gray-400">قیمت</p>
                      <p className="font-extrabold text-[#1E3A8A]">{formatPrice(product.price)}</p>
                    </div>
                  )}
                  {product.quantity && (
                    <div>
                      <p className="text-xs text-gray-400">مقدار</p>
                      <p className="font-bold text-gray-800">{product.quantity} {product.unit || ''}</p>
                    </div>
                  )}
                  {product.city && (
                    <div>
                      <p className="text-xs text-gray-400">استان</p>
                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {product.city}
                      </p>
                    </div>
                  )}
                  {product.created_at && (
                    <div>
                      <p className="text-xs text-gray-400">تاریخ ثبت</p>
                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {formatPersianDate(product.created_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Seller Info */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-lg font-black text-white">
                    {sellerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{sellerName}</p>
                    {product.seller?.location && (
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <MapPin size={14} />
                        {product.seller.location}
                      </p>
                    )}
                    {product.seller?.rating && (
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <Star size={14} className="text-[#D4A547] fill-[#D4A547]" />
                        {product.seller.rating}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Action Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sticky top-24">
              <h3 className="text-sm font-bold text-gray-700 mb-4">عملیات</h3>
              <button
                onClick={handleStartNegotiation}
                disabled={isNegotiating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] text-white px-6 py-3 font-bold text-sm hover:bg-blue-800 transition disabled:opacity-60"
              >
                {isNegotiating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MessageCircle size={18} />
                )}
                شروع مذاکره
              </button>
              <Link
                href="/market"
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition mt-3"
              >
                <ArrowLeft size={17} />
                بازگشت به بازار
              </Link>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">اطلاعات سریع</h3>
              <div className="space-y-3 text-sm">
                {product.trl && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">TRL</span>
                    <span className="font-bold text-gray-800">{product.trl}</span>
                  </div>
                )}
                {product.industry && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">صنعت</span>
                    <span className="font-bold text-gray-800">{product.industry}</span>
                  </div>
                )}
                {product.technology && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">فناوری</span>
                    <span className="font-bold text-gray-800">{product.technology}</span>
                  </div>
                )}
                {product.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">وضعیت</span>
                    <span className="font-medium text-emerald-600">
                      {product.status === 'approved' ? 'تأیید شده' : product.status === 'pending' ? 'در انتظار بررسی' : product.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}