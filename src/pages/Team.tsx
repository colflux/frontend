import { Navigate } from 'react-router-dom'
import { useRolActual } from '@/hooks/useRolActual'
import { useUsuarios } from '@/hooks/useUsuarios'
import { InstitucionesAdmin } from '@/components/admin/team/InstitucionesAdmin'
import { SolicitudesNivelAdmin } from '@/components/admin/team/SolicitudesNivelAdmin'
import { UsuariosTable } from '@/components/admin/team/UsuariosTable'
import { UsuarioDrawer } from '@/components/admin/usuarios/UsuarioDrawer'
import { useUsuarioDrawerStore } from '@/store/useUsuarioDrawerStore'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'

export function Team() {
  const { isAdmin } = useRolActual()
  const { data: usuarios, isLoading } = useUsuarios()
  const { openDrawer } = useUsuarioDrawerStore()

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'team',
    steps: [
      {
        element: '[data-tour="team-solicitudes"]',
        popover: {
          title: 'Solicitudes de nivel',
          description: 'Pedidos de usuarios para subir su nivel de acceso: investigador, reportador o administrador.',
        },
      },
      {
        element: '[data-tour="team-instituciones"]',
        popover: {
          title: 'Instituciones',
          description: 'Registra y consulta instituciones asociadas al proyecto.',
        },
      },
      {
        element: '[data-tour="team-usuarios"]',
        popover: {
          title: 'Usuarios registrados',
          description: 'Gestión operativa de personas, instituciones y roles. Usa "Nuevo usuario" para agregar uno.',
        },
      },
    ],
  })

  if (!isAdmin) return <Navigate to="/data" replace />

  return (
    <div className="flex-1 p-6 flex flex-col gap-8 max-w-[1140px] mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Equipo COLFLUX OE2</h1>
        <p className="text-sm text-fg-muted mt-1">
          Administración de usuarios, roles e instituciones asociadas al proyecto. Gestiona contactos operativos,
          permisos funcionales y entidades.
        </p>
      </div>

      <section data-tour="team-solicitudes" className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-fg">Solicitudes de nivel</h2>
          <p className="text-sm text-fg-muted mt-1">
            Pedidos de usuarios para subir su nivel de acceso (investigador, reportador o administrador).
          </p>
        </div>
        <SolicitudesNivelAdmin />
      </section>

      <section data-tour="team-instituciones" className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-fg">Instituciones</h2>
          <p className="text-sm text-fg-muted mt-1">Registra y consulta instituciones asociadas.</p>
        </div>
        <InstitucionesAdmin />
      </section>

      <section data-tour="team-usuarios" className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-fg">Usuarios registrados</h2>
            <p className="text-sm text-fg-muted mt-1">
              Gestión operativa de personas, instituciones y roles como reportador, investigador o administrador de
              datos.
            </p>
          </div>
          <button
            onClick={() => openDrawer()}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            ＋ Nuevo usuario
          </button>
        </div>
        <UsuariosTable usuarios={usuarios ?? []} isLoading={isLoading} />
      </section>

      <UsuarioDrawer />
    </div>
  )
}
