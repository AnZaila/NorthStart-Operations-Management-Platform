<template>
  <el-dialog
    :model-value="visible"
    title="生成头像"
    width="840px"
    align-center
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="generate-layout">
      <div class="preview-pane">
        <div class="preview-stage">
          <VueColorAvatar ref="avatarRef" :option="option" :size="240" />
        </div>
        <el-button type="primary" plain :icon="Refresh" :disabled="busy" @click="randomize"
          >随机生成</el-button
        >
        <p>调整五官和配色，确认后上传为头像。</p>
      </div>

      <div class="control-pane">
        <div class="control-block">
          <span class="control-label">形象</span>
          <el-radio-group v-model="genderPref" size="small">
            <el-radio-button value="any">不限</el-radio-button>
            <el-radio-button value="male">男性</el-radio-button>
            <el-radio-button value="female">女性</el-radio-button>
          </el-radio-group>
        </div>

        <div class="parts-grid">
          <div v-for="item in widgetControls" :key="item.type" class="part-row">
            <span class="part-name">{{ item.label }}</span>
            <el-button :icon="ArrowLeft" text @click="cycleWidget(item.type, -1)" />
            <span class="part-value">{{ shapeLabel(item.type) }}</span>
            <el-button :icon="ArrowRight" text @click="cycleWidget(item.type, 1)" />
          </div>
        </div>

        <div class="control-block">
          <span class="control-label">肤色</span>
          <div class="swatches">
            <button
              v-for="color in SETTINGS.skinColors"
              :key="color"
              type="button"
              class="swatch"
              :class="{ active: option.widgets.face?.fillColor === color }"
              :style="{ background: color }"
              @click="setWidgetColor('face', color)"
            />
          </div>
        </div>
        <div class="control-block">
          <span class="control-label">发色</span>
          <div class="swatches">
            <button
              v-for="color in SETTINGS.commonColors"
              :key="`hair-${color}`"
              type="button"
              class="swatch"
              :class="{ active: option.widgets.tops?.fillColor === color }"
              :style="{ background: color }"
              @click="setWidgetColor('tops', color)"
            />
          </div>
        </div>
        <div class="control-block">
          <span class="control-label">衣服</span>
          <div class="swatches">
            <button
              v-for="color in SETTINGS.commonColors"
              :key="`clothes-${color}`"
              type="button"
              class="swatch"
              :class="{ active: option.widgets.clothes?.fillColor === color }"
              :style="{ background: color }"
              @click="setWidgetColor('clothes', color)"
            />
          </div>
        </div>
        <div class="control-block">
          <span class="control-label">背景</span>
          <div class="swatches">
            <button
              v-for="color in SETTINGS.backgroundColor"
              :key="color"
              type="button"
              class="swatch"
              :class="{
                active: option.background.color === color,
                checker: color === 'transparent',
              }"
              :style="{ background: color === 'transparent' ? undefined : color }"
              @click="setBackground(color)"
            />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="busy" @click="confirm">使用该头像</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, toRaw, watch } from 'vue'
