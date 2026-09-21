import { useEffect, useMemo, useReducer, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DatosTabs, TABS, type TabDef } from '@/components/etl-datos/DatosTabs'
import { DatosToolbar } from '@/components/etl-datos/DatosToolbar'
import { DatosTable } from '@/components/etl-datos/DatosTable'
import { Paginacion } from '@/components/common/Paginacion'
import { FuenteDrawer } from '@/components/admin/fuentes/FuenteDrawer'
import { TourButton } from '@/components/common/TourButton'
import { useDatosProyecto } from '@/hooks/useDatosProyecto'
import { useDatosCarga } from '@/hooks/useDatosCarga'
import { useFuentesDropdown } from '@/hooks/useFuentesDropdown'
import { useReglasAutollenado } from '@/hooks/useReglasAutollenado'
import { useOnboardingTour, haVistoTour } from '@/hooks/useOnboardingTour'
import { datosService } from '@/services/datos.service'
import { downloadFile } from '@/utils/download'
import { useAuthStore } from '@/store/useAuthStore'

const LIMITE = 200

function tabPorId(tabId: string): TabDef {
  return TABS.find((t) => t.id === tabId) ?? TABS[0]
}

function filtroBaseTab(tab: TabDef): Record<string, string> {
  return tab.gas ? { 'MuestraGEI.gas': tab.gas } : {}
}

interface State {
  tabId: string
  offset: number
  filtros: Record<string, string>
}

type Action =
  | { type: 'SET_TAB'; tabId: string }
  | { type: 'SET_OFFSET'; offset: number }
  | { type: 'SET_FILTRO'; clave: string; valor: string }
  | { type: 'CLEAR_FILTROS' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TAB':
      return { tabId: action.tabId, offset: 0, filtros: filtroBaseTab(tabPorId(action.tabId)) }
    case 'SET_OFFSET':
      return { ...state, offset: action.offset }
    case 'SET_FILTRO': {
      const filtros = { ...state.filtros }
      if (action.valor) filtros[action.clave] = action.valor
      else delete filtros[action.clave]
      return { ...state, offset: 0, filtros }
    }
    case 'CLEAR_FILTROS':
      return { ...state, offset: 0, filtros: filtroBaseTab(tabPorId(state.tabId)) }
  }
}

