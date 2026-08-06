// ============================================================
// src/app/profile/page.tsx
// صفحه پروفایل کاربر - شامل اطلاعات کاربری، صندوق پیام، کیف پول، نیازهای ثبت‌شده و محصولات ثبت‌شده
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
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

// ============================================================
// Main Component
// ============================================================
export default function ProfilePage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'messages' | 'wallet' | 'myNeeds' | 'myProducts'
  >('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [myNeeds, setMyNeeds] = useState<Need[]>([]);
  const [mySupplies, setMySupplies] = useState<Supply[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const headers = { Authorization: `Bearer ${accessToken}` };

      // ---- ۱. دریافت پروفایل کاربر ----
      let profileRes = await fetch(`${API_URL}/users/profile/`, { headers });
      if (!profileRes.ok) {
        profileRes = await fetch(`${API_URL}/users/me/`, { headers });
      }
      if (!profileRes.ok) {
        throw new Error(`Failed to load profile (status: ${profileRes.status})`);
      }
      const profileData = await profileRes.json();
      setProfile(profileData);
      setFormData(profileData);

      // ---- ۲. دریافت پیام‌ها ----
      try {
        const msgRes = await fetch(`${API_URL}/messages/`, { headers });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          let messagesArray = msgData?.results || msgData;
          if (!Array.isArray(messagesArray)) {
            messagesArray = [];
          }
          setMessages(messagesArray);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.warn('⚠️ Error loading messages:', err);
        setMessages([]);
      }

      // ---- ۳. دریافت کیف پول ----
      try {
        const walletRes = await fetch(`${API_URL}/wallet/`, { headers });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWallet(walletData);
        } else {
          setWallet(null);
        }
      } catch (err) {
        console.warn('⚠️ Error loading wallet:', err);
        setWallet(null);
      }

      // ---- ۴. دریافت نیازهای کاربر ----
      try {
        const needsRes = await fetch(`${API_URL}/needs/?buyer=${profileData.id}`, { headers });
        if (needsRes.ok) {
          const needsData = await needsRes.json();
          const needsArray = needsData?.results || needsData;
          setMyNeeds(Array.isArray(needsArray) ? needsArray : []);
        } else {
          setMyNeeds([]);
        }
      } catch (err) {
        console.warn('⚠️ Error loading needs:', err);
        setMyNeeds([]);
      }

      // ---- ۵. دریافت محصولات/خدمات کاربر (عرضه‌ها) ----
      // فرض بر این است که مسیر api/products/supplies/?seller=id وجود دارد
      try {
        const suppliesRes = await fetch(`${API_URL}/products/supplies/?seller=${profileData.id}`, { headers });
        if (suppliesRes.ok) {
          const suppliesData = await suppliesRes.json();
          const suppliesArray = suppliesData?.results || suppliesData;
          setMySupplies(Array.isArray(suppliesArray) ? suppliesArray : []);
        } else {
          setMySupplies([]);
        }
      } catch (err) {
        console.warn('⚠️ Error loading supplies:', err);
        setMySupplies([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching data:', err);
      setError(err.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Handlers
  // ============================================================
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setProfile(updated);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'خطا در بروزرسانی پروفایل');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${API_URL}/messages/${id}/mark_read/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleArchiveMessage = async (id: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${API_URL}/messages/${id}/archive/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Error archiving message:', err);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">خطا در دریافت اطلاعات</h2>
          <p className="text-slate-500 mb-4">{error || 'لطفاً دوباره تلاش کنید'}</p>
          <button
            onClick={fetchAllData}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = Array.isArray(messages) ? messages.filter((m) => !m.is_read).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {!logoError ? (
                <Image
                  src="/logo.png"
                  alt="بازار تحول"
                  width={48}
                  height={48}
                  className="rounded-full object-contain"
                  onError={() => setLogoError(true)}
                  priority
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                  ب ت
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {profile.first_name} {profile.last_name}
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    profile.kyc_status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : profile.kyc_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {profile.kyc_status === 'approved'
                    ? 'تأیید شده'
                    : profile.kyc_status === 'pending'
                    ? 'در انتظار تأیید'
                    : 'تکمیل نشده'}
                </span>
              </h1>
              <p className="text-slate-500">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            خروج از حساب
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'profile', label: 'اطلاعات کاربری', icon: User },
            { id: 'messages', label: 'صندوق پیام', icon: MessageSquare, badge: unreadCount },
            { id: 'wallet', label: 'کیف پول', icon: Wallet },
            { id: 'myNeeds', label: 'نیازهای من', icon: Target },
            { id: 'myProducts', label: 'محصولات من', icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {activeTab === 'profile' && (
            <ProfileTab
              profile={profile}
              editMode={editMode}
              setEditMode={setEditMode}
              formData={formData}
              setFormData={setFormData}
              handleUpdateProfile={handleUpdateProfile}
              loading={loading}
            />
          )}
          {activeTab === 'messages' && (
            <MessagesTab
              messages={messages}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchiveMessage}
            />
          )}
          {activeTab === 'wallet' && <WalletTab wallet={wallet} loading={loading} />}
          {activeTab === 'myNeeds' && <MyNeedsTab needs={myNeeds} loading={loading} />}
          {activeTab === 'myProducts' && <MyProductsTab supplies={mySupplies} loading={loading} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Profile Tab (اطلاعات کاربری)
// ============================================================
function ProfileTab({
  profile,
  editMode,
  setEditMode,
  formData,
  setFormData,
  handleUpdateProfile,
  loading,
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

      {editMode ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field: any) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
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
              <p className="text-slate-800 font-medium">{profile[field.key] || '-'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Messages Tab (صندوق پیام)
// ============================================================
function MessagesTab({
  messages,
  loading,
  onMarkAsRead,
  onArchive,
}: {
  messages: Message[];
  loading: boolean;
  onMarkAsRead: (id: number) => void;
  onArchive: (id: number) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const messagesArray = Array.isArray(messages) ? messages : [];
  const filtered = messagesArray.filter((m) => {
    if (filter === 'unread') return !m.is_read;
    if (filter === 'read') return m.is_read;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">صندوق پیام</h2>
        <div className="flex gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'همه' : f === 'unread' ? 'نخوانده' : 'خوانده'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">در حال بارگذاری پیام‌ها...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Inbox className="h-12 w-12 mx-auto mb-3" />
          <p>پیامی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-xl border transition ${
                msg.is_read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      {msg.sender?.first_name || msg.sender?.username || 'ناشناس'}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(msg.created_at).toLocaleDateString('fa-IR')}
                    </span>
                    {!msg.is_read && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">جدید</span>
                    )}
                  </div>
                  <h4 className="font-medium text-slate-800 mt-1">{msg.subject}</h4>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!msg.is_read && (
                    <button
                      onClick={() => onMarkAsRead(msg.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="علامت خوانده شده"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => onArchive(msg.id)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                    title="بایگانی"
                  >
                    <Archive size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Wallet Tab (کیف پول با واحد تک توکن)
// ============================================================
function WalletTab({ wallet, loading }: { wallet: WalletData | null; loading: boolean }) {
  const [showBalance, setShowBalance] = useState(true);
  const tokenLogoPath = '/techtokenlogo.jpg';

  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری کیف پول...</div>;
  }

  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.transactions ?? [];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fa-IR').format(amount) + ' تک توکن';

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">کیف پول</h2>

      {/* Balance Card with Token Logo */}
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
            {!wallet && (
              <p className="text-xs opacity-80 mt-1">کیف پول شما خالی است.</p>
            )}
          </div>
        </div>
        {/* دکمه شارژ کیف پول - کامنت شده */}
        {/*
        <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition backdrop-blur-sm">
          <Plus size={18} className="inline ml-1" /> شارژ کیف پول
        </button>
        */}
      </div>

      {/* Transactions */}
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
// My Needs Tab (نیازهای ثبت‌شده کاربر)
// ============================================================
function MyNeedsTab({ needs, loading }: { needs: Need[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری نیازها...</div>;
  }

  if (!needs || needs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Target className="h-12 w-12 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-lg font-medium">هیچ نیازی ثبت نشده است</p>
        <p className="text-sm mt-1">شما هنوز هیچ نیازی ثبت نکرده‌اید.</p>
        <button
          onClick={() => window.location.href = '/needs/register'}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          ثبت نیاز جدید
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">نیازهای ثبت‌شده</h2>
        <button
          onClick={() => window.location.href = '/needs/register'}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm"
        >
          + ثبت نیاز جدید
        </button>
      </div>
      <div className="space-y-4">
        {needs.map((need) => (
          <div
            key={need.id}
            className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 text-lg">{need.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  need.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : need.status === 'draft'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {need.status === 'published'
                  ? 'منتشر شده'
                  : need.status === 'draft'
                  ? 'پیش‌نویس'
                  : need.status || 'نامشخص'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{need.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>صنعت: {need.industry?.name || '-'}</span>
              <span>تاریخ: {new Date(need.created_at).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// My Products Tab (محصولات/خدمات ثبت‌شده کاربر)
// ============================================================
function MyProductsTab({ supplies, loading }: { supplies: Supply[]; loading: boolean }) {
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
        {supplies.map((supply) => (
          <div
            key={supply.id}
            className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 text-lg">{supply.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  supply.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : supply.status === 'draft'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {supply.status === 'published'
                  ? 'منتشر شده'
                  : supply.status === 'draft'
                  ? 'پیش‌نویس'
                  : supply.status || 'نامشخص'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{supply.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>دسته‌بندی: {supply.category || '-'}</span>
              <span>قیمت: {supply.price ? `${supply.price} تومان` : '-'}</span>
              <span>تاریخ: {new Date(supply.created_at).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}