import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRegions, useEmissions } from '@/hooks/useGreenhouseData'
import { useAppStore } from '@/store/useAppStore'
import { GAS_COLORS } from '@/utils/formatters'

const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE ??
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const COLOMBIA_CENTER: [number, number] = [-74.297, 4.571]

export function GeoMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const { data: regions = [] } = useRegions()
  const { data: emissions = [] } = useEmissions()
  const { filters, setRegion } = useAppStore()

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: COLOMBIA_CENTER,
      zoom: 5,
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.addControl(new maplibregl.ScaleControl(), 'bottom-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Re-render markers when data or filters change
  useEffect(() => {
    if (!mapRef.current || !regions.length || !emissions.length) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const maxTotal = Math.max(
      ...regions.map((r) =>
        emissions.filter((e) => e.regionId === r.id).reduce((a, e) => a + e.value, 0)
      ),
      1
    )

    regions.forEach((region) => {
      const regionEmissions = emissions.filter((e) => e.regionId === region.id)
      const total = regionEmissions.reduce((a, e) => a + e.value, 0)
      if (total === 0) return

      const radius = 14 + (total / maxTotal) * 28
      const color = GAS_COLORS[filters.gas] ?? GAS_COLORS.CO2
      const isSelected = filters.regionId === region.id

      const el = document.createElement('div')
      el.style.cssText = `
        width: ${radius * 2}px;
        height: ${radius * 2}px;
        border-radius: 50%;
        background: ${color}40;
        border: ${isSelected ? '3px' : '2px'} solid ${color};
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: ${isSelected ? `0 0 0 4px ${color}30` : 'none'};
      `

      const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
        `<strong style="color:#0f172a">${region.name}</strong>
         <br/><span style="color:#374151">Total: ${total.toFixed(1)} MtCO₂e</span>`
      )

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([region.lng, region.lat])
        .setPopup(popup)
        .addTo(mapRef.current!)

      el.addEventListener('click', () => {
        setRegion(filters.regionId === region.id ? null : region.id)
      })

      markersRef.current.push(marker)
    })
  }, [regions, emissions, filters.gas, filters.regionId, setRegion])

  return <div ref={mapContainer} className="w-full h-full" />
}
