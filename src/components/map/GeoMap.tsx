import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useSitios } from '@/hooks/useSitios'
import { useResumenGeo } from '@/hooks/useResumenGeo'
import { useAppStore } from '@/store/useAppStore'
import { useThemeStore } from '@/store/useThemeStore'
import { GAS_COLORS, formatValor, formatUnidad } from '@/utils/formatters'
import { buildGeoResumenBaseFilters } from '@/utils/geoFilters'
import {
  buildFillColorExpression,
  computeBounds,
  getMetricValues,
  parseUltimaMedicion,
  type MetricField,
} from '@/utils/choropleth'
import { GeoBreadcrumb } from './GeoBreadcrumb'
import { ChoroplethLegend } from './ChoroplethLegend'
import type { GeoNivel, GeoResumenFeature, GeoResumenFilters, SitioFeature } from '@/types'

const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const MAP_STYLE_OVERRIDE = import.meta.env.VITE_MAP_STYLE

const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    },
  },
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
}

type BasemapMode = 'map' | 'satellite'

const COLOMBIA_CENTER: [number, number] = [-74.297, 4.571]

const RESUMEN_SOURCE_ID = 'resumen-choropleth'
const RESUMEN_FILL_LAYER = 'resumen-fill'
const RESUMEN_OUTLINE_LAYER = 'resumen-outline'
const RESUMEN_CIRCLE_LAYER = 'resumen-circle'

interface Props {
  onSelectSitio?: (sitio: SitioFeature) => void
}

