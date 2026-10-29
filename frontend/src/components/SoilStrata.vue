<script setup lang="ts">
import { computed } from 'vue';
import type { SoilAssessment } from '@/api/types';
import { useI18n } from '@/i18n';

const props = defineProps<{
  assessment: SoilAssessment;
  compact?: boolean;
}>();

const { t } = useI18n();

const statusLabel = computed(() => {
  switch (props.assessment.status) {
    case 'healthy':
      return 'Suelo estable';
    case 'watch':
      return 'En observación';
    case 'depleted':
      return 'Suelo agotado';
  }
});

const markerPosition = computed(() => `${Math.min(100, Math.max(0, props.assessment.score))}%`);
const statusTone = computed(() => {
  if (props.assessment.status === 'healthy') return 'success';
  if (props.assessment.status === 'watch') return 'warning';
  return 'critical';
});
</script>

<template>
  <div class="soil-strata" :class="{ 'soil-strata--compact': compact }">
    <div class="soil-strata__head">
      <span class="soil-strata__label">{{ t('zone.soilScore') }}</span>
      <span class="soil-strata__value">{{ assessment.score }}<span>/100</span></span>
    </div>
    <div
      class="soil-strata__track"
      role="meter"
      :aria-valuenow="assessment.score"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`${t('zone.soilScore')}: ${assessment.score} de 100, ${statusLabel}`"
    >
      <span class="soil-strata__marker" :style="{ left: markerPosition }"></span>
    </div>
    <div class="soil-strata__foot">
      <span class="soil-strata__status" :class="`soil-strata__status--${statusTone}`">
        <span aria-hidden="true"></span>{{ statusLabel }}
      </span>
      <span class="soil-strata__days">{{ assessment.daysRemaining }} d</span>
    </div>
  </div>
</template>
