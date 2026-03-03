import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImagePickerProps {
  value: string | null | undefined
  onChange: (url: string | null) => void
  error?: string
}

export function ImagePicker({ value, onChange, error }: ImagePickerProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState(value ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploading, error: uploadError, upload } = useImageUpload()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected if needed
    e.target.value = ''
    const url = await upload(file)
    if (url) onChange(url)
  }

  const handleUrlConfirm = () => {
    const trimmed = urlInput.trim()
    onChange(trimmed || null)
    setMode('upload')
  }

  const displayError = uploadError ?? error

  if (mode === 'url') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlConfirm())}
            autoFocus
          />
          <Button type="button" onClick={handleUrlConfirm} size="sm">
            OK
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          Foto hochladen
        </button>
        {displayError && <p className="text-xs text-destructive">{displayError}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Tap area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border',
          'bg-muted/30 overflow-hidden transition-colors',
          'hover:border-primary/60 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          uploading && 'cursor-wait'
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Rezeptbild"
              className="h-full w-full object-cover"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
            <Camera className="h-8 w-8" />
            <span className="text-sm font-medium">Foto aufnehmen oder auswählen</span>
            <span className="text-xs">JPG, PNG, WebP – max. 5 MB</span>
          </div>
        )}

        {/* Upload spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Action row */}
      <div className="flex items-center justify-between">
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Entfernen
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => {
            setUrlInput(value ?? '')
            setMode('url')
          }}
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          URL eingeben
        </button>
      </div>

      {displayError && <p className="text-xs text-destructive">{displayError}</p>}
    </div>
  )
}
