import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { Paginacion } from '@/components/common/Paginacion'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useFuenteDrawerStore } from '@/store/useFuenteDrawerStore'
import { useUsuarioDrawerStore } from '@/store/useUsuarioDrawerStore'
import { useEliminarFuente } from '@/hooks/useFuenteMutations'
import { useRolActual } from '@/hooks/useRolActual'
import type { FuenteDatos, ProyectoResumen } from '@/types'

interface Props {
  fuentes: FuenteDatos[]
  proyectos: ProyectoResumen[]
  proyectoFiltro: string
  onProyectoFiltroChange: (value: string) => void
}

const LIMITE = 10

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'shapefile', label: 'Shapefile' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'api', label: 'API externa' },
  { value: 'base_de_datos', label: 'Base de datos' },
  { value: 'otro', label: 'Otro' },
]

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completo', label: 'Completo' },
  { value: 'con_errores', label: 'Con errores' },
]

const badgeTipoClass: Record<string, string> = {
  excel: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400',
  csv: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400',
  shapefile: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400',
  geojson: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400',
  api: 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-400',
  base_de_datos: 'bg-pink-100 dark:bg-pink-950/40 text-pink-800 dark:text-pink-400',
  otro: 'bg-surface text-fg-muted',
}

const badgeEstadoClass: Record<string, string> = {
  pendiente: 'bg-surface text-fg-muted',
  en_proceso: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400',
  completo: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400',
  con_errores: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
}

function canStartEtl(f: FuenteDatos) {
  return f.tipo === 'excel' || f.tipo === 'csv'
}

