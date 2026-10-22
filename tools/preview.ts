/**
 * APEX — offline bike preview renderer.
 *
 * No WebGL required: this rasterises the procedural bike with a tiny
 * software renderer so the silhouette, proportions and exploded view can
 * be inspected during development (e.g. `npm run render:preview`).
 * Outputs a BMP contact sheet: tools/out/preview.bmp
 */
import * as THREE from 'three'
import { mkdirSync, writeFileSync } from 'node:fs'
import { buildBike, type BikeUpdateState } from '../src/scene/bikeGeometry'

/* ---------------- BMP writer (24-bit, uncompressed) ---------------- */
function writeBMP(path: string, w: number, h: number, rgb: Uint8Array) {
  const rowSize = w * 3 // w is a multiple of 4 so no padding needed
  const dataSize = rowSize * h
  const buf = Buffer.alloc(54 + dataSize)
  buf.write('BM', 0)
  buf.writeUInt32LE(54 + dataSize, 2)
  buf.writeUInt32LE(54, 10)
  buf.writeUInt32LE(40, 14)
  buf.writeInt32LE(w, 18)
  buf.writeInt32LE(h, 22)
  buf.writeUInt16LE(1, 26)
  buf.writeUInt16LE(24, 28)
  buf.writeUInt32LE(0, 30)
  buf.writeUInt32LE(dataSize, 34)
  // BMP rows are bottom-up
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * rowSize
    Buffer.from(rgb.buffer, rgb.byteOffset + src, rowSize).copy(buf, 54 + y * rowSize)
  }
  writeFileSync(path, buf)
}

/* ---------------- software rasteriser ---------------- */
const BG = [18, 20, 24]

interface ViewSpec {
  eye: [number, number, number]
  target: [number, number, number]
  fov: number
}

function renderView(
  root: THREE.Object3D,
  view: ViewSpec,
  w: number,
  h: number,
  frame: Uint8Array,
  ox: number,
  oy: number,
  skipTransparent = true,
) {
  const fovY = (view.fov * Math.PI) / 180
  const focal = h / 2 / Math.tan(fovY / 2)
  const eye = new THREE.Vector3(...view.eye)
  const target = new THREE.Vector3(...view.target)
  const viewMat = new THREE.Matrix4().lookAt(eye, target, new THREE.Vector3(0, 1, 0))
  viewMat.setPosition(eye.clone().negate().applyMatrix4(new THREE.Matrix4().copy(viewMat).invert()))
  // Build proper view matrix: world -> camera
  const camera = new THREE.PerspectiveCamera(view.fov, w / h, 0.05, 50)
  camera.position.copy(eye)
  camera.lookAt(target)
  camera.updateMatrixWorld()
  
  const depth = new Float32Array(w * h).fill(Infinity)
  const lightA = new THREE.Vector3(0.45, 0.85, 0.28).normalize()
  const lightB = new THREE.Vector3(-0.5, 0.25, -0.7).normalize()

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const pa = new THREE.Vector3()
  const pb = new THREE.Vector3()
  const pc = new THREE.Vector3()
  const e1 = new THREE.Vector3()
  const e2 = new THREE.Vector3()
  const nrm = new THREE.Vector3()
  const tmp = new THREE.Vector3()
  const ndc = new THREE.Vector3()

  root.updateMatrixWorld(true)
  root.traverse((obj) => {
    const m = obj as THREE.Mesh
    if (!(m as any).isMesh) return
    const mat = m.material as THREE.MeshStandardMaterial
    if (!mat || !mat.color) return
    if (skipTransparent && mat.transparent && mat.opacity < 0.45) return
    const geo = m.geometry as THREE.BufferGeometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined
    if (!pos) return
    const base = mat.color
    const br = base.r * 255
    const bg = base.g * 255
    const bb = base.b * 255
    const emissive = (mat as THREE.MeshStandardMaterial).emissive
    const em = emissive ? (emissive.r + emissive.g + emissive.b) / 3 * (mat as any).emissiveIntensity : 0

    const index = geo.getIndex()
    const triCount = index ? index.count / 3 : pos.count / 3
    for (let t = 0; t < triCount; t++) {
      const i0 = index ? index.getX(t * 3) : t * 3
      const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1
      const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2
      a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld)
      b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld)
      c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld)
      // camera space
      pa.copy(a).applyMatrix4(camera.matrixWorldInverse)
      pb.copy(b).applyMatrix4(camera.matrixWorldInverse)
      pc.copy(c).applyMatrix4(camera.matrixWorldInverse)
      if (pa.z > -0.06 || pb.z > -0.06 || pc.z > -0.06) continue
      // project
      const pts: { x: number; y: number; z: number }[] = []
      let ok = true
      for (const [p, wp] of [[pa, a], [pb, b], [pc, c]] as [THREE.Vector3, THREE.Vector3][]) {
        ndc.copy(wp).project(camera)
        if (ndc.x < -1.4 || ndc.x > 1.4 || ndc.y < -1.4 || ndc.y > 1.4) { ok = false; break }
        pts.push({ x: (ndc.x * 0.5 + 0.5) * w, y: (0.5 - ndc.y * 0.5) * h, z: -p.z })
      }
      if (!ok) continue
      // world normal
      e1.copy(b).sub(a)
      e2.copy(c).sub(a)
      nrm.copy(e1).cross(e2).normalize()
      if (nrm.dot(tmp.copy(a).sub(eye)) > 0) nrm.negate()
      let shade = 0.18 + 0.85 * Math.max(0, nrm.dot(lightA)) + 0.3 * Math.max(0, nrm.dot(lightB))
      shade = Math.min(shade, 1.15)
      const r = Math.min(255, br * shade + em * 255)
      const g = Math.min(255, bg * shade + em * 255)
      const bl = Math.min(255, bb * shade + em * 255)

      // rasterise
      const [p0, p1, p2] = pts
      const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)))
      const maxX = Math.min(w - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)))
      const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)))
      const maxY = Math.min(h - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)))
      if (maxX < minX || maxY < minY) continue
      const d = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x)
      if (Math.abs(d) < 1e-9) continue
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5
          const py = y + 0.5
          const w0 = ((p1.x - px) * (p2.y - py) - (p1.y - py) * (p2.x - px)) / d
          const w1 = ((p2.x - px) * (p0.y - py) - (p2.y - py) * (p0.x - px)) / d
          const w2 = 1 - w0 - w1
          if (w0 < 0 || w1 < 0 || w2 < 0) continue
          const z = w0 * p0.z + w1 * p1.z + w2 * p2.z
          const di = y * w + x
          if (z < depth[di]) {
            depth[di] = z
            const fi = ((oy + y) * (W) + ox + x) * 3
            frame[fi] = r
            frame[fi + 1] = g
            frame[fi + 2] = bl
          }
        }
      }
    }
  })
}

