/**
 * APEX — the cinematic 3D stage.
 *
 * One fixed transparent canvas sits behind the DOM. A single controller
 * (SceneRig) reads story time T ∈ [0,8] from the scroll store every frame and
 * drives camera, bike transforms, lighting, environment, floor and tunnel —
 * nothing else writes to these objects, so scroll is fully reversible.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  PerformanceMonitor,
} from '@react-three/drei'
import { buildBike } from './bikeGeometry'
import { applyColorway } from './materials'
import { Labels3D } from './Labels3D'
import { store, storyTime, smoothstep, isMobileLike, emit } from '../lib/store'
import {
  cameraAt,
  explodeAt,
  internalsAt,
  headlightAt,
  lightRigAt,
  YAW_KEYS,
  sampleNumber,
} from '../lib/story'

/* ------------------------------------------------------------------ */
/* CH06 — light streaks flying past the machine                        */
/* ------------------------------------------------------------------ */

const STREAK_COUNT = 84

function Tunnel() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () =>
      new Array(STREAK_COUNT).fill(0).map(() => ({
        angle: Math.random() * Math.PI * 2,
        radius: 1.5 + Math.random() * 2.6,
        x: -8 + Math.random() * 14,
        speed: 16 + Math.random() * 15,
        len: 1.6 + Math.random() * 3.6,
      })),
    [],
  )
  const colors = useMemo(() => {
    const palette = [0xd7ff36, 0xd7ff36, 0xf2f3f4, 0xb9c0c8, 0xff3b30, 0x2547ff]
    return new Array(STREAK_COUNT).fill(0).map(() => palette[Math.floor(Math.random() * palette.length)])
  }, [])

  useEffect(() => {
    const m = meshRef.current
    if (!m) return
    const c = new THREE.Color()
    colors.forEach((hex, i) => m.setColorAt(i, c.setHex(hex)))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [colors])

  useFrame((state) => {
    const mesh = meshRef.current
    const mat = matRef.current
    if (!mesh || !mat) return
    const c5 = store.c[5]
    const activity = smoothstep((c5 - 0.02) / 0.1) * (1 - smoothstep((c5 - 0.94) / 0.05))
    mat.opacity = activity * 0.85
    mesh.visible = activity > 0.01
    if (!mesh.visible) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      let x = s.x + t * s.speed * (store.reduced ? 0.25 : 1)
      x = ((x + 8) % 14) - 8
      dummy.position.set(x, Math.sin(s.angle) * s.radius + 0.6, Math.cos(s.angle) * s.radius)
      dummy.scale.set(s.len * (0.4 + activity), 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STREAK_COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 0.014, 0.014]} />
      <meshBasicMaterial
        ref={matRef}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* atmosphere dust                                                     */
/* ------------------------------------------------------------------ */

function Dust({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -2.4 + Math.random() * 4.8
      pos[i * 3 + 1] = Math.random() * 2.4
      pos[i * 3 + 2] = -1.8 + Math.random() * 3.6
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  useFrame((_, dt) => {
    const pts = ref.current
    if (!pts || store.reduced) return
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += dt * 0.045
      if (arr[i * 3 + 1] > 2.4) arr[i * 3 + 1] = 0
    }
    attr.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.011}
        color={0xb9c0c8}
        transparent
        opacity={0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/* central controller                                                  */
/* ------------------------------------------------------------------ */

const _rig: Record<string, number> = {}

function SceneRig() {
  const { camera, scene, gl } = useThree()
  const mobile = useMemo(() => isMobileLike(), [])
  const build = useMemo(() => buildBike(), [])

  // headlight beam (child of the bike, travels with it)
  const beam = useMemo(() => {
    const spot = new THREE.SpotLight(0xd7ff36, 0, 9, 0.5, 0.65, 1.2)
    const target = new THREE.Object3D()
    target.position.set(6, 0.5, 0)
    spot.position.set(1.02, 0.77, 0)
    spot.target = target
    return { spot, target }
  }, [])

  useEffect(() => {
    build.parts.forEach((p) => {
      p.group.userData.partId = p.id
      p.group.userData.basePos = p.basePos
    })
    build.root.add(beam.spot)
    build.root.add(beam.target)
    return () => {
      build.root.remove(beam.spot)
      build.root.remove(beam.target)
      build.dispose()
      beam.spot.dispose()
    }
  }, [build, beam])

  const keyLight = useRef<THREE.DirectionalLight>(null)
  const rimA = useRef<THREE.SpotLight>(null)
  const rimB = useRef<THREE.SpotLight>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const heat = useRef<THREE.PointLight>(null)
  const scan = useRef<THREE.SpotLight>(null)
  const scanTargetObj = useMemo(() => new THREE.Object3D(), [])
  const floorMat = useRef<THREE.MeshStandardMaterial>(null)
  const gridRef = useRef<THREE.GridHelper>(null)
  const gridMat = useMemo(
    () => new THREE.LineBasicMaterial({ transparent: true, opacity: 0, vertexColors: true }),
    [],
  )
  const fog = useMemo(() => new THREE.FogExp2(0x050607, 0.05), [])
  const appliedColorway = useRef(store.colorway)
  const camPos = useRef(new THREE.Vector3(2.05, 0.3, 0.75))
  const camLook = useRef(new THREE.Vector3(0.74, 0.36, 0))
  const lastT = useRef(-1)
  const bgCol = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    scene.fog = fog
    scan.current && (scan.current.target = scanTargetObj)
    return () => {
      scene.fog = null
      gridMat.dispose()
    }
  }, [scene, fog, gridMat, scanTargetObj])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const time = state.clock.elapsedTime
    const T = storyTime()

    /* ---- bike yaw first (camera framing follows the damped yaw) ---- */
    const yawTarget = sampleNumber(YAW_KEYS, T) + (T > 7.5 && !store.reduced ? Math.sin(time * 0.1) * 0.05 : 0)
    const k = store.reduced ? 1 : 1 - Math.exp(-dt * 5.5)
    build.root.rotation.y += (yawTarget - build.root.rotation.y) * k

    /* ---- camera ---- */
    const cam = cameraAt(T, build.root.rotation.y)
    camPos.current.lerp(cam.pos, k)
    camLook.current.lerp(cam.look, k)
    const px = camPos.current
    const lk = camLook.current
    let fx = px.x
    let fy = px.y
    let fz = px.z
    let fov = cam.fov
    if (mobile) {
      fx = lk.x + (px.x - lk.x) * 1.3
      fy = lk.y + (px.y - lk.y) * 1.3
      fz = lk.z + (px.z - lk.z) * 1.3
      fov += 7
    }
    if (!store.reduced && !mobile) {
      fx += store.px * 0.07
      fy += -store.py * 0.05
      fz += store.px * 0.03
    }
    camera.position.set(fx, fy, fz)
    camera.lookAt(lk)
    const persp = camera as THREE.PerspectiveCamera
    if (Math.abs(persp.fov - fov) > 0.02) {
      persp.fov += (fov - persp.fov) * k
      persp.fov = Math.max(20, Math.min(78, persp.fov))
      persp.updateProjectionMatrix()
    }

    /* ---- bike ---- */
    const E = explodeAt(T)
    const I = internalsAt(T)
    const c4 = store.c[4]
    const c5 = store.c[5]
    const c7 = store.c[7]

    const suspA = smoothstep((c4 - 0.02) / 0.06) * (1 - smoothstep((c4 - 0.27) / 0.06))
    const bump = store.reduced ? 0 : suspA * Math.max(0, Math.sin(time * 2.7)) * 0.038
    const brakeA = smoothstep((c4 - 0.3) / 0.06) * (1 - smoothstep((c4 - 0.56) / 0.06))
    const brakeHeat = brakeA * (0.35 + 0.65 * smoothstep((c4 - 0.3) / 0.2))
    const spin =
      smoothstep((c5 - 0.04) / 0.18) * 30 * (1 - smoothstep((c5 - 0.92) / 0.06)) +
      (c7 > 0.5 ? 2.6 : 0)

    const head = headlightAt(T, time)
    const tail = 0.3 + brakeA * 0.7 + (T > 7.1 ? 0.5 : 0)

    build.update({
      time,
      dt,
      explode: E,
      internals: I,
      headlight: head,
      taillight: tail,
      wheelSpin: store.reduced ? spin * 0.15 : spin,
      bump,
      brakeHeat,
      flow: I,
    })

    /* ---- lighting rig ---- */
    lightRigAt(T, _rig)
    if (keyLight.current) {
      keyLight.current.position.set(_rig.keyX, _rig.keyY, _rig.keyZ)
      keyLight.current.intensity = _rig.keyIntensity
      keyLight.current.color.setHex(_rig.keyColor)
    }
    if (rimA.current) {
      rimA.current.intensity = _rig.rimAIntensity
      rimA.current.color.setHex(_rig.rimAColor)
    }
    if (rimB.current) {
      rimB.current.intensity = _rig.rimBIntensity
      rimB.current.color.setHex(_rig.rimBColor)
    }
    if (amb.current) amb.current.intensity = _rig.ambient
    scene.environmentIntensity = _rig.env
    fog.color.setHex(_rig.fogColor)
    fog.density = _rig.fogDensity
    if (heat.current) heat.current.intensity = _rig.heat * 14

    if (Math.abs(T - lastT.current) > 0.0004) {
      lastT.current = T
      bgCol.setHex(_rig.bg as number)
      document.body.style.setProperty('--bg', '#' + bgCol.getHexString())
    }

    /* ---- CH01 scan sweep ---- */
    if (scan.current) {
      const c0 = store.c[0]
      const a = (1 - smoothstep((c0 - 0.62) / 0.25)) * smoothstep(c0 / 0.04)
      scan.current.intensity = a * 90
      scan.current.position.set(1.35 - c0 * 2.7, 2.15, 1.1)
      scanTargetObj.position.set(1.35 - c0 * 2.7, 0.4, 0)
      scan.current.visible = a > 0.01
    }
    /* ---- headlight beam ---- */
    beam.spot.intensity = head * 24

    /* ---- floor + grid ---- */
    if (floorMat.current) floorMat.current.opacity = smoothstep((T - 6.02) / 0.25)
    if (gridRef.current) {
      const g =
        smoothstep((T - 2.1) / 0.2) * (1 - smoothstep((T - 3.15) / 0.2)) * 0.2 +
        smoothstep((T - 4.8) / 0.08) * (1 - smoothstep((T - 4.98) / 0.1)) * 0.12 +
        smoothstep((T - 5.1) / 0.1) * (1 - smoothstep((T - 6.0) / 0.2)) * 0.16
      gridMat.opacity = g
      gridRef.current.visible = g > 0.005
    }

    /* ---- colourway ---- */
    if (appliedColorway.current !== store.colorway) {
      appliedColorway.current = store.colorway
      applyColorway(build.mats, store.colorway)
    }
  })

  return (
    <>
      <primitive object={build.root} />
      <Labels3D bikeRoot={build.root} />

      <ambientLight ref={amb} intensity={0.05} />
      <directionalLight ref={keyLight} position={[3, 4, 3]} intensity={14} />
      <spotLight ref={rimA} position={[-3.4, 2.2, -2.6]} angle={0.7} penumbra={0.9} intensity={12} distance={15} />
      <spotLight ref={rimB} position={[3.2, 1.6, 3.4]} angle={0.8} penumbra={0.9} intensity={8} distance={15} />
      <pointLight ref={heat} position={[0.16, 0.5, 0.25]} color={0xff5a2a} intensity={0} distance={2.4} />
      <spotLight
        ref={scan}
        color={0xeaf6ff}
        angle={0.17}
        penumbra={0.6}
        intensity={0}
        distance={8}
      />
      <primitive object={scanTargetObj} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[9, 9, 1]} color="#eef2f7" />
        <Lightformer form="rect" intensity={1.1} position={[-6, 1.4, -1]} rotation-y={Math.PI / 2} scale={[7, 2.6, 1]} color="#93a4b8" />
        <Lightformer form="rect" intensity={1.4} position={[6, 1.4, 1]} rotation-y={-Math.PI / 2} scale={[7, 2.6, 1]} color="#e8edf3" />
        <Lightformer form="rect" intensity={0.9} position={[0, 1.8, 6]} scale={[5, 1.6, 1]} color="#d7ff36" />
        <Lightformer form="rect" intensity={0.7} position={[0, 0.4, -6]} rotation-y={Math.PI} scale={[5, 1.2, 1]} color="#2547ff" />
        <Lightformer form="circle" intensity={1.6} position={[3, 3, 3]} scale={2} color="#ffffff" />
      </Environment>

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.6}
        scale={7.5}
        blur={2.4}
        far={1.8}
        resolution={mobile ? 256 : 512}
        color="#000000"
      />

      {/* reflective studio floor — chapters 07/08 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0005, 0]} visible={!mobile}>
        <circleGeometry args={[6.5, 48]} />
        <MeshReflectorMaterial
          ref={(m: unknown) => {
            floorMat.current = m as THREE.MeshStandardMaterial
          }}
          blur={[280, 60]}
          resolution={768}
          mixBlur={0.9}
          mixStrength={14}
          roughness={0.92}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0c0f"
          metalness={0.5}
          transparent
          opacity={0}
        />
      </mesh>

      <gridHelper ref={gridRef} args={[16, 32, 0x39424e, 0x20262d]} position={[0, 0.002, 0]} material={gridMat} />

      <Tunnel />
      {!mobile && <Dust />}
    </>
  )
}

/* ------------------------------------------------------------------ */

export function CanvasStage() {
  const [dprLevel, setDprLevel] = useState(0)
  return (
    <div id="stage" aria-hidden="true">
      <Canvas
        dpr={dprLevel === 0 ? [1, 2] : dprLevel === 1 ? [1, 1.5] : 1}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 34, near: 0.05, far: 60, position: [2.05, 0.3, 0.75] }}
        onCreated={() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!store.ready) {
                store.ready = true
                emit()
              }
            })
          })
        }}
      >
        <PerformanceMonitor onDecline={() => setDprLevel((l) => Math.min(2, l + 1))}>
          <SceneRig />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
