import { ref } from 'vue';
import { defineStore } from 'pinia';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

let nextId = 1;

export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  function dismiss(id: number): void {
    items.value = items.value.filter((item) => item.id !== id);
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }

  function push(message: string, tone: ToastTone = 'info', ttlMs = 5000): void {
    const id = nextId++;
    items.value = [...items.value.slice(-2), { id, message, tone }];
    if (ttlMs > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), ttlMs),
      );
    }
  }

  function success(message: string): void {
    push(message, 'success');
  }

  function error(message: string): void {
    push(message, 'error', 8000);
  }

  return { items, push, success, error, dismiss };
});
