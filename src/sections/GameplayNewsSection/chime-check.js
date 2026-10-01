// On the news screen, run in the browser console:
// (await import('/src/sections/GameplayNewsSection/chime-check.js')).checkChime()
export async function checkChime() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) throw new Error('Enable motion before running the spin check')
  const chime = document.querySelector('.news-wind-chime')
  const card = document.querySelector('.news-carousel')
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const angle = () => {
    const matrix = new DOMMatrix(getComputedStyle(chime).transform)
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
  }
  const click = async (selector) => {
    document.querySelector(selector).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await new Promise(requestAnimationFrame)
    const animation = chime.getAnimations()[0]
    assert(animation, 'Navigation must start a spin')
    animation.pause()
    return animation
  }
  chime.getAnimations().forEach(animation => animation.cancel())
  const bounds = chime.getBoundingClientRect(), container = card.getBoundingClientRect()
  assert(bounds.top < container.bottom && bounds.bottom > container.bottom, 'Chime must overlap the bottom edge')
  assert(bounds.left < container.right && bounds.right > container.right, 'Chime must overlap the right corner')
  const right = await click('.news-arrow-next')
  const rotation = animation => animation.effect.getKeyframes().map(frame => Number(frame.transform.match(/rotate\(([-\d.]+)deg\)/)[1]))
  const [start, end] = rotation(right)
  assert(end - start >= 360 * 5, 'Right navigation must spin clockwise through many revolutions')
  right.currentTime = 480
  const before = angle()
  const left = await click('.news-arrow-previous')
  left.currentTime = 0
  assert(Math.abs(angle() - before) < 0.01, 'Reversing mid-spin must preserve the current orientation')
  const [leftStart, leftEnd] = rotation(left)
  assert(leftEnd - leftStart <= -360 * 5, 'Left navigation must spin counterclockwise through many revolutions')
  left.finish()
  assert(Math.abs(angle() - before) < 0.01, 'Completed revolutions must settle without a snap')
  return 'Chime placement, six-turn directional spins, reversal continuity, and settling passed'
}
