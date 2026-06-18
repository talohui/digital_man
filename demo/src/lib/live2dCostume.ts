import * as PIXI from 'pixi.js'

export type CostumeId = 'default' | 'costume1' | 'costume2'

const TEXTURE_INDEX_FACE = 0
const TEXTURE_INDEX_CLOTHES = 1

type CostumeSetUrls = {
  texture00: string
  texture01: string
}

const COSTUME_SETS: Record<Exclude<CostumeId, 'default'>, CostumeSetUrls> = {
  costume1: {
    texture00: '/live2d/costumes/costume1_texture_00.webp',
    texture01: '/live2d/costumes/costume1_texture_01.webp'
  },
  costume2: {
    texture00: '/live2d/costumes/costume2_texture_00.webp',
    texture01: '/live2d/costumes/costume2_texture_01.webp'
  }
}

export type CostumeOption = {
  id: CostumeId
  name: string
  faceTextureUrl: string | null
  clothesTextureUrl: string | null
}

export function listCostumes(): CostumeOption[] {
  return [
    { id: 'default', name: '默认（官方）', faceTextureUrl: null, clothesTextureUrl: null },
    {
      id: 'costume1',
      name: '服装一 · 红色',
      faceTextureUrl: COSTUME_SETS.costume1.texture00,
      clothesTextureUrl: COSTUME_SETS.costume1.texture01
    },
    {
      id: 'costume2',
      name: '服装二 · 绿色',
      faceTextureUrl: COSTUME_SETS.costume2.texture00,
      clothesTextureUrl: COSTUME_SETS.costume2.texture01
    }
  ]
}

export function parseCostumeId(value: unknown): CostumeId {
  if (value === 'costume1' || value === 'costume2' || value === 'default') {
    return value
  }
  return 'default'
}

export function isHaruCompatibleModelUrl(url: string | null | undefined): boolean {
  if (!url) return true
  return url.includes('haru')
}

type Live2DModelWithTextures = {
  textures?: PIXI.Texture[]
  __lingshanDefaultTexture0?: PIXI.Texture
  __lingshanDefaultTexture1?: PIXI.Texture
}

function rememberDefaultCostumeTextures(model: Live2DModelWithTextures) {
  if (!model.__lingshanDefaultTexture0 && model.textures?.[TEXTURE_INDEX_FACE]) {
    model.__lingshanDefaultTexture0 = model.textures[TEXTURE_INDEX_FACE]
  }
  if (!model.__lingshanDefaultTexture1 && model.textures?.[TEXTURE_INDEX_CLOTHES]) {
    model.__lingshanDefaultTexture1 = model.textures[TEXTURE_INDEX_CLOTHES]
  }
}

function isCustomTexture(
  texture: PIXI.Texture | undefined,
  defaults: { t0?: PIXI.Texture; t1?: PIXI.Texture },
  index: number
): boolean {
  if (!texture) return false
  const official = index === TEXTURE_INDEX_FACE ? defaults.t0 : defaults.t1
  return Boolean(official && texture !== official)
}

function destroyIfCustom(
  texture: PIXI.Texture | undefined,
  defaults: { t0?: PIXI.Texture; t1?: PIXI.Texture },
  index: number
) {
  if (isCustomTexture(texture, defaults, index)) {
    texture!.destroy(true)
  }
}

export async function applyCostumeTexture(
  model: Live2DModelWithTextures,
  costumeId: CostumeId
): Promise<void> {
  if (!model.textures?.length || model.textures.length <= TEXTURE_INDEX_CLOTHES) {
    return
  }

  rememberDefaultCostumeTextures(model)

  const defaults = {
    t0: model.__lingshanDefaultTexture0,
    t1: model.__lingshanDefaultTexture1
  }

  const prev0 = model.textures[TEXTURE_INDEX_FACE]
  const prev1 = model.textures[TEXTURE_INDEX_CLOTHES]

  if (costumeId === 'default') {
    if (defaults.t0) model.textures[TEXTURE_INDEX_FACE] = defaults.t0
    if (defaults.t1) model.textures[TEXTURE_INDEX_CLOTHES] = defaults.t1
    destroyIfCustom(prev0, defaults, TEXTURE_INDEX_FACE)
    destroyIfCustom(prev1, defaults, TEXTURE_INDEX_CLOTHES)
    return
  }

  const urls = COSTUME_SETS[costumeId]
  const [next0, next1] = await Promise.all([
    PIXI.Texture.fromURL(urls.texture00),
    PIXI.Texture.fromURL(urls.texture01)
  ])

  model.textures[TEXTURE_INDEX_FACE] = next0
  model.textures[TEXTURE_INDEX_CLOTHES] = next1

  if (prev0 !== next0) destroyIfCustom(prev0, defaults, TEXTURE_INDEX_FACE)
  if (prev1 !== next1) destroyIfCustom(prev1, defaults, TEXTURE_INDEX_CLOTHES)
}
