import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import { startOfWeek, addDays, format } from 'date-fns'
import { de } from 'date-fns/locale'
import { PageHeader } from '@/components/layout/PageHeader'
import { WeekNavigator } from '@/components/planner/WeekNavigator'
import { DayColumn } from '@/components/planner/DayColumn'
import { PlannerRecipeCard } from '@/components/planner/PlannerRecipeCard'
import { BottomSheet, BottomSheetContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useWeekPlans, useAddMealPlan, useUpdateMealPlan, useDeleteMealPlan } from '@/hooks/usePlanner'
import { useRecipes } from '@/hooks/useRecipes'
import { toast } from '@/components/ui/use-toast'
import type { MealType } from '@/types/app'

const MEAL_TYPE_DE: Record<MealType, string> = {
  breakfast: 'Frühstück',
  lunch: 'Mittagessen',
  dinner: 'Abendessen',
  snack: 'Snack',
}

function PlannerPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [addingSlot, setAddingSlot] = useState<{ date: Date; mealType: MealType } | null>(null)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: plans } = useWeekPlans(weekStart)
  const { data: allRecipes } = useRecipes()
  const addPlan = useAddMealPlan()
  const updatePlan = useUpdateMealPlan()
  const deletePlan = useDeleteMealPlan()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getPlansForDay = (date: Date, mealType?: MealType) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return plans?.filter(
      (p) => p.planned_date === dateStr && (!mealType || p.meal_type === mealType)
    ) ?? []
  }

  const handleAdd = (date: Date, mealType: MealType) => {
    setAddingSlot({ date, mealType })
    setRecipeSearch('')
  }

  const handlePickRecipe = async (recipeId: string) => {
    if (!addingSlot) return
    await addPlan.mutateAsync({
      recipe_id: recipeId,
      planned_date: format(addingSlot.date, 'yyyy-MM-dd'),
      meal_type: addingSlot.mealType,
    })
    setAddingSlot(null)
    toast({ title: 'Zum Wochenplan hinzugefügt!' })
  }

  const handleDelete = async (id: string) => {
    await deletePlan.mutateAsync(id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const draggedPlan = plans?.find((p) => p.id === active.id)
    if (!draggedPlan) return

    // over.id could be a droppable slot "YYYY-MM-DD-mealtype" or a plan id
    const overId = over.id as string

    // Check if dropped on a droppable slot
    const slotMatch = overId.match(/^(\d{4}-\d{2}-\d{2})-(breakfast|lunch|dinner|snack)$/)
    if (slotMatch) {
      const [, newDate, newMealType] = slotMatch
      await updatePlan.mutateAsync({
        id: draggedPlan.id,
        planned_date: newDate,
        meal_type: newMealType as MealType,
      })
    }
  }

  const activePlan = plans?.find((p) => p.id === activeId)

  const filteredRecipes = allRecipes?.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  return (
    <div className="min-h-dvh">
      <PageHeader title="Wochenplan" />

      <WeekNavigator weekStart={weekStart} onWeekChange={setWeekStart} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        {/* Week grid — horizontal scroll */}
        <div className="overflow-x-auto px-4">
          <div className="flex gap-2 min-w-max pb-4">
            {weekDays.map((date) => (
              <DayColumn
                key={date.toISOString()}
                date={date}
                plans={getPlansForDay(date)}
                onAdd={handleAdd}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activePlan && (
            <div className="opacity-80 rotate-2">
              <PlannerRecipeCard
                plan={activePlan}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Recipe picker bottom sheet */}
      <BottomSheet open={!!addingSlot} onOpenChange={(open) => !open && setAddingSlot(null)}>
        <BottomSheetContent>
          <h3 className="font-semibold mb-1">
            {addingSlot ? MEAL_TYPE_DE[addingSlot.mealType] : ''}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {addingSlot ? format(addingSlot.date, 'EEEE, d. MMMM', { locale: de }) : ''}
          </p>

          <Input
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            placeholder="Rezepte suchen..."
            className="mb-4"
            autoFocus
          />

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filteredRecipes?.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => void handlePickRecipe(recipe.id)}
                className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-muted active:bg-muted/70 transition-colors text-left"
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">
                    🍽️
                  </div>
                )}
                <span className="font-medium text-sm">{recipe.title}</span>
              </button>
            ))}
            {filteredRecipes?.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">Keine Rezepte gefunden</p>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  )
}

export const Route = createFileRoute('/planner')({
  component: PlannerPage,
})
