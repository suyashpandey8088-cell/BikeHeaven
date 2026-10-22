/**
 * APEX — ASCII preview: renders the bike's silhouette as text art so the
 * proportions / explode choreography can be checked without a browser.
 * Run: npx tsx tools/ascii.ts
 */
import * as THREE from 'three'
import { buildBike, type BikeUpdateState } from '../src/scene/bikeGeometry'

function setState(build: ReturnType<typeof buildBike>, s: Partial<BikeUpdateState>, time = 0.6) {
  build.update({
    time, dt: 0, explode: 0, internals: 0, headlight: 0, taillight: 0,
    wheelSpin: 0, bump: 0, brakeHeat: 0, flow: 0, ...s,
  })
}

const CHARS = ' .:-=+*#%@'

function asciiRender(
  root: THREE.Object3D,
  eye: [number, number, number],
  target: [number, number, number],
  fov: number,
  cols = 150,
  rows = 56,
): string {
  const camera = new THREE.PerspectiveCamera(fov, cols / (rows * 2.05), 0.05, 60)
  camera.position.set(...eye)
  camera.lookAt(new THREE.Vector3(...target))
  camera.updateMatrixWorld()
  root.updateMatrixWorld(true)
  const depth = new Float32Array(cols * rows).fill(Infinity)
  const shade = new Float32Array(cols * rows).fill(0)
  const light = new THREE.Vector3(0.45, 0.85, 0.28).normalize()
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3()
  const ndc = new THREE.Vector3()
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3()
  const tmp = new THREE.Vector3()

  root.traverse((obj) => {
    const m = obj as THREE.Mesh
    if (!(m as any).isMesh) return
    const mat = m.material as THREE.MeshStandardMaterial
    if (!mat || !mat.color) return
    if (mat.transparent && mat.opacity < 0.4) return
    const geo = m.geometry as THREE.BufferGeometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined
    if (!pos) return
    const lum = 0.25 + 0.4 * mat.color.r + 0.35 * mat.color.g
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
        if (Math.abs(ndc.x) > 1.5 || Math.abs(ndc.y) > 1.5) { ok = false; break }
        pts.push({ x: (ndc.x * 0.5 + 0.5) * cols, y: (0.5 - ndc.y * 0.5) * rows, z: -p.z })
      }
      if (!ok) continue
      e1.copy(b).sub(a); e2.copy(c).sub(a)
      nrm.copy(e1).cross(e2).normalize()
      if (nrm.dot(tmp.copy(a).sub(camera.position)) > 0) nrm.negate()
      const s = 0.15 + 0.9 * Math.max(0, nrm.dot(light))
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
            // shape-first mapping: shading dominates, material tint is subtle
            shade[di] = Math.min(1, 0.18 + 0.85 * s)
          }
        }
      }
    }
  })
  let out = ''
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const s = shade[y * cols + x]
      const ch = CHARS[Math.min(CHARS.length - 1, Math.round(s * (CHARS.length - 1)))]
      out += ch
    }
    out += '\n'
  }
  return out
}

function bbox(root: THREE.Object3D, label: string) {
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  console.log(
    `${label}: x ${box.min.x.toFixed(2)}..${box.max.x.toFixed(2)}  y ${box.min.y.toFixed(2)}..${box.max.y.toFixed(2)}  z ${box.min.z.toFixed(2)}..${box.max.z.toFixed(2)}  (size ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)})`,
  )
}

const build = buildBike()

console.log('=== PART BOUNDING BOXES (assembled) ===')
for (const p of build.parts) bbox(p.group, p.id.padEnd(10))

console.log('\n=== SIDE VIEW (left side, +X is right) ===')
setState(build, {})
build.root.rotation.y = 0
console.log(asciiRender(build.root, [0, 0.75, 3.6], [0, 0.55, 0], 34))

console.log('\n=== FRONT 3/4 VIEW ===')
console.log(asciiRender(build.root, [2.6, 1.1, 2.9], [0.1, 0.6, 0], 36))

console.log('\n=== REAR 3/4 VIEW ===')
console.log(asciiRender(build.root, [-2.6, 1.2, -2.6], [-0.1, 0.6, 0], 36))

console.log('\n=== EXPLODED 3/4 TOP VIEW ===')
setState(build, { explode: 1 })
console.log(asciiRender(build.root, [2.8, 2.5, 3.6], [0.1, 0.3, 0], 46))

console.log('\n=== ENGINE CUTAWAY (internals visible) ===')
setState(build, { internals: 1, explode: 0 }, 0.35)
build.root.rotation.y = -0.7
console.log(asciiRender(build.root, [0.78, 0.75, 0.9], [0.08, 0.5, 0], 30))
build.root.rotation.y = 0
build.dispose()
