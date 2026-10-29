<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StateMessage from '@/components/StateMessage.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { api, ApiError } from '@/api/client';
import type { Alert } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useAlertsStore } from '@/stores/alerts';
import { useToastStore } from '@/stores/toast';
import { useI18n } from '@/i18n';
import { countdown, formatDateTime, formatNumber, titleCase } from '@/lib/format';
import { useNow } from '@/lib/online';

const route = useRoute();
const auth = useAuthStore();
const alerts = useAlertsStore();
const toasts = useToastStore();
const { t } = useI18n();
const now = useNow();

const alertId = computed(() => String(route.params.alertId ?? ''));
const alert = ref<Alert | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const notFound = ref(false);
const ackDialog = ref<HTMLDialogElement | null>(null);
const acknowledging = ref(false);
const ackError = ref<string | null>(null);

const canAcknowledge = computed(() => auth.canAcknowledge && !alert.value?.acknowledgedAt);
const deadline = computed(() => (alert.value ? countdown(alert.value.deadlineAt, now.value) : null));
const isOverdue = computed(
  () => alert.value?.isOverdue ?? deadline.value?.overdue ?? false,
);

const contextEntries = computed(() => {
  if (!alert.value) return [];
  return Object.entries(alert.value.context).map(([key, value]) => ({
    key,
    label: contextLabel(key),
    value: contextValue(key, value),
  }));
});

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  notFound.value = false;
  try {
    alert.value = await api.get<Alert>(`/alerts/${alertId.value}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound.value = true;
      error.value = err.detail;
    } else {
      error.value = err instanceof Error ? err.message : t('alerts.detailLoadError');
    }
  } finally {
    loading.value = false;
  }
}

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

function contextLabel(key: string): string {
  switch (key) {
    case 'soilTempC':
      return t('alerts.readingTemp');
    case 'thresholdC':
      return t('alerts.readingThreshold');
    case 'hoursToLoss':
      return t('alerts.readingHours');
    case 'pestIndex':
      return t('alerts.readingPest');
    case 'growthPerDay':
      return t('alerts.readingGrowth');
    case 'daysToCritical':
      return t('alerts.readingDays');
    case 'limitingNutrient':
      return t('alerts.readingNutrient');
    case 'ratio':
      return t('alerts.readingRatio');
    case 'daysRemaining':
      return 'Días de reserva';
    case 'cropType':
      return t('alerts.readingCrop');
    default:
      return titleCase(key.replace(/([A-Z])/g, ' $1'));
  }
}

function contextValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'string') return titleCase(value);
  if (typeof value === 'number') {
    if (key === 'ratio') return `${Math.round(value * 100)} %`;
    if (key === 'growthPerDay') return `${Math.round((Math.exp(value) - 1) * 100)} % / día`;
    if (key === 'soilTempC' || key === 'thresholdC') return `${formatNumber(value)} °C`;
    if (key === 'hoursToLoss') return `${formatNumber(value)} h`;
    if (key === 'daysToCritical' || key === 'daysRemaining') return `${formatNumber(value)} d`;
    if (key === 'pestIndex') return `${formatNumber(value)} / 100`;
    return formatNumber(value);
  }
  return JSON.stringify(value);
}

function openAckDialog(): void {
  ackError.value = null;
  void nextTick(() => ackDialog.value?.showModal());
}

function closeAckDialog(): void {
  ackDialog.value?.close();
}

async function confirmAcknowledge(): Promise<void> {
  if (!alert.value || acknowledging.value) return;
  acknowledging.value = true;
  ackError.value = null;
  try {
    const updated = await alerts.acknowledge(alert.value.id);
    alert.value = updated;
    closeAckDialog();
    toasts.success(t('alerts.acknowledged'));
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      ackError.value = t('alerts.alreadyAcknowledged');
      alert.value = { ...alert.value, acknowledgedAt: new Date().toISOString() };
    } else {
      ackError.value = err instanceof ApiError ? err.detail : t('alerts.ackError');
    }
  } finally {
    acknowledging.value = false;
  }
}

watch(alertId, () => {
  void load();
});

void load();
</script>

<template>
  <div class="page-stack">
    <nav class="breadcrumbs" aria-label="Migas de pan">
      <RouterLink to="/panel/alertas">{{ t('alerts.title') }}</RouterLink>
      <AppIcon name="chevron-right" :size="14" />
      <span aria-current="page">{{ alert?.title ?? t('alerts.detailTitle') }}</span>
    </nav>

    <StateMessage v-if="loading" kind="loading" :description="t('states.loading')" />
    <StateMessage
      v-else-if="notFound"
      kind="empty"
      :title="t('alerts.detailLoadError')"
      :description="error ?? undefined"
    >
      <RouterLink to="/panel/alertas" class="btn btn--secondary">
        <AppIcon name="arrow-left" :size="16" />
        {{ t('alerts.backToList') }}
      </RouterLink>
    </StateMessage>
    <StateMessage
      v-else-if="error || !alert"
      kind="error"
      :title="t('alerts.detailLoadError')"
      :description="error ?? undefined"
      :retry-label="t('common.retry')"
      @retry="load"
    />

    <template v-else>
      <header class="alert-head">
        <div class="alert-head__meta">
          <StatusBadge :tone="severityTone(alert.severity)" :label="severityLabel(alert.severity)" />
          <span class="alert-head__type">{{ typeLabel(alert.type) }}</span>
          <span v-if="alert.acknowledgedAt" class="alert-head__acked">
            <AppIcon name="check" :size="14" />
            {{ t('alerts.acknowledgedAt', { date: formatDateTime(alert.acknowledgedAt) }) }}
          </span>
        </div>
        <h1>{{ alert.title }}</h1>
        <p class="alert-head__where">
          <RouterLink :to="`/panel/zonas/${alert.zoneId}`" class="text-link">
            {{ alert.farmName }} · {{ alert.zoneName }}
            <AppIcon name="chevron-right" :size="14" />
          </RouterLink>
        </p>
      </header>

      <div class="alert-detail-grid">
        <section class="panel" aria-labelledby="alert-message-title">
          <h2 id="alert-message-title" class="as-visually-hidden">Mensaje de la alerta</h2>
          <p class="alert-message">{{ alert.message }}</p>

          <div class="alert-deadline">
            <div>
              <span class="alert-deadline__label">{{ t('alerts.deadline') }}</span>
              <strong>{{ formatDateTime(alert.deadlineAt) }}</strong>
            </div>
            <span
              class="countdown countdown--large"
              :class="{ 'countdown--overdue': isOverdue || deadline?.overdue }"
            >
              <AppIcon name="clock" :size="18" />
              {{ deadline?.text }}
            </span>
          </div>

          <div class="context-block">
            <h2>{{ t('alerts.context') }}</h2>
            <dl v-if="contextEntries.length" class="context-list">
              <div v-for="entry in contextEntries" :key="entry.key" class="context-list__row">
                <dt>{{ entry.label }}</dt>
                <dd>{{ entry.value }}</dd>
              </div>
            </dl>
            <p v-else class="quiet-empty">{{ t('alerts.noContext') }}</p>
          </div>
        </section>

        <aside class="panel alert-side" aria-labelledby="alert-actions-title">
          <h2 id="alert-actions-title">Acciones</h2>
          <template v-if="alert.acknowledgedAt">
            <p class="acked-note">
              <AppIcon name="check" :size="17" />
              Alerta reconocida. Ya no aparece en la cola de abiertas.
            </p>
            <RouterLink to="/panel/alertas" class="btn btn--secondary btn--block">
              <AppIcon name="alert" :size="16" />
              {{ t('alerts.backToList') }}
            </RouterLink>
          </template>
          <template v-else>
            <p class="alert-side__text">
              Revisa la zona y aplica una corrección. Reconocer la alerta no corrige el problema: solo
              registra que alguien se ha hecho cargo.
            </p>
            <button
              v-if="canAcknowledge"
              type="button"
              class="btn btn--primary btn--block"
              @click="openAckDialog"
            >
              <AppIcon name="check" :size="17" />
              {{ t('alerts.acknowledge') }}
            </button>
            <p v-else-if="!auth.canAcknowledge" class="inline-note inline-note--small">
              <AppIcon name="shield" :size="15" />
              Tu rol no permite reconocer alertas.
            </p>
            <RouterLink :to="`/panel/zonas/${alert.zoneId}`" class="btn btn--secondary btn--block">
              <AppIcon name="arrow-left" :size="16" />
              Abrir zona
            </RouterLink>
          </template>
          <dl class="alert-meta">
            <div>
              <dt>Creada</dt>
              <dd>{{ formatDateTime(alert.createdAt) }}</dd>
            </div>
            <div>
              <dt>Origen</dt>
              <dd>Lectura firmada del sensor</dd>
            </div>
          </dl>
        </aside>
      </div>

      <dialog ref="ackDialog" class="modal modal--small" aria-labelledby="ack-title" @close="ackError = null">
        <div class="modal__body">
          <div class="modal__head">
            <h2 id="ack-title">{{ t('alerts.ackDialogTitle') }}</h2>
            <button type="button" class="icon-button" aria-label="Cerrar" @click="closeAckDialog">
              <AppIcon name="close" :size="18" />
            </button>
          </div>
          <p class="modal__text">{{ t('alerts.ackDialogText') }}</p>
          <p v-if="ackError" class="form-error" role="alert">
            <AppIcon name="warning" :size="16" />
            {{ ackError }}
          </p>
          <div class="modal__actions">
            <button type="button" class="btn btn--quiet" @click="closeAckDialog">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn btn--primary"
              :disabled="acknowledging"
              @click="confirmAcknowledge"
            >
              <AppIcon v-if="acknowledging" name="spinner" :size="16" />
              {{ acknowledging ? t('alerts.acknowledging') : t('alerts.ackConfirm') }}
            </button>
          </div>
        </div>
      </dialog>
    </template>
  </div>
</template>
