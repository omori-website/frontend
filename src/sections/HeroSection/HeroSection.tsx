import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './HeroSection.css'
import heroLogo from '../../assets/hero-section/hero-logo.png'
import heroWhitespace from '../../assets/hero-section/hero-whitespace.png'
import { preloadAssets } from './preload-assets'

type HeroSectionProps = {
  onComplete?: () => void
}

function HeroSection({ onComplete }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entering, setEntering] = useState(false)
  const [entered, setEntered] = useState(false)
  const zoomReady = useRef(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState<'loading' | 'revealing' | 'ready' | 'error'>('loading')

  useLayoutEffect(() => {
    if (loading === 'ready') return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    return () => { document.documentElement.style.overflow = previousOverflow }
  }, [loading])

  useEffect(() => {
    let active = true
    let revealTimer: number | undefined
    const preload = preloadAssets(setProgress)
    preload.ready.then(() => {
      if (!active) return
      revealTimer = window.setTimeout(() => {
        setLoading(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'ready' : 'revealing')
      }, 400)
    }).catch((error: unknown) => {
      if (!active) return
      console.error(error)
      setLoading('error')
    })
    return () => {
      active = false
      clearTimeout(revealTimer)
      preload.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const armZoom = () => {
      const bounds = sectionRef.current?.getBoundingClientRect()
      zoomReady.current = !!bounds && bounds.top <= 0 && bounds.bottom <= window.innerHeight + 1
    }

    armZoom()
    document.addEventListener('scrollend', armZoom)
    return () => document.removeEventListener('scrollend', armZoom)
  }, [])

  useEffect(() => {
    if (entered) onComplete?.()
  }, [entered, onComplete])

  const handleWheel = (deltaY: number) => {
    if (loading === 'ready' && deltaY > 0 && zoomReady.current) {
      zoomReady.current = false
      setEntering(true)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setEntered(true)
    }
  }

  return (
    <section
      ref={sectionRef}
      aria-label="White Space"
      className={`hero-scroll is-${loading}${entering ? ' is-entering' : ''}${entered ? ' is-entered' : ''}`}
      aria-busy={loading !== 'ready'}
      onWheel={(event) => handleWheel(event.deltaY)}
    >
      <div className="hero-stage">
        {loading !== 'ready' && (
          <div className="hero-loading">
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
                <span className="sr-only" role="status">{progress === 100 ? 'Assets loaded. Revealing White Space.' : 'Loading site assets.'}</span>
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
