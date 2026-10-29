<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import StateMessage from '@/components/StateMessage.vue';
import { api } from '@/api/client';
import type { Alert, Farm } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useAlertsStore } from '@/stores/alerts';
import { useI18n } from '@/i18n';
import { countdown, formatArea, formatDateTime, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/online';

const auth = useAuthStore();
const alerts = useAlertsStore();
const { t } = useI18n();
const now = useNow();

const farms = ref<Farm[]>([]);
const farmsLoading = ref(true);
const farmsError = ref<string | null>(null);
const refreshing = ref(false);

const totals = computed(() => ({
  zones: farms.value.reduce((sum, farm) => sum + farm.zonesCount, 0),
  area: farms.value.reduce((sum, farm) => sum + farm.areaHectares, 0),
}));

const priorityAlerts = computed(() =>
  [...alerts.items]
    .sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime())
    .slice(0, 6),
);

function alertsForFarm(farmName: string): Alert[] {
  return alerts.items.filter((alert) => alert.farmName === farmName);
}

async function loadFarms(): Promise<void> {
  farmsLoading.value = true;
  farmsError.value = null;
  try {
    farms.value = await api.get<Farm[]>('/farms');
  } catch (error) {
    farmsError.value = error instanceof Error ? error.message : t('farms.loadError');
  } finally {
    farmsLoading.value = false;
  }
}

async function refresh(): Promise<void> {
  refreshing.value = true;
  await Promise.all([loadFarms(), alerts.load(true)]);
  refreshing.value = false;
}

onMounted(() => {
  void loadFarms();
  void alerts.load();
});

function severityTone(severity: string): 'critical' | 'warning' | 'info' {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'info';
}

function severityLabel(severity: string): string {
  if (severity === 'critical') return t('alerts.severityCritical');
  if (severity === 'warning') return t('alerts.severityWarning');
  return t('alerts.severityInfo');
}

function alertTypeLabel(type: string): string {
  if (type === 'temperature') return t('alerts.typeTemperature');
  if (type === 'pest') return t('alerts.typePest');
  if (type === 'nutrients') return t('alerts.typeNutrients');
  return type;
}
</script>

