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
