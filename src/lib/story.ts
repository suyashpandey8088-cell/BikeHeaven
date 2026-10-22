/**
 * APEX — story timeline.
 *
 * Everything the 3D stage does is a function of "story time" T ∈ [0,8]
 * (one unit per chapter, derived from scroll). This module holds the
 * keyframed curves for camera, bike yaw, explode amount, engine-internals
 * cutaway, lighting rigs and background colour. One controller interpolates
 * them every frame — a single source of truth, fully reversible by scroll.
 */
import * as THREE from 'three'
import { clamp01, lerp, smoothstep } from './store'

export interface CamKey {
  t: number
  /** look target in bike-local space */
  look: [number, number, number]
  /** camera distance from the look target */
  dist: number
  /** bike-relative azimuth: 0 = in front of the nose, +π/2 = left side */
  az: number
  /** elevation above horizontal */
  el: number
  fov: number
}

/**
 * Camera keyframes, authored bike-relative so framing survives yaw changes.
 * Look targets are bike-local (engine, fork, tank, wheel…).
 */
export const CAM_KEYS: CamKey[] = [
  // —— CH 01 · THE ARRIVAL — fragments, then the pull-back
  { t: 0.0, look: [0.71, 0.26, 0.06], dist: 1.05, az: 0.5, el: -0.04, fov: 32 },
  { t: 0.32, look: [0.86, 0.78, 0], dist: 1.35, az: 0.65, el: 0.22, fov: 30 },
  { t: 0.62, look: [0.1, 0.75, 0], dist: 2.5, az: 1.05, el: 0.38, fov: 36 },
  { t: 0.85, look: [0.0, 0.62, 0], dist: 2.9, az: 1.25, el: 0.3, fov: 38 },
  { t: 1.0, look: [0.0, 0.62, 0], dist: 3.2, az: 1.35, el: 0.32, fov: 38 },
  // —— CH 02 · FORM IN MOTION — sweep around the bodywork
  { t: 1.3, look: [0.0, 0.65, 0], dist: 3.3, az: 1.45, el: 0.18, fov: 36 },
  { t: 1.65, look: [-0.2, 0.68, 0], dist: 3.1, az: 1.75, el: 0.2, fov: 35 },
  { t: 1.85, look: [-0.25, 0.6, 0], dist: 3.4, az: 2.0, el: 0.35, fov: 38 },
  { t: 2.0, look: [-0.1, 0.55, 0], dist: 4.0, az: 2.1, el: 0.5, fov: 42 },
  // —— CH 03 · EXPLODED VIEW — wide travel around the assembly
  { t: 2.12, look: [0.1, 0.5, 0], dist: 5.2, az: 2.2, el: 0.55, fov: 44 },
  { t: 2.4, look: [0.3, 0.55, 0], dist: 5.6, az: 2.6, el: 0.3, fov: 44 },
  { t: 2.62, look: [0.2, 0.5, 0], dist: 5.8, az: 3.4, el: 0.22, fov: 44 },
  { t: 2.82, look: [-0.3, 0.5, 0], dist: 5.6, az: 4.1, el: 0.28, fov: 46 },
  { t: 3.0, look: [-0.1, 0.5, 0], dist: 6.0, az: 4.4, el: 0.42, fov: 44 },
  // —— CH 04 · THE HEART — dive + engine macro
  { t: 3.18, look: [0.12, 0.52, 0], dist: 3.0, az: 1.3, el: 0.3, fov: 32 },
  { t: 3.42, look: [0.12, 0.52, 0], dist: 1.1, az: 1.0, el: 0.18, fov: 27 },
  { t: 3.62, look: [0.1, 0.5, 0], dist: 0.85, az: 0.85, el: 0.12, fov: 25 },
  { t: 3.82, look: [0.05, 0.48, 0], dist: 1.05, az: 0.55, el: 0.15, fov: 26 },
  { t: 4.0, look: [0.0, 0.5, 0], dist: 2.9, az: 0.9, el: 0.42, fov: 30 },
  // —— CH 05 · CONTROL — fork / brake / tyre / chassis
  { t: 4.12, look: [0.66, 0.55, 0], dist: 1.3, az: 1.0, el: 0.35, fov: 30 },
  { t: 4.3, look: [0.68, 0.45, 0], dist: 1.15, az: 0.9, el: 0.25, fov: 28 },
  { t: 4.44, look: [0.71, 0.36, 0.03], dist: 1.0, az: 0.45, el: 0.22, fov: 26 },
  { t: 4.58, look: [0.71, 0.34, 0], dist: 0.95, az: 0.3, el: 0.18, fov: 27 },
  { t: 4.66, look: [0.72, 0.31, 0], dist: 1.25, az: 0.75, el: 0.1, fov: 30 },
  { t: 4.8, look: [0.72, 0.29, 0], dist: 1.7, az: 0.5, el: 0.04, fov: 32 },
  { t: 4.88, look: [0.0, 0.6, 0], dist: 3.5, az: 1.5, el: 0.3, fov: 34 },
  { t: 5.0, look: [0.0, 0.55, 0], dist: 3.6, az: 1.7, el: 0.35, fov: 36 },
  // —— CH 06 · SPEED — tunnel, front-on, fov stretch
  { t: 5.2, look: [0.2, 0.6, 0], dist: 3.2, az: 0.6, el: 0.12, fov: 46 },
  { t: 5.55, look: [0.0, 0.62, 0], dist: 2.3, az: 0.45, el: 0.08, fov: 56 },
  { t: 5.8, look: [0.0, 0.64, 0], dist: 2.8, az: 0.55, el: 0.12, fov: 50 },
  { t: 6.0, look: [0.0, 0.65, 0], dist: 3.6, az: 0.7, el: 0.28, fov: 44 },
  // —— CH 07 · MATERIAL — macro orbit of tank + panels
  { t: 6.2, look: [0.0, 0.88, 0], dist: 1.6, az: 1.1, el: 0.25, fov: 30 },
  { t: 6.45, look: [-0.15, 0.8, 0], dist: 1.1, az: 1.4, el: 0.1, fov: 28 },
  { t: 6.7, look: [0.3, 0.75, 0], dist: 1.5, az: 0.9, el: 0.32, fov: 30 },
  { t: 6.88, look: [0.1, 0.68, 0], dist: 2.7, az: 1.2, el: 0.38, fov: 34 },
  { t: 7.0, look: [0.0, 0.64, 0], dist: 3.4, az: 1.3, el: 0.3, fov: 38 },
  // —— CH 08 · FULL REVEAL — hero orbit
  { t: 7.3, look: [0.0, 0.66, 0], dist: 3.6, az: 3.1, el: 0.18, fov: 36 },
  { t: 7.62, look: [0.0, 0.68, 0], dist: 3.8, az: 4.6, el: 0.2, fov: 38 },
  { t: 8.0, look: [0.0, 0.66, 0], dist: 3.4, az: 5.53, el: 0.22, fov: 40 },
]

