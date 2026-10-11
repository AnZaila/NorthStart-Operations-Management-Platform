<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">SETTINGS</span>
        <h2>参数配置</h2>
        <p>登录锁定、验证码和密码策略在此维护，保存后立即生效。</p>
      </div>
      <div class="hero-actions">
        <el-button v-permission="'system:config:update'" type="primary" :loading="saving" @click="save">保存</el-button>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <el-table :data="configs" row-key="configKey">
        <el-table-column label="参数" min-width="220">
          <template #default="{ row }">
            <div class="config-name">{{ row.remark || row.configKey }}</div>
            <div class="config-key">{{ row.configKey }}</div>
          </template>
        </el-table-column>
        <el-table-column label="当前值" width="220">
          <template #default="{ row }">
            <el-input-number
              :model-value="toNumber(row.configValue)"
              :min="bounds(row.configKey).min"
              :max="bounds(row.configKey).max"
              :step="1"
              controls-position="right"
              @change="(value: number | undefined) => (row.configValue = value == null ? '' : String(value))"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { configApi } from '@/api'
import type { SysConfig } from '@/types/models'

const loading = ref(false)
const saving = ref(false)
const configs = ref<SysConfig[]>([])

const LIMITS: Record<string, { min: number; max: number }> = {
  'password.min-length': { min: 4, max: 32 },
  'password.max-length': { min: 8, max: 64 },
  'password.history': { min: 0, max: 20 },
  'login.max-failures': { min: 1, max: 20 },
  'login.lock-minutes': { min: 1, max: 1440 },
  'login.captcha-after': { min: 0, max: 20 },
  'login.refresh-ttl-days': { min: 1, max: 30 },
}

function bounds(key: string) {
  return LIMITS[key] ?? { min: 0, max: 9999 }
}

function toNumber(value?: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

async function load() {
  loading.value = true
  try {
    configs.value = await configApi.list()
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await configApi.save(configs.value)
    ElMessage.success('参数已保存，登录与密码策略立即生效')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.config-name {
  font-weight: 600;
}
.config-key {
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: 12px;
}
</style>
