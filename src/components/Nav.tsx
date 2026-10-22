import { useEffect, useRef } from 'react'
import { CHAPTERS, store } from '../lib/store'
import { scrollToY, scrollToChapter } from '../lib/scroll'
import type { EngineAudio } from '../lib/audio'

const LINKS: { label: string; chapter: number }[] = [
  { label: 'ANATOMY', chapter: 2 },
  { label: 'ENGINEERING', chapter: 3 },
  { label: 'PERFORMANCE', chapter: 5 },
]

export function Nav({
  active,
  sections,
  muted,
  onToggleMute,
  audio,
  onBlueprint,
}: {
  active: number
  sections: React.MutableRefObject<(HTMLElement | null)[]>
  muted: boolean
  onToggleMute: () => void
  audio: React.MutableRefObject<EngineAudio | null>
  onBlueprint: () => void
}) {
  const pct = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const navEl = useRef<HTMLElement>(null)

  // nav reacts to global scroll (written directly — no per-frame react state)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const g = store.global
        if (bar.current) bar.current.style.transform = `scaleX(${g})`
        if (pct.current) pct.current.innerHTML = `<b>${String(Math.round(g * 100)).padStart(3, '0')}</b> / 100`
        navEl.current?.classList.toggle('dense', g > 0.015)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div id="scroll-progress" ref={bar} aria-hidden="true" />
      <nav id="nav" ref={navEl} aria-label="Primary">
        <button
          type="button"
          className="nav__brand"
          data-hot
          onClick={() => scrollToY(0)}
          aria-label="APEX — back to the beginning"
        >
          <span className="nav__mark">
            APEX<em>.</em>
          </span>
          <span className="nav__sub">ANATOMY OF A SUPERBIKE</span>
        </button>

        <div className="nav__links">
          {LINKS.map((l) => (
            <button
              key={l.label}
              type="button"
              className="nav__link"
              data-hot
              onClick={() => scrollToChapter(l.chapter, sections.current)}
            >
              {l.label}
            </button>
          ))}
          <button type="button" className="nav__link" data-hot onClick={onBlueprint}>
            SPECIFICATIONS
          </button>
        </div>

        <div className="nav__right">
          <span className="nav__progress" aria-hidden="true">
            <span ref={pct}>
              <b>000</b> / 100
            </span>
          </span>
          <button
            type="button"
            className="icon-btn"
            data-hot
            aria-pressed={!muted}
            aria-label={muted ? 'Enable sound' : 'Mute sound'}
            title={muted ? 'Sound off' : 'Sound on'}
            onClick={onToggleMute}
          >
            {muted ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <line x1="22" y1="9" x2="16" y2="15" />
                <line x1="16" y1="9" x2="22" y2="15" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9.5 9.5 0 0 1 0 13" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <RailNav active={active} sections={sections} />
    </>
  )
}

function RailNav({
  active,
  sections,
}: {
  active: number
  sections: React.MutableRefObject<(HTMLElement | null)[]>
}) {
  return (
    <aside id="rail" aria-label="Chapters">
      {CHAPTERS.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className={`rail__btn${i === active ? ' active' : ''}`}
          data-hot
          onClick={() => scrollToChapter(i, sections.current)}
          aria-label={`Chapter ${c.n} — ${c.title}`}
          aria-current={i === active ? 'true' : undefined}
        >
          <span className="rail__label">
            {c.n} · {c.short}
          </span>
          <span className="tick" aria-hidden="true" />
        </button>
      ))}
    </aside>
  )
}

void ({} as typeof store)
