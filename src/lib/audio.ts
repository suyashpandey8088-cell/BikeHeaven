/**
 * APEX — optional sound layer.
 * Fully synthesised with WebAudio (no assets, no network). Muted by default;
 * the experience is complete without it.
 */

export interface EngineAudio {
  setMuted: (muted: boolean) => void
  dispose: () => void
}

export function createEngineAudio(): EngineAudio | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null

  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let running = false
  let disposed = false

  function build() {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    // low engine rumble: two detuned saws through a lowpass
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 220
    lp.Q.value = 0.8
    lp.connect(master)

    const o1 = ctx.createOscillator()
    o1.type = 'sawtooth'
    o1.frequency.value = 42
    const o2 = ctx.createOscillator()
    o2.type = 'sawtooth'
    o2.frequency.value = 84.6
    const og = ctx.createGain()
    og.gain.value = 0.16
    o1.connect(og)
    o2.connect(og)
    og.connect(lp)

    // slow LFO breathing on the filter
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.13
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 60
    lfo.connect(lfoGain)
    lfoGain.connect(lp.frequency)

    // filtered noise bed (air)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuf
    noise.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 520
    bp.Q.value = 0.6
    const ng = ctx.createGain()
    ng.gain.value = 0.012
    noise.connect(bp)
    bp.connect(ng)
    ng.connect(master)

    o1.start()
    o2.start()
    lfo.start()
    noise.start()
  }

  function ignition() {
    // short mechanical startup blip when sound is enabled
    if (!ctx || !master) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.setValueAtTime(120, t)
    o.frequency.exponentialRampToValueAtTime(38, t + 0.55)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    o.connect(g)
    g.connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.75)
  }

  return {
    setMuted(muted: boolean) {
      if (disposed) return
      if (!muted) {
        if (!ctx) {
          try {
            build()
          } catch {
            disposed = true
            return
          }
        }
        if (!ctx || !master) return
        void ctx.resume()
        if (!running) {
          ignition()
          running = true
        }
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.setTargetAtTime(0.055, ctx.currentTime, 0.6)
      } else if (ctx && master) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
      }
    },
    dispose() {
      disposed = true
      if (ctx) void ctx.close()
      ctx = null
      master = null
    },
  }
}
