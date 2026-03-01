import { useState } from 'react'
import { Link2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUrlImport } from '@/hooks/useUrlImport'
import type { ImportedRecipe } from '@/types/app'

interface UrlImportFormProps {
  onImport: (recipe: ImportedRecipe) => void
}

export function UrlImportForm({ onImport }: UrlImportFormProps) {
  const [url, setUrl] = useState('')
  const { loading, error, importFromUrl } = useUrlImport()

  const handleImport = async () => {
    if (!url.trim()) return
    const recipe = await importFromUrl(url.trim())
    if (recipe) onImport(recipe)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://allrecipes.com/recipe/..."
              type="url"
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && void handleImport()}
            />
          </div>
          <Button onClick={() => void handleImport()} disabled={loading || !url.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not import recipe</p>
              <p className="text-xs opacity-80 mt-0.5">{error}</p>
              <p className="text-xs opacity-80 mt-1">You can still fill in the form manually.</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Works with AllRecipes, BBC Good Food, Serious Eats, and more
      </p>
    </div>
  )
}
