import assert from 'node:assert/strict'

// Run on the dev-server Start screen with touch emulation already enabled.
export default async function checkMobileAudio(page, evaluate = page.evaluate.bind(page)) {
  await page.evaluateOnNewDocument(() => {
    const NativeContext = window.AudioContext
    window.AudioContext = class extends NativeContext {
      constructor(...args) {
        super(...args)
        window.audioCheckContext = this
      }
    }
  })
  await page.reload()
  await page.waitForSelector('.hero-start', { timeout: 30000 })
  await page.click('.hero-start')
  await evaluate(() => new Promise(resolve => {
    const context = window.audioCheckContext
    if (context.state === 'running') resolve()
    else context.addEventListener('statechange', () => { if (context.state === 'running') resolve() })
  }))
  await page.waitForSelector('.hero-scroll.is-ready', { timeout: 10000 })
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.hero-stage').offsetHeight))
  await page.waitForSelector('#about:not(.is-preloading)', { timeout: 10000 })
  await page.waitForFunction(() => document.querySelector('.about-dialogue-unrevealed').textContent === '')
  await evaluate(() => window.audioCheckContext.suspend())
  await page.click('.about-dialogue')
  await evaluate(() => new Promise(resolve => {
    const context = window.audioCheckContext
    if (context.state === 'running') resolve()
    else context.addEventListener('statechange', () => { if (context.state === 'running') resolve() })
  }))
  await page.waitForFunction(() => document.querySelector('.about-dialogue-unrevealed').textContent === '')
  const samples = await evaluate(async () => {
    const { dialogueSounds, preloadSound } = await import('/src/sections/AboutSection/dialogue-audio.ts')
    const buffer = await preloadSound(dialogueSounds[1])
    const analyser = window.audioCheckContext.createAnalyser()
    const source = window.audioCheckContext.createBufferSource()
    source.buffer = buffer
    source.connect(analyser)
    analyser.connect(window.audioCheckContext.destination)
    const data = new Float32Array(analyser.fftSize)
    const started = window.audioCheckContext.currentTime
    source.start()
    let peak = 0
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 50))
      analyser.getFloatTimeDomainData(data)
      for (const sample of data) peak = Math.max(peak, Math.abs(sample))
    }
    source.stop()
    source.disconnect()
    analyser.disconnect()
    return { peak, elapsed: window.audioCheckContext.currentTime - started }
  })
  assert.ok(samples.peak > 0.01, 'Recovered effects generate non-silent output')
  assert.ok(samples.elapsed > 0.4, 'Recovered audio clock advances')
  return samples
}
