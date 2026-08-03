// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ============================================================
  // تصاویر
  // ============================================================
  images: {
    // remotePatterns جایگزین domains شده است
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // فرمت‌های بهینه‌سازی شده
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================================
  // بهینه‌سازی
  // ============================================================
  compress: true,
  productionBrowserSourceMaps: true,

  // ============================================================
  // متغیرهای محیطی (عمومی)
  // ============================================================
  env: {
    NEXT_PUBLIC_APP_NAME: 'بازار تحول',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'development',
  },

  // ============================================================
  // هدرهای امنیتی
  // ============================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ============================================================
  // تنظیمات سرویس‌دهی فایل‌های استاتیک
  // ============================================================
  poweredByHeader: false,
  trailingSlash: false,

  // ============================================================
  // تنظیمات TypeScript
  // ============================================================
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ============================================================
  // تنظیمات تولید (Optimization)
  // ============================================================
  output: 'standalone',

  // ============================================================
  // تنظیمات Dev Server
  // ============================================================
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // ============================================================
  // تنظیمات بیشتر برای بهینه‌سازی
  // ============================================================
  generateEtags: true,

  // ============================================================
  // تنظیمات آزمایشی (Experimental)
  // ============================================================
  experimental: {
    optimizeCss: true,
  },

  // ============================================================
  // ====== رفع خطای Turbopack و Webpack ======
  // ============================================================
  // اضافه کردن یک turbopack config خالی برای رفع خطا
  turbopack: {},
};

export default nextConfig;