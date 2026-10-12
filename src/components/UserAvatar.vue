<template>
  <component
    :is="clickable ? 'button' : 'span'"
    class="user-avatar"
    :class="{ clickable }"
    :type="clickable ? 'button' : undefined"
    :aria-label="clickable ? '查看头像' : undefined"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }"
    @click="openPreview"
  >
    <img v-if="showImage" :src="normalizedSrc" alt="" @error="onError" />
    <template v-else>{{ letter }}</template>
  </component>
  <el-image-viewer
    v-if="viewerVisible"
    :url-list="[normalizedSrc]"
    teleported
    hide-on-click-modal
    @close="viewerVisible = false"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string | null
    size?: number
    preview?: boolean
  }>(),
  {
    src: '',
    name: '',
    size: 36,
    preview: false,
  },
)

const failed = ref(false)
const viewerVisible = ref(false)
const normalizedSrc = computed(() => String(props.src || '').trim())
const showImage = computed(() => Boolean(normalizedSrc.value) && !failed.value)
const clickable = computed(() => props.preview && showImage.value)
const letter = computed(() => (props.name || 'N').trim().slice(0, 1) || 'N')
const fontSize = computed(() => Math.max(12, Math.round(props.size * 0.38)))

watch(normalizedSrc, () => {
  failed.value = false
})

function onError() {
  failed.value = true
  viewerVisible.value = false
}

function openPreview() {
  if (!clickable.value) {
    return
  }
  viewerVisible.value = true
}
</script>

<style scoped>
.user-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 20%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  line-height: 1;
}

.user-avatar.clickable {
  cursor: zoom-in;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
