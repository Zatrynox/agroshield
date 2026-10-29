export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    title: string,
    readonly detail: string,
    readonly problem?: ProblemDetails,
  ) {
    super(detail || title);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

type UnauthorizedHandler = () => void;

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/+$/, '');
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let csrfToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function onUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export function getApiBase(): string {
  return API_BASE;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  skipUnauthorizedHandler?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalized}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return `${url.pathname}${url.search}`;
}

function isProblem(value: unknown): value is ProblemDetails & {
  title: string;
  detail: string;
  code: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ProblemDetails).title === 'string' &&
    typeof (value as ProblemDetails).detail === 'string'
  );
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text || null;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (!SAFE_METHODS.has(method) && csrfToken) {
    headers['x-csrf-token'] = csrfToken;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      0,
      'network_error',
      'Sin conexión',
      'No hemos podido contactar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  }

  const payload = await parsePayload(response);

  if (response.ok) {
    return payload as T;
  }

  const problem = isProblem(payload) ? payload : undefined;
  const code = problem?.code ?? `http_${response.status}`;
  const detail =
    problem?.detail ??
    (response.status >= 500
      ? 'El servidor no ha podido completar la operación. Inténtalo de nuevo.'
      : 'La operación no se ha podido completar.');

  if (response.status === 401 && !options.skipUnauthorizedHandler) {
    unauthorizedHandler?.();
  }

  throw new ApiError(
    response.status,
    code,
    problem?.title ?? 'No se pudo completar la operación',
    detail,
    payload as ProblemDetails | undefined,
  );
}

export async function getSystemHealth(): Promise<{
  status: 'ok' | 'degraded';
  database: string;
  demoMode: boolean;
  version: string;
  timestamp: string;
}> {
  const url = new URL(API_BASE, window.location.origin);
  url.pathname = `${url.pathname.replace(/\/v1\/?$/, '')}/health`;
  const response = await fetch(`${url.pathname}`, {
    headers: { accept: 'application/json' },
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'health_unavailable', 'Servicio no disponible', 'No se pudo consultar el estado.');
  }
  return (await response.json()) as {
    status: 'ok' | 'degraded';
    database: string;
    demoMode: boolean;
    version: string;
    timestamp: string;
  };
}

export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};
