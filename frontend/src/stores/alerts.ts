import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/api/client';
import type { Alert } from '@/api/types';

export const useAlertsStore = defineStore('alerts', () => {
  const items = ref<Alert[]>([]);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref<string | null>(null);

  const criticalCount = computed(
    () => items.value.filter((alert) => alert.severity === 'critical').length,
  );
  const count = computed(() => items.value.length);

  async function load(force = false): Promise<void> {
    if (loading.value) return;
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = null;
    try {
      items.value = await api.get<Alert[]>('/alerts');
      loaded.value = true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'No se pudieron cargar las alertas.';
    } finally {
      loading.value = false;
    }
  }

  async function acknowledge(id: string): Promise<Alert> {
    const updated = await api.post<Alert>(`/alerts/${id}/acknowledge`);
    items.value = items.value.filter((alert) => alert.id !== id);
    return updated;
  }

  function reset(): void {
    items.value = [];
    loaded.value = false;
    error.value = null;
  }

  return { items, loading, loaded, error, criticalCount, count, load, acknowledge, reset };
});
