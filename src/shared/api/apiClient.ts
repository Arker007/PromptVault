import { ApiError } from '../types/index.ts';

const TOKEN_KEY = 'pv_auth_token';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export class RequestError extends Error {
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(message: string, code: string = 'REQUEST_ERROR', fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401) {
      authStorage.removeToken();
      // Only redirect to login if currently accessing protected routes
      if (window.location.pathname.startsWith('/settings')) {
        window.location.href = '/login?expired=1';
      }
    }
    const message = data?.message || `Request failed with status ${res.status}`;
    const code = data?.code || `HTTP_${res.status}`;
    throw new RequestError(message, code, data?.fieldErrors);
  }

  return data as T;
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const token = authStorage.getToken();
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      });
    }
    const qs = query.toString();
    const fullUrl = qs ? `${url}?${qs}` : url;

    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return handleResponse<T>(res);
  },

  async post<T>(url: string, body?: any): Promise<T> {
    const token = authStorage.getToken();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async patch<T>(url: string, body?: any): Promise<T> {
    const token = authStorage.getToken();
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(url: string, body?: any): Promise<T> {
    const token = authStorage.getToken();
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(res);
  },
};
