/**
 * APEX — chapter scaffolding + scroll-linked timelines.
 *
 * Every chapter is a tall section with a sticky viewport. One ScrollTrigger
 * per chapter writes progress into the store (for the 3D stage); a scrubbed
 * GSAP timeline animates the DOM copy. Everything reverses with scroll.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger } from '../lib/scroll'
import { store, emit } from '../lib/store'

export type ChapterSetup = (tl: gsap.core.Timeline, el: HTMLElement) => void

export function useChapter<T extends HTMLElement>(index: number, setup?: ChapterSetup) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          store.c[index] = self.progress
        },
        onToggle: (self) => {
          if (self.isActive && store.active !== index) {
            store.active = index
            emit()
          }
        },
      })
      if (setup) {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: 'bottom bottom',
            scrub: store.reduced ? true : 0.7,
          },
        })
        setup(tl, el)
      }
    }, el)
    return () => ctx.revert()
  }, [index])
  return ref
}

export function ChapterShell({
  index,
  height,
  id,
  label,
  children,
  setup,
  innerRef,
}: {
  index: number
  height: number
  id: string
  label: string
  children: ReactNode
  setup?: ChapterSetup
  innerRef?: (el: HTMLElement | null) => void
}) {
  const ref = useChapter<HTMLElement>(index, setup)
  return (
    <section
      ref={(el) => {
        ref.current = el
        innerRef?.(el)
      }}
      className={`chapter chapter--${id}`}
      data-chapter={index + 1}
      style={{ height: `${height}vh` }}
      aria-label={label}
    >
      <div className="chapter__sticky">{children}</div>
    </section>
  )
}

/* ---------- shared animation vocabulary ---------- */

/** Mask-reveal a headline line (wraps each line in overflow hidden). */
export function maskIn(tl: gsap.core.Timeline, sel: string, at: number, dur = 0.16) {
  if (store.reduced) {
    tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: dur }, at)
  } else {
    tl.fromTo(sel, { yPercent: 118 }, { yPercent: 0, duration: dur, ease: 'power3.out' }, at)
  }
}

export function fadeOut(tl: gsap.core.Timeline, sel: string, at: number, dur = 0.14) {
  tl.to(sel, { opacity: 0, y: store.reduced ? 0 : -46, duration: dur, ease: 'power1.in' }, at)
}

export function fadeIn(tl: gsap.core.Timeline, sel: string, at: number, dur = 0.12) {
  tl.fromTo(
    sel,
    { opacity: 0, y: store.reduced ? 0 : 28 },
    { opacity: 1, y: 0, duration: dur, ease: 'power2.out' },
    at,
  )
}

/** Scrubbed numeric counter writing into an element's textContent. */
export function counter(
  tl: gsap.core.Timeline,
  el: HTMLElement | null,
  from: number,
  to: number,
  at: number,
  dur: number,
  format: (v: number) => string = (v) => String(Math.round(v)),
) {
  if (!el) return
  const o = { v: from }
  tl.to(
    o,
    {
      v: to,
      duration: dur,
      onUpdate: () => {
        el.textContent = format(o.v)
      },
    },
    at,
  )
}