import { ArrowLeft, ArrowRight, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import VueColorAvatar from '@/vendor/vue-color-avatar/components/VueColorAvatar.vue'
import { Gender, WidgetType, WrapperShape } from '@/vendor/vue-color-avatar/enums'
import type { AvatarOption } from '@/vendor/vue-color-avatar/types'
import { getRandomAvatarOption } from '@/vendor/vue-color-avatar/utils'
import { SETTINGS } from '@/vendor/vue-color-avatar/utils/constant'

const EXPORT_SIZE = 512
const SQUIRCLE_RADIUS = 0.2

const SHAPE_LABELS: Record<string, string> = {
  none: '无',
  base: '默认',
  fonze: '短发',
  funny: '卷毛',
  clean: '光头',
  punk: '朋克',
  danny: '中分',
  wave: '波浪',
  turban: '头巾',
  pixie: '精灵短发',
  beanie: '毛线帽',
  attached: '贴耳',
  detached: '招风耳',
  hoop: '圆环',
  stud: '耳钉',
  up: '上挑',
  down: '下垂',
  eyelashesup: '上睫毛',
  eyelashesdown: '下睫毛',
  ellipse: '椭圆',
  smiling: '笑眼',
  eyeshadow: '眼影',
  round: '圆形',
  curve: '曲线',
  pointed: '尖鼻',
  frown: '皱眉',
  laughing: '大笑',
  nervous: '紧张',
  pucker: '嘟嘴',
  sad: '难过',
  smile: '微笑',
  smirk: '坏笑',
  surprised: '惊讶',
  scruff: '胡茬',
  crew: '圆领',
  collared: '衬衫',
  open: '开领',
  square: '方框',
}

const widgetControls: { type: WidgetType; label: string }[] = [
  { type: WidgetType.Tops, label: '发型' },
  { type: WidgetType.Eyes, label: '眼睛' },
  { type: WidgetType.Eyebrows, label: '眉毛' },
  { type: WidgetType.Nose, label: '鼻子' },
  { type: WidgetType.Mouth, label: '嘴巴' },
  { type: WidgetType.Clothes, label: '衣服' },
  { type: WidgetType.Glasses, label: '眼镜' },
  { type: WidgetType.Earrings, label: '耳饰' },
  { type: WidgetType.Beard, label: '胡须' },
  { type: WidgetType.Ear, label: '耳朵' },
]

const props = withDefaults(
  defineProps<{
    visible: boolean
    loading?: boolean
  }>(),
  { loading: false },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [file: File]
}>()

const genderPref = ref<'any' | 'male' | 'female'>('any')
const option = shallowRef<AvatarOption>(createOption())
const avatarRef = ref<{ avatarRef?: HTMLDivElement }>()
const exporting = ref(false)
const busy = computed(() => props.loading || exporting.value)

function cloneOption(value: AvatarOption): AvatarOption {
  return JSON.parse(JSON.stringify(toRaw(value))) as AvatarOption
}

function createOption(previous?: AvatarOption): AvatarOption {
  const next = getRandomAvatarOption(
    {
      wrapperShape: WrapperShape.Squircle,
      gender:
        genderPref.value === 'any'
          ? undefined
          : genderPref.value === 'male'
            ? Gender.Male
            : Gender.Female,
    },
    previous,
  )
  next.wrapperShape = WrapperShape.Squircle
  next.background.borderColor = 'transparent'
  if (next.background.color === 'transparent') {
    next.background.color = SETTINGS.commonColors[0] ?? '#D2EFF3'
  }
  return next
}

function randomize() {
  option.value = createOption(option.value)
}

function patch(mutator: (draft: AvatarOption) => void) {
  const draft = cloneOption(option.value)
  mutator(draft)
  option.value = draft
}

function shapeLabel(type: WidgetType) {
  const shape = option.value.widgets[type]?.shape ?? 'none'
  return SHAPE_LABELS[shape] ?? shape
}

function cycleWidget(type: WidgetType, delta: number) {
  const list = (SETTINGS as unknown as Record<string, string[]>)[`${type}Shape`] ?? []
  if (!list.length) {
    return
  }
  const current = option.value.widgets[type]?.shape ?? list[0]
  const index = Math.max(0, list.indexOf(current ?? ''))
  const next = list[(index + delta + list.length) % list.length] ?? list[0]
  patch((draft) => {
    const currentWidget = draft.widgets[type] ?? { shape: next }
    draft.widgets[type] = { ...currentWidget, shape: next } as never
  })
}

function setWidgetColor(type: 'face' | 'tops' | 'clothes', color: string) {
  patch((draft) => {
    const currentWidget = draft.widgets[type] ?? { shape: 'base' }
    draft.widgets[type] = { ...currentWidget, fillColor: color } as never
  })
}

function setBackground(color: string) {
  patch((draft) => {
    draft.background.color = color === 'transparent' ? '#ffffff' : color
    draft.background.borderColor = 'transparent'
  })
}

function paintBackground(ctx: CanvasRenderingContext2D, color: string, size: number) {
  if (!color || color === 'transparent') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    return
  }
  const matched = color.match(
    /^linear-gradient\(([-\d.]+)deg,\s*(#[0-9A-Fa-f]{3,8}),\s*(#[0-9A-Fa-f]{3,8})\)$/i,
  )
  if (matched?.[1] && matched[2] && matched[3]) {
    const deg = Number(matched[1])
    const rad = (deg * Math.PI) / 180
    const radius = size / 2
    const dx = Math.sin(rad) * radius
    const dy = -Math.cos(rad) * radius
    const fill = ctx.createLinearGradient(radius - dx, radius - dy, radius + dx, radius + dy)
    fill.addColorStop(0, matched[2])
    fill.addColorStop(1, matched[3])
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, size, size)
    return
  }
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('头像导出失败'))
    image.src = src
  })
}

