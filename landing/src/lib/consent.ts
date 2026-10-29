export const CONSENT_STORAGE_KEY = 'agroshield.analytics.consent.v1';

export type ConsentState = 'granted' | 'denied' | null;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readConsent(storage: StorageLike | null = defaultStorage()): ConsentState {
  try {
    const value = storage?.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(
  state: Exclude<ConsentState, null>,
  storage: StorageLike | null = defaultStorage(),
): void {
  try {
    storage?.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Storage may be unavailable (private mode, policy). Never break the page.
  }
}

export function clearConsent(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export const ANALYTICS_EVENTS = [
  'page_view',
  'cta_demo_click',
  'lead_submitted',
  'consent_accepted',
  'consent_rejected',
  'whatsapp_click',
  'login_click',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}
