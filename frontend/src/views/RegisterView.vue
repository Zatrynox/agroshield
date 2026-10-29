<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import AuthShell from '@/layouts/AuthShell.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { ApiError } from '@/api/client';
import { useI18n } from '@/i18n';
import { landingUrl } from '@/lib/config';

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const form = reactive({
  name: '',
  organizationName: '',
  email: '',
  password: '',
});
const submitting = ref(false);
const formError = ref<string | null>(null);
const fieldErrors = reactive<Record<'name' | 'organizationName' | 'email' | 'password', string | undefined>>({
  name: undefined,
  organizationName: undefined,
  email: undefined,
  password: undefined,
});

function validate(): boolean {
  fieldErrors.name = form.name.trim().length >= 2 ? undefined : t('auth.nameTooShort');
  fieldErrors.organizationName =
    form.organizationName.trim().length >= 2 ? undefined : t('validation.min', { min: 2 });
  const email = form.email.trim();
  fieldErrors.email = !email
    ? t('validation.required')
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? undefined
      : t('auth.emailInvalid');
  fieldErrors.password =
    form.password.length < 12 ? t('auth.passwordTooShort') : undefined;
  return Object.values(fieldErrors).every((value) => !value);
}

async function submit(): Promise<void> {
  if (submitting.value) return;
  formError.value = null;
  if (!validate()) return;
  submitting.value = true;
  try {
    await auth.register(form);
    await router.replace({ name: 'dashboard' });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409 || error.code === 'conflict') {
        formError.value = 'Ya existe una cuenta con ese correo. Inicia sesión.';
      } else if (error.status === 429) {
        formError.value = t('auth.rateLimited');
      } else {
        formError.value = error.detail;
      }
    } else {
      formError.value = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AuthShell :title="t('auth.registerTitle')" :subtitle="t('auth.registerSubtitle')">
    <form class="form-stack" novalidate @submit.prevent="submit">
      <div class="form-grid">
        <div class="field">
          <label for="register-name">{{ t('auth.name') }}</label>
          <input
            id="register-name"
            v-model="form.name"
            name="name"
            autocomplete="name"
            :aria-invalid="Boolean(fieldErrors.name)"
            :aria-describedby="fieldErrors.name ? 'register-name-error' : undefined"
          />
          <p v-if="fieldErrors.name" id="register-name-error" class="field__error">
            {{ fieldErrors.name }}
          </p>
        </div>

        <div class="field">
          <label for="register-org">{{ t('auth.organization') }}</label>
          <input
            id="register-org"
            v-model="form.organizationName"
            name="organization"
            autocomplete="organization"
            placeholder="Ej. Explotaciones El Tomillar"
            :aria-invalid="Boolean(fieldErrors.organizationName)"
            :aria-describedby="fieldErrors.organizationName ? 'register-org-error' : 'register-org-hint'"
          />
          <p id="register-org-hint" class="field__hint">{{ t('auth.organizationHint') }}</p>
          <p v-if="fieldErrors.organizationName" id="register-org-error" class="field__error">
            {{ fieldErrors.organizationName }}
          </p>
        </div>
      </div>

      <div class="field">
        <label for="register-email">{{ t('auth.email') }}</label>
        <input
          id="register-email"
          v-model="form.email"
          type="email"
          name="email"
          inputmode="email"
          autocomplete="username"
          :aria-invalid="Boolean(fieldErrors.email)"
          :aria-describedby="fieldErrors.email ? 'register-email-error' : undefined"
        />
        <p v-if="fieldErrors.email" id="register-email-error" class="field__error">
          {{ fieldErrors.email }}
        </p>
      </div>

      <div class="field">
        <label for="register-password">{{ t('auth.password') }}</label>
        <input
          id="register-password"
          v-model="form.password"
          type="password"
          name="password"
          autocomplete="new-password"
          :aria-invalid="Boolean(fieldErrors.password)"
          :aria-describedby="fieldErrors.password ? 'register-password-error' : 'register-password-hint'"
        />
        <p id="register-password-hint" class="field__hint">{{ t('auth.passwordHint') }}</p>
        <p v-if="fieldErrors.password" id="register-password-error" class="field__error">
          {{ fieldErrors.password }}
        </p>
      </div>

      <p v-if="formError" class="form-error" role="alert">
        <AppIcon name="warning" :size="16" />
        {{ formError }}
      </p>

      <button type="submit" class="btn btn--primary btn--block" :disabled="submitting">
        <AppIcon v-if="submitting" name="spinner" :size="17" />
        {{ submitting ? t('auth.registering') : t('auth.register') }}
      </button>

      <p class="form-legal">
        Al crear una cuenta aceptas los
        <a :href="`${landingUrl}/terminos`">términos</a> y la
        <a :href="`${landingUrl}/privacidad`">política de privacidad</a>.
      </p>

      <p class="form-switch">
        {{ t('auth.hasAccount') }}
        <RouterLink :to="{ name: 'login' }">{{ t('auth.goLogin') }}</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
