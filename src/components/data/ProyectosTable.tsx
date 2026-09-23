import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { Paginacion } from '@/components/common/Paginacion'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useProyectoDrawerStore } from '@/store/useProyectoDrawerStore'
import { useEliminarProyecto } from '@/hooks/useProyectoMutations'
import type { FuenteDatos, Proyecto } from '@/types'

interface Props {
  proyectos: Proyecto[]
  fuentes: FuenteDatos[]
  onVerFuentes: (proyectoId: number) => void
}

const LIMITE = 10

export function ProyectosTable({ proyectos, fuentes, onVerFuentes }: Props) {
  const openProyectoDrawer = useProyectoDrawerStore((s) => s.openDrawer)
  const eliminarProyecto = useEliminarProyecto()
  const [busqueda, setBusqueda] = useState('')
  const [offset, setOffset] = useState(0)
  const [proyectoABorrar, setProyectoABorrar] = useState<Proyecto | null>(null)
  const [errorBorrado, setErrorBorrado] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return proyectos
    return proyectos.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [proyectos, busqueda])

  const pagina = filtrados.slice(offset, offset + LIMITE)

  function resumenFuentes(proyectoId: number) {
    const delProyecto = fuentes.filter((f) => f.proyecto?.id === proyectoId)
    const completas = delProyecto.filter((f) => f.estado === 'completo').length
    const pendientes = delProyecto.filter((f) => f.estado === 'pendiente').length
    const errores = delProyecto.filter((f) => f.estado === 'con_errores').length
    return { total: delProyecto.length, completas, pendientes, errores }
  }

  async function handleConfirmarBorrar() {
    if (!proyectoABorrar) return
    setErrorBorrado('')
    try {
      await eliminarProyecto.mutateAsync(proyectoABorrar.id)
      setProyectoABorrar(null)
    } catch (err) {
      setErrorBorrado(err instanceof Error ? err.message : 'Error al eliminar. Intenta de nuevo.')
    }
  }

  const fuentesDelProyectoABorrar = proyectoABorrar ? resumenFuentes(proyectoABorrar.id).total : 0

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-extrabold text-fg">Administración de proyectos</h2>
          <p className="text-sm text-fg-muted mt-0.5">Consulta proyectos y revisa cuántas fuentes tiene cada uno.</p>
        </div>
        <button
          type="button"
          onClick={() => openProyectoDrawer()}
          className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
        >
          ＋ Nuevo proyecto
        </button>
      </div>

      {errorBorrado && !proyectoABorrar && (
        <p className="text-sm font-semibold text-red-500 mb-3">{errorBorrado}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap mb-3">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setOffset(0)
          }}
          placeholder="Buscar proyecto por nombre"
          className="flex-1 min-w-[200px] bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        />
        <span className="text-sm text-fg-muted">
          {filtrados.length} proyecto{filtrados.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface">
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Proyecto
              </th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Fuentes asociadas
              </th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Estado de fuentes
              </th>
              <th className="px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-fg-muted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {pagina.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-fg-muted text-sm py-8">
                  No hay proyectos para mostrar.
                </td>
              </tr>
            ) : (
              pagina.map((p) => {
                const r = resumenFuentes(p.id)
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3.5 py-2.5 font-semibold text-fg">
                      {p.nombre}
                      {p.instituciones_detalle.length > 0 && (
                        <div className="text-xs font-normal text-fg-muted mt-0.5">
                          {p.instituciones_detalle.map((i) => i.nombre).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-fg">
                      <strong>{r.total}</strong> fuente{r.total === 1 ? '' : 's'}
                    </td>
                    <td className="px-3.5 py-2.5 text-fg-muted">
                      {r.completas} completas · {r.pendientes} pendientes · {r.errores} con errores
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <button
                          type="button"
                          onClick={() => onVerFuentes(p.id)}
                          className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-2.5 py-1.5 rounded-md"
                        >
                          Ver fuentes
                        </button>
                        <Link
                          to={`/etl/datos?proyecto=${p.id}`}
                          className="bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-2.5 py-1.5 rounded-md"
                        >
                          📊 Ver datos cargados
                        </Link>
                        <button
                          type="button"
                          onClick={() => openProyectoDrawer({ proyecto: p })}
                          title="Editar proyecto"
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-fg"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorBorrado('')
                            setProyectoABorrar(p)
                          }}
                          title="Eliminar proyecto"
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-red-600 dark:hover:text-red-400 hover:border-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filtrados.length > LIMITE && (
        <Paginacion
          offset={offset}
          limite={LIMITE}
          total={filtrados.length}
          filasCount={pagina.length}
          onAnterior={() => setOffset(Math.max(offset - LIMITE, 0))}
          onSiguiente={() => setOffset(offset + LIMITE)}
        />
      )}

      <ConfirmModal
        open={proyectoABorrar != null}
        title="Eliminar proyecto"
        description={
          proyectoABorrar
            ? errorBorrado ||
              `¿Eliminar el proyecto "${proyectoABorrar.nombre}"? ${fuentesDelProyectoABorrar} fuente${
                  fuentesDelProyectoABorrar === 1 ? '' : 's'
                } de datos asociada${fuentesDelProyectoABorrar === 1 ? '' : 's'} quedará${
                  fuentesDelProyectoABorrar === 1 ? '' : 'n'
                } sin proyecto. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={eliminarProyecto.isPending}
        onConfirm={handleConfirmarBorrar}
        onCancel={() => {
          setProyectoABorrar(null)
          setErrorBorrado('')
        }}
      />
    </Card>
  )
}
