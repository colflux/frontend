import { useState } from 'react'
import { GeoMap } from '@/components/map/GeoMap'
import { FilterPanel } from '@/features/filters/FilterPanel'
import { Card } from '@/components/common/Card'
import { TourButton } from '@/components/common/TourButton'
import { SiteDetailPanel } from '@/components/detalle/SiteDetailPanel'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import type { SitioFeature } from '@/types'

export function MapaInteractivo() {
  const [selectedSitio, setSelectedSitio] = useState<SitioFeature | null>(null)

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'mapa',
    steps: [
      {
        element: '[data-tour="mapa-filtros"]',
        popover: {
          title: 'Filtros',
          description: 'Filtra los sitios por ecosistema, región o variable antes de explorarlos en el mapa.',
        },
      },
      {
        element: '[data-tour="mapa-mapa"]',
        popover: {
          title: 'Mapa interactivo',
          description: 'Haz clic en un punto para ver el detalle de ese sitio de monitoreo.',
        },
      },
      {
        popover: {
          title: 'Detalle del sitio',
          description: 'Al seleccionar un sitio, aquí abajo aparece un panel con sus mediciones y tendencias.',
        },
      },
    ],
  })

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <TourButton onClick={iniciarTour} />
      {/* ── panel izquierdo ───────────────────────────── */}
      <aside
        data-tour="mapa-filtros"
        className="w-[380px] min-w-[380px] bg-panel border-r border-border overflow-y-auto flex flex-col gap-4 p-4"
      >
        <Card title="Filtros">
          <FilterPanel />
        </Card>
      </aside>

      {/* ── mapa + tendencia ──────────────────────────── */}
      <div data-tour="mapa-mapa" className="relative flex-1">
        <GeoMap onSelectSitio={setSelectedSitio} />

        {/* panel inferior: detalle de sitio, si hay uno elegido */}
        {selectedSitio && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col">
            <div className="bg-panel/90 backdrop-blur-sm border-t border-border">
              <SiteDetailPanel sitio={selectedSitio} onClose={() => setSelectedSitio(null)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
