import { ChapterShell, maskIn, fadeOut, fadeIn } from './useChapter'

function Scene({
  fx,
  letter,
  headline,
  copy,
  chips,
  style,
}: {
  fx: string
  letter: string
  headline: React.ReactNode
  copy: string
  chips: string[]
  style: React.CSSProperties
}) {
  return (
    <div data-fx={fx} style={{ position: 'absolute', inset: 0 }}>
      <div className="block" style={style}>
        <div className="kicker mono">SCENE {letter} — CONTROL</div>
        <h2 className="display" style={{ fontSize: 'clamp(2.2rem, 6vw, 5.2rem)', marginTop: 12 }}>
          {headline}
        </h2>
        <p className="body-copy" style={{ marginTop: 16 }}>{copy}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Ch5Control() {
  return (
    <ChapterShell
      index={4}
      height={680}
      id="control"
      label="Chapter 05 — The Anatomy of Control"
      setup={(tl) => {
        const groups = ['a', 'b', 'c', 'd']
        groups.forEach((g, i) => {
          const start = i * 0.25
          fadeIn(tl, `[data-fx="s-${g}"]`, start + 0.02, 0.08)
          maskIn(tl, `[data-fx="s-${g}"] .display`, start + 0.03, 0.1)
          fadeOut(tl, `[data-fx="s-${g}"]`, start + 0.21, 0.06)
          tl.fromTo(`[data-fx="tab-${g}"]`, { opacity: 0.25 }, { opacity: 1, duration: 0.03 }, start)
          if (i < 3) tl.to(`[data-fx="tab-${g}"]`, { opacity: 0.25, duration: 0.03 }, start + 0.25)
        })
        fadeIn(tl, '[data-fx="measure"]', 0.79, 0.08)
        fadeOut(tl, '[data-fx="measure"]', 0.96, 0.06)
      }}
    >
      <i className="reg reg--tl" />
      <i className="reg reg--br" />

      <Scene
        fx="s-a"
        letter="A"
        headline={<>CONTROL THE <span className="acid">CHAOS.</span></>}
        copy="Every surface the road attacks first. The inverted fork swallows imperfections and hands the chassis a clean, predictable contact patch."
        chips={['43 MM USD FORK', 'ELECTRONIC DAMPING — CONCEPT']}
        style={{ left: 'clamp(16px,4vw,64px)', top: '18vh' }}
      />
      <Scene
        fx="s-b"
        letter="B"
        headline={<>PRECISION UNDER <span className="red">PRESSURE.</span></>}
        copy="Force becomes heat, heat becomes control. Full-floating discs and monobloc calipers turn 300 km/h of intent into a number measured in metres."
        chips={['2×330 MM DISCS — CONCEPT', 'RADIAL MONOBLOC']}
        style={{ right: 'clamp(16px,4vw,64px)', top: '20vh', textAlign: 'right' }}
      />
      <Scene
        fx="s-c"
        letter="C"
        headline={<>THE ROAD IS THE <span className="acid">CONNECTION.</span></>}
        copy="Two postcards of rubber are all that truly touch the world. Load shifts, grip migrates, and the tyre tells the chassis the truth about the surface."
        chips={['120/70 ZR17', '200/55 ZR17', 'CONTACT VISUALISATION']}
        style={{ left: 'clamp(16px,4vw,64px)', bottom: '20vh' }}
      />
      <Scene
        fx="s-d"
        letter="D"
        headline={<>BALANCE IS <span className="outline-acid">ENGINEERED.</span></>}
        copy="Mass centralised around the crank. Geometry chosen for stability at speed without murdering the corner entry."
        chips={['52/48 DISTRIBUTION', '1,418 MM WHEELBASE']}
        style={{ right: 'clamp(16px,4vw,64px)', bottom: '22vh', textAlign: 'right' }}
      />

      {/* measurement overlay — scene D */}
      <svg className="measure" data-fx="measure" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <line className="ghost" x1="360" y1="700" x2="1080" y2="700" strokeDasharray="6 6" />
        <line x1="360" y1="688" x2="360" y2="712" />
        <line x1="1080" y1="688" x2="1080" y2="712" />
        <text x="700" y="686" textAnchor="middle">WHEELBASE 1,418 MM</text>
        <line className="ghost" x1="360" y1="640" x2="360" y2="700" />
        <line className="ghost" x1="1080" y1="640" x2="1080" y2="700" />
        <text x="360" y="632" textAnchor="middle">52%</text>
        <text x="1080" y="632" textAnchor="middle">48%</text>
        <text x="720" y="764" textAnchor="middle" fill="#B9C0C8" opacity="0.7">MASS DISTRIBUTION — UNLADEN, CONCEPT TARGET</text>
      </svg>

      <div className="scene-tabs">
        {(['A', 'B', 'C', 'D'] as const).map((l, i) => (
          <span key={l} className="scene-tab" data-fx={`tab-${l.toLowerCase()}`}>
            <span className="bar" />
            SCENE {l}
          </span>
        ))}
      </div>
    </ChapterShell>
  )
}
