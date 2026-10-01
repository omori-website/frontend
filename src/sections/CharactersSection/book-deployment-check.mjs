import assert from 'node:assert/strict'

// Run with a browser page showing the photobook after completing the dialogue.
export default async function checkBookDeployment(page) {
  const supported = await page.evaluate(() => {
    const gl = document.querySelector('.book-stage canvas').getContext('webgl2')
    const extension = gl.getExtension('WEBGL_lose_context')
    if (!extension) return false
    window.bookContextExtension = extension
    extension.loseContext()
    return true
  })
  assert.ok(supported, 'Context-loss extension required for this check')
  await page.waitForSelector('.book-status')
  assert.equal(await page.$eval('button[aria-label="Next page"]', button => button.disabled), true)
  await page.evaluate(() => window.bookContextExtension.restoreContext())
  await page.waitForFunction(() => !document.querySelector('.book-status'))
  await page.waitForFunction(() => !document.querySelector('button[aria-label="Next page"]').disabled)
  await page.evaluate(() => { delete window.bookContextExtension })
}
