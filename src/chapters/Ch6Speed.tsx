import { ChapterShell, fadeOut, fadeIn, counter } from './useChapter'

interface StatDef {
  fx: string
  label: string
  to: number
  format: (v: number) => string
  unit: string
  note: string
  side: 'left' | 'right'
  at: number
}

const STATS: StatDef[] = [
  {
    fx: 'power', label: 'PEAK POWER', to: 217, format: (v) => String(Math.round(v)),
    unit: 'PS @ 12,600 RPM', note: 'Simulated output of the concept inline-four — the headline of the study, not a dyno sheet.',
    side: 'left', at: 0.02,
  },
  {
    fx: 'torque', label: 'MAXIMUM TORQUE', to: 118, format: (v) => String(Math.round(v)),
    unit: 'NM @ 10,900 RPM', note: 'Broad and flat. Torque you can lean on from the apex out.',
    side: 'right', at: 0.19,
  },
  {
    fx: 'accel', label: '0–100 KM/H', to: 2.9, format: (v) => v.toFixed(1),
    unit: 'SECONDS', note: 'Simulated target under ideal launch conditions. A design goal, not a measured run.',
    side: 'left', at: 0.36,
  },
  {
    fx: 'ratio', label: 'POWER-TO-WEIGHT', to: 1.16, format: (v) => v.toFixed(2),
    unit: 'PS / KG', note: '187 kg of mass against 217 PS of intent. The ratio that decides how a concept feels.',
    side: 'right', at: 0.53,
  },
]

export function Ch6Speed() {
  return (
    <ChapterShell
      index={5}
      height={520}
      id="speed"
      label="Chapter 06 — Speed, Measured"
      setup={(tl, el) => {
        STATS.forEach((s) => {
          fadeIn(tl, `[data-fx="${s.fx}"]`, s.at, 0.1)
          const num = el.querySelector(`[data-fx="${s.fx}-num"]`)
          if (num) counter(tl, num as HTMLElement, 0, s.to, s.at + 0.02, 0.16, s.format)
          fadeOut(tl, `[data-fx="${s.fx}"]`, s.at + 0.15, 0.05)
        })
        fadeIn(tl, '[data-fx="mass"]', 0.7, 0.1)
        const m = el.querySelector('[data-fx="mass-num"]')
        if (m) counter(tl, m as HTMLElement, 0, 187, 0.72, 0.16, (v) => String(Math.round(v)))
        fadeIn(tl, '[data-fx="grid"]', 0.78, 0.12)
      }}
    >
      <div className="gridlines" style={{ opacity: 0.14 }} />
      <div className="block" style={{ top: 'calc(var(--nav-h) + 24px)', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div className="kicker mono">06 · SPEED, MEASURED</div>
      </div>
      <p className="mono mono-s" style={{ position: 'absolute', top: 'calc(var(--nav-h) + 48px)', left: '50%', transform: 'translateX(-50%)', color: 'var(--ink-faint)', textAlign: 'center' }}>
        CONCEPT SPECIFICATIONS — SIMULATED DESIGN VALUES
      </p>

      {STATS.map((s) => (
        <div
          key={s.fx}
          className={`stat-block${s.side === 'right' ? ' stat-block--right' : ''}`}
          data-fx={s.fx}
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            [s.side === 'left' ? 'left' : 'right']: 'clamp(16px, 6vw, 110px)',
          } as React.CSSProperties}
        >
          <div className="mono mono-s" style={{ color: 'var(--ink-faint)', marginBottom: 8 }}>{s.label}</div>
          <div className="value">
            <span data-fx={`${s.fx}-num`}>0</span>
          </div>
          <div className="unit" style={{ marginTop: 6 }}>{s.unit}</div>
          <p className="note">{s.note}</p>
        </div>
      ))}

      <div
        className="stat-block"
        data-fx="mass"
        style={{ top: '13vh', left: 'clamp(16px, 6vw, 110px)' }}
      >
        <div className="mono mono-s" style={{ color: 'var(--ink-faint)', marginBottom: 8 }}>KERB MASS (SIM)</div>
        <div className="value" style={{ fontSize: 'clamp(3.4rem, 10vw, 8.6rem)' }}>
          <span data-fx="mass-num">0</span>
        </div>
        <div className="unit" style={{ marginTop: 6 }}>KG, ALL FLUIDS</div>
      </div>

      <div className="block" data-fx="grid" style={{ bottom: '7vh', left: '50%', transform: 'translateX(-50%)', width: 'min(980px, 92vw)' }}>
        <div className="mono mono-s" style={{ color: 'var(--acid)', marginBottom: 10 }}>ENGINEERING DATA — APEX-01 CONCEPT</div>
        <div className="datagrid">
          <div className="datagrid__row">
            <span className="k">Frame</span>
            <span className="v">TWIN-SPAR <small>ALUMINIUM</small></span>
            <span className="n">Engine as a fully stressed member.</span>
          </div>
          <div className="datagrid__row">
            <span className="k">Front brakes</span>
            <span className="v">2×330 <small>MM DISCS</small></span>
            <span className="n">Radial monobloc calipers — concept specification.</span>
          </div>
          <div className="datagrid__row">
            <span className="k">Suspension</span>
            <span className="v">43 / 120 <small>MM</small></span>
            <span className="n">Inverted fork / rear shock, fully adjustable.</span>
          </div>
          <div className="datagrid__row">
            <span className="k">Wheelbase</span>
            <span className="v">1,418 <small>MM</small></span>
            <span className="n">Stability-biased geometry, unladen.</span>
          </div>
          <div className="datagrid__row">
            <span className="k">Weight distribution</span>
            <span className="v">52 / 48 <small>% F/R</small></span>
            <span className="n">Engineered balance around the crank axis.</span>
          </div>
          <div className="datagrid__row">
            <span className="k">Top speed</span>
            <span className="v">299 <small>KM/H ELECTRONIC</small></span>
            <span className="n">Concept limiter — not a tested claim.</span>
          </div>
        </div>
      </div>
    </ChapterShell>
  )
}
