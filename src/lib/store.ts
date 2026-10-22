/**
 * APEX — global scroll + story store.
 *
 * Single mutable store written by GSAP ScrollTrigger (on scroll events only)
 * and read inside useFrame. No React state is updated per animation frame.
 */

export type Colorway = 'OBSIDION' | 'ACID' | 'TITAN'

export interface ChapterMeta {
  id: string
  n: string
  title: string
  short: string
}

/** Chapter registry — index 0 == CHAPTER 01. */
export const CHAPTERS: ChapterMeta[] = [
  { id: 'arrival', n: '01', title: 'THE ARRIVAL', short: 'ARRIVAL' },
  { id: 'form', n: '02', title: 'FORM IN MOTION', short: 'FORM' },
  { id: 'anatomy', n: '03', title: 'THE MACHINE COMES APART', short: 'ANATOMY' },
  { id: 'heart', n: '04', title: 'THE HEART OF THE MACHINE', short: 'HEART' },
  { id: 'control', n: '05', title: 'THE ANATOMY OF CONTROL', short: 'CONTROL' },
  { id: 'speed', n: '06', title: 'SPEED, MEASURED', short: 'SPEED' },
  { id: 'material', n: '07', title: 'LIGHT, MATERIAL, IDENTITY', short: 'MATERIAL' },
  { id: 'reveal', n: '08', title: 'THE FULL REVEAL', short: 'REVEAL' },
]

export const store = {
  /** Per-chapter scroll progress, 0..1. Index matches CHAPTERS. */
  c: [0, 0, 0, 0, 0, 0, 0, 0],
  /** Document scroll progress, 0..1. */
  global: 0,
  /** Index of the chapter currently on screen. */
  active: 0,
  /** Canvas mounted and first frame drawn. */
  ready: false,
  /** WebGL available. */
  webgl: true,
  /** prefers-reduced-motion. */
  reduced: false,
  /** Master mute state for the optional sound layer (muted by default). */
  muted: true,
  /** Active colourway. */
  colorway: 'OBSIDION' as Colorway,
  /** Normalised pointer position, -1..1 (desktop parallax). */
  px: 0,
  py: 0,
  /** Render scale multiplier set by the performance monitor. */
  dprScale: 1,
}

/** Simple pub/sub for rarely-changing values (active chapter, readiness). */
type Listener = () => void
const listeners = new Set<Listener>()
export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function emit() {
  listeners.forEach((l) => l())
}

/** Smoothed helpers used across the app. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
/** Map v from [a,b] into 0..1, clamped. */
export const range01 = (v: number, a: number, b: number) => clamp01((v - a) / (b - a))

/**
 * Story time T in [0, 8] — one unit per chapter.
 * T = Σ chapter progresses, which is continuous + monotonic because
 * chapter sections are contiguous in the document.
 */
export function storyTime(): number {
  let t = 0
  for (let i = 0; i < store.c.length; i++) t += store.c[i]
  return t
}

export function isMobileLike(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768)
  )
}
