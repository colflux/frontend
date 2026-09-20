import { NavLink } from 'react-router-dom'
import { useRolActual } from '@/hooks/useRolActual'

const ITEMS = [
  { to: '/mapas', icon: '🗺️', label: 'Mapa' },
  { to: '/dashboard', icon: '📊', label: 'Indicadores' },
]

const SOON_ITEMS = [
  { icon: '🤖', label: 'Insights' },
  { icon: '📡', label: 'Sensores' },
  { icon: '🧩', label: 'Capas' },
  { icon: '⬇️', label: 'Descargas' },
  { icon: '⭐', label: 'Favoritos' },
]

export function AppSidebar() {
  const { tieneNivel } = useRolActual()

  return (
    <aside className="w-16 shrink-0 bg-panel border-r border-border flex flex-col items-center py-4 gap-1">
      {tieneNivel('reportador') && (
        <NavLink
          to="/reportar"
          title="Reportar"
          className={({ isActive }) =>
            `w-12 h-12 flex flex-col items-center justify-center rounded-lg text-[10px] font-medium gap-0.5 transition-colors ${
              isActive
                ? 'bg-brand-teal/10 text-brand-teal dark:text-brand-teal-bright'
                : 'text-fg-muted hover:bg-surface hover:text-fg'
            }`
          }
        >
          <span className="text-base" aria-hidden>
            📝
          </span>
          Reportar
        </NavLink>
      )}
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.label}
          className={({ isActive }) =>
            `w-12 h-12 flex flex-col items-center justify-center rounded-lg text-[10px] font-medium gap-0.5 transition-colors ${
              isActive
                ? 'bg-brand-teal/10 text-brand-teal dark:text-brand-teal-bright'
                : 'text-fg-muted hover:bg-surface hover:text-fg'
            }`
          }
        >
          <span className="text-base" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}

      <div className="w-8 border-t border-border my-2" />

      {SOON_ITEMS.map((item) => (
        <div
          key={item.label}
          title={`${item.label} — próximamente`}
          className="w-12 h-12 flex flex-col items-center justify-center rounded-lg text-[10px] font-medium gap-0.5 text-fg-subtle opacity-50 cursor-not-allowed"
        >
          <span className="text-base" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </div>
      ))}
    </aside>
  )
}
