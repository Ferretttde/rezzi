import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tag } from '@/types/app'

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
}

async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*, recipe_count:recipe_tags(count)')
    .order('name')

  if (error) throw error

  return (data ?? []).map((t) => ({
    ...t,
    recipe_count: (t.recipe_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export function useTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: fetchTags,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()

      if (!profile?.household_id) throw new Error('No household found')

      const { data, error } = await supabase
        .from('tags')
        .insert({ ...input, household_id: profile.household_id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; name: string; color: string }) => {
      const { error } = await supabase
        .from('tags')
        .update({ name: input.name, color: input.color })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}
