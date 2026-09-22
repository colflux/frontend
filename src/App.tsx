import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Home } from '@/pages/Home'
import { MapaInteractivo } from '@/pages/MapaInteractivo'
import { DashboardIndicadores } from '@/pages/DashboardIndicadores'
import { Participacion } from '@/pages/Participacion'
import { ReportarFormulario } from '@/pages/ReportarFormulario'
import { EtlDatos } from '@/pages/EtlDatos'
import { EtlReglasCampo } from '@/pages/EtlReglasCampo'
import { EtlReglaDetalle } from '@/pages/EtlReglaDetalle'
import { EtlReglaValidacion } from '@/pages/EtlReglaValidacion'
import { EtlMapeo } from '@/pages/EtlMapeo'
import { EtlUpload } from '@/pages/EtlUpload'
import { DataGestion } from '@/pages/DataGestion'
import { DbModelo } from '@/pages/DbModelo'
import { Team } from '@/pages/Team'
import { ResetPassword } from '@/pages/ResetPassword'
import { useThemeStore } from '@/store/useThemeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mapas" element={<MapaInteractivo />} />
            <Route path="/dashboard" element={<DashboardIndicadores />} />
            <Route path="/reportar" element={<Participacion />} />
            <Route path="/reportar/formulario" element={<ReportarFormulario />} />
            <Route path="/etl/datos" element={<EtlDatos />} />
            <Route path="/etl/reglas/campo" element={<EtlReglasCampo />} />
            <Route path="/etl/reglas/detalle" element={<EtlReglaDetalle />} />
            <Route path="/etl/reglas/validacion" element={<EtlReglaValidacion />} />
            <Route path="/etl/mapeo" element={<EtlMapeo />} />
            <Route path="/etl/upload" element={<EtlUpload />} />
            <Route path="/data" element={<DataGestion />} />
            <Route path="/db" element={<DbModelo />} />
            <Route path="/team" element={<Team />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
