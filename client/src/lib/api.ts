/**
 * In dev the API is a separate process on :5000. In production the client and
 * the serverless API are served from the same Vercel deployment, so a relative
 * path is both correct and CORS-free. An explicit VITE_API_URL always wins.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const TOKEN_KEY = 'slotly-token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — the session just won't survive a reload */
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * fetch wrapper that attaches the bearer token and normalises errors.
 * A 401 clears the stored token so the app can't sit in a half-authed state.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    setToken(null);
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      typeof body?.error === 'string'
        ? body.error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

/* ----------------------------- Shared shapes ----------------------------- */

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
}

export interface DashboardStats {
  timezone: string;
  generatedAt: string;
  today: {
    date: string;
    bookings: number;
    freeHours: number;
    revenueCents: number;
    utilisationPct: number;
  };
  deltas: {
    bookingsPct: number | null;
    revenuePct: number | null;
    utilisationPct: number | null;
  };
  upcoming7d: number;
  week: {
    date: string;
    utilisationPct: number;
    bookings: number;
    revenueCents: number;
    assistantBookings: number;
  }[];
  staffUtilisation: {
    staffId: string;
    name: string;
    utilisationPct: number;
    bookedMinutes: number;
    workingMinutes: number;
  }[];
  sources: {
    assistant: number;
    web: number;
    phone: number;
    assistantSharePct: number;
  };
}

export interface AdminBooking {
  _id: string;
  startAt: string;
  endAt: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  source: 'assistant' | 'web' | 'phone';
  customer: { name: string; email: string; phone: string };
  serviceId: { _id: string; name: string; durationMin: number; priceCents: number; color?: string } | null;
  staffId: { _id: string; userId: { name: string } | null } | null;
}
