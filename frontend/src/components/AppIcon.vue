<script setup lang="ts">
import { computed } from 'vue';

export type IconName =
  | 'home'
  | 'farm'
  | 'alert'
  | 'user'
  | 'logout'
  | 'plus'
  | 'chevron-right'
  | 'chevron-down'
  | 'clock'
  | 'sensor'
  | 'arrow-left'
  | 'check'
  | 'close'
  | 'copy'
  | 'download'
  | 'refresh'
  | 'menu'
  | 'leaf'
  | 'droplet'
  | 'thermometer'
  | 'chart'
  | 'shield'
  | 'warning'
  | 'spinner';

const props = withDefaults(defineProps<{ name: IconName; size?: number; strokeWidth?: number }>(), {
  size: 20,
  strokeWidth: 1.75,
});

const paths: Record<IconName, string[]> = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M9.5 21v-6h5v6'],
  farm: ['M3 21h18', 'M5 21V7.5L12 3l7 4.5V21', 'M9 21v-5.5h6V21', 'M9 9h2', 'M13 9h2'],
  alert: ['M12 3 2.5 20h19L12 3Z', 'M12 9v5', 'M12 17.4h.01'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21c0-4.2 3.6-6.5 8-6.5s8 2.3 8 6.5'],
  logout: ['M9.5 4H4v16h5.5', 'M15 8l4 4-4 4', 'M19 12H9'],
  plus: ['M12 5v14', 'M5 12h14'],
  'chevron-right': ['M9 5l7 7-7 7'],
  'chevron-down': ['M6 9l6 6 6-6'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.5V12l3 2'],
  sensor: [
    'M9 4h6v9.5a3 3 0 0 1-6 0V4Z',
    'M12 2v2',
    'M9 8h6',
    'M9 11h6',
    'M7.5 20.5h9',
    'M12 17v3.5',
  ],
  'arrow-left': ['M19 12H5', 'M11 6l-6 6 6 6'],
  check: ['M4 12.5l5 5L20 6.5'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  copy: [
    'M9 9h9.5A1.5 1.5 0 0 1 20 10.5V20a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 20v-9.5A1.5 1.5 0 0 1 9 9Z',
    'M15 9V5.5A1.5 1.5 0 0 0 13.5 4H5a1 1 0 0 0-1 1v9a1.5 1.5 0 0 0 1.5 1.5H7.5',
  ],
  download: ['M12 3v12', 'M7.5 10.5 12 15l4.5-4.5', 'M4 21h16'],
  refresh: ['M20.5 12a8.5 8.5 0 1 1-2.5-6', 'M20.5 4v5h-5'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  leaf: ['M4 20C4 11.2 11.2 4 20 4c0 8.8-7.2 16-16 16Z', 'M4 20c2.5-6.5 6.5-10.5 13-13'],
  droplet: ['M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z'],
  thermometer: [
    'M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z',
    'M12 8v7',
  ],
  chart: ['M3 20h18', 'M6 20V11', 'M11 20V5', 'M16 20v-6', 'M21 20V8'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z', 'M8.5 12l2.5 2.5 4.5-5'],
  warning: ['M12 3 2.5 20h19L12 3Z', 'M12 9v5', 'M12 17.4h.01'],
  spinner: ['M12 3a9 9 0 1 0 9 9'],
};

const viewBox = computed(() => '0 0 24 24');
</script>

<template>
  <svg
    :width="props.size"
    :height="props.size"
    :viewBox="viewBox"
    fill="none"
    :stroke-width="props.strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    :class="{ 'icon--spin': props.name === 'spinner' }"
  >
    <path v-for="(path, index) in paths[props.name]" :key="index" :d="path" />
  </svg>
</template>

<style scoped>
.icon--spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .icon--spin {
    animation-duration: 2.4s;
  }
}
</style>
