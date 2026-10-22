import { ChapterShell, maskIn, fadeOut, fadeIn } from './useChapter'
import { store } from '../lib/store'

const FINISHES = [
  { id: 'F-01', name: 'DEEP GLOSS COAT', note: 'Multi-layer paint, hand-flowed concept finish.' },
  { id: 'F-02', name: 'MATTE COMPOSITE', note: 'Weight-graded body panels, low-reflex skin.' },
  { id: 'F-03', name: 'MACHINED ALLOY', note: 'Structural metal left honest — frames, mounts, pivots.' },
  { id: 'F-04', name: 'BRUSHED SYSTEM', note: 'Exhaust tract finished as one continuous line.' },
]

export function Ch7Material({
  colorway,
  onColorway,
}: {
  colorway: string
  onColorway?: (cw: 'OBSIDION' | 'ACID' | 'TITAN') => void
}) {
  return (
    <ChapterShell
      index={6}
      height={440}
      id="material"
      label="Chapter 07 — Light, Material, Identity"
      setup={(tl) => {
        maskIn(tl, '[data-fx="h1"]', 0.04, 0.14)
        fadeOut(tl, '[data-fx="h1"]', 0.36, 0.1)
        maskIn(tl, '[data-fx="h2"]', 0.42, 0.14)
        fadeOut(tl, '[data-fx="h2"]', 0.78, 0.1)
        FINISHES.forEach((f, i) => {
          fadeIn(tl, `[data-fx="f${i}"]`, 0.1 + i * 0.14, 0.08)
          fadeOut(tl, `[data-fx="f${i}"]`, 0.18 + i * 0.14, 0.06)
        })
        fadeIn(tl, '[data-fx="cw"]', 0.58, 0.12)
      }}
    >
      <i className="reg reg--tr" />
      <i className="reg reg--bl" />
      <span className="vtext" style={{ left: 26, top: '50%', transform: 'translateY(-50%)' }}>
        LIGHT / SURFACE / IDENTITY
      </span>

      <h2 className="display display-xl" style={{ position: 'absolute', top: '15vh', left: 'clamp(16px,4vw,64px)', maxWidth: '11ch' }}>
        <span style={{ display: 'block', overflow: 'hidden' }}>
          <span data-fx="h1" style={{ display: 'block' }}>ENGINEERING YOU CAN <span className="acid">SEE.</span></span>
        </span>
      </h2>
      <h2 className="display display-xl" style={{ position: 'absolute', top: '15vh', left: 'clamp(16px,4vw,64px)', maxWidth: '11ch' }}>
        <span style={{ display: 'block', overflow: 'hidden' }}>
          <span data-fx="h2" className="outline" style={{ display: 'block' }}>DETAILS YOU CAN FEEL.</span>
        </span>
      </h2>

      {FINISHES.map((f, i) => (
        <div
          key={f.id}
          data-fx={`f${i}`}
          className="block"
          style={{
            top: `${24 + i * 16}vh`,
            right: 'clamp(16px, 5vw, 90px)',
            textAlign: 'right',
            opacity: 0,
          }}
        >
          <div className="mono mono-s acid">{f.id}</div>
          <div className="display" style={{ fontSize: 'clamp(1.2rem, 2.6vw, 2.2rem)', marginTop: 4 }}>{f.name}</div>
          <p className="mono mono-s" style={{ color: 'var(--ink-faint)', marginTop: 6 }}>{f.note}</p>
        </div>
      ))}

      <div
        data-fx="cw"
        className="block hot"
        style={{ bottom: '10vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: 0 }}
      >
        <div className="mono mono-s" style={{ color: 'var(--ink-faint)', marginBottom: 12 }}>
          CONCEPT FINISH — RENDERED IN REAL TIME
        </div>
        <div className="colorways" role="group" aria-label="Colourway">
          {(['OBSIDION', 'ACID', 'TITAN'] as const).map((cw) => (
            <button
              key={cw}
              type="button"
              className="cw-btn"
              data-cw={cw}
              data-hot
              aria-pressed={colorway === cw}
              onClick={() => onColorway?.(cw)}
            >
              <i aria-hidden="true" />
              {cw}
            </button>
          ))}
        </div>
      </div>
    </ChapterShell>
  )
}
