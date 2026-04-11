export type IngredientCategory = "野菜" | "肉類" | "魚類" | "調味料" | "その他"

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  inStock: boolean
}

export interface Recipe {
  id: string
  name: string
  ingredients: string[] // ingredient IDs
  url?: string
}

export interface MealPlan {
  date: string // YYYY-MM-DD
  recipeId: string | null
}

export interface ShoppingItem {
  ingredientId: string
  ingredientName: string
  category: IngredientCategory
  reason: string
  checked: boolean
}

export interface HouseholdMember {
  id: string
  name: string
  email: string
  isCurrentUser: boolean
}
