import {
  isAnalyticsEventName,
  readConsent,
  type AnalyticsEventName,
} from '../lib/consent';

const ANALYTICS_ENDPOINT = '/api/v1/analytics/events';
let pageViewSent = false;

function currentPath(): string {
  const path = `${window.location.pathname}${window.location.search}`;
  return path.slice(0, 300);
}

function send(event: AnalyticsEventName, props: Record<string, string | number | boolean>): void {
  if (readConsent() !== 'granted') return;
  const body = JSON.stringify({
    name: event,
    path: currentPath(),
    props,
    consent: true,
  });

  try {
    void fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt the page.
    });
  } catch {
    // Ignore transport failures.
  }
}

export function track(
  event: AnalyticsEventName,
  props: Record<string, string | number | boolean> = {},
): void {
  send(event, props);
}

export function trackPageView(): void {
  if (pageViewSent) return;
  pageViewSent = true;
  send('page_view', {});
}

function placement(element: Element): string {
  const value = element.getAttribute('data-event-placement') ?? 'unknown';
  return value.slice(0, 60);
}

export function initAnalytics(): void {
  trackPageView();

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLElement>('[data-event]');
    if (!trigger) return;
    const name = trigger.getAttribute('data-event') ?? '';
    if (!isAnalyticsEventName(name)) return;
    send(name, { placement: placement(trigger) });
  });
}
