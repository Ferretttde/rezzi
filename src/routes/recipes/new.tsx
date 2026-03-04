import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import { UrlImportForm } from '@/components/recipes/UrlImportForm'
import { PhotoImportForm } from '@/components/recipes/PhotoImportForm'
import type { ImportedRecipe } from '@/types/app'

const searchSchema = z.object({
  mode: z.enum(['manual', 'url', 'photo']).optional().default('manual'),
})

const headerTitles: Record<string, string> = {
  url: 'Rezept importieren',
  photo: 'Foto importieren',
  manual: 'Neues Rezept',
}

function NewRecipePage() {
  const navigate = useNavigate()
  const { mode } = Route.useSearch()
  const [importedData, setImportedData] = useState<ImportedRecipe | null>(null)

  const handleImport = (recipe: ImportedRecipe) => {
    setImportedData(recipe)
  }

  const isImportMode = (mode === 'url' || mode === 'photo') && !importedData

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-1 -ml-1 text-muted-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold flex-1">
            {headerTitles[mode] ?? 'Neues Rezept'}
          </h1>
          {mode === 'manual' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'photo' } })}
                className="text-sm text-primary font-medium"
              >
                Foto
              </button>
              <button
                onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'url' } })}
                className="text-sm text-primary font-medium"
              >
                URL
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="pt-4">
        {isImportMode ? (
          <div className="px-4 space-y-6">
            {mode === 'url' ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-1">Von URL importieren</h2>
                  <p className="text-sm text-muted-foreground">
                    Füge einen Link von AllRecipes, BBC Good Food, Serious Eats oder einer anderen Rezeptseite ein.
                  </p>
                </div>
                <UrlImportForm onImport={handleImport} />
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold mb-1">Aus Foto importieren</h2>
                  <p className="text-sm text-muted-foreground">
                    Fotografiere eine Rezeptkarte, ein Kochbuch oder einen Screenshot.
                  </p>
                </div>
                <PhotoImportForm onImport={handleImport} />
              </>
            )}
            <div className="text-center">
              <button
                onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'manual' } })}
                className="text-sm text-primary font-medium"
              >
                Stattdessen manuell eingeben
              </button>
            </div>
          </div>
        ) : (
          <RecipeForm initialData={importedData ?? undefined} mode="create" />
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/recipes/new')({
  validateSearch: searchSchema,
  component: NewRecipePage,
})
