import { Link, Navigate } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { useRolActual } from '@/hooks/useRolActual'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'

const CANALES = [
  {
    icon: '📂',
    title: 'Gestión de Datos',
    desc: 'Proyectos, fuentes y carga de datos',
    action: 'Abrir panel de datos',
    to: '/data',
  },
  {
    icon: '📄',
    title: 'Formulario web',
    desc: 'Completa el formulario',
    action: 'Ir al formulario',
    to: '/reportar/formulario',
  },
]

export function Participacion() {
  const { tieneNivel } = useRolActual()

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'participacion',
    steps: [
      {
        element: '[data-tour="participacion-canales"]',
        popover: {
          title: 'Canales de reporte',
          description: 'Elige por dónde quieres reportar: gestión de datos (investigadores) o el formulario web.',
        },
      },
    ],
  })

  if (!tieneNivel('reportador')) return <Navigate to="/" replace />

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Reporta información desde tu territorio</h1>
        <p className="text-sm text-fg-muted mt-1">
          Tu información es muy importante para entender y cuidar nuestros ecosistemas.
        </p>
      </div>

      <div data-tour="participacion-canales" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CANALES.map((c) => (
          <Card key={c.title} className="flex flex-col items-start gap-2">
            <span className="text-xl" aria-hidden>
              {c.icon}
            </span>
            <p className="text-sm font-semibold text-fg">{c.title}</p>
            <p className="text-xs text-fg-muted">{c.desc}</p>
            <Link
              to={c.to}
              className="mt-auto text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline"
            >
              {c.action} →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
