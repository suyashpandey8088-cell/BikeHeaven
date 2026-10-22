/**
 * APEX — procedural concept superbike.
 *
 * The bike is built as a set of separate part-groups (frame, fairing, tank,
 * tail, wheels, forks, swingarm, brakes, exhaust, engine) so the exploded
 * view animates real, independently transformed component meshes.
 *
 * Bike space: +X forward, +Y up, +Z left (chain side). Ground at y = 0.
 * Front axle (0.71, 0.305), rear axle (-0.71, 0.33), wheelbase 1.42 m.
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { createMaterials, type BikeMaterials } from './materials'
import { clamp01, smoothstep } from '../lib/store'


export interface PartSpec {
  id: string
  code: string
  label: string
  desc: string
  anchor: [number, number, number]
  explodeDir: [number, number, number]
  explodeDist: number
  delay: number
  spin?: number
}

/** Component manifest — shared by the 3D labels and the technical blueprint. */
export const PART_SPECS: PartSpec[] = [
  { id: 'frame', code: 'BH-01', label: 'ALUMINIUM FRAME', desc: 'Twin-spar aluminium frame. The engine bolts in as a fully stressed member.', anchor: [0.1, 0.78, 0.1], explodeDir: [0.5, 1, 0], explodeDist: 1.25, delay: 0.34 },
  { id: 'fairing', code: 'BH-02', label: 'AERODYNAMIC SHELL', desc: 'Track-biased composite bodywork. Every duct feeds cooling or downforce — nothing is decoration.', anchor: [0.86, 0.74, 0.16], explodeDir: [1, 0.55, 0.55], explodeDist: 1.35, delay: 0.0, spin: -0.12 },
  { id: 'engine', code: 'BH-04', label: 'POWERTRAIN ASSEMBLY', desc: '999 cm³ concept inline-four, liquid-cooled DOHC. The structural heart of the machine.', anchor: [0.12, 0.52, 0.12], explodeDir: [0, 0.25, 0], explodeDist: 0.12, delay: 0.05 },
  { id: 'tank', code: 'BH-06', label: 'FUEL CELL & TANK', desc: 'Sculpted as a structural brace between rider and machine. 17-litre capacity (concept).', anchor: [0.0, 0.96, 0.12], explodeDir: [-0.12, 1, 0.12], explodeDist: 0.8, delay: 0.06 },
  { id: 'tail', code: 'BH-07', label: 'TAIL UNIT', desc: 'Lightweight tail with integrated lighting and exhaust-volume aerodynamics.', anchor: [-0.72, 0.92, 0.1], explodeDir: [-1, 0.45, 0.2], explodeDist: 0.95, delay: 0.08, spin: 0.12 },
  { id: 'forks', code: 'BH-12', label: 'FRONT SUSPENSION', desc: '43 mm inverted fork, fully adjustable. Kashima-coated outer tubes (concept finish).', anchor: [0.6, 0.78, 0.1], explodeDir: [1, 0.75, 0], explodeDist: 1.0, delay: 0.12 },
  { id: 'wheelsF', code: 'BH-10', label: 'FRONT WHEEL', desc: 'Forged-composite 17-inch concept wheel, 120/70 tyre.', anchor: [0.71, 0.31, 0.1], explodeDir: [1, 0.12, 0], explodeDist: 1.5, delay: 0.16 },
  { id: 'wheelsR', code: 'BH-11', label: 'REAR WHEEL', desc: 'Six-inch forged-composite concept wheel, 200/55 tyre.', anchor: [-0.71, 0.34, 0.12], explodeDir: [-1, 0.12, 0], explodeDist: 1.5, delay: 0.16 },
  { id: 'brakes', code: 'BH-15', label: 'PERFORMANCE BRAKING', desc: 'Dual 330 mm full-floating discs with radial monobloc calipers (concept specification).', anchor: [0.66, 0.38, 0.12], explodeDir: [0.55, 0.55, 1], explodeDist: 1.0, delay: 0.26 },
  { id: 'swingarm', code: 'BH-14', label: 'SWINGARM & FINAL DRIVE', desc: 'Twin-sided alloy swingarm, 520 chain final drive.', anchor: [-0.55, 0.42, 0.14], explodeDir: [-1, 0.5, 0.1], explodeDist: 1.0, delay: 0.2 },
  { id: 'exhaust', code: 'BH-16', label: 'THERMAL EXHAUST SYSTEM', desc: 'Four-to-one headers into an under-engine collector, brushed-alloy muffler.', anchor: [-0.6, 0.42, -0.18], explodeDir: [-0.6, 0.35, -1], explodeDist: 0.9, delay: 0.3 },
]

