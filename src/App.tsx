import { useCallback, useEffect, useRef, useState } from 'react'
import HeroSection from './sections/HeroSection/HeroSection'
import AboutSection from './sections/AboutSection/AboutSection'
import whiteSpace from './music/OMORI OST - 002 WHITE SPACE.mp3'
import tulip from './music/OMORI OST - 013 A Home For Flowers (Tulip).mp3'

function App() {
  const [heroComplete, setHeroComplete] = useState(false)
  const [returningToHero, setReturningToHero] = useState(false)
  const [heroReplay, setHeroReplay] = useState(0)
  const [whiteSpaceStarted, setWhiteSpaceStarted] = useState(false)
  const [photobookVisible, setPhotobookVisible] = useState(false)
  const [musicBlocked, setMusicBlocked] = useState(false)
  const [musicError, setMusicError] = useState(false)
  const [volume, setVolume] = useState(1)
  const [volumeOpen, setVolumeOpen] = useState(false)
  const masterVolume = useRef(1)
  const fadeLevel = useRef(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fadeFrame = useRef(0)
  const endWhiteSpace = useCallback(() => setWhiteSpaceStarted(false), [])
  const track = heroComplete ? (photobookVisible ? tulip : undefined) : (whiteSpaceStarted ? whiteSpace : undefined)
  const desiredTrack = useRef(track)
  desiredTrack.current = track

  const fadeMusic = useCallback((volume: number, complete?: () => void, duration = 600) => {
    cancelAnimationFrame(fadeFrame.current)
    const audio = audioRef.current!
    const from = fadeLevel.current
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - start) / duration))
      fadeLevel.current = from + (volume - from) * progress
      audio.volume = fadeLevel.current * masterVolume.current
      if (progress < 1) fadeFrame.current = requestAnimationFrame(step)
      else complete?.()
    }
    fadeFrame.current = requestAnimationFrame(step)
  }, [])

  const startWhiteSpace = useCallback(() => {
    const audio = audioRef.current!
    cancelAnimationFrame(fadeFrame.current)
    audio.pause()
    audio.setAttribute('src', whiteSpace)
    audio.muted = false
    fadeLevel.current = 0
    audio.volume = 0
    desiredTrack.current = whiteSpace
    setWhiteSpaceStarted(true)
    void audio.play().then(() => {
      if (desiredTrack.current !== whiteSpace) return
      fadeMusic(1)
      setMusicBlocked(false)
      setMusicError(false)
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'NotAllowedError') setMusicBlocked(true)
      else if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Unable to start music', error)
        setMusicError(true)
      }
    })
  }, [fadeMusic])

  const playMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !desiredTrack.current || audio.getAttribute('src') !== desiredTrack.current) return
    const source = desiredTrack.current
    void audio.play().then(() => {
      if (desiredTrack.current !== source || audio.getAttribute('src') !== source) return
      fadeMusic(1, undefined, source === tulip ? 1500 : 600)
      setMusicBlocked(false)
      setMusicError(false)
    }).catch((error: unknown) => {
      if (desiredTrack.current !== source) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      if (error instanceof DOMException && error.name === 'NotAllowedError') setMusicBlocked(true)
      else {
        console.error('Unable to play section music', error)
        setMusicError(true)
      }
    })
  }, [fadeMusic])

  useEffect(() => {
    const audio = audioRef.current!
    const switchTrack = () => {
      audio.pause()
      fadeLevel.current = 0
      audio.volume = 0
      if (track) audio.setAttribute('src', track)
      else audio.removeAttribute('src')
      audio.load()
      if (track) playMusic()
    }
    setMusicBlocked(false)
    setMusicError(false)
    if (audio.getAttribute('src') === track) {
      if (audio.paused) playMusic()
      else fadeMusic(1, undefined, track === tulip ? 1500 : 600)
    } else if (!audio.paused && fadeLevel.current > 0) fadeMusic(0, switchTrack, audio.getAttribute('src') === whiteSpace ? 300 : 600)
    else switchTrack()
    const retry = () => { if (audio.paused) playMusic() }
    window.addEventListener('pointerdown', retry)
    window.addEventListener('keydown', retry)
    return () => {
      cancelAnimationFrame(fadeFrame.current)
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
    }
  }, [track, playMusic, fadeMusic])

  useEffect(() => {
    const audio = audioRef.current!
    return () => {
      cancelAnimationFrame(fadeFrame.current)
      audio.pause()
    }
  }, [])

  return (
    <main>
      <audio ref={audioRef} loop preload="auto" />
      <div className="volume-control" onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          setVolumeOpen(false)
          event.currentTarget.querySelector<HTMLButtonElement>('.volume-toggle')?.focus()
        }
      }} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setVolumeOpen(false)
      }}>
        {volumeOpen && <div className="volume-panel" id="music-volume-panel">
          <output htmlFor="music-volume">{Math.round(volume * 100)}%</output>
          <input id="music-volume" type="range" min="0" max="100" step="1"
            aria-label="Music volume" aria-orientation="vertical" value={Math.round(volume * 100)}
            onChange={(event) => {
              const next = Number(event.currentTarget.value) / 100
              masterVolume.current = next
              setVolume(next)
              audioRef.current!.volume = fadeLevel.current * next
            }} />
        </div>}
        {track && (musicBlocked || musicError) && <button className="music-retry" type="button" onClick={playMusic}>
          {musicError ? 'Retry music' : 'Enable music'}
        </button>}
        <button className="volume-toggle" type="button" aria-label="Music volume"
          aria-expanded={volumeOpen} aria-controls="music-volume-panel" onClick={() => setVolumeOpen((open) => !open)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            {volume === 0 ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
          </svg>
        </button>
      </div>
      {!heroComplete && <HeroSection key={`hero-${heroReplay}`} returning={returningToHero} replay={heroReplay > 0 && !returningToHero} onMusicStart={startWhiteSpace} onMusicEnd={endWhiteSpace} onComplete={() => setHeroComplete(true)} />}
      <AboutSection key={`about-${heroReplay}`} active={heroComplete} onHome={() => {
        startWhiteSpace()
        setReturningToHero(false)
        setHeroComplete(false)
        setHeroReplay((value) => value + 1)
      }} onPhotobookChange={setPhotobookVisible} onBack={() => {
        startWhiteSpace()
        setReturningToHero(true)
        setHeroComplete(false)
      }} />
    </main>
  )
}

export default App
