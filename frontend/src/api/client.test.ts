import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, onUnauthorized, setCsrfToken } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  setCsrfToken(null);
  onUnauthorized(null);
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('sends the CSRF header on mutations and cookies on every call', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    setCsrfToken('csrf-value');

    await api.post('/farms', { name: 'La Vega' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/farms');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({
      accept: 'application/json',
      'content-type': 'application/json',
      'x-csrf-token': 'csrf-value',
    });
    expect(init.body).toBe(JSON.stringify({ name: 'La Vega' }));
  });

  it('never sends the CSRF header on reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    vi.stubGlobal('fetch', fetchMock);
    setCsrfToken('csrf-value');

    await api.get('/alerts', { query: { status: 'open', farmId: undefined, empty: '' } });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/alerts?status=open');
    expect((init.headers as Record<string, string>)['x-csrf-token']).toBeUndefined();
  });

  it('maps Problem Details to ApiError and notifies unauthorized handlers', async () => {
    const unauthorized = vi.fn();
    onUnauthorized(unauthorized);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            type: 'https://agroshield.example/problems/session_expired',
            title: 'Sesión caducada',
            detail: 'Vuelve a iniciar sesión.',
            status: 401,
            code: 'session_expired',
          },
          401,
        ),
      ),
    );

    await expect(api.get('/auth/me')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'session_expired',
      detail: 'Vuelve a iniciar sesión.',
    });
    expect(unauthorized).toHaveBeenCalledOnce();
  });

  it('can skip the global unauthorized handler', async () => {
    const unauthorized = vi.fn();
    onUnauthorized(unauthorized);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ title: 'No', detail: 'No', code: 'no' }, 401)),
    );

    await expect(
      api.get('/auth/session-status', { skipUnauthorizedHandler: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('turns transport failures into a network ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    const error = await api.get('/health').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'network_error' });
    expect((error as ApiError).isNetworkError).toBe(true);
  });

  it('rejects 204 responses as null and keeps empty JSON bodies safe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api.delete('/farms/1')).resolves.toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })),
    );
    await expect(api.get('/text')).resolves.toBe('not-json');
  });
});
