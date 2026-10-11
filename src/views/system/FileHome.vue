<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">FILES</span>
        <h2>文件中心</h2>
        <p>集中存放头像和业务附件，可下载或按权限删除。</p>
      </div>
      <div class="hero-actions">
        <el-upload :show-file-list="false" :http-request="upload">
          <el-button type="primary">上传文件</el-button>
        </el-upload>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <el-table :data="table.items.value" stripe>
        <el-table-column prop="originalName" label="文件名" min-width="200" />
        <el-table-column prop="bizType" label="类型" width="120" />
        <el-table-column prop="uploader" label="上传人" width="120" />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">{{ formatSize(row.sizeBytes) }}</template>
        </el-table-column>
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              tag="a"
              :href="row.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开
            </el-button>
            <el-button v-permission="'system:file:delete'" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span />
        <el-pagination
          :current-page="table.page.value"
          :page-size="table.pageSize.value"
          :total="table.total.value"
          layout="prev, pager, next"
          background
          @current-change="table.load($event)"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { fileApi } from '@/api'
import { useTableQuery } from '@/composables/useTableQuery'
import type { FileObject } from '@/types/models'
import { formatDateTime } from '@/utils/format'

const table = useTableQuery<FileObject, Record<string, never>>({
  fetcher: (query) => fileApi.page(query),
  defaultFilters: {},
})

function formatSize(bytes?: number) {
  if (!bytes) {
    return '--'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function upload(options: UploadRequestOptions) {
  await fileApi.upload(options.file as File, 'common')
  ElMessage.success('已上传')
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
