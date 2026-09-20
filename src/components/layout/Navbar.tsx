import { NavLink } from 'react-router-dom'
import { useThemeStore } from '@/store/useThemeStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useMe } from '@/hooks/useAuth'
import { useRolActual } from '@/hooks/useRolActual'
import { LoginButton } from '@/components/layout/LoginButton'
import { UserMenu } from '@/components/layout/UserMenu'
import logoHorizontal from '@/assets/files/LOGO_FINAL_Horizontal.png'

const LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/mapas', label: 'Mapas' },
  { to: '/dashboard', label: 'Datos' },
  { to: '/educacion', label: 'Educación' },
]

const ADMIN_LINKS = [
  { to: '/data', label: 'Gestión de datos' },
  { to: '/db', label: 'Modelo de datos' },
  { to: '/team', label: 'Equipo' },
]

export function Navbar() {
  const { theme, toggleTheme } = useThemeStore()
  const usuario = useAuthStore((s) => s.usuario)
  const { isAdmin, tieneNivel } = useRolActual()
  useMe()

  return (
    <header className="h-14 shrink-0 bg-panel border-b border-border flex items-center px-6 gap-6 sticky top-0 z-30">
      <NavLink to="/" className="flex items-center gap-3 shrink-0">
        <span className="dark:bg-white dark:rounded-md dark:px-2 dark:py-1 flex items-center">
          <img src={logoHorizontal} alt="Colflux" className="h-8 w-auto" />
        </span>
      </NavLink>

      <nav className="hidden md:flex items-center gap-1 ml-4">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-brand-teal dark:text-brand-teal-bright bg-brand-teal/10'
                  : 'text-fg-muted hover:text-fg hover:bg-surface'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        {tieneNivel('reportador') ? (
          <NavLink
            to="/reportar"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-brand-teal dark:text-brand-teal-bright bg-brand-teal/10'
                  : 'text-fg-muted hover:text-fg hover:bg-surface'
              }`
            }
          >
            Reportar
          </NavLink>
        ) : (
          <span
            title="Reportar — disponible desde el nivel reportador"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-fg-subtle opacity-50 cursor-not-allowed"
          >
            Reportar
          </span>
        )}
        {isAdmin && (
          <>
            <span className="w-px h-4 bg-border mx-1" />
            {ADMIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-teal dark:text-brand-teal-bright bg-brand-teal/10'
                      : 'text-fg-muted hover:text-fg hover:bg-surface'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {usuario ? <UserMenu /> : <LoginButton />}
        <button
          onClick={toggleTheme}
          className="text-xs bg-surface border border-border text-fg-muted hover:text-fg px-3 py-1.5 rounded-full font-medium transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      </div>
    </header>
  )
}
