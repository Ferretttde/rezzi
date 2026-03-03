import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { useOfflineStatus } from '@/hooks/useOfflineStatus'
import { WifiOff } from 'lucide-react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isOffline = useOfflineStatus()

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center gap-2">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Du bist offline – gespeicherte Rezepte werden angezeigt
        </div>
      )}
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
