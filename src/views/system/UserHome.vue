<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">USER CENTER</span>
        <h2>用户管理</h2>
        <p>管理账号状态、所属部门和角色，支持导入导出。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="table.search()">刷新</el-button>
        <el-button v-permission="'system:user:export'" @click="exportUsers">导出 Excel</el-button>
        <el-button v-if="hasPermission('system:user:import')" @click="downloadTemplate">下载模板</el-button>
        <el-upload
          v-if="hasPermission('system:user:import')"
          :show-file-list="false"
          accept=".xlsx,.xls"
          :http-request="importUsers"
        >
          <el-button>导入 Excel</el-button>
        </el-upload>
        <el-button v-permission="'system:user:create'" type="primary" @click="openCreate">新建用户</el-button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card"><span>总用户</span><strong>{{ table.stats.value?.total ?? 0 }}</strong></article>
      <article class="stat-card"><span>启用</span><strong>{{ table.stats.value?.active ?? 0 }}</strong></article>
      <article class="stat-card"><span>待审核</span><strong>{{ table.stats.value?.pending ?? 0 }}</strong></article>
      <article class="stat-card"><span>停用</span><strong>{{ table.stats.value?.frozen ?? 0 }}</strong></article>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input v-model="table.filters.keyword" clearable placeholder="搜索姓名 / 用户名 / 邮箱" @keyup.enter="table.search()" />
        <el-select v-model="table.filters.status" placeholder="状态" @change="table.search()">
          <el-option label="全部状态" value="all" />
          <el-option v-for="item in statusDict" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="table.filters.roleId" clearable placeholder="全部角色" @change="table.search()">
          <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-select v-model="table.filters.deptId" clearable placeholder="全部部门" @change="table.search()">
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
            <strong>账号列表</strong>
            <span>共 {{ table.total.value }} 条，当前 {{ table.rangeLabel() }}</span>
          </div>
          <span>最后刷新：{{ table.lastLoadedAt.value }}</span>
        </div>
      </template>
      <el-table :data="table.items.value" row-key="id" stripe height="500px">
        <el-table-column prop="displayName" label="姓名" min-width="110" />
        <el-table-column prop="username" label="账号" min-width="110" />
        <el-table-column prop="deptName" label="部门" min-width="110" />
        <el-table-column label="角色" min-width="140">
          <template #default="{ row }">{{ (row.roleNames ?? []).join('、') || '--' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status]" effect="light">{{ statusLabel[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="180">
          <template #default="{ row }">{{ maskEmail(row.email, canSeeSensitive) }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="140">
          <template #default="{ row }">{{ maskPhone(row.phone, canSeeSensitive) }}</template>
        </el-table-column>
        <el-table-column label="最近登录" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-permission="'system:user:update'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => onMore(cmd, row)">
              <el-button text type="primary">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="hasPermission('system:user:disable')" command="status">
                    {{ row.status === 'active' ? '停用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.locked && hasPermission('system:user:unlock')" command="unlock">
                    解锁
                  </el-dropdown-item>
                  <el-dropdown-item v-if="hasPermission('system:user:grant')" command="grant">分配角色</el-dropdown-item>
                  <el-dropdown-item v-if="hasPermission('system:user:reset-password')" command="reset">
                    重置密码
                  </el-dropdown-item>
                  <el-dropdown-item v-if="hasPermission('system:user:delete')" command="remove" divided>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新建用户' : '编辑用户'" width="720px" destroy-on-close>
      <el-form :model="dialog.form" label-position="top">
        <div class="form-grid">
          <el-form-item label="用户名"><el-input v-model="dialog.form.username" :disabled="dialog.mode === 'edit'" /></el-form-item>
          <el-form-item label="姓名"><el-input v-model="dialog.form.displayName" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="dialog.form.email" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="dialog.form.phone" /></el-form-item>
          <el-form-item label="部门">
            <el-select v-model="dialog.form.deptId" style="width: 100%" @change="dialog.form.postId = undefined">
              <el-option v-for="item in depts" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="岗位">
            <el-select v-model="dialog.form.postId" clearable style="width: 100%">
              <el-option
                v-for="item in postsByDept"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="dialog.form.roleIds" multiple style="width: 100%">
              <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="dialog.form.status">
              <el-radio v-for="item in statusDict" :key="item.value" :value="item.value" border>{{ item.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="dialog.mode === 'create'" label="初始密码">
            <el-input v-model="dialog.form.password" placeholder="默认 User@123456" />
          </el-form-item>
          <el-form-item class="span-2" label="备注"><el-input v-model="dialog.form.remark" type="textarea" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detail.visible" title="用户详情" size="420px">
      <el-descriptions v-if="detail.user" :column="1" border>
        <el-descriptions-item label="姓名">{{ detail.user.displayName }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ detail.user.username }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detail.user.deptName }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ detail.user.postName || '--' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ (detail.user.roleNames ?? []).join('、') }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ maskEmail(detail.user.email, canSeeSensitive) }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ maskPhone(detail.user.phone, canSeeSensitive) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel[detail.user.status] }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ formatDateTime(detail.user.lastLoginAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.user.remark || '--' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
    <el-dialog v-model="importResult.visible" title="导入结果" width="520px">
      <p>成功 {{ importResult.success }} 条，失败 {{ importResult.failed }} 条。</p>
      <el-alert
        v-if="importResult.errors.length"
        type="warning"
        :closable="false"
        show-icon
        title="失败明细"
      />
      <ul v-if="importResult.errors.length" class="import-errors">
        <li v-for="item in importResult.errors" :key="item">{{ item }}</li>
      </ul>
      <template #footer>
        <el-button type="primary" @click="importResult.visible = false">知道了</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="grant.visible" title="分配角色" width="480px" destroy-on-close>
      <el-select v-model="grant.roleIds" multiple style="width: 100%">
        <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <template #footer>
        <el-button @click="grant.visible = false">取消</el-button>
        <el-button type="primary" :loading="grant.saving" @click="submitGrant">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { deptApi, dictApi, postApi, roleApi, userApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useTableQuery } from '@/composables/useTableQuery'
import type { DictItem, SysDept, SysPost, SysRole, SysUser } from '@/types/models'
import { downloadFile, saveDownload } from '@/utils/download'
import { formatDateTime, maskEmail, maskPhone, statusLabel, statusTag } from '@/utils/format'

const { hasPermission } = usePermission()
const canSeeSensitive = hasPermission('system:user:sensitive')
const roles = ref<SysRole[]>([])
const depts = ref<SysDept[]>([])
const posts = ref<SysPost[]>([])
const statusDict = ref<DictItem[]>([])

const table = useTableQuery<SysUser, { keyword: string; status: string; roleId?: number; deptId?: number }>({
  fetcher: (query) => userApi.page(query),
  defaultFilters: { keyword: '', status: 'all' },
})

function emptyForm() {
  return {
    username: '',
    displayName: '',
    email: '',
    phone: '',
    deptId: undefined as number | undefined,
    postId: undefined as number | undefined,
    roleIds: [] as number[],
    status: 'active',
    password: '',
    remark: '',
  }
}

const dialog = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  form: emptyForm(),
})
const detail = reactive({ visible: false, user: null as SysUser | null })
const grant = reactive({ visible: false, saving: false, userId: 0, roleIds: [] as number[] })
const importResult = reactive({ visible: false, success: 0, failed: 0, errors: [] as string[] })

