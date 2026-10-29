<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StateMessage from '@/components/StateMessage.vue';
import { api, ApiError } from '@/api/client';
import type { Farm } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useAlertsStore } from '@/stores/alerts';
import { useToastStore } from '@/stores/toast';
import { useI18n } from '@/i18n';
import { formatArea, formatDate } from '@/lib/format';

const auth = useAuthStore();
const alerts = useAlertsStore();
const toasts = useToastStore();
const route = useRoute();
const { t } = useI18n();

const farms = ref<Farm[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const formOpen = ref(false);
const submitting = ref(false);
const formError = ref<string | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);

const form = reactive({ name: '', location: '', areaHectares: '' });
const fieldErrors = reactive<{ name?: string; area?: string }>({});

const canCreate = computed(() => auth.canWrite);

function alertCount(farmName: string): number {
  return alerts.items.filter((alert) => alert.farmName === farmName).length;
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    farms.value = await api.get<Farm[]>('/farms');
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('farms.loadError');
  } finally {
    loading.value = false;
  }
}

function openForm(): void {
  formOpen.value = true;
  formError.value = null;
  void nextTick(() => nameInput.value?.focus());
}

function closeForm(): void {
  formOpen.value = false;
  formError.value = null;
  form.name = '';
  form.location = '';
  form.areaHectares = '';
  fieldErrors.name = undefined;
  fieldErrors.area = undefined;
}

function validate(): boolean {
  fieldErrors.name = form.name.trim().length >= 2 ? undefined : t('validation.min', { min: 2 });
  const area = Number(form.areaHectares.replace(',', '.'));
  fieldErrors.area =
    form.areaHectares.trim() === ''
      ? t('validation.required')
      : Number.isFinite(area) && area >= 0
        ? undefined
        : t('validation.positive');
  return !fieldErrors.name && !fieldErrors.area;
}

async function submit(): Promise<void> {
  if (submitting.value || !validate()) return;
  submitting.value = true;
  formError.value = null;
  try {
    const area = Number(form.areaHectares.replace(',', '.'));
    const farm = await api.post<Farm>('/farms', {
      name: form.name.trim(),
      location: form.location.trim(),
      areaHectares: area,
    });
    farms.value = [...farms.value, farm].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    toasts.success(t('farms.created'));
    closeForm();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.detail : 'No se pudo crear la finca. Inténtalo de nuevo.';
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  if (route.query.new === '1' && canCreate.value) openForm();
  void load();
});
</script>

