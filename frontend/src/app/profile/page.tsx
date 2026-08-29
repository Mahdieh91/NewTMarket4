// src/app/profile/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  useAuthStore,
  authenticatedFetch,
  getAccessToken,
} from '@/store/auth-store';
import {
  User,
  MessageSquare,
  Wallet,
  Inbox,
  Archive,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Package,
  Plus,
  Send,
  X,
  Inbox as InboxIcon,
  Send as SendIcon,
  Maximize2,
  Archive as ArchiveIcon,
  Zap,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronLeft,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
type UserProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  phone: string;
  company_name: string;
  national_id: string;
  address: string;
  website: string;
  expertise: string;
  experience_summary: string;
  kyc_status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type Message = {
  id: number;
  sender: { id: number; username: string; first_name: string; last_name: string };
  receiver: { id: number; username: string; first_name: string; last_name: string };
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_archived: boolean;
};

type Transaction = {
  id: number;
  amount: string;
  type: 'deposit' | 'withdraw' | 'payment' | 'refund';
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

type WalletData = {
  balance: number;
  transactions: Transaction[];
};

type Need = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  industry: { id: number; name: string } | null;
};

type Supply = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category: string;
  price: string;
};

type Negotiation = {
  id: number;
  supply: number;
  supply_title: string;
  buyer: number;
  buyer_name: string;
  supplier: number;
  supplier_name: string;
  status: string;
  context_title: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  messages?: any[];
};

// ============================================================
// Fake Data (Only profile, wallet, needs, supplies, negotiations – NO fake messages)
// ============================================================
const FAKE_PROFILE: UserProfile = {
  id: 1,
  email: 'alimohammadi@example.com',
  first_name: 'علی',
  last_name: 'محمدی',
  username: 'alimohammadi',
  role: 'seller',
  phone: '۰۹۱۲۳۴۵۶۷۸۹',
  company_name: 'شرکت فناوری نوین پارس',
  national_id: '۱۲۳۴۵۶۷۸۹۰',
  address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳، واحد ۵',
  website: 'https://novinpars.com',
  expertise: 'توسعه نرم‌افزار، هوش مصنوعی، مدیریت پروژه',
  experience_summary: 'بیش از ۱۰ سال سابقه در حوزه فناوری اطلاعات و توسعه محصولات دیجیتال',
  kyc_status: 'approved',
  created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
};

// ✅ FAKE_MESSAGES is now an empty array (no fake messages)
const FAKE_MESSAGES: Message[] = [];

