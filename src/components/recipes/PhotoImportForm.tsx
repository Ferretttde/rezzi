import { useRef, useState } from 'react'
import { Camera, Loader2, AlertCircle, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePhotoImport } from '@/hooks/usePhotoImport'
import type { ImportedRecipe } from '@/types/app'

interface PhotoImportFormProps {
  onImport: (recipe: ImportedRecipe) => void
}

export function PhotoImportForm({ onImport }: PhotoImportFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { loading, error, importFromPhoto } = usePhotoImport()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const handleExtract = async () => {
    if (!selectedFile) return
    const recipe = await importFromPhoto(selectedFile)
    if (recipe) onImport(recipe)
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-3 text-muted-foreground active:bg-muted/50 transition-colors"
        >
          <Camera className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium text-foreground">Foto aufnehmen oder auswählen</p>
            <p className="text-sm mt-0.5">Kamera oder Galerie</p>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3]">
            <img src={preview} alt="Rezept-Vorschau" className="w-full h-full object-cover" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/60 text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Anderes Foto
            </button>
          </div>

          <Button
            onClick={() => void handleExtract()}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Rezept wird extrahiert…
              </>
            ) : (
              'Rezept extrahieren'
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Rezept konnte nicht extrahiert werden</p>
            <p className="text-xs opacity-80 mt-0.5">{error}</p>
            <p className="text-xs opacity-80 mt-1">Du kannst das Formular auch manuell ausfüllen.</p>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Funktioniert mit Kochbüchern, Rezeptkarten und Screenshots
      </p>
    </div>
  )
}
