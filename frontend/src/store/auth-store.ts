// ============================================================
// src/store/auth-store.ts
// نسخه نهایی - بدون throw و console.error برای خطاهای اعتبارسنجی
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role:
    | 'admin'
    | 'buyer'
    | 'seller'
    | 'consultant'
    | 'investor'
    | 'broker'
    | 'partner';
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
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string,
    captcha_answer: string
  ) => Promise<boolean>; // تغییر: به جای void، boolean برمی‌گرداند
  logout: () => void;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const getAccessToken = (): string | null => {
  if (!isBrowser()) return null;
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    null
  );
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) return null;
  return (
    localStorage.getItem('refresh_token') ||
    localStorage.getItem('refreshToken') ||
    null
  );
};

const saveTokens = (accessToken: string, refreshToken?: string | null): void => {
  if (!isBrowser()) return;
  localStorage.setItem('access_token', accessToken);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.removeItem('refreshToken');
  }
};

export const clearStoredAuth = (): void => {
  if (!isBrowser()) return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('user_role');
  localStorage.removeItem('rememberedUsername');
};

const normalizeUser = (userData: any): User => {
  const user: User = {
    id: userData?.id ?? 0,
    email: userData?.email || '',
    first_name: userData?.first_name || '',
    last_name: userData?.last_name || '',
    role: userData?.role || 'buyer',
    phone: userData?.phone || '',
    company_name: userData?.company_name || '',
    national_id: userData?.national_id || '',
    registration_number: userData?.registration_number || '',
    economic_code: userData?.economic_code || '',
    username: userData?.username || '',
    is_legal: Boolean(userData?.is_legal),
    address: userData?.address || '',
    website: userData?.website || '',
    bio: userData?.bio || '',
    expertise: userData?.expertise || '',
    activity_domain: userData?.activity_domain || '',
    experience_summary: userData?.experience_summary || '',
    kyc_status: userData?.kyc_status || 'draft',
  };
  if (user.kyc_status === 'approved') user.documentsStatus = 'green';
  else if (user.kyc_status === 'pending') user.documentsStatus = 'yellow';
  else user.documentsStatus = 'red';
  return user;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (!isBrowser()) return null;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) {
      console.warn('⚠️ Refresh token failed:', response.status);
      return null;
    }
    const data = await response.json();
    const newAccessToken = data?.access;
    if (!newAccessToken) {
      console.warn('⚠️ Refresh response did not contain access token');
      return null;
    }
    saveTokens(newAccessToken, data?.refresh || refreshToken);
    useAuthStore.setState({
      accessToken: newAccessToken,
      refreshToken: data?.refresh || refreshToken,
      isAuthenticated: true,
    });
    return newAccessToken;
  } catch (error) {
    console.error('❌ Error refreshing access token:', error);
    return null;
  }
};

export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  let token = getAccessToken();
  if (!token) {
    return new Response(
      JSON.stringify({ detail: 'No access token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const makeRequest = async (accessToken: string): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(input, { ...init, headers });
  };
  let response = await makeRequest(token);
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      token = newToken;
      response = await makeRequest(token);
    }
  }
  return response;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        saveTokens(accessToken, refreshToken);
        if (isBrowser()) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('user_role', user.role);
        }
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      // ============================================================
      // login - بدون throw برای خطاهای اعتبارسنجی
      // ============================================================
      login: async (username, password, captcha_answer) => {
        set({ isLoading: true, error: null });

        try {
          const tokenRes = await fetch(`${API_URL}/users/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, captcha_answer }),
          });

          const tokenData = await tokenRes.json().catch(() => ({}));

          // ============================================================
          // خطای اعتبارسنجی (400, 401, ...)
          // ============================================================
          if (!tokenRes.ok) {
            let message = 'خطا در ورود به حساب کاربری';

            if (tokenData?.captcha_answer) {
              message = Array.isArray(tokenData.captcha_answer)
                ? String(tokenData.captcha_answer[0])
                : String(tokenData.captcha_answer);
            } else if (tokenData?.errors?.captcha_answer) {
              message = Array.isArray(tokenData.errors.captcha_answer)
                ? String(tokenData.errors.captcha_answer[0])
                : String(tokenData.errors.captcha_answer);
            } else if (tokenData?.detail) {
              message = Array.isArray(tokenData.detail)
                ? String(tokenData.detail[0])
                : String(tokenData.detail);
            } else if (tokenData?.message) {
              message = Array.isArray(tokenData.message)
                ? String(tokenData.message[0])
                : String(tokenData.message);
            } else if (tokenData?.non_field_errors) {
              message = Array.isArray(tokenData.non_field_errors)
                ? String(tokenData.non_field_errors[0])
                : String(tokenData.non_field_errors);
            }

            clearStoredAuth();

            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isLoading: false,
              error: message,
              isAuthenticated: false,
            });

            return false; // ورود ناموفق
          }

          // ============================================================
          // بررسی توکن
          // ============================================================
          const access = tokenData?.access;
          const refresh = tokenData?.refresh;

          if (!access || !refresh) {
            const message = 'توکن احراز هویت از سرور دریافت نشد.';
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isLoading: false,
              error: message,
              isAuthenticated: false,
            });
            return false;
          }

          // ============================================================
          // دریافت کاربر
          // ============================================================
          let user: User;
          const userRes = await fetch(`${API_URL}/users/me/`, {
            headers: {
              Authorization: `Bearer ${access}`,
              'Content-Type': 'application/json',
            },
          });

          if (userRes.ok) {
            const userData = await userRes.json();
            user = normalizeUser(userData);
          } else {
            user = normalizeUser({
              id: 0,
              email: username,
              username,
              role: 'buyer',
            });
          }

          // ============================================================
          // ذخیره احراز هویت
          // ============================================================
          saveTokens(access, refresh);
          if (isBrowser()) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('user_role', user.role);
          }

          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true; // ورود موفق

        } catch (error: any) {
          // ============================================================
          // خطای شبکه یا غیرمنتظره
          // ============================================================
          const message =
            error?.message ||
            'ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.';

          clearStoredAuth();

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: message,
            isAuthenticated: false,
          });

          return false;
        }
      },

      logout: () => {
        clearStoredAuth();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      fetchUser: async () => {
        let token = getAccessToken();
        if (!token) {
          set({ user: null, isAuthenticated: false, accessToken: null });
          return;
        }
        try {
          let response = await fetch(`${API_URL}/users/me/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
              get().logout();
              return;
            }
            token = newToken;
            response = await fetch(`${API_URL}/users/me/`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          }
          if (!response.ok) {
            if (response.status === 401) get().logout();
            return;
          }
          const userData = await response.json();
          const user = normalizeUser(userData);
          if (isBrowser()) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('user_role', user.role);
          }
          set({
            user,
            isAuthenticated: true,
            accessToken: token,
            refreshToken: getRefreshToken(),
          });
        } catch (error) {
          console.error('❌ خطا در دریافت کاربر:', error);
        }
      },

      setUser: (user: User) => {
        if (isBrowser()) {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('user_role', user.role);
        }
        set({ user, isAuthenticated: true });
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...data };
        if (isBrowser()) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (updatedUser.role) localStorage.setItem('user_role', updatedUser.role);
        }
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