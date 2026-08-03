// app/data/products.ts

export interface Product {
  id: string;
  title: string;

  // تصویر اصلی محصول
  image: string;

  // تصاویر گالری محصول
  images: string[];

  shortDescription: string;
  fullDescription: string;

  category: 'product' | 'service';
  industry: string;
  technology: string;

  trl: number;
  mrl: number;

  price: number;
  priceType: 'fixed' | 'negotiable' | 'range' | 'free';

  priceRange?: {
    min: number;
    max: number;
  };

  deliveryTime: string;

  seller: {
    name: string;
    rating: number;
    totalSales: number;
    verified: boolean;
    location: string;
    memberSince: string;
  };

  certifications: string[];
  tags: string[];

  viewCount: number;
  likeCount: number;
  createdAt: string;

  riskLevel: 'low' | 'medium' | 'high';
  afterSalesService: boolean;
  ipStatus: 'registered' | 'pending' | 'none';
  complianceScore: number;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'سامانه پایش هوشمند کوره صنعتی',
    shortDescription:
      'پایش لحظه‌ای دمای کوره با هوش مصنوعی و کاهش مصرف انرژی تا ۱۵٪',
    fullDescription:
      'این سامانه با استفاده از سنسورهای IoT و الگوریتم‌های یادگیری عمیق، دمای بهینه کوره را پیش‌بینی کرده و مصرف سوخت را کاهش می‌دهد.',

    image: '/images/products/1/a.jpg',
    images: [
      '/images/products/1/a.jpg',
      '/images/products/1/b.jpg',
      '/images/products/1/c.jpg',
    ],

    category: 'product',
    industry: 'نفت و گاز',
    technology: 'هوش مصنوعی',
    trl: 8,
    mrl: 7,
    price: 850,
    priceType: 'fixed',
    deliveryTime: '۲ ماه',

    seller: {
      name: 'فناوران نوین',
      rating: 4.8,
      totalSales: 28,
      verified: true,
      location: 'تهران',
      memberSince: '۱۳۹۸',
    },

