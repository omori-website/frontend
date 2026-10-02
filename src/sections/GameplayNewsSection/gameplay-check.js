// Hover a gameplay card, then run this in the browser console.
export async function checkGameplay() {
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const media = [...document.querySelectorAll('.gameplay-media')]
  assert(media.length === 4, 'All four gameplay previews must exist')
  for (const container of media) {
    const frame = container.getBoundingClientRect()
    for (const image of container.querySelectorAll('img')) {
      await image.decode()
      const bounds = image.getBoundingClientRect()
      assert(Math.abs(bounds.width - frame.width) < 1 && Math.abs(bounds.height - frame.height) < 1,
        'Still and animated images must fill their frame')
      assert(getComputedStyle(image).objectFit === 'cover', 'Images must preserve aspect ratio while filling')
    }
    const animation = container.querySelector('.gameplay-animation')
    assert(getComputedStyle(container).filter === (animation ? 'none' : 'grayscale(1)'),
      'Only playing previews may be colored')
    if (!animation) {
      const response = await fetch(container.querySelector('img').src)
      const bytes = new Uint8Array(await response.arrayBuffer())
      const view = new DataView(bytes.buffer)
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const chunk = String.fromCharCode(...bytes.slice(offset, offset + 4))
        assert(chunk !== 'ANIM' && chunk !== 'ANMF', 'Idle WebP must contain no animation')
        const size = view.getUint32(offset + 4, true)
        offset += 8 + size + (size % 2)
      }
    }
  }
  return 'Four previews fill their frames without distortion; idle images are static and grayscale'
}

// Run with touch emulation on the gameplay screen, after the intro unlocks scrolling.
export async function checkMobileGameplay() {
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  assert(!matchMedia('(hover: hover) and (pointer: fine)').matches, 'Use a touch device')
  assert(!matchMedia('(prefers-reduced-motion: reduce)').matches, 'Enable motion for this check')
  const panels = [...document.querySelectorAll('.gameplay-panel')]
  for (const panel of panels) {
    panel.scrollIntoView({ block: 'center', behavior: 'instant' })
    await new Promise(resolve => setTimeout(resolve, 250))
    const bounds = panel.getBoundingClientRect()
    assert(bounds.top < innerHeight / 2 && bounds.bottom > innerHeight / 2, 'Card must cross viewport center')
    assert(panel.querySelector('.gameplay-animation'), 'Centered card must animate')
    assert(getComputedStyle(panel.querySelector('.gameplay-media')).filter === 'none', 'Centered card must be colored')
    assert(panels.every(other => other === panel || !other.querySelector('.gameplay-animation')), 'Other cards must remain static')
  }
  document.querySelector('#news').scrollIntoView({ block: 'center', behavior: 'instant' })
  await new Promise(resolve => setTimeout(resolve, 250))
  assert(!document.querySelector('.gameplay-animation'), 'Leaving gameplay must stop all previews')
  return 'All four centered touch previews animate exclusively and stop outside gameplay'
}
