export const MOBILE_BOOK = '(max-width: 640px) and (orientation: portrait)'

export function readingPose(progress: number, mobile: boolean, pose: { page: number; x: number; zoom: number }) {
  pose.page = progress
  pose.x = pose.zoom = 0
  if (!mobile || progress >= 7) return
  const page = Math.floor(progress)
  const phase = progress - page
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value))
    return t * t * (3 - 2 * t)
  }
  if (page === 0) {
    pose.page = smooth(phase / 0.7)
    pose.zoom = smooth((phase - 0.7) / 0.3)
    pose.x = -0.92 * pose.zoom
  } else if (phase <= 0.45) {
    pose.page = page
    pose.zoom = 1
    pose.x = -0.92 + 1.84 * smooth((phase - 0.32) / 0.13)
  } else if (phase <= 0.77) {
    pose.page = page
    pose.zoom = 1
    pose.x = 0.92
  } else if (phase <= 0.84) {
    pose.page = page
    pose.zoom = 1 - smooth((phase - 0.77) / 0.07)
    pose.x = 0.92 * pose.zoom
  } else if (phase <= 0.94) {
    pose.page = page + smooth((phase - 0.84) / 0.1)
  } else {
    pose.page = page + 1
    pose.zoom = page < 6 ? smooth((phase - 0.94) / 0.06) : 0
    pose.x = -0.92 * pose.zoom
  }
}

export function readingStep(progress: number, direction: number, mobile: boolean) {
  const pose = { page: progress, x: 0, zoom: 0 }
  readingPose(progress, mobile, pose)
  return Math.max(0, Math.min(7, Math.round(pose.page) + direction))
}

export function advanceFlip(state: { page: number; from: number; to: number; started: number; active: boolean }, target: number, time: number, ready: boolean, instant: boolean) {
  const destination = Math.max(0, Math.min(7, Math.round(target)))
  if (instant) {
    state.page = state.from = state.to = destination
    state.active = false
    return
  }
  if (!state.active && ready && state.page !== destination) {
    state.from = state.page
    state.to = state.page + Math.sign(destination - state.page)
    state.started = time
    state.active = true
  }
  if (state.active) {
    const t = Math.max(0, Math.min(1, (time - state.started) / 750))
    state.page = state.from + (state.to - state.from) * t * t * (3 - 2 * t)
    if (t === 1) state.active = false
  }
}
