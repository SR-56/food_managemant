"use client"

import { useState } from "react"
import { Plus, X, Check, ClipboardPaste, Loader2, Search } from "lucide-react"
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
import type { Recipe, Ingredient, IngredientCategory } from "@/lib/types"
import { parseIngredientsFromText } from "@/lib/recipe-parser"
import { cn } from "@/lib/utils"

interface ParsedCandidate {
  id: string
  name: string
  isNew: boolean
  selected: boolean
}

interface RecipeEditViewProps {
  isNewRecipe: boolean
  initialRecipe?: Recipe
  allIngredients: Ingredient[]
  onBack: () => void
  onSave: (data: {
    name: string
    url: string
    ingredients: string[]
    newCustomIngredients: Ingredient[]
  }) => void
}

export function RecipeEditView({
  isNewRecipe,
  initialRecipe,
  allIngredients,
  onBack,
  onSave,
}: RecipeEditViewProps) {
  const [editName, setEditName] = useState(initialRecipe?.name ?? "")
  const [editUrl, setEditUrl] = useState(initialRecipe?.url ?? "")
  const [editIngredients, setEditIngredients] = useState<string[]>(
    initialRecipe?.ingredients ? [...initialRecipe.ingredients] : []
  )
  const [localCustomIngredients, setLocalCustomIngredients] = useState<Ingredient[]>([])
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState("")
  const [tempSelectedIngredients, setTempSelectedIngredients] = useState<string[]>([])
  const [copyPasteText, setCopyPasteText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidate[]>([])

  const allResolvable = [...allIngredients, ...localCustomIngredients]
  const resolveIngredient = (id: string) => allResolvable.find((i) => i.id === id)

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

  const handleParse = async () => {
    if (!copyPasteText.trim()) return
    setIsParsing(true)
    setParseError(null)

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
    const newCustomIngredients = selected
      .filter((c) => c.isNew)
      .map((c) => ({
        id: c.id,
        name: c.name,
        category: "その他" as IngredientCategory,
        inStock: false,
      }))

    if (newCustomIngredients.length > 0) {
      setLocalCustomIngredients((prev) => [...prev, ...newCustomIngredients])
    }

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

  const handleSave = () => {
    if (!editName.trim()) return
    onSave({
      name: editName.trim(),
      url: editUrl.trim(),
      ingredients: editIngredients,
      newCustomIngredients: localCustomIngredients,
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title={isNewRecipe ? "レシピ作成" : "レシピ編集"}
        showBack
        onBack={onBack}
        rightElement={
          <button
            type="button"
            onClick={handleSave}
            disabled={!editName.trim()}
            className={cn(
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg",
              editName.trim() ? "text-primary hover:bg-accent" : "text-muted-foreground"
            )}
            aria-label="保存"
          >
            <Check className="h-5 w-5" />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex flex-col gap-6">
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
            {parseError && <p className="text-xs text-destructive">{parseError}</p>}
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

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">必要な食材</Label>
            {editIngredients.length > 0 && (
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-card">
                {editIngredients.map((id) => {
                  const ingredient = resolveIngredient(id)
                  if (!ingredient) return null
                  return (
                    <div key={id} className="flex items-center justify-between px-4 py-2.5">
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
                .filter((i) => i.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
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
