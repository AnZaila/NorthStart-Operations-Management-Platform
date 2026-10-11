<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">ONLINE</span>
        <h2>在线用户</h2>
        <p>查看当前在线设备，必要时可将指定会话强制下线。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="load">刷新</el-button>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <el-table :data="sessions" stripe>
        <el-table-column prop="displayName" label="用户" min-width="120" />
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="ip" label="IP" min-width="130" />
        <el-table-column prop="userAgent" label="设备" min-width="220" show-overflow-tooltip />
        <el-table-column label="登录时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.loginTime) }}</template>
        </el-table-column>
        <el-table-column label="当前" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.current" type="success" effect="light">本机</el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'audit:online:kick'" link type="danger" :disabled="row.current" @click="kick(row)">
              下线
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditApi } from '@/api'
import type { OnlineSession } from '@/types/models'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const sessions = ref<OnlineSession[]>([])

async function load() {
  loading.value = true
  try {
    sessions.value = await auditApi.online()
  } finally {
    loading.value = false
  }
}

async function kick(row: OnlineSession) {
  await ElMessageBox.confirm(`强制下线「${row.displayName}」的该设备？`, '强制下线', { type: 'warning' })
  await auditApi.kick(row.id)
  ElMessage.success('已下线')
  await load()
}

onMounted(load)
</script>
