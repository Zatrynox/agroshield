import { safeReference } from './lead';

export const LEAD_RECEIPT_KEY = 'agroshield.lead.receipt.v1';
const RECEIPT_TTL_MS = 60 * 60_000;
const CLOCK_SKEW_MS = 5 * 60_000;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LeadReceipt {
  id: string;
  receivedAt: number;
}

export function defaultStorage(): StorageLike | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function saveLeadReceipt(
  reference: string,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): void {
  const id = safeReference(reference);
  if (!id) return;
  try {
    storage?.setItem(LEAD_RECEIPT_KEY, JSON.stringify({ id, receivedAt: now }));
  } catch {
    // Storage can be unavailable. The caller still has the API reference.
  }
}

export function readLeadReceipt(
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): LeadReceipt | null {
  try {
    const raw = storage?.getItem(LEAD_RECEIPT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const id = safeReference((parsed as { id?: unknown }).id as string | undefined);
    const receivedAt = (parsed as { receivedAt?: unknown }).receivedAt;
    if (!id || typeof receivedAt !== 'number' || !Number.isFinite(receivedAt)) return null;
    if (receivedAt > now + CLOCK_SKEW_MS) return null;
    if (now - receivedAt > RECEIPT_TTL_MS) return null;
    return { id, receivedAt };
  } catch {
    return null;
  }
}

export function clearLeadReceipt(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(LEAD_RECEIPT_KEY);
  } catch {
    // Ignore storage failures.
  }
}
