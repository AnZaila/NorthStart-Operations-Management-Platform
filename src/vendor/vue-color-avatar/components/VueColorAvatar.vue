<template>
  <div
    ref="avatarRef"
    class="vue-color-avatar"
    :style="{
      width: `${avatarSize}px`,
      height: `${avatarSize}px`,
      ...getWrapperShapeStyle(),
    }"
    :class="getWrapperShapeClassName()"
  >
    <Background :color="avatarOption.background.color" />

    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="avatar-payload" v-html="svgContent" />

    <Border
      :color="avatarOption.background.borderColor"
      :radius="getWrapperShapeStyle().borderRadius"
    />
  </div>
</template>

<script lang="ts">
export interface VueColorAvatarRef {
  avatarRef: HTMLDivElement
}
</script>

<script lang="ts" setup>
import { ref, toRefs, watchEffect } from 'vue'

import { WidgetType, WrapperShape } from '../enums'
import type { AvatarOption } from '../types'
import { getRandomAvatarOption } from '../utils'
import { AVATAR_LAYER, NONE, SHAPE_STYLE_SET } from '../utils/constant'
import { widgetData } from '../utils/dynamic-data'

import Background from './widgets/Background.vue'
import Border from './widgets/Border.vue'

interface WidgetLayer {
  zIndex?: number
  fillColor?: string
  shape: string
}

interface VueColorAvatarProps {
  option: AvatarOption
  size?: number
}

const props = withDefaults(defineProps<VueColorAvatarProps>(), {
  option: () => getRandomAvatarOption(),
  size: 280,
})

const { option: avatarOption, size: avatarSize } = toRefs(props)

const avatarRef = ref<VueColorAvatarRef['avatarRef']>()

defineExpose({ avatarRef })

function getWrapperShapeClassName() {
  return {
    [WrapperShape.Circle]: avatarOption.value.wrapperShape === WrapperShape.Circle,
    [WrapperShape.Square]: avatarOption.value.wrapperShape === WrapperShape.Square,
    [WrapperShape.Squircle]: avatarOption.value.wrapperShape === WrapperShape.Squircle,
  }
}

function getWrapperShapeStyle() {
  const shape = avatarOption.value.wrapperShape ?? WrapperShape.Circle
  return SHAPE_STYLE_SET[shape] ?? { borderRadius: '50%' }
}

const svgContent = ref('')

watchEffect(async () => {
  const sortedList = (Object.entries(avatarOption.value.widgets) as [WidgetType, WidgetLayer][])
    .filter((entry) => Boolean(entry[1]))
    .sort(([prevType, prev], [nextType, next]) => {
      const ix = prev.zIndex ?? AVATAR_LAYER[prevType]?.zIndex ?? 0
      const iix = next.zIndex ?? AVATAR_LAYER[nextType]?.zIndex ?? 0
      return ix - iix
    })

  const promises: Promise<string>[] = sortedList.map(async ([widgetType, opt]) => {
    const loader = widgetData[widgetType]?.[opt.shape]
    if (opt.shape !== NONE && loader) {
      return (await loader()).default
    }
    return ''
  })

  let skinColor: string | undefined

  const svgRawList = await Promise.all(promises).then((raw) =>
    raw.map((svgRaw: string, i: number) => {
      const item = sortedList[i]
      if (!item) {
        return ''
      }
      const [widgetType, widget] = item
      let widgetFillColor = widget.fillColor

      if (widgetType === WidgetType.Face) {
        skinColor = widgetFillColor
      }
      if (skinColor && widgetType === WidgetType.Ear) {
        widgetFillColor = skinColor
      }

      const svgStart = svgRaw.indexOf('<svg')
      const contentStart = svgRaw.indexOf('>', svgStart)
      const content =
        contentStart >= 0
          ? svgRaw
              .slice(contentStart + 1)
              .replace('</svg>', '')
              .replaceAll('$fillColor', widgetFillColor || 'transparent')
          : ''

      return `
        <g id="vue-color-avatar-${widgetType}">
          ${content}
        </g>
      `
    }),
  )

  // Widget paths are authored in a 400×400 space. Do not scale the viewBox with
  // display size, or the clothes sit below the crop and almost disappear.
  const viewBox = 400

  svgContent.value = `
    <svg
      width="${avatarSize.value}"
      height="${avatarSize.value}"
      viewBox="0 0 ${viewBox} ${viewBox}"
      preserveAspectRatio="xMidYMax meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(100, 48)">
        ${svgRawList.join('')}
      </g>
    </svg>
  `
})
</script>

<style lang="scss" scoped>
.vue-color-avatar {
  position: relative;
  overflow: hidden;

  .avatar-payload {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }
}
</style>
