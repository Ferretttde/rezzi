import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/toaster'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { supabase } from '@/lib/supabase'

function RootLayout() {
  useRealtimeSync()

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  )
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthRoute = location.pathname.startsWith('/auth')

    if (!session && !isAuthRoute) {
      throw redirect({ to: '/auth/login' })
    }

    if (session && isAuthRoute) {
      throw redirect({ to: '/' })
    }
  },
  component: RootLayout,
})
