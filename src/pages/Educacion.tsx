import { useState } from 'react'

const TABS = ['Recursos', 'Cursos', 'Videos', 'Publicaciones'] as const

const CONTENIDO: Record<(typeof TABS)[number], { icon: string; title: string; meta: string }[]> = {
  Recursos: [
    { icon: '📄', title: '¿Qué es el carbono y por qué es importante?', meta: 'Artículo educativo' },
    { icon: '🏔️', title: 'Páramos: fábricas de agua y carbono', meta: 'Guía · 5 min' },
    { icon: '📝', title: 'Cómo reportar información', meta: 'Guía práctica' },
  ],
  Cursos: [
    { icon: '🎓', title: 'Introducción a los gases de efecto invernadero', meta: 'Curso · 6 módulos' },
    { icon: '🎓', title: 'Monitoreo comunitario de ecosistemas', meta: 'Curso · 4 módulos' },
  ],
  Videos: [
    { icon: '▶️', title: 'El ciclo del carbono en los humedales', meta: 'Video · 4 min' },
    { icon: '▶️', title: 'Recorrido por una estación de monitoreo', meta: 'Video · 7 min' },
  ],
  Publicaciones: [
    { icon: '📚', title: 'Carbon losses linked to human disturbances in gallery forest in the eastern Orinoquía of Colombia', meta: 'Publicación técnica' },
    { icon: '📚', title: 'Accumulation of carbon travels through a cross-section of a complex ecosystem: the Amazon forest', meta: 'Publicación técnica' },
  ],
}

export function Educacion() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Recursos')

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-fg">Aprende y participa</h1>
        <p className="text-sm text-fg-muted mt-1">
          Conoce más sobre el carbono, nuestros ecosistemas y cómo cuidarlos.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-brand-teal text-brand-teal dark:text-brand-teal-bright'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {CONTENIDO[tab].map((item) => (
          <div
            key={item.title}
            className="bg-panel border border-border rounded-xl overflow-hidden hover:border-brand-teal transition-colors cursor-pointer"
          >
            <div className="h-28 bg-brand-teal-light dark:bg-brand-teal-dark/30 flex items-center justify-center text-4xl">
              {item.icon}
            </div>
            <div className="p-4">
              <p className="text-xs text-fg-subtle font-medium uppercase tracking-wider">
                {item.meta}
              </p>
              <p className="text-sm font-semibold text-fg mt-1">{item.title}</p>
              <button className="mt-3 text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline">
                Leer más →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
