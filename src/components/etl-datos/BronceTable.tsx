import { useState } from 'react'
import { DatosTableFilterInput } from './DatosTableFilterInput'
import { MapeoColumnaBronceSelector } from './MapeoColumnaBronceSelector'
import { ENTIDAD_MAP } from '@/utils/catalogoModel'
import type { CamposDestinoResponse, EstadoFilaBronce, FilaBronceDatos } from '@/types'

// Vista tipo "Excel" de la capa bronce (ver
// tasks/inprogress/rediseno-carga-flujos-co2-staging-bronce.md en el repo
// `context`): mismo patrón visual que DatosTable.tsx (encabezado por
// modelo, badge de validación, fila de filtro), pero la fuente es
// FilaBronce/CeldaBronce -no el modelo estructurado- y las celdas son
// editables: un archivo se carga completo tal cual viene, sin bloquear por
// errores, y se corrige celda por celda sin perder el resto.

function colorDeModelo(modelo: string | undefined): string {
  if (!modelo) return '#9ca3af'
  return ENTIDAD_MAP[modelo]?.color ?? '#374151'
}

interface ColumnaMapeada {
  modelo_destino: string
  campo_destino: string
}

interface Props {
  columnas: string[]
  filas: FilaBronceDatos[]
  erroresPorColumna: Record<string, number>
  columnasMapeadas: Record<string, ColumnaMapeada>
  filtros: Record<string, string>
  onFiltroChange: (columna: string, valor: string) => void
  onEditarCelda: (filaIdx: number, columna: string, valor: string) => void
  guardandoCelda: { filaIdx: number; columna: string } | null
  camposDestino: CamposDestinoResponse | null
  fuenteId: number | null
  cargaId: number | null
  hoja: string
  onMapearColumna: (
    columna: string,
    modeloDestino: string,
    campoDestino: string,
    tipoCobertura: number | null,
    mapeoValores: Record<string, string>
  ) => void
  mapeandoColumna: string | null
}

const ESTADO_LABEL: Record<EstadoFilaBronce, string> = {
  pendiente: '… pendiente',
  valido: '✓ válida',
  invalido: '⚠ con errores',
  promovido: '✅ promovida',
}

const ESTADO_CLASE: Record<EstadoFilaBronce, string> = {
  pendiente: 'text-fg-muted',
  valido: 'text-blue-600 dark:text-blue-400',
  invalido: 'text-amber-700 dark:text-amber-400',
  promovido: 'text-brand-teal-dark dark:text-brand-teal-bright',
}