export function EtlDatos() {
  const token = useAuthStore((s) => s.token)
  const [descargando, setDescargando] = useState(false)
  const [descargarError, setDescargarError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const proyectoIdParam = searchParams.get('proyecto')
  const fuenteIdParam = searchParams.get('fuente')
  const cargaIdParam = searchParams.get('carga')
  const proyectoId = proyectoIdParam ? Number(proyectoIdParam) : null
  const fuenteId = fuenteIdParam ? Number(fuenteIdParam) : null
  const cargaId = cargaIdParam ? Number(cargaIdParam) : null

  const [state, dispatch] = useReducer(reducer, {
    tabId: 'CO2',
    offset: 0,
    filtros: filtroBaseTab(TABS[0]),
  })
  const tabActual = tabPorId(state.tabId)

  const { data: dropdownData, isLoading: fuentesLoading } = useFuentesDropdown(proyectoId ?? undefined)
  const { data: reglas } = useReglasAutollenado()

  const proyectoActualId = useMemo(() => {
    if (proyectoId != null) return proyectoId
    const fuente = dropdownData?.fuentes.find((f) => f.id === fuenteId)
    return fuente?.proyecto?.id ?? null
  }, [proyectoId, fuenteId, dropdownData])

  const proyectoNombre = useMemo(
    () => dropdownData?.proyectos.find((p) => p.id === proyectoActualId)?.nombre ?? null,
    [dropdownData, proyectoActualId]
  )

  const filtrosQuery = { vista: tabActual.vista, filtros: state.filtros, offset: state.offset, limite: LIMITE }
  const datosProyectoQuery = useDatosProyecto(proyectoId != null ? proyectoId : null, filtrosQuery)
  const datosCargaQuery = useDatosCarga(fuenteId, cargaId, filtrosQuery)
  const { data, isLoading, isError, error } = proyectoId != null ? datosProyectoQuery : datosCargaQuery

  const faltaOrigen = proyectoId == null && (fuenteId == null || cargaId == null)

  const total = data?.total ?? 0
  const columnas = data?.columnas ?? []
  const filas = data?.filas ?? []

  const hayFiltrosExtra = Object.keys(state.filtros).length > Object.keys(filtroBaseTab(tabActual)).length

  const origen = proyectoId != null
    ? proyectoNombre || `Proyecto #${proyectoId}`
    : proyectoNombre
      ? `${proyectoNombre} · Carga #${cargaId}`
      : `Carga #${cargaId}`

  const descargarUrl = proyectoId != null
    ? datosService.getExportarProyectoUrl(proyectoId)
    : fuenteId != null && cargaId != null
      ? datosService.getExportarCargaUrl(fuenteId, cargaId)
      : ''

  const volverHref = fuenteId != null ? `/etl/upload?fuente=${fuenteId}` : '/data'
  const volverLabel = fuenteId != null ? '← Volver al ETL' : '← Volver a Gestión de Datos'

  const handleDescargar = async () => {
    if (!descargarUrl) return
    setDescargando(true)
    setDescargarError(null)
    try {
      await downloadFile(descargarUrl, token)
    } catch (err) {
      setDescargarError(err instanceof Error ? err.message : 'No se pudo descargar el archivo.')
    } finally {
      setDescargando(false)
    }
  }

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'etl-datos',
    autoStart: false,
    steps: [
      {
        element: '[data-tour="etl-tabs"]',
        popover: {
          title: 'Pestañas de gas',
          description: 'Cambia entre CO₂ y CH₄, y las demás vistas, para ver los datos de cada una.',
        },
      },
      {
        element: '[data-tour="etl-limpiar"]',
        popover: {
          title: 'Limpiar filtros',
          description: 'Quita los filtros que hayas aplicado en la tabla.',
        },
      },
      {
        element: '[data-tour="etl-cargar-dropdown"]',
        popover: {
          title: 'Cargar / fuente',
          description: 'Elige de qué proyecto o fuente quieres ver los datos cargados.',
        },
      },
      {
        element: '[data-tour="etl-descargar"]',
        popover: {
          title: 'Descargar Excel',
          description: 'Descarga la tabla actual (con los filtros aplicados) en Excel.',
        },
      },
      {
        element: '[data-tour="etl-tabla"]',
        popover: {
          title: 'Tabla de datos',
          description: 'Puedes filtrar directamente por columna, haciendo clic en el encabezado.',
        },
      },
      {
        element: '[data-tour="etl-paginacion"]',
        popover: {
          title: 'Paginación',
          description: `Navega entre páginas si hay más de ${LIMITE} registros.`,
        },
      },
    ],
  })

  useEffect(() => {
    if (haVistoTour('etl-datos')) return
    if (faltaOrigen || isError || isLoading || !columnas.length) return
    const timer = setTimeout(iniciarTour, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faltaOrigen, isError, isLoading, columnas.length])

  return (
    <div className="flex-1 p-6 flex flex-col gap-1 max-w-[1400px] mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Datos cargados</h1>
        <p className="text-sm text-fg-muted mt-1">
          {faltaOrigen ? 'Vista desnormalizada de lo importado.' : `${origen} — ${tabActual.label}.`}
        </p>
      </div>

      <DatosTabs activeId={state.tabId} onChange={(tabId) => dispatch({ type: 'SET_TAB', tabId })} />

      <DatosToolbar
        info={total ? `${total} registro${total === 1 ? '' : 's'} · ${columnas.length} columnas` : 'Sin registros'}
        hayFiltrosExtra={hayFiltrosExtra}
        onLimpiarFiltros={() => dispatch({ type: 'CLEAR_FILTROS' })}
        proyectoActualId={proyectoActualId}
        proyectoNombre={proyectoNombre}
        fuentes={dropdownData?.fuentes ?? []}
        fuentesLoading={fuentesLoading}
        fuenteActualId={fuenteId}
        onDescargar={handleDescargar}
        descargando={descargando}
        volverHref={volverHref}
        volverLabel={volverLabel}
      />

      {descargarError && (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          {descargarError}
        </div>
      )}

      {faltaOrigen ? (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Falta indicar la fuente y la carga, o el proyecto (parámetros ?fuente=&carga= o ?proyecto= en la URL).
        </div>
      ) : isError ? (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Error al cargar los datos: {error instanceof Error ? error.message : 'error desconocido'}
        </div>
      ) : isLoading && !columnas.length ? (
        <div className="text-center text-fg-muted text-sm py-10">Cargando datos…</div>
      ) : (
        <>
          <DatosTable
            columnas={columnas}
            filas={filas}
            filtros={state.filtros}
            reglas={reglas}
            onFiltroChange={(clave, valor) => dispatch({ type: 'SET_FILTRO', clave, valor })}
            advertencia={data?.advertencia}
            fuenteId={fuenteId}
            cargaId={cargaId}
          />
          <Paginacion
            offset={state.offset}
            limite={LIMITE}
            total={total}
            filasCount={filas.length}
            onAnterior={() => dispatch({ type: 'SET_OFFSET', offset: Math.max(state.offset - LIMITE, 0) })}
            onSiguiente={() => dispatch({ type: 'SET_OFFSET', offset: state.offset + LIMITE })}
          />
        </>
      )}

      <FuenteDrawer />
    </div>
  )
}
