import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UploadState {
  uploading: boolean
  error: string | null
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
      reject(new Error('Image load failed'))
    }

    img.src = objectUrl
  })
}

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({ uploading: false, error: null })

  const upload = async (file: File): Promise<string | null> => {
    setState({ uploading: true, error: null })

    try {
      const blob = await resizeImage(file, 1200)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Nicht eingeloggt')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()
      if (profileError || !profile) throw new Error('Profil nicht gefunden')

      const path = `${profile.household_id}/${crypto.randomUUID()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(path)
      setState({ uploading: false, error: null })
      return urlData.publicUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen'
      setState({ uploading: false, error: message })
      return null
    }
  }

  return { ...state, upload }
}
