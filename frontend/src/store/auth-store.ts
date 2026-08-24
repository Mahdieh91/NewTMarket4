'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ============================================================
   User
============================================================ */

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

/* ============================================================
   Auth State
============================================================ */

interface AuthState {
  user: User | null;

  accessToken: string | null;

  refreshToken: string | null;

  isLoading: boolean;

  error: string | null;

  isAuthenticated: boolean;

  login: (
    username: string,
    password: string
  ) => Promise<void>;

  logout: () => void;

  fetchUser: () => Promise<void>;

  setUser: (user: User) => void;

  setAuth: (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => void;

  clearError: () => void;

  updateUser: (
    data: Partial<User>
  ) => void;
}

/* ============================================================
   API URL
============================================================ */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api';

/* ============================================================
   Browser
============================================================ */

const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/* ============================================================
   Access Token
============================================================ */

export const getAccessToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    null
  );
};

/* ============================================================
   Refresh Token
============================================================ */

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  return (
    localStorage.getItem('refresh_token') ||
    localStorage.getItem('refreshToken') ||
    null
  );
};

/* ============================================================
   Save Tokens
============================================================ */

const saveTokens = (
  accessToken: string,
  refreshToken?: string | null
): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    'access_token',
    accessToken
  );

  /*
   * حذف کلیدهای قدیمی
   */

  localStorage.removeItem(
    'accessToken'
  );

  localStorage.removeItem(
    'token'
  );

  if (refreshToken) {
    localStorage.setItem(
      'refresh_token',
      refreshToken
    );

    localStorage.removeItem(
      'refreshToken'
    );
  }
};

/* ============================================================
   Clear Authentication
============================================================ */

export const clearStoredAuth = (): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(
    'access_token'
  );

  localStorage.removeItem(
    'accessToken'
  );

  localStorage.removeItem(
    'token'
  );

  localStorage.removeItem(
    'refresh_token'
  );

  localStorage.removeItem(
    'refreshToken'
  );

  localStorage.removeItem(
    'user'
  );

  localStorage.removeItem(
    'user_role'
  );

  localStorage.removeItem(
    'rememberedUsername'
  );
};

/* ============================================================
   Normalize User
============================================================ */

const normalizeUser = (
  userData: any
): User => {
  const user: User = {
    id: userData?.id ?? 0,

    email:
      userData?.email || '',

    first_name:
      userData?.first_name || '',

    last_name:
      userData?.last_name || '',

    role:
      userData?.role || 'buyer',

    phone:
      userData?.phone || '',

    company_name:
      userData?.company_name || '',

    national_id:
      userData?.national_id || '',

    registration_number:
      userData?.registration_number || '',

    economic_code:
      userData?.economic_code || '',

    username:
      userData?.username || '',

    is_legal:
      Boolean(userData?.is_legal),

    address:
      userData?.address || '',

    website:
      userData?.website || '',

    bio:
      userData?.bio || '',

    expertise:
      userData?.expertise || '',

    activity_domain:
      userData?.activity_domain || '',

    experience_summary:
      userData?.experience_summary || '',

    kyc_status:
      userData?.kyc_status || 'draft',
  };

  if (
    user.kyc_status === 'approved'
  ) {
    user.documentsStatus = 'green';
  } else if (
    user.kyc_status === 'pending'
  ) {
    user.documentsStatus = 'yellow';
  } else {
    user.documentsStatus = 'red';
  }

  return user;
};

/* ============================================================
   Refresh Access Token
============================================================ */

export const refreshAccessToken =
  async (): Promise<string | null> => {
    if (!isBrowser()) {
      return null;
    }

    const refreshToken =
      getRefreshToken();

    if (!refreshToken) {
      console.warn(
        '⚠️ Refresh token وجود ندارد'
      );

      return null;
    }

    try {
      console.log(
        '🔄 Refreshing access token...'
      );

      const response =
        await fetch(
          `${API_URL}/token/refresh/`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              refresh:
                refreshToken,
            }),
          }
        );

      if (!response.ok) {
        console.warn(
          '⚠️ Refresh failed:',
          response.status
        );

        return null;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      const newAccessToken =
        data?.access;

      if (!newAccessToken) {
        console.warn(
          '⚠️ Refresh response فاقد access token است'
        );

        return null;
      }

      const newRefreshToken =
        data?.refresh ||
        refreshToken;

      saveTokens(
        newAccessToken,
        newRefreshToken
      );

      useAuthStore.setState({
        accessToken:
          newAccessToken,

        refreshToken:
          newRefreshToken,

        isAuthenticated:
          true,
      });

      console.log(
        '✅ Access token refreshed'
      );

      return newAccessToken;
    } catch (error) {
      console.error(
        '❌ Refresh error:',
        error
      );

      return null;
    }
  };

