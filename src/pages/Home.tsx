import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useHomeStats } from '@/hooks/useHomeStats'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { EcosistemasMap } from '@/components/home/EcosistemasMap'
import { LoginModal } from '@/components/layout/LoginModal'
import { TourButton } from '@/components/common/TourButton'
import ciencias from '@/assets/aliados/ciencias.png'
import javeriana from '@/assets/aliados/javeriana.png'
import rosario from '@/assets/aliados/rosario.png'
import uniNarino from '@/assets/aliados/uni-narino.png'
import jardinBotanico from '@/assets/aliados/jardin-botanico-alcaldia.png'
import ideam from '@/assets/aliados/ideam.png'
import cda from '@/assets/aliados/cda.png'
import corredorJaguar from '@/assets/aliados/corredor-jaguar.png'
import sobreProyecto from '@/assets/Chorrera.jpeg'
import monitoreoImg from '@/assets/ecosistemas/paramo-1.jpg'
import comunidadesImg from '@/assets/ecosistemas/paramo-2.jpg'

const EXPLORA = [
  {
    tag: 'MONITOREO',
    title: '¿Cómo medimos el carbono?',
    desc: 'Conoce los sensores y equipos instalados en cada sitio, cómo se registran los flujos de CO₂ y CH₄, y la metodología usada para procesar las mediciones.',
    cta: 'Ver monitoreo',
    to: '/mapas',
    img: monitoreoImg,
  },
  {
    tag: 'COMUNIDADES',
    title: 'Trabajo con las comunidades',
    desc: 'Las comunidades locales acompañan el trabajo de campo, comparten su conocimiento del territorio y reportan lo que observan en páramos y humedales.',
    cta: 'Conocer más',
    to: '/reportar',
    img: comunidadesImg,
  },
  {
    tag: 'DATOS',
    title: 'Consulta los datos',
    desc: 'Explora los sitios en el mapa interactivo, revisa tendencias en el dashboard de indicadores y descarga la información para tus propios análisis.',
    cta: 'Ir a los datos',
    to: '/dashboard',
    img: null,
  },
]

const ALIADOS = [
  { name: 'Ciencias', src: ciencias },
  { name: 'Pontificia Universidad Javeriana', src: javeriana },
  { name: 'Universidad del Rosario', src: rosario },
  { name: 'Universidad de Nariño', src: uniNarino },
  { name: 'Alcaldía Mayor de Bogotá / Jardín Botánico', src: jardinBotanico },
  { name: 'IDEAM', src: ideam },
  { name: 'CDA', src: cda },
  { name: 'Corporación Corredor del Jaguar', src: corredorJaguar },
]

