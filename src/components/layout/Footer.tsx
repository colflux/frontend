import { Link } from 'react-router-dom'
import logo from '@/assets/files/LOGO_FINAL_Blanco.png'

const PLATAFORMA_LINKS = [
  { label: 'Mapas', to: '/mapas' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Reportar', to: '/reportar' },
]

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5l5 2.5-5 2.5v-5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

const REDES = [
  { label: 'Instagram', href: 'https://www.instagram.com/col_flux/', Icon: InstagramIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@Colflux', Icon: YoutubeIcon },
]

export function Footer() {
  return (
    <footer className="bg-brand-teal-dark dark:bg-surface dark:border-t dark:border-white/10 text-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <img src={logo} alt="COLFLUX" className="h-10 w-auto" />
          <p className="mt-3 text-sm text-white/70 max-w-xs">
            Sistema integrado de observación y cuantificación de carbono en páramos y humedales de
            Colombia.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Plataforma</p>
          <ul className="mt-3 space-y-2">
            {PLATAFORMA_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Síguenos</p>
          <ul className="mt-3 space-y-2">
            {REDES.map((red) => (
              <li key={red.label}>
                <a
                  href={red.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  <red.Icon />
                  {red.label} ↗
                </a>
              </li>
            ))}
          </ul>

          <a
            href="https://docs.google.com/forms/d/1iZiOCuICWl6gJ6dctnz2YTZnvz64F8yqCtilJjT2HD0/edit"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block bg-brand-yellow hover:bg-brand-yellow-dark text-brand-brown px-4 py-2 rounded-full text-sm font-semibold transition-colors"
          >
            Contáctanos
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/70">
        🌿 COLFLUX v1.3.1
      </div>
    </footer>
  )
}
