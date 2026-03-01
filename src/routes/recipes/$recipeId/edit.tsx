import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { RecipeForm } from '@/components/recipes/RecipeForm'
import { useRecipe } from '@/hooks/useRecipes'
import { Skeleton } from '@/components/ui/skeleton'

function EditRecipePage() {
  const { recipeId } = Route.useParams()
  const { data: recipe, isLoading } = useRecipe(recipeId)

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link
            to="/recipes/$recipeId"
            params={{ recipeId }}
            className="p-1 -ml-1 text-muted-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold flex-1">Edit Recipe</h1>
        </div>
      </header>

      <div className="pt-4">
        {isLoading ? (
          <div className="px-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : recipe ? (
          <RecipeForm initialData={recipe} mode="edit" />
        ) : (
          <p className="text-center text-muted-foreground py-8">Recipe not found</p>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/recipes/$recipeId/edit')({
  component: EditRecipePage,
})
