/**
 * APEX — per-part silhouette map. Renders each part of the bike with its own
 * character so placement/proportions can be verified as text.
 * Run: npx tsx tools/parts.ts
 */
import * as THREE from 'three'
import { buildBike, type BikeUpdateState } from '../src/scene/bikeGeometry'

function setState(build: ReturnType<typeof buildBike>, s: Partial<BikeUpdateState>, time = 0.6) {
  build.update({
    time, dt: 0, explode: 0, internals: 0, headlight: 0, taillight: 0,
    wheelSpin: 0, bump: 0, brakeHeat: 0, flow: 0, ...s,
  })
}

const PART_CHAR: Record<string, string> = {
  frame: 'F',
  engine: 'E',
  exhaust: 'x',
  fairing: 'M', // bodywork
  tank: 'T',
  tail: 'A',
  forks: '|',
  wheelsF: 'o',
  wheelsR: 'O',
  brakes: 'B',
  swingarm: 'S',
}

function partMapRender(
  root: THREE.Object3D,
  eye: [number, number, number],
  target: [number, number, number],
  fov: number,
  cols = 150,
  rows = 56,
  explode = 0,
): string {
  const camera = new THREE.PerspectiveCamera(fov, cols / (rows * 2.05), 0.05, 80)
  camera.position.set(...eye)
  camera.lookAt(new THREE.Vector3(...target))
  camera.updateMatrixWorld()
  root.updateMatrixWorld(true)
  const depth = new Float32Array(cols * rows).fill(Infinity)
  const chars = new Array(cols * rows).fill(' ')
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3()
  const ndc = new THREE.Vector3()

  // assign chars by walking from each part group
  const partNodes: { group: THREE.Object3D; ch: string }[] = []
  root.children.forEach((ch) => {
    const label = (ch.userData as any).partId
    if (label && PART_CHAR[label]) partNodes.push({ group: ch, ch: PART_CHAR[label] })
  })

  function rasterise(obj: THREE.Object3D, ch: string) {
    obj.traverse((o) => {
      const m = o as THREE.Mesh
      if (!(m as any).isMesh) return
      const mat = m.material as THREE.MeshStandardMaterial
      if (!mat || !mat.color) return
      if (mat.transparent && mat.opacity < 0.4) return
      const geo = m.geometry as THREE.BufferGeometry
      const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined
      if (!pos) return
      const index = geo.getIndex()
      const triCount = Math.floor((index ? index.count : pos.count) / 3)
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
        a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld)
        b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld)
        c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld)
        pa.copy(a).applyMatrix4(camera.matrixWorldInverse)
        pb.copy(b).applyMatrix4(camera.matrixWorldInverse)
        pc.copy(c).applyMatrix4(camera.matrixWorldInverse)
        if (pa.z > -0.06 || pb.z > -0.06 || pc.z > -0.06) continue
        const pts: { x: number; y: number; z: number }[] = []
        let ok = true
        for (const [p, wp] of [[pa, a], [pb, b], [pc, c]] as [THREE.Vector3, THREE.Vector3][]) {
          ndc.copy(wp).project(camera)
          if (Math.abs(ndc.x) > 1.6 || Math.abs(ndc.y) > 1.6) { ok = false; break }
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
            const px = x + 0.5, py = y + 0.5
            const w0 = ((p1.x - px) * (p2.y - py) - (p1.y - py) * (p2.x - px)) / d
            const w1 = ((p2.x - px) * (p0.y - py) - (p2.y - py) * (p0.x - px)) / d
            const w2 = 1 - w0 - w1
            if (w0 < 0 || w1 < 0 || w2 < 0) continue
            const z = w0 * p0.z + w1 * p1.z + w2 * p2.z
            const di = y * cols + x
            if (z < depth[di]) {
              depth[di] = z
              chars[di] = ch
            }
          }
        }
      }
    })
  }

  // draw far-to-near-ish: wheels first, then others, then fairing last (nearest to camera)
  const order = explode > 0.5
    ? ['wheelsR', 'swingarm', 'exhaust', 'frame', 'engine', 'wheelsF', 'brakes', 'forks', 'tank', 'tail', 'fairing']
    : ['wheelsR', 'exhaust', 'engine', 'frame', 'swingarm', 'wheelsF', 'brakes', 'forks', 'tank', 'fairing', 'tail']
  for (const id of order) {
    const node = partNodes.find((p) => (p.group.userData as any).partId === id)
    if (node) rasterise(node.group, node.ch)
  }

  let out = ''
  for (let y = 0; y < rows; y++) {
    out += chars.slice(y * cols, y * cols + cols).join('') + '\n'
  }
  return out
}

const build = buildBike()
// tag part groups with their ids for the renderer
build.parts.forEach((p) => {
  ;(p.group.userData as any).partId = p.id
})

console.log('=== SIDE VIEW (front +X at RIGHT) · o=front wheel O=rear M=bodywork T=tank A=tail E=engine F=frame |=forks B=brakes S=swingarm x=exhaust ===')
setState(build, {})
build.root.rotation.y = 0
console.log(partMapRender(build.root, [0, 0.62, 3.4], [0, 0.58, 0], 33))

console.log('=== FRONT VIEW (+X toward camera) ===')
console.log(partMapRender(build.root, [3.6, 0.7, 0], [0.1, 0.6, 0], 33, 110, 56))

console.log('=== TOP VIEW ===')
console.log(partMapRender(build.root, [0.1, 3.4, 0.001], [0.1, 0, 0], 36, 150, 44))

console.log('=== EXPLODED · SIDE VIEW ===')
setState(build, { explode: 1 })
console.log(partMapRender(build.root, [0, 1.15, 5.4], [0, 0.5, 0], 44, 160, 52, 1))

build.dispose()
