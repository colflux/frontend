import { Link, useSearchParams } from 'react-router-dom'
import { useMapeoCarga } from '@/hooks/useMapeoCarga'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { downloadJson } from '@/utils/download'
import type { MapeoCarga, MapeoColumna } from '@/types'

const NOMBRES_TRANSFORMACION: Record<string, string> = {
  directo: 'Directo',
  lookup: 'Lookup / FK',
  split: 'Split',
  fecha: 'Parsear fecha',
  constante: 'Valor constante',
  ignorar: 'Ignorar',
}

const NOMBRES_ESTRATEGIA: Record<string, string> = {
  dejar_null: 'Dejar vacío',
  rellenar: 'Rellenar hacia abajo',
  manual: 'Valor manual',
  ignorar_fila: 'Ignorar filas sin valor',
}

function detalleMapeo(m: MapeoColumna): string {
  const partes: string[] = []
  if (m.modelo_destino === 'Cobertura' && m.campo_destino === 'nombre' && m.tipo_cobertura_nombre) {
    partes.push(`sistema = ${m.tipo_cobertura_nombre}`)
  }
  if (m.transformacion === 'constante' && m.valor_constante) partes.push(`valor = "${m.valor_constante}"`)
  if (m.estrategia_nulos && m.estrategia_nulos !== 'dejar_null') {
    partes.push(NOMBRES_ESTRATEGIA[m.estrategia_nulos] || m.estrategia_nulos)
    if (m.estrategia_nulos === 'manual' && m.valor_relleno_manual) {
      partes.push(`relleno = "${m.valor_relleno_manual}"`)
    }
  }
  if (m.mapeo_valores && Object.keys(m.mapeo_valores).length) {
    partes.push(
      Object.entries(m.mapeo_valores)
        .map(([k, v]) => `${k} → ${v}`)
        .join(', ')
    )
  }
  return partes.join(' · ')
}

function descargarMapeo(data: MapeoCarga) {
  const payload = {
    fuente_id: data.fuente_id,
    fuente_nombre: data.fuente_nombre,
    carga_id: data.carga_id,
    total_filas: data.total_filas,
    columnas_raw: data.columnas_raw,
    mapeos: data.mapeos,
  }
  downloadJson(payload, `mapeo_carga_${data.carga_id}.json`)
}

