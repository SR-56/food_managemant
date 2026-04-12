"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AppHeader } from "@/components/app-header"
import type { Recipe, Ingredient } from "@/lib/types"

interface RecipeListViewProps {
  recipes: Recipe[]
  allIngredients: Ingredient[]
  onOpenDetail: (id: string) => void
  onStartCreate: () => void
  onBack: () => void
}

export function RecipeListView({
  recipes,
  allIngredients,
  onOpenDetail,
  onStartCreate,
  onBack,
}: RecipeListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resolveIngredient = (id: string) => allIngredients.find((i) => i.id === id)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="レシピ"
        showBack
        onBack={onBack}
        rightElement={
          <button
            type="button"
            onClick={onStartCreate}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-accent"
            aria-label="新規レシピ作成"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="レシピ名で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10 text-foreground"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="flex flex-col">
          {filtered.map((recipe) => {
            const ingredientNames = recipe.ingredients
              .map((id) => resolveIngredient(id)?.name)
              .filter(Boolean)
            const displayIngredients =
              ingredientNames.length > 3
                ? `${ingredientNames.slice(0, 3).join("、")}、他${ingredientNames.length - 3}品`
                : ingredientNames.join("、")

            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onOpenDetail(recipe.id)}
                className="flex w-full flex-col border-b border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium text-foreground">{recipe.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{displayIngredients}</span>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