export interface PartDef {
  id: string
  code: string
  label: string
  desc: string
  anchor: THREE.Vector3
  group: THREE.Group
  explodeDir: THREE.Vector3
  explodeDist: number
  delay: number
  basePos: THREE.Vector3
  baseQuat: THREE.Quaternion
  spin: number
}

export interface BikeBuild {
  root: THREE.Group
  parts: PartDef[]
  mats: BikeMaterials
  update: (s: BikeUpdateState) => void
  dispose: () => void
}

export interface BikeUpdateState {
  time: number
  dt: number
  explode: number
  internals: number
  headlight: number
  taillight: number
  wheelSpin: number
  bump: number
  brakeHeat: number
  flow: number
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  return m
}

function profileGeo(pts: [number, number][], depth: number, bevel: number): THREE.ExtrudeGeometry {
  const s = new THREE.Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1])
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 10,
  })
  g.translate(0, 0, -depth / 2)
  return g
}

function tubeGeo(pts: [number, number, number][], r: number, tubularSegments = 36): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])))
  return new THREE.TubeGeometry(curve, tubularSegments, r, 10, false)
}

function cyl(
  rt: number,
  rb: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  axis: 'x' | 'y' | 'z' = 'y',
  open = false,
  seg = 24,
): THREE.Mesh {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)
  if (axis === 'x') g.rotateZ(Math.PI / 2)
  if (axis === 'z') g.rotateX(Math.PI / 2)
  return mesh(g, mat, x, y, z)
}

function rbox(w: number, h: number, d: number, r: number): RoundedBoxGeometry {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.05, h / 2.05, d / 2.05))
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/* ------------------------------------------------------------------ */
/* wheels                                                              */
/* ------------------------------------------------------------------ */

function buildWheel(m: BikeMaterials, R: number, width: number, rim: number, spokes = 5): THREE.Group {
  const g = new THREE.Group()
  g.add(mesh(new THREE.TorusGeometry(R - width / 2, width / 2, 18, 42), m.rubber))
  const barrel = cyl(rim, rim, width * 0.78, m.darkMetal, 0, 0, 0, 'z', true, 28)
  g.add(barrel)
  for (const s of [1, -1]) {
    g.add(mesh(new THREE.TorusGeometry(rim, 0.011, 8, 32), m.titanium, 0, 0, s * width * 0.39))
    g.add(mesh(new THREE.TorusGeometry(rim + 0.0045, 0.003, 6, 32), m.accent, 0, 0, s * width * 0.4))
  }
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2
    const sp = mesh(new THREE.BoxGeometry(0.024, rim * 1.92, 0.05), m.darkMetal, 0, 0, 0)
    sp.rotation.z = a
    sp.rotation.y = 0.22
    g.add(sp)
    const sp2 = mesh(new THREE.BoxGeometry(0.017, rim * 0.85, 0.028), m.titanium, 0, 0, 0)
    const a2 = a + Math.PI / 5
    sp2.rotation.z = a2
    sp2.position.set(-Math.sin(a2) * rim * 0.55, Math.cos(a2) * rim * 0.55, 0)
    g.add(sp2)
  }
  g.add(cyl(0.048, 0.052, width * 0.82, m.steelBright, 0, 0, 0, 'z'))
  return g
}

/* ------------------------------------------------------------------ */
/* build                                                               */
/* ------------------------------------------------------------------ */

