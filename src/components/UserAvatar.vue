<template>
  <span
    class="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }"
  >
    <img v-if="showImage" :src="normalizedSrc" alt="" @error="onError" />
    <template v-else>{{ letter }}</template>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string | null
    size?: number
  }>(),
  {
    src: '',
    name: '',
    size: 36,
  },
)

const failed = ref(false)
const normalizedSrc = computed(() => String(props.src || '').trim())
const showImage = computed(() => Boolean(normalizedSrc.value) && !failed.value)
const letter = computed(() => (props.name || 'N').trim().slice(0, 1) || 'N')
const fontSize = computed(() => Math.max(12, Math.round(props.size * 0.38)))

watch(normalizedSrc, () => {
  failed.value = false
})

function onError() {
  failed.value = true
}
</script>

<style scoped>
.user-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  border-radius: 20%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  line-height: 1;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
