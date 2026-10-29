<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'critical' | 'warning' | 'info' | 'success' | 'neutral';
    label: string;
    dot?: boolean;
  }>(),
  { tone: 'neutral', dot: true },
);
</script>

<template>
  <span class="status-badge" :class="`status-badge--${tone}`">
    <span v-if="dot" class="status-badge__dot" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>
