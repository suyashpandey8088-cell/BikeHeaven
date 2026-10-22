import { ChapterShell, maskIn, fadeOut, fadeIn } from './useChapter'

export function Ch8Reveal({
  onRestart,
  onBlueprint,
}: {
  onRestart: () => void
  onBlueprint: () => void
}) {
  return (
    <ChapterShell
      index={7}
      height={420}
      id="reveal"
      label="Chapter 08 — The Full Reveal"
      setup={(tl) => {
        maskIn(tl, '[data-fx="apex"]', 0.06, 0.18)
        fadeOut(tl, '[data-fx="apex"]', 0.3, 0.12)
        maskIn(tl, '[data-fx="tag"]', 0.34, 0.14)
        fadeIn(tl, '[data-fx="copy"]', 0.44, 0.12)
        fadeIn(tl, '[data-fx="cta"]', 0.56, 0.14)
        fadeIn(tl, '[data-fx="foot"]', 0.78, 0.12)
      }}
    >
      <div className="gridlines" style={{ opacity: 0.18 }} />
      <i className="reg reg--tl" />
      <i className="reg reg--tr" />
      <i className="reg reg--bl" />
      <i className="reg reg--br" />

      <h2
        className="display mega"
        style={{
          position: 'absolute',
          top: '47%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{ display: 'block', overflow: 'hidden' }}>
          <span data-fx="apex" style={{ display: 'block', whiteSpace: 'nowrap' }}>
            APEX<span className="acid">.</span>
          </span>
        </span>
      </h2>

      <div
        className="block"
        style={{ top: '14vh', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: 'min(760px, 92vw)' }}
      >
        <h3 className="display display-l">
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span data-fx="tag" style={{ display: 'block' }}>BUILT <span className="outline-acid">BEYOND</span> ORDINARY.</span>
          </span>
        </h3>
        <p className="body-copy" data-fx="copy" style={{ margin: '22px auto 0' }}>
          Engineering gives it intent. Control makes it usable. Design makes it desired.
          Performance is simply what happens when all three agree — a concept, studied down to
          the last millimetre, then rebuilt in front of you.
        </p>
        <div data-fx="cta" style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 34, flexWrap: 'wrap', opacity: 0 }}>
          <button type="button" className="cta" data-hot onClick={onRestart}>
            EXPLORE THE MACHINE AGAIN
            <span aria-hidden="true">↑</span>
          </button>
          <button type="button" className="cta cta--ghost" data-hot onClick={onBlueprint}>
            VIEW THE TECHNICAL BLUEPRINT
          </button>
        </div>
      </div>

      <div
        data-fx="foot"
        style={{
          position: 'absolute',
          bottom: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: 0,
        }}
      >
        <p className="mono mono-s" style={{ color: 'var(--ink-faint)' }}>
          APEX-01 — A FICTIONAL CONCEPT STUDY · ALL FIGURES SIMULATED<br />
          BUILT WITH WEBGL · THE MOTORCYCLE IS THE PRODUCT · THE SCROLL IS THE CAMERA
        </p>
      </div>
    </ChapterShell>
  )
}
