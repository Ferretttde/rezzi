import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecipes } from '@/hooks/useRecipes'

function FavoritesPage() {
  const { data: recipes, isLoading } = useRecipes()
  const favorites = recipes?.filter((r) => r.is_favorite)

  return (
    <div className="min-h-dvh">
      <PageHeader title="Favoriten" subtitle={favorites ? `${favorites.length} gespeichert` : undefined} />

      <div className="px-4 mt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : favorites?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="font-semibold text-lg">Noch keine Favoriten</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Tippe auf das Herz bei einem Rezept, um es hier zu speichern
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites?.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/favorites')({
  component: FavoritesPage,
})
