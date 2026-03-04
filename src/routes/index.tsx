import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { TagFilter } from '@/components/tags/TagFilter'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from '@/components/ui/dialog'
import { useRecipes } from '@/hooks/useRecipes'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

function RecipeListPage() {
  const navigate = useNavigate()
  const { data: recipes, isLoading } = useRecipes()
  const { searchQuery, setSearchQuery, selectedTagIds, clearFilters } = useUIStore()
  const [fabOpen, setFabOpen] = useState(false)

  const filtered = recipes?.filter((recipe) => {
    const matchesSearch = recipe.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesTags =
      selectedTagIds.length === 0 ||
      selectedTagIds.every((tagId) =>
        recipe.tags?.some((t) => t.id === tagId)
      )
    return matchesSearch && matchesTags
  })

  const hasFilters = searchQuery || selectedTagIds.length > 0

  return (
    <div className="min-h-dvh">
      <PageHeader
        title="Rezzi"
        subtitle={recipes ? `${recipes.length} Rezepte` : undefined}
      />

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rezepte suchen..."
            className="pl-10 pr-10 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      <TagFilter />

      {/* Clear filters */}
      {hasFilters && (
        <div className="px-4 mb-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered?.length ?? 0} {(filtered?.length ?? 0) === 1 ? 'Ergebnis' : 'Ergebnisse'}
          </span>
          <button
            onClick={clearFilters}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Zurücksetzen
          </button>
        </div>
      )}

      {/* Recipe grid */}
      <div className="px-4 mt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="font-semibold text-lg">
              {hasFilters ? 'Keine passenden Rezepte' : 'Noch keine Rezepte'}
            </h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              {hasFilters
                ? 'Suche oder Filter anpassen'
                : 'Tippe auf + um dein erstes Rezept hinzuzufügen'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered?.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <BottomSheet open={fabOpen} onOpenChange={setFabOpen}>
        <BottomSheetTrigger asChild>
          <button
            className={cn(
              'fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-transform active:scale-90 z-30',
              fabOpen && 'scale-90'
            )}
            aria-label="Rezept hinzufügen"
          >
            <Plus className={cn('h-6 w-6 transition-transform', fabOpen && 'rotate-45')} />
          </button>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <h3 className="text-lg font-semibold mb-4">Rezept hinzufügen</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                setFabOpen(false)
                void navigate({ to: '/recipes/new' })
              }}
              className="w-full flex items-center gap-4 rounded-2xl bg-muted p-4 text-left active:bg-muted/70"
            >
              <span className="text-3xl">✏️</span>
              <div>
                <p className="font-semibold">Manuell eingeben</p>
                <p className="text-sm text-muted-foreground">Rezeptformular ausfüllen</p>
              </div>
            </button>
            <button
              onClick={() => {
                setFabOpen(false)
                void navigate({ to: '/recipes/new', search: { mode: 'photo' } })
              }}
              className="w-full flex items-center gap-4 rounded-2xl bg-muted p-4 text-left active:bg-muted/70"
            >
              <span className="text-3xl">📷</span>
              <div>
                <p className="font-semibold">Foto importieren</p>
                <p className="text-sm text-muted-foreground">Kochbuch, Rezeptkarte oder Screenshot</p>
              </div>
            </button>
            <button
              onClick={() => {
                setFabOpen(false)
                void navigate({ to: '/recipes/new', search: { mode: 'url' } })
              }}
              className="w-full flex items-center gap-4 rounded-2xl bg-muted p-4 text-left active:bg-muted/70"
            >
              <span className="text-3xl">🔗</span>
              <div>
                <p className="font-semibold">Von URL importieren</p>
                <p className="text-sm text-muted-foreground">Link von einer beliebigen Rezeptseite einfügen</p>
              </div>
            </button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: RecipeListPage,
})
