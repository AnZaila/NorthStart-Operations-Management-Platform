<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">ORGANIZATION</span>
        <h2>部门管理</h2>
        <p>维护部门层级、负责人和联系方式。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="table.search()">刷新</el-button>
        <el-button v-permission="'org:dept:create'" type="primary" @click="openCreate">新建部门</el-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card"><span>部门数</span><strong>{{ table.stats.value?.total ?? 0 }}</strong></article>
      <article class="stat-card"><span>启用</span><strong>{{ table.stats.value?.active ?? 0 }}</strong></article>
      <article class="stat-card"><span>成员</span><strong>{{ table.stats.value?.members ?? 0 }}</strong></article>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input v-model="table.filters.keyword" clearable placeholder="搜索部门 / 编码 / 电话" @keyup.enter="table.search()" />
        <el-select v-model="table.filters.status" placeholder="状态" @change="table.search()">
          <el-option label="全部状态" value="all" />
          <el-option v-for="item in statusDict" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="table.filters.parentId" clearable placeholder="上级部门" @change="table.search()">
          <el-option v-for="item in parents" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <div class="filter-actions">
          <el-button @click="table.reset()">重置</el-button>
          <el-button type="primary" @click="table.search()">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="panel-title">
          <div>
            <strong>部门列表</strong>
            <span>共 {{ table.total.value }} 条，当前 {{ table.rangeLabel() }}</span>
          </div>
          <span>最后刷新：{{ table.lastLoadedAt.value }}</span>
        </div>
      </template>
      <el-table :data="table.items.value" row-key="id" stripe height="500px">
        <el-table-column prop="name" label="部门" min-width="140" />
        <el-table-column prop="code" label="编码" min-width="120" />
        <el-table-column prop="leaderName" label="负责人" min-width="110" />
        <el-table-column prop="phone" label="电话" min-width="140" />
        <el-table-column prop="parentName" label="上级" min-width="120" />
        <el-table-column prop="memberCount" label="成员" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" effect="light">{{ statusLabel[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'org:dept:update'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'org:dept:disable'" link type="warning" @click="toggleStatus(row)">
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button v-permission="'org:dept:delete'" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span />
        <el-pagination
          :current-page="table.page.value"
          :page-size="table.pageSize.value"
          :total="table.total.value"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          background
          @current-change="table.load($event)"
          @size-change="(size: number) => table.load(1, size)"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新建部门' : '编辑部门'" width="640px" destroy-on-close>
      <el-form :model="dialog.form" label-position="top">
        <div class="form-grid">
          <el-form-item label="名称"><el-input v-model="dialog.form.name" /></el-form-item>
          <el-form-item label="编码"><el-input v-model="dialog.form.code" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="dialog.form.phone" /></el-form-item>
          <el-form-item label="上级部门">
            <el-select v-model="dialog.form.parentId" clearable style="width: 100%">
              <el-option v-for="item in parents" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="dialog.form.status">
              <el-radio v-for="item in statusDict" :key="item.value" :value="item.value" border>{{ item.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="排序"><el-input-number v-model="dialog.form.sortNo" :min="0" /></el-form-item>
          <el-form-item class="span-2" label="备注"><el-input v-model="dialog.form.remark" type="textarea" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deptApi, dictApi } from '@/api'
import { useTableQuery } from '@/composables/useTableQuery'
import type { DictItem, SysDept } from '@/types/models'
import { statusLabel, statusTag } from '@/utils/format'

const statusDict = ref<DictItem[]>([])
const parents = ref<SysDept[]>([])
const table = useTableQuery<SysDept, { keyword: string; status: string; parentId?: number }>({
  fetcher: (query) => deptApi.page(query),
  defaultFilters: { keyword: '', status: 'all' },
})
const dialog = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  form: { name: '', code: '', phone: '', parentId: undefined as number | undefined, status: 'active', sortNo: 0, remark: '' },
})

function openCreate() {
  dialog.mode = 'create'
  dialog.form = { name: '', code: '', phone: '', parentId: undefined, status: 'active', sortNo: 0, remark: '' }
  dialog.visible = true
}

function openEdit(row: SysDept) {
  dialog.mode = 'edit'
  dialog.id = row.id
  dialog.form = {
    name: row.name,
    code: row.code,
    phone: row.phone ?? '',
    parentId: row.parentId && row.parentId > 0 ? row.parentId : undefined,
    status: row.status,
    sortNo: row.sortNo,
    remark: row.remark ?? '',
  }
  dialog.visible = true
}

async function submit() {
  dialog.saving = true
  try {
    if (dialog.mode === 'create') {
      await deptApi.create(dialog.form)
      ElMessage.success('部门已创建')
    } else {
      await deptApi.update(dialog.id, dialog.form)
      ElMessage.success('部门已更新')
    }
    dialog.visible = false
    parents.value = await deptApi.options()
    await table.search()
  } finally {
    dialog.saving = false
  }
}

async function toggleStatus(row: SysDept) {
  const enable = row.status !== 'active'
  await ElMessageBox.confirm(`确定${enable ? '启用' : '停用'}「${row.name}」吗？`, '状态变更', { type: 'warning' })
  await (enable ? deptApi.enable(row.id) : deptApi.disable(row.id))
  ElMessage.success('已更新')
  await table.load()
}

async function remove(row: SysDept) {
  await ElMessageBox.confirm(`删除「${row.name}」后不可恢复`, '删除部门', { type: 'warning' })
  await deptApi.remove(row.id)
  ElMessage.success('已删除')
  parents.value = await deptApi.options()
  await table.search()
}

onMounted(async () => {
  statusDict.value = await dictApi.data('org_status')
  parents.value = await deptApi.options()
  await table.search()
})
</script>