/** Bike yaw (rotation.y) keyframes. */
export const YAW_KEYS: [number, number][] = [
  [0.0, 0.0],
  [0.5, -0.28],
  [1.0, -0.62],
  [1.4, -1.02],
  [1.7, -1.18],
  [2.0, -1.28],
  [2.5, -1.28],
  [3.0, -1.28],
  [3.3, -0.85],
  [3.7, -0.7],
  [4.0, -0.85],
  [4.5, -0.95],
  [4.85, -0.88],
  [5.4, -0.45],
  [5.9, -0.35],
  [6.4, -0.75],
  [6.9, -0.55],
  [7.4, -0.75],
  [7.8, -1.15],
  [8.0, -0.88],
]

/**
 * Exploded-view amount E(T): 0 assembled → 1 fully exploded.
 * Holds through CH03, then reassembles as we dive into the engine.
 */
export function explodeAt(T: number): number {
  if (T <= 2.04) return 0
  if (T < 2.8) return smoothstep((T - 2.04) / 0.76)
  if (T <= 2.97) return 1
  if (T < 3.38) return 1 - smoothstep((T - 2.97) / 0.41)
  return 0
}

/** Engine cutaway / internals amount I(T). */
export function internalsAt(T: number): number {
  if (T <= 3.32) return 0
  if (T < 3.58) return smoothstep((T - 3.32) / 0.26)
  if (T <= 3.86) return 1
  if (T < 4.02) return 1 - smoothstep((T - 3.86) / 0.16)
  return 0
}

