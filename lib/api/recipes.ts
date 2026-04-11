import { recipes, getRecipeById as _getRecipeById } from "@/lib/mock-data"
import type { Recipe } from "@/lib/types"

export function getRecipes(): Recipe[] {
  return recipes
}

export function getRecipeById(id: string): Recipe | undefined {
  return _getRecipeById(id)
}
