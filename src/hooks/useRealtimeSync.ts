import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { recipeKeys } from './useRecipes'
import { plannerKeys } from './usePlanner'

export function useRealtimeSync() {
  useEffect(() => {
    const channel = supabase
      .channel('rezzi-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipes' },
        () => {
          void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_plans' },
        () => {
          void queryClient.invalidateQueries({ queryKey: plannerKeys.all })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recipe_tags' },
        () => {
          void queryClient.invalidateQueries({ queryKey: recipeKeys.all })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])
}
