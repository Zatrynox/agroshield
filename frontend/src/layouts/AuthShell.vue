<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useI18n } from '@/i18n';

defineProps<{ title: string; subtitle: string }>();
const { t } = useI18n();
</script>

<template>
  <div class="auth-shell">
    <aside class="auth-brand" aria-label="AgroShield">
      <RouterLink to="/" class="auth-brand__home">
        <span class="brand-mark brand-mark--light" aria-hidden="true">
          <span class="brand-mark__probe"></span>
        </span>
        <span>AgroShield</span>
      </RouterLink>

      <div class="auth-brand__statement">
        <p class="auth-brand__line">{{ t('app.tagline') }}</p>
        <p class="auth-brand__copy">
          Cada alerta responde a tres preguntas: qué está pasando en la zona, cuánto tiempo queda y
          qué conviene hacer.
        </p>
      </div>

      <div class="auth-brand__strata" aria-hidden="true">
        <span class="auth-brand__strata-label">Perfil de suelo</span>
        <div class="auth-brand__layers">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <span class="auth-brand__strata-note">Señal firmada · dato verificable</span>
      </div>

      <p class="auth-brand__legal">{{ t('footer.version') }}</p>
    </aside>

    <main id="contenido" class="auth-main">
      <div class="auth-panel">
        <div class="auth-panel__brand">
          <span class="brand-mark" aria-hidden="true">
            <span class="brand-mark__probe"></span>
          </span>
          <span>AgroShield</span>
        </div>
        <h1>{{ title }}</h1>
        <p class="auth-panel__subtitle">{{ subtitle }}</p>
        <slot />
        <p class="auth-panel__secure">
          <AppIcon name="shield" :size="15" />
          {{ t('auth.secureNote') }}
        </p>
      </div>
    </main>
  </div>
</template>
