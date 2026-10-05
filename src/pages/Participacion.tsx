import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { useRolActual } from '@/hooks/useRolActual'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { useAuthStore } from '@/store/useAuthStore'
import { datosService } from '@/services/datos.service'
import { downloadFile } from '@/utils/download'

interface Canal {
  icon: string
  title: string
  desc: string
  action: string
  to: string
  disabled?: boolean // canal visible pero aún no disponible ("Próximamente")
}

const CANALES: Canal[] = [
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
    desc: 'Sube tus archivos de datos',
    action: 'Ir al formulario',
    to: '/reportar/formulario',
  },
]

export function Participacion() {
  const { tieneNivel } = useRolActual()
  const token = useAuthStore((s) => s.token)
  const [descargando, setDescargando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)

  async function handleDescargarPlantilla() {
    setDescargando(true)
    setErrorDescarga(null)
    try {
      await downloadFile(datosService.getPlantillaVaciaUrl(), token)
    } catch (err) {
      setErrorDescarga(err instanceof Error ? err.message : 'No se pudo descargar la plantilla.')
    } finally {
      setDescargando(false)
    }
  }

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
          <Card
            key={c.title}
            className={`flex flex-col items-start gap-2 ${c.disabled ? 'opacity-50' : ''}`}
          >
            <span className="text-xl" aria-hidden>
              {c.icon}
            </span>
            <p className="text-sm font-semibold text-fg">{c.title}</p>
            <p className="text-xs text-fg-muted">{c.desc}</p>
            {c.disabled ? (
              <span className="mt-auto text-xs font-semibold text-fg-subtle">Próximamente</span>
            ) : (
              <Link
                to={c.to}
                className="mt-auto text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline"
              >
                {c.action} →
              </Link>
            )}
          </Card>
        ))}

        <Card className="flex flex-col items-start gap-2">
          <span className="text-xl" aria-hidden>
            📥
          </span>
          <p className="text-sm font-semibold text-fg">Plantilla de datos</p>
          <p className="text-xs text-fg-muted">
            Descarga un Excel vacío con los campos de Flujos, MOM, COS y Biomasa, más el
            diccionario de datos, para llenarlo y subirlo.
          </p>
          <button
            type="button"
            onClick={handleDescargarPlantilla}
            disabled={descargando}
            className="mt-auto text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {descargando ? 'Descargando…' : 'Descargar plantilla →'}
          </button>
          {errorDescarga && (
            <p className="text-xs text-red-600 dark:text-red-400">{errorDescarga}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
