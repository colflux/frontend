import { ENTIDAD_MAP, RELACIONES } from '@/utils/catalogoModel'

interface RelCardProps {
  modelName: string
  fieldName: string
  direction: 'out' | 'in'
  onClick: (nombre: string) => void
}

function RelCard({ modelName, fieldName, direction, onClick }: RelCardProps) {
  const info = ENTIDAD_MAP[modelName]
  if (!info) return null

  const card = (
    <button
      onClick={() => onClick(modelName)}
      className="flex-1 text-left rounded-lg overflow-hidden bg-white dark:bg-panel cursor-pointer transition-shadow hover:shadow-md border-2"
      style={{ borderColor: info.color }}
    >
      <div className="px-2.5 py-1.5 font-bold text-[.76rem] font-mono text-white" style={{ background: info.color }}>
        {modelName}
      </div>
      <div className="px-2.5 py-[3px] text-[.68rem] text-slate-500 font-mono border-b border-slate-100 dark:border-border">
        via <strong>.{fieldName}</strong>
      </div>
      <div className="px-2.5 py-[3px] pb-[5px] text-[.64rem] font-semibold" style={{ color: info.color }}>
        {info.icono} {info.groupName}
      </div>
    </button>
  )

  const arrow = (
    <div className="flex items-center text-slate-400 text-sm shrink-0">{direction === 'out' ? '→' : '←'}</div>
  )

  return (
    <div className="flex items-stretch gap-2 mb-2.5">
      {direction === 'out' ? (
        <>
          {card}
          {arrow}
        </>
      ) : (
        <>
          {arrow}
          {card}
        </>
      )}
    </div>
  )
}

function CenterCard({ modelName }: { modelName: string }) {
  const info = ENTIDAD_MAP[modelName]
  if (!info) return null

  return (
    <div
      className="rounded-lg overflow-hidden bg-white dark:bg-panel border-2"
      style={{ borderColor: info.color, boxShadow: `0 0 0 4px ${info.color}22, 0 6px 24px rgba(0,0,0,.1)` }}
    >
      <div
        className="px-3.5 py-2 font-extrabold text-[.86rem] font-mono text-white flex justify-between items-center gap-2"
        style={{ background: info.color }}
      >
        <span className="shrink-0">{modelName}</span>
        <span className="text-[.65rem] opacity-75 font-normal text-right whitespace-nowrap overflow-hidden text-ellipsis">
          {info.icono} {info.groupName}
        </span>
      </div>
      {info.campos.map((f) => (
        <div
          key={f.nombre}
          className="px-2.5 py-1 text-[.71rem] flex items-center gap-1.5 border-b border-slate-100 dark:border-border"
        >
          {f.es_fk ? (
            <span className="text-[.59rem] bg-blue-100 text-blue-700 px-1 rounded font-bold shrink-0">FK</span>
          ) : (
            <span className="inline-block w-[18px] shrink-0" />
          )}
          <span className="font-mono flex-1 text-slate-800 dark:text-fg overflow-hidden text-ellipsis whitespace-nowrap">
            {f.nombre}
          </span>
          {f.es_fk && f.modelo_fk && (
            <span className="text-blue-700 text-[.62rem] shrink-0">→ {f.modelo_fk}</span>
          )}
          <span className="text-slate-400 text-[.6rem] shrink-0 ml-1">{f.tipo_raw.replace('Field', '')}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  entidadSeleccionada: string | null
  onSeleccionar: (nombre: string) => void
  onVerEnCatalogo: (nombre: string) => void
}

export function EntityExplorer({ entidadSeleccionada, onSeleccionar, onVerEnCatalogo }: Props) {
  if (!entidadSeleccionada || !ENTIDAD_MAP[entidadSeleccionada]) {
    return (
      <div className="border border-dashed border-border rounded-2xl py-12 text-center text-fg-muted bg-panel">
        <div className="text-4xl opacity-30 mb-2.5">◈</div>
        <p className="text-sm">Haz clic en una entidad del diagrama de arriba</p>
      </div>
    )
  }

  const info = ENTIDAD_MAP[entidadSeleccionada]
  const salientes = RELACIONES.filter((r) => r.from === entidadSeleccionada)
  const entrantes = RELACIONES.filter((r) => r.to === entidadSeleccionada)

  return (
    <div className="grid grid-cols-[1fr_210px_1fr] gap-5 items-start">
      <div>
        <div
          className="text-[.68rem] font-extrabold uppercase tracking-wider mb-3 pb-1.5 border-b-2"
          style={{ color: info.color, borderColor: info.color }}
        >
          {entidadSeleccionada} apunta a →
        </div>
        {salientes.length === 0 ? (
          <p className="text-sm text-fg-muted italic">Sin FK salientes</p>
        ) : (
          salientes.map((r) => (
            <RelCard key={`${r.from}-${r.field}`} modelName={r.to} fieldName={r.field} direction="out" onClick={onSeleccionar} />
          ))
        )}
      </div>

      <div>
        <CenterCard modelName={entidadSeleccionada} />
        <button
          onClick={() => onVerEnCatalogo(entidadSeleccionada)}
          className="mt-2.5 w-full bg-transparent font-bold text-[.76rem] py-1.5 rounded-lg cursor-pointer border-[1.5px]"
          style={{ borderColor: info.color, color: info.color }}
        >
          Ver en catálogo →
        </button>
      </div>

      <div>
        <div
          className="text-[.68rem] font-extrabold uppercase tracking-wider mb-3 pb-1.5 border-b-2"
          style={{ color: info.color, borderColor: info.color }}
        >
          ← apuntada por
        </div>
        {entrantes.length === 0 ? (
          <p className="text-sm text-fg-muted italic">Sin FK entrantes</p>
        ) : (
          entrantes.map((r) => (
            <RelCard key={`${r.from}-${r.field}`} modelName={r.from} fieldName={r.field} direction="in" onClick={onSeleccionar} />
          ))
        )}
      </div>
    </div>
  )
}
