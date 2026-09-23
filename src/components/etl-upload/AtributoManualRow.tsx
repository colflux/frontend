import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { useFkChoices } from '@/hooks/useFkChoices'

interface Props {
  i: number
}

const selectClass =
  'w-full bg-surface border border-border text-fg text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal'

export function AtributoManualRow({ i }: Props) {
  const { fuenteId, camposDestino, atributosManuales, actualizarAtributoManual, quitarAtributoManual } =
    useEtlUploadStore()
  const attr = atributosManuales[i]
  const campos = camposDestino?.modelos[attr.modelo] ?? []
  const campoMeta = campos.find((c) => c.nombre === attr.campo)
  // Las instancias de un FK se piden aparte (ver useFkChoices) — antes venían
  // precargadas en campoMeta.choices, ahora eso solo trae choices estáticos.
  const fkChoices = useFkChoices(attr.modelo, attr.campo, fuenteId, campoMeta?.es_fk)
  const choicesEfectivos = campoMeta?.es_fk ? fkChoices.data?.choices ?? [] : campoMeta?.choices ?? []

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 flex-wrap">
      <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
        <span className="inline-block self-start text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
          ✏️ manual
        </span>
        <span className="text-xs text-fg-muted">valor fijo para todas las filas</span>
        <select
          value={attr.campo}
          onChange={(e) => actualizarAtributoManual(i, { campo: e.target.value, valor: '' })}
          className={selectClass}
        >
          <option value="">— campo —</option>
          {campos.map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.verbose_name ? `${c.verbose_name} (${c.nombre})` : c.nombre}
              {c.es_fk ? ' 🔗' : ''}
            </option>
          ))}
        </select>
      </div>

      <span className="text-fg-subtle mt-1.5">→</span>

      <div className="flex items-center gap-2 flex-1 min-w-[180px]">
        {campoMeta?.es_fk && fkChoices.isLoading ? (
          <span className="text-xs italic text-fg-muted flex-1">Cargando opciones…</span>
        ) : campoMeta?.es_fk && choicesEfectivos.length === 0 ? (
          <span className="text-xs italic text-fg-muted flex-1">
            Aún no hay ningún {campoMeta.modelo_fk} registrado en la base de datos.
          </span>
        ) : campoMeta && choicesEfectivos.length > 0 ? (
          <select
            value={attr.valor}
            onChange={(e) => actualizarAtributoManual(i, { valor: e.target.value })}
            className={selectClass}
          >
            <option value="">— valor —</option>
            {choicesEfectivos.map((ch) => (
              <option key={String(ch.valor)} value={ch.valor}>
                {ch.etiqueta}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder={campoMeta ? 'valor…' : 'elige un campo primero…'}
            disabled={!campoMeta}
            value={attr.valor}
            onChange={(e) => actualizarAtributoManual(i, { valor: e.target.value })}
            className={`${selectClass} disabled:opacity-50`}
          />
        )}

        <button
          type="button"
          title="Quitar atributo"
          onClick={() => quitarAtributoManual(i)}
          className="shrink-0 bg-surface border border-border text-fg-muted hover:text-fg text-xs rounded-md px-2.5 py-1.5"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
