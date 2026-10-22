import { ChapterShell, maskIn, fadeOut, fadeIn, counter } from './useChapter'

export function Ch1Arrival() {
  return (
    <ChapterShell
      index={0}
      height={380}
      id="arrival"
      label="Chapter 01 — The Arrival"
      setup={(tl, el) => {
        fadeIn(tl, '[data-fx="kicker"]', 0.1, 0.08)
        fadeIn(tl, '[data-fx="micro"]', 0.16, 0.08)
        maskIn(tl, '[data-fx="l1"]', 0.4, 0.2)
        maskIn(tl, '[data-fx="l2"]', 0.54, 0.2)
        fadeIn(tl, '[data-fx="sub"]', 0.66, 0.12)
        fadeOut(tl, '[data-fx="hint"]', 0.05, 0.08)
        fadeOut(tl, '[data-fx="scene"]', 0.84, 0.16)
        counter(
          tl,
          el.querySelector('[data-fx="count"]'),
          0,
          100,
          0.04,
          0.62,
          (v) => String(Math.round(v)).padStart(3, '0'),
        )
      }}
    >
      <div className="gridlines" />
      <i className="reg reg--tl" />
      <i className="reg reg--tr" />
      <i className="reg reg--bl" />
      <i className="reg reg--br" />

      <div data-fx="scene" style={{ position: 'absolute', inset: 0 }}>
        <div className="block" style={{ top: 'calc(var(--nav-h) + 26px)', left: 'clamp(16px,3vw,48px)' }} data-fx="kicker">
          <div className="kicker mono">APEX-01 — CONCEPT DESIGN STUDY</div>
          <p className="mono mono-s" style={{ marginTop: 10, color: 'var(--ink-faint)' }}>
            18.5204° N / 73.8567° E — STUDIO 07<br />
            PERFORMANCE ENGINEERING LAB
          </p>
        </div>

        <div className="block mono mono-s" style={{ top: 'calc(var(--nav-h) + 26px)', right: 'clamp(16px,3vw,48px)', textAlign: 'right' }} data-fx="micro">
          REG · APEX/O1/26<br />
          UNIT 01 — REVEAL SEQUENCE<br />
          CLEARANCE: UNRESTRICTED
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -58%)',
            width: 'max(92vw, 900px)',
            textAlign: 'center',
          }}
        >
          <h1 className="display" style={{ fontSize: 'clamp(3.2rem, 11.5vw, 11rem)' }}>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span data-fx="l1" style={{ display: 'block' }}>ENGINEERED</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span data-fx="l1" style={{ display: 'block' }}>TO <em className="acid" style={{ fontStyle: 'normal' }}>DEFY.</em></span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span data-fx="l2" className="outline" style={{ display: 'block' }}>BUILT FOR THE EDGE.</span>
            </span>
          </h1>
          <p className="body-copy" data-fx="sub" style={{ margin: '26px auto 0' }}>
            A concept superbike, studied like an instrument. Every millimetre has a purpose —
            scroll, and the light will show you where.
          </p>
        </div>

        <div className="block" style={{ bottom: 34, left: 'clamp(16px,3vw,48px)' }}>
          <p className="mono mono-s" style={{ color: 'var(--ink-faint)' }}>
            FRAGMENTS ONLY — NOSE / EDGE / LIGHT<br />
            ASSEMBLY PENDING
          </p>
        </div>

        <div className="block mono mono-s" style={{ bottom: 34, right: 'clamp(16px,3vw,48px)', textAlign: 'right' }}>
          REVEAL <span className="acid" data-fx="count" style={{ display: 'inline-block', minWidth: '3ch' }}>000</span>%
        </div>

        <div className="scroll-hint" data-fx="hint">
          <span className="mono mono-s">SCROLL TO IGNITE</span>
          <span className="line" />
        </div>
      </div>
    </ChapterShell>
  )
}
