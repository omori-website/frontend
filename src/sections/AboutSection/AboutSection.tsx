import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './AboutSection.css'
import CharactersSection from '../CharactersSection/CharactersSection'
import Navbar from '../Navbar/Navbar'
import omoriFrame1 from '../../assets/about-section/omori-frame1.webp'
import omoriFrame2 from '../../assets/about-section/omori-frame2.webp'
import omoriFrame3 from '../../assets/about-section/omori-frame3.webp'
import dialogueArrow from '../../assets/about-section/arrow.png'
import charactersBackground from '../../assets/characters-section/background.png'
import { dialogueDurations, playDialogueSound } from './dialogue-audio'

const omoriFrames = [omoriFrame1, omoriFrame2, omoriFrame3]

const dialogues = [
  'OMORI is a psychological horror RPG about friendship, memory, and the things we try to forget.',
  'Explore a strange world full of colorful friends and foes. Navigate through the vibrant and the mundane in order to uncover a forgotten past.',
  'When the time comes, the path you’ve chosen will determine your fate',
  '...and perhaps the fate of others as well.',
]


export default function AboutSection({ active, onBack, onHome, onPhotobookChange }: { active: boolean; onBack: () => void; onHome: () => void; onPhotobookChange: (visible: boolean) => void }) {
  const [index, setIndex] = useState(0)
  const [letters, setLetters] = useState(0)
  const [retracting, setRetracting] = useState(false)
  const [complete, setComplete] = useState(false)
  const [framesFinished, setFramesFinished] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [frameStep, setFrameStep] = useState(0)
  const [framesPaused, setFramesPaused] = useState(false)
  const [dialogueClicked, setDialogueClicked] = useState(false)
  const framesRef = useRef<HTMLButtonElement>(null)
  const gesture = useRef({ wheelDistance: 0, lastWheel: 0, lastStep: -Infinity, stepped: false, touchY: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const audioRef = useRef<AudioBufferSourceNode | null>(null)
  const dialogue = dialogues[index]
  const fullyTyped = letters >= dialogue.length
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!active || complete || retracting || fullyTyped) return
    if (reducedMotion.current) {
      setLetters(dialogue.length)
      return
    }
    let canceled = false
    let frame = 0
    let started = 0
    const duration = dialogueDurations[index]
    const tick = (now: number) => {
      if (canceled) return
      const elapsed = (now - started) / 1000
      setLetters(Math.min(dialogue.length, Math.floor(elapsed / duration * dialogue.length)))
      if (elapsed < duration) frame = requestAnimationFrame(tick)
      else setLetters(dialogue.length)
    }
    const startTyping = () => {
      if (canceled) return
      started = performance.now()
      frame = requestAnimationFrame(tick)
    }
    void playDialogueSound(index).then((source) => {
      if (canceled) { source.disconnect(); return }
      audioRef.current = source
      source.start()
      startTyping()
    }).catch((error: unknown) => {
      if (canceled) return
      console.error('Unable to play dialogue sound', error)
      startTyping()
    })
    return () => {
      canceled = true
      cancelAnimationFrame(frame)
      audioRef.current?.stop()
      audioRef.current = null
    }
  }, [active, complete, dialogue, fullyTyped, index, retracting])

  useEffect(() => {
    onPhotobookChange(active && framesFinished)
  }, [active, framesFinished, onPhotobookChange])

  useLayoutEffect(() => {
    if (!active || revealed) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    buttonRef.current?.focus({ preventScroll: true })
    return () => { document.documentElement.style.overflow = previousOverflow }
  }, [active, revealed])

  useLayoutEffect(() => {
    if (!active || revealed) return
    if (complete) framesRef.current?.focus({ preventScroll: true })
    else buttonRef.current?.focus({ preventScroll: true })
  }, [active, complete, index, revealed])

  useEffect(() => {
    if (!active || !complete || framesFinished || framesPaused) return
    const timer = window.setTimeout(() => {
      if (frameStep < 5) setFrameStep(frameStep + 1)
      else setFramesFinished(true)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [active, complete, frameStep, framesFinished, framesPaused])

  useEffect(() => {
    if (!active) return
    const input = gesture.current
    const backward = () => {
      if (revealed && window.scrollY > 1) return
      if (complete) {
        setRevealed(false)
        setFramesFinished(false)
        setFramesPaused(true)
        if (framesFinished) setFrameStep(5)
        else if (frameStep > 0) setFrameStep(frameStep - 1)
        else {
          setComplete(false)
          setLetters(dialogues[index].length)
        }
      } else {
        setRetracting(true)
      }
    }
    const wheel = (event: WheelEvent) => {
      if (revealed && (window.scrollY > 1 || event.deltaY >= 0)) return
      event.preventDefault()
      const now = performance.now()
      if (now - input.lastWheel > 180) {
        input.wheelDistance = 0
        input.lastStep = -Infinity
      }
      input.lastWheel = now
      if (event.deltaY >= 0) {
        input.wheelDistance = 0
        return
      }
      input.wheelDistance += -event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
      if (input.wheelDistance >= (complete ? 20 : 40) && now - input.lastStep >= (complete ? 200 : 400)) {
        input.wheelDistance = 0
        input.lastStep = now
        backward()
      }
    }
    const touchStart = (event: TouchEvent) => {
      input.touchY = event.touches[0].clientY
      input.stepped = false
    }
    const touchMove = (event: TouchEvent) => {
      const distance = event.touches[0].clientY - input.touchY
      if (revealed && (window.scrollY > 1 || distance <= 0)) return
      event.preventDefault()
      if (!input.stepped && distance >= (complete ? 20 : 40)) {
        input.stepped = true
        backward()
      }
    }
    const key = (event: KeyboardEvent) => {
      if (!['ArrowUp', 'PageUp', 'Home'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return
      if (revealed && window.scrollY > 1) return
      event.preventDefault()
      if (!event.repeat) backward()
    }
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('keydown', key)
    }
  }, [active, complete, frameStep, framesFinished, index, onBack, revealed])

  useEffect(() => {
    if (!active || complete) return
    if (retracting) {
      const timer = window.setTimeout(() => {
        if (letters > 0 && !reducedMotion.current) {
          setLetters(letters - 1)
          return
        }
        setRetracting(false)
        if (index > 0) {
          setIndex(index - 1)
          setLetters(dialogues[index - 1].length)
        } else {
          setComplete(false)
          setFramesPaused(false)
          setFrameStep(0)
          onBack()
        }
      }, reducedMotion.current ? 0 : 15)
      return () => window.clearTimeout(timer)
    }
  }, [active, complete, dialogue, letters, index, retracting, onBack])

  useEffect(() => {
    if (!revealed || !navigationTarget) return
    const destination = document.getElementById(navigationTarget)
    if (!destination) return
    destination.scrollIntoView({ behavior: 'instant', block: 'start' })
    history.pushState(null, '', `#${navigationTarget}`)
    setNavigationTarget(null)
  }, [revealed, navigationTarget])

  function navigateToSection(id: string) {
    audioRef.current?.stop()
    setRetracting(false)
    setComplete(true)
    setFramesPaused(false)
    setFramesFinished(true)
    setNavigationTarget(id)
  }

  function advance() {
    if (!active) return
    setDialogueClicked(true)
    audioRef.current?.stop()
    if (retracting) {
      setRetracting(false)
      return
    }
    if (letters < dialogue.length) {
      setLetters(dialogue.length)
    } else if (index < dialogues.length - 1) {
      setIndex(index + 1)
      setLetters(0)
    } else {
      setComplete(true)
      setFrameStep(0)
      setFramesPaused(false)
    }
  }

  return (
    <section id="about" className={`about-section${!active ? ' is-preloading' : ''}${framesFinished ? ' has-characters' : ''}`} inert={!active} aria-label="About OMORI">
      {active && <Navbar onHome={onHome} onNavigate={navigateToSection} initiallyHidden={dialogueClicked} />}
      {omoriFrames.map((frame) => (
        <link key={frame} rel="preload" as="image" href={frame} />
      ))}
      <link rel="preload" as="image" href={charactersBackground} />
      <CharactersSection visible={active && framesFinished} onReveal={() => setRevealed(true)} />
      {complete && !revealed && (
        <button
          className="about-frames"
          ref={framesRef}
          type="button"
          style={{ backgroundImage: `url(${omoriFrames[frameStep % 3]})` }}
          onClick={() => setFramesPaused(false)}
          aria-label={`OMORI frame ${frameStep % 3 + 1}. Scroll up to go back. Click or press Enter to continue.`}
        />
      )}
      {!complete && (
        <button
          ref={buttonRef}
          type="button"
          className="about-dialogue"
          onClick={advance}
          aria-label={letters < dialogue.length ? 'Reveal full dialogue' : index === dialogues.length - 1 ? 'Finish dialogue' : 'Next dialogue'}
        >
          <span className="about-dialogue-text" aria-hidden="true">
            {dialogue.slice(0, letters)}
            <span className="about-dialogue-unrevealed">{dialogue.slice(letters)}</span>
          </span>
          <span className="sr-only" aria-live="polite" aria-atomic="true">{dialogue}</span>
          <img className="about-dialogue-arrow" src={dialogueArrow} alt="" />
        </button>
      )}
    </section>
  )
}
