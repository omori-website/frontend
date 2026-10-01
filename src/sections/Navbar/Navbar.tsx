import { useEffect, useRef, useState } from 'react'
import './Navbar.css'
import omoriWordmark from '../../assets/footer/omori-wordmark.png'

export default function Navbar({ onHome, onNavigate, initiallyHidden }: { onHome: () => void; onNavigate: (id: string) => void; initiallyHidden: boolean }) {
  const [hidden, setHidden] = useState(initiallyHidden)
  const [nearTop, setNearTop] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => setHidden(initiallyHidden), [initiallyHidden])

  useEffect(() => {
    let previousY = window.scrollY
    function onScroll() {
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight))
      if (Math.abs(y - previousY) < 6) {
        return
      } else {
        setHidden(y > previousY && !navRef.current?.contains(document.activeElement))
      }
      previousY = y
    }
    const direction = (down: boolean) => setHidden(down && !navRef.current?.contains(document.activeElement))
    const onWheel = (event: WheelEvent) => { if (Math.abs(event.deltaY) >= 6) direction(event.deltaY > 0) }
    let touchY = 0
    const onTouchStart = (event: TouchEvent) => { touchY = event.touches[0].clientY }
    const onTouchMove = (event: TouchEvent) => {
      const next = event.touches[0].clientY
      if (Math.abs(next - touchY) >= 6) {
        direction(next < touchY)
        touchY = next
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement) return
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) direction(false)
      if (['ArrowDown', 'PageDown', 'End'].includes(event.key)) direction(true)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const nav = navRef.current
      const overNav = nav?.contains(event.target as Node) ?? false
      setNearTop(event.clientY <= 80 || overNav)
    }
    const onPointerLeave = () => setNearTop(false)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <nav ref={navRef} className={`site-navbar${hidden && !nearTop ? ' is-hidden' : ''}`} aria-label="Main navigation"
      onFocus={() => setHidden(false)} onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
        if (!anchor) return
        event.preventDefault()
        onNavigate(anchor.hash.slice(1))
      }}>
      <a href="#characters">Character</a>
      <a href="#gameplay">Gameplay</a>
      <a className="site-navbar-logo" href={import.meta.env.BASE_URL} aria-label="OMORI home" onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        onHome()
      }}>
        <img src={omoriWordmark} alt="OMORI" width="163" height="58" />
      </a>
      <a href="#news">News</a>
      <a href="#footer">Download</a>
    </nav>
  )
}
