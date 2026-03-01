import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameWeek } from 'date-fns'
import { Button } from '@/components/ui/button'

interface WeekNavigatorProps {
  weekStart: Date
  onWeekChange: (date: Date) => void
}

export function WeekNavigator({ weekStart, onWeekChange }: WeekNavigatorProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 })

  const label =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${format(weekStart, 'MMM d')}–${format(weekEnd, 'd, yyyy')}`
      : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onWeekChange(subWeeks(weekStart, 1))}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex-1 text-center">
        <p className="text-sm font-semibold">{label}</p>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onWeekChange(addWeeks(weekStart, 1))}
        aria-label="Next week"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {!isCurrentWeek && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="text-xs"
        >
          Today
        </Button>
      )}
    </div>
  )
}
