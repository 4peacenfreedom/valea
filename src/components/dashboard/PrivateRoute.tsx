/**
 * components/dashboard/PrivateRoute.tsx
 * Protege las rutas del dashboard. Si no hay sesión activa,
 * redirige al login.
 */
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function PrivateRoute() {
  const [session, setSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(!!sess)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Mientras verifica sesión muestra pantalla en blanco (evita flash)
  if (session === null) {
    return (
      <div className="min-h-screen bg-brand-lino flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />
}
