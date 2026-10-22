import { ChapterShell, maskIn, fadeOut, fadeIn, counter } from './useChapter'

export function Ch3Explode() {
  return (
    <ChapterShell
      index={2}
      height={760}
      id="anatomy"
      label="Chapter 03 — The Machine Comes Apart"
      setup={(tl, el) => {
        maskIn(tl, '[data-fx="h1"]', 0.03, 0.12)
        fadeIn(tl, '[data-fx="meta"]', 0.06, 0.1)
        maskIn(tl, '[data-fx="h2"]', 0.5, 0.14)
        fadeOut(tl, '[data-fx="h1"]', 0.4, 0.1)
        fadeOut(tl, '[data-fx="h2"]', 0.88, 0.1)
        counter(
          tl,
          el.querySelector('[data-fx="count"]'),
          0,
          100,
          0.05,
          0.7,
          (v) => String(Math.round(v)).padStart(3, '0'),
        )
        // phase chips
        fadeIn(tl, '[data-fx="p1"]', 0.07, 0.08)
        fadeOut(tl, '[data-fx="p1"]', 0.3, 0.08)
        fadeIn(tl, '[data-fx="p2"]', 0.32, 0.08)
        fadeOut(tl, '[data-fx="p2"]', 0.56, 0.08)
        fadeIn(tl, '[data-fx="p3"]', 0.58, 0.08)
        fadeOut(tl, '[data-fx="p3"]', 0.86, 0.08)
      }}
    >
      <div className="gridlines" />
      <i className="reg reg--tr" />
      <i className="reg reg--bl" />

      <div className="block" style={{ top: 'calc(var(--nav-h) + 24px)', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <h2 className="display display-l">
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="h1" style={{ display: 'block' }}>NOTHING HERE IS <span className="acid">ACCIDENTAL.</span></span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="h2" className="outline" style={{ display: 'block' }}>EVERY PART EARNS ITS PLACE.</span>
          </span>
        </h2>
        <p className="mono mono-s" data-fx="meta" style={{ marginTop: 16, color: 'var(--ink-faint)' }}>
          FULL TEARDOWN — 11 COMPONENT GROUPS
        </p>
      </div>

      <div className="block" style={{ bottom: 32, left: 'clamp(16px,3vw,48px)' }}>
        <p className="mono mono-s" style={{ color: 'var(--ink-faint)' }}>
          DISASSEMBLY <span className="acid" data-fx="count" style={{ display: 'inline-block', minWidth: '3ch' }}>000</span>%
        </p>
        <p className="mono mono-s" style={{ marginTop: 8, color: 'var(--ink-faint)' }}>
          ↑ SCROLL BACK — THE SEQUENCE REVERSES
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 32,
          right: 'clamp(16px,3vw,48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <span className="chip chip--acid" data-fx="p1">PHASE 01 — SHELL SEPARATION</span>
        <span className="chip" data-fx="p2">PHASE 02 — RUNNING GEAR</span>
        <span className="chip" data-fx="p3">PHASE 03 — POWERTRAIN &amp; FRAME</span>
      </div>
    </ChapterShell>
  )
}
