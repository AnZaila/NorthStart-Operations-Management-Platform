<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">DICTIONARY</span>
        <h2>数据字典</h2>
        <p>维护状态下拉、职级等通用选项。</p>
      </div>
      <div class="hero-actions">
        <el-button v-permission="'system:dict:create'" type="primary" @click="openType">新建类型</el-button>
      </div>
    </section>

    <section class="split-grid">
      <el-card shadow="never" class="table-card">
        <template #header><strong>字典类型</strong></template>
        <el-table :data="types" highlight-current-row @current-change="selectType">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="code" label="编码" />
          <el-table-column width="160">
            <template #default="{ row }">
              <el-button v-permission="'system:dict:update'" link type="primary" @click.stop="editType(row)">编辑</el-button>
              <el-button v-permission="'system:dict:delete'" link type="danger" @click.stop="removeType(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never" class="table-card">
        <template #header>
          <div class="panel-title">
            <strong>{{ current?.name || '字典项' }}</strong>
            <el-button v-permission="'system:dict:create'" :disabled="!current" type="primary" @click="openItem">新增字典项</el-button>
          </div>
        </template>
        <el-table :data="items" stripe>
          <el-table-column prop="label" label="标签" />
          <el-table-column prop="value" label="值" />
          <el-table-column prop="sortNo" label="排序" width="90" />
          <el-table-column width="160">
            <template #default="{ row }">
              <el-button v-permission="'system:dict:update'" link type="primary" @click="editItem(row)">编辑</el-button>
              <el-button v-permission="'system:dict:delete'" link type="danger" @click="removeItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dictApi } from '@/api'
import type { DictItem, DictType } from '@/types/models'

const loading = ref(false)
const types = ref<DictType[]>([])
const items = ref<DictItem[]>([])
const current = ref<DictType | null>(null)

async function loadTypes() {
  loading.value = true
  try {
    types.value = await dictApi.types()
    if (current.value) {
      const next = types.value.find((item) => item.id === current.value?.id) ?? types.value[0]
      await selectType(next ?? null)
    } else if (types.value[0]) {
      await selectType(types.value[0])
    }
  } finally {
    loading.value = false
  }
}

async function selectType(row: DictType | null) {
  current.value = row
  items.value = row ? await dictApi.data(row.code) : []
}

async function openType() {
  try {
    const { value } = await ElMessageBox.prompt('格式：名称,编码', '新建字典类型')
    const [name, code] = String(value)
      .split(',')
      .map((item) => item.trim())
    if (!name || !code) {
      ElMessage.warning('请按 名称,编码 填写')
      return
    }
    await dictApi.createType({ name, code, status: 'active' })
    ElMessage.success('已创建')
    await loadTypes()
  } catch {
    /* cancel */
  }
}

async function editType(row: DictType) {
  try {
    const { value } = await ElMessageBox.prompt('名称', '编辑字典类型', { inputValue: row.name })
    await dictApi.updateType(row.id, { name: String(value).trim(), code: row.code, status: row.status })
    ElMessage.success('已更新')
    await loadTypes()
  } catch {
    /* cancel */
  }
}

async function removeType(row: DictType) {
  await ElMessageBox.confirm(`删除字典「${row.name}」及全部字典项？`, '删除', { type: 'warning' })
  await dictApi.removeType(row.id)
  if (current.value?.id === row.id) {
    current.value = null
    items.value = []
  }
  await loadTypes()
}

async function openItem() {
  if (!current.value) {
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('格式：标签,值', '新建字典项')
    const [label, dictValue] = String(value)
      .split(',')
      .map((item) => item.trim())
    await dictApi.createItem(current.value.code, { label, value: dictValue, sortNo: items.value.length + 1 })
    await selectType(current.value)
  } catch {
    /* cancel */
  }
}

async function editItem(row: DictItem) {
  try {
    const { value } = await ElMessageBox.prompt('格式：标签,值', '编辑字典项', { inputValue: `${row.label},${row.value}` })
    const [label, dictValue] = String(value)
      .split(',')
      .map((item) => item.trim())
    if (!label || !dictValue) {
      ElMessage.warning('请按 标签,值 填写')
      return
    }
    await dictApi.updateItem(row.id, { label, value: dictValue, sortNo: row.sortNo })
    if (current.value) {
      await selectType(current.value)
    }
  } catch {
    /* cancel */
  }
}

async function removeItem(row: DictItem) {
  await dictApi.removeItem(row.id)
  if (current.value) {
    await selectType(current.value)
  }
}

onMounted(loadTypes)
</script>

<style scoped>
.split-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
}
@media (max-width: 960px) {
  .split-grid {
    grid-template-columns: 1fr;
  }
}
</style>
