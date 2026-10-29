<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StateMessage from '@/components/StateMessage.vue';
import { api, ApiError } from '@/api/client';
import type { FarmDetail, Zone } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useAlertsStore } from '@/stores/alerts';
import { useToastStore } from '@/stores/toast';
import { useI18n } from '@/i18n';
import { formatArea, formatDate, titleCase } from '@/lib/format';

const route = useRoute();
const auth = useAuthStore();
const alerts = useAlertsStore();
const toasts = useToastStore();
const { t } = useI18n();

const detail = ref<FarmDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const notFound = ref(false);

const formOpen = ref(false);
const submitting = ref(false);
const formError = ref<string | null>(null);
const zoneNameInput = ref<HTMLInputElement | null>(null);
const form = reactive({ name: '', cropType: '', areaHectares: '' });
const fieldErrors = reactive<{ name?: string; crop?: string; area?: string }>({});

const farmId = computed(() => String(route.params.farmId ?? ''));
const canCreate = computed(() => auth.canWrite);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  notFound.value = false;
  try {
    detail.value = await api.get<FarmDetail>(`/farms/${farmId.value}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound.value = true;
      error.value = err.detail;
    } else {
      error.value = err instanceof Error ? err.message : t('farms.detailError');
    }
  } finally {
    loading.value = false;
  }
}

function openForm(): void {
  formOpen.value = true;
  void nextTick(() => zoneNameInput.value?.focus());
}

function closeForm(): void {
  formOpen.value = false;
  formError.value = null;
  form.name = '';
  form.cropType = '';
  form.areaHectares = '';
  fieldErrors.name = undefined;
  fieldErrors.crop = undefined;
  fieldErrors.area = undefined;
}

function validate(): boolean {
  fieldErrors.name = form.name.trim().length >= 2 ? undefined : t('validation.min', { min: 2 });
  fieldErrors.crop = form.cropType.trim().length >= 2 ? undefined : t('validation.min', { min: 2 });
  const area = Number(form.areaHectares.replace(',', '.'));
  fieldErrors.area =
    form.areaHectares.trim() === ''
      ? t('validation.required')
      : Number.isFinite(area) && area >= 0
        ? undefined
        : t('validation.positive');
  return !fieldErrors.name && !fieldErrors.crop && !fieldErrors.area;
}

async function submit(): Promise<void> {
  if (submitting.value || !validate() || !detail.value) return;
  submitting.value = true;
  formError.value = null;
  try {
    const zone = await api.post<Zone>(`/farms/${farmId.value}/zones`, {
      name: form.name.trim(),
      cropType: form.cropType.trim(),
      areaHectares: Number(form.areaHectares.replace(',', '.')),
    });
    detail.value = {
      farm: { ...detail.value.farm, zonesCount: detail.value.farm.zonesCount + 1 },
      zones: [...detail.value.zones, zone],
    };
    toasts.success(t('farms.zoneCreated'));
    closeForm();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.detail : 'No se pudo crear la zona. Inténtalo de nuevo.';
  } finally {
    submitting.value = false;
  }
}

function zoneAlertCount(zoneId: string): number {
  return alerts.items.filter((alert) => alert.zoneId === zoneId).length;
}

watch(farmId, () => {
  void load();
});

void load();
</script>

<template>
  <div class="page-stack">
    <nav class="breadcrumbs" aria-label="Migas de pan">
      <RouterLink to="/panel/fincas">{{ t('farms.title') }}</RouterLink>
      <AppIcon name="chevron-right" :size="14" />
      <span aria-current="page">{{ detail?.farm.name ?? t('farms.farm') }}</span>
    </nav>

    <StateMessage v-if="loading" kind="loading" :description="t('states.loading')" />
    <StateMessage
      v-else-if="notFound"
      kind="empty"
      :title="t('farms.detailError')"
      :description="error ?? undefined"
    >
      <RouterLink to="/panel/fincas" class="btn btn--secondary">
        <AppIcon name="arrow-left" :size="16" />
        {{ t('common.back') }}
      </RouterLink>
    </StateMessage>
    <StateMessage
      v-else-if="error || !detail"
      kind="error"
      :title="t('farms.detailError')"
      :description="error ?? undefined"
      :retry-label="t('common.retry')"
      @retry="load"
    />

    <template v-else>
      <header class="page-head page-head--detail">
        <div>
          <p class="eyebrow">{{ t('farms.farm') }}</p>
          <h1>{{ detail.farm.name }}</h1>
          <p class="page-head__subtitle">
            {{ detail.farm.location || t('farms.locationMissing') }} ·
            {{ formatArea(detail.farm.areaHectares) }} ·
            {{ t('dashboard.zoneCount', { count: detail.farm.zonesCount }) }}
          </p>
        </div>
        <div class="page-head__actions">
          <button
            v-if="canCreate && !formOpen"
            type="button"
            class="btn btn--primary"
            @click="openForm"
          >
            <AppIcon name="plus" :size="16" />
            {{ t('farms.addZone') }}
          </button>
        </div>
      </header>

      <p v-if="!canCreate" class="inline-note">
        <AppIcon name="shield" :size="16" />
        {{ t('farms.readOnly') }}
      </p>

      <section v-if="formOpen" class="inline-form" aria-labelledby="zone-form-title">
        <div class="inline-form__head">
          <div>
            <h2 id="zone-form-title">{{ t('farms.zoneFormTitle') }}</h2>
            <p>{{ t('farms.zoneFormTitle') }} · {{ detail.farm.name }}</p>
          </div>
          <button type="button" class="icon-button" aria-label="Cerrar formulario" @click="closeForm">
            <AppIcon name="close" :size="18" />
          </button>
        </div>
        <form class="form-grid form-grid--3" novalidate @submit.prevent="submit">
          <div class="field">
            <label for="zone-name">{{ t('farms.zoneName') }} <span aria-hidden="true">*</span></label>
            <input
              id="zone-name"
              ref="zoneNameInput"
              v-model="form.name"
              :placeholder="t('farms.zoneNamePlaceholder')"
              :aria-invalid="Boolean(fieldErrors.name)"
              :aria-describedby="fieldErrors.name ? 'zone-name-error' : undefined"
            />
            <p v-if="fieldErrors.name" id="zone-name-error" class="field__error">{{ fieldErrors.name }}</p>
          </div>
          <div class="field">
            <label for="zone-crop">{{ t('farms.crop') }} <span aria-hidden="true">*</span></label>
            <input
              id="zone-crop"
              v-model="form.cropType"
              :placeholder="t('farms.cropPlaceholder')"
              :aria-invalid="Boolean(fieldErrors.crop)"
              :aria-describedby="fieldErrors.crop ? 'zone-crop-error' : undefined"
            />
            <p v-if="fieldErrors.crop" id="zone-crop-error" class="field__error">{{ fieldErrors.crop }}</p>
          </div>
          <div class="field">
            <label for="zone-area">{{ t('farms.zoneArea') }} <span aria-hidden="true">*</span></label>
            <input
              id="zone-area"
              v-model="form.areaHectares"
              inputmode="decimal"
              :aria-invalid="Boolean(fieldErrors.area)"
              :aria-describedby="fieldErrors.area ? 'zone-area-error' : undefined"
            />
            <p v-if="fieldErrors.area" id="zone-area-error" class="field__error">{{ fieldErrors.area }}</p>
          </div>
          <p v-if="formError" class="form-error form-grid__full" role="alert">
            <AppIcon name="warning" :size="16" />
            {{ formError }}
          </p>
          <div class="form-actions form-grid__full">
            <button type="button" class="btn btn--quiet" @click="closeForm">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn--primary" :disabled="submitting">
              <AppIcon v-if="submitting" name="spinner" :size="16" />
              {{ submitting ? t('common.creating') : t('farms.addZone') }}
            </button>
          </div>
        </form>
      </section>

      <section class="table-panel" aria-labelledby="zones-title">
        <div class="table-panel__head">
          <h2 id="zones-title">{{ t('farms.zones') }}</h2>
          <span class="table-panel__count">{{ detail.zones.length }}</span>
        </div>

        <StateMessage
          v-if="detail.zones.length === 0"
          kind="empty"
          :title="t('farms.zonesEmpty')"
          :description="t('farms.zonesEmptyDetail')"
          compact
        >
          <button v-if="canCreate" type="button" class="btn btn--primary" @click="openForm">
            <AppIcon name="plus" :size="16" />
            {{ t('farms.addZone') }}
          </button>
        </StateMessage>

        <div v-else class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">{{ t('farms.zoneName') }}</th>
                <th scope="col">{{ t('farms.crop') }}</th>
                <th scope="col" class="numeric">{{ t('farms.zoneArea') }}</th>
                <th scope="col">Estado</th>
                <th scope="col"><span class="as-visually-hidden">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="zone in detail.zones" :key="zone.id">
                <td>
                  <RouterLink :to="`/panel/zonas/${zone.id}`" class="table-link">
                    {{ zone.name }}
                  </RouterLink>
                  <span class="table-sub">Alta {{ formatDate(zone.createdAt) }}</span>
                </td>
                <td>{{ titleCase(zone.cropType) }}</td>
                <td class="numeric">{{ formatArea(zone.areaHectares) }}</td>
                <td>
                  <span v-if="zoneAlertCount(zone.id)" class="table-status table-status--attention">
                    <span class="status-dot status-dot--critical" aria-hidden="true"></span>
                    {{ t('dashboard.alertCount', { count: zoneAlertCount(zone.id) }) }}
                  </span>
                  <span v-else class="table-status">
                    <span class="status-dot status-dot--ok" aria-hidden="true"></span>
                    {{ t('dashboard.healthy') }}
                  </span>
                </td>
                <td class="table-action">
                  <RouterLink :to="`/panel/zonas/${zone.id}`" class="text-link">
                    {{ t('farms.zoneLink') }}
                    <AppIcon name="chevron-right" :size="15" />
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
