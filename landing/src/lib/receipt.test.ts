import { describe, expect, it } from 'vitest';
import {
  clearLeadReceipt,
  LEAD_RECEIPT_KEY,
  readLeadReceipt,
  saveLeadReceipt,
  type StorageLike,
} from './receipt';

const id = 'c4f1b7a2-9d31-4f0e-8c55-1a2b3c4d5e6f';

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

describe('lead receipt', () => {
  it('round-trips a valid receipt inside the browser tab', () => {
    const storage = memoryStorage();
    saveLeadReceipt(id, storage, 1_000);
    expect(readLeadReceipt(storage, 2_000)).toEqual({ id, receivedAt: 1_000 });
  });

  it('normalizes the reference and ignores malformed ids', () => {
    const storage = memoryStorage();
    saveLeadReceipt(id.toUpperCase(), storage, 1_000);
    expect(readLeadReceipt(storage, 2_000)?.id).toBe(id);
    saveLeadReceipt('not-a-uuid', storage, 1_000);
    expect(readLeadReceipt(storage, 2_000)?.id).toBe(id);
  });

  it('rejects expired, future or malformed receipts', () => {
    const storage = memoryStorage();
    saveLeadReceipt(id, storage, 1_000);
    expect(readLeadReceipt(storage, 1_000 + 61 * 60_000)).toBeNull();

    storage.setItem(
      LEAD_RECEIPT_KEY,
      JSON.stringify({ id, receivedAt: 1_000_000 }),
    );
    expect(readLeadReceipt(storage, 2_000)).toBeNull();

    storage.setItem(LEAD_RECEIPT_KEY, '{broken');
    expect(readLeadReceipt(storage, 2_000)).toBeNull();

    storage.setItem(LEAD_RECEIPT_KEY, JSON.stringify({ id: 'x', receivedAt: 1_000 }));
    expect(readLeadReceipt(storage, 2_000)).toBeNull();
  });

  it('clears the receipt and tolerates unavailable storage', () => {
    const storage = memoryStorage();
    saveLeadReceipt(id, storage, 1_000);
    clearLeadReceipt(storage);
    expect(readLeadReceipt(storage, 2_000)).toBeNull();

    expect(readLeadReceipt(null, 2_000)).toBeNull();
    expect(() => saveLeadReceipt(id, null, 1_000)).not.toThrow();
    expect(() => clearLeadReceipt(null)).not.toThrow();
  });
});
