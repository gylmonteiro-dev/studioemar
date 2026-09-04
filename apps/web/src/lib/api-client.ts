import { authSessionSchema } from '@studioemar/shared';
import { applyAuthSession, clearSession, getSession } from './session';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

const DEFAULT_API_URL = 'http://localhost:3001';

let refreshInFlight: Promise<boolean> | null = null;

export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

function parseError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object') {
    const record = body as { message?: unknown; code?: string };
    if (typeof record.message === 'string') {
      return new ApiError(status, record.message, record.code);
    }
    if (record.message && typeof record.message === 'object' && 'message' in record.message) {
      const nested = record.message as { code?: string; message?: unknown };
      const text =
        typeof nested.message === 'string'
          ? nested.message
          : 'Não foi possível concluir';
      return new ApiError(status, text, nested.code ?? record.code);
    }
  }
  return new ApiError(status, 'Não foi possível concluir');
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const session = getSession();
    if (!session?.refreshToken) {
      return false;
    }
    try {
      const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      const body = await readBody(response);
      if (!response.ok) {
        return false;
      }
      applyAuthSession(authSessionSchema.parse(body));
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const auth = options.auth !== false;
  const retry = options.retry !== false;
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const session = getSession();
    if (session?.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body:
      options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const body = await readBody(response);

  if (
    response.status === 401 &&
    auth &&
    retry &&
    getSession()?.refreshToken
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: false });
    }
    clearSession();
    throw parseError(response.status, body);
  }

  if (!response.ok) {
    throw parseError(response.status, body);
  }

  return body as T;
}

