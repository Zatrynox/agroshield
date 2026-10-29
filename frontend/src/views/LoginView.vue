<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthShell from '@/layouts/AuthShell.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/api/client';
import { useI18n } from '@/i18n';
import { safeRedirect } from '@/router';
import { landingUrl } from '@/lib/config';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const form = reactive({ email: '', password: '' });
const submitting = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = reactive<{ email?: string; password?: string }>({});

const reason = computed(() => String(route.query.reason ?? ''));
const notice = computed(() => {
  if (reason.value === 'expired') return { tone: 'warning', text: t('auth.sessionExpired') };
  if (reason.value === 'logout') return { tone: 'info', text: t('auth.sessionEnded') };
  if (reason.value === 'auth') return { tone: 'info', text: t('auth.loginRequired') };
  if (reason.value === 'offline')
    return {
      tone: 'warning',
      text: 'No hemos podido comprobar tu sesión porque no hay conexión con el servidor.',
    };
  return null;
});

function validate(): boolean {
  fieldErrors.email = undefined;
  fieldErrors.password = undefined;
  const email = form.email.trim();
  if (!email) {
    fieldErrors.email = t('validation.required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = t('auth.emailInvalid');
  }
  if (!form.password) fieldErrors.password = t('validation.required');
  return !fieldErrors.email && !fieldErrors.password;
}

async function submit(): Promise<void> {
  if (submitting.value) return;
  formError.value = null;
  if (!validate()) return;
  submitting.value = true;
  try {
    await auth.login(form.email, form.password);
    await router.replace(safeRedirect(route.query.redirect));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) formError.value = t('auth.invalidCredentials');
      else if (error.status === 429) formError.value = t('auth.rateLimited');
      else if (error.code === 'account_locked') formError.value = t('auth.locked');
      else if (error.status === 403) formError.value = t('auth.loginRequired');
      else formError.value = error.detail;
    } else {
      formError.value = 'No se pudo iniciar sesión. Inténtalo de nuevo.';
    }
  } finally {
    submitting.value = false;
  }
}

async function retrySession(): Promise<void> {
  await auth.bootstrap();
  if (auth.isAuthenticated) {
    await router.replace(safeRedirect(route.query.redirect));
  }
}
</script>

<template>
  <AuthShell :title="t('auth.loginTitle')" :subtitle="t('auth.loginSubtitle')">
    <div v-if="notice" class="notice" :class="`notice--${notice.tone}`" role="status">
      <AppIcon :name="notice.tone === 'warning' ? 'warning' : 'shield'" :size="17" />
      <span>{{ notice.text }}</span>
      <button v-if="reason === 'offline'" type="button" class="notice__action" @click="retrySession">
        {{ t('common.retry') }}
      </button>
    </div>

    <form class="form-stack" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="login-email">{{ t('auth.email') }}</label>
        <input
          id="login-email"
          v-model="form.email"
          type="email"
          name="email"
          inputmode="email"
          autocomplete="username"
          :aria-invalid="Boolean(fieldErrors.email)"
          :aria-describedby="fieldErrors.email ? 'login-email-error' : undefined"
          placeholder="tu@explotacion.es"
        />
        <p v-if="fieldErrors.email" id="login-email-error" class="field__error">
          {{ fieldErrors.email }}
        </p>
      </div>

      <div class="field">
        <label for="login-password">{{ t('auth.password') }}</label>
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          name="password"
          autocomplete="current-password"
          :aria-invalid="Boolean(fieldErrors.password)"
          :aria-describedby="fieldErrors.password ? 'login-password-error' : undefined"
        />
        <p v-if="fieldErrors.password" id="login-password-error" class="field__error">
          {{ fieldErrors.password }}
        </p>
      </div>

      <p v-if="formError" class="form-error" role="alert">
        <AppIcon name="warning" :size="16" />
        {{ formError }}
      </p>

      <button type="submit" class="btn btn--primary btn--block" :disabled="submitting">
        <AppIcon v-if="submitting" name="spinner" :size="17" />
        {{ submitting ? t('auth.loggingIn') : t('auth.login') }}
      </button>

      <p class="form-switch">
        {{ t('auth.noAccount') }}
        <RouterLink :to="{ name: 'register' }">{{ t('auth.goRegister') }}</RouterLink>
      </p>
    </form>

    <p class="auth-panel__legal">
      <a :href="`${landingUrl}/privacidad`">Privacidad</a>
      <span aria-hidden="true">·</span>
      <a :href="`${landingUrl}/terminos`">Términos</a>
      <span aria-hidden="true">·</span>
      <a :href="landingUrl">Volver al sitio</a>
    </p>
  </AuthShell>
</template>
