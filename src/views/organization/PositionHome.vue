<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">ORGANIZATION</span>
        <h2>岗位管理</h2>
        <p>维护岗位名称、职级、编制和所属部门。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="table.search()">刷新</el-button>
        <el-button v-permission="'org:position:create'" type="primary" @click="openCreate">新建岗位</el-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card"><span>岗位数</span><strong>{{ table.stats.value?.total ?? 0 }}</strong></article>
      <article class="stat-card"><span>启用</span><strong>{{ table.stats.value?.active ?? 0 }}</strong></article>
      <article class="stat-card"><span>编制</span><strong>{{ table.stats.value?.headcount ?? 0 }}</strong></article>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input v-model="table.filters.keyword" clearable placeholder="搜索岗位 / 编码" @keyup.enter="table.search()" />
        <el-select v-model="table.filters.status" placeholder="状态" @change="table.search()">
          <el-option label="全部状态" value="all" />
          <el-option v-for="item in statusDict" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="table.filters.level" clearable placeholder="职级" @change="table.search()">
          <el-option v-for="item in levelDict" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="table.filters.deptId" clearable placeholder="所属部门" @change="table.search()">
          <el-option v-for="item in depts" :key="item.id" :label="item.name" :value="item.id" />
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
            <strong>岗位列表</strong>
            <span>共 {{ table.total.value }} 条，当前 {{ table.rangeLabel() }}</span>
          </div>
          <span>最后刷新：{{ table.lastLoadedAt.value }}</span>
        </div>
      </template>
      <el-table :data="table.items.value" row-key="id" stripe height="500px">
        <el-table-column prop="name" label="岗位" min-width="140" />
        <el-table-column prop="code" label="编码" min-width="110" />
        <el-table-column prop="level" label="职级" width="90" />
        <el-table-column prop="deptName" label="部门" min-width="120" />
        <el-table-column prop="headcount" label="编制" width="90" />
        <el-table-column label="在岗" width="120">
          <template #default="{ row }">
            <span>{{ row.occupied }}</span>
            <el-tag v-if="row.occupied > row.headcount" type="danger" effect="light" style="margin-left: 6px">超编</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" effect="light">{{ statusLabel[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'org:position:update'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'org:position:update'" link type="warning" @click="toggleStatus(row)">
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button v-permission="'org:position:delete'" link type="danger" @click="remove(row)">删除</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新建岗位' : '编辑岗位'" width="640px" destroy-on-close>
      <el-form :model="dialog.form" label-position="top">
        <div class="form-grid">
          <el-form-item label="名称"><el-input v-model="dialog.form.name" /></el-form-item>
          <el-form-item label="编码"><el-input v-model="dialog.form.code" /></el-form-item>
          <el-form-item label="部门">
            <el-select v-model="dialog.form.deptId" style="width: 100%">
              <el-option v-for="item in depts" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="职级">
            <el-select v-model="dialog.form.level" style="width: 100%">
              <el-option v-for="item in levelDict" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="编制"><el-input-number v-model="dialog.form.headcount" :min="1" /></el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="dialog.form.status">
              <el-radio v-for="item in statusDict" :key="item.value" :value="item.value" border>{{ item.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
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
import { deptApi, dictApi, postApi } from '@/api'
import { useTableQuery } from '@/composables/useTableQuery'
import type { DictItem, SysDept, SysPost } from '@/types/models'
import { statusLabel, statusTag } from '@/utils/format'

const statusDict = ref<DictItem[]>([])
const levelDict = ref<DictItem[]>([])
const depts = ref<SysDept[]>([])
const table = useTableQuery<SysPost, { keyword: string; status: string; level?: string; deptId?: number }>({
  fetcher: (query) => postApi.page(query),
  defaultFilters: { keyword: '', status: 'all' },
})
const dialog = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  form: { name: '', code: '', deptId: undefined as number | undefined, level: '', headcount: 1, status: 'active', remark: '' },
})

function openCreate() {
  dialog.mode = 'create'
  dialog.form = { name: '', code: '', deptId: undefined, level: '', headcount: 1, status: 'active', remark: '' }
  dialog.visible = true
}

function openEdit(row: SysPost) {
  dialog.mode = 'edit'
  dialog.id = row.id
  dialog.form = {
    name: row.name,
    code: row.code,
    deptId: row.deptId,
    level: row.level ?? '',
    headcount: row.headcount,
    status: row.status,
    remark: row.remark ?? '',
  }
  dialog.visible = true
}

async function submit() {
  dialog.saving = true
  try {
    if (dialog.mode === 'create') {
      await postApi.create(dialog.form)
      ElMessage.success('岗位已创建')
    } else {
      await postApi.update(dialog.id, dialog.form)
      ElMessage.success('岗位已更新')
    }
    dialog.visible = false
    await table.search()
  } finally {
    dialog.saving = false
  }
}

async function toggleStatus(row: SysPost) {
  const enable = row.status !== 'active'
  await ElMessageBox.confirm(`确定${enable ? '启用' : '停用'}「${row.name}」吗？`, '状态变更', { type: 'warning' })
  await (enable ? postApi.enable(row.id) : postApi.disable(row.id))
  ElMessage.success('已更新')
  await table.load()
}

async function remove(row: SysPost) {
  await ElMessageBox.confirm(`删除「${row.name}」后不可恢复`, '删除岗位', { type: 'warning' })
  await postApi.remove(row.id)
  ElMessage.success('已删除')
  await table.search()
}

onMounted(async () => {
  const [statuses, levels, deptList] = await Promise.all([
    dictApi.data('org_status'),
    dictApi.data('post_level'),
    deptApi.options(),
  ])
  statusDict.value = statuses
  levelDict.value = levels
  depts.value = deptList
  await table.search()
})
</script>
