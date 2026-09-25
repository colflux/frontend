import { useEffect, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useDatosProyecto } from '@/hooks/useDatosProyecto'
import { useResumenCategorico } from '@/hooks/useResumenCategorico'
import { datosService } from '@/services/datos.service'
import { downloadFile } from '@/utils/download'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { metodologiaToCategoria } from '@/utils/geoFilters'
import { CATEGORIA_LABELS } from '@/utils/formatters'
import { ENTIDAD_MAP } from '@/utils/catalogoModel'
import { FlujosGraficasPanel } from '@/components/charts/FlujosGraficasPanel'
import { BiomasaProduccionScatter } from '@/components/charts/BiomasaProduccionScatter'
import { CosProfundidadChart } from '@/components/charts/CosProfundidadChart'
import type { SitioFeature, VistaDatos } from '@/types'

interface Props {
  sitio: SitioFeature
  onClose: () => void
}

const LIMITE = 50

const GAS_COLUMNA = 'MuestraGEI.gas'
const ANALIZADOR_COLUMNA = 'Equipo.modelo'
const CONDICION_LUZ_COLUMNA = 'SubmuestraGEI.condicion_luz'

// Una sola fila de pestañas: CO2 y CH4 son la vista "submuestra_gei" filtrada
// por gas (el backend no expone vistas separadas por gas), Unidad de
// Muestreo y Clima son vistas propias. Por ahora no hay más pestañas.
const DETALLE_TABS: { key: string; label: string; vista: VistaDatos; gasFiltro?: string }[] = [
  { key: 'CO2', label: 'CO2', vista: 'submuestra_gei', gasFiltro: 'CO' },
  { key: 'CH4', label: 'CH4', vista: 'submuestra_gei', gasFiltro: 'CH' },
  { key: 'unidad_muestreo', label: 'Unidad de Muestreo / Experimental', vista: 'unidad_muestreo' },
  { key: 'clima', label: 'Clima', vista: 'clima' },
]

// Color por modelo: mismo criterio que la tabla del ETL (`DatosTable.tsx`) —
// viene de `catalogo.json` vía `ENTIDAD_MAP`, no de una paleta local por
// orden de aparición, así ambas tablas pintan cada modelo con el mismo color
// que el diagrama ERD de /db y el Excel exportado.
function colorDeModelo(modelo: string): string {
  return ENTIDAD_MAP[modelo]?.color ?? '#374151'
}

