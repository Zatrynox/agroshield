/**
 * Only same-origin panel destinations are accepted after login. This avoids
 * open-redirects via the `redirect` query parameter.
 */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/panel';
  if (!value.startsWith('/panel')) return '/panel';
  if (value.startsWith('//')) return '/panel';
  return value;
}
