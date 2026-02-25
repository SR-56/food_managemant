"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AppHeader } from "@/components/app-header"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  recipes as initialRecipes,
  ingredients,
  getIngredientById,
  type Recipe,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type RecipeView = "list" | "detail" | "edit"

interface RecipeScreenProps {
  onBack: () => void
}

export function RecipeScreen({ onBack }: RecipeScreenProps) {
  const [recipeList, setRecipeList] = useState<Recipe[]>(initialRecipes)
  const [view, setView] = useState<RecipeView>("list")
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editName, setEditName] = useState("")
  const [editIngredients, setEditIngredients] = useState<string[]>([])
  const [isNewRecipe, setIsNewRecipe] = useState(false)
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState("")
  const [tempSelectedIngredients, setTempSelectedIngredients] = useState<string[]>([])

  const selectedRecipe = recipeList.find((r) => r.id === selectedRecipeId)

  const filteredRecipes = recipeList.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // --- Handlers ---
  const handleOpenDetail = (recipeId: string) => {
    setSelectedRecipeId(recipeId)
    setView("detail")
  }

  const handleStartEdit = (recipe?: Recipe) => {
    if (recipe) {
      setIsNewRecipe(false)
      setEditName(recipe.name)
      setEditIngredients([...recipe.ingredients])
    } else {
      setIsNewRecipe(true)
      setEditName("")
      setEditIngredients([])
    }
    setView("edit")
  }

  const handleSaveRecipe = () => {
    if (!editName.trim()) return

    if (isNewRecipe) {
      const newRecipe: Recipe = {
        id: `r${Date.now()}`,
        name: editName.trim(),
        ingredients: editIngredients,
      }
      setRecipeList((prev) => [...prev, newRecipe])
      setSelectedRecipeId(newRecipe.id)
    } else if (selectedRecipeId) {
      setRecipeList((prev) =>
        prev.map((r) =>
          r.id === selectedRecipeId
            ? { ...r, name: editName.trim(), ingredients: editIngredients }
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

  const handleOpenIngredientDialog = () => {
    setTempSelectedIngredients([...editIngredients])
    setIngredientSearch("")
    setIngredientDialogOpen(true)
  }

  const handleConfirmIngredients = () => {
    setEditIngredients([...tempSelectedIngredients])
    setIngredientDialogOpen(false)
  }

  const toggleTempIngredient = (id: string) => {
    setTempSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const removeEditIngredient = (id: string) => {
    setEditIngredients((prev) => prev.filter((i) => i !== id))
  }

  // --- Recipe List ---
  if (view === "list") {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppHeader
          title="レシピ"
          showBack
          onBack={onBack}
          rightElement={
            <button
              type="button"
              onClick={() => handleStartEdit()}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-accent"
              aria-label="新規レシピ作成"
            >
              <Plus className="h-5 w-5" />
            </button>
          }
        />

        {/* Search */}
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

        {/* Recipe List */}
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="flex flex-col">
            {filteredRecipes.map((recipe) => {
              const ingredientNames = recipe.ingredients
                .map((id) => getIngredientById(id)?.name)
                .filter(Boolean)
              const displayIngredients =
                ingredientNames.length > 3
                  ? `${ingredientNames.slice(0, 3).join("、")}、他${ingredientNames.length - 3}品`
                  : ingredientNames.join("、")

              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => handleOpenDetail(recipe.id)}
                  className="flex w-full flex-col border-b border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-medium text-foreground">{recipe.name}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {displayIngredients}
                  </span>
                </button>
              )
            })}
          </div>
        </main>
      </div>
    )
  }

  // --- Recipe Detail ---
  if (view === "detail" && selectedRecipe) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppHeader
          title={selectedRecipe.name}
          showBack
          onBack={() => setView("list")}
          rightElement={
            <button
              type="button"
              onClick={() => handleStartEdit(selectedRecipe)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-accent"
              aria-label="レシピを編集"
            >
              <Pencil className="h-4 w-4" />
            </button>
          }
        />

        <main className="flex-1 overflow-y-auto p-4 pb-24">
          <h2 className="mb-3 text-sm font-semibold text-foreground">必要な食材</h2>
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card">
            {selectedRecipe.ingredients.map((ingredientId) => {
              const ingredient = getIngredientById(ingredientId)
              if (!ingredient) return null
              return (
                <div
                  key={ingredientId}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-foreground">{ingredient.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      ingredient.inStock
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {ingredient.inStock ? "在庫あり" : "在庫なし"}
                  </span>
                </div>
              )
            })}
          </div>
        </main>

        {/* Footer Delete Button */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                レシピを削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">レシピを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{selectedRecipe.name}」を削除します。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-11">キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteRecipe}
                  className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    )
  }

  // --- Recipe Edit/Create ---
  if (view === "edit") {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <AppHeader
          title={isNewRecipe ? "レシピ作成" : "レシピ編集"}
          showBack
          onBack={() => {
            if (isNewRecipe) {
              setView("list")
            } else {
              setView("detail")
            }
          }}
          rightElement={
            <button
              type="button"
              onClick={handleSaveRecipe}
              disabled={!editName.trim()}
              className={cn(
                "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg",
                editName.trim()
                  ? "text-primary hover:bg-accent"
                  : "text-muted-foreground"
              )}
              aria-label="保存"
            >
              <Check className="h-5 w-5" />
            </button>
          }
        />

        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="flex flex-col gap-6">
            {/* Recipe Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="recipeName" className="text-sm font-medium text-foreground">
                レシピ名
              </Label>
              <Input
                id="recipeName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例: カレーライス"
                className="h-12 text-foreground"
              />
            </div>

            {/* Ingredients */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">必要な食材</Label>
              {editIngredients.length > 0 && (
                <div className="flex flex-col gap-1 rounded-xl border border-border bg-card">
                  {editIngredients.map((id) => {
                    const ingredient = getIngredientById(id)
                    if (!ingredient) return null
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span className="text-sm text-foreground">{ingredient.name}</span>
                        <button
                          type="button"
                          onClick={() => removeEditIngredient(id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                          aria-label={`${ingredient.name}を削除`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleOpenIngredientDialog}
                className="h-11 border-dashed text-sm bg-transparent"
              >
                <Plus className="mr-1 h-4 w-4" />
                食材を追加
              </Button>
            </div>
          </div>
        </main>

        {/* Ingredient Selection Dialog */}
        <Dialog open={ingredientDialogOpen} onOpenChange={setIngredientDialogOpen}>
          <DialogContent className="max-h-[80dvh] max-w-[90vw] overflow-hidden rounded-xl sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-foreground">食材を選択</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="食材名で検索"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="h-11 pl-10 text-foreground"
              />
            </div>
            <div className="max-h-[40dvh] overflow-y-auto">
              <div className="flex flex-col gap-0.5">
                {ingredients
                  .filter((i) =>
                    i.name.toLowerCase().includes(ingredientSearch.toLowerCase())
                  )
                  .map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        checked={tempSelectedIngredients.includes(ingredient.id)}
                        onCheckedChange={() => toggleTempIngredient(ingredient.id)}
                        className="h-5 w-5"
                      />
                      <span className="text-sm text-foreground">{ingredient.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {ingredient.category}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
            <DialogFooter className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIngredientDialogOpen(false)}
                className="h-11 flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmIngredients}
                className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                追加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}