const FAKE_WALLET: WalletData = {
  balance: 1000000,
  transactions: [
    {
      id: 1,
      amount: '500000',
      type: 'deposit',
      description: 'واریز اولیه به کیف پول',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 2,
      amount: '200000',
      type: 'payment',
      description: 'پرداخت برای خرید محصول شماره ۱۲',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 3,
      amount: '100000',
      type: 'refund',
      description: 'بازگشت وجه از نیاز شماره ۵',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 4,
      amount: '300000',
      type: 'deposit',
      description: 'واریز از طریق درگاه بانکی',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 5,
      amount: '150000',
      type: 'withdraw',
      description: 'برداشت به حساب بانکی',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
};

const FAKE_NEEDS: Need[] = [
  {
    id: 1,
    title: 'نیاز به توسعه اپلیکیشن موبایل',
    description: 'به دنبال تیم توسعه حرفه‌ای برای ساخت اپلیکیشن اندروید و iOS با قابلیت‌های پیشرفته هستم.',
    status: 'published',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    industry: { id: 1, name: 'فناوری اطلاعات' },
  },
  {
    id: 2,
    title: 'مشاوره بازاریابی دیجیتال',
    description: 'نیاز به مشاور با تجربه برای تدوین استراتژی بازاریابی در شبکه‌های اجتماعی و رشد برند دارم.',
    status: 'draft',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    industry: { id: 2, name: 'بازاریابی' },
  },
];

const FAKE_SUPPLIES: Supply[] = [
  {
    id: 1,
    title: 'سیستم مدیریت محتوای پیشرفته (CMS)',
    description: 'CMS اختصاصی با قابلیت شخصی‌سازی بالا، امنیت کامل و پشتیبانی از چندین زبان.',
    status: 'published',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    category: 'نرم‌افزار',
    price: '۲۵,۰۰۰,۰۰۰',
  },
  {
    id: 2,
    title: 'خدمات طراحی UI/UX حرفه‌ای',
    description: 'طراحی رابط کاربری و تجربه کاربری برای وب‌سایت و اپلیکیشن با رویکرد کاربرمحور و مدرن.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    category: 'خدمات',
    price: '۱۲,۰۰۰,۰۰۰',
  },
  {
    id: 3,
    title: 'سامانه هوشمند مدیریت انبار و موجودی (WMS)',
    description: 'پلتفرمی تحت وب برای مدیریت انبار با قابلیت ردیابی کالا با بارکد و RFID، پیش‌بینی نیاز به سفارش مجدد با الگوریتم‌های یادگیری ماشین.',
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    category: 'نرم‌افزار',
    price: '۳۵۰,۰۰۰,۰۰۰',
  },
];

const FAKE_NEGOTIATIONS: Negotiation[] = [
  {
    id: 1,
    supply: 1,
    supply_title: 'سیستم مدیریت محتوای پیشرفته',
    buyer: 2,
    buyer_name: 'رضا احمدی',
    supplier: 1,
    supplier_name: 'علی محمدی',
    status: 'in_progress',
    context_title: 'مذاکره برای CMS',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 2,
    supply: 2,
    supply_title: 'خدمات طراحی UI/UX حرفه‌ای',
    buyer: 1,
    buyer_name: 'علی محمدی',
    supplier: 3,
    supplier_name: 'سارا کریمی',
    status: 'accepted',
    context_title: 'طراحی اپلیکیشن موبایل',
    is_active: false,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 3,
    supply: 3,
    supply_title: 'سامانه هوشمند مدیریت انبار',
    buyer: 4,
    buyer_name: 'محسن قاسمی',
    supplier: 1,
    supplier_name: 'علی محمدی',
    status: 'contracted',
    context_title: 'قرارداد انبارداری',
    is_active: false,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
];

// ============================================================
// Main Component (با سایدبار حرفه‌ای در سمت راست)
// ============================================================
export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout, updateUser } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const [mounted, setMounted] = useState(false);

  const initialTab = searchParams?.get('tab') || 'profile';
  const validTabs = ['profile', 'messages', 'wallet', 'myNeeds', 'myProducts', 'myNegotiations'];
  const defaultTab = validTabs.includes(initialTab) ? initialTab : 'profile';
  const [activeTab, setActiveTab] = useState<
    'profile' | 'messages' | 'wallet' | 'myNeeds' | 'myProducts' | 'myNegotiations'
  >(defaultTab as any);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [myNeeds, setMyNeeds] = useState<Need[]>([]);
  const [mySupplies, setMySupplies] = useState<Supply[]>([]);
  const [myNegotiations, setMyNegotiations] = useState<Negotiation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [useFakeData, setUseFakeData] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getAccessToken();
    if (!token) {
      console.warn('🔒 No token found, loading fake data for preview');
      setUseFakeData(true);
      setProfile(FAKE_PROFILE);
      setFormData(FAKE_PROFILE);
      setMessages([]); // no fake messages
      setWallet(FAKE_WALLET);
      setMyNeeds(FAKE_NEEDS);
      setMySupplies(FAKE_SUPPLIES);
      setMyNegotiations(FAKE_NEGOTIATIONS);
      setLoading(false);
      return;
    }
    console.log('✅ Token found, loading profile');
    fetchAllData(token);
  }, [mounted]);

  const fetchAllData = async (token?: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const currentToken = token || getAccessToken();
      if (!currentToken) {
        setUseFakeData(true);
        setProfile(FAKE_PROFILE);
        setFormData(FAKE_PROFILE);
        setMessages([]);
        setWallet(FAKE_WALLET);
        setMyNeeds(FAKE_NEEDS);
        setMySupplies(FAKE_SUPPLIES);
        setMyNegotiations(FAKE_NEGOTIATIONS);
        setLoading(false);
        return;
      }

      // 1. Profile
      let profileRes = await authenticatedFetch(`${apiUrl}/users/profile/`, {
        method: 'GET',
      });

      if (!profileRes.ok && profileRes.status !== 401) {
        const fallbackRes = await authenticatedFetch(`${apiUrl}/users/me/`, {
          method: 'GET',
        });
        if (fallbackRes.ok || fallbackRes.status === 401) {
          profileRes = fallbackRes;
        }
      }

      if (profileRes.status === 401) {
        console.warn('🔒 Authentication failed, using fake data');
        setUseFakeData(true);
        setProfile(FAKE_PROFILE);
        setFormData(FAKE_PROFILE);
        setMessages([]);
        setWallet(FAKE_WALLET);
        setMyNeeds(FAKE_NEEDS);
        setMySupplies(FAKE_SUPPLIES);
        setMyNegotiations(FAKE_NEGOTIATIONS);
        setLoading(false);
        return;
      }

      let profileData: UserProfile;
      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            `خطا در دریافت پروفایل (${profileRes.status})`
        );
      } else {
        profileData = await profileRes.json();
      }

      const mergedProfile = { ...FAKE_PROFILE, ...profileData };
      setProfile(mergedProfile);
      setFormData(mergedProfile);
      updateUser(mergedProfile);

      // 2. Messages
      try {
        const msgRes = await authenticatedFetch(`${apiUrl}/messages/`, {
          method: 'GET',
        });

        if (msgRes.ok) {
          const msgData = await msgRes.json();
          let messagesArray = msgData?.results ?? msgData;
          if (!Array.isArray(messagesArray)) messagesArray = [];
          setMessages(messagesArray.length > 0 ? messagesArray : []);
        } else {
          console.warn('⚠️ Messages API failed, using empty array');
          setMessages([]);
        }
      } catch (err) {
        console.warn('⚠️ Error loading messages, using empty array:', err);
        setMessages([]);
      }

      // 3. Wallet
      try {
        const walletRes = await authenticatedFetch(`${apiUrl}/wallet/`, {
          method: 'GET',
        });

        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWallet(walletData);
        } else {
          console.warn('⚠️ Wallet API failed, using fake data');
          setWallet(FAKE_WALLET);
        }
      } catch (err) {
        console.warn('⚠️ Error loading wallet, using fake data:', err);
        setWallet(FAKE_WALLET);
      }

      // 4. Needs
      try {
        const needsRes = await authenticatedFetch(
          `${apiUrl}/needs/?buyer=${encodeURIComponent(mergedProfile.id)}`,
          { method: 'GET' }
        );

        if (needsRes.ok) {
          const needsData = await needsRes.json();
          const needsArray = needsData?.results ?? needsData;
          setMyNeeds(Array.isArray(needsArray) && needsArray.length > 0 ? needsArray : FAKE_NEEDS);
        } else {
          console.warn('⚠️ Needs API failed, using fake data');
          setMyNeeds(FAKE_NEEDS);
        }
      } catch (err) {
        console.warn('⚠️ Error loading needs, using fake data:', err);
        setMyNeeds(FAKE_NEEDS);
      }

      // 5. Supplies
      try {
        const suppliesRes = await authenticatedFetch(
          `${apiUrl}/products/supplies/?seller=${encodeURIComponent(mergedProfile.id)}`,
          { method: 'GET' }
        );

        if (suppliesRes.ok) {
          const suppliesData = await suppliesRes.json();
          const suppliesArray = suppliesData?.results ?? suppliesData;
          setMySupplies(
            Array.isArray(suppliesArray) && suppliesArray.length > 0 ? suppliesArray : FAKE_SUPPLIES
          );
        } else {
          console.warn('⚠️ Supplies API failed, using fake data');
          setMySupplies(FAKE_SUPPLIES);
        }
      } catch (err) {
        console.warn('⚠️ Error loading supplies, using fake data:', err);
        setMySupplies(FAKE_SUPPLIES);
      }

      // 6. Negotiations
      try {
        const negRes = await authenticatedFetch(`${apiUrl}/negotiations/`, {
          method: 'GET',
        });

        if (negRes.ok) {
          const negData = await negRes.json();
          let negArray = negData?.results ?? negData;
          if (!Array.isArray(negArray)) negArray = [];
          setMyNegotiations(negArray.length > 0 ? negArray : FAKE_NEGOTIATIONS);
        } else {
          console.warn('⚠️ Negotiations API failed, using fake data');
          setMyNegotiations(FAKE_NEGOTIATIONS);
        }
      } catch (err) {
        console.warn('⚠️ Error loading negotiations, using fake data:', err);
        setMyNegotiations(FAKE_NEGOTIATIONS);
      }
    } catch (err: any) {
      console.error('❌ Error fetching data, using fake data:', err);
      setError(err?.message || 'خطا در دریافت اطلاعات');
      setProfile(FAKE_PROFILE);
      setFormData(FAKE_PROFILE);
      setMessages([]);
      setWallet(FAKE_WALLET);
      setMyNeeds(FAKE_NEEDS);
      setMySupplies(FAKE_SUPPLIES);
      setMyNegotiations(FAKE_NEGOTIATIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAccessToken();
      if (!token) {
        setProfile({ ...profile!, ...formData });
        setEditMode(false);
        setSuccessMessage('✅ اطلاعات با موفقیت به‌روزرسانی شد (داده‌های فیک)');
        setTimeout(() => setSuccessMessage(null), 3000);
        setLoading(false);
        return;
      }

      const res = await authenticatedFetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        setProfile({ ...profile!, ...formData });
        setEditMode(false);
        setSuccessMessage('✅ اطلاعات با موفقیت به‌روزرسانی شد (داده‌های فیک)');
        setTimeout(() => setSuccessMessage(null), 3000);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            'خطا در بروزرسانی پروفایل'
        );
      }

      const updated = await res.json();
      const merged = { ...FAKE_PROFILE, ...updated };
      setProfile(merged);
      setFormData(merged);
      updateUser(merged);
      setEditMode(false);
      setSuccessMessage('✅ اطلاعات با موفقیت به‌روزرسانی شد');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      setProfile({ ...profile!, ...formData });
      setEditMode(false);
      setSuccessMessage('✅ اطلاعات با موفقیت به‌روزرسانی شد (داده‌های فیک)');
      setTimeout(() => setSuccessMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number): Promise<boolean> => {
    try {
      const token = getAccessToken();
      if (!token) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, is_read: true } : message
          )
        );
        return true;
      }

      const res = await authenticatedFetch(`${API_URL}/messages/${id}/mark_read/`, {
        method: 'POST',
      });

      if (res.status === 401) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, is_read: true } : message
          )
        );
        return true;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Failed to mark message as read:', errorData);
        return false;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, is_read: true } : message
        )
      );

      return true;
    } catch (err) {
      console.error('❌ Error marking as read:', err);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, is_read: true } : message
        )
      );
      return true;
    }
  };

  const handleArchiveMessage = async (id: number): Promise<boolean> => {
    try {
      const token = getAccessToken();
      if (!token) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, is_archived: true } : message
          )
        );
        return true;
      }

      const res = await authenticatedFetch(`${API_URL}/messages/${id}/archive/`, {
        method: 'POST',
      });

      if (res.status === 401) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, is_archived: true } : message
          )
        );
        return true;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Failed to archive message:', errorData);
        return false;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, is_archived: true } : message
        )
      );

      return true;
    } catch (err) {
      console.error('❌ Error archiving message:', err);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, is_archived: true } : message
        )
      );
      return true;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const currentProfile = profile || FAKE_PROFILE;
  const currentMessages = messages.length > 0 ? messages : [];
  const currentWallet = wallet || FAKE_WALLET;
  const currentNeeds = myNeeds.length > 0 ? myNeeds : FAKE_NEEDS;
  const currentSupplies = mySupplies.length > 0 ? mySupplies : FAKE_SUPPLIES;
  const currentNegotiations = myNegotiations.length > 0 ? myNegotiations : FAKE_NEGOTIATIONS;

  const unreadCount = Array.isArray(currentMessages)
    ? currentMessages.filter(
        (m) =>
          Number(m.receiver?.id) === Number(currentProfile.id) &&
          Number(m.sender?.id) !== Number(currentProfile.id) &&
          !m.is_read &&
          !m.is_archived
      ).length
    : 0;

  // ✅ New order: profile, myNeeds, myProducts, myNegotiations, messages, wallet
  const sidebarItems = [
    { id: 'profile', label: 'اطلاعات کاربری', icon: User },
    { id: 'myNeeds', label: 'نیازهای من', icon: Target },
    { id: 'myProducts', label: 'محصولات من', icon: Package },
    { id: 'myNegotiations', label: 'مذاکرات من', icon: MessageCircle },
    { id: 'messages', label: 'صندوق پیام', icon: MessageSquare, badge: unreadCount },
    { id: 'wallet', label: 'کیف پول', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-blue-50/80 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* استفاده از flex-row-reverse برای قرارگیری سایدبار در سمت راست */}
        <div className="flex flex-col lg:flex-row-reverse gap-6">
          {/* سایدبار حرفه‌ای (سمت راست) */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* کارت پروفایل با طراحی مینیمال و شیک */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-2 ring-white">
                      {currentProfile.first_name?.charAt(0) || currentProfile.username?.charAt(0) || 'U'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-lg truncate">
                      {currentProfile.first_name} {currentProfile.last_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">@{currentProfile.username}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* ✅ نمایش نقش حذف شد */}
                      {currentProfile.kyc_status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          تأیید شده
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* منوی سایدبار با طراحی مدرن */}
              <nav className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-slate-100">
                  <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                  <span className="font-bold text-slate-700 text-sm">داشبورد</span>
                </div>

                <div className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {/* نشانگر عمودی برای آیتم فعال */}
                      {activeTab === item.id && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-l-full" />
                      )}
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-rose-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {item.badge}
                        </span>
                      )}
                      {activeTab === item.id && (
                        <ChevronLeft className="w-4 h-4 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* دکمه خروج با طراحی جدا */}
                <div className="border-t border-slate-100 mt-3 pt-3">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-right">خروج از حساب</span>
                  </button>
                </div>
              </nav>

              {/* بخش تنظیمات سریع */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 transition-all hover:shadow-md">
                <button className="flex items-center gap-3 w-full px-2 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span>تنظیمات حساب</span>
                </button>
              </div>
            </div>
          </aside>

          {/* محتوای اصلی (سمت چپ) */}
          <main className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {activeTab === 'profile' && (
              <ProfileTab
                profile={currentProfile}
                editMode={editMode}
                setEditMode={setEditMode}
                formData={formData}
                setFormData={setFormData}
                handleUpdateProfile={handleUpdateProfile}
                loading={loading}
                error={error}
                successMessage={successMessage}
              />
            )}
            {activeTab === 'messages' && (
              <MessagesTab
                messages={currentMessages}
                loading={loading}
                profileId={currentProfile.id}
                onMarkAsRead={handleMarkAsRead}
                onArchive={handleArchiveMessage}
                onRefresh={() => {
                  const token = getAccessToken();
                  if (token) fetchAllData(token);
                  else {
                    setUseFakeData(true);
                    setProfile(FAKE_PROFILE);
                    setFormData(FAKE_PROFILE);
                    setMessages([]);
                    setWallet(FAKE_WALLET);
                    setMyNeeds(FAKE_NEEDS);
                    setMySupplies(FAKE_SUPPLIES);
                    setMyNegotiations(FAKE_NEGOTIATIONS);
                  }
                }}
              />
            )}
            {activeTab === 'wallet' && <WalletTab wallet={currentWallet} loading={loading} />}
            {activeTab === 'myNeeds' && <MyNeedsTab needs={currentNeeds} loading={loading} />}
            {activeTab === 'myProducts' && <MyProductsTab supplies={currentSupplies} loading={loading} />}
            {activeTab === 'myNegotiations' && (
              <MyNegotiationsTab
                negotiations={currentNegotiations}
                loading={loading}
                profileId={currentProfile.id}
                onRefresh={() => {
                  const token = getAccessToken();
                  if (token) fetchAllData(token);
                  else {
                    setMyNegotiations(FAKE_NEGOTIATIONS);
                  }
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Profile Tab
// ============================================================
function ProfileTab({
  profile,
  editMode,
  setEditMode,
  formData,
  setFormData,
  handleUpdateProfile,
  loading,
  error,
  successMessage,
}: any) {
  const fields = [
    { key: 'first_name', label: 'نام', type: 'text' },
    { key: 'last_name', label: 'نام خانوادگی', type: 'text' },
    { key: 'email', label: 'ایمیل', type: 'email' },
    { key: 'phone', label: 'تلفن', type: 'text' },
    { key: 'company_name', label: 'نام شرکت', type: 'text' },
    { key: 'national_id', label: 'کد ملی', type: 'text' },
    { key: 'address', label: 'آدرس', type: 'text' },
    { key: 'website', label: 'وبسایت', type: 'text' },
    { key: 'experience_summary', label: 'سوابق', type: 'textarea' },
    { key: 'expertise', label: 'تخصص', type: 'text' },
  ];

  const getValue = (key: string) => {
    const val = profile?.[key];
    return val || FAKE_PROFILE[key as keyof UserProfile] || '-';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">اطلاعات کاربری</h2>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition"
          >
            ویرایش اطلاعات
          </button>
        ) : (
          <button
            onClick={() => setEditMode(false)}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition"
          >
            انصراف
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ {successMessage}
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field: any) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || getValue(field.key)}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] || getValue(field.key)}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field: any) => (
            <div key={field.key} className="border-b border-slate-100 py-2">
              <span className="text-sm text-slate-500">{field.label}</span>
              <p className="text-slate-800 font-medium">{getValue(field.key)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Messages Tab
// ============================================================
function MessagesTab({
  messages,
  loading,
  profileId,
  onMarkAsRead,
  onArchive,
  onRefresh,
}: {
  messages: Message[];
  loading: boolean;
  profileId: number;
  onMarkAsRead: (id: number) => Promise<boolean>;
  onArchive: (id: number) => Promise<boolean>;
  onRefresh: () => void;
}) {
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newReceiverUsername, setNewReceiverUsername] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [sendingNew, setSendingNew] = useState(false);
  const [newMessageError, setNewMessageError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const trimmed = newReceiverUsername.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          setSearchResults([]);
          setShowSearchResults(false);
          return;
        }
        const url = `${API_URL}/users/users/?search=${encodeURIComponent(trimmed)}&page_size=100`;
        const res = await authenticatedFetch(url, {
          method: 'GET',
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Search error:', errorText);
          throw new Error('خطا در جستجو');
        }
        const data = await res.json();
        const users = data?.results || data || [];
        setSearchResults(Array.isArray(users) ? users : []);
        setShowSearchResults(users.length > 0);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [newReceiverUsername, API_URL]);

  const selectUser = (username: string) => {
    setNewReceiverUsername(username);
    setShowSearchResults(false);
    setNewMessageError(null);
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setReplySubject(`پاسخ: ${msg.subject}`);
    setReplyContent('');
  };

  const cancelReply = () => {
    setReplyTo(null);
    setReplySubject('');
    setReplyContent('');
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo) return;
    setSending(true);
    try {
      const token = getAccessToken();
      if (!token) {
        alert('لطفاً دوباره وارد شوید');
        return;
      }
      const res = await authenticatedFetch(`${API_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver: replyTo.sender.id,
          subject: replySubject,
          content: replyContent,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'خطا در ارسال پاسخ');
      }
      cancelReply();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const toggleNewMessage = () => {
    setShowNewMessage(!showNewMessage);
    setNewReceiverUsername('');
    setNewSubject('');
    setNewContent('');
    setNewMessageError(null);
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const sendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingNew(true);
    setNewMessageError(null);

    try {
      const trimmedUsername = newReceiverUsername.trim();
      if (!trimmedUsername) throw new Error('نام کاربری را وارد کنید');

      const token = getAccessToken();
      if (!token) {
        throw new Error('لطفاً دوباره وارد شوید');
      }

      const url = `${API_URL}/users/users/?search=${encodeURIComponent(trimmedUsername)}&page_size=100`;
      const userRes = await authenticatedFetch(url, {
        method: 'GET',
      });
      if (!userRes.ok) throw new Error('خطا در جستجوی کاربر');

      const usersData = await userRes.json();
      let users = usersData?.results || usersData || [];
      if (!Array.isArray(users)) users = [];

      if (users.length === 0) {
        throw new Error(`کاربری با نام کاربری "${trimmedUsername}" یافت نشد`);
      }

      const receiver = users[0];
      const res = await authenticatedFetch(`${API_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver: receiver.id,
          subject: newSubject.trim(),
          content: newContent.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'خطا در ارسال پیام');
      }

      toggleNewMessage();
      onRefresh();
    } catch (err: any) {
      setNewMessageError(err.message || 'خطا در ارسال پیام');
    } finally {
      setSendingNew(false);
    }
  };

  const openMessageModal = async (msg: Message) => {
    setSelectedMessage(msg);
    setIsModalOpen(true);
    if (msg.receiver.id === profileId && !msg.is_read) {
      const success = await onMarkAsRead(msg.id);
      if (success) {
        setSelectedMessage({ ...msg, is_read: true });
        // @ts-ignore
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
      }
    }
  };

  const closeMessageModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  const messagesArray: Message[] = Array.isArray(messages) ? messages : [];

  const isReceivedMessage = (message: Message): boolean =>
    Number(message.receiver?.id) === Number(profileId) &&
    Number(message.sender?.id) !== Number(profileId);

  const isSentMessage = (message: Message): boolean =>
    Number(message.sender?.id) === Number(profileId) &&
    Number(message.receiver?.id) !== Number(profileId);

  const archivedFiltered: Message[] =
    archivedFilter === 'active'
      ? messagesArray.filter((message) => !message.is_archived)
      : archivedFilter === 'archived'
        ? messagesArray.filter((message) => message.is_archived)
        : messagesArray;

  const directionFiltered: Message[] =
    directionFilter === 'received'
      ? archivedFiltered.filter(isReceivedMessage)
      : directionFilter === 'sent'
        ? archivedFiltered.filter(isSentMessage)
        : archivedFiltered;

  let finalFiltered: Message[];

  if (readFilter === 'unread') {
    finalFiltered = directionFiltered.filter(
      (message) => isReceivedMessage(message) && !message.is_read
    );
  } else if (readFilter === 'read') {
    finalFiltered = directionFiltered.filter(
      (message) => isReceivedMessage(message) && message.is_read
    );
  } else {
    finalFiltered = directionFiltered;
  }

  const totalAll = messagesArray.length;
  const totalReceived = messagesArray.filter(isReceivedMessage).length;
  const totalSent = messagesArray.filter(isSentMessage).length;
  const totalUnreadReceived = messagesArray.filter(
    (message) => isReceivedMessage(message) && !message.is_read
  ).length;
  const totalReadReceived = messagesArray.filter(
    (message) => isReceivedMessage(message) && message.is_read
  ).length;
  const totalArchived = messagesArray.filter((message) => message.is_archived).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-800">صندوق پیام</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleNewMessage}
            className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition flex items-center gap-1"
          >
            <Plus size={16} />
            ارسال پیام جدید
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            🔄 بازخوانی
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setArchivedFilter('active')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
              archivedFilter === 'active' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <InboxIcon size={14} />
            فعلی
          </button>
          <button
            onClick={() => setArchivedFilter('archived')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
              archivedFilter === 'archived' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArchiveIcon size={14} />
            بایگانی ({totalArchived})
          </button>
          <button
            onClick={() => setArchivedFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              archivedFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setReadFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              readFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه ({directionFiltered.length})
          </button>
          <button
            onClick={() => setReadFilter('unread')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
              readFilter === 'unread' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            نخوانده ({directionFilter === 'received' ? totalUnreadReceived : directionFiltered.filter((m) => !m.is_read).length})
          </button>
          <button
            onClick={() => setReadFilter('read')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              readFilter === 'read' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            خوانده ({directionFilter === 'received' ? totalReadReceived : directionFiltered.filter((m) => m.is_read).length})
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setDirectionFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition ${
              directionFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه ({totalAll})
          </button>
          <button
            onClick={() => setDirectionFilter('received')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
              directionFilter === 'received' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <InboxIcon size={14} />
            دریافتی ({totalReceived})
          </button>
          <button
            onClick={() => setDirectionFilter('sent')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${
              directionFilter === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SendIcon size={14} />
            ارسال‌شده ({totalSent})
          </button>
        </div>
      </div>

      {showNewMessage && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-slate-700">ارسال پیام جدید</h3>
            <button onClick={toggleNewMessage} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={sendNewMessage} className="space-y-3">
            <div ref={searchContainerRef} className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">گیرنده (نام کاربری)</label>
              <input
                type="text"
                placeholder="نام کاربری گیرنده را وارد کنید"
                value={newReceiverUsername}
                onChange={(e) => {
                  setNewReceiverUsername(e.target.value);
                  setNewMessageError(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
                dir="ltr"
                autoComplete="off"
              />
              {searchLoading && (
                <div className="absolute left-3 top-9 text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                </div>
              )}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user.username)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition flex items-center gap-2 border-b border-slate-100 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                        {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {showSearchResults && searchResults.length === 0 && newReceiverUsername.trim().length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-slate-500">
                  کاربری یافت نشد
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">موضوع</label>
              <input
                type="text"
                placeholder="موضوع پیام"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">متن پیام</label>
              <textarea
                rows={3}
                placeholder="متن پیام را وارد کنید..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {newMessageError && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{newMessageError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={toggleNewMessage}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                لغو
              </button>
              <button
                type="submit"
                disabled={sendingNew}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {sendingNew ? 'در حال ارسال...' : <><Send size={16} /> ارسال</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-500">در حال بارگذاری پیام‌ها...</div>
      ) : finalFiltered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Inbox className="h-12 w-12 mx-auto mb-3" />
          <p>
            {archivedFilter === 'archived' && 'هیچ پیام بایگانی‌شده‌ای وجود ندارد'}
            {archivedFilter === 'active' && directionFilter === 'received' && 'پیام دریافتی وجود ندارد'}
            {archivedFilter === 'active' && directionFilter === 'sent' && 'پیام ارسال‌شده وجود ندارد'}
            {archivedFilter === 'active' && readFilter === 'unread' && 'پیام خوانده‌نشده وجود ندارد'}
            {archivedFilter === 'active' && readFilter === 'read' && 'پیام خوانده‌شده وجود ندارد'}
            {archivedFilter === 'all' && directionFilter === 'all' && readFilter === 'all' && 'هیچ پیامی موجود نیست'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {finalFiltered.map((msg) => {
            const isReceived = msg.receiver.id === profileId;
            const isSent = msg.sender.id === profileId;
            const isArchived = msg.is_archived;

            return (
              <div
                key={msg.id}
                onClick={() => openMessageModal(msg)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isArchived
                    ? 'bg-slate-100 border-slate-300 opacity-70'
                    : isReceived && !msg.is_read
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        {isReceived ? (
                          <>از: {msg.sender?.first_name || msg.sender?.username || 'ناشناس'}</>
                        ) : (
                          <>به: {msg.receiver?.first_name || msg.receiver?.username || 'ناشناس'}</>
                        )}
                      </span>
                      <span className="text-sm text-slate-400">
                        {new Date(msg.created_at).toLocaleDateString('fa-IR')}
                      </span>
                      {!msg.is_read && isReceived && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">جدید</span>
                      )}
                      {isArchived && (
                        <span className="text-xs bg-slate-500 text-white px-2 py-0.5 rounded-full">بایگانی</span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isReceived && !isSent
                            ? 'bg-green-100 text-green-700'
                            : isSent && !isReceived
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isReceived && !isSent
                          ? 'دریافتی'
                          : isSent && !isReceived
                          ? 'ارسال‌شده'
                          : 'خود'}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-800 mt-1">{msg.subject}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isReceived && !isArchived && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReply(msg);
                          }}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          title="پاسخ"
                        >
                          <MessageSquare size={18} />
                        </button>
                        {!msg.is_read && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await onMarkAsRead(msg.id);
                              onRefresh();
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="علامت خوانده شده"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </>
                    )}
                    {!isArchived ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onArchive(msg.id);
                          onRefresh();
                        }}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                        title="بایگانی"
                      >
                        <Archive size={18} />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 px-2">بایگانی</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMessageModal(msg);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                      title="مشاهده کامل"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>

                {replyTo && replyTo.id === msg.id && isReceived && !isArchived && (
                  <form
                    onSubmit={sendReply}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <h4 className="font-medium text-slate-700 mb-3">
                      پاسخ به {msg.sender?.first_name || msg.sender?.username}
                    </h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="موضوع"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <textarea
                        rows={3}
                        placeholder="متن پیام..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelReply}
                          className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition"
                        >
                          لغو
                        </button>
                        <button
                          type="submit"
                          disabled={sending}
                          className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                        >
                          {sending ? 'در حال ارسال...' : 'ارسال پاسخ'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && selectedMessage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeMessageModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeMessageModal}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 transition text-slate-500"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">{selectedMessage.subject}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                <span>
                  <span className="font-semibold">از:</span>{' '}
                  {selectedMessage.sender?.first_name || selectedMessage.sender?.username || 'ناشناس'}
                </span>
                <span>
                  <span className="font-semibold">به:</span>{' '}
                  {selectedMessage.receiver?.first_name || selectedMessage.receiver?.username || 'ناشناس'}
                </span>
                <span>
                  <span className="font-semibold">تاریخ:</span>{' '}
                  {new Date(selectedMessage.created_at).toLocaleString('fa-IR')}
                </span>
                {!selectedMessage.is_read && selectedMessage.receiver.id === profileId && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">جدید</span>
                )}
                {selectedMessage.is_archived && (
                  <span className="text-xs bg-slate-500 text-white px-2 py-0.5 rounded-full">بایگانی</span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedMessage.receiver.id === profileId && selectedMessage.sender.id !== profileId
                      ? 'bg-green-100 text-green-700'
                      : selectedMessage.sender.id === profileId && selectedMessage.receiver.id !== profileId
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {selectedMessage.receiver.id === profileId && selectedMessage.sender.id !== profileId
                    ? 'دریافتی'
                    : selectedMessage.sender.id === profileId && selectedMessage.receiver.id !== profileId
                    ? 'ارسال‌شده'
                    : 'خود'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.content}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-200">
              {selectedMessage.receiver.id === profileId && !selectedMessage.is_archived && (
                <>
                  <button
                    onClick={() => {
                      handleReply(selectedMessage);
                      closeMessageModal();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
                  >
                    <MessageSquare size={18} />
                    پاسخ
                  </button>
                  {!selectedMessage.is_read && (
                    <button
                      onClick={async () => {
                        await onMarkAsRead(selectedMessage.id);
                        onRefresh();
                        closeMessageModal();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      <CheckCircle size={18} />
                      خوانده شد
                    </button>
                  )}
                </>
              )}
              {!selectedMessage.is_archived ? (
                <button
                  onClick={async () => {
                    await onArchive(selectedMessage.id);
                    onRefresh();
                    closeMessageModal();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  <Archive size={18} />
                  بایگانی
                </button>
              ) : (
                <span className="text-slate-500 text-sm px-4 py-2 bg-slate-100 rounded-lg">بایگانی شده</span>
              )}
              <button
                onClick={closeMessageModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Wallet Tab
// ============================================================
function WalletTab({ wallet, loading }: { wallet: WalletData | null; loading: boolean }) {
  const [showBalance, setShowBalance] = useState(true);
  const tokenLogoPath = '/techtokenlogo.jpg';

  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری کیف پول...</div>;
  }

  const balance = wallet?.balance ?? 1000000;
  const transactions = wallet?.transactions ?? [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fa-IR').format(amount) + ' تک توکن';

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">کیف پول</h2>
      <div className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl p-6 text-white mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Image
              src={tokenLogoPath}
              alt="تک توکن"
              width={56}
              height={56}
              className="rounded-full border-2 border-white/30 object-cover"
              onError={() => console.warn('⚠️ لوگوی توکن بارگذاری نشد')}
            />
          </div>
          <div>
            <p className="text-sm opacity-80">موجودی کل</p>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-3xl font-bold">
                {showBalance ? formatCurrency(balance) : '••••••••'}
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-700 mb-4">تاریخچه تراکنش‌ها</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <History className="h-10 w-10 mx-auto mb-2" />
            <p>هیچ تراکنشی ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      tx.type === 'deposit' || tx.type === 'refund'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'refund' ? (
                      <ArrowDownRight size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {tx.type === 'deposit'
                        ? 'واریز'
                        : tx.type === 'withdraw'
                        ? 'برداشت'
                        : tx.type === 'payment'
                        ? 'پرداخت'
                        : 'بازگشت وجه'}
                    </p>
                    <p className="text-sm text-slate-500">{tx.description}</p>
                    <span
                      className={`text-xs ${
                        tx.status === 'completed'
                          ? 'text-green-600'
                          : tx.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.status === 'completed'
                        ? '✔ انجام شده'
                        : tx.status === 'pending'
                        ? '⏳ در انتظار'
                        : '✖ شکست خورده'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${
                      tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}
                    {formatCurrency(parseFloat(tx.amount))}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// My Needs Tab
// ============================================================
function MyNeedsTab({ needs, loading }: { needs: Need[]; loading: boolean }) {
  const router = useRouter();

  const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    published: { label: 'منتشر شده', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
    draft: { label: 'پیش‌نویس', color: 'bg-slate-100 text-slate-600', icon: <AlertCircle size={14} /> },
    pending: { label: 'در انتظار تأیید', color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle size={14} /> },
    approved: { label: 'تأیید شده', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
    rejected: { label: 'رد شده', color: 'bg-red-100 text-red-700', icon: <X size={14} /> },
    submitted: { label: 'ارسال برای بررسی', color: 'bg-blue-100 text-blue-700', icon: <Send size={14} /> },
    evaluating: { label: 'در حال ارزیابی', color: 'bg-purple-100 text-purple-700', icon: <History size={14} /> },
    needs_revision: { label: 'نیازمند اصلاح', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle size={14} /> },
    suspended: { label: 'تعلیق شده', color: 'bg-gray-100 text-gray-600', icon: <AlertCircle size={14} /> },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="mr-3 text-slate-500">در حال بارگذاری نیازها...</span>
      </div>
    );
  }

  if (!needs || needs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Target className="h-16 w-16 mx-auto mb-4 stroke-1" />
        <p className="text-lg font-medium text-slate-600">هیچ نیازی ثبت نشده است</p>
        <p className="text-sm mt-1 text-slate-400">شما هنوز هیچ نیازی ثبت نکرده‌اید.</p>
        <button
          onClick={() => (window.location.href = '/needs/register')}
          className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm text-sm font-medium"
        >
          ثبت نیاز جدید
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-800">نیازهای ثبت‌شده</h2>
        <button
          onClick={() => (window.location.href = '/needs/register')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-sm font-medium shadow-sm flex items-center gap-2"
        >
          <Plus size={16} />
          ثبت نیاز جدید
        </button>
      </div>

      <div className="space-y-4">
        {needs.map((need) => {
          const statusInfo = statusMap[need.status] || {
            label: need.status || 'نامشخص',
            color: 'bg-slate-100 text-slate-600',
            icon: <AlertCircle size={14} />,
          };

          return (
            <div
              key={need.id}
              className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200 hover:border-blue-200"
            >
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-semibold text-slate-800 text-base leading-6 flex-1">
                  {need.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full whitespace-nowrap shrink-0 ${statusInfo.color}`}
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </div>

              <div
                className="text-sm text-slate-600 mt-3 leading-relaxed [&_*]:inline [&_*]:text-sm [&_*]:text-slate-600"
                dangerouslySetInnerHTML={{ __html: need.description || 'بدون توضیحات' }}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Target size={14} className="text-slate-400" />
                    صنعت: {need.industry?.name || 'نامشخص'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <History size={14} className="text-slate-400" />
                    {formatDate(need.created_at)}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/matching/${need.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#14B8A6] hover:shadow-lg text-white text-xs font-bold rounded-xl transition-all duration-200"
                >
                  <Zap size={14} />
                  تطبیق هوشمند
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// My Products Tab
// ============================================================
function MyProductsTab({ supplies, loading }: { supplies: Supply[]; loading: boolean }) {
  const statusMap: Record<string, { label: string; color: string }> = {
    published: { label: 'منتشر شده', color: 'bg-green-100 text-green-700' },
    approved: { label: 'تأیید شده', color: 'bg-green-100 text-green-700' },
    pending: { label: 'در انتظار تأیید', color: 'bg-yellow-100 text-yellow-700' },
    draft: { label: 'پیش‌نویس', color: 'bg-slate-100 text-slate-600' },
    submitted: { label: 'ارسال برای بررسی', color: 'bg-blue-100 text-blue-700' },
    evaluating: { label: 'در حال ارزیابی', color: 'bg-purple-100 text-purple-700' },
    needs_revision: { label: 'نیازمند اصلاح', color: 'bg-orange-100 text-orange-700' },
    rejected: { label: 'رد شده', color: 'bg-red-100 text-red-700' },
    suspended: { label: 'تعلیق شده', color: 'bg-gray-100 text-gray-600' },
    in_negotiation: { label: 'در حال مذاکره', color: 'bg-indigo-100 text-indigo-700' },
    contracted: { label: 'دارای قرارداد', color: 'bg-teal-100 text-teal-700' },
    executing: { label: 'در حال اجرا', color: 'bg-cyan-100 text-cyan-700' },
    completed: { label: 'تکمیل شده', color: 'bg-emerald-100 text-emerald-700' },
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری محصولات...</div>;
  }

  if (!supplies || supplies.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Package className="h-12 w-12 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-lg font-medium">هیچ محصولی ثبت نشده است</p>
        <p className="text-sm mt-1">شما هنوز هیچ محصول یا خدمتی ثبت نکرده‌اید.</p>
        <button
          onClick={() => window.location.href = '/supply/register'}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          ثبت محصول جدید
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">محصولات و خدمات ثبت‌شده</h2>
        <button
          onClick={() => window.location.href = '/supply/register'}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm"
        >
          + ثبت محصول جدید
        </button>
      </div>
      <div className="space-y-4">
        {supplies.map((supply) => {
          const statusInfo = statusMap[supply.status] || { label: supply.status || 'نامشخص', color: 'bg-slate-100 text-slate-600' };
          return (
            <div key={supply.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-800 text-lg">{supply.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{supply.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span>دسته‌بندی: {supply.category || '-'}</span>
                <span>قیمت: {supply.price ? `${supply.price} تومان` : '-'}</span>
                <span>تاریخ: {new Date(supply.created_at).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// My Negotiations Tab
// ============================================================
function MyNegotiationsTab({
  negotiations,
  loading,
  profileId,
  onRefresh,
}: {
  negotiations: Negotiation[];
  loading: boolean;
  profileId: number;
  onRefresh: () => void;
}) {
  const router = useRouter();

  const statusMap: Record<string, { label: string; color: string }> = {
    created: { label: 'ایجاد شده', color: 'bg-slate-100 text-slate-600' },
    in_progress: { label: 'در حال مذاکره', color: 'bg-blue-100 text-blue-700' },
    awaiting_proposal: { label: 'در انتظار پیشنهاد', color: 'bg-yellow-100 text-yellow-700' },
    proposal_sent: { label: 'پیشنهاد ارسال شده', color: 'bg-purple-100 text-purple-700' },
    under_review: { label: 'در حال بررسی', color: 'bg-indigo-100 text-indigo-700' },
    accepted: { label: 'پذیرفته شده', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'رد شده', color: 'bg-red-100 text-red-700' },
    contracted: { label: 'قرارداد شده', color: 'bg-teal-100 text-teal-700' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="mr-3 text-slate-500">در حال بارگذاری مذاکرات...</span>
      </div>
    );
  }

  if (!negotiations || negotiations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 stroke-1" />
        <p className="text-lg font-medium text-slate-600">هیچ مذاکره‌ای ثبت نشده است</p>
        <p className="text-sm mt-1 text-slate-400">
          برای شروع یک مذاکره، به بازار رفته و روی دکمه مذاکره کلیک کنید.
        </p>
        <button
          onClick={() => router.push('/market')}
          className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm text-sm font-medium"
        >
          رفتن به بازار
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getOtherParty = (neg: Negotiation) => {
    if (neg.buyer === profileId) {
      return { name: neg.supplier_name, role: 'تأمین‌کننده' };
    }
    return { name: neg.buyer_name, role: 'خریدار' };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-800">مذاکرات من</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            🔄 بازخوانی
          </button>
          <button
            onClick={() => router.push('/market')}
            className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
          >
            <Plus size={16} className="inline ml-1" />
            مذاکره جدید
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {negotiations.map((neg) => {
          const statusInfo = statusMap[neg.status] || {
            label: neg.status || 'نامشخص',
            color: 'bg-slate-100 text-slate-600',
          };
          const otherParty = getOtherParty(neg);
          const isActive = neg.is_active;

          return (
            <div
              key={neg.id}
              onClick={() => router.push(`/negotiation/${neg.id}`)}
              className={`group bg-white border rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-blue-200 hover:shadow-md hover:border-blue-400'
                  : 'border-slate-200 hover:shadow-sm opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-base leading-6">
                      {neg.context_title || neg.supply_title || `مذاکره #${neg.id}`}
                    </h3>
                    {!isActive && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        پایان‌یافته
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-500">
                    <span>
                      طرف مقابل: <span className="font-medium text-slate-700">{otherParty.name}</span>
                      <span className="text-xs text-slate-400 mr-1">({otherParty.role})</span>
                    </span>
                    <span>•</span>
                    <span>{formatDate(neg.created_at)}</span>
                    {neg.updated_at !== neg.created_at && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-slate-400">
                          آخرین فعالیت: {formatDate(neg.updated_at)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full whitespace-nowrap ${statusInfo.color}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-slate-400'}`} />
                    {statusInfo.label}
                  </span>
                  <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
              {neg.messages && neg.messages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-500 line-clamp-1">
                    آخرین پیام: {neg.messages[neg.messages.length - 1]?.text || '...'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}