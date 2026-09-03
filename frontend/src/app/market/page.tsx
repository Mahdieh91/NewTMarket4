// ============================================================
// FILE: frontend/src/app/market/page.tsx
// ============================================================
// نسخه نهایی و کامل - اصلاح فیلترهای صنعت، فناوری و استان با نرمال‌سازی
// کاملاً سازگار با بقیه بخش‌ها - بدون تغییر در logic اصلی
// ============================================================

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Star,
  Eye,
  ShoppingCart,
  MessageCircle,
  Heart,
  Scale,
  X,
  MapPin,
  Shield,
  Package,
  Wrench,
  Clock,
  CheckCircle,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';

// ===== کتابخانه نمودار =====
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== Helper: Normalize String ====================
const normalizeString = (str?: string | null): string => {
  if (!str) return '';
  return str.trim().toLowerCase();
};

// ==================== Constants ====================

const industries = [
  'همه',
  'نفت و گاز',
  'پتروشیمی',
  'فولاد و معدن',
  'سلامت',
  'کشاورزی',
  'حمل‌ونقل',
  'خودروسازی',
  'انرژی',
  'فناوری اطلاعات',
  'محیط زیست',
  'سایر', // پوشش داده‌های بدون صنعت
];

const technologies = [
  'همه',
  'هوش مصنوعی',
  'اینترنت اشیاء',
  'دوقلوی دیجیتال',
  'رباتیک',
  'بلاکچین',
  'داده‌کاوی',
  'سایر', // پوشش داده‌های بدون فناوری
];

const trlLevels = [
  { value: 0, label: 'همه' },
  { value: 1, label: 'TRL 1 - اصول پایه' },
  { value: 2, label: 'TRL 2 - فرمول‌بندی مفهوم' },
  { value: 3, label: 'TRL 3 - اثبات مفهوم' },
  { value: 4, label: 'TRL 4 - اعتبارسنجی آزمایشگاهی' },
  { value: 5, label: 'TRL 5 - اعتبارسنجی در محیط واقعی' },
  { value: 6, label: 'TRL 6 - نمونه اولیه' },
  { value: 7, label: 'TRL 7 - نمونه عملیاتی' },
  { value: 8, label: 'TRL 8 - تکمیل و تأیید نهایی' },
  { value: 9, label: 'TRL 9 - عملیاتی شده' },
];

const mrlLevels = [
  { value: 0, label: 'همه' },
  { value: 1, label: 'MRL 1 - نیازسنجی بازار' },
  { value: 2, label: 'MRL 2 - تحلیل بازار اولیه' },
  { value: 3, label: 'MRL 3 - تأیید بازار هدف' },
  { value: 4, label: 'MRL 4 - توسعه استراتژی بازار' },
  { value: 5, label: 'MRL 5 - تست بازار' },
  { value: 6, label: 'MRL 6 - ورود اولیه به بازار' },
  { value: 7, label: 'MRL 7 - رشد در بازار' },
  { value: 8, label: 'MRL 8 - بلوغ بازار' },
  { value: 9, label: 'MRL 9 - رهبری بازار' },
];

const provinces = [
  'همه',
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
  'نامشخص', // پوشش داده‌های بدون استان
];

// ==================== API ====================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// ==================== Supply API ====================

type SupplyApi = {
  id: number | string;
  title: string;
  supply_type?: 'product' | 'service' | string;
  category: string;
  industry?: string | null;
  technology?: string | null;
  city?: string | null;
  description?: string | null;
  quantity?: string | null;
  unit?: string | null;
  price?: string | number | null;
  trl?: string | number | null;
  documents?: string[];
  status?: string;
  seller_name?: string | null;
  view_count?: number;
  images?: Array<{
    id: number | string;
    image?: string | null;
    caption?: string | null;
    uploaded_at?: string;
  }>;
  created_at?: string;
  updated_at?: string;
};

// ==================== Helpers ====================

function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

function inferCategoryFromCategoryField(category?: string): 'product' | 'service' {
  if (!category) return 'product';
  const cat = category.trim();
  const serviceCategoryKeywords = [
    'خدمات مشاوره',
    'خدمات فنی و مهندسی',
    'سرویس',
    'خدمت',
  ];
  if (
    cat.includes('خدمت') ||
    serviceCategoryKeywords.some(kw => cat.includes(kw))
  ) {
    return 'service';
  }
  return 'product';
}

// ==================== Type ====================

interface MarketplaceProduct {
  id: string;
  supplyId?: number;
  title: string;
  category: 'product' | 'service';
  industry: string;
  technology: string;
  shortDescription: string;
  trl: number;
  mrl: number;
  price: number;
  priceType: 'fixed' | 'range';
  priceRange?: { min: number; max: number };
  images: string[];
  tags: string[];
  seller: {
    name: string;
    location: string;
    rating: number;
    verified: boolean;
    totalSales?: number;
  };
  viewCount: number;
  deliveryTime: string;
  riskLevel: 'low' | 'medium' | 'high';
  certifications: string[];
  afterSalesService?: boolean;
  ipStatus?: string;
  complianceScore?: number;
  createdAt: string;
}

