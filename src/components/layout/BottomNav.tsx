import { Link, useRouterState } from '@tanstack/react-router'
import { BookOpen, CalendarDays, Heart, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Recipes', icon: BookOpen, exact: true },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/tags', label: 'Tags', icon: Tag },
] as const

export function BottomNav() {
  const { location } = useRouterState()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const { to, label, icon: Icon } = item
          const exact = 'exact' in item ? item.exact : false
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[60px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
