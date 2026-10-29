<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const toasts = useToastStore();
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="false">
    <div
      v-for="toast in toasts.items"
      :key="toast.id"
      class="toast"
      :class="`toast--${toast.tone}`"
      role="status"
    >
      <span>{{ toast.message }}</span>
      <button
        type="button"
        class="toast__close"
        aria-label="Cerrar aviso"
        @click="toasts.dismiss(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
