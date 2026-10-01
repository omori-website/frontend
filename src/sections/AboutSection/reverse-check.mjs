import assert from 'node:assert/strict'

// Run on the ready hero with normal motion enabled.
export default async function checkReverse(page) {
  await page.waitForSelector('.hero-scroll.is-ready')
  await page.evaluate(() => scrollTo(0, document.querySelector('.hero-stage').offsetHeight))
  await page.waitForSelector('#about:not(.is-preloading)')
  await page.click('.about-dialogue')
  await page.click('.about-dialogue')
  assert.match(await page.$eval('.about-dialogue', e => e.textContent), /Explore a strange world/)
  await page.click('.about-dialogue')
  const visibleBefore = await page.$eval('.about-dialogue-text', e => e.firstChild.textContent.length)
  await page.mouse.wheel({ deltaY: 200 })
  assert.equal(await page.evaluate(() => scrollY), 0)
  await page.mouse.wheel({ deltaY: -100 })
  await page.waitForFunction((before) => {
    const count = document.querySelector('.about-dialogue-text')?.firstChild.textContent.length
    return count > 0 && count < before
  }, {}, visibleBefore)
  await page.waitForFunction(() => document.querySelector('.about-dialogue')?.textContent.includes('psychological horror'))
  await page.keyboard.press('ArrowUp')
  await page.waitForSelector('.hero-scroll.is-ready')
  await page.waitForSelector('.hero-scroll:not(.is-leaving)')
  assert.equal(await page.$('.hero-loading'), null)
  await page.evaluate(() => scrollTo(0, document.querySelector('.hero-stage').offsetHeight))
  await page.waitForSelector('#about:not(.is-preloading)')
  for (let i = 0; i < 8 && await page.$('.about-dialogue'); i++) await page.click('.about-dialogue')
  await page.waitForSelector('.about-frames')
  await new Promise(resolve => setTimeout(resolve, 850))
  await page.keyboard.press('ArrowUp')
  const frame = await page.$eval('.about-frames', e => e.getAttribute('aria-label'))
  await new Promise(resolve => setTimeout(resolve, 600))
  assert.equal(await page.$eval('.about-frames', e => e.getAttribute('aria-label')), frame, 'Reversing must pause the frame sequence')
  for (let i = 0; i < 6 && await page.$('.about-frames'); i++) await page.keyboard.press('ArrowUp')
  await page.waitForSelector('.about-dialogue')
  assert.match(await page.$eval('.about-dialogue', e => e.textContent), /perhaps the fate/)
  await page.click('.about-dialogue')
  await page.waitForSelector('.site-navbar', { timeout: 6000 })
  await page.keyboard.press('ArrowUp')
  await page.waitForSelector('.about-frames')
  assert.match(await page.$eval('.about-frames', e => e.getAttribute('aria-label')), /frame 3/)
  // Continuous trackpad events must keep reversing without an idle gap.
  for (let i = 0; i < 28 && await page.$('.about-frames'); i++) {
    await page.mouse.wheel({ deltaY: -20 })
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  await page.waitForSelector('.about-dialogue', { timeout: 1000 })
  assert.match(await page.$eval('.about-dialogue', e => e.textContent), /perhaps the fate/)
}
