<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import MetricChart from '@/components/MetricChart.vue';
import SoilStrata from '@/components/SoilStrata.vue';
import StateMessage from '@/components/StateMessage.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { api, ApiError } from '@/api/client';
import type {
  Alert,
  Reading,
  Sensor,
  SensorWithKey,
  SoilHealth,
  ZoneDetail,
  ZoneForecast,
  ZonePrediction,
} from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useI18n } from '@/i18n';
import {
  countdown,
  formatArea,
  formatDateTime,
  formatNumber,
  titleCase,
} from '@/lib/format';
import { useNow } from '@/lib/online';

const route = useRoute();
const auth = useAuthStore();
const toasts = useToastStore();
const { t } = useI18n();
const now = useNow();

const zoneId = computed(() => String(route.params.zoneId ?? ''));
const canWrite = computed(() => auth.canWrite);

const zone = ref<ZoneDetail | null>(null);
const zoneLoading = ref(true);
const zoneError = ref<string | null>(null);
const notFound = ref(false);
const refreshing = ref(false);

const sensors = ref<Sensor[]>([]);
const sensorsLoading = ref(false);
const sensorsError = ref<string | null>(null);

const readings = ref<Reading[]>([]);
const readingsLoading = ref(false);
const readingsError = ref<string | null>(null);

const soil = ref<SoilHealth | null>(null);
const soilLoading = ref(false);
const soilError = ref<string | null>(null);

const forecast = ref<ZoneForecast | null>(null);
const forecastLoading = ref(false);
const forecastError = ref<string | null>(null);

const prediction = ref<ZonePrediction | null>(null);
const predictionLoading = ref(false);
const predictionError = ref<string | null>(null);

const zoneAlerts = ref<Alert[]>([]);
const alertsLoading = ref(false);
const alertsError = ref<string | null>(null);

const sensorFormOpen = ref(false);
const sensorName = ref('');
const sensorFieldError = ref<string | null>(null);
const sensorFormError = ref<string | null>(null);
const sensorSubmitting = ref(false);
const sensorNameInput = ref<HTMLInputElement | null>(null);

const secret = ref<SensorWithKey | null>(null);
const keyDialog = ref<HTMLDialogElement | null>(null);
const copyState = ref<'idle' | 'copied' | 'error'>('idle');
const rotatingId = ref<string | null>(null);
const confirmingRevokeId = ref<string | null>(null);
const revokingId = ref<string | null>(null);

const sensorNames = computed(() => new Map(sensors.value.map((sensor) => [sensor.id, sensor.name])));

const soilStatusLabel = computed(() => {
  const status = soil.value?.assessment?.status;
  if (status === 'healthy') return 'Suelo estable';
  if (status === 'watch') return 'En observación';
  if (status === 'depleted') return 'Suelo agotado';
  return 'Sin evaluar';
});

function riskTone(risk: ZonePrediction['risk']): 'success' | 'warning' | 'critical' | 'neutral' {
  if (risk === 'low') return 'success';
  if (risk === 'medium') return 'warning';
  if (risk === 'high') return 'critical';
  return 'neutral';
}

function riskLabel(risk: ZonePrediction['risk']): string {
  if (risk === 'low') return t('zone.riskLow');
  if (risk === 'medium') return t('zone.riskMedium');
  if (risk === 'high') return t('zone.riskHigh');
  return t('zone.riskUnknown');
}

function sensorStatusLabel(status: Sensor['status']): string {
  return status === 'active' ? t('zone.sensorActive') : t('zone.sensorRevoked');
}

function severityLabel(severity: string): string {
  if (severity === 'critical') return t('alerts.severityCritical');
  if (severity === 'warning') return t('alerts.severityWarning');
  return t('alerts.severityInfo');
}

function alertTone(severity: string): 'critical' | 'warning' | 'info' {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'info';
}

function factorTone(value: number): string {
  if (value < 40) return 'critical';
  if (value < 60) return 'warning';
  return 'ok';
}

