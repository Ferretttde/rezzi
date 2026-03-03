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
    <div className="w-[140px] flex flex-col gap-1">
      {/* Day header */}
      <div className="text-center py-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {format(date, 'EEE', { locale: de })}
        </p>
        <div
          className={cn(
            'mx-auto mt-0.5 h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold',
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
          'flex-1 min-h-[80px] rounded-xl border border-dashed border-border/50 p-1.5 transition-colors',
          isOver && 'border-primary/50 bg-primary/5',
          plans.length > 0 && 'border-solid border-border/30'
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
            'w-full flex items-center justify-center text-muted-foreground/50 hover:text-primary/70 transition-colors py-2',
            plans.length > 0 && 'mt-1'
          )}
          aria-label="Gericht hinzufügen"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
