import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday } from 'date-fns'
import { de } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlannerRecipeCard } from './PlannerRecipeCard'
import type { MealPlan, MealType } from '@/types/app'

const MEAL_TYPES: { key: MealType; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Frühstück', emoji: '🌅' },
  { key: 'lunch', label: 'Mittagessen', emoji: '☀️' },
  { key: 'dinner', label: 'Abendessen', emoji: '🌙' },
  { key: 'snack', label: 'Snack', emoji: '🍎' },
]

interface MealSlotProps {
  date: Date
  mealType: MealType
  plans: MealPlan[]
  onAdd: (date: Date, mealType: MealType) => void
  onDelete: (id: string) => void
}

function MealSlot({ date, mealType, plans, onAdd, onDelete }: MealSlotProps) {
  const droppableId = `${format(date, 'yyyy-MM-dd')}-${mealType}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[60px] rounded-lg border border-dashed border-border/50 p-1.5 transition-colors',
        isOver && 'border-primary/50 bg-primary/5',
        plans.length > 0 && 'border-solid border-border/30'
      )}
    >
      <SortableContext
        items={plans.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {plans.map((plan) => (
            <PlannerRecipeCard key={plan.id} plan={plan} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => onAdd(date, mealType)}
        className={cn(
          'w-full flex items-center justify-center text-muted-foreground/50 hover:text-primary/70 transition-colors py-1.5',
          plans.length > 0 && 'mt-1'
        )}
        aria-label={`${MEAL_TYPES.find((m) => m.key === mealType)?.label ?? mealType} hinzufügen`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface DayColumnProps {
  date: Date
  plans: MealPlan[]
  onAdd: (date: Date, mealType: MealType) => void
  onDelete: (id: string) => void
}

export function DayColumn({ date, plans, onAdd, onDelete }: DayColumnProps) {
  const today = isToday(date)

  return (
    <div className="min-w-[120px] flex-1">
      {/* Day header */}
      <div className={cn('text-center py-2 mb-2')}>
        <p className={cn('text-[10px] font-medium uppercase tracking-wider text-muted-foreground')}>
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

      {/* Meal slots */}
      <div className="space-y-1">
        {MEAL_TYPES.map(({ key, emoji }) => (
          <div key={key}>
            <p className="text-[9px] font-medium text-muted-foreground/70 px-1 mb-0.5">
              {emoji}
            </p>
            <MealSlot
              date={date}
              mealType={key}
              plans={plans.filter((p) => p.meal_type === key)}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
