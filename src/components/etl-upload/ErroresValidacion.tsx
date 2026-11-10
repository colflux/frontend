import { useState } from 'react'
import type { ColumnaConErrores, GrupoModeloInfo } from '@/types'

// Paleta cíclica para las bandas de cada modelo destino -no intenta
// replicar un color fijo por modelo (como en MapeoList), solo dar contraste
// visual entre grupos consecutivos cuando hay varios con errores a la vez.
const BANDAS = [
  'bg-violet-600',
  'bg-rose-500',
  'bg-amber-600',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-fuchsia-600',
  'bg-orange-600',
  'bg-teal-600',
]

const MAX_EJEMPLOS_INICIAL = 5
const MAX_EJEMPLOS_EXPANDIDO = 50

interface GrupoErrores {
  modelo: string
  nombre: string
  icono: string
  orden: number
  columnas: ColumnaConErrores[]
  totalErrores: number
}

function agruparPorModelo(
  columnas: ColumnaConErrores[],
  grupos?: Record<string, GrupoModeloInfo>
): GrupoErrores[] {
  const porModelo = new Map<string, ColumnaConErrores[]>()
  columnas
    .filter((c) => c.errores && c.errores.length > 0)
    .forEach((c) => {
      const clave = c.modelo_destino || 'Otros'
      if (!porModelo.has(clave)) porModelo.set(clave, [])
      porModelo.get(clave)!.push(c)
    })

  return [...porModelo.entries()]
    .map(([modelo, cols]) => ({
      modelo,
      nombre: grupos?.[modelo]?.nombre || modelo,
      icono: grupos?.[modelo]?.icono || '⚠️',
      orden: grupos?.[modelo]?.orden ?? 999,
      columnas: cols,
      totalErrores: cols.reduce((acc, c) => acc + c.errores.length, 0),
    }))
    .sort((a, b) => a.orden - b.orden || b.totalErrores - a.totalErrores)
}

function ColumnaErrores({ columna }: { columna: ColumnaConErrores }) {
  const [expandido, setExpandido] = useState(false)
  const limite = expandido ? MAX_EJEMPLOS_EXPANDIDO : MAX_EJEMPLOS_INICIAL
  const ejemplos = columna.errores.slice(0, limite)
  const restantes = columna.errores.length - ejemplos.length

  return (
    <div className="px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold text-fg">{columna.columna}</span>
        <span className="text-xs font-bold text-red-600 dark:text-red-400">
          {columna.errores.length} error{columna.errores.length === 1 ? '' : 'es'}
          {columna.total ? ` de ${columna.total} fila${columna.total === 1 ? '' : 's'}` : ''}
        </span>
      </div>
      <ul className="mt-1.5 flex flex-col gap-0.5">
        {ejemplos.map((e, i) => (
          <li key={i} className="text-xs text-fg-muted">
            {e.fila != null ? `Fila ${e.fila}` : 'General'}
            {e.valor !== undefined && e.valor !== null && e.valor !== '' ? ` (valor: "${e.valor}")` : ''}
            {' — '}
            {e.mensaje || e.tipo}
          </li>
        ))}
      </ul>
      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setExpandido(true)}
          className="text-xs font-semibold text-brand-teal-dark dark:text-brand-teal-bright hover:underline mt-1"
        >
          + {restantes} error{restantes === 1 ? '' : 'es'} más
        </button>
      )}
      {expandido && columna.errores.length > MAX_EJEMPLOS_EXPANDIDO && (
        <p className="text-xs text-fg-muted mt-1 italic">
          Mostrando los primeros {MAX_EJEMPLOS_EXPANDIDO} de {columna.errores.length} — corrige el mapeo de esta
          columna y vuelve a validar para ver el resto.
        </p>
      )}
    </div>
  )
}

interface Props {
  columnas: ColumnaConErrores[]
  grupos?: Record<string, GrupoModeloInfo>
}

export function ErroresValidacion({ columnas, grupos }: Props) {
  const gruposErrores = agruparPorModelo(columnas, grupos)
  if (gruposErrores.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {gruposErrores.map((g, i) => (
        <div key={g.modelo} className="border border-border rounded-lg overflow-hidden bg-panel">
          <div className={`${BANDAS[i % BANDAS.length]} px-3.5 py-2 flex items-center justify-between gap-2`}>
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              {g.icono} {g.nombre}
            </span>
            <span className="text-xs font-bold text-white/90">
              {g.totalErrores} error{g.totalErrores === 1 ? '' : 'es'} · {g.columnas.length} columna
              {g.columnas.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="divide-y divide-border">
            {g.columnas.map((c) => (
              <ColumnaErrores key={c.columna} columna={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
