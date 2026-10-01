import { dialogueSounds, preloadSound } from '../AboutSection/dialogue-audio'
import snapSound from '../../music/SE_snap.ogg'

const assets = Object.entries(import.meta.glob<string>([
  '../../assets/**/*',
  '../../music/**/*.{mp3,ogg,wav,m4a,aac,flac,opus,weba}',
], {
  eager: true,
  query: '?url',
  import: 'default',
}))

let pending: Promise<void> | undefined
let completed = 0
const listeners = new Set<(progress: number) => void>()

export function preloadAssets(onProgress: (progress: number) => void) {
  listeners.add(onProgress)
  onProgress(Math.floor(completed / assets.length * 100))

  pending ??= Promise.all(assets.map(async ([path, url]) => {
    if (url === snapSound || dialogueSounds.includes(url)) {
      await preloadSound(url)
    } else if (/\.(png|webp|jpe?g|gif|svg|avif)$/i.test(path)) {
      const image = new Image()
      image.src = url
      try {
        await image.decode()
      } catch (error) {
        if (!path.endsWith('/gameplay-news-bg.webp')) throw error
        console.error('Unable to preload gameplay background', error)
      }
    } else {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`)
      await response.arrayBuffer()
      if (/\.(ttf|otf|woff2?)$/i.test(path)) await document.fonts.load('16px OMORI')
    }
    completed += 1
    const progress = Math.floor(completed / assets.length * 100)
    listeners.forEach((listener) => listener(progress))
  })).then(() => {})

  return {
    ready: pending,
    unsubscribe: () => listeners.delete(onProgress),
  }
}
