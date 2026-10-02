import { useEffect, useRef, useState } from 'react'
import exploreStill from '../../assets/gameplay-news-section/ExploreTheWorld-still.webp'
import exploreLoop from '../../assets/gameplay-news-section/ExploreTheWorld.webp'
import fightStill from '../../assets/gameplay-news-section/FightYourFears-cropped-still.webp'
import fightLoop from '../../assets/gameplay-news-section/FightYourFears-cropped.webp'
import solveStill from '../../assets/gameplay-news-section/SolveMysteries-cropped-still.webp'
import solveLoop from '../../assets/gameplay-news-section/SolveMysteries-cropped.webp'
import togetherStill from '../../assets/gameplay-news-section/tags-00m06s-00m20s-still.webp'
import togetherLoop from '../../assets/gameplay-news-section/tags-00m06s-00m20s.webp'
import fanartPhoto from '../../assets/gameplay-news-section/news1.webp'
import japanesePhoto from '../../assets/gameplay-news-section/news2.webp'
import windChime from '../../assets/gameplay-news-section/windthing.png'
import arrow from '../../assets/about-section/arrow.png'
import './GameplayNewsSection.css'

const gameplay = [
  { title: 'Explore the World', description: 'Walk through strange locations, meet characters, and discover optional dialogue.', still: exploreStill, loop: exploreLoop },
  { title: 'Fight Your Fears', description: 'Face unusual enemies through turn-based battles and emotion-based strategies.', still: fightStill, loop: fightLoop },
  { title: 'Solve Mysteries', description: 'Find clues, interact with objects, and complete puzzles to unlock new paths.', still: solveStill, loop: solveLoop },
  { title: 'Work Together', description: 'Tag different friends to use their unique abilities.', still: togetherStill, loop: togetherLoop },
]

const news = [
  {
    title: 'Fanart Announcement',
    greeting: 'Hi, everyone!',
    description: "First off, we would like to say: thank you for all the positive reception for OMORI! Now that we’ve gotten settled, we would like to answer a few questions that our fans may be having about fan works and merchandise.",
    url: 'https://www.omori-game.com/en/updates',
    image: fanartPhoto,
  },
  {
    title: 'OMORI Now Available in Japanese!',
    greeting: 'Gamers of Japan, the wait is finally over!',
    description: 'The Japanese localization of OMORI is available on Steam. If you already own OMORI, right-click the game in your library, open Properties, and set the language to Japanese.',
    url: 'https://store.steampowered.com/news/app/1150690/view/5320438099035165289',
    image: japanesePhoto,
  },
]

function GameplayPanel({ title, description, still, loop }: typeof gameplay[number]) {
  const [playing, setPlaying] = useState(false)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const stop = () => setPlaying(false)
    let observer: IntersectionObserver
    const observe = () => {
      observer?.disconnect()
      stop()
      const inset = Math.max(0, (window.innerHeight - 2) / 2)
      observer = new IntersectionObserver(([entry]) => {
        if (hover.matches) {
          if (!entry.isIntersecting) stop()
        } else {
          setPlaying(entry.isIntersecting && !motion.matches && !document.hidden)
        }
      }, { rootMargin: hover.matches ? '0px' : `-${inset}px 0px -${inset}px 0px` })
      observer.observe(panel)
    }
    const onVisibilityChange = () => { if (document.hidden) stop(); else observe() }
    observe()
    motion.addEventListener('change', observe)
    hover.addEventListener('change', observe)
    window.addEventListener('resize', observe)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', observe)
      hover.removeEventListener('change', observe)
      window.removeEventListener('resize', observe)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <article ref={panelRef} className="gameplay-panel"
      onPointerEnter={() => {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches
          && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(true)
      }}
      onPointerLeave={() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setPlaying(false) }}
      onPointerCancel={() => { if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setPlaying(false) }}>
      <div className={`gameplay-media${playing ? ' is-playing' : ''}`}>
        <img src={still} alt={`${title} gameplay`} loading="lazy" />
        {playing && <img className="gameplay-animation" src={loop} alt="" />}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  )
}

export default function GameplayNewsSection() {
  const [index, setIndex] = useState(0)
  const slideRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const chimeRef = useRef<HTMLImageElement>(null)
  const chimeAnimationRef = useRef<Animation | null>(null)
  const newsRef = useRef<HTMLElement>(null)
  const announcement = news[index]

  useEffect(() => () => {
    animationRef.current?.cancel()
    chimeAnimationRef.current?.cancel()
  }, [])

  useEffect(() => {
    const carousel = newsRef.current
    if (!carousel) return
    const observer = new IntersectionObserver(([entry]) => {
      carousel.toggleAttribute('data-visible', entry.isIntersecting)
    })
    observer.observe(carousel)
    return () => observer.disconnect()
  }, [])

  function navigate(direction: number, instant: boolean) {
    animationRef.current?.cancel()
    setIndex((current) => (current + direction + news.length) % news.length)
    if (!instant && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const chime = chimeRef.current
      if (chime) {
        const matrix = new DOMMatrix(getComputedStyle(chime).transform)
        const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
        chimeAnimationRef.current?.cancel()
        chimeAnimationRef.current = chime.animate(
          [{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${angle + direction * 2160}deg)` }],
          { duration: 2400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
        )
      }
      animationRef.current = slideRef.current?.animate(
        [{ opacity: 0, transform: `translateX(${direction * 24}px)` }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 240, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
      ) ?? null
    }
  }

  return (
    <section className="gameplay-news-section" aria-label="Gameplay and news">
      <div id="gameplay" className="gameplay-panels">
        {gameplay.map((panel) => <GameplayPanel key={panel.title} {...panel} />)}
      </div>
      <div id="news" className="news-stage">
      <section ref={newsRef} className="news-carousel" aria-label="OMORI news" aria-roledescription="carousel"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          navigate(event.key === 'ArrowRight' ? 1 : -1, true)
        }}>
        <img ref={chimeRef} className="news-wind-chime" src={windChime} alt="" />
        <button type="button" className="news-arrow news-arrow-previous" aria-label="Previous news"
          onClick={(event) => navigate(-1, event.detail === 0)}><img src={arrow} alt="" /></button>
        <div className="news-window">
          <div ref={slideRef} className="news-slide" role="group" aria-roledescription="slide"
            aria-label={`${index + 1} of ${news.length}`}>
            <img className="news-media" src={announcement.image} alt={announcement.title} loading="lazy" />
            <article className="news-copy" aria-live="polite" aria-atomic="true">
              <h2>{announcement.title}</h2>
              <p>{announcement.greeting}<br />{announcement.description} <a href={announcement.url} target="_blank" rel="noreferrer">...see more<span className="sr-only"> about {announcement.title}</span></a></p>
            </article>
          </div>
        </div>
        <button type="button" className="news-arrow news-arrow-next" aria-label="Next news"
          onClick={(event) => navigate(1, event.detail === 0)}><img src={arrow} alt="" /></button>
      </section>
      </div>
    </section>
  )
}
