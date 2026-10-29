<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/i18n';

const auth = useAuthStore();
const { t } = useI18n();
</script>

<template>
  <main class="standalone-state">
    <div class="standalone-state__panel">
      <span class="standalone-state__code">404</span>
      <h1>{{ t('states.notFoundTitle') }}</h1>
      <p>{{ t('states.notFoundText') }}</p>
      <RouterLink v-if="auth.isAuthenticated" to="/panel" class="btn btn--primary">
        <AppIcon name="home" :size="17" />
        {{ t('states.goHome') }}
      </RouterLink>
      <RouterLink v-else to="/login" class="btn btn--primary">
        <AppIcon name="user" :size="17" />
        {{ t('states.backLogin') }}
      </RouterLink>
    </div>
  </main>
</template>
