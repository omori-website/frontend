import { useEffect, useRef, useState } from 'react'
import { BOOK_PAGES } from './book-interaction'
import { MOBILE_BOOK, readingPose, readingStep } from './book-reading'
import { mountBook } from './book-scene'
import type { Photo } from './book-scene'
import './CharactersSection.css'
import GameplayNewsSection from '../GameplayNewsSection/GameplayNewsSection'
import FooterSection from '../FooterSection/FooterSection'
import background from '../../assets/characters-section/background.png'
import { playSnapSound } from '../AboutSection/dialogue-audio'

export default function CharactersSection({ visible, onReveal }: { visible: boolean; onReveal: () => void }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const target = useRef(0)
  const immediate = useRef(false)
  const photoOpen = useRef(false)
  const flipOnly = useRef(false)
  const photosRef = useRef<Photo[]>([])
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [photo, setPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    const section = sectionRef.current!
    const stage = stageRef.current!
    const pose = { page: 0, x: 0, zoom: 0 }
    function updateScroll() {
      const travel = section.querySelector<HTMLDivElement>('.book-scroll-space')!.offsetHeight
      target.current = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / Math.max(1, travel))) * 8
      readingPose(target.current, window.matchMedia(MOBILE_BOOK).matches && !flipOnly.current, pose)
      const next = Math.min(7, Math.round(pose.page))
      setPage((current) => current === next ? current : next)
    }
    const resizeObserver = new ResizeObserver(updateScroll)
    resizeObserver.observe(section)
    resizeObserver.observe(stage)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      section.classList.toggle('is-offscreen', !entry.isIntersecting)
    })
    visibilityObserver.observe(section)
    window.addEventListener('scroll', updateScroll, { passive: true })
    const resumeReading = () => { flipOnly.current = false }
    window.addEventListener('wheel', resumeReading, { passive: true })
    window.addEventListener('touchmove', resumeReading, { passive: true })
    updateScroll()
    const unmount = mountBook(hostRef.current!, {
      target, immediate, photoOpen, flipOnly,
      onTransition: (complete) => stage.classList.toggle('is-background-revealed', complete),
      onReady: (loaded) => {
        photosRef.current = loaded
        setStatus('ready')
      },
      onError: () => setStatus('error'),
      onOpen: (name) => {
        const selected = photosRef.current.find((item) => item.name === name)
        if (!selected) return
        returnFocus.current = hostRef.current
        photoOpen.current = true
        setPhoto(selected)
      },
    })
    return () => {
      unmount()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('wheel', resumeReading)
      window.removeEventListener('touchmove', resumeReading)
    }
  }, [])

  useEffect(() => {
    if (photo) dialogRef.current?.showModal()
  }, [photo])

  function navigate(next: number, instant: boolean) {
    const section = sectionRef.current!
    const travel = section.querySelector<HTMLDivElement>('.book-scroll-space')!.offsetHeight
    const value = Math.max(0, Math.min(7, next))
    flipOnly.current = window.matchMedia(MOBILE_BOOK).matches
    immediate.current = instant
    target.current = value
    const pose = { page: 0, x: 0, zoom: 0 }
    readingPose(value, window.matchMedia(MOBILE_BOOK).matches, pose)
    setPage(Math.min(7, Math.round(pose.page)))
    window.scrollTo({
      top: window.scrollY + section.getBoundingClientRect().top + travel * value / 8,
      behavior: instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }
  function step(direction: number, instant: boolean) {
    navigate(readingStep(target.current, direction, window.matchMedia(MOBILE_BOOK).matches && !flipOnly.current), instant)
  }

  return (
    <section ref={sectionRef} id="characters" className={`characters-section${!visible || status === 'loading' ? ' is-preloading' : ''}`} inert={!visible || status === 'loading'} aria-label="Characters of OMORI">
      <div ref={stageRef} className="characters-stage" onAnimationStart={(event) => {
        if (event.animationName !== 'characters-reveal' || event.target !== event.currentTarget) return
        void playSnapSound().catch((error: unknown) => console.error('Unable to play photobook snap', error))
      }} onAnimationEnd={(event) => {
        if (event.animationName === 'characters-reveal' && event.target === event.currentTarget) onReveal()
      }}>
        <img className="characters-background" src={background} alt="" />
        <div className="book-chapter">
          <p className="book-instruction" id="book-instruction">Scroll to turn the pages</p>
          <div ref={hostRef} className="book-stage" role="group" tabIndex={0} aria-keyshortcuts="ArrowLeft ArrowRight Home End 1 2 3"
            aria-label={`Characters of OMORI photobook. ${BOOK_PAGES[page]}. Use left and right arrow keys to turn pages. Press 1, 2, or 3 to view a photo.`}
            aria-describedby="book-instruction"
            onKeyDown={(event) => {
              if (status !== 'ready') return
              if (['1', '2', '3'].includes(event.key)) {
                const selected = photosRef.current.find((item) => item.character === BOOK_PAGES[page] && item.index === Number(event.key))
                if (!selected) return
                event.preventDefault()
                returnFocus.current = hostRef.current
                photoOpen.current = true
                setPhoto(selected)
              } else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                event.preventDefault()
                if (event.key === 'Home' || event.key === 'End') navigate(event.key === 'Home' ? 0 : 7, true)
                else step(event.key === 'ArrowRight' ? 1 : -1, true)
              }
            }} />
          {status === 'error' && <p className="book-status" role="status">
            The photobook could not load. Reload to try again.
          </p>}
          <div className="book-navigation">
            <nav className="book-page-controls" aria-label="Book pages">
              <button type="button" aria-label="Previous page" disabled={status !== 'ready' || page === 0}
                onClick={(event) => step(-1, event.detail === 0)}>&lt;</button>
              <span className="book-page-count" aria-live="polite" aria-atomic="true">
                <span aria-hidden="true">{page + 1}/8</span>
                <span className="sr-only">{BOOK_PAGES[page]}, page {page + 1} of 8</span>
              </span>
              <button type="button" aria-label="Next page" disabled={status !== 'ready' || page === 7}
                onClick={(event) => step(1, event.detail === 0)}>&gt;</button>
            </nav>
          </div>
        </div>
      </div>
      <dialog ref={dialogRef} className="book-photo-dialog" aria-label={photo ? `${photo.character} photo ${photo.index}` : 'Photobook photo'}
        onCancel={() => { dialogRef.current?.close() }}
        onClose={() => {
          photoOpen.current = false
          setPhoto(null)
          returnFocus.current?.focus({ preventScroll: true })
        }}>
        {photo && <>
          <img src={photo.url} alt={`${photo.character} Polaroid ${photo.index}, from the supplied character photobook`} />
          <button type="button" className="book-photo-close" aria-label="Close photo" autoFocus
            onClick={() => dialogRef.current?.close()}>×</button>
        </>}
      </dialog>
      <div className="book-scroll-space" aria-hidden="true" />
      <GameplayNewsSection />
      <FooterSection />
    </section>
  )
}
