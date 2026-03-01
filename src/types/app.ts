export interface Ingredient {
  amount: string
  unit: string
  name: string
  group?: string
}

export interface RecipeStep {
  order: number
  instruction: string
  image_url?: string
}

export interface Recipe {
  id: string
  household_id: string
  created_by: string
  title: string
  description: string | null
  image_url: string | null
  source_url: string | null
  prep_time_mins: number | null
  cook_time_mins: number | null
  servings: number | null
  ingredients: Ingredient[]
  steps: RecipeStep[]
  is_favorite: boolean
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface Tag {
  id: string
  household_id: string
  name: string
  color: string
  created_at: string
  recipe_count?: number
}

export interface MealPlan {
  id: string
  household_id: string
  recipe_id: string | null
  custom_title: string | null
  planned_date: string
  meal_type: MealType
  servings: number | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
  recipe?: Recipe | null
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface Household {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface Profile {
  id: string
  household_id: string | null
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ImportedRecipe {
  title: string
  description?: string
  image_url?: string
  source_url?: string
  prep_time_mins?: number
  cook_time_mins?: number
  servings?: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
}
