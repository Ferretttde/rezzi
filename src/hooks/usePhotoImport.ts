import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ImportedRecipe } from '@/types/app'

interface ImportState {
  loading: boolean
  error: string | null
  recipe: ImportedRecipe | null
}

function resizeImage(file: File, maxPx = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight))
      const width = Math.round(img.naturalWidth * scale)
      const height = Math.round(img.naturalHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Bild konnte nicht geladen werden'))
    }

    img.src = objectUrl
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]
      if (base64) resolve(base64)
      else reject(new Error('Base64-Konvertierung fehlgeschlagen'))
    }
    reader.onerror = () => reject(new Error('FileReader-Fehler'))
    reader.readAsDataURL(blob)
  })
}

export function usePhotoImport() {
  const [state, setState] = useState<ImportState>({
    loading: false,
    error: null,
    recipe: null,
  })

  const importFromPhoto = async (file: File) => {
    setState({ loading: true, error: null, recipe: null })

    try {
      const blob = await resizeImage(file, 1200)
      const imageBase64 = await blobToBase64(blob)

      const { data, error } = await supabase.functions.invoke<ImportedRecipe>('import-recipe-image', {
        body: { imageBase64, mediaType: 'image/jpeg' },
      })

      if (error) {
        // Try to read the actual error message from the response body
        const ctx = (error as Record<string, unknown>).context
        if (ctx instanceof Response) {
          try {
            const text = await ctx.text()
            const parsed = JSON.parse(text) as { error?: string }
            if (parsed.error) throw new Error(parsed.error)
          } catch (inner) {
            if (inner instanceof SyntaxError === false) throw inner
          }
        }
        throw error
      }
      if (!data) throw new Error('Keine Daten vom Import zurückgegeben')

      setState({ loading: false, error: null, recipe: data })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Foto-Import fehlgeschlagen'
      setState({ loading: false, error: message, recipe: null })
      return null
    }
  }

  const reset = () => setState({ loading: false, error: null, recipe: null })

  return { ...state, importFromPhoto, reset }
}
