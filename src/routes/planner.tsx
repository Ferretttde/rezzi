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

function PlannerPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [addingDate, setAddingDate] = useState<Date | null>(null)
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

  const getPlansForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return plans?.filter((p) => p.planned_date === dateStr) ?? []
  }

  const handleAdd = (date: Date) => {
    setAddingDate(date)
    setRecipeSearch('')
  }

  const handlePickRecipe = async (recipeId: string) => {
    if (!addingDate) return
    await addPlan.mutateAsync({
      recipe_id: recipeId,
      planned_date: format(addingDate, 'yyyy-MM-dd'),
      meal_type: 'dinner',
    })
    setAddingDate(null)
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

    const overId = over.id as string

    // Check if dropped on a day droppable (YYYY-MM-DD)
    const dateMatch = overId.match(/^(\d{4}-\d{2}-\d{2})$/)
    if (dateMatch) {
      await updatePlan.mutateAsync({
        id: draggedPlan.id,
        planned_date: dateMatch[1],
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
        <div className="flex flex-col gap-1 px-4 pb-4">
          {weekDays.map((date) => (
            <DayColumn
              key={date.toISOString()}
              date={date}
              plans={getPlansForDay(date)}
              onAdd={(d) => handleAdd(d)}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
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
      <BottomSheet open={!!addingDate} onOpenChange={(open) => !open && setAddingDate(null)}>
        <BottomSheetContent>
          <p className="font-semibold mb-4">
            {addingDate ? format(addingDate, 'EEEE, d. MMMM', { locale: de }) : ''}
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
