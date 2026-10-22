/**
 * APEX — shared PBR material library for the concept bike.
 * All materials are created once and shared across meshes.
 */
import * as THREE from 'three'

export interface BikeMaterials {
  paint: THREE.MeshPhysicalMaterial
  paintSub: THREE.MeshPhysicalMaterial
  accent: THREE.MeshStandardMaterial
  darkMetal: THREE.MeshStandardMaterial
  titanium: THREE.MeshStandardMaterial
  chrome: THREE.MeshStandardMaterial
  gold: THREE.MeshStandardMaterial
  rubber: THREE.MeshStandardMaterial
  carbon: THREE.MeshPhysicalMaterial
  discSteel: THREE.MeshStandardMaterial
  engineAlloy: THREE.MeshStandardMaterial
  glass: THREE.MeshPhysicalMaterial
  headlight: THREE.MeshStandardMaterial
  taillight: THREE.MeshStandardMaterial
  screenDark: THREE.MeshStandardMaterial
  steelBright: THREE.MeshStandardMaterial
  copper: THREE.MeshStandardMaterial
  glowLime: THREE.MeshStandardMaterial
}

export function createMaterials(): BikeMaterials {
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0x14161b,
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.1,
  })
  const paintSub = new THREE.MeshPhysicalMaterial({
    color: 0x1a1d23,
    metalness: 0.4,
    roughness: 0.45,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.9,
  })
  const accent = new THREE.MeshStandardMaterial({
    color: 0xd7ff36,
    metalness: 0.35,
    roughness: 0.4,
    emissive: 0x2a3d06,
    emissiveIntensity: 0.55,
  })
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1c2026,
    metalness: 0.95,
    roughness: 0.38,
    envMapIntensity: 0.9,
  })
  const titanium = new THREE.MeshStandardMaterial({
    color: 0xb9c0c8,
    metalness: 1,
    roughness: 0.28,
    envMapIntensity: 1.15,
  })
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xd9dde1,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.3,
  })
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc8a24a,
    metalness: 1,
    roughness: 0.24,
    envMapIntensity: 1.1,
  })
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0c0d10,
    metalness: 0,
    roughness: 0.96,
  })
  const carbon = new THREE.MeshPhysicalMaterial({
    color: 0x14161a,
    metalness: 0.35,
    roughness: 0.42,
    clearcoat: 0.8,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1,
  })
  const discSteel = new THREE.MeshStandardMaterial({
    color: 0x9aa2ab,
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: 1,
  })
  const engineAlloy = new THREE.MeshStandardMaterial({
    color: 0x5f6873,
    metalness: 0.92,
    roughness: 0.42,
    envMapIntensity: 0.95,
  })
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0c1016,
    metalness: 0,
    roughness: 0.06,
    transparent: true,
    opacity: 0.42,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
  })
  const headlight = new THREE.MeshStandardMaterial({
    color: 0xe8f4ff,
    emissive: 0xd7ff36,
    emissiveIntensity: 0,
    metalness: 0.2,
    roughness: 0.15,
  })
  const taillight = new THREE.MeshStandardMaterial({
    color: 0x2a0402,
    emissive: 0xff3b30,
    emissiveIntensity: 0,
    metalness: 0.2,
    roughness: 0.2,
  })
  const screenDark = new THREE.MeshStandardMaterial({
    color: 0x090a0d,
    metalness: 0.4,
    roughness: 0.7,
  })
  const steelBright = new THREE.MeshStandardMaterial({
    color: 0xc4cbd3,
    metalness: 1,
    roughness: 0.22,
    envMapIntensity: 1.2,
  })
  const copper = new THREE.MeshStandardMaterial({
    color: 0xb0653a,
    metalness: 1,
    roughness: 0.35,
  })
  const glowLime = new THREE.MeshStandardMaterial({
    color: 0xd7ff36,
    emissive: 0xd7ff36,
    emissiveIntensity: 1.6,
    metalness: 0,
    roughness: 0.5,
  })
  return {
    paint,
    paintSub,
    accent,
    darkMetal,
    titanium,
    chrome,
    gold,
    rubber,
    carbon,
    discSteel,
    engineAlloy,
    glass,
    headlight,
    taillight,
    screenDark,
    steelBright,
    copper,
    glowLime,
  }
}

export interface ColorwayDef {
  id: 'OBSIDION' | 'ACID' | 'TITAN'
  paint: number
  paintSub: number
  accent: number
  accentEmissive: number
}

export const COLORWAYS: Record<ColorwayDef['id'], ColorwayDef> = {
  OBSIDION: {
    id: 'OBSIDION',
    paint: 0x14161b,
    paintSub: 0x1a1d23,
    accent: 0xd7ff36,
    accentEmissive: 0x2a3d06,
  },
  ACID: {
    id: 'ACID',
    paint: 0xb8dc2e,
    paintSub: 0x23261a,
    accent: 0x0c0d10,
    accentEmissive: 0x000000,
  },
  TITAN: {
    id: 'TITAN',
    paint: 0xaeb6bf,
    paintSub: 0x23262c,
    accent: 0x2547ff,
    accentEmissive: 0x0a1140,
  },
}

export function applyColorway(m: BikeMaterials, id: ColorwayDef['id']) {
  const c = COLORWAYS[id]
  m.paint.color.setHex(c.paint)
  m.paintSub.color.setHex(c.paintSub)
  m.accent.color.setHex(c.accent)
  m.accent.emissive.setHex(c.accentEmissive)
}
