import { useEffect, useRef, useState } from 'react'
import './Navbar.css'
import omoriWordmark from '../../assets/footer/omori-wordmark.png'

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let previousY = window.scrollY
    function onScroll() {
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight))
      if (y <= 24) {
        setHidden(false)
      } else if (Math.abs(y - previousY) < 6) {
        return
      } else {
        setHidden(y > previousY && !navRef.current?.contains(document.activeElement))
      }
      previousY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav ref={navRef} className={`site-navbar${hidden ? ' is-hidden' : ''}`} aria-label="Main navigation"
      onFocus={() => setHidden(false)}>
      <a href="#characters">Character</a>
      <a href="#gameplay">Gameplay</a>
      <a className="site-navbar-logo" href={import.meta.env.BASE_URL} aria-label="OMORI home">
        <img src={omoriWordmark} alt="OMORI" width="163" height="58" />
      </a>
      <a href="#news">News</a>
      <a href="#footer">Download</a>
    </nav>
  )
}
