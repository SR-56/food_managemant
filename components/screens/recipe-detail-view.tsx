"use client"

import { Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/app-header"
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
import type { Recipe, Ingredient } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RecipeDetailViewProps {
  recipe: Recipe
  allIngredients: Ingredient[]
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function RecipeDetailView({
  recipe,
  allIngredients,
  onBack,
  onEdit,
  onDelete,
}: RecipeDetailViewProps) {
  const resolveIngredient = (id: string) => allIngredients.find((i) => i.id === id)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title={recipe.name}
        showBack
        onBack={onBack}
        rightElement={
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-accent"
            aria-label="レシピを編集"
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {recipe.url && (
          <div className="mb-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">参考URL</h2>
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="break-all">{recipe.url}</span>
            </a>
          </div>
        )}
        <h2 className="mb-3 text-sm font-semibold text-foreground">必要な食材</h2>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card">
          {recipe.ingredients.map((ingredientId) => {
            const ingredient = resolveIngredient(ingredientId)
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

      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card p-4">
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
                「{recipe.name}」を削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11">キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
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