<template>
  <div class="page-stack">
    <header class="page-head">
      <div>
        <h1>{{ t('dashboard.greeting', { name: auth.displayName.split(' ')[0] ?? '' }) }}</h1>
        <p class="page-head__subtitle">{{ t('dashboard.subtitle') }}</p>
      </div>
      <button type="button" class="btn btn--secondary" :disabled="refreshing" @click="refresh">
        <AppIcon name="refresh" :size="16" />
        {{ refreshing ? t('common.refreshing') : t('common.refresh') }}
      </button>
    </header>

    <section class="situation" aria-label="Indicadores de la organización">
      <div class="situation__item">
        <span class="situation__label">{{ t('dashboard.openAlerts') }}</span>
        <strong class="situation__value">{{ formatNumber(alerts.count) }}</strong>
        <span class="situation__meta" :class="{ 'situation__meta--critical': alerts.criticalCount > 0 }">
          {{ alerts.criticalCount }} {{ t('dashboard.criticalAlerts').toLowerCase() }}
        </span>
      </div>
      <div class="situation__item">
        <span class="situation__label">{{ t('dashboard.farms') }}</span>
        <strong class="situation__value">{{ formatNumber(farms.length) }}</strong>
        <span class="situation__meta">{{ formatArea(totals.area) }}</span>
      </div>
      <div class="situation__item">
        <span class="situation__label">{{ t('dashboard.zones') }}</span>
        <strong class="situation__value">{{ formatNumber(totals.zones) }}</strong>
        <span class="situation__meta">{{ t('dashboard.farmsHint') }}</span>
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="panel panel--flush" aria-labelledby="priority-title">
        <div class="section-head">
          <div>
            <h2 id="priority-title">{{ t('dashboard.priority') }}</h2>
            <p>{{ t('dashboard.priorityHint') }}</p>
          </div>
          <RouterLink to="/panel/alertas" class="text-link">
            {{ t('dashboard.alertsLink') }}
            <AppIcon name="chevron-right" :size="15" />
          </RouterLink>
        </div>

        <StateMessage
          v-if="alerts.loading && !alerts.loaded"
          kind="loading"
          :description="t('states.loading')"
          compact
        />
        <StateMessage
          v-else-if="alerts.error"
          kind="error"
          :title="t('alerts.loadError')"
          :description="alerts.error"
          :retry-label="t('common.retry')"
          compact
          @retry="alerts.load(true)"
        />
        <StateMessage
          v-else-if="priorityAlerts.length === 0"
          kind="empty"
          :title="t('dashboard.noAlerts')"
          :description="t('dashboard.noAlertsDetail')"
          compact
        />
        <ul v-else class="alert-list">
          <li v-for="alert in priorityAlerts" :key="alert.id" class="alert-row">
            <RouterLink :to="`/panel/alertas/${alert.id}`" class="alert-row__main">
              <span class="alert-row__top">
                <StatusBadge :tone="severityTone(alert.severity)" :label="severityLabel(alert.severity)" />
                <span class="alert-row__type">{{ alertTypeLabel(alert.type) }}</span>
              </span>
              <strong class="alert-row__title">{{ alert.title }}</strong>
              <span class="alert-row__where">{{ alert.farmName }} · {{ alert.zoneName }}</span>
            </RouterLink>
            <div class="alert-row__deadline">
              <span class="countdown" :class="{ 'countdown--overdue': countdown(alert.deadlineAt, now).overdue }">
                <AppIcon name="clock" :size="15" />
                {{ countdown(alert.deadlineAt, now).text }}
              </span>
              <span class="alert-row__date">{{ formatDateTime(alert.deadlineAt) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <aside class="dashboard-side" aria-label="Estado de las fincas">
        <div class="section-head section-head--tight">
          <div>
            <h2>{{ t('dashboard.farmsTitle') }}</h2>
          </div>
          <RouterLink to="/panel/fincas" class="text-link">{{ t('common.view') }}</RouterLink>
        </div>

        <StateMessage
          v-if="farmsLoading"
          kind="loading"
          :description="t('states.loading')"
          compact
        />
        <StateMessage
          v-else-if="farmsError"
          kind="error"
          :title="t('dashboard.loadError')"
          :description="farmsError"
          :retry-label="t('common.retry')"
          compact
          @retry="loadFarms"
        />
        <StateMessage
          v-else-if="farms.length === 0"
          kind="empty"
          :title="t('dashboard.noFarms')"
          :description="t('dashboard.noFarmsDetail')"
          compact
        >
          <RouterLink :to="{ name: 'farms', query: { new: '1' } }" class="btn btn--primary">
            <AppIcon name="plus" :size="16" />
            {{ t('dashboard.addFarm') }}
          </RouterLink>
        </StateMessage>

        <ul v-else class="farm-list">
          <li v-for="farm in farms" :key="farm.id" class="farm-list__item">
            <RouterLink :to="`/panel/fincas/${farm.id}`" class="farm-list__link">
              <span class="farm-list__icon" aria-hidden="true">
                <AppIcon name="farm" :size="20" />
              </span>
              <span class="farm-list__copy">
                <strong>{{ farm.name }}</strong>
                <span>{{ farm.location || t('farms.locationMissing') }} · {{ formatArea(farm.areaHectares) }}</span>
                <span class="farm-list__meta">{{ t('dashboard.zoneCount', { count: farm.zonesCount }) }}</span>
              </span>
              <span
                v-if="alertsForFarm(farm.name).length"
                class="farm-list__alerts"
              >
                <span class="status-dot status-dot--critical" aria-hidden="true"></span>
                {{ t('dashboard.alertCount', { count: alertsForFarm(farm.name).length }) }}
              </span>
              <span v-else class="farm-list__clear">
                <AppIcon name="check" :size="15" />
                {{ t('dashboard.healthy') }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
