import { appUrl } from '../lib/site';

export function initSessionLink(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-session-link]'));
  if (links.length === 0) return;

  const apply = (authenticated: boolean): void => {
    links.forEach((link) => {
      if (authenticated) {
        link.textContent = 'Ir a mi panel';
        link.setAttribute('href', appUrl);
        link.setAttribute('aria-label', 'Ir a mi panel de AgroShield');
      } else {
        link.textContent = 'Iniciar sesión';
        link.setAttribute('href', appUrl);
        link.setAttribute('aria-label', 'Iniciar sesión en AgroShield');
      }
    });
  };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4500);

  fetch('/api/v1/auth/session-status', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
    signal: controller.signal,
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload: unknown) => {
      if (
        typeof payload === 'object' &&
        payload !== null &&
        (payload as { authenticated?: unknown }).authenticated === true
      ) {
        apply(true);
      }
    })
    .catch(() => {
      // Keep the discreet login link when the API cannot be reached.
    })
    .finally(() => window.clearTimeout(timer));
}
