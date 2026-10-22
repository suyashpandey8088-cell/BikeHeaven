import { ChapterShell, maskIn, fadeOut, fadeIn, counter } from './useChapter'

export function Ch4Engine() {
  return (
    <ChapterShell
      index={3}
      height={560}
      id="heart"
      label="Chapter 04 — The Heart of the Machine"
      setup={(tl, el) => {
        maskIn(tl, '[data-fx="h1"]', 0.04, 0.14)
        fadeOut(tl, '[data-fx="h1"]', 0.34, 0.1)
        maskIn(tl, '[data-fx="h2"]', 0.4, 0.14)
        fadeOut(tl, '[data-fx="h2"]', 0.8, 0.12)
        fadeIn(tl, '[data-fx="panel"]', 0.3, 0.12)
        fadeOut(tl, '[data-fx="panel"]', 0.86, 0.12)
        fadeIn(tl, '[data-fx="flow"]', 0.42, 0.1)
        fadeOut(tl, '[data-fx="flow"]', 0.8, 0.1)
        const rows = el.querySelectorAll('[data-fx="num"]')
        const vals: [number, number, (v: number) => string][] = [
          [0, 999, (v) => String(Math.round(v))],
          [0, 217, (v) => String(Math.round(v))],
          [0, 118, (v) => String(Math.round(v))],
          [0, 12600, (v) => (Math.round(v / 100) / 10).toFixed(1) + 'K'],
          [0, 10900, (v) => (Math.round(v / 100) / 10).toFixed(1) + 'K'],
        ]
        rows.forEach((r, i) => {
          const [a, b, fmt] = vals[i] ?? [0, 0, String]
          counter(tl, r as HTMLElement, a, b, 0.34 + i * 0.06, 0.2, fmt)
        })
      }}
    >
      <i className="reg reg--tl" />
      <i className="reg reg--br" />
      <span className="vtext" style={{ left: 26, top: '50%', transform: 'translateY(-50%)' }}>
        INTAKE / COMPRESSION / COMBUSTION / EXHAUST
      </span>

      <h2 className="display display-xl" style={{ position: 'absolute', top: '16vh', left: 'clamp(16px,4vw,64px)', maxWidth: '10ch' }}>
        <span style={{ display: 'block', overflow: 'hidden' }}>
          <span data-fx="h1" style={{ display: 'block' }}>POWER IS NOT A NUMBER.</span>
        </span>
      </h2>
      <h2 className="display display-xl" style={{ position: 'absolute', top: '16vh', left: 'clamp(16px,4vw,64px)', maxWidth: '12ch' }}>
        <span style={{ display: 'block', overflow: 'hidden' }}>
          <span data-fx="h2" style={{ display: 'block' }}>
            IT IS A <span className="red">SYSTEM.</span>
          </span>
        </span>
      </h2>

      <div className="block" style={{ bottom: '14vh', left: 'clamp(16px,4vw,64px)', maxWidth: 300 }} data-fx="flow">
        <p className="mono mono-s" style={{ color: 'var(--ink-faint)' }}>
          <span className="acid">●</span> INTAKE CHARGE — NOSE → CYLINDERS<br />
          <span className="red">●</span> EXHAUST ENERGY → TAIL<br />
          SIMPLIFIED FLOW VISUALISATION
        </p>
      </div>

      <div
        className="dataif"
        data-fx="panel"
        style={{ position: 'absolute', right: 'clamp(16px,4vw,64px)', top: '50%', transform: 'translateY(-50%)', width: 'min(400px, 84vw)' }}
      >
        <div className="dataif__row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--hairline)' }}>
          <span className="k">POWERTRAIN — BH-04</span>
          <span className="mono mono-s" style={{ color: 'var(--acid)', textAlign: 'right' }}>CONCEPT VALUES</span>
        </div>
        <div className="dataif__row">
          <span className="k">Configuration</span>
          <span className="v">INLINE-FOUR</span>
        </div>
        <div className="dataif__row">
          <span className="k">Displacement</span>
          <span className="v"><span data-fx="num">0</span><small>CM³</small></span>
        </div>
        <div className="dataif__row">
          <span className="k">Peak power (sim)</span>
          <span className="v"><span data-fx="num">0</span><small>PS</small></span>
        </div>
        <div className="dataif__row">
          <span className="k">Peak torque (sim)</span>
          <span className="v"><span data-fx="num">0</span><small>NM</small></span>
        </div>
        <div className="dataif__row">
          <span className="k">Power peak</span>
          <span className="v"><span data-fx="num">0</span><small>RPM</small></span>
        </div>
        <div className="dataif__row">
          <span className="k">Torque peak</span>
          <span className="v"><span data-fx="num">0</span><small>RPM</small></span>
        </div>
        <div className="dataif__row">
          <span className="k">Cooling</span>
          <span className="v">LIQUID</span>
        </div>
        <div className="dataif__row">
          <span className="k">Valvetrain</span>
          <span className="v">DOHC · 16V</span>
        </div>
      </div>

      <p className="mono mono-s" style={{ position: 'absolute', bottom: 30, right: 'clamp(16px,4vw,64px)', color: 'var(--ink-faint)', textAlign: 'right' }}>
        APEX IS A FICTIONAL CONCEPT — ALL FIGURES ARE<br />
        SIMULATED DESIGN VALUES, NOT TESTED CLAIMS
      </p>
    </ChapterShell>
  )
}