const W = 820
const H = 620

function setState(build: ReturnType<typeof buildBike>, s: Partial<BikeUpdateState>, time = 0.6) {
  build.update({
    time, dt: 0, explode: 0, internals: 0, headlight: 0, taillight: 0,
    wheelSpin: 0, bump: 0, brakeHeat: 0, flow: 0, ...s,
  })
}

const build = buildBike()
const frame = new Uint8Array(W * 2 * H * 2 * 3).fill(0)
// paint background
for (let i = 0; i < frame.length; i += 3) {
  frame[i] = BG[0]; frame[i + 1] = BG[1]; frame[i + 2] = BG[2]
}

// view 1 — assembled, left side
setState(build, {})
build.root.rotation.y = 0
renderView(build.root, { eye: [0, 0.75, 3.6], target: [0, 0.55, 0], fov: 34 }, W, H, frame, 0, H)

// view 2 — assembled, front 3/4
renderView(build.root, { eye: [2.6, 1.1, 2.9], target: [0.1, 0.6, 0], fov: 36 }, W, H, frame, W, H)

// view 3 — exploded, 3/4 top
setState(build, { explode: 1 })
renderView(build.root, { eye: [2.8, 2.3, 3.4], target: [0.1, 0.35, 0], fov: 44 }, W, H, frame, 0, 0)

// view 4 — engine cutaway close-up
setState(build, { internals: 1, explode: 0 }, 0.35)
build.root.rotation.y = -0.7
renderView(build.root, { eye: [0.75, 0.75, 0.85], target: [0.08, 0.5, 0], fov: 30 }, W, H, frame, W, 0)
build.root.rotation.y = 0

mkdirSync('tools/out', { recursive: true })
writeBMP('tools/out/preview.bmp', W * 2, H * 2, frame)
console.log('written tools/out/preview.bmp')
build.dispose()
