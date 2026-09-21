import { Link, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/common/Card'
import { useReglaDetalle } from '@/hooks/useReglaDetalle'
import { useThemeStore } from '@/store/useThemeStore'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import type { ValidacionFila } from '@/types'

const COLORES: Record<string, string> = {
  dia: '#d97706',
  noche: '#1d4ed8',
  noche_simulada: '#7c3aed',
}

// Único rango esperado configurado hoy (ver regla-validacion.html original):
// condición de luz "día" debería caer entre 06:00 y 18:00.
const RANGOS_ESPERADOS: Record<string, { desde: string; hasta: string }> = {
  dia: { desde: '06:00', hasta: '18:00' },
}

function evaluarRango(fila: ValidacionFila) {
  const esperado = RANGOS_ESPERADOS[fila.condicion_luz]
  if (!esperado || !fila.hora_min || !fila.hora_max) return null
  const dentro = fila.hora_min >= esperado.desde && fila.hora_max <= esperado.hasta
  return dentro
    ? { ok: true, texto: `Dentro de lo esperado (${esperado.desde}–${esperado.hasta})` }
    : { ok: false, texto: `Fuera de lo esperado (${esperado.desde}–${esperado.hasta}) — revisar` }
}

function construirDataHistograma(validacion: ValidacionFila[]) {
  return Array.from({ length: 24 }, (_, h) => {
    const punto: Record<string, string | number> = { hora: `${String(h).padStart(2, '0')}:00` }
    validacion.forEach((fila) => {
      punto[fila.condicion_luz] = fila.histograma[h] ?? 0
    })
    return punto
  })
}

export function EtlReglaValidacion() {
  const [searchParams] = useSearchParams()
  const codigo = searchParams.get('codigo')
  const fuenteId = searchParams.get('fuente')
  const cargaId = searchParams.get('carga')
  const isDark = useThemeStore((s) => s.theme === 'dark')

  const { data: d, isLoading, isError, error } = useReglaDetalle(codigo)

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'etl-regla-validacion',
    steps: [
      {
        element: '[data-tour="reglavalidacion-resumen"]',
        popover: {
          title: 'Resumen por condición de luz',
          description: 'Rango de horas ya asignadas, con un chequeo automático contra lo esperado.',
        },
      },
      {
        element: '[data-tour="reglavalidacion-histograma"]',
        popover: {
          title: 'Distribución por hora del día',
          description: 'Picos fuera de la franja esperada son candidatos a revisar.',
        },
      },
    ],
  })

  if (!codigo) {
    return (
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
          Falta indicar la regla (parámetro ?codigo= en la URL).
        </div>
      </div>
    )
  }

  if (isLoading || !d) {
    return (
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {isError ? (
          <div className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg px-4 py-3.5 text-sm my-5">
            Error al cargar la validación: {error instanceof Error ? error.message : 'error desconocido'}
          </div>
        ) : (
          <div className="text-center text-fg-muted text-sm py-10">Cargando validación…</div>
        )}
      </div>
    )
  }

  const validacion = d.validacion ?? []
  const tickColor = isDark ? '#94a3b8' : '#64748b'
  const dataHistograma = construirDataHistograma(validacion)

  const campoCompleto = `${d.modelo_destino}.${d.campo_destino}`
  const volverQs = new URLSearchParams({ campo: campoCompleto })
  if (fuenteId) volverQs.set('fuente', fuenteId)
  if (cargaId) volverQs.set('carga', cargaId)

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Validación de rangos — {d.nombre}</h1>
        <p className="text-sm text-fg-muted mt-1">{campoCompleto}, agrupado por condición de luz</p>
      </div>

      <Card title="Resumen por condición de luz">
        <div data-tour="reglavalidacion-resumen">
        <p className="text-sm text-fg-muted mb-3">
          Rango de horas ya asignadas en <code>{d.campo_destino}</code>. Sirve para detectar tomas mal clasificadas
          (p. ej. una toma "noche" con hora de mediodía).
        </p>
        {validacion.length === 0 ? (
          <p className="text-sm text-fg-muted">No hay valores asignados todavía.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-surface">
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Condición de luz</th>
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Cantidad</th>
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Rango (mín–máx)</th>
                  <th className="px-3 py-2 text-left font-bold text-fg-muted">Chequeo</th>
                </tr>
              </thead>
              <tbody>
                {validacion.map((fila) => {
                  const chequeo = evaluarRango(fila)
                  return (
                    <tr key={fila.condicion_luz} className="border-t border-border">
                      <td className="px-3 py-2 text-fg">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                          style={{ background: COLORES[fila.condicion_luz] || '#94a3b8' }}
                        />
                        {fila.etiqueta}
                      </td>
                      <td className="px-3 py-2 text-fg">{fila.cantidad}</td>
                      <td className="px-3 py-2 text-fg">
                        {fila.hora_min ?? '—'} – {fila.hora_max ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        {chequeo ? (
                          <span
                            className={`font-semibold ${chequeo.ok ? 'text-brand-teal-dark dark:text-brand-teal-bright' : 'text-red-600 dark:text-red-400'}`}
                          >
                            {chequeo.texto}
                          </span>
                        ) : (
                          <span className="text-fg-muted">Sin rango esperado definido</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </Card>

      <Card title="Distribución de tomas por hora del día">
        <div data-tour="reglavalidacion-histograma">
        <p className="text-sm text-fg-muted mb-3">
          Cantidad de tomas en cada franja horaria (0–23h), una serie por condición de luz. Picos fuera de la franja
          esperada son candidatos a revisar.
        </p>
        {validacion.length === 0 ? (
          <p className="text-sm text-fg-muted">Sin datos para graficar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dataHistograma} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <XAxis dataKey="hora" tick={{ fill: tickColor, fontSize: 10 }} interval={1} />
              <YAxis tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
                  borderRadius: 6,
                }}
                labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {validacion.map((fila) => (
                <Bar
                  key={fila.condicion_luz}
                  dataKey={fila.condicion_luz}
                  name={fila.etiqueta}
                  fill={COLORES[fila.condicion_luz] || '#94a3b8'}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
        </div>
      </Card>

      <Link
        to={`/etl/reglas/campo?${volverQs.toString()}`}
        className="self-start bg-surface border border-border text-fg-muted hover:text-fg text-xs font-semibold px-3.5 py-2 rounded-md transition-colors"
      >
        ← Volver a las reglas del atributo
      </Link>
    </div>
  )
}