async function waitForSvg(root: HTMLElement) {
  for (let i = 0; i < 30; i += 1) {
    if (root.querySelector('.avatar-payload svg g')) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('头像尚未生成')
}

async function exportAvatar(root: HTMLElement, current: AvatarOption) {
  await waitForSvg(root)
  const svg = root.querySelector('.avatar-payload svg')
  if (!svg) {
    throw new Error('头像尚未生成')
  }
  const cloned = svg.cloneNode(true) as SVGSVGElement
  cloned.setAttribute('width', String(EXPORT_SIZE))
  cloned.setAttribute('height', String(EXPORT_SIZE))
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const xml = new XMLSerializer().serializeToString(cloned)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = EXPORT_SIZE
    canvas.height = EXPORT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('头像导出失败')
    }
    const radius = EXPORT_SIZE * SQUIRCLE_RADIUS
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.arcTo(EXPORT_SIZE, 0, EXPORT_SIZE, EXPORT_SIZE, radius)
    ctx.arcTo(EXPORT_SIZE, EXPORT_SIZE, 0, EXPORT_SIZE, radius)
    ctx.arcTo(0, EXPORT_SIZE, 0, 0, radius)
    ctx.arcTo(0, 0, EXPORT_SIZE, 0, radius)
    ctx.closePath()
    ctx.clip()
    paintBackground(ctx, current.background.color, EXPORT_SIZE)
    ctx.drawImage(image, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((data) => {
        if (data) {
          resolve(data)
          return
        }
        reject(new Error('头像导出失败'))
      }, 'image/png')
    })
    return new File([blob], 'avatar.png', { type: 'image/png' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function confirm() {
  const root = avatarRef.value?.avatarRef
  if (!root) {
    ElMessage.warning('头像尚未生成')
    return
  }
  exporting.value = true
  try {
    emit('confirm', await exportAvatar(root, option.value))
  } catch (error) {
    exporting.value = false
    ElMessage.error(error instanceof Error ? error.message : '头像导出失败')
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      exporting.value = false
      randomize()
    }
  },
)
</script>

<style scoped>
.generate-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  max-height: 64vh;
}
.preview-pane {
  display: grid;
  justify-items: center;
  gap: 12px;
}
.preview-stage {
  overflow: hidden;
  border-radius: 20%;
  background: #fff;
  box-shadow: 0 12px 28px rgb(0 0 0 / 22%);
}
.preview-pane p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}
.control-pane {
  display: grid;
  gap: 10px;
  min-height: 0;
  max-height: 64vh;
  overflow: auto;
  padding-right: 4px;
}
.parts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
}
.control-block,
.part-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.control-label,
.part-name {
  width: 36px;
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}
.part-value {
  min-width: 64px;
  text-align: center;
  font-size: 13px;
}
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
  cursor: pointer;
}
.swatch.active {
  border-color: var(--color-primary);
}
.swatch.checker {
  background:
    linear-gradient(45deg, #d9d9d9 25%, transparent 25%) 0 0 / 8px 8px,
    linear-gradient(-45deg, #d9d9d9 25%, transparent 25%) 0 4px / 8px 8px,
    linear-gradient(45deg, transparent 75%, #d9d9d9 75%) 4px 4px / 8px 8px,
    linear-gradient(-45deg, transparent 75%, #d9d9d9 75%) 4px 0 / 8px 8px,
    #fff;
}
@media (max-width: 720px) {
  .generate-layout {
    grid-template-columns: 1fr;
    justify-items: center;
    max-height: none;
  }
  .control-pane,
  .parts-grid {
    width: 100%;
    max-height: none;
  }
  .parts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
