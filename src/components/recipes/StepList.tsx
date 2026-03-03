import { useState } from 'react'
import type { RecipeStep } from '@/types/app'
import { cn } from '@/lib/utils'

interface StepListProps {
  steps: RecipeStep[]
}

export function StepList({ steps }: StepListProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  if (!steps.length) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Noch keine Schritte hinzugefügt.</p>
  }

  return (
    <div className="space-y-3 px-4">
      {steps.map((step, index) => {
        const isActive = activeStep === index
        return (
          <button
            key={step.order}
            onClick={() => setActiveStep(isActive ? null : index)}
            className={cn(
              'w-full text-left flex gap-4 rounded-2xl p-4 transition-all border',
              isActive
                ? 'bg-primary/5 border-primary/20'
                : 'bg-white border-border/50'
            )}
          >
            <div
              className={cn(
                'shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm leading-relaxed', isActive && 'font-medium')}>
                {step.instruction}
              </p>
              {step.image_url && (
                <img
                  src={step.image_url}
                  alt={`Step ${index + 1}`}
                  className="mt-3 rounded-xl w-full object-cover max-h-48"
                  loading="lazy"
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
