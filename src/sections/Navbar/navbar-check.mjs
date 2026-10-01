import assert from 'node:assert/strict'

// Run with a browser page after completing the opening dialogue.
export default async function checkNavbar(page) {
  await page.waitForSelector('.site-navbar')
  await page.evaluate(() => {
    document.activeElement?.blur()
    window.scrollTo(0, 500)
  })
  await page.waitForFunction(() => document.querySelector('.site-navbar').classList.contains('is-hidden'))
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForFunction(() => !document.querySelector('.site-navbar').classList.contains('is-hidden'))
  await page.focus('.site-navbar a')
  await page.evaluate(() => window.scrollTo(0, 600))
  await page.waitForFunction(() => window.scrollY === 600)
  assert.equal(await page.evaluate(() => document.querySelector('.site-navbar').classList.contains('is-hidden')), false)
  await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0) })
  await page.waitForFunction(() => !document.querySelector('.site-navbar').classList.contains('is-hidden'))
}
