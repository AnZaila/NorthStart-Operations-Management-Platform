<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">FILES</span>
        <h2>文件中心</h2>
        <p>上传办公文档与图片，经审核后供同事预览和下载。支持 PDF、Word、Excel、PPT 等常见格式。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="table.search()">刷新</el-button>
        <el-button v-permission="'system:file:upload'" type="primary" @click="uploadVisible = true">
          上传文件
        </el-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card" @click="filterStatus('all')">
        <span>全部</span><strong>{{ table.stats.value?.total ?? 0 }}</strong>
      </article>
      <article class="stat-card" @click="filterStatus('pending')">
        <span>待审核</span><strong>{{ table.stats.value?.pending ?? 0 }}</strong>
      </article>
      <article class="stat-card" @click="filterStatus('approved')">
        <span>已通过</span><strong>{{ table.stats.value?.approved ?? 0 }}</strong>
      </article>
      <article class="stat-card" @click="filterStatus('rejected')">
        <span>已驳回</span><strong>{{ table.stats.value?.rejected ?? 0 }}</strong>
      </article>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input
          v-model="table.filters.keyword"
          clearable
          placeholder="搜索文件名"
          @keyup.enter="table.search()"
        />
        <el-select v-model="table.filters.status" placeholder="审核状态" @change="table.search()">
          <el-option label="全部状态" value="all" />
          <el-option v-for="item in FILE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="table.filters.bizType" placeholder="业务类型" @change="table.search()">
          <el-option label="全部类型" value="all" />
          <el-option v-for="item in BIZ_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="table.filters.kind" placeholder="文件格式" @change="table.search()">
          <el-option label="全部格式" value="all" />
          <el-option v-for="item in FILE_KIND_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <div class="filter-actions">
          <el-button @click="table.reset()">重置</el-button>
          <el-button type="primary" @click="table.search()">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div v-if="hasPermission('system:file:review')" class="batch-bar">
        <el-button :disabled="!pendingSelected.length" type="primary" @click="batchReview('approved')">批量通过</el-button>
        <el-button :disabled="!pendingSelected.length" type="danger" @click="batchReview('rejected')">批量驳回</el-button>
        <span v-if="pendingSelected.length">已选 {{ pendingSelected.length }} 个待审核文件</span>
      </div>
      <el-table :data="table.items.value" stripe @selection-change="onSelect">
        <el-table-column v-if="hasPermission('system:file:review')" type="selection" width="46" />
        <el-table-column label="预览" width="80">
          <template #default="{ row }">
            <button
              v-if="showThumb(row)"
              type="button"
              class="file-thumb"
              :class="{ avatar: row.bizType === 'avatar' }"
              @click="openPreview(row)"
            >
              <img :src="row.url" :alt="row.originalName" />
            </button>
            <FileKind v-else :ext="row.ext" />
          </template>
        </el-table-column>
        <el-table-column prop="originalName" label="文件名" min-width="220">
          <template #default="{ row }">
            <button type="button" class="file-name-link" @click="openPreview(row)">
              {{ row.originalName }}
            </button>
          </template>
        </el-table-column>
        <el-table-column label="业务" width="110">
          <template #default="{ row }">{{ bizTypeLabel(row.bizType) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.status === 'rejected' && row.reviewComment"
              :content="row.reviewComment"
              placement="top"
            >
              <el-tag :type="fileStatusMeta(row.status).type" effect="light">
                {{ fileStatusMeta(row.status).label }}
              </el-tag>
            </el-tooltip>
            <el-tag v-else :type="fileStatusMeta(row.status).type" effect="light">
              {{ fileStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" width="110" />
        <el-table-column label="审核人" width="110">
          <template #default="{ row }">{{ row.reviewerName || '--' }}</template>
        </el-table-column>
        <el-table-column label="大小" width="100">
          <template #default="{ row }">{{ formatFileSize(row.sizeBytes) }}</template>
        </el-table-column>
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPreview(row)">预览</el-button>
            <el-button v-if="canDownload(row)" link type="primary" @click="download(row)">下载</el-button>
            <el-button
              v-if="canReview(row)"
              link
              type="primary"
              @click="openPreview(row)"
            >
              审核
            </el-button>
            <el-button v-if="canDelete(row)" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span>共 {{ table.total.value }} 条</span>
        <el-pagination
          :current-page="table.page.value"
          :page-size="table.pageSize.value"
          :total="table.total.value"
          layout="sizes, prev, pager, next"
          background
          @current-change="table.load($event)"
          @size-change="(size: number) => table.load(1, size)"
        />
      </div>
    </el-card>

    <FileUploadDialog v-model:visible="uploadVisible" @uploaded="table.search()" />
    <FilePreviewDialog v-model:visible="preview.visible" :file="preview.file" @reviewed="table.search()" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fileApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useTableQuery } from '@/composables/useTableQuery'
import { useSessionStore } from '@/stores/session'
import type { FileObject } from '@/types/models'
import {
  BIZ_TYPE_OPTIONS,
  FILE_KIND_OPTIONS,
  FILE_STATUS_OPTIONS,
  bizTypeLabel,
  fileStatusMeta,
  formatFileSize,
  saveBlob,
} from '@/utils/file'
import { formatDateTime } from '@/utils/format'
import FileKind from './components/FileKind.vue'
import FilePreviewDialog from './components/FilePreviewDialog.vue'
import FileUploadDialog from './components/FileUploadDialog.vue'

const { hasPermission } = usePermission()
const session = useSessionStore()
const uploadVisible = ref(false)
const selected = ref<FileObject[]>([])
const preview = reactive<{ visible: boolean; file: FileObject | null }>({
  visible: false,
  file: null,
})

const table = useTableQuery<FileObject, { keyword: string; status: string; bizType: string; kind: string }>({
  fetcher: (query) => fileApi.page(query),
  defaultFilters: {
    keyword: '',
    status: 'all',
    bizType: 'all',
    kind: 'all',
  },
})

const pendingSelected = computed(() => selected.value.filter((item) => item.status === 'pending' && item.bizType !== 'avatar'))

function showThumb(row: FileObject) {
  return row.kind === 'image' && row.status === 'approved' && Boolean(row.url)
}

function canReview(row: FileObject) {
  return hasPermission('system:file:review') && row.status === 'pending' && row.bizType !== 'avatar'
}

function canDownload(row: FileObject) {
  if (row.userId === session.profile?.id) {
    return true
  }
  return hasPermission('system:file:download')
}

function canDelete(row: FileObject) {
  if (hasPermission('system:file:delete')) {
    return true
  }
  return row.userId === session.profile?.id && (row.status === 'pending' || row.status === 'rejected')
}

function filterStatus(status: string) {
  table.filters.status = status
  void table.search()
}

function onSelect(rows: FileObject[]) {
  selected.value = rows
}

function openPreview(row: FileObject) {
  preview.file = row
  preview.visible = true
}

async function download(row: FileObject) {
  const { blob, filename } = await fileApi.download(row.id)
  saveBlob(blob, filename || row.originalName)
}

async function batchReview(result: 'approved' | 'rejected') {
  if (!pendingSelected.value.length) {
    return
  }
  let comment = ''
  if (result === 'rejected') {
    const { value } = await ElMessageBox.prompt('请填写驳回原因', '批量驳回', {
      inputPattern: /\S/,
      inputErrorMessage: '请填写驳回原因',
    })
    comment = String(value || '').trim()
  } else {
    await ElMessageBox.confirm(`通过选中的 ${pendingSelected.value.length} 个文件？`, '批量通过', { type: 'warning' })
  }
  for (const row of pendingSelected.value) {
    await fileApi.review(row.id, { result, comment })
  }
  ElMessage.success(result === 'approved' ? '已通过' : '已驳回')
  selected.value = []
  await table.search()
}

async function remove(row: FileObject) {
  await ElMessageBox.confirm(`删除「${row.originalName}」？`, '删除文件', { type: 'warning' })
  await fileApi.remove(row.id)
  ElMessage.success('已删除')
  await table.search()
}

onMounted(() => table.search())
</script>

<style scoped>
.stat-card {
  cursor: pointer;
}
.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--color-text-muted);
  font-size: 12px;
}
.file-thumb {
  display: block;
  width: 40px;
  height: 40px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: var(--color-surface-muted);
  cursor: zoom-in;
}
.file-thumb.avatar {
  border-radius: 20%;
}
.file-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.file-name-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  text-align: left;
}
.file-name-link:hover {
  text-decoration: underline;
}
</style>