export function buildBike(): BikeBuild {
  const mats = createMaterials()
  const root = new THREE.Group()
  const parts: PartDef[] = []

  const part = (id: string): PartDef => {
    const spec = PART_SPECS.find((s) => s.id === id)!
    const group = new THREE.Group()
    root.add(group)
    const p: PartDef = {
      id,
      code: spec.code,
      label: spec.label,
      desc: spec.desc,
      anchor: V(spec.anchor[0], spec.anchor[1], spec.anchor[2]),
      group,
      explodeDir: V(spec.explodeDir[0], spec.explodeDir[1], spec.explodeDir[2]).normalize(),
      explodeDist: spec.explodeDist,
      delay: spec.delay,
      basePos: group.position.clone(),
      baseQuat: group.quaternion.clone(),
      spin: spec.spin ?? 0,
    }
    parts.push(p)
    return p
  }

  /* ================= FRAME — twin spar aluminium ================= */
  const frame = part('frame')
  {
    const H = V(0.48, 0.93, 0)
    const P = V(-0.33, 0.44, 0)
    const d = P.clone().sub(H)
    const len = d.length()
    const ang = Math.atan2(d.y, d.x)
    for (const s of [1, -1]) {
      const spar = mesh(rbox(len, 0.062, 0.05, 0.02), mats.titanium, (H.x + P.x) / 2, (H.y + P.y) / 2, s * 0.088)
      spar.rotation.z = ang
      frame.group.add(spar)
      // subframe
      const sub = cyl(0.014, 0.014, 0.55, mats.darkMetal, -0.54, 0.69, s * 0.055)
      sub.rotation.z = Math.atan2(0.86 - 0.52, -0.78 - -0.3) - Math.PI / 2
      frame.group.add(sub)
      frame.group.add(mesh(rbox(0.16, 0.1, 0.016, 0.006), mats.darkMetal, 0.2, 0.5, s * 0.1))
      // rearsets
      frame.group.add(cyl(0.012, 0.012, 0.05, mats.steelBright, -0.26, 0.5, s * 0.16, 'z'))
      frame.group.add(mesh(rbox(0.09, 0.018, 0.03, 0.006), mats.darkMetal, -0.24, 0.5, s * 0.185))
    }
    const headTube = cyl(0.044, 0.04, 0.22, mats.titanium, 0.48, 0.93, 0)
    headTube.quaternion.setFromUnitVectors(V(0, 1, 0), V(-0.345, 0.938, 0))
    frame.group.add(headTube)
    // rear shock + racing-red spring
    const shockTop = V(-0.27, 0.76, 0)
    const shockBot = V(-0.37, 0.48, 0)
    const sd = shockBot.clone().sub(shockTop)
    const shock = new THREE.Group()
    shock.position.copy(shockTop)
    shock.quaternion.setFromUnitVectors(V(0, 1, 0), sd.clone().normalize())
    shock.add(cyl(0.02, 0.02, sd.length(), mats.chrome, 0, -sd.length() / 2, 0))
    const springMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, metalness: 0.6, roughness: 0.35 })
    const helixPts: THREE.Vector3[] = []
    const turns = 6
    for (let i = 0; i <= 48; i++) {
      const t = i / 48
      const a = t * Math.PI * 2 * turns
      helixPts.push(V(Math.cos(a) * 0.031, -t * sd.length() * 0.92 - 0.02, Math.sin(a) * 0.031))
    }
    shock.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helixPts), 96, 0.006, 6, false), springMat))
    frame.group.add(shock)
  }

  /* ================= ENGINE — concept inline-four ================= */
  const engine = part('engine')
  const blockMat = mats.engineAlloy.clone()
  blockMat.transparent = true
  const pistonMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.95, roughness: 0.3, transparent: true, opacity: 0 })
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x2a2e35, metalness: 0.9, roughness: 0.4, transparent: true, opacity: 0 })
  const crankMat = new THREE.MeshStandardMaterial({ color: 0xd9dde1, metalness: 1, roughness: 0.25, transparent: true, opacity: 0 })

  const engineBank = new THREE.Group()
  engineBank.position.set(0.17, 0.56, 0)
  engineBank.rotation.z = -0.385
  engineBank.add(mesh(rbox(0.3, 0.34, 0.27, 0.03), blockMat))
  for (let i = 0; i < 5; i++) {
    engineBank.add(mesh(rbox(0.33, 0.006, 0.29, 0.002), blockMat, 0.004, -0.1 + i * 0.06, 0))
  }
  const headGroup = new THREE.Group()
  headGroup.position.set(0, 0.2, 0)
  headGroup.add(mesh(rbox(0.32, 0.09, 0.28, 0.02), blockMat))
  headGroup.add(mesh(rbox(0.28, 0.05, 0.25, 0.015), mats.engineAlloy, 0, 0.068, 0))
  engineBank.add(headGroup)
  engine.group.add(engineBank)

  engine.group.add(mesh(rbox(0.52, 0.26, 0.26, 0.045), mats.engineAlloy, 0.02, 0.37, 0))
  engine.group.add(mesh(rbox(0.4, 0.09, 0.24, 0.03), mats.darkMetal, 0.0, 0.235, 0))
  engine.group.add(cyl(0.09, 0.09, 0.038, mats.steelBright, 0.06, 0.36, 0.143, 'z'))
  engine.group.add(cyl(0.07, 0.07, 0.034, mats.steelBright, 0.06, 0.36, -0.14, 'z'))
  engine.group.add(mesh(rbox(0.1, 0.12, 0.016, 0.008), mats.darkMetal, -0.1, 0.42, 0.128))
  // radiator
  for (const [mm, w, hh] of [[mats.darkMetal, 0.05, 0.27], [mats.screenDark, 0.032, 0.23]] as const) {
    const r = mesh(rbox(w, hh, 0.3, 0.012), mm, 0.43, 0.5, 0)
    r.rotation.z = 0.14
    engine.group.add(r)
  }
  for (const s of [1, -1]) {
    const tank = mesh(rbox(0.055, 0.27, 0.028, 0.01), mats.titanium, 0.43, 0.5, s * 0.155)
    tank.rotation.z = 0.14
    engine.group.add(tank)
  }
  // velocity stacks (revealed when the tank lifts)
  for (let i = 0; i < 4; i++) {
    const z = -0.117 + i * 0.078
    const t = cyl(0.026, 0.044, 0.09, mats.darkMetal, 0.3, 0.74, z, 'y', true, 18)
    t.rotation.z = -0.385
    engine.group.add(t)
    const ring = mesh(new THREE.TorusGeometry(0.027, 0.004, 6, 18), mats.chrome, 0.334, 0.823, z)
    ring.quaternion.setFromUnitVectors(V(0, 0, 1), V(Math.sin(0.385), Math.cos(0.385), 0))
    engine.group.add(ring)
  }

  /* ---- internals (CH04 cutaway) ---- */
  const C = V(0.02, 0.38, 0)
  const alpha = 0.385
  const axisA = V(Math.sin(alpha), Math.cos(alpha), 0)
  const axisU = V(Math.cos(alpha), -Math.sin(alpha), 0)
  const crankR = 0.032
  const rodL = 0.115
  const phases = [0, Math.PI, Math.PI, 0]
  const crankGroup = new THREE.Group()
  crankGroup.position.copy(C)
  crankGroup.add(cyl(0.018, 0.018, 0.28, crankMat, 0, 0, 0, 'z'))
  const pistons: THREE.Mesh[] = []
  const rods: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const z = -0.117 + i * 0.078
    const psi = phases[i] - alpha
    // counterweight web (opposite the pin)
    const web = mesh(rbox(0.1, 0.028, 0.02, 0.008), crankMat, -0.048 * Math.cos(psi), -0.048 * Math.sin(psi), z)
    web.rotation.z = psi
    crankGroup.add(web)
    crankGroup.add(cyl(0.013, 0.013, 0.05, crankMat, crankR * Math.cos(psi), crankR * Math.sin(psi), z, 'z'))
    const piston = cyl(0.033, 0.033, 0.055, pistonMat, 0, 0, z)
    piston.rotation.z = -alpha
    engine.group.add(piston)
    pistons.push(piston)
    const rod = mesh(rbox(0.02, rodL, 0.028, 0.008), rodMat, 0, 0, z)
    engine.group.add(rod)
    rods.push(rod)
  }
  crankGroup.visible = false
  pistons.forEach((p) => (p.visible = false))
  rods.forEach((r) => (r.visible = false))
  engine.group.add(crankGroup)

  /* ================= EXHAUST ================= */
  const exhaust = part('exhaust')
  for (let i = 0; i < 4; i++) {
    const z = -0.117 + i * 0.078
    exhaust.group.add(
      mesh(
        tubeGeo(
          [
            [0.3, 0.56, z * 0.92],
            [0.42, 0.44, z * 0.85],
            [0.32, 0.27, z * 0.6],
            [0.13, 0.21, z * 0.3],
            [0.04, 0.2, 0],
          ],
          0.02,
          40,
        ),
        mats.steelBright,
      ),
    )
  }
  const collector = mesh(new THREE.SphereGeometry(0.06, 18, 14), mats.steelBright, 0.02, 0.2, 0)
  collector.scale.set(1.3, 0.9, 1)
  exhaust.group.add(collector)
  exhaust.group.add(mesh(tubeGeo([[0.0, 0.2, 0], [-0.25, 0.22, -0.07], [-0.45, 0.3, -0.12]], 0.026, 24), mats.steelBright))
  const mufDir = V(-0.42, 0.17, -0.03).normalize()
  const mufMid = V(-0.68, 0.44, -0.145)
  const muf = cyl(0.052, 0.056, 0.42, mats.titanium, mufMid.x, mufMid.y, mufMid.z)
  muf.quaternion.setFromUnitVectors(V(0, 1, 0), mufDir)
  exhaust.group.add(muf)
  const tip = cyl(0.043, 0.043, 0.06, mats.darkMetal, mufMid.x + mufDir.x * 0.235, mufMid.y + mufDir.y * 0.235, mufMid.z + mufDir.z * 0.235)
  tip.quaternion.setFromUnitVectors(V(0, 1, 0), mufDir)
  exhaust.group.add(tip)

  /* ================= FRONT FAIRING / BODYWORK ================= */
  const fairing = part('fairing')
  {
    const noseShape: [number, number][] = [
      [0.0, 0.58],
      [0.08, 0.6],
      [0.145, 0.7],
      [0.135, 0.83],
      [0.06, 0.9],
      [0.0, 0.92],
      [-0.06, 0.9],
      [-0.135, 0.83],
      [-0.145, 0.7],
      [-0.08, 0.6],
    ]
    const noseGeo = profileGeo(noseShape, 0.36, 0.055)
    noseGeo.rotateY(Math.PI / 2)
    noseGeo.translate(0.62, 0, 0)
    fairing.group.add(mesh(noseGeo, mats.paint))

    const sideShape: [number, number][] = [
      [0.66, 0.9],
      [0.9, 0.62],
      [0.95, 0.46],
      [0.72, 0.3],
      [0.38, 0.235],
      [0.12, 0.205],
      [-0.04, 0.28],
      [-0.02, 0.52],
      [0.22, 0.74],
      [0.46, 0.87],
    ]
    for (const s of [1, -1]) {
      fairing.group.add(mesh(profileGeo(sideShape, 0.028, 0.022), mats.paint, 0, 0, s * 0.205))
      const blade = mesh(profileGeo([[0.66, 0.9], [0.88, 0.66], [0.8, 0.62], [0.58, 0.84]], 0.01, 0.008), mats.accent, 0, 0, s * 0.245)
      fairing.group.add(blade)
    }

    fairing.group.add(mesh(profileGeo([[0.5, 0.34], [0.42, 0.2], [0.05, 0.15], [-0.18, 0.19], [-0.26, 0.32], [0.1, 0.36]], 0.3, 0.035), mats.paintSub))

    const screen = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.26, 18, 1, true, -0.45, 0.72), mats.glass, 0.56, 0.96, 0)
    screen.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0.3, -0.55, 'YXZ'))
    fairing.group.add(screen)

    for (const s of [1, -1]) {
      fairing.group.add(mesh(rbox(0.05, 0.07, 0.03, 0.01), mats.screenDark, 0.925, 0.76, s * 0.055))
      const lamp = mesh(rbox(0.012, 0.045, 0.022, 0.004), mats.headlight, 0.955, 0.765, s * 0.058)
      lamp.rotation.y = -s * 0.35
      fairing.group.add(lamp)
    }
    const drl = mesh(rbox(0.012, 0.01, 0.2, 0.004), mats.headlight, 0.965, 0.71, 0)
    drl.rotation.y = 0.12
    fairing.group.add(drl)

    for (const s of [1, -1]) {
      const wg = mesh(profileGeo([[0, 0], [0.16, 0.015], [0.15, 0.05], [0.02, 0.055]], 0.012, 0.005), mats.carbon, 0.74, 0.585, s * 0.185)
      wg.rotation.y = -s * 0.5
      wg.rotation.z = -0.08
      fairing.group.add(wg)
      const wgEdge = mesh(profileGeo([[0, 0], [0.16, 0.015], [0.15, 0.028]], 0.006, 0.003), mats.accent, 0.74, 0.585, s * 0.198)
      wgEdge.rotation.y = -s * 0.5
      wgEdge.rotation.z = -0.08
      fairing.group.add(wgEdge)
    }

    const fend = mesh(new THREE.TorusGeometry(0.345, 0.036, 10, 30, 1.75), mats.carbon, 0.71, 0.305, 0)
    fend.rotation.z = Math.PI / 2 - 0.87
    fairing.group.add(fend)
    fairing.group.add(mesh(rbox(0.34, 0.03, 0.1, 0.012), mats.carbon, 0.71, 0.6, 0))
  }

  /* ================= FUEL TANK ================= */
  const tank = part('tank')
  {
    const tankGeo = profileGeo(
      [
        [-0.36, 0.77],
        [-0.34, 0.95],
        [-0.12, 1.005],
        [0.08, 0.99],
        [0.23, 0.9],
        [0.27, 0.79],
        [0.1, 0.745],
        [-0.18, 0.74],
      ],
      0.2,
      0.055,
    )
    tankGeo.scale(1, 1, 1.1)
    tank.group.add(mesh(tankGeo, mats.paint))
    tank.group.add(cyl(0.033, 0.036, 0.018, mats.darkMetal, -0.02, 1.02, 0))
    const stripeGeo = profileGeo([[-0.3, 0.955], [-0.12, 1.0], [0.06, 0.985], [0.2, 0.9], [0.14, 0.875], [-0.06, 0.955], [-0.26, 0.925]], 0.008, 0.004)
    const s1 = mesh(stripeGeo, mats.accent, 0, 0.004, 0.172)
    tank.group.add(s1)
    const s2 = mesh(stripeGeo.clone(), mats.accent, 0, 0.004, -0.172)
    tank.group.add(s2)
  }

  /* ================= TAIL ================= */
  const tail = part('tail')
  {
    const tailGeo = profileGeo(
      [
        [-0.24, 0.79],
        [-0.5, 0.9],
        [-0.78, 0.965],
        [-1.0, 0.995],
        [-1.035, 0.93],
        [-0.88, 0.865],
        [-0.55, 0.79],
        [-0.29, 0.715],
      ],
      0.1,
      0.03,
    )
    tailGeo.scale(1, 1, 1.05)
    tail.group.add(mesh(tailGeo, mats.paint))
    const seat = mesh(rbox(0.34, 0.045, 0.18, 0.018), mats.rubber, -0.4, 0.865, 0)
    seat.rotation.z = 0.1
    tail.group.add(seat)
    const tl = mesh(rbox(0.02, 0.028, 0.11, 0.006), mats.taillight, -1.06, 0.955, 0)
    tl.rotation.z = 0.35
    tail.group.add(tl)
    const hug = mesh(new THREE.TorusGeometry(0.375, 0.032, 8, 24, 1.25), mats.carbon, -0.71, 0.33, 0)
    hug.rotation.z = 1.35
    tail.group.add(hug)
  }

  /* ================= FORKS ================= */
  const forks = part('forks')
  let forkLower: THREE.Group
  {
    const head = V(0.48, 0.93, 0)
    const upDir = V(-0.345, 0.938, 0).normalize() // axle -> head
    forks.group.position.copy(head)
    forks.group.quaternion.setFromUnitVectors(V(0, 1, 0), upDir)
    forks.basePos.copy(forks.group.position)
    forks.baseQuat.copy(forks.group.quaternion)
    // local +Y points from head upward; the axle sits at local y = -0.666
    forkLower = new THREE.Group()
    for (const s of [1, -1]) {
      forks.group.add(cyl(0.024, 0.024, 0.42, mats.darkMetal, 0, -0.14, s * 0.062))
      forkLower.add(cyl(0.034, 0.036, 0.36, mats.gold, 0, -0.44, s * 0.062))
      forkLower.add(mesh(rbox(0.05, 0.1, 0.03, 0.01), mats.darkMetal, -0.05, -0.56, s * 0.062))
    }
    forkLower.add(mesh(rbox(0.075, 0.1, 0.2, 0.02), mats.darkMetal, 0, -0.645, 0))
    forks.group.add(forkLower)
    forks.group.add(mesh(rbox(0.055, 0.028, 0.19, 0.01), mats.darkMetal, 0, 0.015, 0))
    forks.group.add(mesh(rbox(0.055, 0.028, 0.19, 0.01), mats.darkMetal, 0, 0.095, 0))
    for (const s of [1, -1]) {
      const bar = cyl(0.013, 0.013, 0.17, mats.carbon, 0.015, 0.115, s * 0.1, 'z')
      bar.rotation.z = 0.12
      forks.group.add(bar)
      const lever = cyl(0.005, 0.005, 0.09, mats.steelBright, -0.03, 0.115, s * 0.17, 'z')
      lever.rotation.z = 1.35
      forks.group.add(lever)
    }
  }

  /* ================= WHEELS ================= */
  const wheelsF = part('wheelsF')
  const frontWheel = buildWheel(mats, 0.305, 0.12, 0.2)
  frontWheel.position.set(0.71, 0.305, 0)
  wheelsF.group.add(frontWheel)

  const wheelsR = part('wheelsR')
  const rearWheel = buildWheel(mats, 0.33, 0.19, 0.21)
  rearWheel.position.set(-0.71, 0.33, 0)
  wheelsR.group.add(rearWheel)
  wheelsR.group.add(cyl(0.115, 0.115, 0.008, mats.discSteel, -0.71, 0.33, -0.108, 'z', false, 36))
  wheelsR.group.add(cyl(0.075, 0.075, 0.012, mats.darkMetal, -0.71, 0.33, -0.106, 'z'))
  wheelsR.group.add(cyl(0.11, 0.11, 0.01, mats.darkMetal, -0.71, 0.33, 0.118, 'z', false, 30))

  /* ================= BRAKES (front assembly) ================= */
  const brakes = part('brakes')
  const discMatF = mats.discSteel.clone()
  discMatF.emissive = new THREE.Color(0xff3b30)
  discMatF.emissiveIntensity = 0
  for (const s of [1, -1]) {
    brakes.group.add(cyl(0.16, 0.16, 0.006, discMatF, 0.71, 0.305, s * 0.052, 'z', false, 48))
    brakes.group.add(cyl(0.078, 0.078, 0.011, mats.darkMetal, 0.71, 0.305, s * 0.05, 'z'))
    const cal = mesh(rbox(0.055, 0.13, 0.055, 0.018), mats.gold, 0.65, 0.445, s * 0.062)
    cal.rotation.z = 0.55
    brakes.group.add(cal)
    brakes.group.add(mesh(rbox(0.02, 0.05, 0.05, 0.01), mats.darkMetal, 0.616, 0.49, s * 0.064))
  }

  /* ================= SWINGARM + FINAL DRIVE ================= */
  const swingarm = part('swingarm')
  {
    const P = V(-0.33, 0.44, 0)
    const A = V(-0.71, 0.33, 0)
    const d = A.clone().sub(P)
    const ang = Math.atan2(d.y, d.x)
    for (const s of [1, -1]) {
      const beam = mesh(rbox(d.length(), 0.052, 0.034, 0.014), mats.titanium, (P.x + A.x) / 2, (P.y + A.y) / 2, s * 0.108)
      beam.rotation.z = ang
      swingarm.group.add(beam)
    }
    swingarm.group.add(mesh(rbox(0.05, 0.038, 0.2, 0.012), mats.titanium, -0.5, 0.385, 0))
    swingarm.group.add(cyl(0.03, 0.03, 0.24, mats.darkMetal, -0.33, 0.44, 0, 'z'))
    const top = mesh(rbox(0.61, 0.013, 0.014, 0.004), mats.darkMetal, -0.405, 0.46, 0.112)
    top.rotation.z = Math.atan2(0.445 - 0.475, -0.71 - -0.1)
    swingarm.group.add(top)
    const bot = mesh(rbox(0.7, 0.013, 0.014, 0.004), mats.darkMetal, -0.405, 0.285, 0.112)
    bot.rotation.z = Math.atan2(0.225 - 0.345, -0.75 - -0.06)
    swingarm.group.add(bot)
    swingarm.group.add(cyl(0.055, 0.055, 0.014, mats.darkMetal, -0.1, 0.42, 0.108, 'z'))
    swingarm.group.add(mesh(rbox(0.05, 0.09, 0.04, 0.012), mats.gold, -0.62, 0.42, -0.118))
  }

  /* ================= FLOW FX (CH04 airflow) ================= */
  const intakePath = new THREE.CatmullRomCurve3([
    V(1.04, 0.78, 0), V(0.7, 0.82, 0), V(0.4, 0.82, 0), V(0.26, 0.76, 0), V(0.2, 0.62, 0), V(0.14, 0.5, 0),
  ])
  const exhaustPath = new THREE.CatmullRomCurve3([
    V(0.2, 0.5, 0), V(0.32, 0.35, 0), V(0.05, 0.2, 0), V(-0.35, 0.24, -0.08), V(-0.7, 0.4, -0.14), V(-0.98, 0.5, -0.16),
  ])
  const dotMatLime = new THREE.MeshBasicMaterial({ color: 0xd7ff36, transparent: true, opacity: 0 })
  const dotMatHeat = new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0 })
  const dotGeo = new THREE.SphereGeometry(0.011, 8, 8)
  const dots: THREE.Mesh[] = []
  for (let i = 0; i < 14; i++) {
    const d = new THREE.Mesh(dotGeo, i < 7 ? dotMatLime : dotMatHeat)
    d.visible = false
    root.add(d)
    dots.push(d)
  }

  /* ================= update ================= */
  const _v1 = new THREE.Vector3()
  const _v2 = new THREE.Vector3()
  const _q = new THREE.Quaternion()
  const _e = new THREE.Euler()

  function update(s: BikeUpdateState) {
    const E = s.explode
    for (const p of parts) {
      const lp = clamp01((E - p.delay) / 0.64)
      const e = smoothstep(lp)
      p.group.position.set(
        p.basePos.x + p.explodeDir.x * p.explodeDist * e,
        p.basePos.y + p.explodeDir.y * p.explodeDist * e,
        p.basePos.z + p.explodeDir.z * p.explodeDist * e,
      )
      if (p.spin !== 0) {
        _q.setFromEuler(_e.set(p.spin * e, 0, 0))
        p.group.quaternion.copy(p.baseQuat).multiply(_q)
      }
    }
    // suspension travel (front wheel pushes up into the fork)
    forkLower.position.y = s.bump * 0.055
    wheelsF.group.position.y += s.bump * 0.05
    // wheel spin
    if (s.wheelSpin !== 0) {
      frontWheel.rotation.z += s.wheelSpin * s.dt
      rearWheel.rotation.z += s.wheelSpin * s.dt * 0.94
    }
    // internals cutaway
    const I = s.internals
    const show = I > 0.01
    crankGroup.visible = show
    pistons.forEach((p) => (p.visible = show))
    rods.forEach((r) => (r.visible = show))
    blockMat.opacity = 1 - I * 0.86
    headGroup.position.y = 0.2 + I * 0.1
    pistonMat.opacity = I
    rodMat.opacity = I
    crankMat.opacity = I
    if (show) {
      const phi = s.time * (s.flow > 0.5 ? 10 : 6)
      crankGroup.rotation.z = phi
      for (let i = 0; i < 4; i++) {
        const th = phi + phases[i]
        const pinX = C.x + crankR * Math.cos(th) * axisU.x + crankR * Math.sin(th) * axisA.x
        const pinY = C.y + crankR * Math.cos(th) * axisU.y + crankR * Math.sin(th) * axisA.y
        const z = -0.117 + i * 0.078
        const sDist = crankR * Math.sin(th) + Math.sqrt(Math.max(rodL * rodL - crankR * crankR * Math.cos(th) * Math.cos(th), 1e-6))
        pistons[i].position.set(C.x + axisA.x * sDist, C.y + axisA.y * sDist, z)
        const pin = _v1.set(pinX, pinY, z)
        const pp = _v2.set(C.x + axisA.x * sDist, C.y + axisA.y * sDist, z)
        rods[i].position.copy(pin).add(pp).multiplyScalar(0.5)
        rods[i].quaternion.setFromUnitVectors(V(0, 1, 0), pp.sub(pin).normalize())
      }
    }
    // lights
    mats.headlight.emissiveIntensity = s.headlight * 5.5
    mats.taillight.emissiveIntensity = Math.max(s.taillight * 4, s.headlight * 3.5)
    // brake heat
    discMatF.emissiveIntensity = s.brakeHeat * 2.4
    // airflow dots
    const fo = s.flow
    dotMatLime.opacity = fo
    dotMatHeat.opacity = fo
    const showDots = fo > 0.01
    dots.forEach((d) => (d.visible = showDots))
    if (showDots) {
      for (let i = 0; i < 7; i++) {
        intakePath.getPoint((s.time * 0.22 + i / 7) % 1, dots[i].position)
        exhaustPath.getPoint((s.time * 0.3 + i / 7) % 1, dots[7 + i].position)
      }
    }
  }

  function dispose() {
    const geos = new Set<THREE.BufferGeometry>()
    const matsSet = new Set<THREE.Material>()
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry) geos.add(m.geometry)
      const mm = m.material as THREE.Material | THREE.Material[] | undefined
      if (mm) (Array.isArray(mm) ? mm : [mm]).forEach((x) => matsSet.add(x))
    })
    geos.forEach((g) => g.dispose())
    matsSet.forEach((m) => m.dispose())
    dotGeo.dispose()
    dotMatLime.dispose()
    dotMatHeat.dispose()
  }

  return { root, parts, mats, update, dispose }
}
