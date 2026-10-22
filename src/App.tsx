import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { store, subscribe, emit, type Colorway } from './lib/store'
import { initScroll, destroyScroll, scrollToY, ScrollTrigger } from './lib/scroll'
import { createEngineAudio, type EngineAudio } from './lib/audio'
import { CanvasStage } from './scene/CanvasStage'
import { BgWords } from './components/BgWords'
import { Nav } from './components/Nav'
import { Loader } from './components/Loader'
import { Cursor } from './components/Cursor'
import { Blueprint } from './components/Blueprint'
import { Ch1Arrival } from './chapters/Ch1Arrival'
import { Ch2Form } from './chapters/Ch2Form'
import { Ch3Explode } from './chapters/Ch3Explode'
import { Ch4Engine } from './chapters/Ch4Engine'
import { Ch5Control } from './chapters/Ch5Control'
import { Ch6Speed } from './chapters/Ch6Speed'
import { Ch7Material } from './chapters/Ch7Material'
import { Ch8Reveal } from './chapters/Ch8Reveal'

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const sections = useRef<(HTMLElement | null)[]>([])
  const audio = useRef<EngineAudio | null>(null)
  const [blueprintOpen, setBlueprintOpen] = useState(false)
  const [muted, setMuted] = useState(true)
  const [colorway, setColorway] = useState<Colorway>('OBSIDION')
  const active = useSyncExternalStore(subscribe, () => store.active)
  const ready = useSyncExternalStore(subscribe, () => store.ready)
  const webgl = useMemo(webglSupported, [])

  useEffect(() => {
    store.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    store.webgl = webgl

    const onPointer = (e: PointerEvent) => {
      store.px = (e.clientX / window.innerWidth) * 2 - 1
      store.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    initScroll()

    // collect chapter sections for navigation
    sections.current = Array.from(document.querySelectorAll<HTMLElement>('.chapter'))

    const content = document.getElementById('content')
    const st = content
      ? ScrollTrigger.create({
          trigger: content,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            store.global = self.progress
          },
        })
      : null

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    void document.fonts?.ready.then(() => ScrollTrigger.refresh())
    window.setTimeout(() => ScrollTrigger.refresh(), 800)

    if (!webgl) {
      store.ready = true
      emit()
    }

    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('load', onLoad)
      st?.kill()
      destroyScroll()
      audio.current?.dispose()
    }
  }, [webgl])

  const toggleMute = () => {
    const next = !store.muted
    store.muted = next
    setMuted(next)
    if (!audio.current) audio.current = createEngineAudio()
    audio.current?.setMuted(next)
  }

  const handleColorway = (cw: Colorway) => {
    store.colorway = cw
    setColorway(cw)
  }

  const restart = () => scrollToY(0)

  return (
    <>
      <a className="skip-link" href="#content">
        SKIP TO CONTENT
      </a>

      <BgWords sections={sections} />
      {webgl ? <CanvasStage /> : <div id="stage" aria-hidden="true" />}

      <main id="content">
        <Ch1Arrival />
        <Ch2Form />
        <Ch3Explode />
        <Ch4Engine />
        <Ch5Control />
        <Ch6Speed />
        <Ch7Material colorway={colorway} onColorway={handleColorway} />
        <Ch8Reveal onRestart={restart} onBlueprint={() => setBlueprintOpen(true)} />
      </main>

      {!webgl && (
        <div className="no-webgl-note chip chip--red">
          WEBGL UNAVAILABLE — CINEMATIC 3D DISABLED, STORY UNCHANGED
        </div>
      )}

      <Nav
        active={active}
        sections={sections}
        muted={muted}
        onToggleMute={toggleMute}
        audio={audio}
        onBlueprint={() => setBlueprintOpen(true)}
      />
      <Loader ready={ready} />
      <Cursor />
      <Blueprint open={blueprintOpen} onClose={() => setBlueprintOpen(false)} />
    </>
  )
}
