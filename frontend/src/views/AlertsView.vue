<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StateMessage from '@/components/StateMessage.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useI18n } from '@/i18n';
import { countdown, formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/online';

const alerts = useAlertsStore();
const { t } = useI18n();
const now = useNow();

const farmFilter = ref('');
const zoneFilter = ref('');
const severityFilter = ref('');
const refreshing = ref(false);

const farmOptions = computed(() =>
  [...new Set(alerts.items.map((alert) => alert.farmName))].sort((a, b) => a.localeCompare(b, 'es')),
);

const zoneOptions = computed(() => {
  const map = new Map<string, string>();
  for (const alert of alerts.items) {
    if (!farmFilter.value || alert.farmName === farmFilter.value) {
      map.set(alert.zoneId, alert.zoneName);
    }
  }
  return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
});

const filtered = computed(() =>
  [...alerts.items]
    .filter(
      (alert) =>
        (!farmFilter.value || alert.farmName === farmFilter.value) &&
        (!zoneFilter.value || alert.zoneId === zoneFilter.value) &&
        (!severityFilter.value || alert.severity === severityFilter.value),
    )
    .sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime()),
);

const hasFilters = computed(
  () => Boolean(farmFilter.value || zoneFilter.value || severityFilter.value),
);

function severityLabel(severity: string): string {
  if (severity === 'critical') return t('alerts.severityCritical');
  if (severity === 'warning') return t('alerts.severityWarning');
  return t('alerts.severityInfo');
}

function severityTone(severity: string): 'critical' | 'warning' | 'info' {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'info';
}

function typeLabel(type: string): string {
  if (type === 'temperature') return t('alerts.typeTemperature');
  if (type === 'pest') return t('alerts.typePest');
  if (type === 'nutrients') return t('alerts.typeNutrients');
  return type;
}

function resetFilters(): void {
  farmFilter.value = '';
  zoneFilter.value = '';
  severityFilter.value = '';
}

async function refresh(): Promise<void> {
  refreshing.value = true;
  await alerts.load(true);
  refreshing.value = false;
}

function onFarmChange(): void {
  if (zoneFilter.value && !zoneOptions.value.some(([id]) => id === zoneFilter.value)) {
    zoneFilter.value = '';
  }
}

onMounted(() => {
  void alerts.load();
});
</script>

<template>
  <div class="page-stack">
    <header class="page-head">
      <div>
        <h1>{{ t('alerts.title') }}</h1>
        <p class="page-head__subtitle">{{ t('alerts.subtitle') }}</p>
      </div>
      <button type="button" class="btn btn--secondary" :disabled="refreshing" @click="refresh">
        <AppIcon name="refresh" :size="16" />
        {{ refreshing ? t('common.refreshing') : t('common.refresh') }}
      </button>
    </header>

    <div class="filter-bar" role="group" aria-label="Filtros de alertas">
      <div class="field field--compact">
        <label for="filter-farm">{{ t('alerts.filterFarm') }}</label>
        <select id="filter-farm" v-model="farmFilter" @change="onFarmChange">
          <option value="">{{ t('alerts.allFarms') }}</option>
          <option v-for="farm in farmOptions" :key="farm" :value="farm">{{ farm }}</option>
        </select>
      </div>
      <div class="field field--compact">
        <label for="filter-zone">{{ t('alerts.filterZone') }}</label>
        <select id="filter-zone" v-model="zoneFilter">
          <option value="">{{ t('alerts.allZones') }}</option>
          <option v-for="[id, name] in zoneOptions" :key="id" :value="id">{{ name }}</option>
        </select>
      </div>
      <div class="field field--compact">
        <label for="filter-severity">{{ t('alerts.filterSeverity') }}</label>
        <select id="filter-severity" v-model="severityFilter">
          <option value="">{{ t('alerts.allSeverities') }}</option>
          <option value="critical">{{ t('alerts.severityCritical') }}</option>
          <option value="warning">{{ t('alerts.severityWarning') }}</option>
          <option value="info">{{ t('alerts.severityInfo') }}</option>
        </select>
      </div>
      <button v-if="hasFilters" type="button" class="text-button filter-bar__reset" @click="resetFilters">
        <AppIcon name="close" :size="14" />
        Limpiar filtros
      </button>
      <span class="filter-bar__count">{{ t('alerts.openCount', { count: filtered.length }) }}</span>
    </div>

    <StateMessage
      v-if="alerts.loading && !alerts.loaded"
      kind="loading"
      :description="t('states.loading')"
    />
    <StateMessage
      v-else-if="alerts.error"
      kind="error"
      :title="t('alerts.loadError')"
      :description="alerts.error"
      :retry-label="t('common.retry')"
      @retry="refresh"
    />
    <StateMessage
      v-else-if="alerts.items.length === 0"
      kind="empty"
      :title="t('alerts.empty')"
      :description="t('alerts.emptyDetail')"
    >
      <RouterLink to="/panel" class="btn btn--secondary">
        <AppIcon name="home" :size="16" />
        {{ t('states.goHome') }}
      </RouterLink>
    </StateMessage>
    <StateMessage
      v-else-if="filtered.length === 0"
      kind="empty"
      title="Ninguna alerta coincide con los filtros"
      description="Prueba con otra finca, zona o severidad. Las alertas reconocidas dejan de aparecer en esta cola."
    >
      <button type="button" class="btn btn--secondary" @click="resetFilters">
        Limpiar filtros
      </button>
    </StateMessage>

    <section v-else class="table-panel" aria-labelledby="alerts-list-title">
      <div class="table-panel__head">
        <h2 id="alerts-list-title">{{ t('alerts.title') }}</h2>
        <span class="table-panel__count">{{ filtered.length }}</span>
      </div>
      <div class="table-scroll">
        <table class="data-table alerts-table">
          <thead>
            <tr>
              <th scope="col">Severidad</th>
              <th scope="col">Alerta</th>
              <th scope="col">{{ t('alerts.farm') }} / {{ t('alerts.zone') }}</th>
              <th scope="col">{{ t('alerts.deadline') }}</th>
              <th scope="col"><span class="as-visually-hidden">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in filtered" :key="alert.id">
              <td>
                <StatusBadge :tone="severityTone(alert.severity)" :label="severityLabel(alert.severity)" />
              </td>
              <td>
                <RouterLink :to="`/panel/alertas/${alert.id}`" class="table-link">
                  {{ alert.title }}
                </RouterLink>
                <span class="table-sub">{{ typeLabel(alert.type) }} · {{ alert.message }}</span>
              </td>
              <td>
                <span class="table-strong">{{ alert.farmName }}</span>
                <span class="table-sub">{{ alert.zoneName }}</span>
              </td>
              <td>
                <span
                  class="countdown"
                  :class="{ 'countdown--overdue': countdown(alert.deadlineAt, now).overdue }"
                >
                  <AppIcon name="clock" :size="15" />
                  {{ countdown(alert.deadlineAt, now).text }}
                </span>
                <span class="table-sub">{{ formatDateTime(alert.deadlineAt) }}</span>
              </td>
              <td class="table-action">
                <RouterLink :to="`/panel/alertas/${alert.id}`" class="text-link">
                  {{ t('common.open') }}
                  <AppIcon name="chevron-right" :size="15" />
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
