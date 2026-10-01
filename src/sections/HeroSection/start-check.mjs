import assert from 'node:assert/strict'

// Run on a fresh visit, before clicking Start.
export default async function checkStart(page) {
  await page.waitForSelector('.hero-start', { timeout: 60000 })
  assert.equal(await page.$eval('[role="progressbar"]', e => e.getAttribute('aria-valuenow')), '100')
  await new Promise(resolve => setTimeout(resolve, 500))
  assert.ok(await page.$('.hero-scroll.is-awaiting-start'), 'Reveal must wait for Start')
  assert.equal(await page.$eval('audio', e => e.paused), true)
  await page.click('.hero-start')
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio')
    return !audio.paused && !audio.muted && audio.volume > 0
  })
  await page.waitForSelector('.hero-scroll.is-ready')
  assert.equal(await page.$('.hero-start'), null)
}
