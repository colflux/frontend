import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEPARTAMENTOS_PATHS, VIEWBOX } from '@/assets/data/colombiaDepartamentos'
import paramo1 from '@/assets/ecosistemas/paramo-1.jpg'
import paramo2 from '@/assets/ecosistemas/paramo-2.jpg'
import paramo3 from '@/assets/ecosistemas/paramo-3.jpg'
import paramo4 from '@/assets/ecosistemas/paramo-4.jpg'
import fotoAmazonas from '@/assets/ecosistemas/amazonas.jpg'
import fotoPutumayo from '@/assets/ecosistemas/putumayo.jpg'
import fotoGuainia from '@/assets/ecosistemas/guainia.jpg'
import fotoCasanare from '@/assets/ecosistemas/casanare.jpg'
import fotoBoyaca from '@/assets/ecosistemas/boyaca.jpg'
import fotoCundinamarca from '@/assets/ecosistemas/cundinamarca.jpg'
import fotoGuaviare from '@/assets/ecosistemas/guaviare.jpg'

interface Region {
  id: 'andina' | 'orinoquia' | 'amazonia'
  nombre: string
  descripcion: string
  codigosDane: string[]
}

// Departamentos donde trabaja COLFLUX, agrupados por región (lista acotada pedida por Viviana,
// más específica que el catálogo completo de backend/app/migrations/0019_seed_regiones_departamentos.py).
const REGIONES: Region[] = [
  {
    id: 'andina',
    nombre: 'Región andina',
    descripcion: 'La región andina presenta humedales en forma de lagos, lagunas y pantanos, entre otros.',
    // Cundinamarca/Bogotá D.C. y Boyacá.
    codigosDane: ['11', '15', '25'],
  },
  {
    id: 'orinoquia',
    nombre: 'Orinoquía',
    descripcion: 'En la Orinoquía, los humedales incluyen ecosistemas como esteros y morichales.',
    // Meta, y Vichada/Casanare.
    codigosDane: ['50', '85', '99'],
  },
  {
    id: 'amazonia',
    nombre: 'Amazonía',
    descripcion: 'La Amazonía presenta diversos tipos de humedales, usualmente ubicados en zonas de inundación aledañas a ríos.',
    // Amazonas, Putumayo (franja sur-occidente), Guainía (extremo oriental), Guaviare.
    codigosDane: ['91', '86', '94', '95'],
  },
]

const REGION_BY_CODIGO = new Map<string, Region>(
  REGIONES.flatMap((region) => region.codigosDane.map((codigo) => [codigo, region] as const))
)

// Anotaciones estáticas: punto de anclaje (flecha) + posición del bloque de texto, en el mismo
// sistema de coordenadas del viewBox (0 0 600 760).
const ANOTACIONES: Record<Region['id'], { textX: number; textY: number; anchor: 'start' | 'end'; curve: string }> = {
  andina: { textX: 14, textY: 48, anchor: 'start', curve: 'M150,112 C170,160 210,220 260,300' },
  orinoquia: { textX: 586, textY: 100, anchor: 'end', curve: 'M470,166 C480,220 420,280 340,325' },
  amazonia: { textX: 14, textY: 690, anchor: 'start', curve: 'M40,660 C90,630 150,570 190,510' },
}

// Foto específica por departamento (pasadas por Viviana). El modelo `Sitio` del backend no
// guarda fotos todavía, así que para los departamentos sin foto propia (Meta, Vichada, Bogotá
// D.C.) se reutilizan estas 4 fotos de campo de páramo como respaldo genérico, rotando de forma
// estable según el departamento clicado.
const FOTOS_POR_DEPARTAMENTO: Record<string, string> = {
  '91': fotoAmazonas, // Amazonas
  '86': fotoPutumayo, // Putumayo
  '94': fotoGuainia, // Guainía
  '95': fotoGuaviare, // Guaviare
  '85': fotoCasanare, // Casanare
  '15': fotoBoyaca, // Boyacá
  '25': fotoCundinamarca, // Cundinamarca
}
const FOTOS_RESPALDO = [paramo1, paramo2, paramo3, paramo4]
const [VIEWBOX_W, VIEWBOX_H] = VIEWBOX.split(' ').slice(2).map(Number)

// El contenedor es más ancho que alto que el viewBox de Colombia (que es apaisado en vertical).
// Con preserveAspectRatio="meet" el SVG se escala completo dentro del contenedor y queda con
// márgenes laterales (letterbox), así que hay que replicar ese cálculo acá para ubicar el
// tooltip de foto en el mismo punto donde quedó el departamento tras el escalado.
const CONTAINER_ASPECT = 4 / 3
const MAP_SCALE = Math.min(CONTAINER_ASPECT / VIEWBOX_W, 1 / VIEWBOX_H)
const MAP_OFFSET_X = (CONTAINER_ASPECT - VIEWBOX_W * MAP_SCALE) / 2
const MAP_OFFSET_Y = (1 - VIEWBOX_H * MAP_SCALE) / 2

