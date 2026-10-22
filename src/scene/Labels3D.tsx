/**
 * APEX — scroll-linked 3D component labels (drei Html).
 * Visibility is driven directly from the scroll store in useFrame —
 * no React state updates per frame.
 */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { PART_SPECS } from './bikeGeometry'
import { store, clamp01, smoothstep } from '../lib/store'

interface LabelSpec {
  partId: string
  /** window of chapter progress [start, end] within which the label is visible */
  window: [number, number]
  sub?: boolean
}

/** CH02 — exterior design annotations */
const FORM_LABELS: LabelSpec[] = [
  { partId: 'fairing', window: [0.05, 0.34] },
  { partId: 'forks', window: [0.16, 0.42], sub: true },
  { partId: 'tank', window: [0.3, 0.58] },
  { partId: 'tail', window: [0.44, 0.7], sub: true },
  { partId: 'wheelsR', window: [0.58, 0.88] },
]

/** CH03 — exploded component labels (timed to each part's displacement) */
const EXPLODE_LABELS: LabelSpec[] = [
  { partId: 'fairing', window: [0.08, 0.4] },
  { partId: 'tank', window: [0.16, 0.48] },
  { partId: 'tail', window: [0.2, 0.52] },
  { partId: 'forks', window: [0.26, 0.58] },
  { partId: 'wheelsF', window: [0.3, 0.62] },
  { partId: 'wheelsR', window: [0.3, 0.62] },
  { partId: 'swingarm', window: [0.36, 0.68] },
  { partId: 'brakes', window: [0.42, 0.74] },
  { partId: 'exhaust', window: [0.46, 0.78] },
  { partId: 'engine', window: [0.54, 0.86] },
  { partId: 'frame', window: [0.62, 0.94] },
]

export function Labels3D({ bikeRoot }: { bikeRoot: THREE.Group }) {
  const groups = useRef<(THREE.Group | null)[]>([])
  const divs = useRef<(HTMLDivElement | null)[]>([])

  const items = useMemo(() => {
    const all: LabelSpec[] = [...FORM_LABELS, ...EXPLODE_LABELS]
    return all.map((spec) => ({
      spec,
      part: PART_SPECS.find((p) => p.id === spec.partId)!,
      anchor: new THREE.Vector3(...PART_SPECS.find((p) => p.id === spec.partId)!.anchor),
      chapter: FORM_LABELS.includes(spec) ? 1 : 2,
    }))
  }, [])

  const worldPos = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const c1 = store.c[1]
    const c2 = store.c[2]
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const g = groups.current[i]
      const div = divs.current[i]
      if (!g || !div) continue
      const p = it.chapter === 1 ? c1 : c2
      let o = 0
      if (it.chapter === 1) {
        // fade in/out around the window
        const [a, b] = it.spec.window
        o = smoothstep((p - a) / 0.05) * (1 - smoothstep((p - b) / 0.05))
      } else {
        // label appears once its part has meaningfully separated
        const [a, b] = it.spec.window
        const displaced = clamp01((p - a - 0.02) / 0.05)
        o = displaced * (1 - smoothstep((p - b) / 0.06))
      }
      if (o <= 0.001) {
        div.style.opacity = '0'
        div.style.visibility = 'hidden'
        continue
      }
      // anchor world position = bikeRoot * (anchor + part explode offset)
      worldPos.copy(it.anchor)
      const partGroup = bikeRoot.children.find((c) => (c.userData as { partId?: string }).partId === it.part.id)
      if (partGroup) {
        // explode offset = group.position - basePos (basePos baked into children)
        const base = partGroup.userData.basePos as THREE.Vector3 | undefined
        if (base) worldPos.add(partGroup.position.clone().sub(base))
      }
      bikeRoot.updateMatrix()
      worldPos.applyMatrix4(bikeRoot.matrix)
      g.position.copy(worldPos)
      div.style.visibility = 'visible'
      div.style.opacity = o.toFixed(3)
      div.style.transform = `translate(14px,-50%) translateY(${((1 - o) * 14).toFixed(1)}px)`
    }
  })

  return (
    <>
      {items.map((it, i) => (
        <group key={`${it.part.id}-${it.chapter}`} ref={(el) => { groups.current[i] = el }}>
          <Html
            zIndexRange={[8, 0]}
            style={{ pointerEvents: 'none', opacity: 0 }}
            wrapperClass="label3d-wrap"
            position={[0, 0, 0]}
          >
            <div
              ref={(el) => { divs.current[i] = el }}
              className={`label3d${it.spec.sub ? ' label3d--sub' : ''}`}
            >
              <div className="label3d__inner">
                <span className="label3d__code">{it.part.code} / {it.chapter === 1 ? 'FORM' : 'ANATOMY'}</span>
                <span className="label3d__name">{it.part.label}</span>
                <span className="label3d__desc">{it.part.desc}</span>
              </div>
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}
