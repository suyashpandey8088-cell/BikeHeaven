/** Verify rendered positions of known bike landmarks against theory. */
import * as THREE from 'three'
import { buildBike } from '../src/scene/bikeGeometry'

const build = buildBike()
build.update({ time: 0.5, dt: 0, explode: 0, internals: 0, headlight: 0, taillight: 0, wheelSpin: 0, bump: 0, brakeHeat: 0, flow: 0 })
build.root.rotation.y = 0
build.root.updateMatrixWorld(true)

const eye = new THREE.Vector3(0, 0.62, 3.4)
const target = new THREE.Vector3(0, 0.58, 0)
const cols = 150, rows = 56
const camera = new THREE.PerspectiveCamera(33, cols / (rows * 2.05), 0.05, 80)
camera.position.copy(eye)
camera.lookAt(target)
camera.updateMatrixWorld(true)

const landmarks: [string, THREE.Vector3][] = [
  ['rear axle', new THREE.Vector3(-0.71, 0.33, 0)],
  ['front axle', new THREE.Vector3(0.71, 0.305, 0)],
  ['tail tip', new THREE.Vector3(-1.06, 0.95, 0)],
  ['nose tip', new THREE.Vector3(1.03, 0.74, 0)],
  ['tank top', new THREE.Vector3(0.0, 1.0, 0)],
  ['bar top', new THREE.Vector3(0.44, 1.05, 0)],
]
for (const [name, p] of landmarks) {
  const n = p.clone().project(camera)
  console.log(
    name.padEnd(12),
    'col', ((n.x * 0.5 + 0.5) * cols).toFixed(0),
    'row', ((0.5 - n.y * 0.5) * rows).toFixed(0),
  )
}
build.dispose()