/* ============================================================
   Authenticated Fetch
============================================================ */

export const authenticatedFetch =
  async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> => {
    let accessToken =
      getAccessToken();

    if (!accessToken) {
      console.warn(
        '⚠️ authenticatedFetch: access token وجود ندارد'
      );

      return new Response(
        JSON.stringify({
          detail:
            'No access token',
        }),
        {
          status: 401,

          headers: {
            'Content-Type':
              'application/json',
          },
        }
      );
    }

    const makeRequest =
      async (
        token: string
      ): Promise<Response> => {
        const headers =
          new Headers(
            init.headers || {}
          );

        headers.set(
          'Authorization',
          `Bearer ${token}`
        );

        /*
         * JSON
         */

        if (
          !headers.has(
            'Content-Type'
          ) &&
          !(
            typeof FormData !==
              'undefined' &&
            init.body instanceof
              FormData
          )
        ) {
          headers.set(
            'Content-Type',
            'application/json'
          );
        }

        return fetch(
          input,
          {
            ...init,
            headers,
          }
        );
      };

    console.log(
      '🔐 API Request:',
      input.toString()
    );

    console.log(
      '🔑 Access Token:',
      accessToken
        ? `${accessToken.substring(
            0,
            20
          )}...`
        : 'NONE'
    );

    /*
     * درخواست اول
     */

    let response =
      await makeRequest(
        accessToken
      );

    console.log(
      '📡 API Status:',
      response.status
    );

    /*
     * اگر 401
     */

    if (
      response.status === 401
    ) {
      console.warn(
        '⚠️ API returned 401. Trying refresh...'
      );

      const newAccessToken =
        await refreshAccessToken();

      if (!newAccessToken) {
        console.error(
          '❌ Refresh token failed'
        );

        return response;
      }

      accessToken =
        newAccessToken;

      /*
       * فقط یک Retry
       */

      response =
        await makeRequest(
          accessToken
        );

      console.log(
        '📡 Retry API Status:',
        response.status
      );
    }

    return response;
  };

