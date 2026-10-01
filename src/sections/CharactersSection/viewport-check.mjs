import assert from 'node:assert/strict'

// Run on the ready hero, before door entry, with motion enabled.
export default async function checkViewport(page) {
  for (const height of [633, 844, 633]) {
    await page.setViewport({ width: 390, height })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForFunction(() => document.querySelector('.hero-stage').getBoundingClientRect().height >= innerHeight)
  }
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.hero-stage').offsetHeight))
  await page.waitForSelector('#about:not(.is-preloading)', { timeout: 10000 })
  const dialogueHeight = await page.$eval('#about', e => e.getBoundingClientRect().height)
  assert.ok(dialogueHeight >= 633, 'Dialogue covers the viewport')
  for (let i = 0; i < 8 && await page.$('.about-dialogue'); i++) await page.click('.about-dialogue')
  await page.waitForSelector('#characters:not(.is-preloading)', { timeout: 10000 })
  await page.waitForFunction(() => !document.querySelector('.characters-stage').getAnimations().some(animation => animation.animationName === 'characters-reveal' && animation.playState === 'running'))
  for (const height of [633, 844, 633]) {
    await page.setViewport({ width: 390, height })
    await page.waitForFunction(() => {
      const stage = document.querySelector('.characters-stage').getBoundingClientRect()
      const canvas = document.querySelector('.book-stage canvas').getBoundingClientRect()
      return stage.height >= innerHeight && canvas.height >= innerHeight
    })
    const coverage = await page.evaluate(() => {
      const stage = document.querySelector('.characters-stage').getBoundingClientRect()
      const background = document.querySelector('.characters-background').getBoundingClientRect()
      const canvas = document.querySelector('.book-stage canvas').getBoundingClientRect()
      return { stage: stage.height, background: background.height, canvas: canvas.height, width: background.width }
    })
    assert.ok(coverage.background >= height, 'Character artwork covers the expanded viewport')
    assert.ok(coverage.width >= 390, 'Character artwork covers the viewport width')
    assert.ok(coverage.canvas >= height, 'Shared gameplay/news canvas covers the expanded viewport')
  }
}
