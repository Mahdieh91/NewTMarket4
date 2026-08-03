// src/services/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 204) {
      return {} as T;
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message:
          typeof data === 'object' && data?.message
            ? data.message
            : typeof data === 'object' && data?.detail
            ? data.detail
            : response.statusText || `خطا در ارتباط با سرور (کد ${response.status})`,
        detail: typeof data === 'object' ? data : undefined,
      };
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: 'سرور در دسترس نیست. لطفاً اتصال اینترنت خود را بررسی کنید.',
      } as ApiError;
    }
    throw error;
  }
}

export const get = <T = any>(endpoint: string, options?: RequestInit) =>
  apiRequest<T>(endpoint, { ...options, method: 'GET' });

export const post = <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const put = <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const patch = <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });

export const del = <T = any>(endpoint: string, options?: RequestInit) =>
  apiRequest<T>(endpoint, { ...options, method: 'DELETE' });

export const uploadFile = <T = any>(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`, true);

    const token = localStorage.getItem('access_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress((e.loaded / e.total) * 100);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText as T);
        }
      } else {
        reject({
          status: xhr.status,
          message: xhr.statusText || 'خطا در آپلود فایل',
        });
      }
    };

    xhr.onerror = () => {
      reject({
        status: 0,
        message: 'خطا در اتصال به سرور',
      });
    };

    xhr.send(formData);
  });
};