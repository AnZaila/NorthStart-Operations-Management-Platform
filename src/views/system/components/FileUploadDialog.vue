<template>
  <el-dialog
    :model-value="visible"
    title="上传文件"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
    @closed="reset"
  >
    <el-form label-position="top">
      <el-form-item label="业务类型">
        <el-select v-model="bizType" style="width: 100%">
          <el-option
            v-for="item in bizOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="文件">
        <el-upload
          drag
          multiple
          :auto-upload="false"
          :accept="FILE_ACCEPT"
          :file-list="fileList"
          :on-change="onChange"
          :on-remove="onRemove"
        >
          <div class="upload-copy">
            <el-icon><Plus/></el-icon>
            <strong>拖拽到此处，或点击选择</strong>
            <p>支持 PDF、Word、Excel、PPT、文本和常见图片，单个不超过 50MB。</p>
          </div>
        </el-upload>
      </el-form-item>
    </el-form>
    <p class="hint">上传后进入待审核，通过后其他同事即可预览和下载。</p>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!files.length" @click="submit">
        开始上传
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

import { fileApi } from '@/api'
import { BIZ_TYPE_OPTIONS, FILE_ACCEPT } from '@/utils/file'

const emit = defineEmits<{
  'update:visible': [value: boolean]
  uploaded: []
}>()

defineProps<{
  visible: boolean
}>()

const bizOptions = BIZ_TYPE_OPTIONS.filter((item) => item.value !== 'avatar')
const bizType = ref('document')
const files = ref<File[]>([])
const fileList = ref<UploadUserFile[]>([])
const saving = ref(false)

const acceptSet = computed(() => new Set(FILE_ACCEPT.split(',').map((item) => item.slice(1))))

function onChange(uploadFile: UploadFile, uploadFiles: UploadUserFile[]) {
  fileList.value = uploadFiles
  files.value = uploadFiles
    .map((item) => item.raw)
    .filter((item): item is File => item instanceof File)
    .filter((item) => {
      const ext = item.name.includes('.') ? item.name.slice(item.name.lastIndexOf('.') + 1).toLowerCase() : ''
      if (!acceptSet.value.has(ext)) {
        ElMessage.warning(`不支持 ${item.name}`)
        return false
      }
      if (item.size > 50 * 1024 * 1024) {
        ElMessage.warning(`${item.name} 超过 50MB`)
        return false
      }
      return true
    })
}

function onRemove(_uploadFile: UploadFile, uploadFiles: UploadUserFile[]) {
  fileList.value = uploadFiles
  files.value = uploadFiles.map((item) => item.raw).filter((item): item is File => item instanceof File)
}

function reset() {
  bizType.value = 'document'
  files.value = []
  fileList.value = []
  saving.value = false
}

async function submit() {
  if (!files.value.length) {
    ElMessage.warning('请选择文件')
    return
  }
  saving.value = true
  try {
    for (const file of files.value) {
      await fileApi.upload(file, bizType.value)
    }
    ElMessage.success(files.value.length > 1 ? `已上传 ${files.value.length} 个文件` : '已上传')
    emit('uploaded')
    emit('update:visible', false)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.upload-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  color: var(--el-color-primary);
}
.upload-copy p,
.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}
.hint {
  margin-top: 4px;
}
:deep(.el-form-item__content) {
  width: 100%;
  display: flex;
  justify-content: center;
  & > div {
    width: 100%;
  }
}
</style>
