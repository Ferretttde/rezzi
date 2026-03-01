import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { ChevronLeft } from 'lucide-react'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import { UrlImportForm } from '@/components/recipes/UrlImportForm'
import type { ImportedRecipe } from '@/types/app'

const searchSchema = z.object({
  mode: z.enum(['manual', 'url']).optional().default('manual'),
})

function NewRecipePage() {
  const navigate = useNavigate()
  const { mode } = Route.useSearch()
  const [importedData, setImportedData] = useState<ImportedRecipe | null>(null)

  const handleImport = (recipe: ImportedRecipe) => {
    setImportedData(recipe)
  }

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-1 -ml-1 text-muted-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold flex-1">
            {mode === 'url' ? 'Import Recipe' : 'New Recipe'}
          </h1>
          {mode === 'manual' && (
            <button
              onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'url' } })}
              className="text-sm text-primary font-medium"
            >
              Import URL
            </button>
          )}
        </div>
      </header>

      <div className="pt-4">
        {mode === 'url' && !importedData ? (
          <div className="px-4 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Import from URL</h2>
              <p className="text-sm text-muted-foreground">
                Paste a link from AllRecipes, BBC Good Food, Serious Eats, or any recipe site.
              </p>
            </div>
            <UrlImportForm onImport={handleImport} />
            <div className="text-center">
              <button
                onClick={() => void navigate({ to: '/recipes/new', search: { mode: 'manual' } })}
                className="text-sm text-primary font-medium"
              >
                Fill in manually instead
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