/* ============================================================
   Zustand Store
============================================================ */

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set, get) => ({

        /* ======================================================
           Initial
        ====================================================== */

        user: null,

        accessToken: null,

        refreshToken: null,

        isLoading: false,

        error: null,

        isAuthenticated: false,

        /* ======================================================
           setAuth
        ====================================================== */

        setAuth: (
          user,
          accessToken,
          refreshToken
        ) => {
          saveTokens(
            accessToken,
            refreshToken
          );

          if (isBrowser()) {
            localStorage.setItem(
              'user',
              JSON.stringify(user)
            );

            localStorage.setItem(
              'user_role',
              user.role
            );
          }

          set({
            user,

            accessToken,

            refreshToken,

            isAuthenticated:
              true,

            isLoading: false,

            error: null,
          });
        },

        /* ======================================================
           Login
        ====================================================== */

        login: async (
          username,
          password
        ) => {
          set({
            isLoading: true,

            error: null,
          });

          try {
            const tokenRes =
              await fetch(
                `${API_URL}/token/`,
                {
                  method: 'POST',

                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body: JSON.stringify({
                    username,
                    password,
                  }),
                }
              );

            const tokenData =
              await tokenRes
                .json()
                .catch(() => ({}));

            if (!tokenRes.ok) {
              throw new Error(
                tokenData?.detail ||
                  tokenData?.message ||
                  'نام کاربری یا رمز عبور اشتباه است.'
              );
            }

            const access =
              tokenData?.access;

            const refresh =
              tokenData?.refresh;

            if (
              !access ||
              !refresh
            ) {
              throw new Error(
                'توکن احراز هویت از سرور دریافت نشد.'
              );
            }

            /*
             * دریافت User
             */

            let user: User;

            const userRes =
              await fetch(
                `${API_URL}/users/me/`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${access}`,

                    'Content-Type':
                      'application/json',
                  },
                }
              );

            if (userRes.ok) {
              const userData =
                await userRes.json();

              user =
                normalizeUser(
                  userData
                );
            } else {
              /*
               * Login را به خاطر /me
               * fail نکن.
               */

              user =
                normalizeUser({
                  id: 0,

                  email: username,

                  username,

                  role: 'buyer',
                });
            }

            saveTokens(
              access,
              refresh
            );

            if (isBrowser()) {
              localStorage.setItem(
                'user',
                JSON.stringify(user)
              );

              localStorage.setItem(
                'user_role',
                user.role
              );
            }

            set({
              user,

              accessToken:
                access,

              refreshToken:
                refresh,

              isAuthenticated:
                true,

              isLoading: false,

              error: null,
            });

            console.log(
              '✅ Login successful'
            );
          } catch (error: any) {
            console.error(
              '❌ Login error:',
              error
            );

            clearStoredAuth();

            set({
              user: null,

              accessToken: null,

              refreshToken: null,

              isLoading: false,

              error:
                error?.message ||
                'خطا در ورود به حساب کاربری',

              isAuthenticated:
                false,
            });

            throw error;
          }
        },

        /* ======================================================
           Logout
        ====================================================== */

        logout: () => {
          console.log(
            '🔒 Logout'
          );

          clearStoredAuth();

          set({
            user: null,

            accessToken: null,

            refreshToken: null,

            isAuthenticated:
              false,

            isLoading: false,

            error: null,
          });
        },

        /* ======================================================
           fetchUser
        ====================================================== */

        fetchUser: async () => {
          let token =
            getAccessToken();

          if (!token) {
            set({
              user: null,

              isAuthenticated:
                false,

              accessToken: null,
            });

            return;
          }

          try {
            let response =
              await fetch(
                `${API_URL}/users/me/`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,

                    'Content-Type':
                      'application/json',
                  },
                }
              );

            /*
             * Refresh اگر 401
             */

            if (
              response.status === 401
            ) {
              const newToken =
                await refreshAccessToken();

              if (!newToken) {
                get().logout();

                return;
              }

              token =
                newToken;

              response =
                await fetch(
                  `${API_URL}/users/me/`,
                  {
                    headers: {
                      Authorization:
                        `Bearer ${token}`,

                      'Content-Type':
                        'application/json',
                    },
                  }
                );
            }

            if (!response.ok) {
              if (
                response.status === 401
              ) {
                get().logout();
              }

              return;
            }

            const userData =
              await response.json();

            const user =
              normalizeUser(
                userData
              );

            if (isBrowser()) {
              localStorage.setItem(
                'user',
                JSON.stringify(user)
              );

              localStorage.setItem(
                'user_role',
                user.role
              );
            }

            set({
              user,

              isAuthenticated:
                true,

              accessToken:
                token,

              refreshToken:
                getRefreshToken(),
            });
          } catch (error) {
            /*
             * خطای شبکه نباید logout کند.
             */

            console.error(
              '❌ fetchUser error:',
              error
            );
          }
        },

        /* ======================================================
           setUser
        ====================================================== */

        setUser: (
          user
        ) => {
          if (isBrowser()) {
            localStorage.setItem(
              'user',
              JSON.stringify(user)
            );

            localStorage.setItem(
              'user_role',
              user.role
            );
          }

          set({
            user,

            isAuthenticated:
              true,
          });
        },

        /* ======================================================
           updateUser
        ====================================================== */

        updateUser: (
          data
        ) => {
          const currentUser =
            get().user;

          if (!currentUser) {
            return;
          }

          const updatedUser = {
            ...currentUser,
            ...data,
          };

          if (isBrowser()) {
            localStorage.setItem(
              'user',
              JSON.stringify(
                updatedUser
              )
            );

            localStorage.setItem(
              'user_role',
              updatedUser.role
            );
          }

          set({
            user:
              updatedUser,
          });
        },

        /* ======================================================
           clearError
        ====================================================== */

        clearError: () => {
          set({
            error: null,
          });
        },
      }),

      /* ========================================================
         Persist
      ======================================================== */

      {
        name: 'auth-storage',

        partialize: (
          state
        ) => ({
          user:
            state.user,

          accessToken:
            state.accessToken,

          refreshToken:
            state.refreshToken,

          isAuthenticated:
            state.isAuthenticated,
        }),
      }
    )
  );