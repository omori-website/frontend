import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import WebGL from 'three/addons/capabilities/WebGL.js'
import './HeroSection.css'
import heroLogo from '../../assets/hero-section/hero-logo.png'
import heroWhitespace from '../../assets/hero-section/hero-whitespace.png'
import { preloadAssets } from './preload-assets'
import { unlockAudio } from '../AboutSection/dialogue-audio'

type HeroSectionProps = {
  onComplete?: () => void
  returning?: boolean
  replay?: boolean
  onMusicStart: () => void
  onMusicEnd: () => void
}

function HeroSection({ onComplete, onMusicStart, onMusicEnd, returning = false, replay = false }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entering, setEntering] = useState(false)
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(() => returning && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState<'loading' | 'awaiting-start' | 'graphics-required' | 'revealing' | 'ready' | 'error'>(returning ? 'ready' : 'loading')

  useEffect(() => {
    if (!replay) return
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setLoading(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ready' : 'revealing'))
    })
    return () => cancelAnimationFrame(frame)
  }, [replay])

  useLayoutEffect(() => {
    if (loading === 'ready' && !entering && !leaving) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    if (loading !== 'ready') window.scrollTo(0, 0)
    return () => { document.documentElement.style.overflow = previousOverflow }
  }, [loading, entering, leaving])

  useLayoutEffect(() => {
    if (!returning) return
    window.scrollTo(0, (sectionRef.current?.querySelector<HTMLDivElement>('.hero-stage')?.offsetHeight ?? 0) * 0.8)
  }, [returning])

  useEffect(() => {
    if (returning || replay) return
    let active = true
    const preload = preloadAssets(setProgress)
    preload.ready.then(() => {
      if (!active) return
      setLoading(WebGL.isWebGL2Available() ? 'awaiting-start' : 'graphics-required')
    }).catch((error: unknown) => {
      if (!active) return
      console.error(error)
      setLoading('error')
    })
    return () => {
      active = false
      preload.unsubscribe()
    }
  }, [returning, replay])


  useEffect(() => {
    if (loading !== 'ready' || entering || leaving) return
    const section = sectionRef.current!
    const stage = section.querySelector<HTMLDivElement>('.hero-stage')!
    const enterDoor = () => {
      if (-section.getBoundingClientRect().top < stage.offsetHeight - 1) return
      setEntering(true)
      onMusicEnd()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setEntered(true)
    }

    window.addEventListener('scroll', enterDoor, { passive: true })
    window.addEventListener('resize', enterDoor)
    enterDoor()
    return () => {
      window.removeEventListener('scroll', enterDoor)
      window.removeEventListener('resize', enterDoor)
    }
  }, [loading, entering, leaving, onMusicEnd])

  useEffect(() => {
    if (entered) onComplete?.()
  }, [entered, onComplete])

  return (
    <section
      ref={sectionRef}
      aria-label="White Space"
      className={`hero-scroll is-${loading}${entering ? ' is-entering' : ''}${entered ? ' is-entered' : ''}${leaving ? ' is-leaving' : ''}`}
      aria-busy={loading === 'loading' || loading === 'revealing'}
    >
      <div className="hero-stage">
        {!replay && loading !== 'ready' && (
          <div className={`hero-loading${loading === 'graphics-required' ? ' is-graphics-required' : ''}`}>
            {loading === 'error' ? (
              <div role="alert">
                <p>Some assets couldn’t load.</p>
                <button type="button" onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : (
              <>
                <div role="progressbar" aria-label="Loading site assets" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  {progress}<span>%</span>
                </div>
                {loading === 'awaiting-start' && <button className="hero-start" type="button" onClick={() => {
                  onMusicStart()
                  void unlockAudio().catch((error: unknown) => console.error('Unable to unlock sound effects', error))
                  setLoading(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ready' : 'revealing')
                }}>Start</button>}
                {loading === 'graphics-required' && <div className="hero-graphics-help" role="alert">
                  <p>The photobook needs WebGL2, which is unavailable in your browser.</p>
                  <p>In Chrome, open Settings → System and enable “Use graphics acceleration when available”. Relaunch Chrome, then reload this page.</p>
                  <a href="https://support.google.com/chrome/thread/412501283/how-do-i-turn-hardware-acceleration-back-on?hl=en" target="_blank" rel="noopener noreferrer">How to enable graphics acceleration (opens in a new tab)</a>
                </div>}
                <span className="sr-only" role="status">{loading === 'graphics-required' ? 'Assets loaded. Graphics acceleration is required to continue.' : progress === 100 ? 'Assets loaded. Press Start to enter White Space with sound.' : 'Loading site assets.'}</span>
              </>
            )}
          </div>
        )}
        <div
          className="hero-camera"
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget && event.propertyName === 'transform' && loading === 'revealing') setLoading('ready')
          }}
          onAnimationEnd={(event) => {
            if (event.animationName === 'camera-leave') setLeaving(false)
            if (event.animationName === 'camera-enter') setEntered(true)
          }}
        >
          <img
            className="hero-logo"
            src={heroLogo}
            alt="Omori"
          />
          <div className="hero-composition">
            <img
              className="hero-whitespace"
              src={heroWhitespace}
              alt="Omori standing in White Space"
            />
            <div className="hero-door" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
