import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getSystemHealth } from '@/api/client';
import type { Health } from '@/api/types';

export const useHealthStore = defineStore('health', () => {
  const data = ref<Health | null>(null);
  let requested = false;

  async function load(): Promise<void> {
    if (requested) return;
    requested = true;
    try {
      data.value = await getSystemHealth();
    } catch {
      data.value = null;
    }
  }

  return { data, load };
});
