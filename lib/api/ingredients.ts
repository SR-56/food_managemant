import { ingredients, getIngredientById as _getIngredientById, getOutOfStockIngredients as _getOutOfStockIngredients } from "@/lib/mock-data"
import type { Ingredient } from "@/lib/types"

export function getIngredients(): Ingredient[] {
  return ingredients
}

export function getIngredientById(id: string): Ingredient | undefined {
  return _getIngredientById(id)
}

export function getOutOfStockIngredients(): Ingredient[] {
  return _getOutOfStockIngredients()
}
