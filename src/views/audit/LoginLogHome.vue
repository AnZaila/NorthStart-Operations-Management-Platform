<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">AUDIT</span>
        <h2>登录日志</h2>
        <p>记录成功与失败登录，普通成员仅能查看本人记录。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="exportLogs">导出 Excel</el-button>
      </div>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input v-model="table.filters.keyword" clearable placeholder="用户名" @keyup.enter="table.search()" />
        <el-select v-model="table.filters.success" placeholder="结果" @change="table.search()">
          <el-option label="全部" :value="undefined" />
          <el-option label="成功" :value="1" />
          <el-option label="失败" :value="0" />
        </el-select>
        <div class="filter-actions">
          <el-button @click="table.reset()">重置</el-button>
          <el-button type="primary" @click="table.search()">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="table.items.value" stripe height="520px">
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column label="结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" effect="light">{{ row.success ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" min-width="140" />
        <el-table-column prop="reason" label="说明" min-width="180" />
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
import type { LoginLog } from '@/types/models'
import { downloadFile, saveDownload } from '@/utils/download'
import { formatDateTime } from '@/utils/format'

const table = useTableQuery<LoginLog, { keyword: string; success?: number }>({
  fetcher: (query) => auditApi.logins(query),
  defaultFilters: { keyword: '', success: undefined },
})

function exportLogs() {
  return saveDownload(
    () =>
      downloadFile(
        '/audit/logins/export',
        { keyword: table.filters.keyword, success: table.filters.success },
        '登录日志.xlsx',
      ),
  )
}

onMounted(() => table.search())
</script>
