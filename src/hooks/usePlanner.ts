import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MealPlan, MealType, Ingredient, RecipeStep } from '@/types/app'
import { format } from 'date-fns'

export const plannerKeys = {
  all: ['meal_plans'] as const,
  week: (startDate: string) => [...plannerKeys.all, 'week', startDate] as const,
}

async function fetchWeekPlans(startDate: string, endDate: string): Promise<MealPlan[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(`
      *,
      recipe:recipes(
        id, title, image_url, prep_time_mins, cook_time_mins, servings,
        ingredients, steps, is_favorite, description
      )
    `)
    .gte('planned_date', startDate)
    .lte('planned_date', endDate)
    .order('sort_order')

  if (error) throw error

  return (data ?? []).map((p) => ({
    ...p,
    recipe: p.recipe
      ? {
          ...p.recipe,
          household_id: '',
          created_by: '',
          source_url: null,
          image_url: p.recipe.image_url ?? null,
          description: p.recipe.description ?? null,
          created_at: '',
          updated_at: '',
          ingredients: (p.recipe.ingredients as unknown as Ingredient[]) ?? [],
          steps: (p.recipe.steps as unknown as RecipeStep[]) ?? [],
        }
      : null,
  }))
}

export function useWeekPlans(weekStart: Date) {
  const startDate = format(weekStart, 'yyyy-MM-dd')
  const endDate = format(
    new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    'yyyy-MM-dd'
  )

  return useQuery({
    queryKey: plannerKeys.week(startDate),
    queryFn: () => fetchWeekPlans(startDate, endDate),
  })
}

export function useAddMealPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      recipe_id?: string | null
      custom_title?: string | null
      planned_date: string
      meal_type: MealType
      servings?: number | null
      notes?: string | null
      sort_order?: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!profile?.household_id) throw new Error('No household found')

      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          ...input,
          household_id: profile.household_id,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}

export function useUpdateMealPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      recipe_id?: string | null
      custom_title?: string | null
      planned_date?: string
      meal_type?: MealType
      servings?: number | null
      notes?: string | null
      sort_order?: number
    }) => {
      const { id, ...updates } = input
      const { error } = await supabase
        .from('meal_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meal_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: plannerKeys.all })
    },
  })
}
