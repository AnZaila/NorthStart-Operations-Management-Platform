<template>
  <el-dialog
    :model-value="visible"
    title="裁剪头像"
    width="720px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
    @closed="reset"
  >
    <div class="crop-layout">
      <div class="crop-stage">
        <VueCropper
          v-if="img"
          ref="cropperRef"
          :img="img"
          :auto-crop="true"
          :auto-crop-width="220"
          :auto-crop-height="220"
          :fixed="true"
          :fixed-number="[1, 1]"
          :center-box="true"
          :can-move="true"
          :can-scale="true"
          :info="true"
          :high="true"
          :enlarge="2"
          output-type="jpeg"
          :output-size="0.92"
          fill-color="#ffffff"
          @real-time="onPreview"
        />
      </div>
      <div class="crop-side">
        <div class="preview-mask">
          <div
            v-if="preview.w"
            class="preview-frame"
            :style="{
              width: `${preview.w}px`,
              height: `${preview.h}px`,
              transform: `scale(${96 / preview.w})`,
            }"
          >
            <img :src="preview.url" :style="preview.img" alt="" />
          </div>
        </div>
        <p>拖动图片或滚轮缩放，确认后上传 1:1 头像。</p>
      </div>
    </div>
    <template #footer>
      <el-button @click="cropperRef?.changeScale(-1)">缩小</el-button>
      <el-button @click="cropperRef?.changeScale(1)">放大</el-button>
      <el-button @click="cropperRef?.rotateLeft()">左转</el-button>
      <el-button @click="cropperRef?.rotateRight()">右转</el-button>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="confirm">确认上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

type CropperInstance = {
  getCropBlob: (cb: (data: Blob | null) => void) => void
  changeScale: (num: number) => void
  rotateLeft: () => void
  rotateRight: () => void
}

type CropPreview = {
  url: string
  w: number
  h: number
  img: Record<string, string>
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    file: File | null
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [file: File]
}>()

const img = ref('')
const cropperRef = ref<CropperInstance>()
const preview = reactive<CropPreview>({ url: '', w: 0, h: 0, img: {} })

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function reset() {
  img.value = ''
  preview.url = ''
  preview.w = 0
  preview.h = 0
  preview.img = {}
}

function onPreview(data: CropPreview) {
  preview.url = data.url
  preview.w = data.w
  preview.h = data.h
  preview.img = data.img ?? {}
}

async function confirm() {
  const cropper = cropperRef.value
  if (!cropper) {
    ElMessage.warning('裁剪器未就绪')
    return
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    cropper.getCropBlob((data) => {
      if (data) {
        resolve(data)
        return
      }
      reject(new Error('裁剪失败'))
    })
  })
  emit('confirm', new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' }))
}

watch(
  () => [props.visible, props.file] as const,
  async ([visible, file]) => {
    if (!visible || !file) {
      reset()
      return
    }
    try {
      img.value = await readAsDataUrl(file)
    } catch {
      ElMessage.error('图片读取失败')
      emit('update:visible', false)
    }
  },
)
</script>

<style scoped>
.crop-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128px;
  gap: 16px;
  align-items: start;
}
.crop-stage {
  height: 360px;
  overflow: hidden;
  border-radius: 16px;
  background: #111827;
}
.crop-side {
  display: grid;
  justify-items: center;
  gap: 12px;
}
.crop-side p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}
.preview-mask {
  width: 96px;
  height: 96px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20%;
  background: var(--color-surface-muted);
}
.preview-frame {
  transform-origin: top left;
}
@media (max-width: 720px) {
  .crop-layout {
    grid-template-columns: 1fr;
  }
  .crop-side {
    justify-items: start;
    grid-template-columns: 96px 1fr;
    align-items: center;
  }
  .crop-side p {
    text-align: left;
  }
}
</style>