/** Headlight intensity L(T): arrival flash, then final reveal. */
export function headlightAt(T: number, time: number): number {
  let v = 0
  if (T > 0.24 && T < 0.42) {
    // sharp controlled flash as the light sweep reaches the nose
    v = Math.max(v, smoothstep((T - 0.24) / 0.06) * (1 - smoothstep((T - 0.36) / 0.06)))
  }
  if (T > 7.12) v = Math.max(v, smoothstep((T - 7.12) / 0.12))
  // subtle idle flicker when fully on
  if (T > 7.3) v *= 0.92 + 0.08 * Math.sin(time * 37)
  return v
}

export interface LightKey {
  t: number
  key: { pos: [number, number, number]; color: number; intensity: number }
  rimA: { color: number; intensity: number }
  rimB: { color: number; intensity: number }
  ambient: number
  env: number
  /** extra point light near the engine (CH04 heat) */
  heat: number
  fog: { color: number; density: number }
  bg: number
}

/** Lighting rig keyframes — each chapter has its own environment. */
export const LIGHT_KEYS: LightKey[] = [
  {
    t: 0.0,
    key: { pos: [3, 4, 3], color: 0x9fb4cc, intensity: 14 },
    rimA: { color: 0xd7ff36, intensity: 0 },
    rimB: { color: 0x2547ff, intensity: 5 },
    ambient: 0.04,
    env: 0.05,
    heat: 0,
    fog: { color: 0x050607, density: 0.05 },
    bg: 0x050607,
  },
  {
    t: 1.0,
    key: { pos: [2, 5, 2], color: 0xe8ecf2, intensity: 22 },
    rimA: { color: 0xb9c0c8, intensity: 16 },
    rimB: { color: 0x2a3140, intensity: 10 },
    ambient: 0.1,
    env: 0.35,
    heat: 0,
    fog: { color: 0x0a0c0f, density: 0.035 },
    bg: 0x0a0c0f,
  },
  {
    t: 2.0,
    key: { pos: [-2, 5, 2], color: 0xdfe6ee, intensity: 18 },
    rimA: { color: 0xd7ff36, intensity: 10 },
    rimB: { color: 0x3a4552, intensity: 10 },
    ambient: 0.08,
    env: 0.3,
    heat: 0,
    fog: { color: 0x070a06, density: 0.04 },
    bg: 0x070a06,
  },
  {
    t: 3.0,
    key: { pos: [-2, 4, -2], color: 0xcfd8e2, intensity: 16 },
    rimA: { color: 0xd7ff36, intensity: 8 },
    rimB: { color: 0x506070, intensity: 8 },
    ambient: 0.07,
    env: 0.3,
    heat: 0,
    fog: { color: 0x0a0705, density: 0.045 },
    bg: 0x0a0705,
  },
  {
    t: 3.5,
    key: { pos: [2, 3, 1], color: 0xff5a2a, intensity: 10 },
    rimA: { color: 0xff8c42, intensity: 12 },
    rimB: { color: 0x35404e, intensity: 6 },
    ambient: 0.06,
    env: 0.22,
    heat: 1,
    fog: { color: 0x0d0503, density: 0.06 },
    bg: 0x0d0503,
  },
  {
    t: 4.0,
    key: { pos: [2, 4, 2], color: 0xdfe7f0, intensity: 20 },
    rimA: { color: 0xb9c0c8, intensity: 14 },
    rimB: { color: 0x2547ff, intensity: 8 },
    ambient: 0.09,
    env: 0.38,
    heat: 0.25,
    fog: { color: 0x08090b, density: 0.035 },
    bg: 0x08090b,
  },
  {
    t: 5.0,
    key: { pos: [1, 4, -2], color: 0xd8e2f2, intensity: 16 },
    rimA: { color: 0xd7ff36, intensity: 12 },
    rimB: { color: 0xff3b30, intensity: 4 },
    ambient: 0.06,
    env: 0.18,
    heat: 0,
    fog: { color: 0x040507, density: 0.07 },
    bg: 0x040507,
  },
  {
    t: 6.0,
    key: { pos: [2, 6, 2], color: 0xf2f3f4, intensity: 26 },
    rimA: { color: 0xffffff, intensity: 22 },
    rimB: { color: 0x8fa2b8, intensity: 14 },
    ambient: 0.14,
    env: 0.7,
    heat: 0,
    fog: { color: 0x111318, density: 0.028 },
    bg: 0x111318,
  },
  {
    t: 7.0,
    key: { pos: [3, 5, 3], color: 0xfff4e0, intensity: 24 },
    rimA: { color: 0xd7ff36, intensity: 16 },
    rimB: { color: 0xff3b30, intensity: 6 },
    ambient: 0.12,
    env: 0.55,
    heat: 0,
    fog: { color: 0x0b0c0e, density: 0.03 },
    bg: 0x0b0c0e,
  },
  {
    t: 8.0,
    key: { pos: [3, 6, 3], color: 0xfff6e6, intensity: 26 },
    rimA: { color: 0xd7ff36, intensity: 18 },
    rimB: { color: 0x2547ff, intensity: 8 },
    ambient: 0.13,
    env: 0.6,
    heat: 0,
    fog: { color: 0x0c0d10, density: 0.026 },
    bg: 0x0c0d10,
  },
]