export function SiteDetailPanel({ sitio, onClose }: Props) {
  const token = useAuthStore((s) => s.token)
  const metodologia = useAppStore((s) => s.metodologia)
  const year = useAppStore((s) => s.filters.year)
  const flujosCondicionLuzId = useAppStore((s) => s.flujosCondicionLuzId)
  const flujosAnalizadorId = useAppStore((s) => s.flujosAnalizadorId)
  const categoria = useMemo(() => metodologiaToCategoria(metodologia), [metodologia])
  // El store guarda el id del analizador (para /api/geo/resumen-categorico/,
  // que sí filtra por FK), pero el mecanismo genérico de "filtros" de esta
  // tabla hace icontains de texto sobre "Equipo.modelo" -hay que resolver
  // primero el nombre-. Solo se pide si hace falta.
  const { data: analizadorData } = useResumenCategorico('analizador', {}, flujosAnalizadorId != null)
  const analizadorNombre = analizadorData?.resultados.find(
    (r) => String(r.id) === String(flujosAnalizadorId)
  )?.nombre
  // Un solo panel con pestañas de sección (Gráficas / Datos detallados) en vez
  // de dos bloques apilados: así el panel no ocupa toda la pantalla.
  const [activeSection, setActiveSection] = useState<'graficas' | 'datos'>('graficas')
  const proyectosDelSitio = sitio.properties.proyectos
  const [proyectoId, setProyectoId] = useState<number | null>(proyectosDelSitio[0]?.id ?? null)
  const [activeTab, setActiveTab] = useState(DETALLE_TABS[0].key)
  const [filtrosInput, setFiltrosInput] = useState<Record<string, string>>({})
  const [filtros, setFiltros] = useState<Record<string, string>>({})
  const [offset, setOffset] = useState(0)
  const [exportando, setExportando] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const tab = DETALLE_TABS.find((t) => t.key === activeTab) ?? DETALLE_TABS[0]

  // Al abrir un sitio nuevo, reiniciar todo el estado del panel.
  useEffect(() => {
    setProyectoId(sitio.properties.proyectos[0]?.id ?? null)
    setActiveTab(DETALLE_TABS[0].key)
    setFiltrosInput({})
    setFiltros({})
    setOffset(0)
    setActiveSection('graficas')
    setExportError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitio.properties.id])

  const handleDescargarExcel = async () => {
    if (proyectoId == null) return
    setExportando(true)
    setExportError(null)
    try {
      await downloadFile(datosService.getExportarProyectoUrl(proyectoId), token)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'No se pudo descargar el archivo.')
    } finally {
      setExportando(false)
    }
  }

  // Los inputs de filtro se aplican con un pequeño debounce, y siempre
  // vuelven a la primera página (offset 0) al cambiar.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFiltros(filtrosInput)
      setOffset(0)
    }, 400)
    return () => clearTimeout(timeout)
  }, [filtrosInput])

  const sitioId = sitio.properties.id

  // El gas de la pestaña (CO2/CH4), el día/noche y el analizador del panel de
  // filtros se fuerzan en el filtro de columna correspondiente, sin importar
  // lo que el usuario haya tipeado ahí -mismo criterio que ya existía para el
  // gas-. Las tres claves solo existen en la vista "submuestra_gei" (CO2/CH4);
  // el backend ignora en silencio claves que no aplican a otras vistas.
  const filtrosEfectivos = useMemo(() => {
    const extra: Record<string, string> = {}
    if (tab.gasFiltro) extra[GAS_COLUMNA] = tab.gasFiltro
    if (tab.vista === 'submuestra_gei' && flujosCondicionLuzId != null) {
      extra[CONDICION_LUZ_COLUMNA] = String(flujosCondicionLuzId)
    }
    if (tab.vista === 'submuestra_gei' && analizadorNombre) {
      extra[ANALIZADOR_COLUMNA] = analizadorNombre
    }
    return Object.keys(extra).length ? { ...filtros, ...extra } : filtros
  }, [filtros, tab.gasFiltro, tab.vista, flujosCondicionLuzId, analizadorNombre])

  // Año del panel de filtros -> desde/hasta, igual que en el resto de la app.
  // Aplica a todas las vistas cuyo modelo base tenga un campo "fecha" propio
  // (el backend ignora el filtro si no lo tiene, ej. unidad_muestreo).
  const rangoFechas = useMemo(
    () => (year != null ? { desde: `${year}-01-01`, hasta: `${year}-12-31` } : {}),
    [year]
  )

  // Chequeo liviano (limite=1) de qué pestañas tienen datos para este sitio,
  // para poder ocultarlas cuando no aplican, como pide la referencia del panel ETL.
  const tabsConDatos = useQueries({
    queries: DETALLE_TABS.map((t) => {
      const extra: Record<string, string> = {}
      if (t.gasFiltro) extra[GAS_COLUMNA] = t.gasFiltro
      if (t.vista === 'submuestra_gei' && flujosCondicionLuzId != null) {
        extra[CONDICION_LUZ_COLUMNA] = String(flujosCondicionLuzId)
      }
      if (t.vista === 'submuestra_gei' && analizadorNombre) {
        extra[ANALIZADOR_COLUMNA] = analizadorNombre
      }
      return {
        queryKey: ['datos-proyecto-tab', proyectoId, sitioId, t.key, rangoFechas, extra],
        queryFn: () => datosService.getDatosProyecto(proyectoId as number, {
          vista: t.vista,
          sitio: sitioId,
          filtros: Object.keys(extra).length ? extra : undefined,
          ...rangoFechas,
          limite: 1,
          offset: 0,
        }),
        enabled: proyectoId != null,
      }
    }),
  })

  const tabsVisibles = DETALLE_TABS.filter((_, i) => (tabsConDatos[i].data?.total ?? 0) > 0)

  // Si la pestaña actualmente seleccionada quedó vacía, saltar a la primera que sí tenga datos.
  useEffect(() => {
    if (tabsVisibles.length && !tabsVisibles.some((t) => t.key === activeTab)) {
      setActiveTab(tabsVisibles[0].key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabsVisibles.map((t) => t.key).join(',')])

  const { data, isLoading, isFetching } = useDatosProyecto(proyectoId, {
    vista: tab.vista, sitio: sitioId, filtros: filtrosEfectivos, ...rangoFechas, offset, limite: LIMITE,
  })

  const gruposModelo = useMemo(() => {
    const grupos: { modelo: string; colSpan: number }[] = []
    data?.columnas.forEach((c) => {
      const ultimo = grupos[grupos.length - 1]
      if (ultimo && ultimo.modelo === c.modelo) ultimo.colSpan += 1
      else grupos.push({ modelo: c.modelo, colSpan: 1 })
    })
    return grupos
  }, [data?.columnas])

  const total = data?.total ?? 0
  const nColumnas = data?.columnas.length ?? 0

  const sectionTabClass = (key: 'graficas' | 'datos') =>
    `px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-t-md transition-colors ${
      activeSection === key
        ? 'bg-surface text-fg border border-border border-b-0'
        : 'text-fg-muted hover:text-fg'
    }`

  return (
    <div className="flex flex-col max-h-[70vh] overflow-hidden bg-panel">
      {/* Un solo panel con pestañas de sección arriba (en vez de dos bloques
          apilados): Gráficas no depende de proyectoId -se consulta por
          sitio directamente-, Datos detallados sí. */}
      <div className="w-full flex items-center justify-between px-4 pt-2 border-b border-border">
        <div className="flex gap-1">
          <button onClick={() => setActiveSection('graficas')} className={sectionTabClass('graficas')}>
            Gráficas
          </button>
          <button onClick={() => setActiveSection('datos')} className={sectionTabClass('datos')}>
            Datos detallados
          </button>
        </div>
        <div className="flex items-center gap-3 pb-2">
          {activeSection === 'datos' && proyectoId != null && proyectosDelSitio.length > 1 && (
            <select
              value={proyectoId ?? ''}
              onChange={(e) => setProyectoId(Number(e.target.value))}
              className="bg-surface border border-border text-fg text-xs rounded-md px-2 py-1"
            >
              {proyectosDelSitio.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}
          {activeSection === 'datos' && proyectoId != null && (
            <>
              {exportError && <span className="text-xs text-red-500">{exportError}</span>}
              <button
                onClick={handleDescargarExcel}
                disabled={exportando}
                className="px-2.5 py-1 text-xs font-medium border border-border rounded-md text-fg hover:bg-surface transition-colors disabled:opacity-50"
              >
                {exportando ? 'Descargando…' : '⭳ Descargar Excel'}
              </button>
            </>
          )}
          <button onClick={onClose} className="text-base hover:text-fg transition-colors" aria-label="Cerrar">✕</button>
        </div>
      </div>

      {activeSection === 'graficas' && (
        <div className="overflow-auto px-4 py-4">
          <p className="text-xs text-fg-muted font-semibold uppercase tracking-wider mb-2">{CATEGORIA_LABELS[categoria]}</p>
          {categoria === 'flujos' && <FlujosGraficasPanel sitioId={sitioId} proyectoId={proyectoId} />}
          {categoria === 'biomasa' && <BiomasaProduccionScatter sitioId={sitioId} />}
          {categoria === 'cos' && <CosProfundidadChart sitioId={sitioId} />}
        </div>
      )}

      {activeSection === 'datos' && (
        proyectoId == null ? (
          <div className="px-4 py-4 text-sm text-fg-subtle">Este sitio no tiene un proyecto asociado.</div>
        ) : (
          <>
            <div className="flex gap-1 px-4 pt-2 border-b border-border">
              {tabsVisibles.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setOffset(0) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                    activeTab === t.key
                      ? 'bg-surface text-fg border border-border border-b-0'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              {!tabsVisibles.length && !isLoading && (
                <span className="text-xs text-fg-subtle py-1.5">Este sitio todavía no tiene datos importados.</span>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 text-xs text-fg-muted">
              <span>{total.toLocaleString('es-CO')} registros · {nColumnas} columnas</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - LIMITE))}
                  className="px-2 py-1 border border-border rounded disabled:opacity-40"
                >
                  ‹ Anterior
                </button>
                <span>{total === 0 ? 0 : offset + 1}–{Math.min(offset + LIMITE, total)}</span>
                <button
                  disabled={offset + LIMITE >= total}
                  onClick={() => setOffset((o) => o + LIMITE)}
                  className="px-2 py-1 border border-border rounded disabled:opacity-40"
                >
                  Siguiente ›
                </button>
              </div>
            </div>

            <div className="overflow-auto px-4 pb-4 h-[40vh]">
            {isLoading ? (
              <div className="text-sm text-fg-subtle p-4">Cargando…</div>
            ) : !data?.columnas.length ? (
              <div className="text-sm text-fg-subtle p-4">Sin datos para este sitio.</div>
            ) : (
              <table className="min-w-full border-collapse text-xs bg-panel">
                <thead className="sticky top-0 bg-panel z-10">
                  <tr>
                    {gruposModelo.map((g) => (
                      <th
                        key={g.modelo}
                        colSpan={g.colSpan}
                        className="px-2 py-1 text-white font-semibold text-[11px] uppercase tracking-wide"
                        style={{ backgroundColor: colorDeModelo(g.modelo) }}
                      >
                        {g.modelo}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {data.columnas.map((c) => (
                      <th key={c.clave} className="px-2 py-1 border border-border bg-surface text-fg font-medium text-left whitespace-nowrap">
                        {c.verbose_name}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {data.columnas.map((c) => {
                      // El gas ya queda fijo por la pestaña (CO2/CH4) y el
                      // día/noche y el analizador por el panel de filtros: no
                      // tiene sentido dejarlos editables acá, se ignorarían igual.
                      const esEnVistaGei = tab.vista === 'submuestra_gei'
                      const forzada =
                        (c.clave === GAS_COLUMNA && tab.gasFiltro) ||
                        (c.clave === CONDICION_LUZ_COLUMNA && esEnVistaGei && flujosCondicionLuzId != null) ||
                        (c.clave === ANALIZADOR_COLUMNA && esEnVistaGei && !!analizadorNombre)
                      return forzada ? (
                        <th key={c.clave} className="px-1 py-1 border border-border bg-surface" />
                      ) : (
                        <th key={c.clave} className="px-1 py-1 border border-border bg-surface">
                          <input
                            value={filtrosInput[c.clave] ?? ''}
                            onChange={(e) => setFiltrosInput((f) => ({ ...f, [c.clave]: e.target.value }))}
                            placeholder="filtrar…"
                            className="w-full min-w-[80px] bg-transparent text-fg text-xs px-1 py-0.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-brand-teal"
                          />
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className={isFetching ? 'opacity-50' : ''}>
                  {data.filas.map((fila, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-surface' : 'bg-panel'}>
                      {data.columnas.map((c) => (
                        <td key={c.clave} className="px-2 py-1 border border-border text-fg-muted whitespace-nowrap">
                          {fila[c.clave] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!data.filas.length && (
                    <tr className="bg-panel">
                      <td colSpan={data.columnas.length} className="px-2 py-4 text-center text-fg-subtle">
                        Sin resultados para estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            </div>
          </>
        )
      )}
    </div>
  )
}
