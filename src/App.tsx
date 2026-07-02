import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Dashboard } from '@/pages/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-surface text-slate-100 flex flex-col">
        {/* navbar */}
        <header className="h-14 shrink-0 bg-panel border-b border-border flex items-center px-6 gap-3">
          <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center text-white text-sm font-bold">
            G
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Geoportal GEI</h1>
            <p className="text-xs text-slate-400 leading-none mt-0.5">
              Gases de Efecto Invernadero · Colombia
            </p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-medium">
              Datos mock — API en construcción
            </span>
          </div>
        </header>

        <Dashboard />
      </div>
    </QueryClientProvider>
  )
}