async function loadZone(): Promise<void> {
  zoneLoading.value = true;
  zoneError.value = null;
  notFound.value = false;
  try {
    zone.value = await api.get<ZoneDetail>(`/zones/${zoneId.value}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound.value = true;
      zoneError.value = err.detail;
    } else {
      zoneError.value = err instanceof Error ? err.message : t('zone.loadError');
    }
  } finally {
    zoneLoading.value = false;
  }
}

async function loadSensors(): Promise<void> {
  sensorsLoading.value = true;
  sensorsError.value = null;
  try {
    sensors.value = await api.get<Sensor[]>(`/zones/${zoneId.value}/sensors`);
  } catch (err) {
    sensorsError.value = err instanceof Error ? err.message : 'No se pudieron cargar los sensores.';
  } finally {
    sensorsLoading.value = false;
  }
}

async function loadReadings(): Promise<void> {
  readingsLoading.value = true;
  readingsError.value = null;
  try {
    readings.value = await api.get<Reading[]>(`/zones/${zoneId.value}/readings`, {
      query: { limit: 24 },
    });
  } catch (err) {
    readingsError.value = err instanceof Error ? err.message : t('zone.readingsError');
  } finally {
    readingsLoading.value = false;
  }
}

async function loadSoil(): Promise<void> {
  soilLoading.value = true;
  soilError.value = null;
  try {
    soil.value = await api.get<SoilHealth>(`/zones/${zoneId.value}/soil-health`);
  } catch (err) {
    soilError.value = err instanceof Error ? err.message : 'No se pudo evaluar el suelo.';
  } finally {
    soilLoading.value = false;
  }
}

async function loadForecast(): Promise<void> {
  forecastLoading.value = true;
  forecastError.value = null;
  try {
    forecast.value = await api.get<ZoneForecast>(`/zones/${zoneId.value}/forecast`);
  } catch (err) {
    forecastError.value = err instanceof Error ? err.message : 'No se pudo calcular la tendencia.';
  } finally {
    forecastLoading.value = false;
  }
}

async function loadPrediction(): Promise<void> {
  predictionLoading.value = true;
  predictionError.value = null;
  try {
    prediction.value = await api.get<ZonePrediction>(`/zones/${zoneId.value}/prediction`);
  } catch (err) {
    predictionError.value = err instanceof Error ? err.message : 'No se pudo evaluar el riesgo.';
  } finally {
    predictionLoading.value = false;
  }
}

async function loadZoneAlerts(): Promise<void> {
  alertsLoading.value = true;
  alertsError.value = null;
  try {
    zoneAlerts.value = await api.get<Alert[]>('/alerts', { query: { zoneId: zoneId.value } });
  } catch (err) {
    alertsError.value = err instanceof Error ? err.message : t('alerts.loadError');
  } finally {
    alertsLoading.value = false;
  }
}

async function loadAll(): Promise<void> {
  await loadZone();
  if (zoneError.value) return;
  await Promise.all([
    loadSensors(),
    loadReadings(),
    loadSoil(),
    loadForecast(),
    loadPrediction(),
    loadZoneAlerts(),
  ]);
}

async function refresh(): Promise<void> {
  refreshing.value = true;
  await loadAll();
  refreshing.value = false;
}

function openSensorForm(): void {
  sensorFormOpen.value = true;
  sensorName.value = '';
  sensorFieldError.value = null;
  sensorFormError.value = null;
  void nextTick(() => sensorNameInput.value?.focus());
}

function closeSensorForm(): void {
  sensorFormOpen.value = false;
  sensorName.value = '';
  sensorFieldError.value = null;
  sensorFormError.value = null;
}

async function submitSensor(): Promise<void> {
  if (sensorSubmitting.value) return;
  sensorFieldError.value = null;
  sensorFormError.value = null;
  if (sensorName.value.trim().length < 2) {
    sensorFieldError.value = t('zone.sensorInvalid');
    return;
  }
  sensorSubmitting.value = true;
  try {
    const result = await api.post<SensorWithKey>(`/zones/${zoneId.value}/sensors`, {
      name: sensorName.value.trim(),
    });
    sensors.value = [...sensors.value, result.sensor];
    closeSensorForm();
    toasts.success(t('zone.sensorCreated'));
    await openSecret(result);
  } catch (err) {
    sensorFormError.value =
      err instanceof ApiError ? err.detail : 'No se pudo inscribir el sensor. Inténtalo de nuevo.';
  } finally {
    sensorSubmitting.value = false;
  }
}

async function openSecret(payload: SensorWithKey): Promise<void> {
  secret.value = payload;
  copyState.value = 'idle';
  await nextTick();
  if (keyDialog.value && !keyDialog.value.open) {
    keyDialog.value.showModal();
  }
}

function closeSecret(): void {
  keyDialog.value?.close();
  secret.value = null;
  copyState.value = 'idle';
}

async function copyKey(): Promise<void> {
  if (!secret.value) return;
  try {
    await navigator.clipboard.writeText(secret.value.privateKeyPem);
    copyState.value = 'copied';
  } catch {
    copyState.value = 'error';
  }
}

function downloadKey(): void {
  if (!secret.value) return;
  const blob = new Blob([secret.value.privateKeyPem], { type: 'application/x-pem-file' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = secret.value.sensor.name.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
  anchor.href = url;
  anchor.download = `agroshield-sensor-${safeName}.pem`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toasts.success(t('zone.sensorKeyDownloaded'));
}

async function rotateSensor(sensor: Sensor): Promise<void> {
  if (rotatingId.value) return;
  rotatingId.value = sensor.id;
  try {
    const result = await api.post<SensorWithKey>(`/sensors/${sensor.id}/rotate-key`);
    sensors.value = sensors.value.map((item) => (item.id === result.sensor.id ? result.sensor : item));
    toasts.success('Clave rotada. La anterior ya no es válida.');
    await openSecret(result);
  } catch (err) {
    toasts.error(err instanceof ApiError ? err.detail : 'No se pudo rotar la clave.');
  } finally {
    rotatingId.value = null;
  }
}

async function revokeSensor(sensor: Sensor): Promise<void> {
  if (revokingId.value) return;
  revokingId.value = sensor.id;
  try {
    const updated = await api.delete<Sensor>(`/sensors/${sensor.id}`);
    sensors.value = sensors.value.map((item) => (item.id === updated.id ? updated : item));
    confirmingRevokeId.value = null;
    toasts.success('Sensor revocado. Sus lecturas firmadas ya no se aceptan.');
  } catch (err) {
    toasts.error(err instanceof ApiError ? err.detail : 'No se pudo revocar el sensor.');
  } finally {
    revokingId.value = null;
  }
}

function alertCountdown(deadlineAt: string) {
  return countdown(deadlineAt, now.value);
}

watch(zoneId, () => {
  void loadAll();
});

void loadAll();
</script>

<template>
  <div class="page-stack">
    <nav class="breadcrumbs" aria-label="Migas de pan">
      <RouterLink to="/panel/fincas">{{ t('farms.title') }}</RouterLink>
      <AppIcon name="chevron-right" :size="14" />
      <RouterLink v-if="zone" :to="`/panel/fincas/${zone.farm.id}`">{{ zone.farm.name }}</RouterLink>
      <span v-else>{{ t('zone.title') }}</span>
      <AppIcon name="chevron-right" :size="14" />
      <span aria-current="page">{{ zone?.zone.name ?? t('zone.title') }}</span>
    </nav>

    <StateMessage v-if="zoneLoading" kind="loading" :description="t('states.loading')" />
    <StateMessage
      v-else-if="notFound"
      kind="empty"
      :title="t('zone.loadError')"
      :description="zoneError ?? undefined"
    >
      <RouterLink to="/panel/fincas" class="btn btn--secondary">
        <AppIcon name="arrow-left" :size="16" />
        {{ t('common.back') }}
      </RouterLink>
    </StateMessage>
    <StateMessage
      v-else-if="zoneError || !zone"
      kind="error"
      :title="t('zone.loadError')"
      :description="zoneError ?? undefined"
      :retry-label="t('common.retry')"
      @retry="loadAll"
    />

    <template v-else>
      <header class="page-head page-head--detail">
        <div>
          <p class="eyebrow">{{ zone.farm.name }}</p>
          <h1>{{ zone.zone.name }}</h1>
          <p class="page-head__subtitle">
            {{ titleCase(zone.zone.cropType) }} · {{ formatArea(zone.zone.areaHectares) }} ·
            {{ zone.farm.location || t('farms.locationMissing') }}
          </p>
        </div>
        <div class="page-head__actions">
          <button type="button" class="btn btn--secondary" :disabled="refreshing" @click="refresh">
            <AppIcon name="refresh" :size="16" />
            {{ refreshing ? t('common.refreshing') : t('zone.reload') }}
          </button>
          <button
            v-if="canWrite && !sensorFormOpen"
            type="button"
            class="btn btn--primary"
            @click="openSensorForm"
          >
            <AppIcon name="sensor" :size="16" />
            {{ t('zone.addSensor') }}
          </button>
        </div>
      </header>

      <section v-if="sensorFormOpen" class="inline-form" aria-labelledby="sensor-form-title">
        <div class="inline-form__head">
          <div>
            <h2 id="sensor-form-title">{{ t('zone.sensorFormTitle') }}</h2>
            <p>{{ t('zone.sensorsHint') }}</p>
          </div>
          <button type="button" class="icon-button" aria-label="Cerrar formulario" @click="closeSensorForm">
            <AppIcon name="close" :size="18" />
          </button>
        </div>
        <form class="form-inline" novalidate @submit.prevent="submitSensor">
          <div class="field field--grow">
            <label for="sensor-name">{{ t('zone.sensorName') }}</label>
            <input
              id="sensor-name"
              ref="sensorNameInput"
              v-model="sensorName"
              :placeholder="t('zone.sensorNamePlaceholder')"
              :aria-invalid="Boolean(sensorFieldError)"
              :aria-describedby="sensorFieldError ? 'sensor-name-error' : undefined"
            />
            <p v-if="sensorFieldError" id="sensor-name-error" class="field__error">{{ sensorFieldError }}</p>
          </div>
          <div class="form-inline__actions">
            <button type="button" class="btn btn--quiet" @click="closeSensorForm">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn--primary" :disabled="sensorSubmitting">
              <AppIcon v-if="sensorSubmitting" name="spinner" :size="16" />
              {{ sensorSubmitting ? t('common.creating') : t('zone.addSensor') }}
            </button>
          </div>
        </form>
        <p v-if="sensorFormError" class="form-error" role="alert">
          <AppIcon name="warning" :size="16" />
          {{ sensorFormError }}
        </p>
      </section>

      <p v-if="!canWrite" class="inline-note">
        <AppIcon name="shield" :size="16" />
        {{ t('zone.roleReadOnly') }}
      </p>

      <div class="zone-grid">
        <section class="panel" aria-labelledby="soil-title">
          <div class="section-head section-head--tight">
            <div>
              <h2 id="soil-title">{{ t('zone.soil') }}</h2>
              <p v-if="soil?.assessment">{{ soilStatusLabel }} · {{ t('zone.sourceReadings') }}</p>
            </div>
          </div>

          <StateMessage v-if="soilLoading" kind="loading" :description="t('states.loading')" compact />
          <StateMessage
            v-else-if="soilError"
            kind="error"
            :title="t('zone.noSoil')"
            :description="soilError"
            :retry-label="t('common.retry')"
            compact
            @retry="loadSoil"
          />
          <StateMessage
            v-else-if="!soil?.assessment"
            kind="empty"
            :title="t('zone.noSoil')"
            :description="t('zone.noSoilDetail')"
            compact
          />

          <template v-else>
            <SoilStrata :assessment="soil.assessment" />
            <div class="soil-factors">
              <div class="soil-factor">
                <span class="soil-factor__label">{{ t('zone.factorMoisture') }}</span>
                <div class="soil-factor__track">
                  <span
                    class="soil-factor__fill"
                    :class="`soil-factor__fill--${factorTone(soil.assessment.factors.moisture)}`"
                    :style="{ width: `${soil.assessment.factors.moisture}%` }"
                  ></span>
                </div>
                <span class="soil-factor__value">{{ soil.assessment.factors.moisture }}</span>
              </div>
              <div class="soil-factor">
                <span class="soil-factor__label">{{ t('zone.factorPh') }}</span>
                <div class="soil-factor__track">
                  <span
                    class="soil-factor__fill"
                    :class="`soil-factor__fill--${factorTone(soil.assessment.factors.ph)}`"
                    :style="{ width: `${soil.assessment.factors.ph}%` }"
                  ></span>
                </div>
                <span class="soil-factor__value">{{ soil.assessment.factors.ph }}</span>
              </div>
              <div class="soil-factor">
                <span class="soil-factor__label">{{ t('zone.factorNutrients') }}</span>
                <div class="soil-factor__track">
                  <span
                    class="soil-factor__fill"
                    :class="`soil-factor__fill--${factorTone(soil.assessment.factors.nutrients)}`"
                    :style="{ width: `${soil.assessment.factors.nutrients}%` }"
                  ></span>
                </div>
                <span class="soil-factor__value">{{ soil.assessment.factors.nutrients }}</span>
              </div>
              <div class="soil-factor">
                <span class="soil-factor__label">{{ t('zone.factorPest') }}</span>
                <div class="soil-factor__track">
                  <span
                    class="soil-factor__fill"
                    :class="`soil-factor__fill--${factorTone(soil.assessment.factors.pest)}`"
                    :style="{ width: `${soil.assessment.factors.pest}%` }"
                  ></span>
                </div>
                <span class="soil-factor__value">{{ soil.assessment.factors.pest }}</span>
              </div>
            </div>
            <div class="recommendation">
              <span class="recommendation__label">{{ t('zone.recommendation') }}</span>
              <p>{{ soil.assessment.recommendation }}</p>
              <span class="recommendation__meta">
                {{ t('zone.readingAt', { date: formatDateTime(soil.assessment.readingAt) }) }} ·
                {{ t('zone.limiting') }}:
                {{ soil.assessment.limitingNutrient ? titleCase(soil.assessment.limitingNutrient) : '—' }}
              </span>
            </div>
          </template>
        </section>

        <section class="panel" aria-labelledby="prediction-title">
          <div class="section-head section-head--tight">
            <div>
              <h2 id="prediction-title">{{ t('zone.prediction') }}</h2>
              <p>{{ t('zone.modelDemo') }}</p>
            </div>
            <span class="chip chip--demo">Demo</span>
          </div>

          <StateMessage
            v-if="predictionLoading"
            kind="loading"
            :description="t('states.loading')"
            compact
          />
          <StateMessage
            v-else-if="predictionError"
            kind="error"
            :title="t('zone.prediction')"
            :description="predictionError"
            :retry-label="t('common.retry')"
            compact
            @retry="loadPrediction"
          />
          <template v-else-if="prediction">
            <div class="risk-head">
              <StatusBadge :tone="riskTone(prediction.risk)" :label="riskLabel(prediction.risk)" />
              <span v-if="prediction.score !== null" class="risk-score">
                {{ t('zone.risk') }} <strong>{{ prediction.score }}<span>/100</span></strong>
              </span>
            </div>
            <p v-if="prediction.incidentZone" class="incident-flag">
              <AppIcon name="warning" :size="16" />
              {{ t('zone.incident') }} · {{ t('zone.incidentDetail') }}
            </p>
            <p v-else class="incident-clear">
              <AppIcon name="check" :size="15" />
              {{ t('zone.notIncident') }}
            </p>
            <div class="signals">
              <span class="signals__label">{{ t('zone.signals') }}</span>
              <ul v-if="prediction.signals.length" class="signals__list">
                <li v-for="signal in prediction.signals" :key="signal">{{ signal }}</li>
              </ul>
              <p v-else class="signals__empty">{{ t('zone.noSignals') }}</p>
            </div>
            <p class="recommendation recommendation--inline">{{ prediction.recommendation }}</p>
          </template>
        </section>
      </div>

      <section class="panel panel--flush" aria-labelledby="zone-alerts-title">
        <div class="section-head">
          <div>
            <h2 id="zone-alerts-title">{{ t('zone.alerts') }}</h2>
          </div>
          <span class="table-panel__count">{{ zoneAlerts.length }}</span>
        </div>
        <StateMessage v-if="alertsLoading" kind="loading" :description="t('states.loading')" compact />
        <StateMessage
          v-else-if="alertsError"
          kind="error"
          :title="t('alerts.loadError')"
          :description="alertsError"
          :retry-label="t('common.retry')"
          compact
          @retry="loadZoneAlerts"
        />
        <p v-else-if="zoneAlerts.length === 0" class="quiet-empty">{{ t('zone.noAlerts') }}</p>
        <ul v-else class="alert-list">
          <li v-for="alert in zoneAlerts" :key="alert.id" class="alert-row">
            <RouterLink :to="`/panel/alertas/${alert.id}`" class="alert-row__main">
              <span class="alert-row__top">
                <StatusBadge :tone="alertTone(alert.severity)" :label="severityLabel(alert.severity)" />
                <span class="alert-row__type">{{ alert.type }}</span>
              </span>
              <strong class="alert-row__title">{{ alert.title }}</strong>
              <span class="alert-row__where">{{ alert.message }}</span>
            </RouterLink>
            <div class="alert-row__deadline">
              <span
                class="countdown"
                :class="{ 'countdown--overdue': alertCountdown(alert.deadlineAt).overdue }"
              >
                <AppIcon name="clock" :size="15" />
                {{ alertCountdown(alert.deadlineAt).text }}
              </span>
              <span class="alert-row__date">{{ formatDateTime(alert.deadlineAt) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section class="table-panel" aria-labelledby="sensors-title">
        <div class="table-panel__head">
          <div>
            <h2 id="sensors-title">{{ t('zone.sensors') }}</h2>
            <p>{{ t('zone.sensorsHint') }}</p>
          </div>
          <button v-if="canWrite" type="button" class="btn btn--secondary btn--small" @click="openSensorForm">
            <AppIcon name="plus" :size="15" />
            {{ t('zone.addSensor') }}
          </button>
        </div>
        <StateMessage v-if="sensorsLoading" kind="loading" :description="t('states.loading')" compact />
        <StateMessage
          v-else-if="sensorsError"
          kind="error"
          :title="t('zone.sensors')"
          :description="sensorsError"
          :retry-label="t('common.retry')"
          compact
          @retry="loadSensors"
        />
        <StateMessage
          v-else-if="sensors.length === 0"
          kind="empty"
          :title="t('zone.sensorEmpty')"
          :description="t('zone.sensorEmptyDetail')"
          compact
        />
        <div v-else class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">{{ t('zone.sensorName') }}</th>
                <th scope="col">Huella</th>
                <th scope="col">Estado</th>
                <th scope="col">{{ t('zone.sensorLastSignal') }}</th>
                <th scope="col" class="numeric">Clave</th>
                <th scope="col"><span class="as-visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sensor in sensors" :key="sensor.id">
                <td>
                  <strong class="table-strong">{{ sensor.name }}</strong>
                  <span class="table-sub">Inscrito {{ formatDateTime(sensor.createdAt) }}</span>
                </td>
                <td><code class="fingerprint">{{ sensor.fingerprint.slice(0, 16) }}…</code></td>
                <td>
                  <StatusBadge
                    :tone="sensor.status === 'active' ? 'success' : 'neutral'"
                    :label="sensorStatusLabel(sensor.status)"
                  />
                </td>
                <td>
                  {{
                    sensor.lastSeenAt
                      ? formatDateTime(sensor.lastSeenAt)
                      : t('zone.sensorNeverSeen')
                  }}
                </td>
                <td class="numeric">v{{ sensor.keyVersion }}</td>
                <td class="table-action">
                  <template v-if="canWrite && sensor.status === 'active'">
                    <div v-if="confirmingRevokeId === sensor.id" class="row-confirm">
                      <span>¿Revocar?</span>
                      <button
                        type="button"
                        class="btn btn--danger btn--small"
                        :disabled="revokingId === sensor.id"
                        @click="revokeSensor(sensor)"
                      >
                        {{ revokingId === sensor.id ? 'Revocando…' : 'Sí, revocar' }}
                      </button>
                      <button type="button" class="btn btn--quiet btn--small" @click="confirmingRevokeId = null">
                        {{ t('common.cancel') }}
                      </button>
                    </div>
                    <div v-else class="row-actions">
                      <button
                        type="button"
                        class="text-button"
                        :disabled="rotatingId === sensor.id"
                        @click="rotateSensor(sensor)"
                      >
                        {{ rotatingId === sensor.id ? 'Rotando…' : 'Rotar clave' }}
                      </button>
                      <button
                        type="button"
                        class="text-button text-button--danger"
                        @click="confirmingRevokeId = sensor.id"
                      >
                        Revocar
                      </button>
                    </div>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="table-panel" aria-labelledby="readings-title">
        <div class="table-panel__head">
          <div>
            <h2 id="readings-title">{{ t('zone.readings') }}</h2>
            <p>{{ t('zone.readingsHint') }}</p>
          </div>
        </div>
        <StateMessage v-if="readingsLoading" kind="loading" :description="t('states.loading')" compact />
        <StateMessage
          v-else-if="readingsError"
          kind="error"
          :title="t('zone.readingsError')"
          :description="readingsError"
          :retry-label="t('common.retry')"
          compact
          @retry="loadReadings"
        />
        <StateMessage
          v-else-if="readings.length === 0"
          kind="empty"
          :title="t('zone.readingsEmpty')"
          :description="t('zone.readingsEmptyDetail')"
          compact
        />
        <div v-else class="table-scroll">
          <table class="data-table data-table--dense">
            <thead>
              <tr>
                <th scope="col">{{ t('zone.columnTime') }}</th>
                <th scope="col">{{ t('zone.columnSensor') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnTemp') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnMoisture') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnPh') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnNitrogen') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnPhosphorus') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnPotassium') }}</th>
                <th scope="col" class="numeric">{{ t('zone.columnPest') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reading in readings" :key="reading.id">
                <td>{{ formatDateTime(reading.recordedAt) }}</td>
                <td>{{ sensorNames.get(reading.sensorId) ?? '—' }}</td>
                <td class="numeric">{{ formatNumber(reading.soilTempC) }} °C</td>
                <td class="numeric">{{ formatNumber(reading.moisturePct) }} %</td>
                <td class="numeric">{{ formatNumber(reading.ph) }}</td>
                <td class="numeric">{{ formatNumber(reading.nitrogenMgKg) }}</td>
                <td class="numeric">{{ formatNumber(reading.phosphorusMgKg) }}</td>
                <td class="numeric">{{ formatNumber(reading.potassiumMgKg) }}</td>
                <td class="numeric">{{ reading.pestIndex }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel" aria-labelledby="forecast-title">
        <div class="section-head">
          <div>
            <h2 id="forecast-title">{{ t('zone.forecast') }}</h2>
            <p v-if="forecast && forecast.days.length">
              {{ t('zone.forecastBasis', { count: forecast.basisReadings }) }}
            </p>
          </div>
          <span class="chip chip--demo">Demo</span>
        </div>
        <StateMessage v-if="forecastLoading" kind="loading" :description="t('states.loading')" compact />
        <StateMessage
          v-else-if="forecastError"
          kind="error"
          :title="t('zone.forecast')"
          :description="forecastError"
          :retry-label="t('common.retry')"
          compact
          @retry="loadForecast"
        />
        <StateMessage
          v-else-if="!forecast || forecast.days.length === 0"
          kind="empty"
          :title="t('zone.forecastEmpty')"
          :description="t('zone.modelDemo')"
          compact
        />
        <template v-else>
          <div class="charts">
            <MetricChart
              id="forecast-temp"
              :title="t('zone.forecastTemp')"
              unit="°C"
              :days="forecast.days"
              metric="soilTempC"
              tone="clay"
            />
            <MetricChart
              id="forecast-moisture"
              :title="t('zone.forecastMoisture')"
              unit="%"
              :days="forecast.days"
              metric="moisturePct"
              tone="data"
            />
          </div>
          <details class="forecast-table">
            <summary>Ver tabla de la tendencia</summary>
            <div class="table-scroll">
              <table class="data-table data-table--dense">
                <thead>
                  <tr>
                    <th scope="col">{{ t('zone.forecastDate') }}</th>
                    <th scope="col" class="numeric">{{ t('zone.forecastTemp') }}</th>
                    <th scope="col" class="numeric">{{ t('zone.forecastMoisture') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="day in forecast.days" :key="day.date">
                    <td>{{ day.date }}</td>
                    <td class="numeric">{{ formatNumber(day.soilTempC) }} °C</td>
                    <td class="numeric">{{ formatNumber(day.moisturePct) }} %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
          <p class="model-note">{{ t('zone.modelDemo') }}</p>
        </template>
      </section>
    </template>

    <dialog ref="keyDialog" class="modal" aria-labelledby="key-title" @close="secret = null">
      <div v-if="secret" class="modal__body">
        <div class="modal__head">
          <div>
            <p class="eyebrow">{{ secret.sensor.name }}</p>
            <h2 id="key-title">{{ t('zone.sensorKeyTitle') }}</h2>
          </div>
          <button type="button" class="icon-button" aria-label="Cerrar" @click="closeSecret">
            <AppIcon name="close" :size="18" />
          </button>
        </div>
        <p class="modal__warning">
          <AppIcon name="warning" :size="18" />
          {{ t('zone.sensorKeyWarning') }}
        </p>
        <pre class="key-block" tabindex="0">{{ secret.privateKeyPem }}</pre>
        <p v-if="copyState === 'copied'" class="field__hint">Clave copiada al portapapeles.</p>
        <p v-if="copyState === 'error'" class="field__error">
          No se pudo copiar. Selecciona el texto manualmente.
        </p>
        <div class="modal__actions">
          <button type="button" class="btn btn--secondary" @click="copyKey">
            <AppIcon name="copy" :size="16" />
            {{ copyState === 'copied' ? t('common.copied') : t('common.copy') }}
          </button>
          <button type="button" class="btn btn--secondary" @click="downloadKey">
            <AppIcon name="download" :size="16" />
            {{ t('zone.sensorKeyDownload') }}
          </button>
          <button type="button" class="btn btn--primary" @click="closeSecret">
            <AppIcon name="check" :size="16" />
            {{ t('zone.sensorKeyDone') }}
          </button>
        </div>
        <p class="modal__foot">{{ secret.notice }}</p>
      </div>
    </dialog>
  </div>
</template>
