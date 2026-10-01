export async function checkLoading() {
  const hero = document.querySelector('.hero-scroll')
  if (!hero?.classList.contains('is-loading')) throw new Error('Run checkLoading while the initial loader is visible.')
  let previous = 0
  let sawComplete = false
  const deadline = performance.now() + 60000
  while (!hero.classList.contains('is-ready')) {
    if (performance.now() > deadline) throw new Error('Loader did not finish within 60 seconds.')
    if (hero.classList.contains('is-error')) throw new Error('Asset preload failed.')
    const value = Number(hero.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'))
    if (value < previous || value > 100) throw new Error('Progress must increase monotonically within 0–100.')
    if (document.documentElement.style.overflow !== 'hidden') throw new Error('Scrolling unlocked before the reveal finished.')
    if (hero.classList.contains('is-revealing') && value !== 100) throw new Error('Reveal started before every asset loaded.')
    if (hero.classList.contains('is-awaiting-start') && (value !== 100 || !hero.querySelector('.hero-start'))) throw new Error('Start must appear only after all assets load.')
    if (hero.classList.contains('is-loading')) {
      const camera = hero.querySelector('.hero-camera')
      const wire = getComputedStyle(camera, '::before')
      const wireTop = camera.getBoundingClientRect().top - parseFloat(wire.height)
      if (wireTop < innerHeight - 1) throw new Error('Bulb wire does not start below the loading viewport.')
    }
    sawComplete ||= value === 100
    previous = value
    await new Promise(requestAnimationFrame)
  }
  if (!sawComplete) throw new Error('Loader never displayed 100%.')
  if (hero.querySelector('[role="progressbar"]')) throw new Error('Counter remains after the reveal.')
  if (document.documentElement.style.overflow === 'hidden') throw new Error('Scrolling remains locked after the reveal.')
  if (getComputedStyle(hero.querySelector('.hero-camera')).transform !== 'none') throw new Error('Hero did not return to its original position.')
  return { progress: previous, state: 'ready' }
}
