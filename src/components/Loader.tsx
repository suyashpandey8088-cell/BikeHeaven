import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const STEPS = ['CALIBRATING STAGE', 'BUILDING CHASSIS', 'CHARGING SYSTEMS', 'IGNITION']

export function Loader({ ready }: { ready: boolean }) {
  const el = useRef<HTMLDivElement>(null)
  const barFill = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [gone, setGone] = useState(false)

  // honest staged init — steps track real module/canvas readiness
  useEffect(() => {
    let s = 0
    const id = window.setInterval(() => {
      s = Math.min(s + 1, ready ? 4 : 2)
      setStep(s)
      if (barFill.current) {
        gsap.to(barFill.current, { scaleX: s / 4, duration: 0.45, ease: 'power2.out' })
      }
      if (s >= 4) window.clearInterval(id)
    }, 420)
    return () => window.clearInterval(id)
  }, [ready])

  useEffect(() => {
    if (!ready || step < 4) return
    const t = window.setTimeout(() => {
      if (el.current) {
        gsap.to(el.current, {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.inOut',
          onComplete: () => setGone(true),
        })
      } else {
        setGone(true)
      }
    }, 350)
    return () => window.clearTimeout(t)
  }, [ready, step])

  // failsafe: never trap the visitor on the loader
  useEffect(() => {
    const t = window.setTimeout(() => setGone(true), 9000)
    return () => window.clearTimeout(t)
  }, [])

  if (gone) return null

  return (
    <div id="loader" ref={el} role="status" aria-label="Loading the APEX experience">
      <div className="display">
        APEX<em>.</em>
      </div>
      <div className="mono mono-s" style={{ color: 'var(--ink-faint)', letterSpacing: '0.4em' }}>
        THE ANATOMY OF A SUPERBIKE
      </div>
      <div className="loader__bar" aria-hidden="true">
        <i ref={barFill} />
      </div>
      <div className="loader__steps">
        {STEPS.map((s, i) => (
          <span key={s} className={i < step ? 'on' : ''}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}
