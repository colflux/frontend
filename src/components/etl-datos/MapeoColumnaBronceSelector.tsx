import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { etlService } from '@/services/etl.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { CamposDestinoResponse } from '@/types'

// Selector inline de mapeo para una columna bronce sin match exacto contra
// la plantilla (sin match de nombre, o ambigua -16 columnas de Metadato que
// comparten modelo.campo y necesitan `tipo_cobertura` para desambiguar, ver
// tasks/inprogress/rediseno-carga-flujos-co2-staging-bronce.md-). Versión
// simplificada del combo modelo/campo/tipo_cobertura de MapeoRow.tsx (sin
// regex/escala/gas_fijo, que no hacen falta para el caso típico de estas
// columnas): modelo → campo → (si aplica) tipo de clasificación → (si el
// campo destino es FK/choices, ej. CoberturaManual.valor) mapeo de cada
// valor único de la columna a un choice destino, igual que ChoicesPanel.tsx
// en el asistente manual -sin esto, un campo FK como CoberturaManual.valor
// (choices = pks de ValorClasificacionTipo) nunca matchea el texto literal
// que trae el archivo ("4.1.2. Turberas"), y la fila queda con error
// "Valor no permitido" para siempre.
interface Props {
  camposDestino: CamposDestinoResponse
  fuenteId: number | null
  cargaId: number | null
  hoja: string
  columna: string
  mapeando: boolean
  onMapear: (
    modeloDestino: string,
    campoDestino: string,
    tipoCobertura: number | null,
    mapeoValores: Record<string, string>
  ) => void
}

export function MapeoColumnaBronceSelector({
  camposDestino,
  fuenteId,
  cargaId,
  hoja,
  columna,
  mapeando,
  onMapear,
}: Props) {
  const token = useAuthStore((s) => s.token)
  const [modelo, setModelo] = useState('')
  const [campo, setCampo] = useState('')
  const [tipoCobertura, setTipoCobertura] = useState('')
  const [mapeoValores, setMapeoValores] = useState<Record<string, string>>({})

  const campos = modelo ? camposDestino.modelos[modelo] ?? [] : []
  const campoMeta = campos.find((c) => c.nombre === campo)
  const mostrarTipoCobertura = modelo === 'CoberturaManual' && campo === 'valor'

  const modelosPorGrupo = new Map<string, string[]>()
  Object.keys(camposDestino.modelos).forEach((m) => {
    const grupoInfo = camposDestino.grupos[m]
    const etiqueta = grupoInfo ? `${grupoInfo.icono} ${grupoInfo.nombre}` : 'Otros'
    const lista = modelosPorGrupo.get(etiqueta) ?? []
    lista.push(m)
    modelosPorGrupo.set(etiqueta, lista)
  })

  const { data: fkChoices } = useQuery({
    queryKey: ['fk-choices', modelo, campo, fuenteId],
    queryFn: () => etlService.getFkChoices(modelo, campo, fuenteId),
    enabled: Boolean(campoMeta?.es_fk && modelo && campo),
  })
  const choicesEfectivos = campoMeta?.es_fk ? fkChoices?.choices ?? [] : campoMeta?.choices ?? []
  const necesitaMapeoValores = Boolean(campoMeta && choicesEfectivos.length > 0)

  const { data: valoresUnicos } = useQuery({
    queryKey: ['bronce-valores-columna', fuenteId, cargaId, hoja, columna],
    queryFn: () => etlService.valoresColumnaBronce(token ?? '', fuenteId!, cargaId!, hoja, columna),
    enabled: necesitaMapeoValores && fuenteId != null && cargaId != null,
  })

  const puedeConfirmar = Boolean(modelo && campo && (!mostrarTipoCobertura || tipoCobertura))

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <select
        value={modelo}
        onChange={(e) => {
          setModelo(e.target.value)
          setCampo('')
          setMapeoValores({})
        }}
        disabled={mapeando}
        className="bg-surface border border-amber-500 text-fg text-[11px] rounded-md px-1.5 py-1 focus:outline-none"
      >
        <option value="">— modelo —</option>
        {[...modelosPorGrupo.entries()].map(([etiqueta, modelos]) => (
          <optgroup key={etiqueta} label={etiqueta}>
            {modelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={campo}
        onChange={(e) => {
          setCampo(e.target.value)
          setMapeoValores({})
        }}
        disabled={!modelo || mapeando}
        className="bg-surface border border-amber-500 text-fg text-[11px] rounded-md px-1.5 py-1 focus:outline-none disabled:opacity-50"
      >
        <option value="">— campo —</option>
        {campos.map((c) => (
          <option key={c.nombre} value={c.nombre}>
            {c.verbose_name || c.nombre}
          </option>
        ))}
      </select>

      {mostrarTipoCobertura && (
        <select
          value={tipoCobertura}
          onChange={(e) => setTipoCobertura(e.target.value)}
          disabled={mapeando}
          className="bg-surface border border-amber-500 text-fg text-[11px] rounded-md px-1.5 py-1 focus:outline-none"
        >
          <option value="">— clasificación —</option>
          {camposDestino.tipos_cobertura.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      )}

      {necesitaMapeoValores && (
        <div className="flex flex-col gap-1 border-t border-amber-500/40 pt-1 mt-0.5">
          <p className="text-[10px] font-bold text-fg-muted">valor → destino:</p>
          {!valoresUnicos ? (
            <p className="text-[10px] text-fg-muted">cargando valores…</p>
          ) : (
            valoresUnicos.valores.map(({ valor, total }) => (
              <div key={valor} className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-fg truncate max-w-[70px]" title={`${valor} (${total})`}>
                  {valor}
                </span>
                <select
                  value={mapeoValores[valor] ?? ''}
                  onChange={(e) => setMapeoValores((prev) => ({ ...prev, [valor]: e.target.value }))}
                  disabled={mapeando}
                  className="bg-surface border border-border text-fg text-[10px] rounded-md px-1 py-0.5 focus:outline-none flex-1 min-w-0"
                >
                  <option value="">— ignorar —</option>
                  {choicesEfectivos.map((ch) => (
                    <option key={String(ch.valor)} value={ch.valor}>
                      {ch.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!puedeConfirmar || mapeando}
        onClick={() => onMapear(modelo, campo, tipoCobertura ? Number(tipoCobertura) : null, mapeoValores)}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-[11px] font-bold rounded-md px-1.5 py-1 transition-colors"
      >
        {mapeando ? 'Mapeando…' : 'Mapear'}
      </button>
    </div>
  )
}
