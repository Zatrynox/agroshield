<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StateMessage from '@/components/StateMessage.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { api, ApiError } from '@/api/client';
import type { OrganizationDetail, Role } from '@/api/types';
import { useAuthStore } from '@/stores/auth';
import { useAlertsStore } from '@/stores/alerts';
import { useToastStore } from '@/stores/toast';
import { useI18n } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/format';

const auth = useAuthStore();
const alerts = useAlertsStore();
const toasts = useToastStore();
const router = useRouter();
const { t } = useI18n();

const detail = ref<OrganizationDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const renaming = ref(false);
const renameValue = ref('');
const renameError = ref<string | null>(null);
const renameFieldError = ref<string | null>(null);
const savingName = ref(false);
const loggingOut = ref(false);

const canManage = computed(() => auth.role === 'owner' || auth.role === 'admin');
const planLabel = computed(() => {
  const plan = detail.value?.organization.plan ?? auth.session?.organization.plan;
  if (plan === 'pro' || plan === 'professional') return t('account.planPro');
  return t('account.planStarter');
});

function roleLabel(role: Role): string {
  switch (role) {
    case 'owner':
      return t('account.roleOwner');
    case 'admin':
      return t('account.roleAdmin');
    case 'agronomist':
      return t('account.roleAgronomist');
    case 'operator':
      return t('account.roleOperator');
    case 'viewer':
      return t('account.roleViewer');
  }
}

function roleTone(role: Role): 'success' | 'info' | 'neutral' | 'warning' {
  if (role === 'owner') return 'success';
  if (role === 'admin' || role === 'agronomist') return 'info';
  if (role === 'operator') return 'warning';
  return 'neutral';
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    detail.value = await api.get<OrganizationDetail>('/organizations/current');
    renameValue.value = detail.value.organization.name;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('account.loadError');
  } finally {
    loading.value = false;
  }
}

function startRename(): void {
  renaming.value = true;
  renameValue.value = detail.value?.organization.name ?? auth.organizationName;
  renameError.value = null;
  renameFieldError.value = null;
}

function cancelRename(): void {
  renaming.value = false;
  renameError.value = null;
  renameFieldError.value = null;
}

async function saveName(): Promise<void> {
  if (savingName.value) return;
  renameError.value = null;
  renameFieldError.value = null;
  if (renameValue.value.trim().length < 2) {
    renameFieldError.value = t('validation.min', { min: 2 });
    return;
  }
  savingName.value = true;
  try {
    const updated = await api.patch<OrganizationDetail>('/organizations/current', {
      name: renameValue.value.trim(),
    });
    detail.value = updated;
    auth.updateOrganizationName(updated.organization.name);
    renaming.value = false;
    toasts.success(t('account.renamed'));
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      renameError.value = t('account.renameForbidden');
    } else {
      renameError.value = err instanceof ApiError ? err.detail : t('account.renameError');
    }
  } finally {
    savingName.value = false;
  }
}

