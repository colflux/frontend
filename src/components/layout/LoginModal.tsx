import { useState, type FormEvent } from 'react'
import { useForgotPassword, useLogin, useRegistro } from '@/hooks/useAuth'

interface Props {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: Props) {
  const login = useLogin()
  const registro = useRegistro()
  const forgotPassword = useForgotPassword()
  const [modo, setModo] = useState<'login' | 'registro' | 'olvide'>('login')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  if (!open) return null

  function limpiar() {
    setNombre('')
    setCorreo('')
    setPassword('')
    setError('')
    setMensaje('')
  }

  function cambiarModo(nuevoModo: 'login' | 'registro' | 'olvide') {
    setModo(nuevoModo)
    setError('')
    setMensaje('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMensaje('')
    try {
      if (modo === 'olvide') {
        const { detail } = await forgotPassword.mutateAsync(correo.trim())
        setMensaje(detail)
        return
      }
      if (modo === 'registro') {
        await registro.mutateAsync({ nombre: nombre.trim(), correo: correo.trim(), password })
      } else {
        await login.mutateAsync({ correo: correo.trim(), password })
      }
      limpiar()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud.')
    }
  }

  const enviando = login.isPending || registro.isPending || forgotPassword.isPending

  return (
    <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-fg">
          {modo === 'registro' ? 'Crear cuenta' : modo === 'olvide' ? 'Recuperar contraseña' : 'Iniciar sesión'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {modo === 'registro' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                autoFocus
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-fg">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              autoFocus={modo === 'login' || modo === 'olvide'}
              className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />
          </div>
          {modo === 'olvide' && (
            <p className="text-xs text-fg-muted">
              Te enviaremos un enlace para restablecer tu contraseña, válido por 1 hora.
            </p>
          )}
          {modo !== 'olvide' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>
          )}
          {error && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-red-500">{error}</p>
              {modo === 'login' && (
                <p className="text-xs text-fg-muted">
                  ¿Olvidaste tu contraseña?{' '}
                  <button
                    type="button"
                    onClick={() => cambiarModo('olvide')}
                    className="font-semibold text-brand-teal hover:underline"
                  >
                    Recupérala aquí
                  </button>
                </p>
              )}
            </div>
          )}
          {mensaje && <p className="text-sm font-semibold text-brand-teal">{mensaje}</p>}
          <div className="flex items-center justify-between mt-1">
            <button
              type="button"
              onClick={() => cambiarModo(modo === 'registro' ? 'login' : modo === 'olvide' ? 'login' : 'registro')}
              className="text-xs font-semibold text-brand-teal hover:underline"
            >
              {modo === 'registro'
                ? '¿Ya tienes cuenta? Inicia sesión'
                : modo === 'olvide'
                  ? '¿Ya la recordaste? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
            </button>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
              >
                {enviando
                  ? 'Enviando…'
                  : modo === 'registro'
                    ? 'Crear cuenta'
                    : modo === 'olvide'
                      ? 'Enviar enlace'
                      : 'Ingresar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