export function Home() {
  const usuario = useAuthStore((s) => s.usuario)
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const { data: stats } = useHomeStats()
  const ultimaMedicion = stats?.ultimaMedicion
    ? new Date(stats.ultimaMedicion).toLocaleDateString('es-CO')
    : '—'

  function handleReportarClick() {
    if (usuario) {
      navigate('/reportar')
    } else {
      setLoginOpen(true)
    }
  }

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'home',
    steps: [
      {
        element: '[data-tour="home-explora"]',
        popover: {
          title: 'Explora los datos',
          description: 'Aquí entras al mapa interactivo con todos los sitios monitoreados.',
        },
      },
      {
        element: '[data-tour="home-reportar"]',
        popover: {
          title: 'Reportar información',
          description: 'Si tienes una observación de campo, repórtala aquí (te pedirá iniciar sesión).',
        },
      },
      {
        element: '[data-tour="home-stats"]',
        popover: {
          title: 'Estadísticas en vivo',
          description: 'Estos números se actualizan con la información real de la plataforma.',
        },
      },
      {
        element: '[data-tour="home-explora-colflux"]',
        popover: {
          title: 'Explora COLFLUX',
          description: 'Tres rutas rápidas para entender cómo funciona COLFLUX: monitoreo, comunidades y datos.',
        },
      },
    ],
  })

  return (
    <div className="flex-1 flex flex-col">
      <TourButton onClick={iniciarTour} />
      <section className="relative overflow-hidden bg-brand-teal-light dark:bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-teal-dark dark:text-brand-teal-bright leading-tight">
              Sistema Integrado de Observación y Cuantificación de Carbono en Colombia
            </h1>
            <div className="mt-8 flex gap-3">
              <Link
                to="/mapas"
                data-tour="home-explora"
                className="bg-panel border border-border text-fg px-6 py-3 rounded-full font-semibold hover:border-brand-teal transition-colors"
              >
                Explora los datos
              </Link>
              <button
                type="button"
                data-tour="home-reportar"
                onClick={handleReportarClick}
                className="bg-brand-yellow hover:bg-brand-yellow-dark text-brand-brown px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Reportar información
              </button>
            </div>
            <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

            <div data-tour="home-stats" className="mt-12 grid grid-cols-3 gap-4">
              <div className="bg-panel border border-border rounded-xl p-4">
                <p className="text-2xl font-bold text-brand-teal-dark dark:text-brand-teal-bright">
                  {stats ? stats.sitios : '—'}
                </p>
                <p className="text-xs text-fg-muted">Sitios monitoreados</p>
              </div>
              <div className="bg-panel border border-border rounded-xl p-4">
                <p className="text-2xl font-bold text-brand-teal-dark dark:text-brand-teal-bright">
                  {stats ? stats.datos.toLocaleString('es-CO') : '—'}
                </p>
                <p className="text-xs text-fg-muted">Datos recolectados</p>
              </div>
              <div className="bg-panel border border-border rounded-xl p-4">
                <p className="text-2xl font-bold text-brand-yellow-dark">
                  {stats ? stats.usuarios : '—'}
                </p>
                <p className="text-xs text-fg-muted">Usuarios</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-fg-muted">
              Última medición registrada: {ultimaMedicion}
            </p>
          </div>

          <EcosistemasMap />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center w-full">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-teal uppercase">
            Sobre el proyecto
          </p>
          <h2 className="mt-2 text-3xl font-bold text-fg">¿Qué es COLFLUX?</h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            COLFLUX es una plataforma que integra mediciones de flujos de carbono (CO₂ y CH₄) en
            páramos y humedales de Colombia. Reúne en un solo lugar los datos de campo, la
            información de los sensores y el conocimiento de las comunidades.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Su objetivo es entender cuánto carbono capturan y emiten estos ecosistemas para apoyar
            decisiones de conservación basadas en evidencia.
          </p>
        </div>
        <img
          src={sobreProyecto}
          alt="Trabajo de campo en páramo"
          className="rounded-xl w-full h-72 object-cover"
        />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 w-full">
        <h2 className="text-3xl font-bold text-fg">Explora COLFLUX</h2>
        <p className="mt-2 text-fg-muted">
          Conoce cómo medimos, con quién trabajamos y dónde encontrar los datos.
        </p>
        <div data-tour="home-explora-colflux" className="mt-8 grid md:grid-cols-3 gap-6">
          {EXPLORA.map((item) => (
            <Link
              key={item.tag}
              to={item.to}
              className="bg-panel border border-border rounded-xl overflow-hidden hover:border-brand-teal transition-colors group flex flex-col"
            >
              {item.img ? (
                <img src={item.img} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-brand-teal-light flex items-center justify-center text-4xl">
                  📈
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-xs font-semibold tracking-wide text-brand-teal uppercase">
                  {item.tag}
                </p>
                <h3 className="mt-2 font-semibold text-fg group-hover:text-brand-teal dark:group-hover:text-brand-teal-bright">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-fg-muted flex-1">{item.desc}</p>
                <span className="mt-4 text-sm font-semibold text-brand-teal">{item.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 w-full dark:bg-white dark:rounded-2xl">
        <p className="text-center text-sm font-semibold tracking-wide text-fg-muted dark:text-slate-500 uppercase">
          Aliados
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {ALIADOS.map((aliado) => (
            <img
              key={aliado.name}
              src={aliado.src}
              alt={aliado.name}
              title={aliado.name}
              className="h-12 w-auto object-contain grayscale-0"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
