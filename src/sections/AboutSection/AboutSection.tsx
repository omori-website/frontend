import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './AboutSection.css'
import CharactersSection from '../CharactersSection/CharactersSection'
import Navbar from '../Navbar/Navbar'
import omoriFrame1 from '../../assets/about-section/omori-frame1.png'
import omoriFrame2 from '../../assets/about-section/omori-frame2.png'
import omoriFrame3 from '../../assets/about-section/omori-frame3.png'
import dialogueArrow from '../../assets/about-section/arrow.png'
import charactersBackground from '../../assets/characters-section/background.png'

const omoriFrames = [omoriFrame1, omoriFrame2, omoriFrame3]

const dialogues = [
  'OMORI is a psychological horror RPG about friendship, memory, and the things we try to forget.',
  'Explore a strange world full of colorful friends and foes. Navigate through the vibrant and the mundane in order to uncover a forgotten past.',
  'When the time comes, the path you’ve chosen will determine your fate',
  '...and perhaps the fate of others as well.',
]

export default function AboutSection({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0)
  const [letters, setLetters] = useState(0)
  const [ready, setReady] = useState(false)
  const [complete, setComplete] = useState(false)
  const [framesFinished, setFramesFinished] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const dialogue = dialogues[index]

  useLayoutEffect(() => {
    if (!active || revealed) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    buttonRef.current?.focus({ preventScroll: true })
    return () => { document.documentElement.style.overflow = previousOverflow }
  }, [active, revealed])

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => setReady(true), reducedMotion.current ? 0 : 1000)
    return () => window.clearTimeout(timer)
  }, [active])

  useEffect(() => {
    if (!ready || complete || letters >= dialogue.length) return
    const timer = window.setTimeout(
      () => setLetters(reducedMotion.current ? dialogue.length : letters + 1),
      reducedMotion.current ? 0 : dialogue.startsWith('...') && letters < 3 ? 50 : 15,
    )
    return () => window.clearTimeout(timer)
  }, [ready, complete, dialogue, letters, index])

  function advance() {
    if (!ready) return
    if (letters < dialogue.length) {
      setLetters(dialogue.length)
    } else if (index < dialogues.length - 1) {
      setIndex(index + 1)
      setLetters(0)
    } else {
      setComplete(true)
    }
  }

  return (
    <section id="about" className={`about-section${!active ? ' is-preloading' : ''}${framesFinished ? ' has-characters' : ''}`} inert={!active} aria-label="About OMORI">
      {revealed && <Navbar />}
      {omoriFrames.map((frame) => (
        <link key={frame} rel="preload" as="image" href={frame} />
      ))}
      <link rel="preload" as="image" href={charactersBackground} />
      <CharactersSection visible={active && framesFinished} onReveal={() => setRevealed(true)} />
      {complete && !revealed && (
        <div
          className="about-frames"
          role="img"
          aria-label="OMORI"
          onAnimationEnd={() => setFramesFinished(true)}
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