function filterParams() {
  return {
    keyword: table.filters.keyword,
    status: table.filters.status,
    roleId: table.filters.roleId,
    deptId: table.filters.deptId,
  }
}

function exportUsers() {
  return saveDownload(() => downloadFile('/system/users/export', filterParams(), '用户列表.xlsx'))
}

function downloadTemplate() {
  return saveDownload(
    () => downloadFile('/system/users/import-template', undefined, '用户导入模板.xlsx'),
    '模板已下载',
  )
}

async function importUsers(options: UploadRequestOptions) {
  const result = await userApi.importUsers(options.file as File)
  importResult.success = result.success
  importResult.failed = result.failed
  importResult.errors = result.errors ?? []
  importResult.visible = true
  await table.search()
}
const postsByDept = computed(() =>
  posts.value.filter((item) => !dialog.form.deptId || item.deptId === dialog.form.deptId),
)

function openCreate() {
  dialog.mode = 'create'
  dialog.form = emptyForm()
  dialog.visible = true
}

function openEdit(row: SysUser) {
  dialog.mode = 'edit'
  dialog.id = row.id
  dialog.form = {
    username: row.username,
    displayName: row.displayName,
    email: row.email ?? '',
    phone: row.phone ?? '',
    deptId: row.deptId,
    postId: row.postId,
    roleIds: [...(row.roleIds ?? [])],
    status: row.status,
    password: '',
    remark: row.remark ?? '',
  }
  dialog.visible = true
}