function posicionEnContenedor(cx: number, cy: number) {
  return {
    left: `${((MAP_OFFSET_X + cx * MAP_SCALE) / CONTAINER_ASPECT) * 100}%`,
    top: `${(MAP_OFFSET_Y + cy * MAP_SCALE) * 100}%`,
  }
}

export function EcosistemasMap() {
  const [seleccionado, setSeleccionado] = useState<string | null>(null)

  const depto = DEPARTAMENTOS_PATHS.find((d) => d.codigoDane === seleccionado)
  const region = depto ? REGION_BY_CODIGO.get(depto.codigoDane) : undefined
  const foto = depto
    ? (FOTOS_POR_DEPARTAMENTO[depto.codigoDane] ?? FOTOS_RESPALDO[Number(depto.codigoDane) % FOTOS_RESPALDO.length])
    : undefined

  // La tarjeta se abre hacia el lado con más espacio dentro del viewBox.
  const abreIzquierda = depto ? depto.cx > VIEWBOX_W * 0.6 : false

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <span className="w-8 h-8 shrink-0 rounded-full bg-brand-teal-light dark:bg-brand-teal-dark/40 flex items-center justify-center text-brand-teal-dark dark:text-brand-teal-bright">
          🌐
        </span>
        <span className="font-semibold text-fg truncate">Geoportal COLFLUX</span>
      </div>

      <div className="relative bg-white dark:bg-slate-950 px-2 py-3 aspect-[4/3] overflow-hidden">
        <svg
          viewBox={VIEWBOX}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full mx-auto"
          onClick={() => setSeleccionado(null)}
        >
          <defs>
            <marker id="ecomap-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" className="fill-slate-700 dark:fill-slate-300" />
            </marker>
          </defs>

          {DEPARTAMENTOS_PATHS.filter((d) => d.codigoDane !== '88').map((d) => {
            // Excluye el archipiélago de San Andrés (88): geográficamente aislado al noroeste,
            // se ve como un punto suelto en este mapa a pequeña escala y no es una de las 3 regiones.
            const r = REGION_BY_CODIGO.get(d.codigoDane)
            const activo = d.codigoDane === seleccionado
            return (
              <path
                key={d.codigoDane}
                d={d.path}
                className={
                  r
                    ? `fill-brand-green ${r ? 'cursor-pointer' : ''} ${activo ? 'stroke-slate-900 dark:stroke-white' : ''}`
                    : 'fill-slate-200 dark:fill-slate-800'
                }
                stroke={activo ? undefined : 'white'}
                strokeWidth={activo ? 2 : 0.75}
                strokeLinejoin="round"
                onClick={(e) => {
                  if (!r) return
                  e.stopPropagation()
                  setSeleccionado(d.codigoDane === seleccionado ? null : d.codigoDane)
                }}
              >
                <title>{r ? `${d.nombre} — ${r.nombre}` : d.nombre}</title>
              </path>
            )
          })}

          {REGIONES.map((r) => {
            const a = ANOTACIONES[r.id]
            return (
              <g key={r.id}>
                <path
                  d={a.curve}
                  fill="none"
                  className="stroke-slate-700 dark:stroke-slate-300"
                  strokeWidth={1.25}
                  markerEnd="url(#ecomap-arrow)"
                />
                <foreignObject
                  x={a.anchor === 'start' ? a.textX : a.textX - 230}
                  y={a.textY - 18}
                  width={230}
                  height={70}
                >
                  <p
                    className="text-[11px] leading-snug text-slate-700 dark:text-slate-300"
                    style={{ textAlign: a.anchor === 'start' ? 'left' : 'right' }}
                  >
                    {r.descripcion}
                  </p>
                </foreignObject>
              </g>
            )
          })}
        </svg>

        {depto && region && foto && (
          <div
            className="absolute pointer-events-none"
            style={posicionEnContenedor(depto.cx, depto.cy)}
          >
            <div
              className={`pointer-events-auto w-48 -translate-y-1/2 rounded-lg border border-border bg-white dark:bg-slate-800 shadow-xl overflow-hidden ${
                abreIzquierda ? '-translate-x-[110%]' : 'translate-x-3'
              }`}
            >
              <img src={foto} alt={`Ecosistema en ${depto.nombre}`} className="w-full h-24 object-cover" />
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-fg">{depto.nombre}</p>
                <p className="text-xs text-fg-muted">{region.nombre}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-border">
        <p className="text-sm text-fg-muted">Busca sitios, activa capas y consulta las mediciones de cada punto.</p>
        <Link
          to="/mapas"
          className="shrink-0 bg-brand-teal hover:bg-brand-teal-dark text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors"
        >
          Abrir geoportal →
        </Link>
      </div>
    </div>
  )
}
