import { useEffect, useRef, useState } from 'react'
import './HeroSection.css'
import heroLogo from '../../assets/hero-section/hero-logo.png'
import heroWhitespace from '../../assets/hero-section/hero-whitespace.png'

type HeroSectionProps = {
  onComplete?: () => void
}

function HeroSection({ onComplete }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entering, setEntering] = useState(false)
  const [entered, setEntered] = useState(false)
  const zoomReady = useRef(false)

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
    if (deltaY > 0 && zoomReady.current) {
      zoomReady.current = false
      setEntering(true)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setEntered(true)
    }
  }

  return (
    <section
      ref={sectionRef}
      aria-label="White Space"
      className={`hero-scroll${entering ? ' is-entering' : ''}${entered ? ' is-entered' : ''}`}
      onWheel={(event) => handleWheel(event.deltaY)}
    >
      <div className="hero-stage">
        <div
          className="hero-camera"
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