function openDetail(row: SysUser) {
  detail.user = row
  detail.visible = true
}

async function submit() {
  dialog.saving = true
  try {
    if (dialog.mode === 'create') {
      await userApi.create(dialog.form)
      ElMessage.success('用户已创建')
    } else {
      await userApi.update(dialog.id, dialog.form)
      ElMessage.success('用户已更新')
    }
    dialog.visible = false
    await table.search()
  } finally {
    dialog.saving = false
  }
}

async function toggleStatus(row: SysUser) {
  const enable = row.status !== 'active'
  await ElMessageBox.confirm(`确定${enable ? '启用' : '停用'}「${row.displayName}」吗？`, '状态变更', { type: 'warning' })
  await (enable ? userApi.enable(row.id) : userApi.disable(row.id))
  ElMessage.success('已更新')
  await table.load()
}

async function resetPassword(row: SysUser) {
  await ElMessageBox.confirm(`重置「${row.displayName}」的密码？`, '重置密码', { type: 'warning' })
  const data = await userApi.resetPassword(row.id)
  ElMessage.success(`临时密码：${data.temporaryPassword}`)
}

async function unlock(row: SysUser) {
  await ElMessageBox.confirm(`解锁「${row.displayName}」？`, '解锁账号', { type: 'warning' })
  await userApi.unlock(row.id)
  ElMessage.success('已解锁')
  await table.load()
}

function openGrant(row: SysUser) {
  grant.userId = row.id
  grant.roleIds = [...(row.roleIds ?? [])]
  grant.visible = true
}

async function submitGrant() {
  grant.saving = true
  try {
    await userApi.grantRoles(grant.userId, grant.roleIds)
    ElMessage.success('角色已更新')
    grant.visible = false
    await table.search()
  } finally {
    grant.saving = false
  }
}

async function remove(row: SysUser) {
  await ElMessageBox.confirm(`删除「${row.displayName}」后不可恢复`, '删除用户', { type: 'warning' })
  await userApi.remove(row.id)
  ElMessage.success('已删除')
  await table.search()
}

function onMore(command: string, row: SysUser) {
  if (command === 'status') {
    toggleStatus(row)
  } else if (command === 'unlock') {
    unlock(row)
  } else if (command === 'grant') {
    openGrant(row)
  } else if (command === 'reset') {
    resetPassword(row)
  } else if (command === 'remove') {
    remove(row)
  }
}

onMounted(async () => {
  try {
    const [roleList, deptList, postList, statuses] = await Promise.all([
      roleApi.options(),
      deptApi.options(),
      postApi.options(),
      dictApi.data('user_status'),
    ])
    roles.value = roleList
    depts.value = deptList
    posts.value = postList
    statusDict.value = statuses
  } catch {
    /* 字典失败时仍加载列表 */
  }
  await table.search()
})
</script>

<style scoped>
.import-errors {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--color-text-muted);
  line-height: 1.6;
}
</style>