    certifications: ['ISO 9001', 'دانش‌بنیان'],
    tags: ['کوره', 'بهینه‌سازی انرژی', 'هوش مصنوعی'],
    viewCount: 1250,
    likeCount: 89,
    createdAt: '۱۴۰۴-۰۶-۱۵',
    riskLevel: 'low',
    afterSalesService: true,
    ipStatus: 'registered',
    complianceScore: 92,
  },

  {
    id: '2',
    title: 'نرم‌افزار Digital Twin پالایشگاه',
    shortDescription:
      'شبیه‌سازی کامل فرآیند پالایش با قابلیت پیش‌بینی خرابی تجهیزات',
    fullDescription:
      'Digital Twin کل فرآیند پالایشگاه شامل برج تقطیر، کوره، مبدل‌های حرارتی و سایر تجهیزات را شبیه‌سازی می‌کند.',

    image: '/images/products/2/a.jpg',
    images: [
      '/images/products/2/a.jpg',
      '/images/products/2/b.jpg',
      '/images/products/2/c.jpg',
    ],

    category: 'product',
    industry: 'پتروشیمی',
    technology: 'دوقلوی دیجیتال',
    trl: 7,
    mrl: 6,
    price: 2500,
    priceType: 'negotiable',
    deliveryTime: '۴ ماه',

    seller: {
      name: 'مهندسی انرژی پویا',
      rating: 4.5,
      totalSales: 22,
      verified: true,
      location: 'اصفهان',
      memberSince: '۱۳۹۷',
    },

    certifications: ['دانش‌بنیان', 'IP Registered'],
    tags: ['Digital Twin', 'شبیه‌سازی', 'پالایشگاه'],
    viewCount: 980,
    likeCount: 67,
    createdAt: '۱۴۰۴-۰۴-۲۰',
    riskLevel: 'medium',
    afterSalesService: true,
    ipStatus: 'registered',
    complianceScore: 85,
  },

  {
    id: '3',
    title: 'سیستم کنترل پیشرفته APC',
    shortDescription:
      'کنترل خودکار فرآیندهای صنعتی با الگوریتم‌های پیشرفته و کاهش خطای انسانی',
    fullDescription:
      'APC با مدل‌سازی ریاضی فرآیند، نقاط تنظیم را به صورت بلادرنگ بهینه می‌کند.',

    image: '/images/products/3/a.jpg',
    images: [
      '/images/products/3/a.jpg',
      '/images/products/3/b.jpg',
      '/images/products/3/c.jpg',
    ],

    category: 'product',
    industry: 'انرژی',
    technology: 'هوش مصنوعی',
    trl: 9,
    mrl: 8,
    price: 1200,
    priceType: 'fixed',
    deliveryTime: '۳ ماه',

    seller: {
      name: 'کنترل صنعتی پارس',
      rating: 4.3,
      totalSales: 25,
      verified: true,
      location: 'تهران',
      memberSince: '۱۳۹۵',
    },

    certifications: ['ISO 9001', 'CE'],
    tags: ['APC', 'کنترل فرآیند', 'اتوماسیون'],
    viewCount: 850,
    likeCount: 54,
    createdAt: '۱۴۰۴-۰۳-۱۰',
    riskLevel: 'low',
    afterSalesService: true,
    ipStatus: 'registered',
    complianceScore: 90,
  },

  {
    id: '4',
    title: 'مشاوره بهینه‌سازی مصرف انرژی',
    shortDescription:
      'خدمات مشاوره تخصصی برای کاهش مصرف انرژی در صنایع با بازگشت سرمایه زیر ۲ سال',
    fullDescription:
      'تیم ما با ممیزی انرژی و ارائه راهکارهای عملی، مصرف انرژی را تا ۲۰٪ کاهش می‌دهد.',

    image: '/images/products/4/a.jpg',
    images: [
      '/images/products/4/a.jpg',
      '/images/products/4/b.jpg',
      '/images/products/4/c.jpg',
    ],

    category: 'service',
    industry: 'انرژی',
    technology: 'داده‌کاوی',
    trl: 9,
    mrl: 9,
    price: 300,
    priceType: 'range',
    priceRange: {
      min: 200,
      max: 500,
    },
    deliveryTime: '۱ ماه',

    seller: {
      name: 'راهکارهای سبز',
      rating: 4.4,
      totalSales: 12,
      verified: true,
      location: 'شیراز',
      memberSince: '۱۴۰۰',
    },

    certifications: ['گواهی صلاحیت مشاوره'],
    tags: ['مشاوره', 'انرژی', 'بهینه‌سازی'],
    viewCount: 720,
    likeCount: 41,
    createdAt: '۱۴۰۴-۰۵-۰۱',
    riskLevel: 'low',
    afterSalesService: false,
    ipStatus: 'none',
    complianceScore: 78,
  },

  {
    id: '5',
    title: 'راهکار یکپارچه IoT صنعتی',
    shortDescription:
      'پلتفرم جمع‌آوری و تحلیل داده‌های حسگرها با داشبورد مدیریتی',
    fullDescription:
      'راهکار کامل اینترنت اشیاء صنعتی شامل نصب حسگر، جمع‌آوری داده، تحلیل و نمایش در داشبورد.',

    image: '/images/products/5/a.jpg',
    images: [
      '/images/products/5/a.jpg',
      '/images/products/5/b.jpg',
      '/images/products/5/c.jpg',
    ],

    category: 'product',
    industry: 'حمل‌ونقل',
    technology: 'اینترنت اشیاء',
    trl: 8,
    mrl: 7,
    price: 1800,
    priceType: 'negotiable',
    deliveryTime: '۶ ماه',

    seller: {
      name: 'فناوران نوین',
      rating: 4.8,
      totalSales: 28,
      verified: true,
      location: 'تهران',
      memberSince: '۱۳۹۸',
    },

    certifications: ['دانش‌بنیان', 'ISO 27001'],
    tags: ['IIoT', 'حسگر', 'داشبورد'],
    viewCount: 680,
    likeCount: 38,
    createdAt: '۱۴۰۴-۰۲-۲۵',
    riskLevel: 'medium',
    afterSalesService: true,
    ipStatus: 'pending',
    complianceScore: 82,
  },

  {
    id: '6',
    title: 'ربات بازرسی خطوط لوله',
    shortDescription:
      'ربات خودکار با قابلیت تشخیص نشتی و خوردگی در خطوط لوله نفت و گاز',
    fullDescription:
      'ربات مجهز به دوربین حرارتی و سنسورهای اولتراسونیک برای بازرسی خطوط لوله است.',

    image: '/images/products/6/a.jpg',
    images: [
      '/images/products/6/a.jpg',
      '/images/products/6/b.jpg',
      '/images/products/6/c.jpg',
    ],

    category: 'product',
    industry: 'نفت و گاز',
    technology: 'رباتیک',
    trl: 7,
    mrl: 5,
    price: 3500,
    priceType: 'fixed',
    deliveryTime: '۸ ماه',

    seller: {
      name: 'هوشمندسازان یزد',
      rating: 4.6,
      totalSales: 18,
      verified: true,
      location: 'یزد',
      memberSince: '۱۳۹۹',
    },

    certifications: ['ATEX', 'IP68'],
    tags: ['ربات', 'بازرسی', 'خط لوله'],
    viewCount: 550,
    likeCount: 29,
    createdAt: '۱۴۰۴-۰۱-۱۲',
    riskLevel: 'high',
    afterSalesService: true,
    ipStatus: 'pending',
    complianceScore: 75,
  }
];

export function formatPrice(product: Product): string {
  if (product.priceType === 'free') {
    return 'رایگان';
  }

  if (product.priceType === 'negotiable') {
    return 'قابل مذاکره';
  }

  if (product.priceType === 'range' && product.priceRange) {
    return `${product.priceRange.min.toLocaleString(
      'fa-IR',
    )} - ${product.priceRange.max.toLocaleString('fa-IR')} میلیون تومان`;
  }

  return `${product.price.toLocaleString('fa-IR')} میلیون تومان`;
}

export function getTRLColor(trl: number): string {
  if (trl >= 8) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (trl >= 5) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-red-100 text-red-700';
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low':
      return 'bg-emerald-100 text-emerald-700';

    case 'medium':
      return 'bg-amber-100 text-amber-700';

    case 'high':
      return 'bg-red-100 text-red-700';

    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function getRiskLabel(risk: string): string {
  switch (risk) {
    case 'low':
      return 'کم';

    case 'medium':
      return 'متوسط';

    case 'high':
      return 'زیاد';

    default:
      return risk;
  }
}