// ==================== Supply -> MarketplaceProduct ====================

function supplyToMarketplaceProduct(supply: SupplyApi): MarketplaceProduct {
  const trlNumber = Number.parseInt(String(supply.trl ?? '1'), 10);
  const priceToman = Number(supply.price ?? 0);
  const priceInMillionToman = Number.isFinite(priceToman) ? priceToman / 1_000_000 : 0;
  const images = (supply.images || []).map((item) => resolveMediaUrl(item.image)).filter(Boolean);

  // تشخیص نوع عرضه
  let category: 'product' | 'service' = 'product';
  if (supply.supply_type) {
    category = supply.supply_type === 'service' ? 'service' : 'product';
  } else {
    category = inferCategoryFromCategoryField(supply.category);
    // فقط در محیط توسعه لاگ شود
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ عرضه "${supply.title}" فاقد supply_type است. بر اساس دسته‌بندی "${supply.category}" => ${category}`
      );
    }
  }

  // نرمال‌سازی فیلدهای کلیدی برای فیلترها
  const industry = supply.industry?.trim() || 'سایر';
  const technology = supply.technology?.trim() || 'سایر';
  const city = supply.city?.trim() || 'نامشخص';

  return {
    id: `supply-${supply.id}`,
    supplyId: Number(supply.id),
    title: supply.title,
    category,
    industry,
    technology,
    shortDescription: supply.description || 'عرضه ثبت‌شده در بازار تحول',
    trl: Number.isFinite(trlNumber) && trlNumber >= 1 && trlNumber <= 9 ? trlNumber : 1,
    mrl: 0,
    price: priceInMillionToman,
    priceType: 'fixed',
    priceRange: undefined,
    images,
    tags: [supply.category, supply.unit, supply.quantity ? `مقدار: ${supply.quantity}` : ''].filter(Boolean),
    seller: {
      name: supply.seller_name || 'فروشنده',
      location: city,
      rating: 0,
      verified: supply.status === 'approved' || supply.status === 'published',
    },
    viewCount: supply.view_count || 0,
    deliveryTime: '—',
    riskLevel: 'low',
    certifications: [],
    createdAt: supply.created_at || new Date().toISOString(),
  };
}

// ==================== Helper Functions for UI ====================

function formatPrice(product: MarketplaceProduct): string {
  if (product.priceType === 'range' && product.priceRange) {
    return `${product.priceRange.min.toLocaleString('fa-IR')} - ${product.priceRange.max.toLocaleString('fa-IR')} میلیون تومان`;
  }
  if (product.price === 0) {
    return 'قابل مذاکره';
  }
  return `${product.price.toLocaleString('fa-IR')} میلیون تومان`;
}

function getTRLColor(trl: number): string {
  if (trl <= 3) return 'bg-red-50 text-red-700 border border-red-200';
  if (trl <= 6) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
}

function getRiskColor(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'high':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

function getRiskLabel(risk: 'low' | 'medium' | 'high'): string {
  switch (risk) {
    case 'low':
      return 'ریسک کم';
    case 'medium':
      return 'ریسک متوسط';
    case 'high':
      return 'ریسک زیاد';
    default:
      return 'نامشخص';
  }
}

// ==================== Main Component ====================

export default function MarketplacePage() {
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // ===== علاقه‌مندی‌ها با پشتیبانی از localStorage =====
  const [favorites, setFavorites] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marketplace_favorites');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // ===== محصولات واقعی =====
  const [realProducts, setRealProducts] = useState<MarketplaceProduct[]>([]);
  const [suppliesLoading, setSuppliesLoading] = useState(false);
  const [suppliesError, setSuppliesError] = useState<string | null>(null);

  // ==================== Filters ====================

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('همه');
  const [selectedTechnology, setSelectedTechnology] = useState('همه');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'product' | 'service'>('all');
  const [selectedTRL, setSelectedTRL] = useState<number>(0);
  const [selectedMRL, setSelectedMRL] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedProvince, setSelectedProvince] = useState('همه');
  const [selectedCertification, setSelectedCertification] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-asc' | 'price-desc'>('newest');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // ==================== Mount ====================

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==================== Load Favorites from Backend ====================

  const loadFavorites = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;

    try {
      setFavoritesLoading(true);
      const res = await fetch(`${API_URL}/favorites/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 404) {
        setFavorites([]);
        localStorage.setItem('marketplace_favorites', JSON.stringify([]));
        return;
      }

      if (!res.ok) {
        console.warn('Failed to load favorites:', res.status);
        return;
      }

      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || [];

      const supplyIds = items
        .map((item: any) => {
          if (item.supply && typeof item.supply === 'object' && item.supply.id) {
            return Number(item.supply.id);
          }
          if (item.supply && typeof item.supply === 'number') {
            return Number(item.supply);
          }
          if (item.supply_id) {
            return Number(item.supply_id);
          }
          if (item.product && typeof item.product === 'object' && item.product.id) {
            return Number(item.product.id);
          }
          return null;
        })
        .filter((id: number | null): id is number => id !== null && id > 0);

      setFavorites(supplyIds);
      localStorage.setItem('marketplace_favorites', JSON.stringify(supplyIds));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    if (mounted && accessToken && isAuthenticated) {
      loadFavorites();
    }
  }, [mounted, accessToken, isAuthenticated, loadFavorites]);

  // ==================== Load Supplies ====================

  useEffect(() => {
    if (!mounted || !accessToken || !isAuthenticated) return;

    let cancelled = false;

    const loadSupplies = async () => {
      setSuppliesLoading(true);
      setSuppliesError(null);
      try {
        const response = await fetch(`${API_URL}/products/supplies/`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error('نشست کاربری منقضی شده است.');
          throw new Error(`خطا در دریافت عرضه‌ها (کد ${response.status})`);
        }

        const data = await response.json();
        const supplies: SupplyApi[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

        if (!cancelled) {
          setRealProducts(supplies.map(supplyToMarketplaceProduct));
        }
      } catch (error: any) {
        console.error('❌ خطا در دریافت عرضه‌های واقعی:', error);
        if (!cancelled) {
          setSuppliesError(error?.message || 'دریافت عرضه‌های ثبت‌شده با خطا مواجه شد.');
          setRealProducts([]);
        }
      } finally {
        if (!cancelled) setSuppliesLoading(false);
      }
    };

    loadSupplies();
    const handleFocus = () => loadSupplies();
    window.addEventListener('focus', handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
    };
  }, [mounted, accessToken, isAuthenticated]);

  // ==================== Toast ====================

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // =========================================================
  // Start / Open Negotiation
  // =========================================================

  const handleStartNegotiation = async (product: MarketplaceProduct) => {
    if (!accessToken) {
      window.location.href = '/login?next=' + encodeURIComponent(`/market/${product.id}`);
      return;
    }

    let supplyId: number | null = null;
    if (product.supplyId !== undefined && Number.isInteger(product.supplyId) && product.supplyId > 0) {
      supplyId = product.supplyId;
    } else {
      const match = String(product.id).match(/^supply-(\d+)$/);
      if (match) {
        const parsedId = Number(match[1]);
        if (Number.isSafeInteger(parsedId) && parsedId > 0) supplyId = parsedId;
      }
    }

    if (supplyId === null) {
      console.error('❌ شناسه واقعی عرضه پیدا نشد:', product);
      showToast('شناسه عرضه معتبر نیست.');
      return;
    }

    setIsNegotiating(true);
    try {
      const response = await fetch(`${API_URL}/negotiations/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supply: supplyId }),
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { detail: responseText || 'پاسخ نامعتبر از سرور دریافت شد.' };
      }

      if (!response.ok) {
        let errorMessage =
          data?.detail ||
          data?.message ||
          data?.error ||
          `خطا در شروع مذاکره (کد ${response.status})`;

        const detailText = String(
          data?.detail ||
          data?.message ||
          data?.error ||
          ''
        ).toLowerCase();

        if (response.status === 400) {
          if (
            detailText.includes('owner') ||
            detailText.includes('yourself') ||
            detailText.includes('self') ||
            detailText.includes('cannot negotiate with yourself') ||
            detailText.includes('خودتان') ||
            detailText.includes('خود') ||
            detailText.includes('مالک')
          ) {
            errorMessage = 'شما نمی‌توانید با خودتان مذاکره کنید.';
          } else if (
            detailText.includes('already') ||
            detailText.includes('existing') ||
            detailText.includes('duplicate') ||
            detailText.includes('قبلاً') ||
            detailText.includes('مذاکره‌ای شروع شده')
          ) {
            errorMessage = 'برای این عرضه قبلاً مذاکره‌ای شروع شده است.';
          } else if (
            detailText.includes('status') ||
            detailText.includes('وضعیت')
          ) {
            errorMessage = 'وضعیت این عرضه اجازه‌ی شروع مذاکره را نمی‌دهد.';
          }
        }

        showToast(errorMessage);
        return;
      }

      const negotiationId = data?.id ?? data?.negotiation_id ?? data?.data?.id ?? data?.data?.negotiation_id;
      if (!negotiationId) {
        console.error('❌ Negotiation created but no ID returned:', data);
        showToast('مذاکره ایجاد شد اما شناسه مذاکره از سرور دریافت نشد.');
        return;
      }

      console.log('✅ Negotiation ready:', { negotiationId, supplyId });
      window.location.href = `/negotiation/${negotiationId}`;
    } catch (error: any) {
      console.error('❌ Start negotiation error:', error);
      showToast(error?.message || 'در برقراری ارتباط با سرور برای شروع مذاکره خطایی رخ داد.');
    } finally {
      setIsNegotiating(false);
    }
  };

  // ==================== Favorites API ====================

  const toggleFavorite = useCallback(
    async (product: MarketplaceProduct) => {
      if (!accessToken) {
        showToast('لطفاً ابتدا وارد شوید.');
        return;
      }

      const supplyId = product.supplyId;
      if (!supplyId) {
        showToast('شناسه محصول نامعتبر.');
        return;
      }

      const isCurrentlyFavorite = favorites.includes(supplyId);

      try {
        if (isCurrentlyFavorite) {
          const res = await fetch(`${API_URL}/favorites/${supplyId}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!res.ok && res.status !== 404) {
            throw new Error('Failed to remove favorite');
          }

          setFavorites((prev) => {
            const newFavs = prev.filter((id) => id !== supplyId);
            localStorage.setItem('marketplace_favorites', JSON.stringify(newFavs));
            return newFavs;
          });
          showToast('از علاقه‌مندی‌ها حذف شد');
        } else {
          const res = await fetch(`${API_URL}/favorites/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ supply: supplyId }),
          });

          if (!res.ok) {
            let errorMsg = 'افزودن به علاقه‌مندی‌ها ممکن نیست.';
            try {
              const errData = await res.json();
              errorMsg = errData?.detail || errData?.message || errorMsg;
            } catch {
              // ignore
            }
            throw new Error(errorMsg);
          }

          const responseData = await res.json();

          if (responseData.is_favorite === true) {
            setFavorites((prev) => {
              const newFavs = [...prev, supplyId];
              localStorage.setItem('marketplace_favorites', JSON.stringify(newFavs));
              return newFavs;
            });
            showToast('به علاقه‌مندی‌ها اضافه شد');
          } else if (responseData.is_favorite === false) {
            setFavorites((prev) => {
              const newFavs = prev.filter((id) => id !== supplyId);
              localStorage.setItem('marketplace_favorites', JSON.stringify(newFavs));
              return newFavs;
            });
            showToast('از علاقه‌مندی‌ها حذف شد');
          }
        }
      } catch (error: any) {
        console.error('Error toggling favorite:', error);
        showToast(error?.message || 'خطا در ثبت علاقه‌مندی. دوباره تلاش کنید.');
        await loadFavorites();
      }
    },
    [accessToken, favorites, loadFavorites, showToast]
  );

  // ==================== Compare ====================

  const toggleCompare = useCallback((id: string) => {
    setCompareList((prev) => {
      if (prev.includes(id)) {
        showToast('از لیست مقایسه حذف شد');
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= 4) {
        showToast('حداکثر ۴ محصول قابل مقایسه است');
        return prev;
      }
      showToast('به لیست مقایسه اضافه شد');
      return [...prev, id];
    });
  }, [showToast]);

  // ==================== Clear Filters ====================

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('همه');
    setSelectedTechnology('همه');
    setSelectedCategory('all');
    setSelectedTRL(0);
    setSelectedMRL(0);
    setMaxPrice(5000);
    setSelectedProvince('همه');
    setSelectedCertification('all');
    setMinRating(0);
    setSortBy('newest');
    setSelectedRisk('all');
  };

  const activeFilterCount = [
    selectedIndustry !== 'همه',
    selectedTechnology !== 'همه',
    selectedCategory !== 'all',
    selectedTRL > 0,
    selectedMRL > 0,
    maxPrice < 5000,
    selectedProvince !== 'همه',
    selectedCertification !== 'all',
    minRating > 0,
    selectedRisk !== 'all',
  ].filter(Boolean).length;

  // ==================== Filtered Products (اصلاح شده با نرمال‌سازی) ====================

  const filteredProducts = useMemo(() => {
    let result = [...realProducts];

    // فیلتر جستجو
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.seller.name.toLowerCase().includes(q)
      );
    }

    // فیلتر صنعت با نرمال‌سازی
    if (selectedIndustry !== 'همه') {
      const normalizedIndustry = normalizeString(selectedIndustry);
      result = result.filter((p) => normalizeString(p.industry) === normalizedIndustry);
    }

    // فیلتر فناوری با نرمال‌سازی
    if (selectedTechnology !== 'همه') {
      const normalizedTech = normalizeString(selectedTechnology);
      result = result.filter((p) => normalizeString(p.technology) === normalizedTech);
    }

    // فیلتر نوع (محصول/خدمت)
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // فیلتر TRL
    if (selectedTRL > 0) {
      result = result.filter((p) => p.trl >= selectedTRL);
    }

    // فیلتر MRL
    if (selectedMRL > 0) {
      result = result.filter((p) => p.mrl >= selectedMRL);
    }

    // فیلتر قیمت
    result = result.filter((p) => {
      const effectivePrice = p.priceType === 'range' && p.priceRange ? p.priceRange.min : p.price;
      return effectivePrice <= maxPrice;
    });

    // فیلتر استان با نرمال‌سازی
    if (selectedProvince !== 'همه') {
      const normalizedProvince = normalizeString(selectedProvince);
      result = result.filter((p) => normalizeString(p.seller.location) === normalizedProvince);
    }

    // فیلتر گواهینامه
    if (selectedCertification !== 'all') {
      if (selectedCertification === 'has') {
        result = result.filter((p) => p.certifications.length > 0);
      } else if (selectedCertification === 'none') {
        result = result.filter((p) => p.certifications.length === 0);
      }
    }

    // فیلتر امتیاز فروشنده
    if (minRating > 0) {
      result = result.filter((p) => p.seller.rating >= minRating);
    }

    // فیلتر ریسک
    if (selectedRisk !== 'all') {
      result = result.filter((p) => p.riskLevel === selectedRisk);
    }

    // مرتب‌سازی
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        result.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'price-asc':
        result.sort((a, b) => {
          const priceA = a.priceType === 'range' && a.priceRange ? a.priceRange.min : a.price;
          const priceB = b.priceType === 'range' && b.priceRange ? b.priceRange.min : b.price;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        result.sort((a, b) => {
          const priceA = a.priceType === 'range' && a.priceRange ? a.priceRange.min : a.price;
          const priceB = b.priceType === 'range' && b.priceRange ? b.priceRange.min : b.price;
          return priceB - priceA;
        });
        break;
      default:
        break;
    }

    return result;
  }, [
    searchQuery,
    selectedIndustry,
    selectedTechnology,
    selectedCategory,
    selectedTRL,
    selectedMRL,
    maxPrice,
    selectedProvince,
    selectedCertification,
    minRating,
    sortBy,
    selectedRisk,
    realProducts,
  ]);

  // ==================== Check if product is favorite ====================

  const isProductFavorite = useCallback(
    (product: MarketplaceProduct) => {
      return product.supplyId !== undefined && favorites.includes(product.supplyId);
    },
    [favorites]
  );

  // ==================== نمایش پیام ورود ====================

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center shadow-lg">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">لطفاً وارد شوید</h2>
          <p className="text-slate-500 text-sm mb-6">
            برای مشاهده و خرید محصولات و خدمات، باید وارد حساب کاربری خود شوید.
          </p>
          <Link
            href="/login?next=/market"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white font-bold shadow-lg hover:shadow-xl transition"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  // ==================== Loading ====================

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-500">در حال بارگذاری بازار...</p>
        </div>
      </div>
    );
  }

  // ==================== Render ====================

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f0fdfa]"
      style={{
        fontFamily: "'Vazir', 'Vazirmatn', 'Iran Sans', Tahoma, sans-serif",
      }}
      dir="rtl"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#1E3A8A] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* ==================== Sidebar ==================== */}
          {showFilters && (
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-[#1E3A8A]" />
                      فیلترها
                    </h3>
                    {activeFilterCount > 0 && (
                      <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        حذف همه
                      </button>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">جستجو</label>
                    <div className="relative">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="عنوان، برچسب، فروشنده..."
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A20]"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">نوع</label>
                    <div className="flex gap-1">
                      {[
                        { value: 'all', label: 'همه' },
                        { value: 'product', label: 'محصول' },
                        { value: 'service', label: 'خدمت' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedCategory(opt.value as any)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                            selectedCategory === opt.value
                              ? 'bg-[#1E3A8A] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">صنعت</label>
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none cursor-pointer"
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">فناوری</label>
                    <select
                      value={selectedTechnology}
                      onChange={(e) => setSelectedTechnology(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none cursor-pointer"
                    >
                      {technologies.map((tech) => (
                        <option key={tech} value={tech}>
                          {tech}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">حداقل TRL</label>
                    <select
                      value={selectedTRL}
                      onChange={(e) => setSelectedTRL(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none cursor-pointer"
                    >
                      {trlLevels.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">حداقل MRL</label>
                    <select
                      value={selectedMRL}
                      onChange={(e) => setSelectedMRL(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none cursor-pointer"
                    >
                      {mrlLevels.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      حداکثر قیمت (میلیون تومان): {maxPrice.toLocaleString('fa-IR')}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={100}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full accent-[#1E3A8A]"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">استان فروشنده</label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none cursor-pointer"
                    >
                      {provinces.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">گواهینامه</label>
                    <select
                      value={selectedCertification}
                      onChange={(e) => setSelectedCertification(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none cursor-pointer"
                    >
                      <option value="all">همه</option>
                      <option value="has">دارای گواهینامه</option>
                      <option value="none">بدون گواهینامه</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      حداقل امتیاز فروشنده: {minRating}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.5}
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className="w-full accent-[#D4A547]"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">سطح ریسک</label>
                    <div className="flex gap-1">
                      {[
                        { value: 'all', label: 'همه' },
                        { value: 'low', label: 'کم' },
                        { value: 'medium', label: 'متوسط' },
                        { value: 'high', label: 'زیاد' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedRisk(opt.value as any)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                            selectedRisk === opt.value
                              ? 'bg-[#1E3A8A] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* ==================== Main Content ==================== */}
          <div className="flex-1 min-w-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#14B8A6] p-6 sm:p-8 text-white mb-6">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4A547] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </div>
              <div className="relative">
                <h1 className="text-xl sm:text-2xl font-black">بازار محصولات و خدمات فناورانه و نوآورانه</h1>
                <p className="mt-2 text-white/80 text-sm">جستجو، کشف و مقایسهٔ هوشمند محصولات و خدمات نوآورانه</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <Filter size={14} />
                  فیلترها
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white outline-none cursor-pointer"
                >
                  <option value="newest">جدیدترین</option>
                  <option value="popular">پربازدیدترین</option>
                  <option value="price-asc">قیمت: کم به زیاد</option>
                  <option value="price-desc">قیمت: زیاد به کم</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'grid' ? 'bg-white shadow text-[#1E3A8A]' : 'text-slate-400'
                    }`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'list' ? 'bg-white shadow text-[#1E3A8A]' : 'text-slate-400'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>

                {compareList.length > 0 && (
                  <button
                    onClick={() => setShowCompare(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14B8A6] text-white text-xs font-bold hover:bg-[#14B8A6]/90 transition"
                  >
                    <Scale size={14} />
                    مقایسه ({compareList.length})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{filteredProducts.length} مورد یافت شد</span>
                {suppliesLoading && <span className="text-[11px] text-teal-600">در حال دریافت عرضه‌های واقعی...</span>}
                {!suppliesLoading && realProducts.length > 0 && (
                  <span className="text-[11px] text-emerald-600">{realProducts.length} عرضه ثبت‌شده</span>
                )}
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mb-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">فیلترها</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="text-xs text-red-500 font-medium">
                      حذف همه
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو..."
                    className="col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="px-2 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  >
                    <option value="all">نوع: همه</option>
                    <option value="product">محصول</option>
                    <option value="service">خدمت</option>
                  </select>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="px-2 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  >
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedTechnology}
                    onChange={(e) => setSelectedTechnology(e.target.value)}
                    className="px-2 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  >
                    {technologies.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="px-2 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  >
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {suppliesError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {suppliesError} — لطفاً بعداً مجدداً تلاش کنید.
              </div>
            )}

            {/* Products */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Package size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">محصولی یافت نشد</h3>
                <p className="text-sm text-slate-500 mb-4">با تغییر فیلترها دوباره جستجو کنید</p>
                <button onClick={clearAllFilters} className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-sm font-bold hover:bg-[#1E3A8A]/90">
                  حذف همه فیلترها
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={isProductFavorite(product)}
                    isCompared={compareList.includes(product.id)}
                    onToggleFavorite={() => toggleFavorite(product)}
                    onToggleCompare={() => toggleCompare(product.id)}
                    onStartNegotiation={() => handleStartNegotiation(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    isFavorite={isProductFavorite(product)}
                    isCompared={compareList.includes(product.id)}
                    onToggleFavorite={() => toggleFavorite(product)}
                    onToggleCompare={() => toggleCompare(product.id)}
                    onStartNegotiation={() => handleStartNegotiation(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ==================== Compare Modal (Graphical) ==================== */}
        {showCompare && compareList.length >= 2 && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale size={20} className="text-[#1E3A8A]" />
                  مقایسه گرافیکی محصولات
                </h2>
                <button
                  onClick={() => setShowCompare(false)}
                  className="p-2 rounded-xl hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {(() => {
                const selectedProducts = compareList
                  .map((id) => realProducts.find((p) => p.id === id))
                  .filter((p): p is MarketplaceProduct => p !== undefined);

                if (selectedProducts.length < 2) return null;

                const colorPalette = [
                  '#1E3A8A', '#14B8A6', '#D4A547', '#EF4444',
                  '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                  '#6366F1', '#F59E0B',
                ];

                const productColors = selectedProducts.map(
                  (_, idx) => colorPalette[idx % colorPalette.length]
                );

                const metrics = [
                  {
                    key: 'price',
                    label: 'قیمت',
                    unit: 'میلیون تومان',
                    max: 5000,
                    getValue: (p: MarketplaceProduct) => Number(p.price || 0),
                  },
                  {
                    key: 'trl',
                    label: 'TRL',
                    unit: '',
                    max: 9,
                    getValue: (p: MarketplaceProduct) => Number(p.trl || 0),
                  },
                  {
                    key: 'mrl',
                    label: 'MRL',
                    unit: '',
                    max: 9,
                    getValue: (p: MarketplaceProduct) => Number(p.mrl || 0),
                  },
                  {
                    key: 'rating',
                    label: 'امتیاز فروشنده',
                    unit: 'از ۵',
                    max: 5,
                    getValue: (p: MarketplaceProduct) =>
                      Number(p.seller.rating || 0),
                  },
                ];

                const activeMetrics = metrics.filter((metric) =>
                  selectedProducts.some(
                    (product) => metric.getValue(product) > 0
                  )
                );

                if (activeMetrics.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Scale size={28} className="text-slate-400" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700 mb-2">
                        اطلاعات عددی قابل مقایسه وجود ندارد
                      </h3>
                      <p className="text-xs text-slate-500">
                        برای این موارد، تمام معیارهای عددی مانند قیمت، TRL، MRL
                        و امتیاز فروشنده صفر یا نامشخص هستند.
                      </p>
                    </div>
                  );
                }

                const comparisonRows = [
                  { label: 'صنعت', key: 'industry' },
                  { label: 'فناوری', key: 'technology' },
                  { label: 'محل فروشنده', key: 'location' },
                  { label: 'ریسک', key: 'risk' },
                  { label: 'گواهینامه‌ها', key: 'certs' },
                  { label: 'خدمات پس از فروش', key: 'afterSales' },
                  { label: 'وضعیت IP', key: 'ip' },
                ];

                return (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
                        مقایسه معیارهای عددی
                      </h3>
                      <div className="grid grid-cols-1 gap-5">
                        {activeMetrics.map((metric) => {
                          const chartData = selectedProducts.map((product) => ({
                            name:
                              product.title.length > 22
                                ? `${product.title.slice(0, 22)}…`
                                : product.title,
                            value: metric.getValue(product),
                            fullTitle: product.title,
                          }));

                          return (
                            <div
                              key={metric.key}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="mb-3 text-center">
                                <h4 className="text-sm font-extrabold text-slate-800">
                                  {metric.label}
                                </h4>
                                {metric.unit && (
                                  <p className="text-[11px] text-slate-500 mt-1">
                                    {metric.unit}
                                  </p>
                                )}
                              </div>

                              <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                  data={chartData}
                                  margin={{ top: 10, right: 15, left: 0, bottom: 50 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10 }}
                                    interval={0}
                                    angle={-20}
                                    textAnchor="end"
                                  />
                                  <YAxis
                                    domain={[0, metric.max]}
                                    allowDecimals={metric.key === 'rating' || metric.key === 'price'}
                                  />
                                  <Tooltip
                                    formatter={(value: number | string) => [
                                      Number(value).toLocaleString('fa-IR'),
                                      metric.label,
                                    ]}
                                    labelFormatter={(_, payload) =>
                                      payload?.[0]?.payload?.fullTitle || ''
                                    }
                                  />
                                  {selectedProducts.map((product, idx) => {
                                    const productIndex = selectedProducts.findIndex(
                                      (item) => item.id === product.id
                                    );
                                    return (
                                      <Bar
                                        key={product.id}
                                        dataKey="value"
                                        name={product.title}
                                        data={[
                                          {
                                            name:
                                              product.title.length > 22
                                                ? `${product.title.slice(0, 22)}…`
                                                : product.title,
                                            value: metric.getValue(product),
                                            fullTitle: product.title,
                                          },
                                        ]}
                                        fill={productColors[productIndex]}
                                        radius={[6, 6, 0, 0]}
                                      />
                                    );
                                  })}
                                  <Legend />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-sm font-bold text-slate-700 mb-3 text-center">
                        جدول مقایسه مشخصات
                      </h3>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="py-3 px-3 text-right text-slate-600 font-medium">
                              ویژگی
                            </th>
                            {selectedProducts.map((p, idx) => (
                              <th
                                key={p.id}
                                className="py-3 px-3 text-center"
                                style={{ color: productColors[idx] }}
                              >
                                {p.title}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map((row) => (
                            <tr key={row.key} className="border-b border-slate-100">
                              <td className="py-3 px-3 font-medium text-slate-700">
                                {row.label}
                              </td>
                              {selectedProducts.map((p) => {
                                let value = '';
                                if (row.key === 'industry') {
                                  value = p.industry;
                                } else if (row.key === 'technology') {
                                  value = p.technology;
                                } else if (row.key === 'location') {
                                  value = p.seller.location;
                                } else if (row.key === 'risk') {
                                  value = getRiskLabel(p.riskLevel);
                                } else if (row.key === 'certs') {
                                  value =
                                    p.certifications.length > 0
                                      ? p.certifications.join('، ')
                                      : 'ندارد';
                                } else if (row.key === 'afterSales') {
                                  value = p.afterSalesService ? '✅ دارد' : '❌ ندارد';
                                } else if (row.key === 'ip') {
                                  value =
                                    p.ipStatus === 'registered'
                                      ? 'ثبت شده'
                                      : p.ipStatus === 'pending'
                                      ? 'در حال ثبت'
                                      : 'ندارد';
                                }
                                return (
                                  <td
                                    key={p.id}
                                    className="py-3 px-3 text-center text-slate-600 text-xs"
                                  >
                                    {value}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-slate-400">بازار محصولات و خدمات فناورانه — بازار تحول</p>
        </div>
      </footer>
    </div>
  );
}

// =========================================================
// Product Card
// =========================================================

function ProductCard({
  product,
  isFavorite,
  isCompared,
  onToggleFavorite,
  onToggleCompare,
  onStartNegotiation,
}: {
  product: MarketplaceProduct;
  isFavorite: boolean;
  isCompared: boolean;
  onToggleFavorite: () => void;
  onToggleCompare: () => void;
  onStartNegotiation: () => void;
}) {
  const productImage = product.images?.[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-[#1E3A8A20] transition-all group overflow-hidden">
      <div className="h-40 bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] flex items-center justify-center relative overflow-hidden">
        {productImage ? (
          <img
            src={productImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center opacity-80">
            {product.category === 'service' ? (
              <Wrench size={28} className="text-white" />
            ) : (
              <Package size={28} className="text-white" />
            )}
          </div>
        )}
        {productImage && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10 pointer-events-none" />
        )}

        <div className="absolute top-2 left-2 flex gap-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`p-1.5 rounded-lg transition ${
              isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/90 text-slate-400 hover:text-red-400'
            }`}
            aria-label="افزودن به علاقه‌مندی‌ها"
          >
            <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleCompare();
            }}
            className={`p-1.5 rounded-lg transition ${
              isCompared ? 'bg-[#14B8A6]/20 text-[#14B8A6]' : 'bg-white/90 text-slate-400 hover:text-[#14B8A6]'
            }`}
            aria-label="افزودن به مقایسه"
          >
            <Scale size={14} />
          </button>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              product.category === 'service' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {product.category === 'service' ? 'خدمت' : 'محصول'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-extrabold text-slate-900 mb-1 line-clamp-2 group-hover:text-[#1E3A8A] transition">
          {product.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.shortDescription}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{product.industry}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{product.technology}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTRLColor(product.trl)}`}>
            TRL {product.trl}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-extrabold text-[#1E3A8A]">{formatPrice(product)}</span>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-[#D4A547] fill-[#D4A547]" />
            <span className="text-xs font-bold text-slate-600">{product.seller.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {product.seller.location}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {product.viewCount}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/market/${product.id}`}
            className="flex-1 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold text-center hover:bg-[#1E3A8A]/90 transition"
          >
            مشاهده و درخواست
          </Link>
          <button
            type="button"
            onClick={onStartNegotiation}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#1E3A8A] transition"
            title="شروع مذاکره"
          >
            <MessageCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// Product List Item
// =========================================================

function ProductListItem({
  product,
  isFavorite,
  isCompared,
  onToggleFavorite,
  onToggleCompare,
  onStartNegotiation,
}: {
  product: MarketplaceProduct;
  isFavorite: boolean;
  isCompared: boolean;
  onToggleFavorite: () => void;
  onToggleCompare: () => void;
  onStartNegotiation: () => void;
}) {
  const productImage = product.images?.[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-[#1E3A8A20] transition-all group p-4">
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-[#1E3A8A10] to-[#14B8A610] overflow-hidden flex-shrink-0">
          {productImage ? (
            <img
              src={productImage}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {product.category === 'service' ? (
                <Wrench size={22} className="text-[#1E3A8A]" />
              ) : (
                <Package size={22} className="text-[#1E3A8A]" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#1E3A8A] transition">
                {product.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{product.shortDescription}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={onToggleFavorite}
                className={`p-1.5 rounded-lg transition ${
                  isFavorite ? 'text-red-500' : 'text-slate-400 hover:text-red-400'
                }`}
                aria-label="افزودن به علاقه‌مندی‌ها"
              >
                <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={onToggleCompare}
                className={`p-1.5 rounded-lg transition ${
                  isCompared ? 'text-[#14B8A6]' : 'text-slate-400 hover:text-[#14B8A6]'
                }`}
                aria-label="افزودن به مقایسه"
              >
                <Scale size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{product.industry}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{product.technology}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTRLColor(product.trl)}`}>
              TRL {product.trl}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskColor(product.riskLevel)}`}>
              {getRiskLabel(product.riskLevel)}
            </span>
            {product.seller.verified && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <Shield size={12} />
                تأیید شده
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {product.seller.location}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {product.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {product.deliveryTime}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-[#D4A547] fill-[#D4A547]" />
                <span className="text-xs font-bold text-slate-600">{product.seller.rating}</span>
              </div>
              <span className="text-sm font-extrabold text-[#1E3A8A]">{formatPrice(product)}</span>
              <Link
                href={`/market/${product.id}`}
                className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#1E3A8A]/90 transition"
              >
                مشاهده
              </Link>
              <button
                type="button"
                onClick={onStartNegotiation}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#1E3A8A] transition"
                title="شروع مذاکره"
              >
                <MessageCircle size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}