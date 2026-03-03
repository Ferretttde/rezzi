import { Link } from '@tanstack/react-router'
import { Clock, Heart } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { useToggleFavorite } from '@/hooks/useRecipes'
import type { Recipe } from '@/types/app'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const toggleFavorite = useToggleFavorite()

  const totalTime =
    (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)

  return (
    <div className="relative group">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 active:scale-[0.98] transition-transform"
      >
        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🍽️
            </div>
          )}
          {totalTime > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium rounded-full px-2 py-0.5 backdrop-blur-sm">
              <Clock className="h-2.5 w-2.5" />
              {formatTime(totalTime)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{recipe.title}</h3>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {recipe.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+{recipe.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Favorite button */}
      <button
        onClick={() =>
          toggleFavorite.mutate({ id: recipe.id, isFavorite: !recipe.is_favorite })
        }
        className={cn(
          'absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all active:scale-90',
          recipe.is_favorite ? 'text-red-400' : 'text-white/80'
        )}
        aria-label={recipe.is_favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      >
        <Heart
          className="h-4 w-4"
          fill={recipe.is_favorite ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  )
}
