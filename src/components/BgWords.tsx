/**
 * APEX — ghost typography behind the canvas.
 * The canvas is transparent, so huge outline words printed on a layer
 * beneath it are physically occluded by the motorcycle.
 */
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { CHAPTERS } from '../lib/store'
import { bgWordForChapter } from '../lib/story'

export function BgWords({ sections }: { sections: React.MutableRefObject<(HTMLElement | null)[]> }) {
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = wrap.current
    if (!root) return
    const ctx = gsap.context(() => {
      // query sections directly: child effects run before the parent fills the ref
      const els = Array.from(document.querySelectorAll<HTMLElement>('.chapter'))
      sections.current = els
      CHAPTERS.forEach((_, i) => {
        const el = els[i]
        const word = root.querySelector<HTMLElement>(`[data-bg="${i}"]`)
        if (!el || !word) return
        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.5,
            },
          })
          .fromTo(
            word,
            { opacity: 0, yPercent: 16 },
            { opacity: 0.16, yPercent: -16, duration: 1, ease: 'none' },
          )
      })
    }, root)
    return () => ctx.revert()
  }, [sections])

  return (
    <div id="bg-layer" ref={wrap} aria-hidden="true">
      {CHAPTERS.map((c, i) => (
        <div
          key={c.id}
          data-bg={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            className="display outline outline-faint"
            style={{ fontSize: 'clamp(8rem, 30vw, 34rem)', letterSpacing: '0.01em' }}
          >
            {bgWordForChapter(i)}
          </span>
        </div>
      ))}
    </div>
  )
}
