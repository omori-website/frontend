import assert from 'node:assert/strict'

// Run with the first message fully revealed and audio unlocked by Start.
export default async function checkDialogueAudio(page) {
  await page.waitForFunction(() => document.querySelector('.about-dialogue-unrevealed').textContent === '')
  await page.evaluate(() => {
    const script = document.createElement('script')
    script.textContent = `
      (async () => {
        const original = AudioBufferSourceNode.prototype.start;
        const starts = [];
        AudioBufferSourceNode.prototype.start = function(...args) {
          starts.push({time: performance.now(), duration: this.buffer.duration});
          return original.apply(this, args);
        };
        try {
          const results = [];
          for (let clip = 3; clip <= 5; clip++) {
            const before = performance.now();
            document.querySelector('.about-dialogue').click();
            const samples = [];
            for (let i = 0; i < 18; i++) {
              await new Promise(resolve => setTimeout(resolve, 100));
              const text = document.querySelector('.about-dialogue-text');
              samples.push({visible: text.firstChild.textContent.length, total: text.textContent.length});
            }
            results.push({clip, delay: starts.at(-1).time - before, samples});
          }
          document.documentElement.dataset.dialogueCheck = JSON.stringify(results);
        } catch(error) {
          document.documentElement.dataset.dialogueCheck = JSON.stringify({error: error.message});
        } finally { AudioBufferSourceNode.prototype.start = original; }
      })();`
    document.head.append(script)
    script.remove()
  })
  await page.waitForFunction(() => document.documentElement.dataset.dialogueCheck)
  const results = await page.evaluate(() => JSON.parse(document.documentElement.dataset.dialogueCheck))
  assert.ok(Array.isArray(results), JSON.stringify(results))
  for (const result of results) {
    assert.ok(result.delay < 100, 'Predecoded clip starts without media startup delay')
    for (let i = 1; i < result.samples.length; i++) {
      const previous = result.samples[i - 1]
      if (previous.visible < previous.total) assert.ok(result.samples[i].visible > previous.visible, 'No middle typing pause')
    }
    assert.equal(result.samples.at(-1).visible, result.samples.at(-1).total)
  }
  return results.map(({clip, delay}) => ({clip, delay}))
}
