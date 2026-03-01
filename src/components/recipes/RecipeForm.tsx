import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, GripVertical, Link } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useUpsertRecipe } from '@/hooks/useRecipes'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { toast } from '@/components/ui/use-toast'
import type { Recipe } from '@/types/app'
import { cn } from '@/lib/utils'

const TAG_COLORS = [
  '#e8572a', '#4a7c59', '#3b82f6', '#8b5cf6',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
]

const ingredientSchema = z.object({
  amount: z.string(),
  unit: z.string(),
  name: z.string().min(1, 'Required'),
  group: z.string().optional(),
})

const stepSchema = z.object({
  order: z.number(),
  instruction: z.string().min(1, 'Required'),
  image_url: z.string().url().optional().or(z.literal('')),
})

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  source_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  prep_time_mins: z.coerce.number().min(0).optional().nullable(),
  cook_time_mins: z.coerce.number().min(0).optional().nullable(),
  servings: z.coerce.number().min(1).optional().nullable(),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
  steps: z.array(stepSchema).min(1, 'Add at least one step'),
  tagIds: z.array(z.string()),
})

type RecipeFormData = z.infer<typeof recipeSchema>

interface RecipeFormProps {
  initialData?: Partial<Recipe>
  mode?: 'create' | 'edit'
}

export function RecipeForm({ initialData, mode = 'create' }: RecipeFormProps) {
  const navigate = useNavigate()
  const upsertRecipe = useUpsertRecipe()
  const { data: tags } = useTags()
  const createTag = useCreateTag()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      image_url: initialData?.image_url ?? '',
      source_url: initialData?.source_url ?? '',
      prep_time_mins: initialData?.prep_time_mins ?? null,
      cook_time_mins: initialData?.cook_time_mins ?? null,
      servings: initialData?.servings ?? 4,
      ingredients: initialData?.ingredients?.length
        ? initialData.ingredients
        : [{ amount: '', unit: '', name: '', group: '' }],
      steps: initialData?.steps?.length
        ? initialData.steps
        : [{ order: 1, instruction: '' }],
      tagIds: initialData?.tags?.map((t) => t.id) ?? [],
    },
  })

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: 'steps',
  })

  const selectedTagIds = watch('tagIds')

  const onSubmit = async (data: RecipeFormData) => {
    try {
      const id = await upsertRecipe.mutateAsync({
        id: initialData?.id,
        ...data,
        description: data.description || null,
        image_url: data.image_url || null,
        source_url: data.source_url || null,
        steps: data.steps.map((s, i) => ({ ...s, order: i + 1 })),
        tagIds: data.tagIds,
      })

      toast({ title: mode === 'edit' ? 'Recipe updated!' : 'Recipe saved!', variant: 'success' as 'default' })
      void navigate({ to: '/recipes/$recipeId', params: { recipeId: id } })
    } catch {
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' })
    }
  }

  const handleCreateTag = async (name: string) => {
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)] ?? '#e8572a'
    await createTag.mutateAsync({ name, color })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      {/* Basic Info */}
      <section className="space-y-4 px-4">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Basic Info
        </h2>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="e.g. Grandma's Pasta Sauce" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="A short note about this recipe..."
            rows={3}
            {...register('description')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image_url">Image URL</Label>
          <Input id="image_url" placeholder="https://..." type="url" {...register('image_url')} />
          {errors.image_url && <p className="text-xs text-destructive">{errors.image_url.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="source_url" className="flex items-center gap-1">
            <Link className="h-3.5 w-3.5" /> Source URL
          </Label>
          <Input id="source_url" placeholder="https://..." type="url" {...register('source_url')} />
        </div>
      </section>

      {/* Timings */}
      <section className="px-4 space-y-4">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Timings & Servings
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="prep_time_mins" className="text-xs">Prep (min)</Label>
            <Input id="prep_time_mins" type="number" min="0" {...register('prep_time_mins')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cook_time_mins" className="text-xs">Cook (min)</Label>
            <Input id="cook_time_mins" type="number" min="0" {...register('cook_time_mins')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="servings" className="text-xs">Servings</Label>
            <Input id="servings" type="number" min="1" {...register('servings')} />
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className="px-4 space-y-3">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Tags
        </h2>
        <Controller
          control={control}
          name="tagIds"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => {
                const isSelected = field.value.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      field.onChange(
                        isSelected
                          ? field.value.filter((id) => id !== tag.id)
                          : [...field.value, tag.id]
                      )
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border',
                      isSelected ? 'text-white border-transparent' : 'border-border bg-white'
                    )}
                    style={isSelected ? { backgroundColor: tag.color } : undefined}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : tag.color }}
                    />
                    {tag.name}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={async () => {
                  const name = window.prompt('New tag name:')
                  if (name?.trim()) await handleCreateTag(name.trim())
                }}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium border border-dashed border-border text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> New tag
              </button>
            </div>
          )}
        />
        <p className="text-xs text-muted-foreground">Selected: {selectedTagIds.length}</p>
      </section>

      {/* Ingredients */}
      <section className="px-4 space-y-3">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Ingredients
        </h2>
        {errors.ingredients?.root && (
          <p className="text-xs text-destructive">{errors.ingredients.root.message}</p>
        )}
        <div className="space-y-2">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-3 shrink-0" />
              <div className="flex-1 grid grid-cols-[80px_80px_1fr] gap-1.5">
                <Input
                  placeholder="Amount"
                  {...register(`ingredients.${index}.amount`)}
                  className="text-sm"
                />
                <Input
                  placeholder="Unit"
                  {...register(`ingredients.${index}.unit`)}
                  className="text-sm"
                />
                <Input
                  placeholder="Ingredient name"
                  {...register(`ingredients.${index}.name`)}
                  className="text-sm"
                />
                {errors.ingredients?.[index]?.name && (
                  <p className="col-span-3 text-xs text-destructive">
                    {errors.ingredients[index].name?.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="p-2 text-muted-foreground hover:text-destructive mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendIngredient({ amount: '', unit: '', name: '', group: '' })}
          className="w-full"
        >
          <Plus className="h-4 w-4" /> Add ingredient
        </Button>
      </section>

      {/* Steps */}
      <section className="px-4 space-y-3">
        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">
          Steps
        </h2>
        {errors.steps?.root && (
          <p className="text-xs text-destructive">{errors.steps.root.message}</p>
        )}
        <div className="space-y-3">
          {stepFields.map((field, index) => (
            <div key={field.id} className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-1.5">
                {index + 1}
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder={`Step ${index + 1} instructions...`}
                  rows={3}
                  {...register(`steps.${index}.instruction`)}
                />
                {errors.steps?.[index]?.instruction && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.steps[index].instruction?.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="p-2 text-muted-foreground hover:text-destructive mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendStep({ order: stepFields.length + 1, instruction: '' })}
          className="w-full"
        >
          <Plus className="h-4 w-4" /> Add step
        </Button>
      </section>

      {/* Submit */}
      <div className="px-4">
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Recipe' : 'Save Recipe'}
        </Button>
      </div>
    </form>
  )
}
