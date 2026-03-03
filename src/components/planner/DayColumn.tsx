import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlannerRecipeCard } from './PlannerRecipeCard'
import type { MealPlan } from '@/types/app'

interface DayColumnProps {
  date: Date
  plans: MealPlan[]
  onAdd: (date: Date) => void
  onDelete: (id: string) => void
}

export function DayColumn({ date, plans, onAdd, onDelete }: DayColumnProps) {
  const droppableId = format(date, 'yyyy-MM-dd')
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  const today = isToday(date)

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-2xl p-3',
      today ? 'bg-primary/5' : 'bg-white border border-border/40',
    )}>
      {/* Day header */}
      <div className="w-9 shrink-0 flex flex-col items-center">
        <p className={cn(
          'text-[10px] font-semibold uppercase tracking-wider leading-none',
          today ? 'text-primary' : 'text-muted-foreground'
        )}>
          {format(date, 'EEE', { locale: de })}
        </p>
        <div
          className={cn(
            'mt-1 h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold',
            today ? 'bg-primary text-white' : 'text-foreground'
          )}
        >
          {format(date, 'd')}
        </div>
      </div>

      {/* Single drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[44px] rounded-xl transition-colors',
          isOver && 'bg-primary/10',
        )}
      >
        <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {plans.map((plan) => (
              <PlannerRecipeCard key={plan.id} plan={plan} onDelete={onDelete} />
            ))}
          </div>
        </SortableContext>

        <button
          onClick={() => onAdd(date)}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50 hover:text-primary/70 transition-colors py-2',
            plans.length > 0 && 'mt-1'
          )}
          aria-label="Gericht hinzufügen"
        >
          <Plus className="h-3.5 w-3.5" />
          {plans.length === 0 && <span>Gericht hinzufügen</span>}
        </button>
      </div>
    </div>
  )
}
