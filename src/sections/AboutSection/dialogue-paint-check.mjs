import assert from 'node:assert/strict'

// Run after Start and entry into the dialogue, with reduced motion disabled.
export default async function checkDialoguePaint(page) {
  await page.waitForFunction(() => document.querySelector('.about-dialogue-unrevealed')?.textContent === '')
  for (let message = 1; message < 4; message++) {
    await page.click('.about-dialogue')
    const result = await page.evaluate(async () => {
      let partial = false
      let exposed = false
      let finished = false
      const deadline = performance.now() + 3000
      while (performance.now() < deadline) {
        await new Promise(requestAnimationFrame)
        const text = document.querySelector('.about-dialogue-text')
        const remainder = text.querySelector('.about-dialogue-unrevealed')
        const visible = text.firstChild?.nodeType === Node.TEXT_NODE ? text.firstChild.textContent.length : 0
        if (!remainder.textContent) { finished = true; break }
        partial ||= visible > 0
        exposed ||= remainder.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      }
      return { partial, exposed, finished }
    })
    assert.ok(result.partial, `Message ${message + 1} reveals progressively`)
    assert.equal(result.exposed, false, `Message ${message + 1} never paints unrevealed text`)
    assert.ok(result.finished, `Message ${message + 1} finishes revealing`)
  }
}
