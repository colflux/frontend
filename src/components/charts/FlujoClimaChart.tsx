import { useMemo, useState } from 'react'
import { ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useDatosProyecto } from '@/hooks/useDatosProyecto'
import { useThemeStore } from '@/store/useThemeStore'
import { GAS_COLORS, formatUnidad } from '@/utils/formatters'
import type { SerieLectura } from '@/types'

interface Props {
  resultados: SerieLectura[]
  isLoading: boolean
  sitioId: number
  proyectoId: number | null
}

// Variables numéricas de MuestraAmbiental (vista "clima") con las que vale la
// pena cruzar el flujo. El resto del modelo (fecha/hora/momento/microtopo/FKs)
// no aplica a un eje Y numérico.
const VARIABLES_CLIMA: { clave: string; label: string }[] = [
  { clave: 'MuestraAmbiental.air_temp', label: 'Temperatura del aire (°C)' },
  { clave: 'MuestraAmbiental.soil_temp', label: 'Temperatura del suelo (°C)' },
  { clave: 'MuestraAmbiental.relat_humid', label: 'Humedad relativa (%)' },
  { clave: 'MuestraAmbiental.atm_press', label: 'Presión atmosférica (hPa)' },
  { clave: 'MuestraAmbiental.dew_point', label: 'Punto de rocío (°C)' },
  { clave: 'MuestraAmbiental.water_level', label: 'Nivel del agua (cm)' },
]
const CLIMA_COLOR = '#57270F'

/** Cruza el promedio diario de flujo con una variable climática del mismo
 * sitio (vista "clima" de MuestraAmbiental), en un eje dual -para explorar
 * si el flujo se mueve junto con temperatura/humedad/nivel del agua-. */
export function FlujoClimaChart({ resultados, isLoading, sitioId, proyectoId }: Props) {
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  const gases = useMemo(() => [...new Set(resultados.map((r) => r.gas))].filter(Boolean).sort(), [resultados])
  const [gasElegido, setGas] = useState('')
  const gas = gases.includes(gasElegido) ? gasElegido : (gases[0] ?? '')

  const delGas = useMemo(() => resultados.filter((r) => r.gas === gas), [resultados, gas])
  const unidades = useMemo(() => [...new Set(delGas.map((r) => r.unidad))].sort(), [delGas])
  const [unidadElegido, setUnidad] = useState('')
  const unidad = unidades.includes(unidadElegido) ? unidadElegido : (unidades[0] ?? '')

  const [variable, setVariable] = useState(VARIABLES_CLIMA[0].clave)

  const { data: clima, isLoading: climaLoading } = useDatosProyecto(proyectoId, {
    vista: 'clima',
    sitio: sitioId,
    limite: 2000,
  })

  const promedioFlujoPorDia = useMemo(() => {
    const porDia = new Map<string, number[]>()
    delGas
      .filter((r) => r.unidad === unidad && Number.isFinite(r.valor))
      .forEach((r) => {
        const valores = porDia.get(r.fecha) ?? []
        valores.push(r.valor)
        porDia.set(r.fecha, valores)
      })
    const promedios = new Map<string, number>()
    porDia.forEach((valores, fecha) => promedios.set(fecha, valores.reduce((s, v) => s + v, 0) / valores.length))
    return promedios
  }, [delGas, unidad])

  const promedioClimaPorDia = useMemo(() => {
    const porDia = new Map<string, number[]>()
    ;(clima?.filas ?? []).forEach((fila) => {
      const fecha = fila['MuestraAmbiental.fecha']
      const valor = fila[variable]
      if (fecha == null || valor == null) return
      const num = Number(valor)
      if (!Number.isFinite(num)) return
      const valores = porDia.get(String(fecha)) ?? []
      valores.push(num)
      porDia.set(String(fecha), valores)
    })
    const promedios = new Map<string, number>()
    porDia.forEach((valores, fecha) => promedios.set(fecha, valores.reduce((s, v) => s + v, 0) / valores.length))
    return promedios
  }, [clima, variable])

  const data = useMemo(() => {
    const fechas = new Set([...promedioFlujoPorDia.keys(), ...promedioClimaPorDia.keys()])
    return [...fechas]
      .sort()
      .map((fecha) => ({
        fecha,
        flujo: promedioFlujoPorDia.get(fecha) ?? null,
        clima: promedioClimaPorDia.get(fecha) ?? null,
      }))
      .filter((d) => d.flujo != null || d.clima != null)
  }, [promedioFlujoPorDia, promedioClimaPorDia])

  const cargando = isLoading || climaLoading

  if (proyectoId == null) {
    return (
      <div className="h-24 flex items-center justify-center text-fg-subtle text-sm">
        Este sitio no tiene un proyecto asociado, no se puede cruzar con clima.
      </div>
    )
  }

  if (cargando) {
    return <div className="h-36 flex items-center justify-center text-fg-subtle text-sm">Cargando…</div>
  }

  if (!promedioClimaPorDia.size) {
    return (
      <div className="h-24 flex items-center justify-center text-fg-subtle text-sm">
        Este sitio no tiene datos de clima importados.
      </div>
    )
  }

  const varLabel = VARIABLES_CLIMA.find((v) => v.clave === variable)?.label ?? variable
  const colorFlujo = GAS_COLORS[gas] ?? '#198A77'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1">
          {gases.map((g) => (
            <button
              key={g}
              onClick={() => setGas(g)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                g === gas
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-fg-muted hover:text-fg border border-border'
              }`}
            >
              {g}
            </button>
          ))}
          {unidades.length > 1 &&
            unidades.map((u) => (
              <button
                key={u}
                onClick={() => setUnidad(u)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  u === unidad
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-fg-muted hover:text-fg border border-border'
                }`}
              >
                {formatUnidad(u)}
              </button>
            ))}
        </div>
        <select
          value={variable}
          onChange={(e) => setVariable(e.target.value)}
          className="bg-surface border border-border text-fg text-xs rounded-md px-2 py-1"
        >
          {VARIABLES_CLIMA.map((v) => (
            <option key={v.clave} value={v.clave}>{v.label}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <XAxis dataKey="fecha" tick={{ fill: tickColor, fontSize: 11 }} />
          <YAxis yAxisId="flujo" tick={{ fill: tickColor, fontSize: 11 }} />
          <YAxis yAxisId="clima" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8e4'}`,
              borderRadius: 6,
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v, name) =>
              name === 'flujo' ? [`${Number(v).toFixed(3)} ${formatUnidad(unidad)}`, gas] : [Number(v).toFixed(2), varLabel]
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: tickColor }}
            formatter={(v) => (v === 'flujo' ? gas : varLabel)}
          />
          <Line yAxisId="flujo" type="monotone" dataKey="flujo" stroke={colorFlujo} strokeWidth={2} dot={false} connectNulls />
          <Line yAxisId="clima" type="monotone" dataKey="clima" stroke={CLIMA_COLOR} strokeWidth={2} dot={false} connectNulls strokeDasharray="4 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
