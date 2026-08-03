// src/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'buyer' | 'seller' | 'consultant' | 'investor' | 'broker' | 'partner';
  phone?: string;
  company_name?: string;
  national_id?: string;
  registration_number?: string;
  economic_code?: string;
  documentsStatus?: 'red' | 'yellow' | 'green';
  username?: string;
  is_legal?: boolean;
  address?: string;
  website?: string;
  bio?: string;
  expertise?: string;
  activity_domain?: string;
  experience_summary?: string;
  kyc_status?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;      // تغییر نام
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void; // اضافه
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,        // تغییر نام
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // تابع setAuth برای همگام‌سازی
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
          const tokenRes = await fetch(`${API_URL}/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          const tokenData = await tokenRes.json();
          if (!tokenRes.ok) {
            throw new Error(tokenData.detail || tokenData.message || 'نام کاربری یا رمز عبور اشتباه است.');
          }

          const { access, refresh } = tokenData;

          // دریافت اطلاعات کاربر
          const userRes = await fetch(`${API_URL}/users/me/`, {
            headers: {
              Authorization: `Bearer ${access}`,
              'Content-Type': 'application/json',
            },
          });

          let user: User;
          if (userRes.ok) {
            const userData = await userRes.json();
            user = {
              id: userData.id,
              email: userData.email || username,
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              role: userData.role || 'buyer',
              phone: userData.phone || '',
              company_name: userData.company_name || '',
              national_id: userData.national_id || '',
              registration_number: userData.registration_number || '',
              economic_code: userData.economic_code || '',
              username: userData.username || username,
              is_legal: userData.is_legal || false,
              address: userData.address || '',
              website: userData.website || '',
              bio: userData.bio || '',
              expertise: userData.expertise || '',
              activity_domain: userData.activity_domain || '',
              experience_summary: userData.experience_summary || '',
              kyc_status: userData.kyc_status || 'draft',
            };
            if (user.kyc_status === 'approved') user.documentsStatus = 'green';
            else if (user.kyc_status === 'pending') user.documentsStatus = 'yellow';
            else user.documentsStatus = 'red';
          } else {
            user = {
              id: 0,
              email: username,
              first_name: '',
              last_name: '',
              role: 'buyer',
              username: username,
            };
          }

          // ذخیره در localStorage و state
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('user_role', user.role);

          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('❌ خطای لاگین:', error);
          set({
            isLoading: false,
            error: error.message || 'خطا در ورود به حساب کاربری',
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        localStorage.removeItem('rememberedUsername');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ user: null, isAuthenticated: false, accessToken: null });
          return;
        }

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
          const res = await fetch(`${API_URL}/users/me/`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });

          if (res.ok) {
            const userData = await res.json();
            const user: User = {
              id: userData.id,
              email: userData.email || '',
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              role: userData.role || 'buyer',
              phone: userData.phone || '',
              company_name: userData.company_name || '',
              national_id: userData.national_id || '',
              registration_number: userData.registration_number || '',
              economic_code: userData.economic_code || '',
              username: userData.username || '',
              is_legal: userData.is_legal || false,
              address: userData.address || '',
              website: userData.website || '',
              bio: userData.bio || '',
              expertise: userData.expertise || '',
              activity_domain: userData.activity_domain || '',
              experience_summary: userData.experience_summary || '',
              kyc_status: userData.kyc_status || 'draft',
            };
            if (user.kyc_status === 'approved') user.documentsStatus = 'green';
            else if (user.kyc_status === 'pending') user.documentsStatus = 'yellow';
            else user.documentsStatus = 'red';

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('user_role', user.role);
            set({ user, isAuthenticated: true, accessToken: token });
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, accessToken: null });
          }
        } catch {
          set({ user: null, isAuthenticated: false, accessToken: null });
        }
      },

      setUser: (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_role', user.role);
        set({ user, isAuthenticated: true });
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (updatedUser.role) localStorage.setItem('user_role', updatedUser.role);
        set({ user: updatedUser });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);