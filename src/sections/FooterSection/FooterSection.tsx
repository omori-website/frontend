import './FooterSection.css'
import omoriWordmark from '../../assets/footer/omori-wordmark.png'
import steamDownload from '../../assets/footer/steamdownload.png'
import omoriFooter from '../../assets/footer/omori-footer.png'

export default function FooterSection() {
  return (
    <footer id="footer" className="site-footer" aria-label="OMORI footer">
      <div className="footer-brand">
        <a className="footer-logo" href={import.meta.env.BASE_URL} aria-label="OMORI home">
          <img src={omoriWordmark} alt="OMORI" width="250" height="68" />
        </a>
        <p>website revamp for competition entry</p>
        <a className="footer-steam" href="https://store.steampowered.com/app/1150690/OMORI/" target="_blank" rel="noreferrer">
          <img src={steamDownload} alt="Download OMORI on Steam" width="228" height="73" />
        </a>
      </div>
      <img className="footer-omori" src={omoriFooter} alt="" width="313" height="371" />
      <nav className="footer-navigation" aria-label="Footer navigation">
        <a href={import.meta.env.BASE_URL}>Home</a>
        <a href="#about">About</a>
        <a href="#characters">characters</a>
        <a href="#gameplay">Gameplay</a>
        <a href="#news">News</a>
      </nav>
    </footer>
  )
}
