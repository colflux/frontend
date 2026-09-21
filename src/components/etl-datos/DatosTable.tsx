import { Link } from 'react-router-dom'
import { DatosTableFilterInput } from './DatosTableFilterInput'
import { ENTIDAD_MAP } from '@/utils/catalogoModel'
import type { ColumnaDatos, FilaDatos, ReglaAutollenado } from '@/types'

// Color por modelo, para agrupar visualmente las columnas de la tabla (cada
// modelo de la cadena SubmuestraGEI → … → Sitio tiene su color) — mismo
// color de categoría que usa el diagrama ERD de /db y el Excel exportado,
// vía `catalogo.json` (ver `COLOR_POR_MODELO` en el backend).
function colorDeModelo(modelo: string): string {
  return ENTIDAD_MAP[modelo]?.color ?? '#374151'
}

interface Props {
  columnas: ColumnaDatos[]
  filas: FilaDatos[]
  filtros: Record<string, string>
  reglas?: Record<string, ReglaAutollenado>
  onFiltroChange: (clave: string, valor: string) => void
  advertencia?: string
  fuenteId: number | null
  cargaId: number | null
}

export function DatosTable({
  columnas,
  filas,
  filtros,
  reglas = {},
  onFiltroChange,
  advertencia,
  fuenteId,
  cargaId,
}: Props) {
  if (!columnas.length) {
    return (
      <div className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg px-4 py-3.5 text-sm my-5">
        {advertencia || 'No hay datos para mostrar todavía.'}
      </div>
    )
  }

  const grupos: { modelo: string; count: number }[] = []
  columnas.forEach((c) => {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.modelo === c.modelo) ultimo.count++
    else grupos.push({ modelo: c.modelo, count: 1 })
  })

  const hayReglas = columnas.some((c) => reglas[c.clave])

  return (
    <div data-tour="etl-tabla" className="overflow-x-auto my-5 border border-border rounded-xl bg-panel">
      <table className="border-collapse text-xs whitespace-nowrap w-full">
        <thead>
          <tr>
            {grupos.map((g, i) => (
              <th
                key={i}
                colSpan={g.count}
                className="px-3 py-1.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-white"
                style={{ background: colorDeModelo(g.modelo) }}
              >
                {g.modelo}
              </th>
            ))}
          </tr>
          <tr>
            {columnas.map((c) => (
              <th
                key={c.clave}
                title={c.clave}
                className="px-3 py-1.5 text-left text-xs font-bold text-fg bg-surface border-b border-r border-border"
              >
                {c.verbose_name || c.campo}
              </th>
            ))}
          </tr>
          {hayReglas && (
            <tr>
              {columnas.map((c) => {
                const regla = reglas[c.clave]
                if (!regla) return <th key={c.clave} className="border-b border-r border-border" />
                const tienePendientes = regla.pendientes > 0
                return (
                  <th key={c.clave} className="px-2 py-1 text-left border-b border-r border-border">
                    <Link
                      to={`/etl/reglas/campo?campo=${encodeURIComponent(c.clave)}&fuente=${fuenteId ?? ''}&carga=${cargaId ?? ''}`}
                      title={regla.nombre}
                      className={`inline-flex items-center gap-1 bg-panel border rounded-md px-2 py-1 text-[11px] font-semibold ${
                        tienePendientes
                          ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                          : 'border-border text-fg-muted hover:text-fg hover:border-brand-teal'
                      }`}
                    >
                      🛡️ Validación
                      {tienePendientes && (
                        <span className="bg-amber-500 text-white rounded-full px-1.5 text-[10px] font-bold">
                          {regla.pendientes}
                        </span>
                      )}
                    </Link>
                  </th>
                )
              })}
            </tr>
          )}
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} className="bg-panel p-1 border-b border-r border-border">
                <DatosTableFilterInput clave={c.clave} value={filtros[c.clave] || ''} onChange={onFiltroChange} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="even:bg-surface/40 hover:bg-surface">
              {columnas.map((c) => {
                const v = fila[c.clave]
                return (
                  <td
                    key={c.clave}
                    className="px-3 py-1.5 border-b border-r border-border text-fg max-w-[240px] overflow-hidden text-ellipsis"
                  >
                    {v === null || v === undefined ? '' : String(v)}
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
