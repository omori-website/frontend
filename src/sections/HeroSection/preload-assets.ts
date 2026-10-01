const assets = Object.entries(import.meta.glob<string>('../../assets/**/*', {
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
    if (/\.(png|webp|jpe?g|gif|svg|avif)$/i.test(path)) {
      const image = new Image()
      image.src = url
      await image.decode()
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
