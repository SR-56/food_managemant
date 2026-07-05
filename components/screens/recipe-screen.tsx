"use client"

import { useState, useEffect } from "react"
import type { Recipe, Ingredient } from "@/lib/types"
import { RecipeListView } from "@/components/screens/recipe-list-view"
import { RecipeDetailView } from "@/components/screens/recipe-detail-view"
import { RecipeEditView } from "@/components/screens/recipe-edit-view"

type RecipeView = "list" | "detail" | "edit"

interface RecipeScreenProps {
  onBack: () => void
}

export function RecipeScreen({ onBack }: RecipeScreenProps) {
  const [recipeList, setRecipeList] = useState<Recipe[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [view, setView] = useState<RecipeView>("list")
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [isNewRecipe, setIsNewRecipe] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
    ]).then(([recipes, ingredients]) => {
      if (Array.isArray(recipes)) setRecipeList(recipes)
      if (Array.isArray(ingredients)) setAllIngredients(ingredients)
    })
  }, [])

  const selectedRecipe = recipeList.find((r) => r.id === selectedRecipeId)

  const handleOpenDetail = (recipeId: string) => {
    setSelectedRecipeId(recipeId)
    setView("detail")
  }

  const handleStartEdit = (recipe?: Recipe) => {
    setIsNewRecipe(!recipe)
    setView("edit")
  }

  const handleSaveRecipe = async ({
    name,
    url,
    ingredients,
    newCustomIngredients,
  }: {
    name: string
    url: string
    ingredients: string[]
    newCustomIngredients: Ingredient[]
  }) => {
    // 新規食材をAPIで作成して一時IDと本物のIDをマッピング
    const idMap = new Map<string, string>()
    for (const ing of newCustomIngredients) {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ing.name, category: ing.category }),
      })
      if (res.ok) {
        const data = await res.json()
        const realIngredientId = (data.ingredients as { id: string } | null)?.id
        if (realIngredientId) idMap.set(ing.id, realIngredientId)
      }
    }

    // 一時IDを本物のIDに置換
    const resolvedIngredients = ingredients.map((id) => idMap.get(id) ?? id)

    if (isNewRecipe) {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, ingredients: resolvedIngredients }),
      })
      if (res.ok) {
        const newRecipe: Recipe = await res.json()
        setRecipeList((prev) => [newRecipe, ...prev])
        setSelectedRecipeId(newRecipe.id)
      }
    } else if (selectedRecipeId) {
      const res = await fetch(`/api/recipes/${selectedRecipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, ingredients: resolvedIngredients }),
      })
      if (res.ok) {
        const updated: Recipe = await res.json()
        setRecipeList((prev) =>
          prev.map((r) => (r.id === selectedRecipeId ? updated : r))
        )
      }
    }

    // 新規食材があった場合は ingredients 一覧を再取得
    if (newCustomIngredients.length > 0) {
      fetch("/api/ingredients")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setAllIngredients(data) })
    }

    setView("detail")
  }

  const handleDeleteRecipe = async () => {
    if (!selectedRecipeId) return
    const res = await fetch(`/api/recipes/${selectedRecipeId}`, { method: "DELETE" })
    if (res.ok) {
      setRecipeList((prev) => prev.filter((r) => r.id !== selectedRecipeId))
      setSelectedRecipeId(null)
      setView("list")
    }
  }

  if (view === "list") {
    return (
      <RecipeListView
        recipes={recipeList}
        allIngredients={allIngredients}
        onOpenDetail={handleOpenDetail}
        onStartCreate={() => handleStartEdit()}
        onBack={onBack}
      />
    )
  }

  if (view === "detail" && selectedRecipe) {
    return (
      <RecipeDetailView
        recipe={selectedRecipe}
        allIngredients={allIngredients}
        onBack={() => setView("list")}
        onEdit={() => handleStartEdit(selectedRecipe)}
        onDelete={handleDeleteRecipe}
      />
    )
  }

  if (view === "edit") {
    return (
      <RecipeEditView
        key={isNewRecipe ? "new" : selectedRecipeId}
        isNewRecipe={isNewRecipe}
        initialRecipe={isNewRecipe ? undefined : selectedRecipe}
        allIngredients={allIngredients}
        onBack={() => setView(isNewRecipe ? "list" : "detail")}
        onSave={handleSaveRecipe}
      />
    )
  }

  return null
}
