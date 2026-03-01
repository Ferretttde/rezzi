import { useState } from 'react'
import { scaleIngredientAmount } from '@/lib/utils'
import type { Ingredient } from '@/types/app'
import { cn } from '@/lib/utils'

interface IngredientListProps {
  ingredients: Ingredient[]
  servings: number
  scaledServings: number
}

export function IngredientList({ ingredients, servings, scaledServings }: IngredientListProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const factor = servings > 0 ? scaledServings / servings : 1

  const toggleItem = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Group ingredients
  const groups = ingredients.reduce<Record<string, { ingredient: Ingredient; index: number }[]>>(
    (acc, ingredient, index) => {
      const group = ingredient.group ?? ''
      if (!acc[group]) acc[group] = []
      acc[group].push({ ingredient, index })
      return acc
    },
    {}
  )

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          {group && (
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-4">
              {group}
            </h4>
          )}
          <div className="space-y-1">
            {items.map(({ ingredient, index }) => {
              const isChecked = checked.has(index)
              const scaledAmount =
                ingredient.amount && factor !== 1
                  ? scaleIngredientAmount(ingredient.amount, factor)
                  : ingredient.amount

              return (
                <button
                  key={index}
                  onClick={() => toggleItem(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-colors active:bg-muted/50',
                    isChecked && 'opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center',
                      isChecked ? 'bg-primary border-primary' : 'border-border'
                    )}
                  >
                    {isChecked && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className={cn('flex-1 text-sm', isChecked && 'line-through')}>
                    <span className="font-medium">
                      {scaledAmount} {ingredient.unit}
                    </span>{' '}
                    {ingredient.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
