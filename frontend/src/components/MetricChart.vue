<script setup lang="ts">
import { computed } from 'vue';
import type { ForecastDay } from '@/api/types';
import { formatNumber, formatShortDate } from '@/lib/format';

const props = defineProps<{
  title: string;
  unit: string;
  days: ForecastDay[];
  metric: 'soilTempC' | 'moisturePct';
  tone: 'data' | 'clay';
  id: string;
}>();

const WIDTH = 360;
const HEIGHT = 132;
const PAD_X = 34;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

const values = computed(() => props.days.map((day) => day[props.metric]));
const min = computed(() => {
  const smallest = Math.min(...values.value);
  const largest = Math.max(...values.value);
  const spread = Math.max(largest - smallest, 1);
  return Math.floor(smallest - spread * 0.15);
});
const max = computed(() => {
  const smallest = Math.min(...values.value);
  const largest = Math.max(...values.value);
  const spread = Math.max(largest - smallest, 1);
  return Math.ceil(largest + spread * 0.15);
});

function x(index: number): number {
  if (props.days.length <= 1) return PAD_X;
  return PAD_X + (index / (props.days.length - 1)) * (WIDTH - PAD_X * 2);
}

function y(value: number): number {
  const ratio = (value - min.value) / Math.max(1, max.value - min.value);
  return HEIGHT - PAD_BOTTOM - ratio * (HEIGHT - PAD_TOP - PAD_BOTTOM);
}

const points = computed(() =>
  values.value.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' '),
);

const areaPath = computed(() => {
  if (values.value.length < 2) return '';
  const first = `M ${x(0).toFixed(1)} ${(HEIGHT - PAD_BOTTOM).toFixed(1)}`;
  const line = values.value
    .map((value, index) => `L ${x(index).toFixed(1)} ${y(value).toFixed(1)}`)
    .join(' ');
  return `${first} ${line} L ${x(values.value.length - 1).toFixed(1)} ${(HEIGHT - PAD_BOTTOM).toFixed(1)} Z`;
});

const lastPoint = computed(() => {
  const last = values.value[values.value.length - 1];
  if (last === undefined) return null;
  return { x: x(values.value.length - 1), y: y(last), value: last };
});

const ticks = computed(() => [min.value, Math.round((min.value + max.value) / 2), max.value]);
</script>

<template>
  <figure class="metric-chart">
    <figcaption class="metric-chart__head">
      <span>{{ title }}</span>
      <span class="metric-chart__unit">{{ unit }}</span>
    </figcaption>
    <svg
      v-if="days.length > 0"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="metric-chart__svg"
      role="img"
      :aria-labelledby="`${id}-title ${id}-desc`"
    >
      <title :id="`${id}-title`">{{ title }}</title>
      <desc :id="`${id}-desc`">
        Tendencia de {{ title.toLowerCase() }} en {{ days.length }} días. Valor final:
        {{ formatNumber(lastPoint?.value ?? 0) }} {{ unit }}.
      </desc>
      <g class="metric-chart__grid">
        <line
          v-for="(tick, index) in ticks"
          :key="tick"
          :x1="PAD_X"
          :x2="WIDTH - PAD_X"
          :y1="y(tick)"
          :y2="y(tick)"
        />
        <text
          v-for="tick in ticks"
          :key="`label-${tick}`"
          :x="PAD_X - 7"
          :y="y(tick) + 4"
          text-anchor="end"
        >
          {{ tick }}
        </text>
        <text :x="PAD_X" :y="HEIGHT - 8" text-anchor="start">{{ formatShortDate(days[0]!.date) }}</text>
        <text
          v-if="days.length > 2"
          :x="WIDTH - PAD_X"
          :y="HEIGHT - 8"
          text-anchor="end"
        >
          {{ formatShortDate(days[days.length - 1]!.date) }}
        </text>
      </g>
      <path :d="areaPath" class="metric-chart__area" :class="`metric-chart__area--${tone}`" />
      <polyline
        :points="points"
        fill="none"
        class="metric-chart__line"
        :class="`metric-chart__line--${tone}`"
      />
      <circle
        v-if="lastPoint"
        :cx="lastPoint.x"
        :cy="lastPoint.y"
        r="4"
        class="metric-chart__dot"
        :class="`metric-chart__dot--${tone}`"
      />
    </svg>
    <p v-else class="metric-chart__empty">Sin datos suficientes.</p>
  </figure>
</template>
