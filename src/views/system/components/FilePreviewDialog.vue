<template>
  <el-dialog
    :model-value="visible"
    :title="file?.originalName || '文件预览'"
    width="80vw"
    top="4vh"
    class="file-preview-dialog"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:visible', $event)"
    @closed="cleanup"
  >
    <div v-if="file" class="preview-meta">
      <el-tag :type="statusMeta.type" effect="light">{{ statusMeta.label }}</el-tag>
      <span>{{ bizTypeLabel(file.bizType) }}</span>
      <span>{{ formatFileSize(file.sizeBytes) }}</span>
      <span>{{ file.uploader || '--' }}</span>
      <span v-if="file.status === 'rejected' && file.reviewComment"
        >驳回：{{ file.reviewComment }}</span
      >
    </div>
    <div v-loading="loading" class="preview-stage">
      <p v-if="error" class="preview-empty">{{ error }}</p>
      <img
        v-else-if="kind === 'image' && objectUrl"
        class="preview-image"
        :src="objectUrl"
        alt=""
      />
      <pre v-else-if="kind === 'text' && textContent" class="preview-text">{{ textContent }}</pre>
      <VueOfficePdf
        v-else-if="kind === 'pdf' && source"
        :src="source"
        class="preview-office"
        @error="onRenderError"
      />
      <VueOfficeDocx
        v-else-if="kind === 'docx' && source"
        :src="source"
        class="preview-office"
        @error="onRenderError"
      />
      <VueOfficeExcel
        v-else-if="kind === 'excel' && source"
        :src="source"
        class="preview-office"
        @error="onRenderError"
      />
      <VueOfficePptx
        v-else-if="kind === 'pptx' && source"
        :src="source"
        class="preview-office"
        @error="onRenderError"
      />
      <div v-else-if="!loading" class="preview-empty">
        <p>当前格式不支持在线预览，请下载后使用本地软件打开。</p>
        <p v-if="file?.ext === 'doc' || file?.ext === 'ppt'">
          旧版 .doc / .ppt 请另存为 .docx / .pptx 后再预览。
        </p>
      </div>
    </div>
    <el-form v-if="canReview" label-position="top" class="review-form">
      <el-form-item label="驳回原因" v-if="rejecting">
        <el-input
          v-model="comment"
          type="textarea"
          :rows="2"
          maxlength="200"
          show-word-limit
          placeholder="请说明需要修改的内容"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button v-if="canDownload" :loading="downloading" @click="download">下载</el-button>
      <template v-if="canReview">
        <el-button type="danger" plain :loading="reviewing" @click="reject">驳回</el-button>
        <el-button type="success" plain :loading="reviewing" @click="approve">通过</el-button>
      </template>
      <el-button type="primary" @click="emit('update:visible', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fileApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useSessionStore } from '@/stores/session'
import type { FileObject } from '@/types/models'
import { bizTypeLabel, fileStatusMeta, formatFileSize, saveBlob } from '@/utils/file'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'

const VueOfficeDocx = defineAsyncComponent(() => import('@vue-office/docx'))
const VueOfficeExcel = defineAsyncComponent(() => import('@vue-office/excel'))
const VueOfficePdf = defineAsyncComponent(() => import('@vue-office/pdf'))
const VueOfficePptx = defineAsyncComponent(() => import('@vue-office/pptx'))

const props = defineProps<{
  visible: boolean
  file: FileObject | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  reviewed: []
}>()

const { hasPermission } = usePermission()
const session = useSessionStore()
const loading = ref(false)
const downloading = ref(false)
const reviewing = ref(false)
const rejecting = ref(false)
const comment = ref('')
const error = ref('')
const source = ref<ArrayBuffer | Blob | string>('')
const objectUrl = ref('')
const textContent = ref('')

const statusMeta = computed(() => fileStatusMeta(props.file?.status))
const ext = computed(() =>
  (props.file?.ext || props.file?.originalName.split('.').pop() || '').toLowerCase(),
)
const kind = computed(() => {
  if (
    props.file?.kind === 'image' ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext.value)
  ) {
    return 'image'
  }
  if (ext.value === 'pdf') {
    return 'pdf'
  }
  if (ext.value === 'docx') {
    return 'docx'
  }
  if (['xls', 'xlsx'].includes(ext.value)) {
    return 'excel'
  }
  if (ext.value === 'pptx') {
    return 'pptx'
  }
  if (['txt', 'md', 'csv'].includes(ext.value)) {
    return 'text'
  }
  return 'other'
})
const canReview = computed(
  () =>
    hasPermission('system:file:review') &&
    props.file?.status === 'pending' &&
    props.file?.bizType !== 'avatar',
)
const canDownload = computed(() => {
  if (!props.file) {
    return false
  }
  if (props.file.userId === session.profile?.id) {
    return true
  }
  return hasPermission('system:file:download')
})

watch(
  () => [props.visible, props.file?.id] as const,
  ([visible, id]) => {
    if (visible && id) {
      void load()
    }
  },
)

async function load() {
  const current = props.file
  if (!current) {
    return
  }
  cleanup(false)
  loading.value = true
  error.value = ''
  try {
    const { blob } = await fileApi.content(current.id)
    if (kind.value === 'image') {
      objectUrl.value = URL.createObjectURL(blob)
      return
    }
    if (kind.value === 'text') {
      textContent.value = await blob.text()
      return
    }
    if (kind.value === 'other') {
      return
    }
    source.value = await blob.arrayBuffer()
  } catch {
    error.value = '预览加载失败，请下载后查看。'
  } finally {
    loading.value = false
  }
}

function onRenderError() {
  error.value = '该文档无法在浏览器中完整渲染，请下载后查看。'
}

async function download() {
  if (!props.file) {
    return
  }
  downloading.value = true
  try {
    const { blob, filename } = await fileApi.download(props.file.id)
    saveBlob(blob, filename || props.file.originalName)
  } finally {
    downloading.value = false
  }
}

async function approve() {
  if (!props.file) {
    return
  }
  reviewing.value = true
  try {
    await fileApi.review(props.file.id, { result: 'approved' })
    ElMessage.success('已通过')
    emit('reviewed')
    emit('update:visible', false)
  } finally {
    reviewing.value = false
  }
}

async function reject() {
  if (!props.file) {
    return
  }
  if (!rejecting.value) {
    rejecting.value = true
    return
  }
  if (!comment.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  reviewing.value = true
  try {
    await fileApi.review(props.file.id, { result: 'rejected', comment: comment.value.trim() })
    ElMessage.success('已驳回')
    emit('reviewed')
    emit('update:visible', false)
  } finally {
    reviewing.value = false
  }
}

function cleanup(resetForm = true) {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
  source.value = ''
  textContent.value = ''
  error.value = ''
  loading.value = false
  if (resetForm) {
    rejecting.value = false
    comment.value = ''
  }
}
</script>

<style scoped>
.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 12px;
  color: var(--color-text-muted);
  font-size: 12px;
}
.preview-stage {
  min-height: 58vh;
  max-height: 100%;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}
.preview-office {
  width: 100%;
  height: 68vh;
}
.preview-image {
  display: block;
  max-width: 100%;
  margin: 0 auto;
}
.preview-text {
  margin: 0;
  padding: 16px 20px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.7;
}
.preview-empty {
  display: grid;
  place-content: center;
  min-height: 62vh;
  padding: 24px;
  color: var(--color-text-muted);
  text-align: center;
}
.review-form {
  margin-top: 12px;
}
</style>
