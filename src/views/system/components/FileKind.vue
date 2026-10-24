<template>
  <span class="file-kind">
    <svg class="file-kind__shape" viewBox="0 0 36 45" aria-hidden="true">
      <path
        class="file-kind__page"
        d="M5 1.5 H20 L34.5 16 V40.5 Q34.5 43.5 31.5 43.5 H5 Q1.5 43.5 1.5 40.5 V5 Q1.5 1.5 5 1.5 Z"
      />
      <path
        class="file-kind__outline"
        d="M20 1.5 H5 Q1.5 1.5 1.5 5 V40.5 Q1.5 43.5 5 43.5 H31.5 Q34.5 43.5 34.5 40.5 V16"
      />
      <path class="file-kind__fold" d="M20 1.5 L34.5 16 H20 Z" />
      <path class="file-kind__edge" d="M20 1.5 V16 H34.5" />
      <path class="file-kind__crease" d="M20 1.5 L34.5 16" />
    </svg>
    <span class="file-kind__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  ext?: string | null
}>()

const label = computed(() => (props.ext || '--').toUpperCase())
</script>

<style scoped lang="scss">
.file-kind {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 33px;
  height: 48px;
  color: var(--el-color-primary);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.file-kind__shape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.file-kind__page {
  fill: var(--color-surface-muted);
  stroke: none;
}

.file-kind__outline,
.file-kind__edge {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 1;
  stroke-dasharray: 2.2 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.file-kind__fold {
  fill: color-mix(in srgb, var(--el-color-primary) 42%, var(--color-surface-muted));
  stroke: none;
}

.file-kind__crease {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 1;
  stroke-linecap: round;
}

.file-kind__label {
  position: relative;
  z-index: 1;
  padding-top: 12px;
}
</style>
