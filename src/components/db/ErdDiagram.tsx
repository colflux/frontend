import { useLayoutEffect, useRef, useState } from 'react'
import { CATALOGO, ENTIDAD_MAP, RELACIONES, colorDeGrupo, TOTAL_ENTIDADES, TOTAL_RELACIONES } from '@/utils/catalogoModel'
import type { EntidadCatalogo } from '@/types'

interface RectoRelativo {
  x: number
  y: number
  w: number
  h: number
}

interface PathInfo {
  d: string
  color: string
  from: string
  to: string
}

interface LabelInfo {
  x: number
  y: number
  texto: string
  color: string
}

function rectoRelativo(el: HTMLElement, canvasRect: DOMRect): RectoRelativo {
  const r = el.getBoundingClientRect()
  return { x: r.left - canvasRect.left, y: r.top - canvasRect.top, w: r.width, h: r.height }
}

interface ErdNodeProps {
  entidad: EntidadCatalogo
  color: string
  abierta: boolean
  onClick: () => void
  registerRef: (el: HTMLDivElement | null) => void
}

function ErdNode({ entidad, color, abierta, onClick, registerRef }: ErdNodeProps) {
  return (
    <div
      ref={registerRef}
      data-erd-model={entidad.nombre}
      onClick={onClick}
      className="w-[172px] rounded-md overflow-hidden cursor-pointer bg-white dark:bg-panel border-2 transition-shadow"
      style={{ borderColor: color, boxShadow: abierta ? `0 0 0 3px ${color}55, 0 4px 16px rgba(0,0,0,.1)` : undefined }}
    >
      <div
        className="px-2.5 py-1.5 font-bold text-[.78rem] font-mono flex items-center justify-between text-white select-none"
        style={{ background: color }}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{entidad.nombre}</span>
        <span className="text-[.6rem] opacity-70 ml-1 shrink-0">{entidad.total_campos}f</span>
      </div>
      {abierta && (
        <div>
          {entidad.campos.map((f) => (
            <div
              key={f.nombre}
              className="px-2 py-[3px] text-[.69rem] flex items-center gap-1 border-b border-slate-100 dark:border-border"
            >
              {f.es_fk && (
                <span className="text-[.57rem] bg-blue-100 text-blue-700 px-1 rounded font-bold shrink-0">FK</span>
              )}
              <span className="font-mono overflow-hidden text-ellipsis whitespace-nowrap text-slate-800 dark:text-fg flex-1">
                {f.nombre}
              </span>
              <span className="text-slate-400 text-[.6rem] shrink-0">{f.tipo_raw.replace('Field', '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  abiertas: Set<string>
  activa: string | null
  onToggle: (nombre: string) => void
}

export function ErdDiagram({ abiertas, activa, onToggle }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement>())
  const [paths, setPaths] = useState<PathInfo[]>([])
  const [labels, setLabels] = useState<LabelInfo[]>([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const draggedRef = useRef(false)
  const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null)

  function handlePointerDown(e: React.MouseEvent) {
    const scroller = scrollerRef.current
    if (!scroller || e.button !== 0) return
    panRef.current = { startX: e.clientX, startY: e.clientY, scrollLeft: scroller.scrollLeft, scrollTop: scroller.scrollTop }
    draggedRef.current = false
    setIsPanning(true)

    function handleMove(ev: MouseEvent) {
      const start = panRef.current
      if (!start || !scroller) return
      const dx = ev.clientX - start.startX
      const dy = ev.clientY - start.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) draggedRef.current = true
      scroller.scrollLeft = start.scrollLeft - dx
      scroller.scrollTop = start.scrollTop - dy
    }

    function handleUp() {
      panRef.current = null
      setIsPanning(false)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }

  useLayoutEffect(() => {
    function recompute() {
      const canvas = canvasRef.current
      if (!canvas) return
      const canvasRect = canvas.getBoundingClientRect()
      const nuevosPaths: PathInfo[] = []
      const nuevasLabels: LabelInfo[] = []

      RELACIONES.forEach((rel) => {
        const fe = nodeRefs.current.get(rel.from)
        const te = nodeRefs.current.get(rel.to)
        if (!fe || !te || fe === te) return

        const fp = rectoRelativo(fe, canvasRect)
        const tp = rectoRelativo(te, canvasRect)
        if (fp.x === 0 && fp.y === 0 && tp.x === 0 && tp.y === 0) return

        const fMidY = fp.y + fp.h * 0.35
        const tMidY = tp.y + tp.h * 0.35
        let x1: number, y1: number, x2: number, y2: number

        if (fp.x + fp.w + 8 < tp.x) {
          x1 = fp.x + fp.w
          y1 = fMidY
          x2 = tp.x
          y2 = tMidY
        } else if (tp.x + tp.w + 8 < fp.x) {
          x1 = fp.x
          y1 = fMidY
          x2 = tp.x + tp.w
          y2 = tMidY
        } else if (fp.y < tp.y) {
          x1 = fp.x + fp.w * 0.5
          y1 = fp.y + fp.h
          x2 = tp.x + tp.w * 0.5
          y2 = tp.y
        } else {
          x1 = fp.x + fp.w * 0.5
          y1 = fp.y
          x2 = tp.x + tp.w * 0.5
          y2 = tp.y + tp.h
        }

        const color = ENTIDAD_MAP[rel.from]?.color ?? '#94a3b8'
        const dx = Math.abs(x2 - x1)
        const cp = Math.max(dx * 0.5, 36)

        let d: string
        if (dx > 20) {
          const cx1 = x1 + (x2 > x1 ? cp : -cp)
          const cx2 = x2 + (x2 > x1 ? -cp : cp)
          d = `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`
        } else {
          const lx = Math.min(fp.x, tp.x) - 28
          d = `M${x1},${y1} C${lx},${y1} ${lx},${y2} ${x2},${y2}`
        }
        nuevosPaths.push({ d, color, from: rel.from, to: rel.to })

        const goRight = x2 > x1
        nuevasLabels.push({ x: x1 + (goRight ? 5 : -12), y: y1 - 3, texto: 'N', color })
        nuevasLabels.push({ x: x2 + (goRight ? -12 : 4), y: y2 - 3, texto: '1', color })
      })

      setPaths(nuevosPaths)
      setLabels(nuevasLabels)
      setSvgSize({ w: canvas.scrollWidth, h: canvas.scrollHeight })
    }

    recompute()
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(recompute))
    window.addEventListener('resize', recompute)
    return () => {
      window.removeEventListener('resize', recompute)
      cancelAnimationFrame(raf1)
    }
  }, [abiertas, activa])

  return (
    <div className="rounded-2xl overflow-hidden bg-panel border border-border shadow-lg">
      <div className="bg-panel border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <span className="font-mono text-xs text-fg-muted bg-surface px-3 py-1 rounded-md">
          {TOTAL_ENTIDADES} entidades · {TOTAL_RELACIONES} relaciones · catalogo.json
        </span>
        <span className="text-xs text-fg-muted">Clic en entidad para ver campos</span>
      </div>

      <div
        ref={scrollerRef}
        onMouseDown={handlePointerDown}
        className={`overflow-auto max-h-[640px] bg-surface ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
      >
        <div ref={canvasRef} className="relative inline-block min-w-full p-8">
          <svg
            className="absolute top-0 left-0 pointer-events-none overflow-visible"
            width={svgSize.w}
            height={svgSize.h}
          >
            <defs>
              <marker id="erd-arrow" markerWidth="7" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0,7 2.5,0 5" fill="#94a3b8" />
              </marker>
            </defs>
            {paths.map((p, i) => {
              const resaltada = abiertas.size > 0 && (abiertas.has(p.from) || abiertas.has(p.to))
              const atenuada = abiertas.size > 0 && !resaltada
              const tocaActiva = activa !== null && abiertas.has(activa) && (p.from === activa || p.to === activa)
              const color = tocaActiva ? ENTIDAD_MAP[activa]?.color ?? p.color : p.color
              return (
                <path
                  key={i}
                  d={p.d}
                  stroke={color}
                  strokeWidth={tocaActiva ? 2.5 : resaltada ? 2 : 1.5}
                  fill="none"
                  opacity={atenuada ? 0.08 : tocaActiva ? 1 : resaltada ? 0.9 : 0.4}
                  markerEnd="url(#erd-arrow)"
                />
              )
            })}
            {labels.map((l, i) => (
              <text
                key={i}
                x={l.x}
                y={l.y}
                fontSize={9}
                fontWeight={700}
                fill={l.color}
                opacity={0.85}
                fontFamily="ui-monospace, monospace"
              >
                {l.texto}
              </text>
            ))}
          </svg>

          <div className="relative z-10 flex items-start gap-7">
            {CATALOGO.grupos.map((g) => {
              const color = colorDeGrupo(g.nombre)
              return (
                <div key={g.nombre} className="flex flex-col gap-2 shrink-0">
                  <div
                    className="text-[.65rem] font-extrabold uppercase tracking-wider pb-1 border-b-2 whitespace-nowrap"
                    style={{ color, borderColor: color }}
                  >
                    {g.icono} {g.nombre}
                  </div>
                  {g.entidades.map((e) => (
                    <ErdNode
                      key={e.nombre}
                      entidad={e}
                      color={color}
                      abierta={abiertas.has(e.nombre)}
                      onClick={() => {
                        if (!draggedRef.current) onToggle(e.nombre)
                      }}
                      registerRef={(el) => {
                        if (el) nodeRefs.current.set(e.nombre, el)
                        else nodeRefs.current.delete(e.nombre)
                      }}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap p-4 pt-3">
        {CATALOGO.grupos.map((g) => {
          const color = colorDeGrupo(g.nombre)
          return (
            <div key={g.nombre} className="flex items-center gap-1.5 text-xs text-fg-muted">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              {g.icono} {g.nombre}
            </div>
          )
        })}
      </div>
    </div>
  )
}