<template>
  <div class="page-stack">
    <header class="page-head">
      <div>
        <h1>{{ t('farms.title') }}</h1>
        <p class="page-head__subtitle">{{ t('farms.subtitle') }}</p>
      </div>
      <button
        v-if="canCreate && !formOpen"
        type="button"
        class="btn btn--primary"
        @click="openForm"
      >
        <AppIcon name="plus" :size="17" />
        {{ t('farms.add') }}
      </button>
    </header>

    <p v-if="!canCreate" class="inline-note">
      <AppIcon name="shield" :size="16" />
      {{ t('farms.readOnly') }}
    </p>

    <section v-if="formOpen" class="inline-form" aria-labelledby="farm-form-title">
      <div class="inline-form__head">
        <div>
          <h2 id="farm-form-title">{{ t('farms.formTitle') }}</h2>
          <p>{{ t('farms.formHint') }}</p>
        </div>
        <button type="button" class="icon-button" aria-label="Cerrar formulario" @click="closeForm">
          <AppIcon name="close" :size="18" />
        </button>
      </div>
      <form class="form-grid form-grid--3" novalidate @submit.prevent="submit">
        <div class="field">
          <label for="farm-name">{{ t('farms.name') }} <span aria-hidden="true">*</span></label>
          <input
            id="farm-name"
            ref="nameInput"
            v-model="form.name"
            name="name"
            :placeholder="t('farms.namePlaceholder')"
            :aria-invalid="Boolean(fieldErrors.name)"
            :aria-describedby="fieldErrors.name ? 'farm-name-error' : undefined"
          />
          <p v-if="fieldErrors.name" id="farm-name-error" class="field__error">{{ fieldErrors.name }}</p>
        </div>
        <div class="field">
          <label for="farm-location">{{ t('farms.location') }}</label>
          <input
            id="farm-location"
            v-model="form.location"
            name="location"
            :placeholder="t('farms.locationPlaceholder')"
          />
        </div>
        <div class="field">
          <label for="farm-area">{{ t('farms.area') }} <span aria-hidden="true">*</span></label>
          <input
            id="farm-area"
            v-model="form.areaHectares"
            name="areaHectares"
            inputmode="decimal"
            :aria-invalid="Boolean(fieldErrors.area)"
            :aria-describedby="fieldErrors.area ? 'farm-area-error' : 'farm-area-hint'"
          />
          <p id="farm-area-hint" class="field__hint">{{ t('farms.areaHint') }}</p>
          <p v-if="fieldErrors.area" id="farm-area-error" class="field__error">{{ fieldErrors.area }}</p>
        </div>

        <p v-if="formError" class="form-error form-grid__full" role="alert">
          <AppIcon name="warning" :size="16" />
          {{ formError }}
        </p>
        <div class="form-actions form-grid__full">
          <button type="button" class="btn btn--quiet" @click="closeForm">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn--primary" :disabled="submitting">
            <AppIcon v-if="submitting" name="spinner" :size="16" />
            {{ submitting ? t('common.creating') : t('farms.add') }}
          </button>
        </div>
      </form>
    </section>

    <StateMessage v-if="loading" kind="loading" :description="t('states.loading')" />
    <StateMessage
      v-else-if="error"
      kind="error"
      :title="t('farms.loadError')"
      :description="error"
      :retry-label="t('common.retry')"
      @retry="load"
    />
    <StateMessage
      v-else-if="farms.length === 0"
      kind="empty"
      :title="t('farms.empty')"
      :description="t('farms.emptyDetail')"
    >
      <button v-if="canCreate" type="button" class="btn btn--primary" @click="openForm">
        <AppIcon name="plus" :size="16" />
        {{ t('farms.add') }}
      </button>
    </StateMessage>

    <section v-else class="table-panel" aria-labelledby="farms-list-title">
      <div class="table-panel__head">
        <h2 id="farms-list-title">{{ t('farms.title') }}</h2>
        <span class="table-panel__count">{{ farms.length }}</span>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">{{ t('farms.farm') }}</th>
              <th scope="col">{{ t('farms.location') }}</th>
              <th scope="col" class="numeric">{{ t('farms.area') }}</th>
              <th scope="col" class="numeric">{{ t('farms.zones') }}</th>
              <th scope="col">Estado</th>
              <th scope="col"><span class="as-visually-hidden">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="farm in farms" :key="farm.id">
              <td>
                <RouterLink :to="`/panel/fincas/${farm.id}`" class="table-link">
                  {{ farm.name }}
                </RouterLink>
                <span class="table-sub">Alta {{ formatDate(farm.createdAt) }}</span>
              </td>
              <td>{{ farm.location || t('farms.locationMissing') }}</td>
              <td class="numeric">{{ formatArea(farm.areaHectares) }}</td>
              <td class="numeric">{{ farm.zonesCount }}</td>
              <td>
                <span v-if="alertCount(farm.name)" class="table-status table-status--attention">
                  <span class="status-dot status-dot--critical" aria-hidden="true"></span>
                  {{ t('dashboard.alertCount', { count: alertCount(farm.name) }) }}
                </span>
                <span v-else class="table-status">
                  <span class="status-dot status-dot--ok" aria-hidden="true"></span>
                  {{ t('dashboard.healthy') }}
                </span>
              </td>
              <td class="table-action">
                <RouterLink :to="`/panel/fincas/${farm.id}`" class="text-link">
                  {{ t('common.view') }}
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
