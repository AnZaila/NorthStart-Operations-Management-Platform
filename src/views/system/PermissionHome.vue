<template>
  <div class="page-stack" v-loading="loading">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">PERMISSION</span>
        <h2>权限点</h2>
        <p>维护系统权限点，供角色授权时勾选。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="load">刷新</el-button>
        <el-button v-permission="'system:permission:create'" type="primary" @click="openCreate">新建权限点</el-button>
      </div>
    </section>

    <el-card shadow="never" class="table-card">
      <el-table :data="items" row-key="id" stripe height="560px">
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="code" label="编码" min-width="220" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:permission:update'" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'system:permission:delete'" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新建权限点' : '编辑权限点'" width="480px" destroy-on-close>
      <el-form :model="dialog.form" label-position="top">
        <el-form-item label="编码"><el-input v-model="dialog.form.code" :disabled="dialog.mode === 'edit'" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="dialog.form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="dialog.form.type" style="width: 100%">
            <el-option label="菜单" value="MENU" />
            <el-option label="按钮" value="BUTTON" />
            <el-option label="接口" value="API" />
          </el-select>
        </el-form-item>
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
import { permissionApi } from '@/api'
import type { SysPermissionItem } from '@/types/models'

const loading = ref(false)
const items = ref<SysPermissionItem[]>([])
const dialog = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  form: { code: '', name: '', type: 'BUTTON' },
})

async function load() {
  loading.value = true
  try {
    items.value = await permissionApi.list()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.mode = 'create'
  dialog.form = { code: '', name: '', type: 'BUTTON' }
  dialog.visible = true
}

function openEdit(row: SysPermissionItem) {
  dialog.mode = 'edit'
  dialog.id = row.id
  dialog.form = { code: row.code, name: row.name, type: row.type }
  dialog.visible = true
}

async function submit() {
  dialog.saving = true
  try {
    if (dialog.mode === 'create') {
      await permissionApi.create(dialog.form)
      ElMessage.success('已创建')
    } else {
      await permissionApi.update(dialog.id, dialog.form)
      ElMessage.success('已更新')
    }
    dialog.visible = false
    await load()
  } finally {
    dialog.saving = false
  }
}

async function remove(row: SysPermissionItem) {
  await ElMessageBox.confirm(`删除权限点「${row.code}」？`, '删除', { type: 'warning' })
  await permissionApi.remove(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>
