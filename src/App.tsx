import { useState } from 'react'
import HeroSection from './sections/HeroSection/HeroSection'
import AboutSection from './sections/AboutSection/AboutSection'

function App() {
  const [heroComplete, setHeroComplete] = useState(false)

  return (
    <main>
      {!heroComplete && <HeroSection onComplete={() => setHeroComplete(true)} />}
      <AboutSection active={heroComplete} />
    </main>
  )
}

export default App
