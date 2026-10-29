<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import OfflineBanner from '@/components/OfflineBanner.vue';
import ToastHost from '@/components/ToastHost.vue';
import { useAuthStore } from '@/stores/auth';
import { useOnline } from '@/lib/online';

const auth = useAuthStore();
const { online } = useOnline();

onMounted(() => {
  void auth.ensureReady();
});

watch(online, (isOnline, wasOnline) => {
  if (isOnline && !wasOnline && auth.status === 'error') {
    void auth.bootstrap();
  }
});
</script>

<template>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <OfflineBanner />
  <RouterView />
  <ToastHost />
</template>
