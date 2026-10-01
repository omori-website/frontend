import assert from 'node:assert/strict'

// Run on the ready hero; scroll only, without a wheel or scrollend trigger.
export default async function checkDoor(page) {
  await page.waitForSelector('.hero-scroll.is-ready')
  await page.evaluate(() => {
    const stage = document.querySelector('.hero-stage')
    window.scrollTo(0, stage.offsetHeight - 20)
  })
  await page.waitForFunction(() => window.scrollY > 0)
  assert.equal(await page.$('.hero-scroll.is-entering'), null, 'Door entry must wait until the door opens')
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.hero-stage').offsetHeight))
  await page.waitForSelector('#about:not(.is-preloading)', { timeout: 2000 })
  assert.equal(await page.$('.hero-scroll'), null, 'Scrolling to the open door must complete entry without another gesture')
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('about-dialogue')), true)
}
