"use client"

import { useState } from "react"
import { getRecipes } from "@/lib/api/recipes"
import { getIngredients } from "@/lib/api/ingredients"
import type { Recipe, Ingredient } from "@/lib/types"
import { RecipeListView } from "@/components/screens/recipe-list-view"
import { RecipeDetailView } from "@/components/screens/recipe-detail-view"
import { RecipeEditView } from "@/components/screens/recipe-edit-view"

type RecipeView = "list" | "detail" | "edit"

interface RecipeScreenProps {
  onBack: () => void
}

export function RecipeScreen({ onBack }: RecipeScreenProps) {
  const [recipeList, setRecipeList] = useState<Recipe[]>(getRecipes)
  const [customIngredients, setCustomIngredients] = useState<Ingredient[]>([])
  const [view, setView] = useState<RecipeView>("list")
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [isNewRecipe, setIsNewRecipe] = useState(false)

  const allIngredients = [...getIngredients(), ...customIngredients]
  const selectedRecipe = recipeList.find((r) => r.id === selectedRecipeId)

  const handleOpenDetail = (recipeId: string) => {
    setSelectedRecipeId(recipeId)
    setView("detail")
  }

  const handleStartEdit = (recipe?: Recipe) => {
    setIsNewRecipe(!recipe)
    setView("edit")
  }

  const handleSaveRecipe = ({
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
    if (newCustomIngredients.length > 0) {
      setCustomIngredients((prev) => [...prev, ...newCustomIngredients])
    }

    if (isNewRecipe) {
      const newRecipe: Recipe = {
        id: `r${Date.now()}`,
        name,
        ingredients,
        ...(url && { url }),
      }
      setRecipeList((prev) => [...prev, newRecipe])
      setSelectedRecipeId(newRecipe.id)
    } else if (selectedRecipeId) {
      setRecipeList((prev) =>
        prev.map((r) =>
          r.id === selectedRecipeId
            ? { ...r, name, ingredients, url: url || undefined }
            : r
        )
      )
    }
    setView("detail")
  }

  const handleDeleteRecipe = () => {
    if (!selectedRecipeId) return
    setRecipeList((prev) => prev.filter((r) => r.id !== selectedRecipeId))
    setSelectedRecipeId(null)
    setView("list")
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
