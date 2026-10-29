<script setup lang="ts">
import { watch } from 'vue';
import { useOnline } from '@/lib/online';
import { useI18n } from '@/i18n';

const { online } = useOnline();
const { t } = useI18n();

watch(online, (value) => {
  document.documentElement.dataset.offline = value ? 'false' : 'true';
});
</script>

<template>
  <div v-if="!online" class="offline-banner" role="status">
    <span class="status-dot" aria-hidden="true"></span>
    <strong>{{ t('common.offline') }}</strong>
    <span>{{ t('common.offlineDetail') }}</span>
  </div>
</template>
