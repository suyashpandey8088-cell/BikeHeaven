/**
 * APEX — per-part composition check for key shots using the REAL camera
 * system. Prints what each frame actually contains, part by part.
 * Run: npx tsx tools/shots.ts
 */
import * as THREE from 'three'
import { buildBike, type BikeUpdateState } from '../src/scene/bikeGeometry'
import { YAW_KEYS, sampleNumber, explodeAt, internalsAt, cameraAt, CAM_KEYS } from '../src/lib/story'

const PART_CHAR: Record<string, string> = {
  frame: 'F', engine: 'E', exhaust: 'x', fairing: 'M', tank: 'T', tail: 'A',
  forks: '|', wheelsF: 'o', wheelsR: 'O', brakes: 'B', swingarm: 'S',
}

function setState(T: number, time = 0.6) {
  build.root.rotation.y = sampleNumber(YAW_KEYS, T)
  build.update({
    time, dt: 0, explode: explodeAt(T), internals: internalsAt(T),
    headlight: 0, taillight: 0, wheelSpin: 0, bump: 0, brakeHeat: 0, flow: 0,
  } as BikeUpdateState)
  build.root.updateMatrixWorld(true)
}

const build = buildBike()
build.parts.forEach((p) => {
  ;(p.group.userData as Record<string, unknown>).partId = p.id
  ;(p.group.userData as Record<string, unknown>).basePos = p.basePos
})

function renderShot(t: number, label: string, cols = 130, rows = 46) {
  setState(t)
  const cam = cameraAt(t, build.root.rotation.y)
  const fov = cameraAt(t, build.root.rotation.y).fov
  void fov
  const key = CAM_KEYS.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a))
  const camera = new THREE.PerspectiveCamera(key.fov, cols / (rows * 2.05), 0.03, 60)
  camera.position.copy(cam.pos)
  camera.lookAt(cam.look)
  camera.updateMatrixWorld(true)
  build.root.updateMatrixWorld(true)

  const depth = new Float32Array(cols * rows).fill(Infinity)
  const chars = new Array(cols * rows).fill(' ')
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3()
  const ndc = new THREE.Vector3()

  const order = ['wheelsR', 'exhaust', 'engine', 'frame', 'swingarm', 'wheelsF', 'brakes', 'forks', 'tank', 'fairing', 'tail']
  for (const id of order) {
    const part = build.parts.find((p) => p.id === id)
    if (!part) continue
    part.group.traverse((o) => {
      const m = o as THREE.Mesh
      if (!(m as unknown as { isMesh?: boolean }).isMesh) return
      const mat = m.material as THREE.MeshStandardMaterial
      if (!mat || !mat.color) return
      if (mat.transparent && mat.opacity < 0.4) return
      const geo = m.geometry as THREE.BufferGeometry
      const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined
      if (!pos) return
      const index = geo.getIndex()
      const triCount = Math.floor((index ? index.count : pos.count) / 3)
      for (let tr = 0; tr < triCount; tr++) {
        const i0 = index ? index.getX(tr * 3) : tr * 3
        const i1 = index ? index.getX(tr * 3 + 1) : tr * 3 + 1
        const i2 = index ? index.getX(tr * 3 + 2) : tr * 3 + 2
        a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld)
        b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld)
        c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld)
        pa.copy(a).applyMatrix4(camera.matrixWorldInverse)
        pb.copy(b).applyMatrix4(camera.matrixWorldInverse)
        pc.copy(c).applyMatrix4(camera.matrixWorldInverse)
        if (pa.z > -0.05 || pb.z > -0.05 || pc.z > -0.05) continue
        const pts: { x: number; y: number; z: number }[] = []
        let ok = true
        for (const [p, wp] of [
          [pa, a],
          [pb, b],
          [pc, c],
        ] as [THREE.Vector3, THREE.Vector3][]) {
          void p
          ndc.copy(wp).project(camera)
          if (Math.abs(ndc.x) > 1.6 || Math.abs(ndc.y) > 1.6) {
            ok = false
            break
          }
          pts.push({ x: (ndc.x * 0.5 + 0.5) * cols, y: (0.5 - ndc.y * 0.5) * rows, z: -p.z })
        }
        if (!ok) continue
        const [p0, p1, p2] = pts
        const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)))
        const maxX = Math.min(cols - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)))
        const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)))
        const maxY = Math.min(rows - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)))
        const d = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x)
        if (Math.abs(d) < 1e-9) continue
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const px = x + 0.5,
              py = y + 0.5
            const w0 = ((p1.x - px) * (p2.y - py) - (p1.y - py) * (p2.x - px)) / d
            const w1 = ((p2.x - px) * (p0.y - py) - (p2.y - py) * (p0.x - px)) / d
            const w2 = 1 - w0 - w1
            if (w0 < 0 || w1 < 0 || w2 < 0) continue
            const z = w0 * p0.z + w1 * p1.z + w2 * p2.z
            const di = y * cols + x
            if (z < depth[di]) {
              depth[di] = z
              chars[di] = PART_CHAR[id] ?? '?'
            }
          }
        }
      }
    })
  }
  console.log(`\n=== ${label} · T=${t} (d=${camera.position.distanceTo(cam.look).toFixed(2)} fov=${key.fov}) ===`)
  for (let y = 0; y < rows; y++) console.log(chars.slice(y * cols, y * cols + cols).join(''))
}

renderShot(0.0, 'CH1 · ARRIVAL OPEN — front wheel fragment')
renderShot(0.62, 'CH1 · SILHOUETTE REVEAL')
renderShot(1.3, 'CH2 · SIDE PROFILE')
renderShot(2.62, 'CH3 · EXPLODED TRAVEL')
renderShot(3.62, 'CH4 · ENGINE MACRO (cutaway)')
renderShot(4.44, 'CH5B · BRAKE MACRO')
renderShot(4.66, 'CH5C · TYRE')
renderShot(5.55, 'CH6 · TUNNEL FACE-ON')
renderShot(6.2, 'CH7 · TANK MACRO')
renderShot(8.0, 'CH8 · FINAL HERO')

build.dispose()
