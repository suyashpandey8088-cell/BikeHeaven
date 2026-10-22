import { useEffect, useRef } from 'react'
import { store } from '../lib/store'

/** Desktop-only technical reticle. Simplified away on touch + reduced motion. */
export function Cursor() {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (store.reduced) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const node = el.current
    if (!node) return

    document.body.classList.add('custom-cursor')
    node.style.display = 'block'

    let raf = 0
    let x = -100
    let y = -100
    let cx = -100
    let cy = -100
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const tick = () => {
      cx += (x - cx) * 0.35
      cy += (y - cy) * 0.35
      node.style.transform = `translate(${cx}px, ${cy}px)`
      if (Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }
    const over = (e: Event) => {
      const t = e.target as HTMLElement
      node.classList.toggle('hot', !!t.closest?.('[data-hot], a, button'))
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    return () => {
      document.body.classList.remove('custom-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div id="cursor" ref={el} aria-hidden="true">
      <span className="ring" />
      <span className="cross" />
    </div>
  )
}
