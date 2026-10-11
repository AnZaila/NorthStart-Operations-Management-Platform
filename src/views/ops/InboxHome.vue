<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">INBOX</span>
        <h2>消息中心</h2>
        <p>查阅发给你的通知，打开后会标为已读。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="reload()">刷新</el-button>
        <el-button :disabled="unread === 0" @click="markAll">全部已读</el-button>
      </div>
    </section>

    <el-card shadow="never" class="table-card inbox-card">
      <div class="inbox-layout">
        <aside class="inbox-list">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索标题 / 正文"
            @keyup.enter="reload(1)"
            @clear="reload(1)"
          />
          <el-radio-group v-model="filters.readFlag" class="inbox-filter" @change="reload(1)">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="unread">未读 {{ unread ? `(${unread})` : '' }}</el-radio-button>
            <el-radio-button value="read">已读</el-radio-button>
          </el-radio-group>
          <div v-if="!items.length" class="inbox-empty">暂无通知</div>
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="inbox-item"
            :class="{ active: selected?.id === item.id, unread: !item.readFlag }"
            @click="open(item)"
          >
            <span class="inbox-item-title">{{ item.title }}</span>
            <span class="inbox-item-preview">{{ item.content || '无正文' }}</span>
            <span class="inbox-item-meta">{{ typeLabel[item.type || ''] || item.type || '通知' }} · {{ formatDateTime(item.createTime) }}</span>
          </button>
          <el-pagination
            v-if="total > pageSize"
            class="inbox-pager"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            small
            background
            @current-change="reload($event)"
          />
        </aside>
        <article class="inbox-detail">
          <template v-if="selected">
            <div class="inbox-detail-head">
              <el-tag v-if="!selected.readFlag" type="warning" effect="light" size="small">未读</el-tag>
              <el-tag v-else type="info" effect="light" size="small">已读</el-tag>
              <el-tag effect="plain" size="small">{{ typeLabel[selected.type || ''] || selected.type || '通知' }}</el-tag>
              <span>{{ formatDateTime(selected.createTime) }}</span>
            </div>
            <h3>{{ selected.title }}</h3>
            <div class="inbox-body">{{ selected.content || '无正文' }}</div>
          </template>
          <div v-else class="inbox-empty detail">从左侧选择一条通知，查看完整内容</div>
        </article>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { noticeApi } from '@/api'
import type { Notice } from '@/types/models'
import { bus } from '@/utils/bus'
import { formatDateTime } from '@/utils/format'

const typeLabel: Record<string, string> = {
  system: '系统',
  security: '安全',
  ops: '运营',
}

const loading = ref(false)
const items = ref<Notice[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 12
const unread = ref(0)
const selected = ref<Notice | null>(null)
const filters = reactive<{ keyword: string; readFlag: 'all' | 'unread' | 'read' }>({
  keyword: '',
  readFlag: 'all',
})

async function loadUnread() {
  const data = await noticeApi.unreadCount()
  unread.value = data.count
}

async function reload(nextPage = page.value) {
  loading.value = true
  try {
    const data = await noticeApi.page({
      page: nextPage,
      pageSize,
      keyword: filters.keyword,
      readFlag: filters.readFlag === 'all' ? undefined : filters.readFlag === 'unread' ? 0 : 1,
    })
    items.value = data.items
    total.value = data.total
    page.value = data.page
    if (selected.value) {
      selected.value = items.value.find((item) => item.id === selected.value?.id) ?? selected.value
    }
    await loadUnread()
  } finally {
    loading.value = false
  }
}

async function open(item: Notice) {
  selected.value = item
  if (item.readFlag) {
    return
  }
  await noticeApi.read(item.id)
  item.readFlag = 1
  unread.value = Math.max(0, unread.value - 1)
  bus.emit('notices:reload')
}

async function markAll() {
  await noticeApi.readAll()
  ElMessage.success('已全部标为已读')
  bus.emit('notices:reload')
  selected.value = null
  await reload(1)
}

onMounted(() => {
  const refresh = () => reload().catch(() => {
    items.value = []
  })
  refresh()
  bus.on('notices:reload', loadUnread)
})

onUnmounted(() => {
  bus.off('notices:reload', loadUnread)
})
</script>

<style scoped lang="scss">
.inbox-card {
  overflow: hidden;
}

.inbox-layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  min-height: 560px;
}

.inbox-list {
  display: grid;
  align-content: start;
  gap: 12px;
  padding-right: 16px;
  border-right: 1px solid var(--color-border);
}

.inbox-filter {
  display: flex;
}

.inbox-item {
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &.active {
    border-color: var(--color-border);
    background: var(--color-surface-muted);
  }

  &.unread .inbox-item-title {
    color: var(--color-primary);
  }
}

.inbox-item-title {
  color: var(--color-text-strong);
  font-size: 14px;
  font-weight: 600;
}

.inbox-item-preview {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.inbox-item-meta {
  color: var(--color-text-muted);
  font-size: 11px;
}

.inbox-pager {
  justify-self: center;
  margin-top: 8px;
}

.inbox-detail {
  min-width: 0;
  padding: 8px 8px 8px 24px;
}

.inbox-detail-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

.inbox-detail h3 {
  margin: 16px 0 12px;
  color: var(--color-text-strong);
  font-size: 22px;
  line-height: 1.35;
}

.inbox-body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: 15px;
  line-height: 1.75;
}

.inbox-empty {
  padding: 32px 12px;
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;

  &.detail {
    display: grid;
    min-height: 420px;
    place-items: center;
  }
}

@media (max-width: 960px) {
  .inbox-layout {
    grid-template-columns: 1fr;
  }

  .inbox-list {
    padding-right: 0;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 16px;
  }

  .inbox-detail {
    padding: 20px 0 0;
  }
}
</style>
