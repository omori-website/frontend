// Run checkMusic('white-space'), checkMusic('silent'), or checkMusic('tulip') at the corresponding screen.
export async function checkMusic(phase) {
  if (!['white-space', 'silent', 'tulip'].includes(phase)) throw new Error('Unknown music phase')
  const audio = document.querySelector('audio')
  if (!audio) throw new Error('Missing soundtrack player')
  // Allow the outgoing 600ms transition to finish before checking steady-state silence.
  if (phase === 'silent') await new Promise((resolve) => setTimeout(resolve, 650))
  if (phase === 'silent') {
    if (audio.getAttribute('src') || !audio.paused) throw new Error('Black dialogue must be silent')
    return { phase, silent: true }
  }
  const title = phase === 'white-space' ? '002 WHITE SPACE' : '013 A Home For Flowers (Tulip)'
  if (!decodeURI(audio.currentSrc).includes(title) || !audio.loop || audio.paused) throw new Error(`Expected looping ${title}; enable music if autoplay is blocked`)
  const before = audio.currentTime
  await new Promise((resolve) => setTimeout(resolve, 300))
  if (audio.currentTime <= before) throw new Error('Music is not advancing')
  return { phase, playing: true, loop: audio.loop }
}
