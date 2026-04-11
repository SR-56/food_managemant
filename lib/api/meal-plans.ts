import { mealPlans } from "@/lib/mock-data"
import type { MealPlan } from "@/lib/types"

export function getMealPlans(): MealPlan[] {
  return mealPlans
}
