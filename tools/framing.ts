/**
 * APEX — camera framing audit.
 * Uses the REAL camera system from story.ts (bike-relative shots) and checks
 * how the machine is framed at every keyframe. Corners behind the camera are
 * excluded (macros legitimately have bike parts behind the lens).
 * Run: npx tsx tools/framing.ts
 */
import * as THREE from 'three'
import { buildBike, type BikeUpdateState } from '../src/scene/bikeGeometry'
import { CAM_KEYS, YAW_KEYS, sampleNumber, explodeAt, internalsAt, cameraAt } from '../src/lib/story'

const build = buildBike()
const box = new THREE.Box3()
const c = new THREE.Vector3()

function setState(T: number, time = 0.6) {
  build.root.rotation.y = sampleNumber(YAW_KEYS, T)
  build.update({
    time, dt: 0, explode: explodeAt(T), internals: internalsAt(T),
    headlight: 0, taillight: 0, wheelSpin: 0, bump: 0, brakeHeat: 0, flow: 0,
  } as BikeUpdateState)
  build.root.updateMatrixWorld(true)
}

function report(T: number, label: string, fov: number) {
  const cam = cameraAt(T, build.root.rotation.y)
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.05, 60)
  camera.position.copy(cam.pos)
  camera.lookAt(cam.look)
  camera.updateMatrixWorld(true)

  box.setFromObject(build.root)
  let minX = 1, minY = 1, maxX = -1, maxY = -1, behind = 0
  const camInv = camera.matrixWorldInverse
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        c.set(x, y, z).applyMatrix4(camInv)
        if (c.z > -0.15) { behind++; continue }
        c.set(x, y, z).project(camera)
        minX = Math.min(minX, c.x)
        maxX = Math.max(maxX, c.x)
        minY = Math.min(minY, c.y)
        maxY = Math.max(maxY, c.y)
      }
  const w = (maxX - minX) / 2
  const h = (maxY - minY) / 2
  const dist = camera.position.distanceTo(cam.look)
  const verdict =
    behind > 0
      ? `macro (behind:${behind})`
      : w > 0.85 || h > 0.95
        ? 'CLIPPED'
        : w < 0.15 && h < 0.2
          ? 'tiny'
          : 'ok'
  console.log(
    `${label.padEnd(9)} T=${T.toFixed(2)} d=${dist.toFixed(2)} ndc x[${minX.toFixed(2)},${maxX.toFixed(2)}] y[${minY.toFixed(2)},${maxY.toFixed(2)}] fill=${(w * h * 100).toFixed(0)}% ${verdict}`,
  )
}

CAM_KEYS.forEach((k, i) => {
  setState(k.t)
  report(k.t, `CAM${String(i).padStart(2)}`, k.fov)
})

console.log('\n--- mid-sequence samples (interpolated cameras) ---')
const mids = [0.15, 0.5, 0.75, 1.15, 1.5, 1.95, 2.25, 2.5, 2.7, 2.9, 3.1, 3.3, 3.5, 3.7, 3.9, 4.05, 4.2, 4.38, 4.52, 4.7, 4.85, 4.95, 5.1, 5.35, 5.7, 5.9, 6.1, 6.35, 6.6, 6.8, 6.95, 7.15, 7.45, 7.8, 7.95]
for (const t of mids) {
  setState(t)
  const fov = cameraAt(t, build.root.rotation.y).fov
  report(t, 'mid', fov)
}

build.dispose()
