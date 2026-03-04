import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { ChevronLeft, PenLine, Link2, Camera } from 'lucide-react'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import { UrlImportForm } from '@/components/recipes/UrlImportForm'
import { PhotoImportForm } from '@/components/recipes/PhotoImportForm'
import type { ImportedRecipe } from '@/types/app'

const searchSchema = z.object({
  mode: z.enum(['manual', 'url', 'photo']).optional().default('manual'),
})

function NewRecipePage() {
  const navigate = useNavigate()
  const { mode } = Route.useSearch()
  const [importedData, setImportedData] = useState<ImportedRecipe | null>(null)

  const handleImport = (recipe: ImportedRecipe) => {
    setImportedData(recipe)
  }

  const showModeSelector = mode === 'manual' && !importedData
  const isImportMode = (mode === 'url' || mode === 'photo') && !importedData

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-1 -ml-1 text-muted-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Neues Rezept</h1>
        </div>
      </header>

      <div className="pt-4">
        {showModeSelector ? (
          <div className="px-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">Wie möchtest du das Rezept hinzufügen?</p>

            <button
              onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'photo' } })}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-white active:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Foto importieren</p>
                <p className="text-sm text-muted-foreground">Kochbuch, Rezeptkarte oder Screenshot</p>
              </div>
            </button>

            <button
              onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'url' } })}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-white active:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">URL importieren</p>
                <p className="text-sm text-muted-foreground">Link von einer Rezeptwebseite</p>
              </div>
            </button>

            <button
              onClick={() => setImportedData({} as ImportedRecipe)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-white active:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Manuell eingeben</p>
                <p className="text-sm text-muted-foreground">Formular selbst ausfüllen</p>
              </div>
            </button>
          </div>
        ) : isImportMode ? (
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
          <RecipeForm
            initialData={importedData && Object.keys(importedData).length > 0 ? importedData : undefined}
            mode="create"
          />
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/recipes/new')({
  validateSearch: searchSchema,
  component: NewRecipePage,
})
