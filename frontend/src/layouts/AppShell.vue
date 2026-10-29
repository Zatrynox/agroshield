<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import AppIcon, { type IconName } from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { useAlertsStore } from '@/stores/alerts';
import { useHealthStore } from '@/stores/health';
import { useI18n } from '@/i18n';
import { formatDateTime, initials } from '@/lib/format';
import { ApiError } from '@/api/client';

const auth = useAuthStore();
const alerts = useAlertsStore();
const health = useHealthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const loggingOut = ref(false);
const logoutError = ref<string | null>(null);

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  match: (path: string, name: string | symbol | null | undefined) => boolean;
  badge?: number;
}

const navItems = computed<NavItem[]>(() => [
  {
    to: '/panel',
    label: t('nav.dashboard'),
    icon: 'home',
    match: (_path, name) => name === 'dashboard',
  },
  {
    to: '/panel/fincas',
    label: t('nav.farms'),
    icon: 'farm',
    match: (path) => path.startsWith('/panel/fincas') || path.startsWith('/panel/zonas'),
  },
  {
    to: '/panel/alertas',
    label: t('nav.alerts'),
    icon: 'alert',
    match: (path) => path.startsWith('/panel/alertas'),
    badge: alerts.count,
  },
  {
    to: '/panel/cuenta',
    label: t('nav.account'),
    icon: 'user',
    match: (path) => path.startsWith('/panel/cuenta'),
  },
]);

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    owner: t('account.roleOwner'),
    admin: t('account.roleAdmin'),
    agronomist: t('account.roleAgronomist'),
    operator: t('account.roleOperator'),
    viewer: t('account.roleViewer'),
  };
  return auth.role ? labels[auth.role] ?? auth.role : '';
});

const pageTitle = computed(() => {
  if (route.name === 'dashboard') return 'Resumen operativo';
  if (route.name === 'farms') return 'Fincas';
  if (route.name === 'farm-detail') return 'Finca';
  if (route.name === 'zone-detail') return 'Zona';
  if (route.name === 'alerts') return 'Alertas';
  if (route.name === 'alert-detail') return 'Alerta';
  if (route.name === 'account') return 'Cuenta';
  return '';
});

onMounted(() => {
  void health.load();
  void alerts.load();
});

async function logout(): Promise<void> {
  if (loggingOut.value) return;
  loggingOut.value = true;
  logoutError.value = null;
  try {
    await auth.logout();
    alerts.reset();
    await router.push({ name: 'login', query: { reason: 'logout' } });
  } catch (error) {
    logoutError.value =
      error instanceof ApiError
        ? error.detail
        : 'No se pudo cerrar la sesión en el servidor. Se ha cerrado en este navegador.';
    alerts.reset();
  } finally {
    loggingOut.value = false;
  }
}

function isActive(item: NavItem): boolean {
  return item.match(route.path, route.name);
}
</script>

<template>
  <div class="app-shell">
    <aside class="rail" aria-label="AgroShield">
      <RouterLink to="/panel" class="rail__brand">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-mark__probe"></span>
        </span>
        <span class="rail__brand-name">AgroShield</span>
      </RouterLink>

      <div class="rail__org">
        <span class="rail__org-label">Organización</span>
        <strong>{{ auth.organizationName }}</strong>
        <span class="rail__org-meta">{{ roleLabel }}</span>
      </div>

      <nav :aria-label="t('nav.label')" class="rail__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="rail__link"
          :class="{ 'rail__link--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" :size="19" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="rail__badge" :aria-label="`${item.badge} abiertas`">
            {{ item.badge }}
          </span>
        </RouterLink>
      </nav>

      <div class="rail__foot">
        <span v-if="health.data?.demoMode" class="rail__demo">
          <span class="status-dot" aria-hidden="true"></span>
          {{ t('app.demo') }}
        </span>
        <div class="rail__user">
          <span class="avatar" aria-hidden="true">{{ initials(auth.displayName) }}</span>
          <span class="rail__user-copy">
            <strong>{{ auth.displayName }}</strong>
            <span>{{ auth.session?.user.email }}</span>
          </span>
        </div>
        <button
          type="button"
          class="rail__logout"
          :disabled="loggingOut"
          @click="logout"
        >
          <AppIcon name="logout" :size="17" />
          {{ loggingOut ? t('nav.loggingOut') : t('nav.logout') }}
        </button>
        <p v-if="logoutError" class="rail__error" role="alert">{{ logoutError }}</p>
      </div>
    </aside>

    <div class="app-column">
      <header class="mobile-bar">
        <RouterLink to="/panel" class="mobile-bar__brand">
          <span class="brand-mark brand-mark--small" aria-hidden="true">
            <span class="brand-mark__probe"></span>
          </span>
          <span>AgroShield</span>
        </RouterLink>
        <div class="mobile-bar__right">
          <span v-if="health.data?.demoMode" class="chip chip--quiet">Demo</span>
          <RouterLink to="/panel/cuenta" class="mobile-bar__account" aria-label="Cuenta">
            <span class="avatar avatar--small" aria-hidden="true">{{ initials(auth.displayName) }}</span>
          </RouterLink>
        </div>
      </header>

      <div class="app-body">
        <main id="contenido" class="page" :aria-label="pageTitle">
          <RouterView />
        </main>
        <footer class="app-footer">
          <span>{{ auth.organizationName }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ t('footer.version') }}</span>
          <template v-if="auth.session">
            <span aria-hidden="true">·</span>
            <span>{{ t('account.sessionExpires', { date: formatDateTime(auth.session.expiresAt) }) }}</span>
          </template>
        </footer>
      </div>

      <nav :aria-label="t('nav.label')" class="bottom-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="bottom-nav__link"
          :class="{ 'bottom-nav__link--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <span class="bottom-nav__icon">
            <AppIcon :name="item.icon" :size="21" />
            <span v-if="item.badge" class="bottom-nav__badge">{{ item.badge }}</span>
          </span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>
