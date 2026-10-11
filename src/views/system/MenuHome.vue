<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">NAVIGATION</span>
        <h2>菜单管理</h2>
        <p>配置侧栏目录、页面入口和按钮权限。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="load">刷新</el-button>
        <el-button v-permission="'system:menu:create'" type="primary" @click="openCreate()">新建菜单</el-button>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <el-table :data="menus" row-key="id" default-expand-all stripe>
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="path" label="路径" min-width="160" />
        <el-table-column prop="component" label="组件" min-width="200" />
        <el-table-column prop="permission" label="权限码" min-width="180" />
        <el-table-column label="显示" width="90">
          <template #default="{ row }">{{ row.visible ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:menu:create'" link type="primary" @click="openCreate(row.id)">子级</el-button>
            <el-button v-permission="'system:menu:update'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'system:menu:delete'" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新建菜单' : '编辑菜单'" width="640px" destroy-on-close>
      <el-form :model="dialog.form" label-position="top">
        <div class="form-grid">
          <el-form-item label="类型">
            <el-select v-model="dialog.form.type" style="width: 100%">
              <el-option label="目录" value="DIR" />
              <el-option label="菜单" value="MENU" />
              <el-option label="按钮" value="BUTTON" />
              <el-option label="外链" value="LINK" />
            </el-select>
          </el-form-item>
          <el-form-item label="名称"><el-input v-model="dialog.form.name" /></el-form-item>
          <el-form-item label="路径"><el-input v-model="dialog.form.path" /></el-form-item>
          <el-form-item label="组件"><el-input v-model="dialog.form.component" placeholder="system/UserHome" /></el-form-item>
          <el-form-item label="图标"><el-input v-model="dialog.form.icon" /></el-form-item>
          <el-form-item label="权限码"><el-input v-model="dialog.form.permission" /></el-form-item>
          <el-form-item label="上级">
            <el-select v-model="dialog.form.parentId" clearable style="width: 100%">
              <el-option v-for="item in flatMenus" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="排序"><el-input-number v-model="dialog.form.sortNo" :min="0" /></el-form-item>
          <el-form-item label="显示">
            <el-switch v-model="dialog.form.visible" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="隐藏路由">
            <el-switch v-model="dialog.form.hidden" :active-value="1" :inactive-value="0" />
          </el-form-item>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { menuApi } from '@/api'
import type { MenuNode } from '@/types/models'

const loading = ref(false)
const menus = ref<MenuNode[]>([])
const dialog = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  form: emptyForm(),
})

function emptyForm(parentId?: number) {
  return {
    parentId,
    type: 'MENU',
    name: '',
    path: '',
    component: '',
    icon: '',
    permission: '',
    visible: 1,
    hidden: 0,
    sortNo: 0,
  }
}

function flatten(nodes: MenuNode[], prefix = ''): Array<{ id: number; name: string }> {
  const rows: Array<{ id: number; name: string }> = []
  for (const node of nodes) {
    rows.push({ id: node.id, name: `${prefix}${node.name}` })
    if (node.children?.length) {
      rows.push(...flatten(node.children, `${prefix}${node.name} / `))
    }
  }
  return rows
}

const flatMenus = computed(() => flatten(menus.value))

async function load() {
  loading.value = true
  try {
    menus.value = await menuApi.tree()
  } finally {
    loading.value = false
  }
}

function openCreate(parentId?: number) {
  dialog.mode = 'create'
  dialog.form = emptyForm(parentId)
  dialog.visible = true
}

function openEdit(row: MenuNode) {
  dialog.mode = 'edit'
  dialog.id = row.id
  dialog.form = {
    parentId: row.parentId || undefined,
    type: row.type,
    name: row.name,
    path: row.path ?? '',
    component: row.component ?? '',
    icon: row.icon ?? '',
    permission: row.permission ?? '',
    visible: row.visible ? 1 : 0,
    hidden: row.hidden ? 1 : 0,
    sortNo: row.sortNo,
  }
  dialog.visible = true
}

async function submit() {
  dialog.saving = true
  try {
    if (dialog.mode === 'create') {
      await menuApi.create(dialog.form)
      ElMessage.success('菜单已创建')
    } else {
      await menuApi.update(dialog.id, dialog.form)
      ElMessage.success('菜单已更新')
    }
    dialog.visible = false
    await load()
  } finally {
    dialog.saving = false
  }
}

async function remove(row: MenuNode) {
  await ElMessageBox.confirm(`删除「${row.name}」？`, '删除菜单', { type: 'warning' })
  await menuApi.remove(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>
