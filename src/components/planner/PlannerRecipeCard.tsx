import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import type { MealPlan } from '@/types/app'

interface PlannerRecipeCardProps {
  plan: MealPlan
  onDelete: (id: string) => void
}

export function PlannerRecipeCard({ plan, onDelete }: PlannerRecipeCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: plan.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const title = plan.recipe?.title ?? plan.custom_title ?? 'Ohne Titel'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1.5 rounded-lg bg-white border border-border/50 px-2 py-1.5 shadow-sm',
        isDragging && 'opacity-50 shadow-lg scale-105 z-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground p-0.5 shrink-0 touch-none"
        aria-label="Zum Neuanordnen ziehen"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {plan.recipe?.image_url && (
        <img
          src={plan.recipe.image_url}
          alt={title}
          className="h-7 w-7 rounded-md object-cover shrink-0"
        />
      )}

      {plan.recipe?.id ? (
        <Link
          to="/recipes/$recipeId"
          params={{ recipeId: plan.recipe.id }}
          className="flex-1 text-xs font-medium line-clamp-1 leading-tight hover:underline"
        >
          {title}
        </Link>
      ) : (
        <span className="flex-1 text-xs font-medium line-clamp-1 leading-tight">{title}</span>
      )}

      <button
        onClick={() => onDelete(plan.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive shrink-0"
        aria-label="Aus dem Wochenplan entfernen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
