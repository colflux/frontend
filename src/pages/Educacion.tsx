import { useState } from 'react'

const TABS = ['Recursos', 'Cursos', 'Videos', 'Publicaciones', 'Encuentros'] as const

type TabValue = (typeof TABS)[number]

const CONTENIDO: Record<Exclude<TabValue, 'Encuentros'>, { icon: string; title: string; meta: string }[]> = {
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

const ENCUENTROS = [
  {
    id: 'chorrera',
    label: 'ENCUENTRO',
    title: 'Visita aliados de La Chorrera',
    description:
      'Aplicación del taller de metodologías de carbono, co-diseño de la plataforma COLFLUX y fortalecimiento de redes de conocimiento.',
    date: '9, 11, 12 y 13 de mayo',
    place: 'PUJ y La Calera',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'enfoques',
    label: 'ENCUENTRO',
    title: 'Encuentro de enfoques diferenciales',
    description:
      'Espacio de intercambio y diálogo sobre enfoques diferenciales en el territorio, con el objetivo de reconocer sus particularidades y fortalecer la inclusión en el proyecto.',
    date: '30 de junio',
    place: 'Hotel Viaggio',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  },
]

export function Educacion() {
  const [tab, setTab] = useState<TabValue>('Encuentros')

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

      {tab === 'Encuentros' ? (
        <div className="space-y-4">
          {ENCUENTROS.map((item) => (
            <div
              key={item.id}
              className="flex bg-panel border border-border rounded-xl overflow-hidden hover:border-brand-teal transition-colors"
            >
              <div
                className="w-36 md:w-44 h-28 md:h-32 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${item.image})` }}
                aria-label={item.title}
              />

              <div className="flex-1 p-3 md:p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-brand-teal-light text-brand-teal dark:text-brand-teal-bright">
                    {item.label}
                  </span>

                  <h2 className="mt-2 text-lg md:text-xl font-bold text-fg leading-snug">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-xs md:text-sm text-fg-muted leading-relaxed max-w-3xl">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
                    <span className="flex items-center gap-2">
                      <span aria-hidden>📅</span>
                      {item.date}
                    </span>
                    <span className="flex items-center gap-2">
                      <span aria-hidden>📍</span>
                      {item.place}
                    </span>
                  </div>
                </div>

                <span className="text-3xl text-brand-teal dark:text-brand-teal-bright" aria-hidden>
                  ›
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  )
}
