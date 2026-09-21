import { useRef, useState } from 'react'
import { useFuentesDropdown } from '@/hooks/useFuentesDropdown'
import { ProyectosTable } from '@/components/data/ProyectosTable'
import { FuentesTable } from '@/components/data/FuentesTable'
import { ProyectoDrawer } from '@/components/admin/proyectos/ProyectoDrawer'
import { UsuarioDrawer } from '@/components/admin/usuarios/UsuarioDrawer'
import { FuenteDrawer } from '@/components/admin/fuentes/FuenteDrawer'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import type { FuenteDatos } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

function ApiStatusCard({ isError, isLoading }: { isError: boolean; isLoading: boolean }) {
  const offline = isError
  return (
    <div
      className={`w-full bg-panel border rounded-lg px-4.5 py-3.5 flex items-center justify-between gap-4 flex-wrap ${
        offline ? 'border-red-500' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center text-lg shrink-0 ${
            offline
              ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
              : 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright'
          }`}
        >
          🔌
        </div>
        <div>
          <p className="text-sm font-extrabold text-fg">
            {isLoading ? 'Conectando con la API' : offline ? 'API sin conexión' : 'API conectada'}
          </p>
          <p className="text-xs text-fg-muted">Dirección actual del backend</p>
        </div>
      </div>
      <code
        className={`text-xs font-mono rounded-md px-2.5 py-1.5 truncate max-w-[420px] ${
          offline
            ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
            : 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright'
        }`}
      >
        {API_BASE}
      </code>
    </div>
  )
}

function StatsBar({ fuentes }: { fuentes: FuenteDatos[] }) {
  const total = fuentes.length
  const completas = fuentes.filter((f) => f.estado === 'completo').length
  const pendientes = fuentes.filter((f) => f.estado === 'pendiente').length
  const errores = fuentes.filter((f) => f.estado === 'con_errores').length
  const chips = [
    { label: 'fuentes totales', value: total },
    { label: 'completas', value: completas },
    { label: 'pendientes', value: pendientes },
    { label: 'con errores', value: errores },
  ]
  return (
    <div className="flex gap-3 flex-wrap">
      {chips.map((c) => (
        <div key={c.label} className="bg-panel border border-border rounded-lg px-4 py-2.5 flex items-center gap-2.5">
          <strong className="text-xl font-extrabold text-brand-teal-dark dark:text-brand-teal-bright leading-none">
            {c.value}
          </strong>
          <span className="text-xs text-fg-muted">{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export function DataGestion() {
  const { data, isLoading, isError } = useFuentesDropdown()
  const [proyectoFiltro, setProyectoFiltro] = useState('')
  const fuentesRef = useRef<HTMLDivElement>(null)

  const fuentes = data?.fuentes ?? []
  const proyectos = data?.proyectos ?? []

  function handleVerFuentes(proyectoId: number) {
    setProyectoFiltro(String(proyectoId))
    fuentesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'data-gestion',
    steps: [
      {
        element: '[data-tour="data-api-status"]',
        popover: {
          title: 'Estado de la API',
          description: 'Indica si el backend está conectado y con qué dirección.',
        },
      },
      {
        element: '[data-tour="data-stats"]',
        popover: {
          title: 'Resumen de fuentes',
          description: 'Total de fuentes registradas y cuántas están completas, pendientes o con errores.',
        },
      },
      {
        element: '[data-tour="data-proyectos"]',
        popover: {
          title: 'Proyectos',
          description: 'Cada proyecto agrupa sus fuentes de datos. Usa "Ver fuentes" para filtrar la tabla de abajo.',
        },
      },
      {
        element: '[data-tour="data-fuentes"]',
        popover: {
          title: 'Fuentes de datos',
          description: 'Archivos Excel, CSVs, shapefiles y APIs registrados, con su estado y acceso directo.',
        },
      },
    ],
  })

  return (
    <div className="flex-1 p-6 flex flex-col gap-5 max-w-[1140px] mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Gestión de Datos</h1>
        <p className="text-sm text-fg-muted mt-1">
          Registro de todas las fuentes de datos del proyecto: archivos Excel, CSVs, shapefiles y APIs. Consulta el
          estado de cada fuente y accede directamente al archivo.
        </p>
      </div>

      <div data-tour="data-api-status">
        <ApiStatusCard isError={isError} isLoading={isLoading} />
      </div>
      <div data-tour="data-stats">
        <StatsBar fuentes={fuentes} />
      </div>

      <div data-tour="data-proyectos">
        <ProyectosTable proyectos={proyectos} fuentes={fuentes} onVerFuentes={handleVerFuentes} />
      </div>

      <div ref={fuentesRef} />

      <div data-tour="data-fuentes">
        <FuentesTable
          fuentes={fuentes}
          proyectos={proyectos}
          proyectoFiltro={proyectoFiltro}
          onProyectoFiltroChange={setProyectoFiltro}
        />
      </div>

      <ProyectoDrawer />
      <UsuarioDrawer />
      <FuenteDrawer />
    </div>
  )
}
