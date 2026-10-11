<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">ACCESS CONTROL</span>
        <h2>角色管理</h2>
        <p>为角色勾选可访问的功能和数据范围，也可复制后微调。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="load">刷新</el-button>
        <el-button v-permission="'system:role:create'" type="primary" @click="openCreate">新建角色</el-button>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <el-table :data="roles" row-key="id" stripe>
        <el-table-column prop="name" label="角色" min-width="140" />
        <el-table-column prop="code" label="编码" min-width="140" />
        <el-table-column label="数据范围" min-width="140">
          <template #default="{ row }">{{ scopeLabel[row.dataScope] || row.dataScope }}</template>
        </el-table-column>
        <el-table-column prop="userCount" label="人数" width="90" />
        <el-table-column label="内置" width="90">
          <template #default="{ row }">
            <el-tag :type="row.builtin ? 'info' : 'success'" effect="light">{{ row.builtin ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:role:update'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'system:role:grant'" link type="primary" @click="openGrant(row)">授权</el-button>
            <el-button v-permission="'system:role:view'" link @click="openMembers(row)">成员</el-button>
            <el-button v-permission="'system:role:create'" link @click="copyRole(row)">复制</el-button>
            <el-button v-if="!row.builtin" v-permission="'system:role:delete'" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="form.visible" :title="form.mode === 'create' ? '新建角色' : '编辑角色'" width="560px" destroy-on-close>
      <el-form :model="form.model" label-position="top">
        <el-form-item label="编码"><el-input v-model="form.model.code" :disabled="form.mode === 'edit'" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="form.model.name" /></el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.model.dataScope" style="width: 100%">
            <el-option v-for="(label, value) in scopeLabel" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="form.model.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.visible = false">取消</el-button>
        <el-button type="primary" :loading="form.saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="grant.visible" title="角色授权" size="520px">
      <el-form label-position="top">
        <el-form-item label="数据范围">
          <el-select v-model="grant.dataScope" style="width: 100%">
            <el-option v-for="(label, value) in scopeLabel" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="grant.dataScope === 'CUSTOM'" label="自定义部门">
          <el-select v-model="grant.deptIds" multiple style="width: 100%">
            <el-option v-for="item in depts" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单与按钮">
          <el-tree
            ref="grantTreeRef"
            :data="grant.tree"
            show-checkbox
            node-key="id"
            default-expand-all
            :props="{ label: 'name', children: 'children' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="grant.visible = false">取消</el-button>
        <el-button type="primary" :loading="grant.saving" @click="submitGrant">保存授权</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="members.visible" :title="members.title" size="520px">
      <el-table :data="members.rows" stripe>
        <el-table-column prop="displayName" label="姓名" />
        <el-table-column prop="username" label="账号" />
        <el-table-column prop="deptName" label="部门" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TreeInstance } from 'element-plus'
import { deptApi, menuApi, roleApi } from '@/api'
import type { MenuNode, SysDept, SysRole, SysUser } from '@/types/models'

const scopeLabel: Record<string, string> = {
  ALL: '全部数据',
  DEPT_TREE: '本部门及下级',
  DEPT: '本部门',
  SELF: '仅本人',
  CUSTOM: '自定义部门',
}

const loading = ref(false)
const roles = ref<SysRole[]>([])
const depts = ref<SysDept[]>([])
const menus = ref<MenuNode[]>([])
const grantTreeRef = ref<TreeInstance>()
const form = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  model: { code: '', name: '', dataScope: 'SELF', description: '', status: 'active', sortNo: 0 },
})
const grant = reactive({
  visible: false,
  saving: false,
  id: 0,
  dataScope: 'SELF',
  deptIds: [] as number[],
  tree: [] as MenuNode[],
})
const members = reactive({
  visible: false,
  title: '角色成员',
  rows: [] as SysUser[],
})

async function load() {
  loading.value = true
  try {
    roles.value = await roleApi.list()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.mode = 'create'
  form.model = { code: '', name: '', dataScope: 'SELF', description: '', status: 'active', sortNo: 0 }
  form.visible = true
}

function openEdit(row: SysRole) {
  form.mode = 'edit'
  form.id = row.id
  form.model = {
    code: row.code,
    name: row.name,
    dataScope: row.dataScope,
    description: row.description ?? '',
    status: row.status,
    sortNo: row.sortNo,
  }
  form.visible = true
}

async function submitForm() {
  form.saving = true
  try {
    if (form.mode === 'create') {
      await roleApi.create(form.model)
      ElMessage.success('角色已创建')
    } else {
      await roleApi.update(form.id, form.model)
      ElMessage.success('角色已更新')
    }
    form.visible = false
    await load()
  } finally {
    form.saving = false
  }
}

function collectLeafIds(nodes: MenuNode[], codes: string[], acc: number[] = []) {
  for (const node of nodes) {
    if (node.children?.length) {
      collectLeafIds(node.children, codes, acc)
    } else if (node.permission && codes.includes(node.permission)) {
      acc.push(node.id)
    }
  }
  return acc
}

function collectCodes(nodes: MenuNode[], acc: string[] = []) {
  for (const node of nodes) {
    if (node.permission) {
      acc.push(node.permission)
    }
    if (node.children?.length) {
      collectCodes(node.children, acc)
    }
  }
  return acc
}

async function openGrant(row: SysRole) {
  if (!menus.value.length) {
    menus.value = await menuApi.tree()
  }
  if (!depts.value.length) {
    depts.value = await deptApi.options()
  }
  const detail = await roleApi.detail(row.id)
  grant.id = row.id
  grant.dataScope = detail.dataScope
  grant.deptIds = [...(detail.deptIds ?? [])]
  grant.tree = menus.value
  grant.visible = true
  await nextTick()
  grantTreeRef.value?.setCheckedKeys(collectLeafIds(menus.value, detail.permissionCodes ?? []))
}

async function submitGrant() {
  grant.saving = true
  try {
    const checked = (grantTreeRef.value?.getCheckedNodes(false, true) ?? []) as MenuNode[]
    const half = (grantTreeRef.value?.getHalfCheckedNodes() ?? []) as MenuNode[]
    const permissionCodes = [...new Set(collectCodes([...checked, ...half]))]
    await roleApi.grant(grant.id, {
      permissionCodes,
      dataScope: grant.dataScope,
      deptIds: grant.deptIds,
    })
    ElMessage.success('授权已保存，对应用户刷新后生效')
    grant.visible = false
    await load()
  } finally {
    grant.saving = false
  }
}

async function openMembers(row: SysRole) {
  members.title = `${row.name} · 成员`
  members.rows = await roleApi.members(row.id)
  members.visible = true
}

async function copyRole(row: SysRole) {
  await ElMessageBox.confirm(`复制角色「${row.name}」？`, '复制角色', { type: 'info' })
  await roleApi.copy(row.id)
  ElMessage.success('已复制')
  await load()
}

async function remove(row: SysRole) {
  await ElMessageBox.confirm(`删除角色「${row.name}」？`, '删除角色', { type: 'warning' })
  await roleApi.remove(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>
