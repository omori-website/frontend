import assert from 'node:assert/strict'

// Run after clicking Start; exercises the real reveal animation and its replay.
export default async function checkSnap(page) {
  await page.evaluate(() => {
    delete document.documentElement.dataset.snapCheck
    const script = document.createElement('script')
    script.textContent = `
      (async () => {
        const section = document.querySelector('#characters');
        const stage = section.querySelector('.characters-stage');
        const about = section.closest('.about-section');
        const classes = [section.className, about.className];
        const originalStart = AudioBufferSourceNode.prototype.start;
        const starts = [];
        AudioBufferSourceNode.prototype.start = function (...args) {
          starts.push({ state: this.context.state, buffer: this.buffer, time: performance.now() });
          return originalStart.apply(this, args);
        };
        try {
          about.classList.remove('is-preloading');
          const results = [];
          for (let replay = 0; replay < 3; replay++) {
            section.classList.add('is-preloading');
            void stage.offsetWidth;
            const before = starts.length;
            const reveal = performance.now();
            section.classList.remove('is-preloading');
            await new Promise(resolve => setTimeout(resolve, 500));
            results.push(starts.slice(before).map(({ state, buffer, time }) => ({
              state, delay: time - reveal,
              audible: buffer.getChannelData(0).some(sample => Math.abs(sample) > 0.01),
            })));
          }
          document.documentElement.dataset.snapCheck = JSON.stringify(results);
        } catch (error) {
          document.documentElement.dataset.snapCheck = JSON.stringify({error: error.message});
        } finally {
          AudioBufferSourceNode.prototype.start = originalStart;
          section.className = classes[0];
          about.className = classes[1];
        }
      })();`
    document.head.append(script)
    script.remove()
  })
  await page.waitForFunction(() => document.documentElement.dataset.snapCheck)
  const results = await page.evaluate(() => JSON.parse(document.documentElement.dataset.snapCheck))
  assert.ok(Array.isArray(results), JSON.stringify(results))
  for (const sounds of results) {
    assert.equal(sounds.length, 1, 'Each reveal must play exactly one snap')
    assert.equal(sounds[0].state, 'running', 'Snap uses the Start-unlocked context')
    assert.ok(sounds[0].audible, 'Snap buffer contains audible samples')
    assert.ok(sounds[0].delay < 100, 'Predecoded snap starts with the shake')
  }
  return results
}