export function EtlMapeo() {
  const [searchParams] = useSearchParams()
  const fuenteIdParam = searchParams.get('fuente')
  const cargaIdParam = searchParams.get('carga')
  const fuenteId = fuenteIdParam ? Number(fuenteIdParam) : null
  const cargaId = cargaIdParam ? Number(cargaIdParam) : null

  const { data, isLoading, isError, error } = useMapeoCarga(fuenteId, cargaId)

  const faltaOrigen = fuenteId == null || cargaId == null

  const mapeosPorColumna = new Map<string, MapeoColumna>()
  data?.mapeos.forEach((m) => mapeosPorColumna.set(m.columna_origen, m))

  const columnasConocidas = new Set<string>()
  ;(data?.columnas_raw ?? []).forEach((c) => {
    const nombre = typeof c === 'string' ? c : c.nombre || c.columna
    if (nombre) columnasConocidas.add(nombre)
  })
  data?.mapeos.forEach((m) => columnasConocidas.add(m.columna_origen))

  const columnasSinMapear = Array.from(columnasConocidas).filter((columna) => {
    const m = mapeosPorColumna.get(columna)
    return !m || !m.modelo_destino || !m.campo_destino
  })

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'etl-mapeo',
    steps: [
      {
        element: '[data-tour="etlmapeo-acciones"]',
        popover: {
          title: 'Acciones',
          description: 'Descarga el mapeo completo en JSON o ve directamente los datos cargados de esta carga.',
        },
      },
      {
        element: '[data-tour="etlmapeo-tabla"]',
        popover: {
          title: 'Detalle del mapeo',
          description: 'Cada columna del archivo original, a qué modelo y campo se mapeó, y con qué transformación.',
        },
      },
    ],
  })

  return (
    <div className="flex-1 p-6 flex flex-col gap-1 max-w-[1140px] mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Cómo se mapeó el archivo</h1>
        <p className="text-sm text-fg-muted mt-1">
          {data ? `${data.fuente_nombre || 'Fuente'} — Carga #${data.carga_id}.` : 'Cargando…'}
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 py-4 border-b border-border">
        <div className="text-sm text-fg-muted">
          {data
            ? `${data.mapeos.length} columna${data.mapeos.length === 1 ? '' : 's'} mapeada${data.mapeos.length === 1 ? '' : 's'} · ${data.total_filas} fila${data.total_filas === 1 ? '' : 's'}`
            : ''}
        </div>
        <div data-tour="etlmapeo-acciones" className="flex items-center gap-2.5 flex-wrap">
          {data && (
            <>
              <button
                type="button"
                onClick={() => descargarMapeo(data)}
                className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold px-4 py-2 rounded-md transition-colors"
              >
                ⬇ Descargar mapeo (JSON)
              </button>
              <Link
                to={`/etl/datos?fuente=${fuenteId}&carga=${cargaId}`}
                className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
              >
                📊 Ver datos cargados
              </Link>
              <Link
                to={`/etl/upload?fuente=${fuenteId}&corregir=1`}
                className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
              >
                ✏️ Registrar columnas sin mapear
              </Link>
            </>
          )}
          <Link
            to="/data"
            className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
          >
            ← Volver
          </Link>
        </div>
      </div>

      {faltaOrigen ? (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Falta indicar la fuente y la carga (parámetros ?fuente=&carga= en la URL).
        </div>
      ) : isError ? (
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Error al cargar el mapeo: {error instanceof Error ? error.message : 'error desconocido'}
        </div>
      ) : isLoading || !data ? (
        <div className="text-center text-fg-muted text-sm py-10">Cargando mapeo…</div>
      ) : (
        <>
          {columnasSinMapear.length > 0 && (
            <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-500 rounded-lg px-4 py-3.5 my-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  ⚠ {columnasSinMapear.length} columna{columnasSinMapear.length === 1 ? '' : 's'} del archivo sin
                  mapear
                </p>
                <p className="text-xs text-fg-muted mt-1">{columnasSinMapear.join(', ')}</p>
              </div>
              <Link
                to={`/etl/upload?fuente=${fuenteId}&corregir=1`}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                Registrar columnas sin mapear →
              </Link>
            </div>
          )}

          <h2 className="text-base font-extrabold text-brand-teal-dark dark:text-brand-teal-bright mt-6 mb-3">
            Columnas del archivo original y su destino
          </h2>
          <div data-tour="etlmapeo-tabla" className="overflow-x-auto border border-border rounded-xl bg-panel mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface">
                  <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                    Columna en el archivo
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                    Modelo destino
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                    Campo destino
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                    Transformación
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                    Reglas / detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(columnasConocidas).map((columna) => {
                  const m = mapeosPorColumna.get(columna)
                  if (!m || !m.modelo_destino || !m.campo_destino) {
                    return (
                      <tr key={columna} className="border-t border-border">
                        <td className="px-3.5 py-2.5 font-semibold text-fg">{columna}</td>
                        <td colSpan={4} className="px-3.5 py-2.5">
                          <span className="inline-flex items-center bg-surface text-fg-muted text-xs font-bold px-2.5 py-1 rounded-full">
                            Sin mapear / ignorada
                          </span>
                        </td>
                      </tr>
                    )
                  }
                  const detalle = detalleMapeo(m)
                  return (
                    <tr key={columna} className="border-t border-border">
                      <td className="px-3.5 py-2.5 font-semibold text-fg">{columna}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">
                          {m.modelo_destino}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-fg">{m.campo_destino}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-xs font-bold px-2.5 py-1 rounded-full">
                          {NOMBRES_TRANSFORMACION[m.transformacion] || m.transformacion}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-fg-muted font-mono">{detalle || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