/* ------------------------------------------------------------------ */
/* Interpolation helpers                                               */
/* ------------------------------------------------------------------ */

export function sampleKeys<T extends { t: number }>(keys: T[], t: number): [T, T, number] {
  if (t <= keys[0].t) return [keys[0], keys[0], 0]
  const last = keys[keys.length - 1]
  if (t >= last.t) return [last, last, 0]
  let i = 0
  while (i < keys.length - 2 && keys[i + 1].t <= t) i++
  const a = keys[i]
  const b = keys[i + 1]
  const f = smoothstep((t - a.t) / (b.t - a.t))
  return [a, b, f]
}

export function sampleNumber(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1]
  const last = keys[keys.length - 1]
  if (t >= last[0]) return last[1]
  let i = 0
  while (i < keys.length - 2 && keys[i + 1][0] <= t) i++
  const [ta, va] = keys[i]
  const [tb, vb] = keys[i + 1]
  return lerp(va, vb, smoothstep((t - ta) / (tb - ta)))
}

export function sampleVec3(keys: [number, [number, number, number]][], t: number, out: THREE.Vector3) {
  if (t <= keys[0][0]) {
    out.set(keys[0][1][0], keys[0][1][1], keys[0][1][2])
    return out
  }
  const last = keys[keys.length - 1]
  if (t >= last[0]) {
    out.set(last[1][0], last[1][1], last[1][2])
    return out
  }
  let i = 0
  while (i < keys.length - 2 && keys[i + 1][0] <= t) i++
  const [ta, va] = keys[i]
  const [tb, vb] = keys[i + 1]
  const f = smoothstep((t - ta) / (tb - ta))
  out.set(lerp(va[0], vb[0], f), lerp(va[1], vb[1], f), lerp(va[2], vb[2], f))
  return out
}

export interface SampledCamera {
  pos: THREE.Vector3
  look: THREE.Vector3
  fov: number
}
const _camPos = new THREE.Vector3()
const _camLook = new THREE.Vector3()
const _lookWorld = new THREE.Vector3()
const _dir = new THREE.Vector3()

/**
 * Resolve the camera at story time T given the bike's current yaw —
 * keyframes are authored bike-relative, so look/dist/azimuth are
 * transformed into world space here.
 */
export function cameraAt(T: number, yaw: number): SampledCamera {
  const [a, b, f] = sampleKeys(CAM_KEYS, T)
  const lookL = [lerp(a.look[0], b.look[0], f), lerp(a.look[1], b.look[1], f), lerp(a.look[2], b.look[2], f)]
  const dist = lerp(a.dist, b.dist, f)
  const az = lerp(a.az, b.az, f)
  const el = lerp(a.el, b.el, f)
  const fov = lerp(a.fov, b.fov, f)
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  // bike-local look point → world (rotation about Y)
  _lookWorld.set(lookL[0] * cy + lookL[2] * sy, lookL[1], -lookL[0] * sy + lookL[2] * cy)
  // bike-relative camera direction → world
  const dx = Math.cos(az) * Math.cos(el)
  const dy = Math.sin(el)
  const dz = Math.sin(az) * Math.cos(el)
  _dir.set(dx * cy + dz * sy, dy, -dx * sy + dz * cy)
  _camPos.copy(_lookWorld).addScaledVector(_dir, dist)
  _camLook.copy(_lookWorld)
  return { pos: _camPos, look: _camLook, fov }
}

