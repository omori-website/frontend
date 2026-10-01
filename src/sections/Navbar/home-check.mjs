import assert from 'node:assert/strict'

// Run after the initial Start and dialogue have revealed the navigation.
export default async function checkHome(page) {
  await page.waitForSelector('.site-navbar')
  const timeOrigin = await page.evaluate(() => performance.timeOrigin)
  await page.click('.site-navbar-logo')
  await page.waitForSelector('.hero-scroll.is-revealing')
  const state = await page.evaluate(() => ({
    loader: !!document.querySelector('.hero-loading'),
    start: !!document.querySelector('.hero-start'),
    scroll: window.scrollY,
    timeOrigin: performance.timeOrigin,
  }))
  assert.equal(state.timeOrigin, timeOrigin, 'Home must replay without reloading')
  assert.equal(state.loader, false, 'Home must not replay initial loading')
  assert.equal(state.start, false, 'Home must not require Start again')
  assert.equal(state.scroll, 0)
  await page.waitForSelector('.hero-scroll.is-ready')
  assert.equal(await page.evaluate(() => document.documentElement.style.overflow === 'hidden'), false)
}
