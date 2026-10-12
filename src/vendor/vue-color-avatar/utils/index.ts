import {
  type EarringsShape,
  type GlassesShape,
  BeardShape,
  Gender,
  TopsShape,
} from '../enums'
import type { AvatarOption, None } from '../types'

import { AVATAR_LAYER, NONE, SETTINGS } from './constant'

function getRandomValue<Item = unknown>(
  arr: Item[],
  {
    avoid = [],
    usually = [],
  }: { avoid?: unknown[]; usually?: (Item | 'none')[] } = {},
): Item {
  const avoidValues = avoid.filter(Boolean)
  const filteredArr = arr.filter((it) => !avoidValues.includes(it))

  const usuallyValues = usually
    .filter(Boolean)
    .reduce<Item[]>((acc, cur) => acc.concat(new Array(15).fill(cur)), [])

  const finalArr = filteredArr.concat(usuallyValues)
  const randomIdx = Math.floor(Math.random() * Math.max(finalArr.length, 1))
  const randomValue = finalArr[randomIdx]
  if (randomValue !== undefined) {
    return randomValue
  }
  return arr[0] as Item
}

export function getRandomFillColor(colors = SETTINGS.commonColors) {
  return colors[Math.floor(Math.random() * colors.length)] ?? colors[0] ?? '#6BD9E9'
}

export function getRandomAvatarOption(
  presetOption: Partial<AvatarOption> = {},
  useOption: Partial<AvatarOption> = {},
): AvatarOption {
  const gender =
    presetOption.gender === Gender.Male || presetOption.gender === Gender.Female
      ? presetOption.gender
      : getRandomValue(SETTINGS.gender)

  const beardList: BeardShape[] = []
  let topList: TopsShape[] = [TopsShape.Danny, TopsShape.Wave, TopsShape.Pixie]

  if (gender === Gender.Male) {
    beardList.push(BeardShape.Scruff)
    topList = SETTINGS.topsShape.filter((shape) => !topList.includes(shape))
  }

  const beardShape = getRandomValue<BeardShape | None>(beardList, {
    usually: [NONE],
  })

  const hairShape = getRandomValue(topList, {
    avoid: [useOption.widgets?.tops?.shape],
  })
  const hairColor = getRandomFillColor()

  return {
    gender,

    wrapperShape: presetOption.wrapperShape || getRandomValue(SETTINGS.wrapperShape),

    background: {
      color: getRandomValue(SETTINGS.backgroundColor, {
        avoid: [
          useOption.background?.color,
          (hairShape === TopsShape.Punk || hairShape === TopsShape.Fonze) && hairColor,
        ],
      }),
      borderColor: getRandomValue(SETTINGS.borderColor, {
        avoid: [useOption.background?.color],
        usually: ['transparent'],
      }),
    },

    widgets: {
      face: {
        shape: getRandomValue(SETTINGS.faceShape),
        fillColor: getRandomFillColor(SETTINGS.skinColors),
      },
      tops: {
        shape: hairShape,
        fillColor: hairColor,
      },
      ear: {
        shape: getRandomValue(SETTINGS.earShape, {
          avoid: [useOption.widgets?.ear?.shape],
        }),
      },
      earrings: {
        shape: getRandomValue<EarringsShape | None>(SETTINGS.earringsShape, {
          usually: [NONE],
        }),
      },
      eyebrows: {
        shape: getRandomValue(SETTINGS.eyebrowsShape, {
          avoid: [useOption.widgets?.eyebrows?.shape],
        }),
      },
      eyes: {
        shape: getRandomValue(SETTINGS.eyesShape, {
          avoid: [useOption.widgets?.eyes?.shape],
        }),
      },
      nose: {
        shape: getRandomValue(SETTINGS.noseShape, {
          avoid: [useOption.widgets?.nose?.shape],
        }),
      },
      glasses: {
        shape: getRandomValue<GlassesShape | None>(SETTINGS.glassesShape, {
          usually: [NONE],
        }),
      },
      mouth: {
        shape: getRandomValue(SETTINGS.mouthShape, {
          avoid: [useOption.widgets?.mouth?.shape],
        }),
      },
      beard: {
        shape: beardShape,
        ...(beardShape === BeardShape.Scruff
          ? { zIndex: AVATAR_LAYER.mouth.zIndex - 1 }
          : undefined),
      },
      clothes: {
        shape: getRandomValue(SETTINGS.clothesShape, {
          avoid: [useOption.widgets?.clothes?.shape],
        }),
        fillColor: getRandomFillColor(),
      },
    },
  }
}