const _ca = new THREE.Color()
const _cb = new THREE.Color()

export function lightRigAt(T: number, out: Record<string, number | number[]>) {
  const [a, b, f] = sampleKeys(LIGHT_KEYS, T)
  const mixNum = (x: number, y: number) => lerp(x, y, f)
  const mixCol = (x: number, y: number) => {
    _ca.setHex(x)
    _cb.setHex(y)
    _ca.lerp(_cb, f)
    return _ca.getHex()
  }
  out.keyColor = mixCol(a.key.color, b.key.color)
  out.keyIntensity = mixNum(a.key.intensity, b.key.intensity)
  out.keyX = lerp(a.key.pos[0], b.key.pos[0], f)
  out.keyY = lerp(a.key.pos[1], b.key.pos[1], f)
  out.keyZ = lerp(a.key.pos[2], b.key.pos[2], f)
  out.rimAColor = mixCol(a.rimA.color, b.rimA.color)
  out.rimAIntensity = mixNum(a.rimA.intensity, b.rimA.intensity)
  out.rimBColor = mixCol(a.rimB.color, b.rimB.color)
  out.rimBIntensity = mixNum(a.rimB.intensity, b.rimB.intensity)
  out.ambient = mixNum(a.ambient, b.ambient)
  out.env = mixNum(a.env, b.env)
  out.heat = mixNum(a.heat, b.heat)
  out.fogColor = mixCol(a.fog.color, b.fog.color)
  out.fogDensity = mixNum(a.fog.density, b.fog.density)
  out.bg = mixCol(a.bg, b.bg)
  return out
}

/** Vertical scroll offsets (extra bounce per chapter) used by DOM parallax. */
export function bgWordForChapter(i: number): string {
  return ['ARRIVAL', 'FORM', 'ANATOMY', 'HEART', 'CONTROL', 'VELOCITY', 'MATTER', 'APEX'][i] ?? ''
}

/** Concept specification data (clearly labelled as a design study). */
export interface SpecRow {
  label: string
  value: string
  unit: string
  note: string
}

export const SPECS: SpecRow[] = [
  { label: 'PEAK POWER', value: '217', unit: 'PS @ 12,600 RPM', note: 'Simulated output of the concept inline-four.' },
  { label: 'MAXIMUM TORQUE', value: '118', unit: 'NM @ 10,900 RPM', note: 'Broad, flat delivery engineered for corner exit.' },
  { label: 'KERB WEIGHT', value: '187', unit: 'KG', note: 'Target mass including all fluids — simulation.' },
  { label: 'POWER-TO-WEIGHT', value: '1.16', unit: 'PS / KG', note: 'The number that decides how the concept feels.' },
  { label: 'DISPLACEMENT', value: '999', unit: 'CM³', note: 'Inline four-cylinder, liquid cooled, DOHC.' },
  { label: '0–100 KM/H', value: '2.9', unit: 'SECONDS', note: 'Simulated target under ideal conditions.' },
  { label: 'FRAME', value: 'TWIN-SPAR', unit: 'ALUMINIUM', note: 'Engine as a fully stressed member.' },
  { label: 'FRONT BRAKES', value: '2×330', unit: 'MM DISCS', note: 'Radial monobloc calipers, concept specification.' },
  { label: 'SUSPENSION', value: '43/120', unit: 'MM USD / SHOCK', note: 'Fully adjustable, electronic damping concept.' },
  { label: 'WHEELBASE', value: '1,418', unit: 'MM', note: 'Geometry biased toward stability at speed.' },
  { label: 'WEIGHT DISTRIBUTION', value: '52/48', unit: '% F/R', note: 'Engineered balance, unladen.' },
  { label: 'TOP SPEED', value: '299', unit: 'KM/H (ELECTRONIC)', note: 'Concept limiter — not a tested claim.' },
]
