import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronLeft, Heart, MoreVertical, Clock, Users,
  Edit, Trash2, ExternalLink,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheet, BottomSheetContent, BottomSheetTrigger, BottomSheetClose } from '@/components/ui/dialog'
import { IngredientList } from '@/components/recipes/IngredientList'
import { StepList } from '@/components/recipes/StepList'
import { useRecipe, useDeleteRecipe, useToggleFavorite } from '@/hooks/useRecipes'
import { toast } from '@/components/ui/use-toast'
import { formatTime, cn } from '@/lib/utils'

function RecipeDetailPage() {
  const { recipeId } = Route.useParams()
  const navigate = useNavigate()
  const { data: recipe, isLoading } = useRecipe(recipeId)
  const deleteRecipe = useDeleteRecipe()
  const toggleFavorite = useToggleFavorite()
  const [servings, setServings] = useState<number | null>(null)

  const effectiveServings = servings ?? recipe?.servings ?? 4
  const totalTime = (recipe?.prep_time_mins ?? 0) + (recipe?.cook_time_mins ?? 0)

  const handleDelete = async () => {
    if (!recipe) return
    if (!window.confirm('Delete this recipe?')) return
    await deleteRecipe.mutateAsync(recipe.id)
    toast({ title: 'Recipe deleted' })
    void navigate({ to: '/' })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-none" />
        <div className="px-4 space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh">
        <p className="text-muted-foreground">Recipe not found</p>
        <Link to="/" className="text-primary mt-2 text-sm">Back to recipes</Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      {/* Hero image */}
      <div className="relative h-64 bg-muted">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Back button */}
        <button
          onClick={() => void navigate({ to: '/' })}
          className="absolute top-safe-top left-4 mt-4 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Actions */}
        <div className="absolute top-safe-top right-4 mt-4 flex gap-2">
          <button
            onClick={() => toggleFavorite.mutate({ id: recipe.id, isFavorite: !recipe.is_favorite })}
            className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <Heart
              className={cn('h-5 w-5', recipe.is_favorite && 'fill-red-400 text-red-400')}
            />
          </button>

          <BottomSheet>
            <BottomSheetTrigger asChild>
              <button className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center">
                <MoreVertical className="h-5 w-5" />
              </button>
            </BottomSheetTrigger>
            <BottomSheetContent>
              <h3 className="font-semibold mb-4">{recipe.title}</h3>
              <div className="space-y-1">
                <BottomSheetClose asChild>
                  <Link
                    to="/recipes/$recipeId/edit"
                    params={{ recipeId: recipe.id }}
                    className="flex items-center gap-3 w-full rounded-xl p-3 hover:bg-muted transition-colors"
                  >
                    <Edit className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Edit recipe</span>
                  </Link>
                </BottomSheetClose>

                {recipe.source_url && (
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full rounded-xl p-3 hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">View source</span>
                  </a>
                )}

                <BottomSheetClose asChild>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-3 w-full rounded-xl p-3 hover:bg-muted transition-colors text-destructive"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="font-medium">Delete recipe</span>
                  </button>
                </BottomSheetClose>
              </div>
            </BottomSheetContent>
          </BottomSheet>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-8">
        {/* Title + tags */}
        <h1 className="text-2xl font-bold tracking-tight">{recipe.title}</h1>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {recipe.description && (
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{recipe.description}</p>
        )}

        {/* Stats row */}
        <div className="flex gap-4 mt-4 py-4 border-y border-border/50">
          {totalTime > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatTime(totalTime)}</span>
            </div>
          )}
          {recipe.prep_time_mins && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formatTime(recipe.prep_time_mins)}</span> prep
            </div>
          )}
          {recipe.cook_time_mins && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formatTime(recipe.cook_time_mins)}</span> cook
            </div>
          )}
        </div>

        {/* Servings adjuster */}
        {recipe.servings && (
          <div className="flex items-center gap-4 py-4 border-b border-border/50">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium flex-1">Servings</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setServings(Math.max(1, effectiveServings - 1))}
              >
                −
              </Button>
              <span className="w-6 text-center font-semibold">{effectiveServings}</span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setServings(effectiveServings + 1)}
              >
                +
              </Button>
              {servings !== null && (
                <button
                  onClick={() => setServings(null)}
                  className="text-xs text-primary"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="ingredients" className="mt-4">
          <TabsList>
            <TabsTrigger value="ingredients">
              Ingredients ({recipe.ingredients.length})
            </TabsTrigger>
            <TabsTrigger value="steps">
              Steps ({recipe.steps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-4 -mx-4">
            <IngredientList
              ingredients={recipe.ingredients}
              servings={recipe.servings ?? 4}
              scaledServings={effectiveServings}
            />
          </TabsContent>

          <TabsContent value="steps" className="mt-4 -mx-4">
            <StepList steps={recipe.steps} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/recipes/$recipeId/')({
  component: RecipeDetailPage,
})
