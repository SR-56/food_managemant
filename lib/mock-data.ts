// Mock data for the food management app prototype

import type {
  Ingredient,
  Recipe,
  MealPlan,
  ShoppingItem,
  HouseholdMember,
} from "@/lib/types"

// ---- Ingredients Master ----
export const ingredients: Ingredient[] = [
  // 野菜
  { id: "v1", name: "にんじん", category: "野菜", inStock: true },
  { id: "v2", name: "じゃがいも", category: "野菜", inStock: false },
  { id: "v3", name: "たまねぎ", category: "野菜", inStock: true },
  { id: "v4", name: "キャベツ", category: "野菜", inStock: false },
  { id: "v5", name: "ほうれん草", category: "野菜", inStock: false },
  { id: "v6", name: "トマト", category: "野菜", inStock: true },
  { id: "v7", name: "なす", category: "野菜", inStock: false },
  { id: "v8", name: "ピーマン", category: "野菜", inStock: true },
  { id: "v9", name: "大根", category: "野菜", inStock: false },
  { id: "v10", name: "白菜", category: "野菜", inStock: true },
  // 肉類
  { id: "m1", name: "豚バラ肉", category: "肉類", inStock: false },
  { id: "m2", name: "鶏もも肉", category: "肉類", inStock: true },
  { id: "m3", name: "牛薄切り肉", category: "肉類", inStock: false },
  { id: "m4", name: "ひき肉（合挽き）", category: "肉類", inStock: false },
  // 魚類
  { id: "f1", name: "サケ", category: "魚類", inStock: false },
  { id: "f2", name: "サバ", category: "魚類", inStock: false },
  { id: "f3", name: "エビ", category: "魚類", inStock: true },
  // 調味料
  { id: "s1", name: "しょうゆ", category: "調味料", inStock: true },
  { id: "s2", name: "みりん", category: "調味料", inStock: true },
  { id: "s3", name: "料理酒", category: "調味料", inStock: false },
  { id: "s4", name: "味噌", category: "調味料", inStock: true },
  { id: "s5", name: "砂糖", category: "調味料", inStock: true },
  { id: "s6", name: "塩", category: "調味料", inStock: true },
  { id: "s7", name: "カレールー", category: "調味料", inStock: false },
  // その他
  { id: "o1", name: "豆腐", category: "その他", inStock: false },
  { id: "o2", name: "卵", category: "その他", inStock: true },
  { id: "o3", name: "米", category: "その他", inStock: true },
  { id: "o4", name: "パスタ", category: "その他", inStock: false },
]

// ---- Recipes ----
export const recipes: Recipe[] = [
  { id: "r1", name: "カレーライス", ingredients: ["v1", "v2", "v3", "m1", "s7"], url: "https://cookpad.com/recipe/1234567" },
  { id: "r2", name: "肉じゃが", ingredients: ["v1", "v2", "v3", "m3", "s1", "s2", "s5"] },
  { id: "r3", name: "味噌汁", ingredients: ["o1", "v10", "s4"] },
  { id: "r4", name: "鶏の照り焼き", ingredients: ["m2", "s1", "s2", "s5"], url: "https://cookpad.com/recipe/2345678" },
  { id: "r5", name: "ほうれん草のおひたし", ingredients: ["v5", "s1"] },
  { id: "r6", name: "サケの塩焼き", ingredients: ["f1", "s6"] },
  { id: "r7", name: "エビチリ", ingredients: ["f3", "v3", "v6"], url: "https://cookpad.com/recipe/3456789" },
  { id: "r8", name: "なすの味噌炒め", ingredients: ["v7", "m1", "s4", "s2"] },
  { id: "r9", name: "豚バラ大根", ingredients: ["m1", "v9", "s1", "s2", "s3"] },
  { id: "r10", name: "パスタ ペペロンチーノ", ingredients: ["o4", "s6"] },
]

// ---- Meal Plans (this week) ----
export const mealPlans: MealPlan[] = [
  { date: "2026-02-09", recipeId: "r1" },
  { date: "2026-02-10", recipeId: "r4" },
  { date: "2026-02-11", recipeId: "r2" },
  { date: "2026-02-12", recipeId: null },
  { date: "2026-02-13", recipeId: "r6" },
  { date: "2026-02-14", recipeId: "r8" },
  { date: "2026-02-15", recipeId: null },
]

// ---- Household Members ----
export const householdMembers: HouseholdMember[] = [
  { id: "u1", name: "田中太郎", email: "taro@example.com", isCurrentUser: true },
  { id: "u2", name: "田中花子", email: "hanako@example.com", isCurrentUser: false },
]

// ---- Helper functions ----
export function getIngredientById(id: string): Ingredient | undefined {
  return ingredients.find((i) => i.id === id)
}

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id)
}

export function getOutOfStockIngredients(): Ingredient[] {
  return ingredients.filter((i) => !i.inStock)
}

export function getShoppingList(): ShoppingItem[] {
  const neededIngredients = new Map<string, { reasons: string[]; ingredient: Ingredient }>()

  for (const plan of mealPlans) {
    if (!plan.recipeId) continue
    const recipe = getRecipeById(plan.recipeId)
    if (!recipe) continue

    for (const ingredientId of recipe.ingredients) {
      const ingredient = getIngredientById(ingredientId)
      if (!ingredient || ingredient.inStock) continue

      const existing = neededIngredients.get(ingredientId)
      if (existing) {
        existing.reasons.push(recipe.name)
      } else {
        neededIngredients.set(ingredientId, {
          reasons: [recipe.name],
          ingredient,
        })
      }
    }
  }

  return Array.from(neededIngredients.entries()).map(([ingredientId, { reasons, ingredient }]) => ({
    ingredientId,
    ingredientName: ingredient.name,
    category: ingredient.category,
    reason: reasons.join("、"),
    checked: false,
  }))
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    dates.push(d)
  }
  return dates
}

export const dayNames = ["日", "月", "火", "水", "木", "金", "土"]

export function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}
