// ============================================================
// src/app/profile/page.tsx
// ============================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const { logout, updateUser } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const [mounted, setMounted] = useState(false);
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
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [needsError, setNeedsError] = useState<string | null>(null);
  const [suppliesError, setSuppliesError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [logoError, setLogoError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ===== 1. Mount =====
  useEffect(() => {
    setMounted(true);
  }, []);

  // ===== 2. Check token and load data =====
  useEffect(() => {
    if (!mounted) return;

    const token = getAccessToken();
    if (!token) {
      console.warn('🔒 No token found, redirecting to login');
      router.push('/login');
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
        router.replace('/login');
        return;
      }

      // ---- 1. Profile ----
      // authenticatedFetch automatically refreshes an expired access token once.
      let profileRes = await authenticatedFetch(`${apiUrl}/users/profile/`, {
        method: 'GET',
      });

      // If the profile endpoint is unavailable, fall back to /users/me/.
      if (!profileRes.ok && profileRes.status !== 401) {
        const fallbackRes = await authenticatedFetch(`${apiUrl}/users/me/`, {
          method: 'GET',
        });
        if (fallbackRes.ok || fallbackRes.status === 401) {
          profileRes = fallbackRes;
        }
      }

      // A failed API must not log the user out.
      // Only redirect when there is genuinely no access token at all.
      if (!profileRes.ok) {
        const errorData = await profileRes.json().catch(() => ({}));
        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            `در حال حاضر امکان بارگذاری اطلاعات پروفایل وجود ندارد. (کد ${profileRes.status})`
        );
      }

      const profileData = await profileRes.json();
      setProfile(profileData);
      setFormData(profileData);
      updateUser(profileData);

      // ---- 2. Messages ----
      setMessagesError(null);
      try {
        const msgRes = await authenticatedFetch(`${apiUrl}/messages/`, {
          method: 'GET',
        });

        if (msgRes.ok) {
          setMessagesError(null);
          const msgData = await msgRes.json();
          let messagesArray = msgData?.results ?? msgData;
          if (!Array.isArray(messagesArray)) messagesArray = [];
          setMessages(messagesArray);
        } else {
          console.warn('⚠️ Messages API failed:', msgRes.status);
          setMessages([]);
          setMessagesError('در حال حاضر امکان بارگذاری پیام‌ها وجود ندارد.');
        }
      } catch (err) {
        console.warn('⚠️ Error loading messages:', err);
        setMessages([]);
        setMessagesError('در حال حاضر امکان بارگذاری پیام‌ها وجود ندارد.');
      }

      // ---- 3. Wallet ----
      setWalletError(null);
      try {
        const walletRes = await authenticatedFetch(`${apiUrl}/wallet/`, {
          method: 'GET',
        });

        if (walletRes.ok) {
          setWalletError(null);
          const walletData = await walletRes.json();
          setWallet(walletData);
          setWalletError(null);
        } else {
          console.warn('⚠️ Wallet API failed:', walletRes.status);
          setWallet(null);
          setWalletError('در حال حاضر امکان بارگذاری کیف پول وجود ندارد.');
          setWalletError('در حال حاضر امکان بارگذاری کیف پول وجود ندارد.');
        }
      } catch (err) {
        console.warn('⚠️ Error loading wallet:', err);
        setWallet(null);
        setWalletError('در حال حاضر امکان بارگذاری کیف پول وجود ندارد.');
      }

      // ---- 4. Needs ----
      setNeedsError(null);
      try {
        const needsRes = await authenticatedFetch(
          `${apiUrl}/needs/?buyer=${encodeURIComponent(profileData.id)}`,
          { method: 'GET' }
        );

        if (needsRes.ok) {
          setNeedsError(null);
          const needsData = await needsRes.json();
          const needsArray = needsData?.results ?? needsData;
          setMyNeeds(Array.isArray(needsArray) ? needsArray : []);
          setNeedsError(null);
        } else {
          console.warn('⚠️ Needs API failed:', needsRes.status);
          setMyNeeds([]);
          setNeedsError('در حال حاضر امکان بارگذاری نیازهای شما وجود ندارد.');
          setNeedsError('در حال حاضر امکان بارگذاری نیازهای شما وجود ندارد.');
        }
      } catch (err) {
        console.warn('⚠️ Error loading needs:', err);
        setMyNeeds([]);
        setNeedsError('در حال حاضر امکان بارگذاری نیازهای شما وجود ندارد.');
      }

      // ---- 5. Supplies ----
      setSuppliesError(null);
      try {
        const suppliesRes = await authenticatedFetch(
          `${apiUrl}/products/supplies/?seller=${encodeURIComponent(profileData.id)}`,
          { method: 'GET' }
        );

        if (suppliesRes.ok) {
          setSuppliesError(null);
          const suppliesData = await suppliesRes.json();
          const suppliesArray = suppliesData?.results ?? suppliesData;
          setMySupplies(Array.isArray(suppliesArray) ? suppliesArray : []);
          setSuppliesError(null);
        } else {
          console.warn('⚠️ Supplies API failed:', suppliesRes.status);
          setMySupplies([]);
          setSuppliesError('در حال حاضر امکان بارگذاری محصولات و خدمات شما وجود ندارد.');
          setSuppliesError('در حال حاضر امکان بارگذاری محصولات و خدمات شما وجود ندارد.');
        }
      } catch (err) {
        console.warn('⚠️ Error loading supplies:', err);
        setMySupplies([]);
        setSuppliesError('در حال حاضر امکان بارگذاری محصولات و خدمات شما وجود ندارد.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching data:', err);
      setError(err?.message || 'خطا در دریافت اطلاعات');
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
        router.replace('/login');
        return;
      }

      const res = await authenticatedFetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            'خطا در بروزرسانی پروفایل'
        );
      }

      const updated = await res.json();
      setProfile(updated);
      setFormData(updated);
      updateUser(updated);
      setEditMode(false);
      setSuccessMessage('✅ اطلاعات با موفقیت به‌روزرسانی شد');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      setError(err?.message || 'خطا در بروزرسانی پروفایل');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number): Promise<boolean> => {
    const target = messages.find((message) => message.id === id);
    if (!target) return false;

    // فقط پیام دریافتیِ نخوانده را mark-read کن.
    if (!target.is_received || target.is_read) return true;

    // Optimistic update: شمارنده‌ها مستقیماً از messages محاسبه می‌شوند.
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, is_read: true } : message
      )
    );

    try {
      const token = getAccessToken();
      if (!token) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, is_read: false } : message
          )
        );
        router.replace('/login');
        return false;
      }

      const res = await authenticatedFetch(`${API_URL}/messages/${id}/mark_read/`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Failed to mark message as read:', errorData);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === id ? { ...message, is_read: false } : message
          )
        );
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
          message.id === id ? { ...message, is_read: false } : message
        )
      );
      return false;
    }
  };

  const handleArchiveMessage = async (id: number): Promise<boolean> => {
    const target = messages.find((message) => message.id === id);
    if (!target) return false;

    try {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return false;
      }

      const res = await authenticatedFetch(`${API_URL}/messages/${id}/archive/`, {
        method: 'POST',
      });

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
      return false;
    }
  };

  // ===== Loading state =====
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">خطا در دریافت اطلاعات</h2>
          <p className="text-slate-500 mb-4">{error || 'لطفاً دوباره تلاش کنید'}</p>
          <button
            onClick={() => {
              const token = getAccessToken();
              if (token) fetchAllData(token);
              else router.push('/login');
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = Array.isArray(messages)
    ? messages.filter(
        (message) => message.is_received === true && message.is_read === false && message.is_archived !== true
      ).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
            onClick={() => {
              logout();
              router.push('/login');
            }}
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

        {/* Content */}
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
              error={error}
              successMessage={successMessage}
            />
          )}
          {activeTab === 'messages' && (
            <MessagesTab
              messages={messages}
              loading={loading}
              profileId={profile.id}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchiveMessage}
              apiError={messagesError}
              onRefresh={() => {
                const token = getAccessToken();
                if (token) fetchAllData(token);
                else router.push('/login');
              }}
            />
          )}
          {activeTab === 'wallet' && (
            <WalletTab wallet={wallet} loading={loading} apiError={walletError} />
          )}
          {activeTab === 'myNeeds' && (
            <MyNeedsTab needs={myNeeds} loading={loading} apiError={needsError} />
          )}
          {activeTab === 'myProducts' && (
            <MyProductsTab supplies={mySupplies} loading={loading} apiError={suppliesError} />
          )}
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
// Messages Tab (با قابلیت بایگانی، فیلتر و جستجو)
// ============================================================
function MessagesTab({
  messages,
  loading,
  profileId,
  onMarkAsRead,
  onArchive,
  onRefresh,
  apiError,
}: {
  messages: Message[];
  loading: boolean;
  profileId: number;
  onMarkAsRead: (id: number) => Promise<boolean>;
  onArchive: (id: number) => Promise<boolean>;
  onRefresh: () => void;
  apiError?: string | null;
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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const messagesArray = Array.isArray(messages) ? messages : [];

  // Backend جدید is_sent/is_received را صریحاً می‌فرستد.
  // این fallback باعث می‌شود در صورت دریافت response قدیمی نیز UI از کار نیفتد.
  const isReceivedMessage = (message: Message) =>
    message.is_received === true ||
    (message.is_received !== false && Number(message.receiver) === Number(profileId));

  const isSentMessage = (message: Message) =>
    message.is_sent === true ||
    (message.is_sent !== false && Number(message.sender) === Number(profileId));

  const senderId = (message: Message) =>
    typeof message.sender === 'number' ? message.sender : message.sender_detail?.id;

  const receiverId = (message: Message) =>
    typeof message.receiver === 'number' ? message.receiver : message.receiver_detail?.id;

  const senderName = (message: Message) =>
    message.sender_detail?.first_name ||
    message.sender_detail?.username ||
    `کاربر ${senderId(message) ?? ''}`;

  const receiverName = (message: Message) =>
    message.receiver_detail?.first_name ||
    message.receiver_detail?.username ||
    `کاربر ${receiverId(message) ?? ''}`;

  const totalAll = messagesArray.length;
  const totalReceived = messagesArray.filter(isReceivedMessage).length;
  const totalSent = messagesArray.filter(isSentMessage).length;
  const totalUnreadReceived = messagesArray.filter(
    (message) => isReceivedMessage(message) && message.is_read === false
  ).length;
  const totalReadReceived = messagesArray.filter(
    (message) => isReceivedMessage(message) && message.is_read === true
  ).length;
  const totalArchived = messagesArray.filter((message) => message.is_archived === true).length;

  // وقتی پیام ارسال‌شده انتخاب می‌شود، read/unread دیگر معنایی ندارد.
  useEffect(() => {
    if (directionFilter === 'sent' && readFilter !== 'all') {
      setReadFilter('all');
    }
  }, [directionFilter, readFilter]);

  // Popup همیشه نسخه فعلی پیام را از source of truth می‌گیرد.
  useEffect(() => {
    if (!selectedMessage) return;
    const latest = messages.find((message) => message.id === selectedMessage.id);
    if (latest && latest !== selectedMessage) {
      setSelectedMessage(latest);
    }
  }, [messages, selectedMessage]);

  // بستن لیست جستجو با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جستجوی کاربران
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
        const res = await authenticatedFetch(url, { method: 'GET' });
        if (!res.ok) throw new Error('خطا در جستجو');

        const data = await res.json();
        const users = data?.results || data || [];
        setSearchResults(Array.isArray(users) ? users : []);
        setShowSearchResults(Array.isArray(users) && users.length > 0);
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
      if (!token) throw new Error('لطفاً دوباره وارد شوید');

      const targetReceiverId = senderId(replyTo);
      if (!targetReceiverId) throw new Error('گیرنده پیام مشخص نیست');

      const res = await authenticatedFetch(`${API_URL}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: targetReceiverId,
          subject: replySubject,
          content: replyContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.detail || 'خطا در ارسال پاسخ');
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
    setShowNewMessage((value) => !value);
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
      if (!token) throw new Error('لطفاً دوباره وارد شوید');

      const url = `${API_URL}/users/users/?search=${encodeURIComponent(trimmedUsername)}&page_size=100`;
      const userRes = await authenticatedFetch(url, { method: 'GET' });
      if (!userRes.ok) throw new Error('خطا در جستجوی کاربر');

      const usersData = await userRes.json();
      let users = usersData?.results || usersData || [];
      if (!Array.isArray(users)) users = [];
      if (users.length === 0) {
        throw new Error(`کاربری با نام کاربری "${trimmedUsername}" یافت نشد`);
      }

      const receiver = users[0];
      if (Number(receiver.id) === Number(profileId)) {
        throw new Error('نمی‌توانید برای خودتان پیام ارسال کنید.');
      }

      const res = await authenticatedFetch(`${API_URL}/messages/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: receiver.id,
          subject: newSubject.trim(),
          content: newContent.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.detail || 'خطا در ارسال پیام');
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

    // فقط پیام دریافتیِ نخوانده را mark-read کن.
    if (isReceivedMessage(msg) && !msg.is_read) {
      await onMarkAsRead(msg.id);
    }
  };

  const closeMessageModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  const archivedFiltered =
    archivedFilter === 'active'
      ? messagesArray.filter((message) => !message.is_archived)
      : archivedFilter === 'archived'
        ? messagesArray.filter((message) => message.is_archived)
        : messagesArray;

  const directionFiltered =
    directionFilter === 'received'
      ? archivedFiltered.filter(isReceivedMessage)
      : directionFilter === 'sent'
        ? archivedFiltered.filter(isSentMessage)
        : archivedFiltered;

  const finalFiltered =
    readFilter === 'unread'
      ? directionFiltered.filter((message) => isReceivedMessage(message) && message.is_read === false)
      : readFilter === 'read'
        ? directionFiltered.filter((message) => isReceivedMessage(message) && message.is_read === true)
        : directionFiltered;

  return (
    <div>
      {apiError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setArchivedFilter('active')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${archivedFilter === 'active' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <InboxIcon size={14} /> فعلی
          </button>
          <button
            onClick={() => setArchivedFilter('archived')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${archivedFilter === 'archived' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ArchiveIcon size={14} /> بایگانی ({totalArchived})
          </button>
          <button
            onClick={() => setArchivedFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition ${archivedFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            همه
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setReadFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition ${readFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            همه ({directionFilter === 'sent' ? totalSent : directionFilter === 'received' ? totalReceived : totalAll})
          </button>
          <button
            disabled={directionFilter === 'sent'}
            onClick={() => setReadFilter('unread')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${readFilter === 'unread' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'} ${directionFilter === 'sent' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            نخوانده ({directionFilter === 'received' ? totalUnreadReceived : directionFilter === 'sent' ? 0 : totalUnreadReceived})
          </button>
          <button
            disabled={directionFilter === 'sent'}
            onClick={() => setReadFilter('read')}
            className={`px-3 py-1 text-xs rounded-md transition ${readFilter === 'read' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'} ${directionFilter === 'sent' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            خوانده ({directionFilter === 'received' ? totalReadReceived : directionFilter === 'sent' ? 0 : totalReadReceived})
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setDirectionFilter('all')}
            className={`px-3 py-1 text-xs rounded-md transition ${directionFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            همه ({totalAll})
          </button>
          <button
            onClick={() => setDirectionFilter('received')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${directionFilter === 'received' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <InboxIcon size={14} /> دریافتی ({totalReceived})
          </button>
          <button
            onClick={() => setDirectionFilter('sent')}
            className={`px-3 py-1 text-xs rounded-md transition flex items-center gap-1 ${directionFilter === 'sent' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <SendIcon size={14} /> ارسال‌شده ({totalSent})
          </button>
        </div>
      </div>

      {/* New Message Form */}
      {showNewMessage && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-slate-700">ارسال پیام جدید</h3>
            <button onClick={toggleNewMessage} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={sendNewMessage} className="space-y-3">
            <div ref={searchContainerRef} className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">گیرنده (نام کاربری)</label>
              <input
                type="text"
                placeholder="نام کاربری گیرنده را وارد کنید"
                value={newReceiverUsername}
                onChange={(e) => { setNewReceiverUsername(e.target.value); setNewMessageError(null); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                required dir="ltr" autoComplete="off"
              />
              {searchLoading && <div className="absolute left-3 top-9 text-slate-400"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /></div>}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} onClick={() => selectUser(user.username)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition flex items-center gap-2 border-b border-slate-100 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">{(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}</div>
                      <div><div className="font-medium text-slate-800">{user.first_name} {user.last_name}</div><div className="text-xs text-slate-500">@{user.username}</div></div>
                    </div>
                  ))}
                </div>
              )}
              {showSearchResults && searchResults.length === 0 && newReceiverUsername.trim().length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm text-slate-500">کاربری یافت نشد</div>
              )}
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">موضوع</label><input type="text" placeholder="موضوع پیام" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">متن پیام</label><textarea rows={3} placeholder="متن پیام را وارد کنید..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required /></div>
            {newMessageError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{newMessageError}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={toggleNewMessage} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">لغو</button>
              <button type="submit" disabled={sendingNew} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2">
                {sendingNew ? 'در حال ارسال...' : <><Send size={16} /> ارسال</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages list */}
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
            const isReceived = isReceivedMessage(msg);
            const isSent = isSentMessage(msg);
            const isArchived = msg.is_archived === true;

            return (
              <div key={msg.id} onClick={() => openMessageModal(msg)} className={`p-4 rounded-xl border transition cursor-pointer ${isArchived ? 'bg-slate-100 border-slate-300 opacity-70' : isReceived && !msg.is_read ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{isReceived ? <>از: {senderName(msg)}</> : <>به: {receiverName(msg)}</>}</span>
                      <span className="text-sm text-slate-400">{new Date(msg.created_at).toLocaleDateString('fa-IR')}</span>
                      {!msg.is_read && isReceived && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">جدید</span>}
                      {isArchived && <span className="text-xs bg-slate-500 text-white px-2 py-0.5 rounded-full">بایگانی</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isReceived && !isSent ? 'bg-green-100 text-green-700' : isSent && !isReceived ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isReceived && !isSent ? 'دریافتی' : isSent && !isReceived ? 'ارسال‌شده' : 'نامشخص'}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-800 mt-1">{msg.subject}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{msg.content}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isReceived && !isArchived && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition" title="پاسخ"><MessageSquare size={18} /></button>
                        {!msg.is_read && (
                          <button onClick={async (e) => { e.stopPropagation(); await onMarkAsRead(msg.id); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition" title="علامت خوانده شده"><CheckCircle size={18} /></button>
                        )}
                      </>
                    )}
                    {!isArchived ? (
                      <button onClick={async (e) => { e.stopPropagation(); await onArchive(msg.id); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition" title="بایگانی"><Archive size={18} /></button>
                    ) : <span className="text-xs text-slate-400 px-2">بایگانی</span>}
                    <button onClick={(e) => { e.stopPropagation(); openMessageModal(msg); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition" title="مشاهده کامل"><Maximize2 size={16} /></button>
                  </div>
                </div>

                {replyTo && replyTo.id === msg.id && isReceived && !isArchived && (
                  <form onSubmit={sendReply} onClick={(e) => e.stopPropagation()} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-medium text-slate-700 mb-3">پاسخ به {senderName(msg)}</h4>
                    <div className="space-y-3">
                      <input type="text" placeholder="موضوع" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required />
                      <textarea rows={3} placeholder="متن پیام..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={cancelReply} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition">لغو</button>
                        <button type="submit" disabled={sending} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">{sending ? 'در حال ارسال...' : 'ارسال پاسخ'}</button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeMessageModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeMessageModal} className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 transition text-slate-500"><X size={24} /></button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">{selectedMessage.subject}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                <span><span className="font-semibold">از:</span> {senderName(selectedMessage)}</span>
                <span><span className="font-semibold">به:</span> {receiverName(selectedMessage)}</span>
                <span><span className="font-semibold">تاریخ:</span> {new Date(selectedMessage.created_at).toLocaleString('fa-IR')}</span>
                {!selectedMessage.is_read && isReceivedMessage(selectedMessage) && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">جدید</span>}
                {selectedMessage.is_archived && <span className="text-xs bg-slate-500 text-white px-2 py-0.5 rounded-full">بایگانی</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${isReceivedMessage(selectedMessage) && !isSentMessage(selectedMessage) ? 'bg-green-100 text-green-700' : isSentMessage(selectedMessage) && !isReceivedMessage(selectedMessage) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isReceivedMessage(selectedMessage) && !isSentMessage(selectedMessage) ? 'دریافتی' : isSentMessage(selectedMessage) && !isReceivedMessage(selectedMessage) ? 'ارسال‌شده' : 'نامشخص'}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.content}</p>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-200">
              {isReceivedMessage(selectedMessage) && !selectedMessage.is_archived && (
                <button onClick={() => { handleReply(selectedMessage); closeMessageModal(); }} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"><MessageSquare size={18} /> پاسخ</button>
              )}

              {isReceivedMessage(selectedMessage) && !selectedMessage.is_read && (
                <button onClick={async () => { const ok = await onMarkAsRead(selectedMessage.id); if (ok) closeMessageModal(); }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"><CheckCircle size={18} /> خوانده شد</button>
              )}

              {!selectedMessage.is_archived ? (
                <button onClick={async () => { const ok = await onArchive(selectedMessage.id); if (ok) closeMessageModal(); }} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"><Archive size={18} /> بایگانی</button>
              ) : <span className="text-slate-500 text-sm px-4 py-2 bg-slate-100 rounded-lg">بایگانی شده</span>}

              <button onClick={closeMessageModal} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition">بستن</button>
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
function WalletTab({
  wallet,
  loading,
  apiError,
}: {
  wallet: WalletData | null;
  loading: boolean;
  apiError?: string | null;
}) {
  const [showBalance, setShowBalance] = useState(true);
  const tokenLogoPath = '/techtokenlogo.jpg';

  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری کیف پول...</div>;
  }

  if (apiError) {
    return (
      <div className="text-center py-12 text-amber-700">
        <AlertCircle className="h-12 w-12 mx-auto mb-3" />
        <p className="text-lg font-medium">کیف پول در دسترس نیست</p>
        <p className="text-sm mt-1 text-slate-500">{apiError}</p>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
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
function MyNeedsTab({
  needs,
  loading,
  apiError,
}: {
  needs: Need[];
  loading: boolean;
  apiError?: string | null;
}) {
  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری نیازها...</div>;
  }

  if (apiError) {
    return (
      <div className="text-center py-12 text-amber-700">
        <AlertCircle className="h-12 w-12 mx-auto mb-3" />
        <p className="text-lg font-medium">نیازهای شما در دسترس نیست</p>
        <p className="text-sm mt-1 text-slate-500">{apiError}</p>
      </div>
    );
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
          <div key={need.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
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
// My Products Tab
// ============================================================
function MyProductsTab({
  supplies,
  loading,
  apiError,
}: {
  supplies: Supply[];
  loading: boolean;
  apiError?: string | null;
}) {
  if (loading) {
    return <div className="text-center py-8 text-slate-500">در حال بارگذاری محصولات...</div>;
  }

  if (apiError) {
    return (
      <div className="text-center py-12 text-amber-700">
        <AlertCircle className="h-12 w-12 mx-auto mb-3" />
        <p className="text-lg font-medium">محصولات و خدمات در دسترس نیست</p>
        <p className="text-sm mt-1 text-slate-500">{apiError}</p>
      </div>
    );
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
          <div key={supply.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
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