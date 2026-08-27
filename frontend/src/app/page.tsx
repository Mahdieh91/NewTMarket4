// src/app/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Wrench,
  Package,
  Settings,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Zap,
  Star,
  Shield,
  BarChart3,
  Target,
  Rocket,
  ArrowLeft,
  Play,
  ChevronLeft,
  X,
  Briefcase,
  FileText,
  Lock,
  HeartHandshake,
  TrendingUp as TrendingUpIcon,
  GraduationCap,
} from 'lucide-react';

const BRAND = { primary: '#1E3A8A', secondary: '#14B8A6' };

// ============================================================
// ParticleCanvas
// ============================================================
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (error) return;
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationId: number;
      let particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      const createParticles = () => {
        const count = Math.floor((canvas.width * canvas.height) / 10000);
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2.5 + 1,
          opacity: Math.random() * 0.6 + 0.2,
        }));
      };

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(20, 184, 166, ${p.opacity})`;
          ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(30, 58, 138, ${0.1 * (1 - dist / 130)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        animationId = requestAnimationFrame(animate);
      };

      resize();
      createParticles();
      animate();

      window.addEventListener('resize', () => {
        resize();
        createParticles();
      });

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
      };
    } catch (err) {
      console.warn('ParticleCanvas error:', err);
      setError(true);
    }
  }, [error]);

  if (error) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ============================================================
// RotatingCube
// ============================================================
const RotatingCube = () => {
  const cubeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (error) return;
    try {
      let angleX = 0;
      let angleY = 0;
      let targetAngleX = 0;
      let targetAngleY = 0;
      let animationId: number;

      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        targetAngleY = x * 0.08;
        targetAngleX = -y * 0.08;
      };

      const animate = () => {
        if (!cubeRef.current) return;
        angleX += (targetAngleX - angleX) * 0.1;
        angleY += (targetAngleY - angleY) * 0.1;
        cubeRef.current.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
        animationId = requestAnimationFrame(animate);
      };

      window.addEventListener('mousemove', handleMouseMove);
      animate();

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationId);
      };
    } catch (err) {
      console.warn('RotatingCube error:', err);
      setError(true);
    }
  }, [error]);

  if (error) {
    return (
      <div className="w-52 h-52 mx-auto flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-[#1E3A8A] shadow-2xl">
        {!logoError ? (
          <Image
            src="/logo.png"
            alt="بازار هوشمند فناوری و نوآوری"
            width={120}
            height={120}
            className="object-contain p-3"
            onError={() => setLogoError(true)}
            priority
          />
        ) : (
          <span className="text-[#1E3A8A] font-black text-5xl">ب</span>
        )}
      </div>
    );
  }

  const faces = [
    { type: 'logo' },
    { type: 'icon', icon: ShoppingBag, color: '#1E3A8A' },
    { type: 'icon', icon: Lightbulb, color: '#14B8A6' },
    { type: 'icon', icon: Rocket, color: '#D4A547' },
    { type: 'icon', icon: Shield, color: '#1E3A8A' },
    { type: 'icon', icon: BarChart3, color: '#14B8A6' },
  ];

  const rotations = [
    'rotateY(0deg) translateZ(104px)',
    'rotateY(90deg) translateZ(104px)',
    'rotateY(180deg) translateZ(104px)',
    'rotateY(-90deg) translateZ(104px)',
    'rotateX(90deg) translateZ(104px)',
    'rotateX(-90deg) translateZ(104px)',
  ];

  return (
    <div ref={containerRef} className="w-52 h-52 mx-auto perspective-1000">
      <div
        ref={cubeRef}
        className="w-full h-full relative transform-style-3d"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {faces.map((face, i) => {
          const isLogo = face.type === 'logo';
          return (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm border-2 shadow-2xl overflow-hidden"
              style={{
                transform: rotations[i],
                borderColor: isLogo ? '#1E3A8A' : (face as any).color,
                boxShadow: isLogo
                  ? '0 0 30px rgba(30,58,138,0.5)'
                  : `0 0 30px ${(face as any).color}50`,
              }}
            >
              {isLogo ? (
                !logoError ? (
                  <Image
                    src="/logo.png"
                    alt="بازار هوشمند فناوری و نوآوری"
                    fill
                    className="object-contain p-3"
                    onError={() => setLogoError(true)}
                    priority
                  />
                ) : (
                  <span className="text-[#1E3A8A] font-black text-5xl">ب</span>
                )
              ) : (
                <face.icon size={52} color={(face as any).color} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// TypingHeadline
// ============================================================
const rotatingWords = ['محصولات', 'خدمات', 'راهکارها', 'نوآوری‌ها'];
const TypingHeadline = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentWord = rotatingWords[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!deleting && charIndex < currentWord.length) {
      timeout = setTimeout(() => setCharIndex(charIndex + 1), 120);
    } else if (!deleting && charIndex === currentWord.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => setCharIndex(charIndex - 1), 60);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, wordIndex]);

  return (
    <span className="inline-block min-w-[140px] text-right">
      <span className="bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] bg-clip-text text-transparent">
        {rotatingWords[wordIndex].substring(0, charIndex)}
      </span>
      <span className="animate-pulse text-[#14B8A6] font-light">|</span>
    </span>
  );
};

// ============================================================
// AnimatedCounter
// ============================================================
const AnimatedCounter = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] bg-clip-text text-transparent">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

// ============================================================
// TiltCard
// ============================================================
const TiltCard = ({ role, index }: { role: any; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setTilt({ x: rotateX, y: rotateY });
    setGlow({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlow({ x: 50, y: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Link
        href="/login"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative block rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 p-6 transition-all duration-300 overflow-hidden"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          boxShadow: `0 15px 35px -10px rgba(0,0,0,0.15), 0 0 25px rgba(20,184,166,0.15)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(20,184,166,0.25), transparent 60%)`,
          }}
        />
        {role.popular && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] text-white text-xs font-bold shadow-lg z-10">
            محبوب
          </div>
        )}
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-gradient-to-br group-hover:from-[#1E3A8A] group-hover:to-[#14B8A6] group-hover:text-white transition-all duration-300">
            <role.icon size={26} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mb-1">{role.label}</h3>
          <p className="text-sm text-slate-500 leading-6">{role.desc}</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-bold text-[#14B8A6] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            ورود به این نقش
            <ArrowLeft size={16} className="rotate-180" />
          </div>
        </div>
      </Link>
    </div>
  );
};

// ============================================================
// ServicesSection
// ============================================================
const ServicesSection = () => {
  const services = [
    {
      title: 'دارایی نامشهود',
      icon: Briefcase,
      items: [
        'تشخیص هوشمند',
        'ارزیابی کمی و ارزش‌گذاری کیفی', // ترکیب شده
        'صدور گواهی دیجیتال ', // مشاوره در آخر
      'مشاوره تخصصی',
      ],
    },
    {
      title: 'خدمات حقوقی',
      icon: FileText,
      items: [
        'ثبت مالکیت فکری',
        'مدیریت ادعا',
        'داوری اختلافات',
        'مشاوره حقوقی', // مشاوره در آخر
      ],
    },
    {
      title: 'امنیت فنی',
      icon: Lock,
      items: [
        'مشاوره امنیت فنی',
        'مشاوره فنی مجوزها', // هر دو مشاوره هستند
      ],
    },
    {
      title: 'بیمه',
      icon: HeartHandshake,
      items: [
        'صدور بیمه‌نامه',
        'تدوین گزارش ریسک',
        'مشاوره تخصصی', // مشاوره در آخر
      ],
    },
    {
      title: 'تجاری‌سازی',
      icon: TrendingUpIcon,
      items: [
        'تحلیل بازار و رقبا',
        'قیمت‌گذاری', // جدا
        'برندسازی و صادرات', // ترکیب برندسازی و صادرات
      'مشاوره تخصصی',
      ],
    },
    {
      title: 'توانمندسازی',
      icon: GraduationCap,
      items: [
        'پرورش مدیر IA',
        'پرورش ممیز IA',
        'پرورش منتور IA',
        'پرورش پارادیپلمات فناوری',
      ],
    },
  ];

  return (
    <section className="relative z-20 bg-gradient-to-br from-[#1E3A8A08] to-[#14B8A608] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            خدمات بازار تحول
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            مجموعه‌ای از خدمات تخصصی برای پشتیبانی از مسیر فناوری، نوآوری و
            دارایی‌های نامشهود
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1E3A8A15] to-[#14B8A615] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-6 h-6 text-[#1E3A8A] group-hover:text-[#14B8A6] transition-colors" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {service.title}
                </h3>
              </div>
              <ul className="space-y-2 pr-2">
                {service.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-[#14B8A6] text-lg leading-none">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================
// صفحه اصلی
// ============================================================
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (err) {
      console.error('HomePage mount error:', err);
      setRenderError('خطا در بارگذاری صفحه');
    }
  }, []);

  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">خطا در بارگذاری صفحه</h2>
          <p className="text-slate-600">{renderError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-[#1E3A8A] text-white rounded-xl hover:bg-[#1E3A8A]/90"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <p className="text-slate-500 text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // ===== نقش‌ها (۶ نقش) =====
  const roles = [
    {
      id: 'buyer_product',
      label: 'خریدار محصول فناورانه',
      desc: 'جستجو و خرید محصولات فناورانه',
      icon: ShoppingBag,
      popular: true,
    },
    {
      id: 'buyer_service',
      label: 'خریدار خدمت نوآورانه',
      desc: 'جستجو و خرید خدمات تخصصی',
      icon: Wrench,
    },
    {
      id: 'supplier_product',
      label: 'عرضه‌کننده محصول',
      desc: 'ثبت و عرضه محصولات فناورانه',
      icon: Package,
      popular: true,
    },
    {
      id: 'supplier_service',
      label: 'عرضه‌کننده خدمت',
      desc: 'ارائه خدمات تخصصی و مشاوره‌ای',
      icon: Settings,
    },
    {
      id: 'need_registerer',
      label: 'ثبت‌کننده نیاز فناورانه',
      desc: 'اعلام نیازها و چالش‌های فناورانه',
      icon: Lightbulb,
    },
    {
      id: 'investor',
      label: 'تامین مالی',
      desc: 'تامین مالی و سرمایه‌گذاری در طرح‌های نوآورانه',
      icon: TrendingUp,
    },
  ];

  const stats = [
    { label: 'محصول فناورانه', value: 2500, suffix: '+' },
    { label: 'شرکت دانش‌بنیان', value: 800, suffix: '+' },
    { label: 'معامله موفق', value: 1200, suffix: '+' },
    { label: 'صنعت فعال', value: 30, suffix: '+' },
  ];

  const features = [
    {
      icon: Target,
      title: 'تطبیق هوشمند',
      desc: 'اتصال دقیق نیازها به راهکارهای فناورانه با هوش مصنوعی',
    },
    {
      icon: Shield,
      title: 'اعتبارسنجی حرفه‌ای',
      desc: 'احراز هویت و ارزیابی تخصصی تمام طرفین معامله',
    },
    {
      icon: BarChart3,
      title: 'تحلیل بازار',
      desc: 'داده‌کاوی روندها، فرصت‌ها و شکاف‌های بازار فناوری',
    },
    {
      icon: Rocket,
      title: 'اجرای پروژه',
      desc: 'مدیریت کامل از مذاکره تا تحویل و پشتیبانی',
    },
  ];

  const videoSrc = '/videos/intro.mp4';

  return (
    <div
      className="min-h-screen relative"
      style={{ fontFamily: "'Vazir', 'Vazirmatn', Tahoma, sans-serif" }}
      dir="rtl"
    >
      <ParticleCanvas />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A15] via-transparent to-[#14B8A615] z-10" />
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${BRAND.primary} 0%, ${BRAND.secondary} 70%)`,
            }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="mb-12">
            <RotatingCube />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1E3A8A20] to-[#14B8A620] border border-[#14B8A650] text-sm font-medium text-[#1E3A8A] mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-[#14B8A6]" />
            بازار هوشمند فناوری، نوآوری و دارایی‌های نامشهود
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
            بازار هوشمند <TypingHeadline />
            <br />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-700">
              فناوری، نوآوری و دارایی‌های نامشهود
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            پلتفرم جامع اتصال خریداران، عرضه‌کنندگان، سرمایه‌گذاران و مشاوران
            فناوری. از ثبت نیاز تا اجرای پروژه، همه در یک اکوسیستم هوشمند.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
              }}
            >
              <span className="relative z-10">شروع کنید — رایگان ثبت‌نام کنید</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
            </Link>
            <button
              onClick={() => setShowVideo(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-[#1E3A8A] border-2 border-[#1E3A8A30] hover:border-[#1E3A8A] hover:bg-[#1E3A8A08] transition flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Play size={20} className="text-[#14B8A6]" />
              ویدئو معرفی
            </button>
          </div>
        </div>

        {showVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowVideo(false)}
          >
            <div
              className="relative bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm text-slate-600 hover:text-slate-900 hover:bg-white transition"
              >
                <X size={24} />
              </button>
              <div className="aspect-video bg-slate-900 flex items-center justify-center">
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                  poster="/video-poster.png"
                >
                  <source src={videoSrc} type="video/mp4" />
                  مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
                </video>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===== آمار ===== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 p-5 text-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== نقش‌ها ===== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            با چه نقشی وارد می‌شوید؟
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            نقش خود را انتخاب کنید و وارد اکوسیستم هوشمند بازار شوید
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <TiltCard key={role.id} role={role} index={i} />
          ))}
        </div>
      </section>

      {/* ===== خدمات بازار تحول ===== */}
      <ServicesSection />

      {/* ===== ویژگی‌ها ===== */}
      <section className="relative z-20 bg-gradient-to-br from-[#1E3A8A08] to-[#14B8A608] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              چرا بازار هوشمند فناوری و نوآوری؟
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              پلتفرمی فراتر از یک بازار ساده؛ اکوسیستم کامل مدیریت فناوری و
              نوآوری
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 p-6 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1E3A8A15] to-[#14B8A615] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-[#1E3A8A] group-hover:text-[#14B8A6] transition-colors" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-6">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#1E3A8A] to-[#14B8A6] p-8 sm:p-12 text-center text-white shadow-2xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#14B8A6] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse-slow" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Star className="w-4 h-4 text-[#F59E0B]" fill="#F59E0B" />
              فرصت محدود: ثبت‌نام رایگان تا پایان ماه
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              آماده ورود به بازار فناوری و نوآوری هستید؟
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              همین حالا ثبت‌نام کنید و محصولات، نیازها و فرصت‌های همکاری خود را
              در بزرگترین بازار هوشمند فناوری ایران مدیریت کنید.
            </p>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#1E3A8A] font-bold text-base shadow-2xl hover:scale-105 transition-all duration-300"
            >
              شروع ثبت‌نام رایگان
              <ChevronLeft size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== فوتر ===== */}
      <footer className="relative z-20 border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {!logoError ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-0.5">
                <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="بازار هوشمند فناوری و نوآوری"
                    fill
                    className="object-contain p-1"
                    onError={() => setLogoError(true)}
                  />
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#14B8A6] p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <span className="text-[#1E3A8A] font-black text-sm">ب</span>
                </div>
              </div>
            )}
            <span className="text-lg font-black text-slate-900">
              بازار هوشمند فناوری و نوآوری
            </span>
          </div>
          <p className="text-sm text-slate-500">
            پلتفرم هوشمند مدیریت تعاملات فناورانه — نسخه ۱.۰
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}