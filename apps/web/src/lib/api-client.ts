import { sleep } from '@/lib/utils';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
const ORG_KEY = 'ef-active-org';

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, errors: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/* ---- In-memory session state. The access token is NEVER written to localStorage/sessionStorage. ---- */
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

function readStoredOrganizationId(): string | null {
  try {
    return localStorage.getItem(ORG_KEY);
  } catch {
    return null;
  }
}
let activeOrganizationId: string | null = readStoredOrganizationId();

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};
/** An organization id is not a secret. The server re-verifies membership on every request. */
export function setActiveOrganizationId(id: string | null) {
  activeOrganizationId = id;
  try {
    if (id) localStorage.setItem(ORG_KEY, id);
    else localStorage.removeItem(ORG_KEY);
  } catch {
    /* storage unavailable: the id simply is not remembered */
  }
}

interface Envelope<T, M = Record<string, unknown>> {
  data: T;
  meta: M;
}

interface RawOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  token?: string | null;
  organizationId?: string | null;
}

async function rawRequest<T, M>(path: string, options: RawOptions = {}): Promise<Envelope<T, M>> {
  const { method = 'GET', body, signal, token, organizationId } = options;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      credentials: 'include', // refresh cookie
      headers: {
        'X-Requested-With': 'EstateFlow', // CSRF defense; forces a CORS preflight
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(organizationId ? { 'X-Organization-Id': organizationId } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err; // cancelled by TanStack Query
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection and try again.');
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    meta?: M;
    message?: string;
    code?: string;
    errors?: ApiErrorDetail[];
  } | null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.code ?? 'HTTP_ERROR', payload?.message ?? response.statusText, payload?.errors ?? []);
  }
  return { data: payload?.data as T, meta: (payload?.meta ?? {}) as M };
}

/* ---- Single-flight refresh: concurrent 401s share one refresh call (prevents rotation races). ---- */
let refreshInFlight: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const call = () => rawRequest<{ accessToken: string }, unknown>('/auth/refresh', { method: 'POST' });
  try {
    accessToken = (await call()).data.accessToken;
  } catch (err) {
    if (!(err instanceof ApiError && err.code === 'REFRESH_CONFLICT')) throw err;
    await sleep(400); // another tab rotated the cookie at the same moment; retry once with the new cookie
    accessToken = (await call()).data.accessToken;
  }
  return accessToken as string;
}

export function refreshSession(): Promise<string> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  /** false for public endpoints (login, register...). Default true. */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Central API call. On a 401 it refreshes the session once and replays the request.
 * The replay never triggers another refresh, so there is no loop. If the refresh itself fails with 401
 * the session is over and the registered handler signs the user out.
 */
async function execute<T, M>(path: string, options: RequestOptions): Promise<Envelope<T, M>> {
  const auth = options.auth ?? true;
  const send = (token: string | null) =>
    rawRequest<T, M>(path, {
      method: options.method,
      body: options.body,
      signal: options.signal,
      token: auth ? token : null,
      organizationId: auth ? activeOrganizationId : null,
    });

  try {
    return await send(accessToken);
  } catch (err) {
    if (!auth || !(err instanceof ApiError) || err.status !== 401) throw err;

    let token: string;
    try {
      token = await refreshSession();
    } catch (refreshErr) {
      if (refreshErr instanceof ApiError && refreshErr.status === 401) {
        accessToken = null;
        onSessionExpired?.();
      }
      throw refreshErr;
    }
    return send(token); // a 401 here propagates; no second refresh
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return (await execute<T, unknown>(path, options)).data;
}

/** For list endpoints: returns the data plus the pagination meta. */
export async function apiRequestPaged<T, M = Record<string, unknown>>(path: string, options: RequestOptions = {}) {
  return execute<T, M>(path, options);
}