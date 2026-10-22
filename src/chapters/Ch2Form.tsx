import { ChapterShell, maskIn, fadeOut, fadeIn } from './useChapter'

export function Ch2Form() {
  return (
    <ChapterShell
      index={1}
      height={480}
      id="form"
      label="Chapter 02 — Form in Motion"
      setup={(tl) => {
        // statement 1
        maskIn(tl, '[data-fx="s1"]', 0.03, 0.14)
        fadeIn(tl, '[data-fx="c1"]', 0.08, 0.1)
        fadeOut(tl, '[data-fx="g1"]', 0.26, 0.1)
        // statement 2
        maskIn(tl, '[data-fx="s2"]', 0.36, 0.14)
        fadeIn(tl, '[data-fx="c2"]', 0.41, 0.1)
        fadeOut(tl, '[data-fx="g2"]', 0.58, 0.1)
        // statement 3
        maskIn(tl, '[data-fx="s3"]', 0.66, 0.16)
        fadeIn(tl, '[data-fx="c3"]', 0.72, 0.1)
        fadeOut(tl, '[data-fx="g3"]', 0.9, 0.08)
      }}
    >
      <i className="reg reg--tl" />
      <i className="reg reg--br" />
      <span className="vtext" style={{ right: 26, top: '50%', transform: 'translateY(-50%)' }}>
        SURFACE / VOLUME / AERODYNAMICS
      </span>

      {/* statement 1 */}
      <div data-fx="g1" style={{ position: 'absolute', inset: 0 }}>
        <h2 className="display display-xl" style={{ position: 'absolute', top: '16vh', left: 'clamp(16px,4vw,64px)' }}>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="s1" style={{ display: 'block' }}>FORM</span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="s1" style={{ display: 'block' }}>FOLLOWS <span className="acid">FORCE.</span></span>
          </span>
        </h2>
        <div className="block" style={{ right: 'clamp(16px,4vw,64px)', bottom: '16vh', textAlign: 'right' }} data-fx="c1">
          <div className="kicker mono" style={{ justifyContent: 'flex-end' }}>02 · EXTERIOR</div>
          <p className="body-copy" style={{ margin: '14px 0 0 auto' }}>
            Nothing on the APEX is styled — it is resolved. Pressure-driven surfaces wrap the
            mechanical core with no line that air did not ask for.
          </p>
        </div>
      </div>

      {/* statement 2 */}
      <div data-fx="g2" style={{ position: 'absolute', inset: 0 }}>
        <h2 className="display display-xl" style={{ position: 'absolute', bottom: '18vh', right: 'clamp(16px,4vw,64px)', textAlign: 'right' }}>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="s2" style={{ display: 'block' }}>SCULPTED</span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="s2" style={{ display: 'block' }}>BY <span className="outline-acid">AIR.</span></span>
          </span>
        </h2>
        <div className="block" style={{ top: '20vh', left: 'clamp(16px,4vw,64px)' }} data-fx="c2">
          <div className="kicker mono">AERO / BH-03</div>
          <p className="body-copy" style={{ marginTop: 14 }}>
            Frontal ducts feed the radiator. Winglets trade drag for front-axle load. The
            tail carries the exhaust’s pressure wake off the rear tyre.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <span className="chip">DOWNFORCE ELEMENTS</span>
            <span className="chip chip--acid">CONCEPT</span>
          </div>
        </div>
      </div>

      {/* statement 3 */}
      <div data-fx="g3" style={{ position: 'absolute', inset: 0 }}>
        <h2
          className="display"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '20vh',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(2.2rem, 6.5vw, 5.6rem)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="s3" style={{ display: 'block' }}>EVERY LINE HAS A <span className="acid">REASON.</span></span>
          </span>
        </h2>
        <div className="block" data-fx="c3" style={{ left: 'clamp(16px,4vw,64px)', top: '16vh' }}>
          <div className="kicker mono">02 · GEOMETRY</div>
          <p className="body-copy" style={{ marginTop: 14 }}>
            Steering geometry, swingarm pivot, seat height — numbers chosen so the machine
            holds its line at speed and still falls into the corner when you ask.
          </p>
        </div>
      </div>
    </ChapterShell>
  )
}
