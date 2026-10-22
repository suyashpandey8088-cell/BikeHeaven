# APEX — The Anatomy of a Superbike

A scroll-driven cinematic study of a fictional concept superbike, built as a
single continuous WebGL journey: eight pinned chapters, one persistent canvas,
a camera that never cuts.

> **APEX is a fictional machine.** Every number on this site is a *concept
> specification* — a design study, not a claim about any real motorcycle.

---

## The journey

| # | Chapter | What happens |
|---|---------|--------------|
| 01 | **The Arrival** | Dark reveal — light sweep, headlight flash, the machine assembled from fragments. *ENGINEERED TO DEFY. / BUILT FOR THE EDGE.* |
| 02 | **Form in Motion** | Turntable pass, rim light, annotated geometry. *FORM FOLLOWS FORCE.* |
| 03 | **The Machine Comes Apart** | The signature moment: a real exploded view. Every panel, wheel and component lifts away on its own vector — and reverse scroll restores every one. *NOTHING HERE IS ACCIDENTAL.* |
| 04 | **Heart of the Machine** | Dive into the engine. Bodywork fades to x-ray, pistons, rods and crank animate on the real kinematics, lighting shifts red-orange → titanium. *POWER IS NOT A NUMBER. / IT IS A SYSTEM.* |
| 05 | **Anatomy of Control** | Four macro studies — suspension, brakes, tyres, chassis — each with its own scene, headline and technical measure overlay. |
| 06 | **Speed, Measured** | Tunnel motion, oversized counters and a dense data grid. The numbers are the cinematography. |
| 07 | **Light, Material, Identity** | Reflective studio floor, material close-ups, three selectable colourways. |
| 08 | **The Full Reveal** | Reassembly into a closing orbit. *APEX. / BUILT BEYOND ORDINARY.* CTAs: replay the journey or open the technical blueprint. |

Scroll drives **everything**: camera, bike rotation, explosion, lighting,
copy. Scrolling back restores each state — nothing snaps.

## Art direction

Dark maximalist luxury: obsidian, graphite, titanium and chrome with an
acid-lime accent; red and blue reserved for dramatic beats. Oversized,
tightly-tracked display type (Anton) against technical mono (JetBrains Mono)
and grotesk body (Space Grotesk). Registration marks, gridlines, coordinate
labels and crosshairs throughout.

## The machine

There is **no downloaded 3D model**. The bike is generated procedurally in
code — 11 component groups (frame, engine with animated internals, exhaust,
fairing, tank, tail, forks, both wheels, brakes, swingarm) built from parametric
geometry and PBR materials. The exploded view animates the actual component
meshes along authored vectors with staggered timing — no fading stand-ins.

## Engineering

- **React 19 + TypeScript + Vite** — strict mode, zero `any` in app code.
- **React Three Fiber + Drei** — one persistent canvas layered under the DOM.
- **Three.js r186** — procedural geometry, 18 shared PBR materials, reflective
  floor, volumetric-feel tunnel and dust via points/instancing.
- **GSAP + ScrollTrigger** — chapter pinning and timeline choreography.
- **Lenis** — inertial scroll, integrated with ScrollTrigger (fine pointers,
  non-reduced motion only; native scroll otherwise).
- **Synthesized WebAudio** — engine sound generated live (no audio files),
  muted by default, never autoplays, one toggle.
- **No layout libraries** — CSS for all typography and layout.

### Camera system

39 authored keyframes define shots *relative to the bike* (look target,
distance, azimuth, elevation, FOV). Yaw of the machine and the camera share one
damped clock, so framing stays locked through every turntable move. Shots were
verified offline: `tools/framing.ts` audits NDC coverage of the whole machine
per keyframe, and `tools/shots.ts` renders per-part ASCII compositions of the
key moments.

### Accessibility & resilience

- `prefers-reduced-motion` — damping off, animations minimised, Lenis off.
- Keyboard-operable nav, skip link, focus styles, ARIA labels.
- Honest loading screen (real init steps, no fake progress).
- WebGL unsupported → graceful fallback page, site copy still readable.
- Mobile/tablet: recomposed camera pull-back + FOV, lighter scene (no
  reflector/dust), touch-first layout.

## Development

```bash
npm install
npm run dev        # vite dev server
npm run build      # tsc --noEmit && vite build
npm run preview    # serve the production build
```

### Verification toolchain (no browser needed)

```bash
npx tsx tools/parts.ts     # 4 orthographic part-maps — geometry sanity
npx tsx tools/analyze.ts   # landmark positions vs theory
npx tsx tools/framing.ts   # camera framing audit (NDC coverage per keyframe)
npx tsx tools/shots.ts     # per-part ASCII composition of key shots
npx tsx tools/smoke.tsx    # jsdom smoke: 14 assertions over the real app tree
npm run render:preview     # offline software-rendered contact sheet (BMP)
```

## Concept specification

APEX is a design study. Headline figures — 999 cm³ inline-four, 217 PS @
12,600 rpm, 118 Nm @ 10,900 rpm, 187 kg kerb, 0–100 km/h in 2.9 s, 299 km/h
electronic limiter — are simulated targets labelled as such everywhere they
appear. The full grid lives in the site's blueprint view.

---

Built as a single-page cinematic experience. Scroll slowly.
