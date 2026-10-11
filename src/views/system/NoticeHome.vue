<template>
  <div class="page-stack" v-loading="table.loading.value">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="eyebrow">NOTICE</span>
        <h2>通知公告</h2>
        <p>起草后发布给全部启用账号，完整正文会出现在各账号的消息中心。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="table.search()">刷新</el-button>
        <el-button v-permission="'ops:notice:create'" type="primary" @click="openCreate">新建公告</el-button>
      </div>
    </section>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <el-input v-model="table.filters.keyword" clearable placeholder="标题 / 内容" @keyup.enter="table.search()" />
        <el-select v-model="table.filters.status" placeholder="状态" @change="table.search()">
          <el-option label="全部状态" value="all" />
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
        </el-select>
        <div class="filter-actions">
          <el-button @click="table.reset()">重置</el-button>
          <el-button type="primary" @click="table.search()">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="table.items.value" stripe height="520px">
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ typeLabel[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" effect="light">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publisherName" label="发布人" min-width="110" />
        <el-table-column label="送达" width="90">
          <template #default="{ row }">{{ row.recipientCount ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="发布时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.publishTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'draft'"
              v-permission="'ops:notice:create'"
              link
              type="primary"
              @click="openEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              v-permission="'ops:notice:publish'"
              link
              type="primary"
              @click="publish(row)"
            >
              发布
            </el-button>
            <el-button v-permission="'ops:notice:delete'" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span>共 {{ table.total.value }} 条</span>
        <el-pagination
          :current-page="table.page.value"
          :page-size="table.pageSize.value"
          :total="table.total.value"
          layout="sizes, prev, pager, next"
          background
          @current-change="table.load($event)"
          @size-change="(size: number) => table.load(1, size)"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.mode === 'create' ? '新建公告' : '编辑公告'" width="560px" destroy-on-close>
      <el-form :model="dialog.form" label-position="top">
        <el-form-item label="标题">
          <el-input v-model="dialog.form.title" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="dialog.form.type" style="width: 100%">
            <el-option label="系统" value="system" />
            <el-option label="安全" value="security" />
            <el-option label="运营" value="ops" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="dialog.form.content" type="textarea" :rows="8" maxlength="8000" show-word-limit />
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
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { announcementApi } from '@/api'
import { useTableQuery } from '@/composables/useTableQuery'
import type { Announcement } from '@/types/models'
import { bus } from '@/utils/bus'
import { formatDateTime } from '@/utils/format'

const typeLabel: Record<string, string> = {
  system: '系统',
  security: '安全',
  ops: '运营',
}

const table = useTableQuery<Announcement, { keyword: string; status: string }>({
  fetcher: (query) => announcementApi.page(query),
  defaultFilters: { keyword: '', status: 'all' },
})

const dialog = reactive({
  visible: false,
  saving: false,
  mode: 'create' as 'create' | 'edit',
  id: 0,
  form: { title: '', content: '', type: 'system' },
})

function openCreate() {
  dialog.mode = 'create'
  dialog.form = { title: '', content: '', type: 'system' }
  dialog.visible = true
}

function openEdit(row: Announcement) {
  dialog.mode = 'edit'
  dialog.id = row.id
  dialog.form = { title: row.title, content: row.content ?? '', type: row.type || 'system' }
  dialog.visible = true
}

async function submit() {
  if (!dialog.form.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  dialog.saving = true
  try {
    if (dialog.mode === 'create') {
      await announcementApi.create(dialog.form)
    } else {
      await announcementApi.update(dialog.id, dialog.form)
    }
    ElMessage.success('已保存')
    dialog.visible = false
    await table.search()
  } finally {
    dialog.saving = false
  }
}

async function publish(row: Announcement) {
  await ElMessageBox.confirm(`发布「${row.title}」给全部启用账号？`, '发布公告', { type: 'warning' })
  await announcementApi.publish(row.id)
  bus.emit('notices:reload')
  ElMessage.success('已发布')
  await table.search()
}

async function remove(row: Announcement) {
  await ElMessageBox.confirm(`删除「${row.title}」？`, '删除公告', { type: 'warning' })
  await announcementApi.remove(row.id)
  ElMessage.success('已删除')
  await table.search()
}

onMounted(() => table.search())
</script>
