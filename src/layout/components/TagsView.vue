<template>
  <div class="tags-view" v-if="tabsStore.tabs.length">
    <el-scrollbar>
      <div class="tags-row">
        <RouterLink
          v-for="item in tabsStore.tabs"
          :key="item.path"
          v-wave
          :to="item.path"
          class="tag-item"
          :class="{ active: route.path === item.path }"
        >
          <span>{{ item.title }}</span>
          <button v-if="!item.affix" type="button" aria-label="关闭页签" @click.prevent.stop="close(item.path)">
            ×
          </button>
        </RouterLink>
      </div>
    </el-scrollbar>
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="tag-more" type="button" aria-label="页签操作">⋯</button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="others">关闭其他</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

watch(
  () => route.fullPath,
  () => tabsStore.visit(route),
  { immediate: true },
)

async function close(path: string) {
  const next = tabsStore.close(path, route.path)
  if (next !== route.path) {
    await router.push(next)
  }
}

function handleCommand(command: string | number | object) {
  if (String(command) === 'others') {
    tabsStore.closeOthers(route.path)
  }
}
</script>

<style scoped lang="scss">
.tags-view {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: transparent;
}

.tags-row {
  display: flex;
  gap: 8px;
  min-height: 36px;
  align-items: center;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;

  &.active {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;
  }

  button {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
  }
}

.tag-more {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
}

@media (max-width: 720px) {
  .tags-view {
    padding: 8px 16px;
  }
}
</style>
