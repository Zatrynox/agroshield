import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  clearConsent,
  isAnalyticsEventName,
  readConsent,
  writeConsent,
  type StorageLike,
} from './consent';

function memoryStorage(seed: Record<string, string> = {}): StorageLike & {
  values: Map<string, string>;
} {
  const values = new Map(Object.entries(seed));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('consent storage', () => {
  it('starts without a decision', () => {
    expect(readConsent(memoryStorage())).toBeNull();
  });

  it('round-trips granted and denied states', () => {
    const storage = memoryStorage();
    writeConsent('granted', storage);
    expect(readConsent(storage)).toBe('granted');

    writeConsent('denied', storage);
    expect(readConsent(storage)).toBe('denied');
  });

  it('ignores corrupted or unrelated values', () => {
    expect(readConsent(memoryStorage({ 'agroshield.analytics.consent.v1': 'yes' }))).toBeNull();
    expect(readConsent(memoryStorage({ 'agroshield.analytics.consent.v1': 'true' }))).toBeNull();
  });

  it('clears the decision and tolerates storage failures', () => {
    const storage = memoryStorage();
    writeConsent('denied', storage);
    clearConsent(storage);
    expect(readConsent(storage)).toBeNull();

    const broken: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };

    expect(readConsent(broken)).toBeNull();
    expect(() => writeConsent('granted', broken)).not.toThrow();
    expect(() => clearConsent(broken)).not.toThrow();
    expect(readConsent(null)).toBeNull();
  });
});

describe('analytics event allow-list', () => {
  it('matches the server contract exactly', () => {
    expect([...ANALYTICS_EVENTS]).toEqual([
      'page_view',
      'cta_demo_click',
      'lead_submitted',
      'consent_accepted',
      'consent_rejected',
      'whatsapp_click',
      'login_click',
    ]);
  });

  it('rejects arbitrary event names', () => {
    expect(isAnalyticsEventName('page_view')).toBe(true);
    expect(isAnalyticsEventName('purchase')).toBe(false);
    expect(isAnalyticsEventName('__proto__')).toBe(false);
  });
});
