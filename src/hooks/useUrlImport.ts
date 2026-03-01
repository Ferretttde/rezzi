import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ImportedRecipe } from '@/types/app'

interface ImportState {
  loading: boolean
  error: string | null
  recipe: ImportedRecipe | null
}

export function useUrlImport() {
  const [state, setState] = useState<ImportState>({
    loading: false,
    error: null,
    recipe: null,
  })

  const importFromUrl = async (url: string) => {
    setState({ loading: true, error: null, recipe: null })

    try {
      const { data, error } = await supabase.functions.invoke<ImportedRecipe>('import-recipe', {
        body: { url },
      })

      if (error) {
        // FunctionsHttpError has a context Response — read the actual body
        if ('context' in error && error.context instanceof Response) {
          try {
            const body = await (error.context as Response).json() as { error?: string }
            throw new Error(body.error ?? error.message)
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== error.message) throw parseErr
          }
        }
        throw error
      }
      if (!data) throw new Error('No data returned from import')

      setState({ loading: false, error: null, recipe: data })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import recipe'
      setState({ loading: false, error: message, recipe: null })
      return null
    }
  }

  const reset = () => setState({ loading: false, error: null, recipe: null })

  return { ...state, importFromUrl, reset }
}
