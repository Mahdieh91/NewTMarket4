// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
  PlayCircle,
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  ClipboardList,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const getInitial = () => {
    if (!user) return '';
    return user.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'ک';
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // ===== منوی اصلی با ترتیب جدید =====
  const mainMenuItems = [
    { title: 'پروفایل', href: '/profile', icon: <User size={17} /> },
    { title: 'داشبورد', href: '/dashboard', icon: <LayoutDashboard size={17} /> },
    { title: 'بازار', href: '/market', icon: <Store size={17} /> },
    { title: 'تحلیل بازار', href: '/market-intelligence', icon: <BarChart3 size={17} /> },
    { title: 'ثبت محصول/خدمت', href: '/supply/register', icon: <PlusCircle size={17} /> },
    { title: 'ثبت نیاز', href: '/needs/register', icon: <ClipboardList size={17} /> },
    { title: 'اجرا', href: '/execution', icon: <PlayCircle size={17} /> },
  ];

  if (!mounted) return <nav className="h-20 bg-white border-b border-slate-200" dir="rtl" />;

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* لوگو */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {!logoError ? (
                  <img
                    src="/logo.png"
                    alt="لوگو"
                    className="h-full w-full rounded-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-[#1E3A8A] font-black text-lg">ب</span>
                )}
              </div>
            </div>
          </Link>

          {/* ===== منوی دسکتاپ ===== */}
          <div className="hidden xl:flex items-center gap-0.5">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-[#1E3A8A]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#1E3A8A]'
                }`}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>

          {/* ===== بخش ورود/کاربر (سمت راست) ===== */}
          <div className="hidden xl:flex items-center gap-2">
            {!isAuthenticated || !user ? (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1E3A8A] hover:bg-blue-50"
                >
                  <LogIn size={15} />
                  ورود
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-xs font-bold shadow-sm hover:shadow-md"
                >
                  <UserPlus size={15} />
                  ثبت‌نام
                </Link>
              </>
            ) : (
              <>
                {/* نمایش اطلاعات کاربر (بدون لینک پروفایل) */}
                <div className="flex items-center gap-1 hover:bg-slate-50 rounded-lg px-2 py-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] text-white flex items-center justify-center font-black text-sm">
                    {getInitial()}
                  </div>
                  <div className="hidden 2xl:block text-right">
                    <div className="text-xs font-bold text-slate-700">
                      {user.first_name || 'کاربر'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {user.role === 'admin' ? 'مدیر' : user.role === 'buyer' ? 'خریدار' : 'فروشنده'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
                  خروج
                </button>
              </>
            )}
          </div>

          {/* دکمه منوی موبایل */}
          <button
            className="xl:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* ===== منوی موبایل ===== */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-100 py-4 space-y-2">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-bold"
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
            {isAuthenticated && user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-bold text-right"
              >
                <LogOut size={18} />
                خروج از حساب
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-bold"
                >
                  <LogIn size={18} />
                  ورود
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 text-sm font-bold"
                >
                  <UserPlus size={18} />
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}