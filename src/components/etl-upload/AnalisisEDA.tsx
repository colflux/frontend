import { Card } from '@/components/common/Card'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import type { EdaColumna } from '@/types'

interface Props {
  onContinuar: () => void
  onVolver: () => void
  onCambiarHoja: (hoja: string) => void
  cambiandoHoja: boolean
}

function formatNumero(n: number | string | null): string {
  if (n === null) return '—'
  if (typeof n === 'string') return n
  return n.toLocaleString('es-CO', { maximumFractionDigits: 4 })
}

function notasAdicionales(col: EdaColumna): string | null {
  if (col.dtype === 'number') return `min ${formatNumero(col.minimo)} · máx ${formatNumero(col.maximo)}`
  if (col.dtype === 'date') return `desde ${formatNumero(col.minimo)} · hasta ${formatNumero(col.maximo)}`
  return null
}

function FilaColumna({ col }: { col: EdaColumna }) {
  const nullsAltos = col.nulls_pct >= 30
  const variabilidad = col.total > 0 ? (col.valores_unicos / col.total) * 100 : 0
  const notas = notasAdicionales(col)

  return (
    <tr className="border-t border-border align-top">
      <td className="px-2.5 py-2 font-semibold text-fg whitespace-nowrap">{col.nombre}</td>
      <td className="px-2.5 py-2">
        <span className="text-[10px] font-bold text-fg-muted bg-surface border border-border px-1.5 py-0.5 rounded-full uppercase">
          {col.dtype}
        </span>
      </td>
      <td className={`px-2.5 py-2 whitespace-nowrap ${nullsAltos ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-fg'}`}>
        {nullsAltos && '⚠ '}
        {col.nulls} ({col.nulls_pct}%)
      </td>
      <td className="px-2.5 py-2 text-fg whitespace-nowrap">{col.valores_unicos}</td>
      <td className="px-2.5 py-2 text-fg whitespace-nowrap">
        {col.valores_unicos}/{col.total} ({variabilidad.toFixed(1)}%)
      </td>
      <td className="px-2.5 py-2">
        {col.top_valores && col.top_valores.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {col.top_valores.map((tv) => (
              <span
                key={tv.valor}
                className="text-xs bg-surface border border-border rounded-full px-2 py-0.5 text-fg"
              >
                {tv.valor} <span className="text-fg-muted">×{tv.conteo}</span>
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-2.5 py-2 text-fg-muted whitespace-nowrap">{notas ?? '—'}</td>
    </tr>
  )
}

function TablaColumnas({ columnas }: { columnas: EdaColumna[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-surface">
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">Atributo</th>
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">Tipo</th>
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">% Nulos</th>
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">Valores únicos</th>
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">Variabilidad</th>
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">Valores más frecuentes</th>
            <th className="px-2.5 py-1.5 text-left font-bold text-fg-muted">Notas adicionales</th>
          </tr>
        </thead>
        <tbody>
          {columnas.map((col, idx) => (
            <FilaColumna key={`${col.hoja ?? ''}-${col.nombre}-${idx}`} col={col} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AnalisisEDA({ onContinuar, onVolver, onCambiarHoja, cambiandoHoja }: Props) {
  const eda = useEtlUploadStore((s) => s.edaResultado)
  const sheets = useEtlUploadStore((s) => s.sheets)
  const hojaActiva = useEtlUploadStore((s) => s.hojaActiva)

  if (!eda) return null

  const mostrarHoja = sheets.length > 1
  const columnasHojaActiva: EdaColumna[] = mostrarHoja
    ? eda.columnas.filter((c) => (hojaActiva ? c.hoja === hojaActiva : !c.hoja))
    : eda.columnas
  const hayDuplicados = eda.filas_duplicadas > 0
  const hayColumnasConNulos = eda.columnas_con_muchos_nulos.length > 0
  const hayColumnasConOutliers = eda.columnas_con_outliers.length > 0
  const hayAlertas = hayDuplicados || hayColumnasConNulos || hayColumnasConOutliers

  return (
    <Card title="Paso 2 — Análisis EDA">
      <div className="flex flex-col gap-5">
        <div className="bg-surface border border-border rounded-md px-3.5 py-3">
          <p className="text-sm text-fg">
            Antes de decidir el mapeo, revisa cómo se comportan los datos: tipo, % de nulos, valores únicos,
            variabilidad y los valores más frecuentes de cada atributo — similar a un <code>.describe()</code> de
            pandas — más señales de calidad (nulos altos, valores atípicos, filas duplicadas).
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">Resumen general</p>
          <p className="text-sm text-fg">
            {eda.total_columnas} columnas
            {mostrarHoja && ` en ${sheets.length} hojas`} · {eda.total_filas.toLocaleString()} filas analizadas
            {hojaActiva && (
              <>
                {' '}
                de la hoja "{hojaActiva}" (la que se usa para el mapeo)
              </>
            )}
          </p>
        </div>

        {mostrarHoja && sheets.some((h) => !h.toLowerCase().includes('diccionario')) && (
          <div>
            <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">
              Mapear otra hoja de este archivo
            </p>
            <p className="text-xs text-fg-muted mb-2">
              Cada carga mapea una sola hoja a la vez. Para registrar los datos de otra pestaña (p. ej. CO2, CH4,
              Clima), elige cuál — se crea una carga nueva sobre el mismo archivo, sin volver a subirlo. Las hojas
              de diccionario de datos no se mapean.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sheets
                .filter((h) => !h.toLowerCase().includes('diccionario'))
                .map((hoja) => (
                <button
                  key={hoja}
                  type="button"
                  disabled={hoja === hojaActiva || cambiandoHoja}
                  onClick={() => onCambiarHoja(hoja)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors ${
                    hoja === hojaActiva
                      ? 'bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal text-brand-teal-dark dark:text-brand-teal-bright cursor-default'
                      : 'bg-surface border-border text-fg-muted hover:text-fg disabled:opacity-60'
                  }`}
                >
                  {hoja === hojaActiva ? '✓ ' : ''}
                  {hoja}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">Señales de calidad</p>
          {!hayAlertas ? (
            <p className="text-sm text-fg">✅ No se detectaron señales de calidad relevantes.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {hayDuplicados && (
                <li className="text-sm text-fg">
                  ⚠ <span className="font-semibold">{eda.filas_duplicadas}</span> fila
                  {eda.filas_duplicadas === 1 ? '' : 's'} duplicada{eda.filas_duplicadas === 1 ? '' : 's'} (idénticas
                  en todas las columnas).
                </li>
              )}
              {hayColumnasConNulos && (
                <li className="text-sm text-fg">
                  ⚠ Columnas con muchos nulos (≥30%):{' '}
                  <span className="font-semibold">{eda.columnas_con_muchos_nulos.join(', ')}</span>
                </li>
              )}
              {hayColumnasConOutliers && (
                <li className="text-sm text-fg">
                  ⚠ Columnas con valores atípicos:{' '}
                  <span className="font-semibold">{eda.columnas_con_outliers.join(', ')}</span>
                </li>
              )}
            </ul>
          )}
          <p className="text-xs text-fg-muted mt-1.5">
            Estas señales son orientativas — puedes continuar igual si decides que no bloquean la carga.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold text-fg-muted uppercase tracking-wide">Estadísticas por columna</p>
          {mostrarHoja && hojaActiva && (
            <p className="text-sm font-bold text-fg mb-1.5">
              {hojaActiva}
              <span className="ml-2 text-xs font-semibold text-brand-teal-dark dark:text-brand-teal-bright">
                (hoja activa)
              </span>
            </p>
          )}
          <TablaColumnas columnas={columnasHojaActiva} />
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onContinuar}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
          >
            Continuar →
          </button>
          <button
            type="button"
            onClick={onVolver}
            className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
          >
            ← Volver a analizar
          </button>
        </div>
      </div>
    </Card>
  )
}
