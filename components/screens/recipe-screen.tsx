"use client"

import { useState } from "react"
import { Plus, Search, Pencil, Trash2, X, Check, ExternalLink, ClipboardPaste, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { recipes as initialRecipes, ingredients as masterIngredients } from "@/lib/mock-data"
import type { Recipe, Ingredient, IngredientCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

type RecipeView = "list" | "detail" | "edit"

interface ParsedCandidate {
  id: string
  name: string
  isNew: boolean
  selected: boolean
}

interface RecipeScreenProps {
  onBack: () => void
}

// Simulates Claude API: extracts ingredient names from free-form text and matches against master
function parseIngredientsFromText(
  text: string,
  master: Ingredient[]
): Array<{ id: string | null; name: string }> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const result: Array<{ id: string | null; name: string }> = []
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()

  for (const line of lines) {
    const cleaned = line
      .replace(/[（(].*?[）)]/g, "")
      .replace(/\d+(\.\d+)?[\s]*(g|kg|ml|L|l|個|本|枚|袋|缶|大さじ|小さじ|カップ|合|切れ|尾|匹|羽|頭|玉|束|房|株)?/g, "")
      .replace(/[：:・…]+/g, "")
      .trim()

    if (!cleaned || cleaned.length < 2) continue

    const matched = master.find(
      (i) => i.name === cleaned || i.name.includes(cleaned) || cleaned.includes(i.name)
    )

    if (matched) {
      if (!seenIds.has(matched.id)) {
        seenIds.add(matched.id)
        result.push({ id: matched.id, name: matched.name })
      }
    } else {
      if (!seenNames.has(cleaned)) {
        seenNames.add(cleaned)
        result.push({ id: null, name: cleaned })
      }
    }
  }

  return result
}

export function RecipeScreen({ onBack }: RecipeScreenProps) {
  const [recipeList, setRecipeList] = useState<Recipe[]>(initialRecipes)
  const [customIngredients, setCustomIngredients] = useState<Ingredient[]>([])
  const [view, setView] = useState<RecipeView>("list")
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editName, setEditName] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editIngredients, setEditIngredients] = useState<string[]>([])
  const [isNewRecipe, setIsNewRecipe] = useState(false)
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState("")
  const [tempSelectedIngredients, setTempSelectedIngredients] = useState<string[]>([])
  // Copy-paste state
  const [copyPasteText, setCopyPasteText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([])

  const allIngredients = [...masterIngredients, ...customIngredients]

  const resolveIngredient = (id: string) => allIngredients.find((i) => i.id === id)

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
      setEditUrl(recipe.url ?? "")
      setEditIngredients([...recipe.ingredients])
    } else {
      setIsNewRecipe(true)
      setEditName("")
      setEditUrl("")
      setEditIngredients([])
    }
    setCopyPasteText("")
    setParseError(null)
    setView("edit")
  }

  const handleSaveRecipe = () => {
    if (!editName.trim()) return

    if (isNewRecipe) {
      const newRecipe: Recipe = {
        id: `r${Date.now()}`,
        name: editName.trim(),
        ingredients: editIngredients,
        ...(editUrl.trim() && { url: editUrl.trim() }),
      }
      setRecipeList((prev) => [...prev, newRecipe])
      setSelectedRecipeId(newRecipe.id)
    } else if (selectedRecipeId) {
      setRecipeList((prev) =>
        prev.map((r) =>
          r.id === selectedRecipeId
            ? { ...r, name: editName.trim(), ingredients: editIngredients, url: editUrl.trim() || undefined }
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

  // --- Copy-paste handlers ---
  const handleParse = async () => {
    if (!copyPasteText.trim()) return
    setIsParsing(true)
    setParseError(null)

    // Simulate Claude API latency
    await new Promise((resolve) => setTimeout(resolve, 800))

    const parsed = parseIngredientsFromText(copyPasteText, allIngredients)

    if (parsed.length === 0) {
      setParseError("食材を特定できませんでした。入力内容を確認してください。")
      setIsParsing(false)
      return
    }

    const candidates: ParsedCandidate[] = parsed.map((item, i) => ({
      id: item.id ?? `new_${Date.now()}_${i}`,
      name: item.name,
      isNew: item.id === null,
      selected: true,
    }))
    setParsedCandidates(candidates)
    setConfirmDialogOpen(true)
    setIsParsing(false)
  }

  const handleConfirmPaste = () => {
    const selected = parsedCandidates.filter((c) => c.selected)

    // Add unmatched ingredients to household-specific list
    const newIngredients = selected
      .filter((c) => c.isNew)
      .map((c) => ({
        id: c.id,
        name: c.name,
        category: "その他" as IngredientCategory,
        inStock: false,
      }))
    if (newIngredients.length > 0) {
      setCustomIngredients((prev) => [...prev, ...newIngredients])
    }

    // Add selected ingredients to edit list (avoid duplicates)
    setEditIngredients((prev) => {
      const toAdd = selected.map((c) => c.id).filter((id) => !prev.includes(id))
      return [...prev, ...toAdd]
    })

    setConfirmDialogOpen(false)
    setCopyPasteText("")
  }

  const toggleCandidate = (id: string) => {
    setParsedCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    )
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
          {selectedRecipe.url && (
            <div className="mb-4">
              <h2 className="mb-2 text-sm font-semibold text-foreground">参考URL</h2>
              <a
                href={selectedRecipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary hover:bg-accent"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="break-all">{selectedRecipe.url}</span>
              </a>
            </div>
          )}
          <h2 className="mb-3 text-sm font-semibold text-foreground">必要な食材</h2>
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card">
            {selectedRecipe.ingredients.map((ingredientId) => {
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

            {/* URL */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="recipeUrl" className="text-sm font-medium text-foreground">
                参考URL（任意）
              </Label>
              <Input
                id="recipeUrl"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
                className="h-12 text-foreground"
              />
            </div>

            {/* Copy-paste Section */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                食材コピペ登録（任意）
              </Label>
              <p className="text-xs text-muted-foreground">
                レシピサイトの材料欄をコピーして貼り付けると、食材を自動で解析します
              </p>
              <Textarea
                value={copyPasteText}
                onChange={(e) => {
                  setCopyPasteText(e.target.value)
                  setParseError(null)
                }}
                placeholder={"例：\n鶏もも肉　300g\nじゃがいも　2個\nたまねぎ　1個"}
                className="min-h-[120px] resize-none text-sm text-foreground"
              />
              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleParse}
                disabled={!copyPasteText.trim() || isParsing}
                className="h-11 text-sm bg-transparent"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    食材を解析する
                  </>
                )}
              </Button>
            </div>

            {/* Ingredients */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">必要な食材</Label>
              {editIngredients.length > 0 && (
                <div className="flex flex-col gap-1 rounded-xl border border-border bg-card">
                  {editIngredients.map((id) => {
                    const ingredient = resolveIngredient(id)
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
                {allIngredients
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

        {/* Copy-paste Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="max-h-[80dvh] max-w-[90vw] overflow-hidden rounded-xl sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-foreground">食材の確認</DialogTitle>
              <p className="pt-1 text-xs text-muted-foreground">
                以下の食材を追加します。不要な食材はチェックを外してください。
              </p>
            </DialogHeader>
            <div className="max-h-[40dvh] overflow-y-auto">
              <div className="flex flex-col gap-0.5">
                {parsedCandidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      checked={candidate.selected}
                      onCheckedChange={() => toggleCandidate(candidate.id)}
                      className="h-5 w-5"
                    />
                    <span className="flex-1 text-sm text-foreground">{candidate.name}</span>
                    {candidate.isNew && (
                      <Badge variant="secondary" className="text-xs">
                        新規
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="flex flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                className="h-11 flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmPaste}
                disabled={!parsedCandidates.some((c) => c.selected)}
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