export function FuentesTable({ fuentes, proyectos, proyectoFiltro, onProyectoFiltroChange }: Props) {
  const openFuenteDrawer = useFuenteDrawerStore((s) => s.openDrawer)
  const openUsuarioDrawer = useUsuarioDrawerStore((s) => s.openDrawer)
  const eliminarFuente = useEliminarFuente()
  const { isAdmin } = useRolActual()

  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [offset, setOffset] = useState(0)
  const [fuenteABorrar, setFuenteABorrar] = useState<FuenteDatos | null>(null)

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return fuentes.filter((f) => {
      if (q) {
        const enTexto = `${f.nombre} ${f.descripcion} ${f.responsable}`.toLowerCase().includes(q)
        if (!enTexto) return false
      }
      if (tipoFiltro && f.tipo !== tipoFiltro) return false
      if (estadoFiltro && f.estado !== estadoFiltro) return false
      if (proyectoFiltro === 'sin-proyecto') {
        if (f.proyecto) return false
      } else if (proyectoFiltro) {
        if (String(f.proyecto?.id ?? '') !== proyectoFiltro) return false
      }
      return true
    })
  }, [fuentes, busqueda, tipoFiltro, estadoFiltro, proyectoFiltro])

  const pagina = filtradas.slice(offset, offset + LIMITE)

  function resetOffset() {
    setOffset(0)
  }

  function handleEditar(f: FuenteDatos) {
    if (f.estado === 'completo') return
    openFuenteDrawer({ fuente: f })
  }

  function handleConfirmarBorrar() {
    if (!fuenteABorrar) return
    eliminarFuente.mutate(fuenteABorrar.id, { onSuccess: () => setFuenteABorrar(null) })
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-extrabold text-fg">Fuentes de datos</h2>
          <p className="text-sm text-fg-muted mt-0.5">Consulta proyecto asociado y ejecuta acciones operativas por fuente.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => openUsuarioDrawer()}
            className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            ＋ Usuario
          </button>
          <button
            type="button"
            onClick={() => openFuenteDrawer()}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            ＋ Nueva fuente
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            resetOffset()
          }}
          placeholder="Buscar por nombre, descripción o responsable"
          className="flex-1 min-w-[200px] bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        />
        <select
          value={proyectoFiltro}
          onChange={(e) => {
            onProyectoFiltroChange(e.target.value)
            resetOffset()
          }}
          className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          <option value="">Todos los proyectos</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
          <option value="sin-proyecto">Fuentes sin proyecto</option>
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => {
            setTipoFiltro(e.target.value)
            resetOffset()
          }}
          className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value)
            resetOffset()
          }}
          className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-fg-muted">
          {filtradas.length} registro{filtradas.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface">
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">Fuente</th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">Tipo</th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">Estado</th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Proyecto asociado
              </th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Responsable
              </th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">Fecha</th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {pagina.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-fg-muted text-sm py-8">
                  No hay fuentes para mostrar en la tabla.
                </td>
              </tr>
            ) : (
              pagina.map((f) => {
                const completa = f.estado === 'completo'
                const cargaId = f.ultima_carga_importada_id
                const cargaBronceId = f.carga_bronce_pendiente_id
                return (
                  <tr key={f.id} className="border-t border-border">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-fg">{f.nombre}</div>
                      <div className="text-xs text-fg-muted">ID {f.id}</div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeTipoClass[f.tipo] ?? badgeTipoClass.otro}`}>
                        {f.tipo_label}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeEstadoClass[f.estado] ?? badgeEstadoClass.pendiente}`}>
                        {f.estado_label}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-fg-muted">{f.proyecto ? f.proyecto.nombre : 'Sin proyecto'}</td>
                    <td className="px-3.5 py-2.5 text-fg-muted">{f.responsable || 'Sin responsable'}</td>
                    <td className="px-3.5 py-2.5 text-fg-muted">{f.fecha_datos || 'Sin fecha'}</td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {cargaId ? (
                          <>
                            <Link
                              to={`/etl/datos?fuente=${f.id}&carga=${cargaId}`}
                              title="Ver datos cargados"
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-brand-teal text-white"
                            >
                              📊
                            </Link>
                            <Link
                              to={`/etl/mapeo?fuente=${f.id}&carga=${cargaId}`}
                              title="Ver mapeo de columnas"
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-fg"
                            >
                              🔗
                            </Link>
                          </>
                        ) : cargaBronceId ? (
                          <Link
                            to={`/etl/upload-bronce?fuente=${f.id}&carga=${cargaBronceId}`}
                            title="Dato recién subido a la capa bronce — aún no pasó por el análisis clásico, solo falta validar/corregir celda por celda"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-amber-600 text-white"
                          >
                            🥉
                          </Link>
                        ) : canStartEtl(f) ? (
                          <Link
                            to={`/etl/upload?fuente=${f.id}`}
                            title="Iniciar carga"
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-brand-teal text-white"
                          >
                            ⬆
                          </Link>
                        ) : (
                          <span className="text-xs text-fg-muted">No aplica carga</span>
                        )}

                        {completa ? (
                          <span
                            title="Ya no se puede editar: la fuente y el archivo quedan bloqueados una vez cargados los datos"
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-subtle opacity-40 cursor-not-allowed"
                          >
                            ✎
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEditar(f)}
                            title="Editar fuente"
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-fg"
                          >
                            ✎
                          </button>
                        )}

                        {!completa || isAdmin ? (
                          <button
                            type="button"
                            onClick={() => setFuenteABorrar(f)}
                            title="Eliminar fuente"
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-red-600 dark:hover:text-red-400 hover:border-red-500"
                          >
                            ✕
                          </button>
                        ) : (
                          <span
                            title="Solo un administrador de datos puede borrar una fuente con datos ya cargados"
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-subtle opacity-40 cursor-not-allowed"
                          >
                            ✕
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filtradas.length > LIMITE && (
        <Paginacion
          offset={offset}
          limite={LIMITE}
          total={filtradas.length}
          filasCount={pagina.length}
          onAnterior={() => setOffset(Math.max(offset - LIMITE, 0))}
          onSiguiente={() => setOffset(offset + LIMITE)}
        />
      )}

      <ConfirmModal
        open={fuenteABorrar != null}
        title="Eliminar fuente"
        description={`¿Eliminar la fuente "${fuenteABorrar?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        danger
        loading={eliminarFuente.isPending}
        onConfirm={handleConfirmarBorrar}
        onCancel={() => setFuenteABorrar(null)}
      />
    </Card>
  )
}
