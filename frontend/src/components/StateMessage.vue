<script setup lang="ts">
import AppIcon from './AppIcon.vue';

withDefaults(
  defineProps<{
    kind?: 'loading' | 'error' | 'empty';
    title?: string;
    description?: string;
    retryLabel?: string;
    compact?: boolean;
  }>(),
  { kind: 'empty', retryLabel: 'Reintentar', compact: false },
);

defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="state-message" :class="[`state-message--${kind}`, { 'state-message--compact': compact }]">
    <template v-if="kind === 'loading'">
      <div class="skeleton-lines" aria-hidden="true">
        <span class="skeleton skeleton--title"></span>
        <span class="skeleton"></span>
        <span class="skeleton skeleton--short"></span>
      </div>
      <p class="state-message__description">{{ description ?? 'Cargando datos…' }}</p>
    </template>

    <template v-else>
      <span class="state-message__mark" aria-hidden="true">
        <AppIcon :name="kind === 'error' ? 'warning' : 'leaf'" :size="22" />
      </span>
      <h2 v-if="title" class="state-message__title">{{ title }}</h2>
      <p v-if="description" class="state-message__description">{{ description }}</p>
      <slot />
      <button v-if="kind === 'error'" type="button" class="btn btn--secondary" @click="$emit('retry')">
        <AppIcon name="refresh" :size="16" />
        {{ retryLabel }}
      </button>
    </template>
  </div>
</template>
