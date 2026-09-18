import { Link } from 'react-router-dom'
import { useRolActual } from '@/hooks/useRolActual'

const FEATURES = [
  { icon: '🔬', title: 'Ciencia', desc: 'Datos confiables y abiertos' },
  { icon: '🤝', title: 'Comunidad', desc: 'Participación ciudadana' },
  { icon: '💡', title: 'Tecnología', desc: 'Inteligencia para la decisión' },
]

export function Home() {
  const { tieneNivel } = useRolActual()

  return (
    <div className="flex-1 flex flex-col">
      <section className="relative overflow-hidden bg-brand-teal-light dark:bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-fg leading-tight">
              Sistema Integrado de Observación y Cuantificación de Carbono en Colombia
            </h1>
            <p className="mt-5 text-fg-muted text-lg leading-relaxed">
              Observa, mide y entiende el carbono en páramos y humedales de Colombia.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/mapas"
                className="bg-brand-yellow hover:bg-brand-yellow-dark text-brand-brown px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Explorar Mapas
              </Link>
              {tieneNivel('reportador') ? (
                <Link
                  to="/reportar"
                  className="bg-panel border border-border text-fg px-6 py-3 rounded-full font-semibold hover:border-brand-teal transition-colors"
                >
                  Reportar información
                </Link>
              ) : (
                <span
                  title="Reportar información — disponible desde el nivel reportador"
                  className="bg-panel border border-border text-fg-subtle px-6 py-3 rounded-full font-semibold opacity-50 cursor-not-allowed"
                >
                  Reportar información
                </span>
              )}
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex flex-col items-center text-center gap-1">
                  <span className="text-2xl" aria-hidden>
                    {f.icon}
                  </span>
                  <p className="text-sm font-semibold text-fg">{f.title}</p>
                  <p className="text-xs text-fg-muted">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-80 md:h-[420px] rounded-2xl overflow-hidden bg-brand-teal dark:bg-brand-teal-dark flex items-center justify-center">
            <span className="text-8xl drop-shadow" aria-hidden>
              🏔️
            </span>
            <span className="absolute top-8 left-10 text-3xl" aria-hidden>
              🌫️
            </span>
            <span className="absolute bottom-10 right-12 text-3xl" aria-hidden>
              🌿
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6 w-full">
        <Link
          to="/mapas"
          className="bg-panel border border-border rounded-xl p-6 hover:border-brand-teal transition-colors group"
        >
          <span className="text-2xl" aria-hidden>
            🗺️
          </span>
          <h3 className="mt-3 font-semibold text-fg group-hover:text-brand-teal dark:group-hover:text-brand-teal-bright">
            Mapa interactivo
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            Explora sitios, capas y niveles de carbono almacenado por región.
          </p>
        </Link>
        <Link
          to="/dashboard"
          className="bg-panel border border-border rounded-xl p-6 hover:border-brand-teal transition-colors group"
        >
          <span className="text-2xl" aria-hidden>
            📊
          </span>
          <h3 className="mt-3 font-semibold text-fg group-hover:text-brand-teal dark:group-hover:text-brand-teal-bright">
            Dashboard de indicadores
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            Resúmenes, tendencias y distribución de datos de carbono.
          </p>
        </Link>
        {tieneNivel('reportador') ? (
          <Link
            to="/reportar"
            className="bg-panel border border-border rounded-xl p-6 hover:border-brand-teal transition-colors group"
          >
            <span className="text-2xl" aria-hidden>
              📝
            </span>
            <h3 className="mt-3 font-semibold text-fg group-hover:text-brand-teal dark:group-hover:text-brand-teal-bright">
              Participación ciudadana
            </h3>
            <p className="mt-1 text-sm text-fg-muted">
              Reporta información desde tu territorio y ayuda a cuidar los ecosistemas.
            </p>
          </Link>
        ) : (
          <div
            title="Participación ciudadana — disponible desde el nivel reportador"
            className="bg-panel border border-border rounded-xl p-6 opacity-50 cursor-not-allowed"
          >
            <span className="text-2xl" aria-hidden>
              📝
            </span>
            <h3 className="mt-3 font-semibold text-fg-subtle">Participación ciudadana</h3>
            <p className="mt-1 text-sm text-fg-muted">
              Reporta información desde tu territorio y ayuda a cuidar los ecosistemas.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
