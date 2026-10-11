<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">AUDIT</span>
        <h2>操作日志</h2>
        <p>追溯账号对用户、角色、组织等数据的变更记录。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="exportLogs">导出 Excel</el-button>
      </div>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input v-model="table.filters.keyword" clearable placeholder="账号 / 模块 / 动作" @keyup.enter="table.search()" />
        <div class="filter-actions">
          <el-button @click="table.reset()">重置</el-button>
          <el-button type="primary" @click="table.search()">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="table.items.value" stripe height="520px">
        <el-table-column prop="username" label="操作人" min-width="110" />
        <el-table-column prop="module" label="模块" min-width="110" />
        <el-table-column prop="action" label="动作" min-width="110" />
        <el-table-column prop="resource" label="资源" min-width="110" />
        <el-table-column prop="ip" label="IP" min-width="130" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" effect="light">{{ row.success ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="durationMs" label="耗时(ms)" width="110" />
        <el-table-column label="时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { auditApi } from '@/api'
import { useTableQuery } from '@/composables/useTableQuery'
import type { OperLog } from '@/types/models'
import { downloadFile, saveDownload } from '@/utils/download'
import { formatDateTime } from '@/utils/format'

const table = useTableQuery<OperLog, { keyword: string }>({
  fetcher: (query) => auditApi.operations(query),
  defaultFilters: { keyword: '' },
})

function exportLogs() {
  return saveDownload(
    () => downloadFile('/audit/operations/export', { keyword: table.filters.keyword }, '操作日志.xlsx'),
  )
}

onMounted(() => table.search())
</script>
