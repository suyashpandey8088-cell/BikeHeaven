/**
 * APEX — jsdom smoke test.
 * Renders the full App (WebGL disabled path) and verifies the chapter
 * structure mounts, scroll handlers run and interactions work without
 * runtime exceptions. Run: npx tsx tools/smoke.ts
 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

const g = globalThis as unknown as Record<string, unknown>
g.window = dom.window
g.document = dom.window.document
try {
  g.navigator = dom.window.navigator
} catch {
  // node defines navigator as a getter — jsdom's is close enough
}
g.HTMLElement = dom.window.HTMLElement
g.HTMLCanvasElement = dom.window.HTMLCanvasElement
g.SVGElement = dom.window.SVGElement
g.Element = dom.window.Element
g.Node = dom.window.Node
g.getComputedStyle = dom.window.getComputedStyle
g.requestAnimationFrame = (cb: FrameRequestCallback) => dom.window.setTimeout(() => cb(performance.now()), 16)
g.cancelAnimationFrame = (id: number) => dom.window.clearTimeout(id)

// no WebGL in jsdom → App must take its fallback path
dom.window.HTMLCanvasElement.prototype.getContext = () => null

dom.window.matchMedia = (query: string) => ({
  matches: /pointer:\s*coarse/.test(query),
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
}) as unknown as MediaQueryList
g.matchMedia = dom.window.matchMedia

const scrolls: number[] = []
dom.window.scrollTo = ((opts?: { top?: number }) => {
  scrolls.push(opts?.top ?? 0)
}) as unknown as typeof window.scrollTo
g.scrollTo = dom.window.scrollTo

async function main() {
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { act } = React as unknown as { act: (fn: () => Promise<void> | void) => Promise<void> }
  const { default: App } = await import('../src/App')

  const root = createRoot(document.getElementById('root')!)
  await act(async () => {
    root.render(<App />)
  })

  // let loaders/timers settle
  await new Promise((r) => setTimeout(r, 1400))

  const chapters = document.querySelectorAll('.chapter')
  const labels: string[] = []
  chapters.forEach((c) => labels.push(c.getAttribute('aria-label') || ''))
  console.log('chapters mounted:', chapters.length)
  labels.forEach((l) => console.log('  ·', l))

  const assertions: [string, boolean][] = [
    ['8 chapters', chapters.length === 8],
    ['nav present', !!document.getElementById('nav')],
    ['rail present', !!document.getElementById('rail')],
    ['loader present initially', !!document.getElementById('loader')],
    ['CTA buttons present', document.querySelectorAll('.cta').length >= 2],
    ['colorway buttons present', document.querySelectorAll('.cw-btn').length === 3],
    ['spec grid rows present', document.querySelectorAll('.datagrid__row').length >= 5],
    ['no-webgl note shown', !!document.querySelector('.no-webgl-note')],
  ]

  // open blueprint via SPECIFICATIONS nav link
  const specBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'SPECIFICATIONS')
  if (specBtn) {
    await act(async () => {
      specBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    assertions.push(['blueprint opens', !!document.querySelector('#blueprint.open')])
    assertions.push(['blueprint has spec cells', document.querySelectorAll('.bp__cell').length >= 10])
    assertions.push(['blueprint has parts', document.querySelectorAll('.bp__part').length === 11])
    // close it
    const close = document.querySelector('#blueprint [aria-label="Close technical blueprint"]') as HTMLButtonElement | null
    await act(async () => {
      close?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    assertions.push(['blueprint closes', !document.querySelector('#blueprint.open')])
  } else {
    assertions.push(['SPECIFICATIONS button exists', false])
  }

  // restart CTA triggers scroll to top
  const restart = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('EXPLORE THE MACHINE AGAIN'))
  if (restart) {
    await act(async () => {
      restart.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
  }
  assertions.push(['restart scrolls to top', scrolls.length > 0 && scrolls[scrolls.length - 1] === 0])

  // simulate a scroll event — handlers must not throw
  let scrollOk = true
  try {
    dom.window.dispatchEvent(new dom.window.Event('scroll'))
    await new Promise((r) => setTimeout(r, 120))
  } catch (e) {
    scrollOk = false
    console.error('scroll handler threw', e)
  }
  assertions.push(['scroll handlers safe', scrollOk])

  let failed = 0
  for (const [name, ok] of assertions) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
    if (!ok) failed++
  }
  console.log(failed === 0 ? 'SMOKE OK' : `SMOKE FAILED (${failed})`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('SMOKE CRASHED:', e)
  process.exit(1)
})