export function BronceTable({
  columnas,
  filas,
  erroresPorColumna,
  columnasMapeadas,
  filtros,
  onFiltroChange,
  onEditarCelda,
  guardandoCelda,
  camposDestino,
  fuenteId,
  cargaId,
  hoja,
  onMapearColumna,
  mapeandoColumna,
}: Props) {
  const [editando, setEditando] = useState<{ filaIdx: number; columna: string; valor: string } | null>(null)

  if (!columnas.length) {
    return (
      <div className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg px-4 py-3.5 text-sm my-5">
        No hay columnas para mostrar todavía.
      </div>
    )
  }

  const grupos: { modelo: string | undefined; count: number }[] = []
  columnas.forEach((col) => {
    const modelo = columnasMapeadas[col]?.modelo_destino
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.modelo === modelo) ultimo.count++
    else grupos.push({ modelo, count: 1 })
  })

  function commitEdicion() {
    if (!editando) return
    onEditarCelda(editando.filaIdx, editando.columna, editando.valor)
    setEditando(null)
  }

  return (
    <div className="overflow-x-auto my-5 border border-border rounded-xl bg-panel">
      <table className="border-collapse text-xs whitespace-nowrap w-full">
        <thead>
          <tr>
            <th className="px-3 py-1.5 bg-surface border-b border-r border-border" />
            {grupos.map((g, i) => (
              <th
                key={i}
                colSpan={g.count}
                className="px-3 py-1.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-white"
                style={{ background: colorDeModelo(g.modelo) }}
              >
                {g.modelo ?? 'Sin mapear'}
              </th>
            ))}
          </tr>
          <tr>
            <th className="px-3 py-1.5 text-left text-xs font-bold text-fg bg-surface border-b border-r border-border">
              Fila / estado
            </th>
            {columnas.map((col) => (
              <th
                key={col}
                title={columnasMapeadas[col] ? `${columnasMapeadas[col].modelo_destino}.${columnasMapeadas[col].campo_destino}` : 'Columna sin mapear todavía'}
                className="px-3 py-1.5 text-left text-xs font-bold text-fg bg-surface border-b border-r border-border"
              >
                {col}
              </th>
            ))}
          </tr>
          <tr>
            <th className="border-b border-r border-border" />
            {columnas.map((col) => {
              const errores = erroresPorColumna[col] || 0
              return (
                <th key={col} className="px-2 py-1 text-left border-b border-r border-border">
                  {errores > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-panel border border-amber-500 rounded-md px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      ⚠ Validación
                      <span className="bg-amber-500 text-white rounded-full px-1.5 text-[10px] font-bold">{errores}</span>
                    </span>
                  ) : null}
                </th>
              )
            })}
          </tr>
          {camposDestino && (
            <tr>
              <th className="bg-panel p-1 border-b border-r border-border" />
              {columnas.map((col) => (
                <th key={col} className="bg-panel p-1 border-b border-r border-border align-top">
                  {!columnasMapeadas[col] && (
                    <MapeoColumnaBronceSelector
                      camposDestino={camposDestino}
                      fuenteId={fuenteId}
                      cargaId={cargaId}
                      hoja={hoja}
                      columna={col}
                      mapeando={mapeandoColumna === col}
                      onMapear={(modeloDestino, campoDestino, tipoCobertura, mapeoValores) =>
                        onMapearColumna(col, modeloDestino, campoDestino, tipoCobertura, mapeoValores)
                      }
                    />
                  )}
                </th>
              ))}
            </tr>
          )}
          <tr>
            <th className="bg-panel p-1 border-b border-r border-border" />
            {columnas.map((col) => (
              <th key={col} className="bg-panel p-1 border-b border-r border-border">
                <DatosTableFilterInput clave={col} value={filtros[col] || ''} onChange={onFiltroChange} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.fila_idx} className="even:bg-surface/40 hover:bg-surface">
              <td className={`px-3 py-1.5 border-b border-r border-border font-semibold ${ESTADO_CLASE[fila.estado]}`}>
                #{fila.fila_idx + 2} · {ESTADO_LABEL[fila.estado]}
              </td>
              {columnas.map((col) => {
                const celda = fila.celdas[col]
                const enEdicion = editando?.filaIdx === fila.fila_idx && editando?.columna === col
                const guardando = guardandoCelda?.filaIdx === fila.fila_idx && guardandoCelda?.columna === col
                if (enEdicion) {
                  return (
                    <td key={col} className="px-1 py-1 border-b border-r border-border">
                      <input
                        autoFocus
                        value={editando.valor}
                        onChange={(e) => setEditando({ ...editando, valor: e.target.value })}
                        onBlur={commitEdicion}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdicion()
                          if (e.key === 'Escape') setEditando(null)
                        }}
                        className="w-full border border-brand-teal rounded-md px-1.5 py-1 text-xs bg-panel text-fg focus:outline-none"
                      />
                    </td>
                  )
                }
                return (
                  <td
                    key={col}
                    title={celda?.error || undefined}
                    onClick={() =>
                      fila.estado !== 'promovido' &&
                      setEditando({ filaIdx: fila.fila_idx, columna: col, valor: celda?.valor ?? '' })
                    }
                    className={`px-3 py-1.5 border-b border-r text-fg max-w-[240px] overflow-hidden text-ellipsis cursor-pointer ${
                      celda?.error
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-border'
                    } ${guardando ? 'opacity-50' : ''}`}
                  >
                    {celda?.valor ?? ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