async function logout(): Promise<void> {
  if (loggingOut.value) return;
  loggingOut.value = true;
  await auth.logout();
  alerts.reset();
  await router.push({ name: 'login', query: { reason: 'logout' } });
  loggingOut.value = false;
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page-stack">
    <header class="page-head">
      <div>
        <h1>{{ t('account.title') }}</h1>
        <p class="page-head__subtitle">{{ t('account.subtitle') }}</p>
      </div>
    </header>

    <StateMessage v-if="loading" kind="loading" :description="t('states.loading')" />
    <StateMessage
      v-else-if="error"
      kind="error"
      :title="t('account.loadError')"
      :description="error"
      :retry-label="t('common.retry')"
      @retry="load"
    />

    <template v-else-if="detail">
      <div class="account-grid">
        <section class="panel" aria-labelledby="profile-title">
          <div class="section-head section-head--tight">
            <h2 id="profile-title">{{ t('account.profile') }}</h2>
          </div>
          <dl class="meta-list">
            <div>
              <dt>{{ t('account.name') }}</dt>
              <dd>{{ auth.session?.user.name }}</dd>
            </div>
            <div>
              <dt>{{ t('account.email') }}</dt>
              <dd>{{ auth.session?.user.email }}</dd>
            </div>
            <div>
              <dt>{{ t('account.role') }}</dt>
              <dd>
                <StatusBadge
                  v-if="auth.role"
                  :tone="roleTone(auth.role)"
                  :label="roleLabel(auth.role)"
                />
              </dd>
            </div>
          </dl>
        </section>

        <section class="panel" aria-labelledby="org-title">
          <div class="section-head section-head--tight">
            <h2 id="org-title">{{ t('account.organization') }}</h2>
            <button v-if="canManage && !renaming" type="button" class="text-button" @click="startRename">
              {{ t('account.rename') }}
            </button>
          </div>

          <template v-if="renaming">
            <form class="form-stack form-stack--tight" novalidate @submit.prevent="saveName">
              <div class="field">
                <label for="org-name">{{ t('account.organization') }}</label>
                <input
                  id="org-name"
                  v-model="renameValue"
                  :aria-invalid="Boolean(renameFieldError)"
                  :aria-describedby="renameFieldError ? 'org-name-error' : 'org-name-hint'"
                />
                <p id="org-name-hint" class="field__hint">{{ t('account.renameHint') }}</p>
                <p v-if="renameFieldError" id="org-name-error" class="field__error">{{ renameFieldError }}</p>
              </div>
              <p v-if="renameError" class="form-error" role="alert">
                <AppIcon name="warning" :size="16" />
                {{ renameError }}
              </p>
              <div class="form-actions">
                <button type="button" class="btn btn--quiet" @click="cancelRename">{{ t('common.cancel') }}</button>
                <button type="submit" class="btn btn--primary" :disabled="savingName">
                  <AppIcon v-if="savingName" name="spinner" :size="16" />
                  {{ savingName ? t('common.saving') : t('common.save') }}
                </button>
              </div>
            </form>
          </template>
          <template v-else>
            <dl class="meta-list">
              <div>
                <dt>Nombre</dt>
                <dd>{{ detail.organization.name }}</dd>
              </div>
              <div>
                <dt>{{ t('account.plan') }}</dt>
                <dd>{{ planLabel }}</dd>
              </div>
              <div>
                <dt>Alta</dt>
                <dd>{{ formatDate(detail.organization.createdAt) }}</dd>
              </div>
              <div>
                <dt>{{ t('account.members') }}</dt>
                <dd>{{ t('account.membersCount', { count: detail.organization.membersCount }) }}</dd>
              </div>
            </dl>
          </template>
        </section>
      </div>

      <section class="table-panel" aria-labelledby="members-title">
        <div class="table-panel__head">
          <div>
            <h2 id="members-title">{{ t('account.members') }}</h2>
          </div>
          <span class="table-panel__count">{{ detail.members.length }}</span>
        </div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">{{ t('account.name') }}</th>
                <th scope="col">{{ t('account.email') }}</th>
                <th scope="col">{{ t('account.role') }}</th>
                <th scope="col">{{ t('account.memberSince') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in detail.members" :key="member.userId">
                <td>
                  <strong class="table-strong">{{ member.name }}</strong>
                  <span v-if="member.userId === auth.session?.user.id" class="table-sub">{{ t('account.you') }}</span>
                </td>
                <td>{{ member.email }}</td>
                <td><StatusBadge :tone="roleTone(member.role)" :label="roleLabel(member.role)" /></td>
                <td>{{ formatDate(member.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="account-grid">
        <section class="panel" aria-labelledby="session-title">
          <div class="section-head section-head--tight">
            <h2 id="session-title">{{ t('account.securityTitle') }}</h2>
          </div>
          <p class="body-copy">{{ t('account.securityText') }}</p>
          <p class="session-expiry">
            <AppIcon name="clock" :size="16" />
            {{ t('account.sessionExpires', { date: formatDateTime(auth.session?.expiresAt ?? '') }) }}
          </p>
          <button type="button" class="btn btn--secondary" :disabled="loggingOut" @click="logout">
            <AppIcon name="logout" :size="16" />
            {{ loggingOut ? t('nav.loggingOut') : t('account.logout') }}
          </button>
        </section>

        <section class="panel panel--quiet" aria-labelledby="plan-note-title">
          <div class="section-head section-head--tight">
            <h2 id="plan-note-title">{{ t('account.plan') }} · {{ planLabel }}</h2>
          </div>
          <p class="body-copy">
            El plan actual no se gestiona desde esta versión. No hay cobros ni pasarela de pago
            conectada; no se muestra ningún importe para no inventar condiciones comerciales.
          </p>
          <p class="inline-note inline-note--small">
            <AppIcon name="shield" :size="15" />
            La facturación queda fuera de esta entrega.
          </p>
        </section>
      </div>
    </template>
  </div>
</template>
