import assert from 'node:assert/strict'

// Run on the dev server with a page containing the photobook section.
export default async function checkBookFraming(page) {
  const samples = await page.evaluate(async () => {
    const source = await (await fetch('/src/sections/CharactersSection/book-scene.ts')).text()
    const T = await import(source.match(/import \* as THREE from "([^"]+)"/)[1])
    const { mountBook } = await import('/src/sections/CharactersSection/book-scene.ts')
    const original = T.Object3D.prototype.lookAt
    const matchMedia = window.matchMedia
    window.matchMedia = query => {
      const media = matchMedia.call(window, query)
      if (query === '(prefers-reduced-motion: reduce)') Object.defineProperty(media, 'matches', { value: true })
      return media
    }
    let sample, poses = []
    T.Object3D.prototype.lookAt = function (...args) {
      original.apply(this, args)
      if (this.isPerspectiveCamera) { sample = { x: this.position.x, distance: this.position.y }; poses.push(sample) }
    }
    async function capture(width, height, page, flipOnly = false) {
      const host = document.createElement('div')
      host.style.cssText = `position:fixed;inset:0;width:${width}px;height:${height}px`
      document.querySelector('.characters-stage').append(host)
      let stop
      poses = []
      try {
        await new Promise((resolve, reject) => {
          stop = mountBook(host, { target: { current: page }, flipOnly: { current: flipOnly },
            immediate: { current: true }, photoOpen: { current: false }, onReady: resolve,
            onError: () => reject(new Error('Book load failed')), onOpen: () => {}, onTransition: () => {} })
        })
        return poses.at(-1)
      } finally { stop?.(); host.remove() }
    }
    try {
      return { left: await capture(390, 844, 1.25), right: await capture(390, 844, 1.7),
        turn: await capture(390, 844, 1.89), next: await capture(390, 844, 2),
        arrow: await capture(390, 844, 2, true), desktop: await capture(1280, 800, 1) }
    } finally { T.Object3D.prototype.lookAt = original; window.matchMedia = matchMedia }
  })
  assert.ok(samples.left.x < -0.85 && samples.left.distance < 8, 'Read left first')
  assert.ok(samples.right.x > 0.85 && samples.right.distance < 8, 'Pan to right before turning')
  assert.equal(samples.turn.x, 0, 'Center the spread while turning')
  assert.ok(samples.turn.distance > samples.right.distance * 1.8, 'Pull back before the flip')
  assert.ok(samples.next.x < -0.85, 'Next spread starts on the left')
  assert.equal(samples.desktop.x, 0, 'Desktop keeps the full spread')
  assert.equal(samples.arrow.x, 0, 'Arrow navigation stays centered')
  assert.ok(samples.arrow.distance > samples.next.distance * 1.8, 'Arrows do not zoom into reading mode')
  return samples
}
