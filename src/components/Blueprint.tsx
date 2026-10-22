import { useEffect, useRef } from 'react'
import { SPECS } from '../lib/story'
import { PART_SPECS } from '../scene/bikeGeometry'

/**
 * APEX — technical blueprint view. A real, fully implemented specification
 * sheet + component manifest for the concept (opened from CH08 + nav).
 */
export function Blueprint({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prevActive = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      prevActive?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div id="blueprint" className="open" role="dialog" aria-modal="true" aria-label="APEX technical blueprint">
      <div className="bp__scrim" onClick={onClose} aria-hidden="true" />
      <div className="bp__panel" ref={panel}>
        <div className="bp__head">
          <div>
            <p className="mono mono-s" style={{ color: 'var(--acid)', marginBottom: 10 }}>
              APEX-01 / TECHNICAL BLUEPRINT / CONCEPT STUDY
            </p>
            <h2 className="bp__title">
              THE ANATOMY<br />
              <span className="outline">OF A SUPERBIKE.</span>
            </h2>
          </div>
          <button
            ref={closeBtn}
            type="button"
            className="icon-btn"
            data-hot
            onClick={onClose}
            aria-label="Close technical blueprint"
            style={{ flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden="true">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>
        </div>

        <div className="bp__section">Simulated performance data</div>
        <div className="bp__grid">
          {SPECS.map((s) => (
            <div key={s.label} className="bp__cell">
              <span className="k">{s.label}</span>
              <span className="v">
                {s.value}
                <small>{s.unit}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="bp__section">Component manifest</div>
        <div className="bp__parts">
          {PART_SPECS.map((p) => (
            <div key={p.id} className="bp__part">
              <span className="code">{p.code}</span>
              <div>
                <div className="name">{p.label}</div>
                <p className="desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bp__foot">
          <p className="mono mono-s">
            APEX IS A FICTIONAL CONCEPT MOTORCYCLE. EVERY VALUE ON THIS SHEET IS A SIMULATED
            DESIGN TARGET — NOT A VERIFIED OR TESTED CLAIM.
          </p>
          <p className="mono mono-s">DOC · APEX/BP-01 · REV 26/10</p>
        </div>
      </div>
    </div>
  )
}
