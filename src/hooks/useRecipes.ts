import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Recipe, Ingredient, RecipeStep } from '@/types/app'
import type { Json } from '@/types/database'

// --- Query keys ---
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters: object) => [...recipeKeys.lists(), filters] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
}

// --- Fetch helpers ---
async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      tags:recipe_tags(tag:tags(*))
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((r) => ({
    ...r,
    ingredients: (r.ingredients as unknown as Ingredient[]) ?? [],
    steps: (r.steps as unknown as RecipeStep[]) ?? [],
    tags: (r.tags?.map((rt: { tag: unknown }) => rt.tag).filter(Boolean) ?? []) as import('@/types/app').Tag[],
  }))
}

async function fetchRecipe(id: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      tags:recipe_tags(tag:tags(*))
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    ...data,
    ingredients: (data.ingredients as unknown as Ingredient[]) ?? [],
    steps: (data.steps as unknown as RecipeStep[]) ?? [],
    tags: (data.tags?.map((rt: { tag: unknown }) => rt.tag).filter(Boolean) ?? []) as import('@/types/app').Tag[],
  }
}

// --- Hooks ---
export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: fetchRecipes,
  })
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipe(id),
    enabled: !!id,
  })
}

interface UpsertRecipeInput {
  id?: string
  title: string
  description?: string | null
  image_url?: string | null
  source_url?: string | null
  prep_time_mins?: number | null
  cook_time_mins?: number | null
  servings?: number | null
  ingredients: Ingredient[]
  steps: RecipeStep[]
  is_favorite?: boolean
  tagIds?: string[]
}

export function useUpsertRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpsertRecipeInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!profile?.household_id) throw new Error('No household found')

      const recipeData = {
        title: input.title,
        description: input.description ?? null,
        image_url: input.image_url ?? null,
        source_url: input.source_url ?? null,
        prep_time_mins: input.prep_time_mins ?? null,
        cook_time_mins: input.cook_time_mins ?? null,
        servings: input.servings ?? null,
        ingredients: input.ingredients as unknown as Json,
        steps: input.steps as unknown as Json,
        is_favorite: input.is_favorite ?? false,
        household_id: profile.household_id,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }

      let recipeId: string

      if (input.id) {
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', input.id)
        if (error) throw error
        recipeId = input.id
      } else {
        const { data, error } = await supabase
          .from('recipes')
          .insert(recipeData)
          .select('id')
          .single()
        if (error) throw error
        recipeId = data.id
      }

      // Sync tags
      if (input.tagIds !== undefined) {
        await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId)
        if (input.tagIds.length > 0) {
          await supabase.from('recipe_tags').insert(
            input.tagIds.map((tagId) => ({ recipe_id: recipeId, tag_id: tagId }))
          )
        }
      }

      return recipeId
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: recipeKeys.all })
      const prev = queryClient.getQueryData<Recipe[]>(recipeKeys.lists())
      queryClient.setQueryData<Recipe[]>(recipeKeys.lists(), (old) =>
        old?.map((r) => (r.id === id ? { ...r, is_favorite: isFavorite } : r))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(recipeKeys.lists(), ctx.prev)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
    },
  })
}
