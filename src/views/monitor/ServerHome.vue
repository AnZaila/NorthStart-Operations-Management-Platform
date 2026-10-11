<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">MONITOR</span>
        <h2>服务监控</h2>
        <p>查看当前 JVM、主机负载和磁盘占用，便于排查性能与容量问题。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </section>

    <section class="stats-grid" v-if="data">
      <article class="stat-card">
        <span>CPU 使用率</span>
        <strong>{{ data.os.cpuPercent.toFixed(1) }}%</strong>
      </article>
      <article class="stat-card">
        <span>系统负载</span>
        <strong>{{ data.os.systemLoad.toFixed(2) }}</strong>
      </article>
      <article class="stat-card">
        <span>堆内存</span>
        <strong>{{ percent(data.memory.heapUsed, data.memory.heapMax) }}</strong>
      </article>
      <article class="stat-card">
        <span>运行时长</span>
        <strong class="uptime">{{ data.jvm.uptime }}</strong>
      </article>
    </section>

    <section class="split-grid" v-if="data">
      <el-card shadow="never" class="table-card">
        <template #header><strong>主机</strong></template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="系统">{{ data.os.name }} {{ data.os.version }}</el-descriptions-item>
          <el-descriptions-item label="架构">{{ data.os.arch }}</el-descriptions-item>
          <el-descriptions-item label="逻辑处理器">{{ data.os.cpuCount }}</el-descriptions-item>
          <el-descriptions-item label="物理内存">
            {{ formatSize(data.memory.physicalTotal - data.memory.physicalFree) }} /
            {{ formatSize(data.memory.physicalTotal) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      <el-card shadow="never" class="table-card">
        <template #header><strong>JVM</strong></template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="名称">{{ data.jvm.name }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ data.jvm.version }}</el-descriptions-item>
          <el-descriptions-item label="厂商">{{ data.jvm.vendor }}</el-descriptions-item>
          <el-descriptions-item label="启动时间">{{ data.jvm.startTime }}</el-descriptions-item>
          <el-descriptions-item label="PID">{{ data.jvm.pid }}</el-descriptions-item>
          <el-descriptions-item label="堆 / 非堆">
            {{ formatSize(data.memory.heapUsed) }} / {{ formatSize(data.memory.nonHeapUsed) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </section>

    <el-card v-if="data" shadow="never" class="table-card">
      <template #header><strong>磁盘</strong></template>
      <el-table :data="data.disks" stripe>
        <el-table-column prop="path" label="挂载" min-width="240" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column label="已用" min-width="160">
          <template #default="{ row }">
            {{ formatSize(row.total - row.usable) }} / {{ formatSize(row.total) }}
            （{{ percent(row.total - row.usable, row.total) }}）
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { monitorApi } from '@/api'
import type { ServerSnapshot } from '@/types/models'

const loading = ref(false)
const data = ref<ServerSnapshot | null>(null)

function formatSize(bytes?: number) {
  if (!bytes || bytes < 0) {
    return '--'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function percent(used: number, total: number) {
  if (!total || total < 0) {
    return '--'
  }
  return `${Math.min(100, Math.max(0, (used / total) * 100)).toFixed(1)}%`
}

async function load() {
  loading.value = true
  try {
    data.value = await monitorApi.server()
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<style scoped lang="scss">
.uptime {
  font-size: 18px;
}

.split-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .split-grid {
    grid-template-columns: 1fr;
  }
}
</style>
