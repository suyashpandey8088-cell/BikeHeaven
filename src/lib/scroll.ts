/**
 * APEX — scroll plumbing.
 * Native scroll + GSAP ScrollTrigger, with Lenis smoothing on capable
 * desktop pointers (never on touch, never under reduced motion).
 */
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { store } from './store'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let tickerFn: ((time: number) => void) | null = null

export function initScroll() {
  if (store.reduced) return
  if (typeof window === 'undefined') return
  if (window.matchMedia('(pointer: coarse)').matches) return
  try {
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95 })
    lenis.on('scroll', ScrollTrigger.update)
    tickerFn = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(tickerFn)
    gsap.ticker.lagSmoothing(0)
  } catch {
    lenis = null
  }
}

export function destroyScroll() {
  if (tickerFn) gsap.ticker.remove(tickerFn)
  tickerFn = null
  lenis?.destroy()
  lenis = null
}

export function scrollToY(y: number, immediate = false) {
  if (lenis && !immediate) {
    lenis.scrollTo(y, { duration: store.reduced ? 0 : 1.5 })
  } else {
    window.scrollTo({ top: y, behavior: store.reduced || immediate ? 'auto' : 'smooth' })
  }
}

export function scrollToChapter(index: number, sections: (HTMLElement | null)[]) {
  const el = sections[index]
  if (!el) return
  scrollToY(el.offsetTop + 2)
}

export { gsap, ScrollTrigger }