export function GeoMap({ onSelectSitio }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const sitiosMarkersRef = useRef<maplibregl.Marker[]>([])
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null)

  const { data: sitios } = useSitios()
  const {
    filters,
    mapViewMode,
    setMapViewMode,
    departamento,
    municipio,
    vereda,
    setMunicipio,
    setVereda,
    resetDrill,
  } = useAppStore()
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const [basemap, setBasemap] = useState<BasemapMode>('map')
  const [metric, setMetric] = useState<MetricField>('promedio')

  // El nivel mostrado en el mapa es el siguiente nivel hijo del último
  // elegido: sin departamento se ven departamentos, con departamento (sin
  // municipio) se ven sus municipios, etc. — hasta sitio (puntos), que es
  // el nivel hoja: clicar un sitio abre su detalle en vez de seguir drill-down.
  const nivel: GeoNivel =
    departamento == null ? 'departamento' : municipio == null ? 'municipio' : vereda == null ? 'vereda' : 'sitio'

  const resumenFilters = useMemo<GeoResumenFilters>(() => {
    const f = buildGeoResumenBaseFilters(filters)
    if (departamento) f.departamento = departamento.id
    if (municipio) f.municipio = municipio.id
    if (vereda) f.vereda = vereda.id
    return f
  }, [filters, departamento, municipio, vereda])

  const { data: resumenData } = useResumenGeo(nivel, resumenFilters, mapViewMode === 'regiones')

  // Refs con los valores más recientes: se usan para reconstruir el
  // choropleth después de un setStyle (que borra sources/layers del mapa).
  const resumenDataRef = useRef(resumenData)
  const metricRef = useRef(metric)
  const mapViewModeRef = useRef(mapViewMode)
  const nivelRef = useRef(nivel)
  const sitiosRef = useRef(sitios)
  const onSelectSitioRef = useRef(onSelectSitio)
  resumenDataRef.current = resumenData
  metricRef.current = metric
  mapViewModeRef.current = mapViewMode
  nivelRef.current = nivel
  sitiosRef.current = sitios
  onSelectSitioRef.current = onSelectSitio

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE_OVERRIDE ?? (isDark ? DARK_STYLE : LIGHT_STYLE),
      center: COLOMBIA_CENTER,
      zoom: 5,
      attributionControl: false,
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')
    mapRef.current.addControl(new maplibregl.ScaleControl(), 'bottom-left')

    const handleResumenClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0] as unknown as GeoResumenFeature | undefined
      if (!feature) return
      const p = feature.properties
      const entity = { id: p.id, nombre: p.nombre }
      if (nivelRef.current === 'departamento') {
        useAppStore.getState().setDepartamento(entity)
      } else if (nivelRef.current === 'municipio') {
        useAppStore.getState().setMunicipio(entity)
      } else if (nivelRef.current === 'vereda') {
        useAppStore.getState().setVereda(entity)
      } else if (nivelRef.current === 'sitio') {
        // Sitio es el nivel hoja: no hay drill-down más profundo, se abre
        // el detalle del sitio (mismo flujo que un marker en modo "sitios").
        const sitioFeature = sitiosRef.current?.features.find((f) => f.properties.id === p.id)
        if (sitioFeature) onSelectSitioRef.current?.(sitioFeature)
      }
    }

    const handleResumenHover = (e: maplibregl.MapLayerMouseEvent) => {
      const map = mapRef.current
      const feature = e.features?.[0] as unknown as GeoResumenFeature | undefined
      if (!map || !feature) return
      map.getCanvas().style.cursor = 'pointer'

      const p = feature.properties
      // maplibre serializa las properties anidadas (objetos) del GeoJSON
      // source a JSON string al consultarlas vía queryRenderedFeatures.
      const ultimaMedicion = parseUltimaMedicion(p.ultima_medicion)
      const ultima = ultimaMedicion
        ? `${formatValor(ultimaMedicion.valor, ultimaMedicion.unidad)} (${ultimaMedicion.fecha})`
        : 'Sin datos'

      const html = `
        <strong style="color:#0f172a">${p.nombre}</strong>
        <br/><span style="color:#374151">Total de muestras: ${p.total_muestras}</span>
        <br/><span style="color:#374151">Promedio: ${p.promedio != null ? p.promedio.toLocaleString('es-CO', { maximumFractionDigits: 3 }) : 'Sin datos'}</span>
        <br/><span style="color:#374151">Última medición: ${ultima}</span>
      `

      if (!hoverPopupRef.current) {
        hoverPopupRef.current = new maplibregl.Popup({
          offset: 8,
          closeButton: false,
          closeOnClick: false,
        })
      }
      hoverPopupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map)
    }

    const handleResumenLeave = () => {
      const map = mapRef.current
      if (map) map.getCanvas().style.cursor = ''
      hoverPopupRef.current?.remove()
    }

    for (const layer of [RESUMEN_FILL_LAYER, RESUMEN_CIRCLE_LAYER]) {
      mapRef.current.on('click', layer, handleResumenClick)
      mapRef.current.on('mousemove', layer, handleResumenHover)
      mapRef.current.on('mouseleave', layer, handleResumenLeave)
    }

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap basemap style when the theme or satellite toggle changes.
  // setStyle borra los sources/layers custom, así que hay que reconstruir
  // el choropleth una vez la nueva style termine de cargar.
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const restyle = () => {
      if (basemap === 'satellite') {
        map.setStyle(SATELLITE_STYLE)
      } else if (!MAP_STYLE_OVERRIDE) {
        map.setStyle(isDark ? DARK_STYLE : LIGHT_STYLE)
      } else {
        return
      }
      map.once('style.load', () => syncChoropleth(map))
    }
    restyle()
    // syncChoropleth lee siempre los valores más recientes vía refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, basemap])

  function syncChoropleth(map: maplibregl.Map) {
    const data = resumenDataRef.current
    if (mapViewModeRef.current !== 'regiones' || !data) {
      removeChoropleth(map)
      return
    }

    // El nivel "sitio" trae geometría de puntos (no polígonos): se dibuja
    // como capa de círculos en vez de fill/outline, ambas capas conviven en
    // el estilo y se alternan por visibilidad para no recrear el source.
    const esSitio = nivelRef.current === 'sitio'

    if (map.getSource(RESUMEN_SOURCE_ID)) {
      ;(map.getSource(RESUMEN_SOURCE_ID) as maplibregl.GeoJSONSource).setData(data as never)
    } else {
      map.addSource(RESUMEN_SOURCE_ID, {
        type: 'geojson',
        data: data as never,
      })
      map.addLayer({
        id: RESUMEN_FILL_LAYER,
        type: 'fill',
        source: RESUMEN_SOURCE_ID,
        paint: { 'fill-color': '#94a3b8', 'fill-opacity': 0.75 },
      })
      map.addLayer({
        id: RESUMEN_OUTLINE_LAYER,
        type: 'line',
        source: RESUMEN_SOURCE_ID,
        paint: { 'line-color': '#0f172a', 'line-width': 1 },
      })
      map.addLayer({
        id: RESUMEN_CIRCLE_LAYER,
        type: 'circle',
        source: RESUMEN_SOURCE_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': '#94a3b8',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0f172a',
        },
      })
    }

    map.setLayoutProperty(RESUMEN_FILL_LAYER, 'visibility', esSitio ? 'none' : 'visible')
    map.setLayoutProperty(RESUMEN_OUTLINE_LAYER, 'visibility', esSitio ? 'none' : 'visible')
    map.setLayoutProperty(RESUMEN_CIRCLE_LAYER, 'visibility', esSitio ? 'visible' : 'none')

    const values = getMetricValues(data.features, metricRef.current)
    const min = values.length ? Math.min(...values) : 0
    const max = values.length ? Math.max(...values) : 1
    const colorExpr = buildFillColorExpression(metricRef.current, min, max)
    map.setPaintProperty(RESUMEN_FILL_LAYER, 'fill-color', colorExpr)
    map.setPaintProperty(RESUMEN_CIRCLE_LAYER, 'circle-color', colorExpr)
  }

  function removeChoropleth(map: maplibregl.Map) {
    if (map.getLayer(RESUMEN_FILL_LAYER)) map.removeLayer(RESUMEN_FILL_LAYER)
    if (map.getLayer(RESUMEN_OUTLINE_LAYER)) map.removeLayer(RESUMEN_OUTLINE_LAYER)
    if (map.getLayer(RESUMEN_CIRCLE_LAYER)) map.removeLayer(RESUMEN_CIRCLE_LAYER)
    if (map.getSource(RESUMEN_SOURCE_ID)) map.removeSource(RESUMEN_SOURCE_ID)
  }

  // Sync choropleth source/layers when data, mode or metric change
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    if (!map.isStyleLoaded()) {
      map.once('load', () => syncChoropleth(map))
      return
    }
    syncChoropleth(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumenData, mapViewMode, metric])

  // Fit bounds to the current drill-down level once data arrives
  useEffect(() => {
    if (!mapRef.current || mapViewMode !== 'regiones' || !resumenData?.features.length) return
    const bounds = computeBounds(resumenData)
    if (bounds) mapRef.current.fitBounds(bounds, { padding: 60, duration: 800 })
  }, [resumenData, mapViewMode])

  // Render sitios georreferenciados (GeoJSON) as pins, filtered by proyecto
  useEffect(() => {
    if (!mapRef.current) return

    sitiosMarkersRef.current.forEach((m) => m.remove())
    sitiosMarkersRef.current = []

    if (mapViewMode !== 'sitios' || !sitios?.features.length) return

    const gasColor = GAS_COLORS[filters.gas] ?? GAS_COLORS.CO2

    const features = filters.proyectoId
      ? sitios.features.filter((f) =>
          f.properties.proyectos.some((p) => p.id === filters.proyectoId)
        )
      : sitios.features

    features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates
      const p = feature.properties
      const resumenGas = p.resumen_por_gas?.[filters.gas]
      // Sitios sin datos del gas seleccionado se pintan atenuados en vez del
      // color del gas, para no sugerir que ahí también se midió ese gas.
      const color = resumenGas ? gasColor : '#94a3b8'

      const el = document.createElement('div')
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: ${color};
        border: 2px solid #0f172a;
        opacity: ${resumenGas ? 1 : 0.45};
        cursor: pointer;
      `
      const proyectos = p.proyectos.map((pr) => pr.nombre).join(', ') || '—'
      const ubicacion = [p.municipio, p.departamento].filter(Boolean).join(', ') || 'Sin datos'
      const altitud = p.altitud != null ? `${p.altitud.toFixed(0)} m s.n.m.` : 'Sin datos'
      const ultimaMedicion = resumenGas?.ultima_medicion
        ? `${formatValor(resumenGas.ultima_medicion.valor, resumenGas.ultima_medicion.unidad)} (${resumenGas.ultima_medicion.fecha})`
        : 'Sin datos'

      const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(`
        <strong style="color:#0f172a">${p.nombre || 'Sitio ' + p.id}</strong>
        <br/><span style="color:#374151">Ubicación: ${ubicacion}</span>
        <br/><span style="color:#374151">Altitud: ${altitud}</span>
        <br/><span style="color:#374151">Proyecto(s): ${proyectos}</span>
        <br/><span style="color:#374151">Unidades de muestreo: ${p.unidades_muestreo.length}</span>
        <br/><span style="color:#374151">Última medición (${filters.gas}): ${ultimaMedicion}</span>
        <br/><span style="color:#374151">Total de muestras (${filters.gas}): ${resumenGas?.total_muestras ?? 0}</span>
        <br/><button class="ver-detalle-btn" style="margin-top:6px;padding:3px 10px;font-size:12px;font-weight:600;color:#fff;background:#198A77;border:none;border-radius:4px;cursor:pointer;">Ver detalle</button>
      `)

      // El popup se renderiza como HTML plano (fuera de React), así que el
      // botón "Ver detalle" se cablea a mano al abrirse cada vez.
      popup.on('open', () => {
        popup.getElement()
          ?.querySelector('.ver-detalle-btn')
          ?.addEventListener('click', () => onSelectSitio?.(feature))
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current!)

      sitiosMarkersRef.current.push(marker)
    })
  }, [sitios, filters.proyectoId, filters.gas, mapViewMode])

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      { label: 'Colombia', onClick: departamento ? resetDrill : undefined },
    ]
    if (departamento) {
      items.push({
        label: departamento.nombre,
        onClick: municipio ? () => setMunicipio(null) : undefined,
      })
    }
    if (municipio) {
      items.push({
        label: municipio.nombre,
        onClick: vereda ? () => setVereda(null) : undefined,
      })
    }
    if (vereda) {
      // vereda ya no es la hoja del breadcrumb (ahora hay nivel "sitio"
      // debajo): permite volver a la lista de veredas, igual que los demás.
      items.push({ label: vereda.nombre, onClick: () => setVereda(null) })
    }
    return items
  }, [departamento, municipio, vereda, resetDrill, setMunicipio, setVereda])

  const metricValues = resumenData ? getMetricValues(resumenData.features, metric) : []
  const legendMin = metricValues.length ? Math.min(...metricValues) : 0
  const legendMax = metricValues.length ? Math.max(...metricValues) : 0
  const legendUnidad =
    metric === 'promedio'
      ? formatUnidad(resumenData?.features.find((f) => f.properties.ultima_medicion)?.properties.ultima_medicion?.unidad ?? '')
      : undefined

  const isEmpty = mapViewMode === 'regiones' && resumenData != null && resumenData.features.length === 0

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute top-3 left-3 z-10 flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setBasemap('map')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            basemap === 'map'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Mapa
        </button>
        <button
          type="button"
          onClick={() => setBasemap('satellite')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            basemap === 'satellite'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Satélite
        </button>
      </div>

      <div className="absolute top-14 left-3 z-10 flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setMapViewMode('sitios')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            mapViewMode === 'sitios'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Sitios
        </button>
        <button
          type="button"
          onClick={() => setMapViewMode('regiones')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            mapViewMode === 'regiones'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Regiones
        </button>
      </div>

      {mapViewMode === 'regiones' && (
        <GeoBreadcrumb items={breadcrumbItems} onReset={resetDrill} showReset={departamento != null} />
      )}

      {mapViewMode === 'regiones' && !isEmpty && metricValues.length > 0 && (
        <ChoroplethLegend
          metric={metric}
          onMetricChange={setMetric}
          min={legendMin}
          max={legendMax}
          unidad={legendUnidad}
        />
      )}

      {isEmpty && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto rounded-md border border-slate-300 bg-white/95 px-4 py-3 text-center shadow-sm dark:border-slate-600 dark:bg-slate-800/95">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              No hay datos para este nivel con los filtros aplicados.
            </p>
            {departamento != null && (
              <button
                type="button"
                onClick={resetDrill}
                className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
              >
                ⤒ Volver arriba
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
