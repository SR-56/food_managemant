"use client"

import { useState } from "react"
import { Plus, X, ChevronLeft, ChevronRight, Search, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  mealPlans as initialMealPlans,
  recipes,
  getRecipeById,
  getIngredientById,
  dayNames,
  type MealPlan,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface MealPlanScreenProps {
  onBack: () => void
}

export function MealPlanScreen({ onBack }: MealPlanScreenProps) {
  const [plans, setPlans] = useState<MealPlan[]>(initialMealPlans)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectingDate, setSelectingDate] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // "献立完了" dialog state
  const [completingDate, setCompletingDate] = useState<string | null>(null)
  const [completingChecked, setCompletingChecked] = useState<Record<string, boolean>>({})
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())

  const today = new Date("2026-02-13")
  const baseDate = new Date("2026-02-09")

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i + weekOffset * 7)
    return d
  })

  const getWeekLabel = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
  }

  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const getPlanForDate = (dateKey: string) => {
    return plans.find((p) => p.date === dateKey)
  }

  const isPastDate = (date: Date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const t = new Date(today)
    t.setHours(0, 0, 0, 0)
    return d < t
  }

  const handleSelectRecipe = (recipeId: string) => {
    if (!selectingDate) return
    setPlans((prev) => {
      const existing = prev.findIndex((p) => p.date === selectingDate)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], recipeId }
        return updated
      }
      return [...prev, { date: selectingDate, recipeId }]
    })
    setSelectingDate(null)
    setSearchQuery("")
  }

  const handleRemoveRecipe = (dateKey: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.date === dateKey ? { ...p, recipeId: null } : p))
    )
  }

  // Open "献立完了" dialog
  const handleOpenComplete = (dateKey: string, recipeId: string) => {
    const recipe = getRecipeById(recipeId)
    if (!recipe) return
    const initialChecked: Record<string, boolean> = {}
    for (const ingId of recipe.ingredients) {
      initialChecked[ingId] = true // default all checked
    }
    setCompletingChecked(initialChecked)
    setCompletingDate(dateKey)
  }

  const handleConfirmComplete = () => {
    // In a real app, mark checked ingredients as "out of stock"
    if (completingDate) {
      setCompletedDates((prev) => new Set(prev).add(completingDate))
    }
    setCompletingDate(null)
    setCompletingChecked({})
  }

  const completingRecipe = (() => {
    if (!completingDate) return null
    const plan = getPlanForDate(completingDate)
    return plan?.recipeId ? getRecipeById(plan.recipeId) : null
  })()

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="献立カレンダー"
        showBack
        onBack={onBack}
        rightElement={
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-accent"
            aria-label="献立を追加"
            onClick={() => {
              const todayKey = formatDateKey(new Date("2026-02-09"))
              setSelectingDate(todayKey)
            }}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* Week Switcher */}
      <div className="flex items-center justify-between bg-card px-4 py-3">
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="先週"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{getWeekLabel()}</p>
          {weekOffset === 0 && (
            <p className="text-xs text-primary">今週</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="来週"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex flex-col gap-3">
          {weekDates.map((date) => {
            const dateKey = formatDateKey(date)
            const plan = getPlanForDate(dateKey)
            const recipe = plan?.recipeId ? getRecipeById(plan.recipeId) : null
            const isSaturday = date.getDay() === 6
            const past = isPastDate(date)
            const isCompleted = completedDates.has(dateKey)

            return (
              <div
                key={dateKey}
                className={cn(
                  "rounded-xl border border-border bg-card p-4",
                  isSaturday && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isSaturday ? "text-primary" : "text-foreground"
                    )}
                  >
                    {dayNames[date.getDay()]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {date.getMonth() + 1}/{date.getDate()}
                  </span>
                  {isSaturday && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      買い物日
                    </span>
                  )}
                  {isCompleted && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      完了
                    </span>
                  )}
                </div>

                {recipe ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2.5">
                      <span className="text-sm font-medium text-foreground">
                        {recipe.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipe(dateKey)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                        aria-label={`${recipe.name}を削除`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {past && !isCompleted && plan?.recipeId && (
                      <button
                        type="button"
                        onClick={() => handleOpenComplete(dateKey, plan.recipeId!)}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/5 text-sm font-medium text-success transition-colors hover:bg-success/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        献立完了
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectingDate(dateKey)}
                    className="flex h-11 w-full items-center justify-center rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    レシピを追加
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Recipe Selection Dialog */}
      <Dialog
        open={selectingDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectingDate(null)
            setSearchQuery("")
          }
        }}
      >
        <DialogContent className="max-h-[80dvh] max-w-[90vw] overflow-hidden rounded-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">レシピを選択</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="レシピ名で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 text-foreground"
            />
          </div>
          <div className="max-h-[50dvh] overflow-y-auto">
            <div className="flex flex-col gap-1">
              {filteredRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => handleSelectRecipe(recipe.id)}
                  className="flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-medium text-foreground">{recipe.name}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Completion Dialog */}
      <Dialog
        open={completingDate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCompletingDate(null)
            setCompletingChecked({})
          }
        }}
      >
        <DialogContent className="max-h-[80dvh] max-w-[90vw] overflow-hidden rounded-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">使い切った食材を選んでください</DialogTitle>
          </DialogHeader>
          {completingRecipe && (
            <div className="max-h-[50dvh] overflow-y-auto">
              <p className="mb-3 text-sm text-muted-foreground">
                {completingRecipe.name} の食材
              </p>
              <div className="flex flex-col gap-1">
                {completingRecipe.ingredients.map((ingId) => {
                  const ingredient = getIngredientById(ingId)
                  if (!ingredient) return null
                  return (
                    <label
                      key={ingId}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        checked={completingChecked[ingId] ?? false}
                        onCheckedChange={(checked) => {
                          setCompletingChecked((prev) => ({
                            ...prev,
                            [ingId]: !!checked,
                          }))
                        }}
                        className="h-5 w-5"
                        aria-label={`${ingredient.name}を選択`}
                      />
                      <span className="text-sm text-foreground">{ingredient.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCompletingDate(null)
                setCompletingChecked({})
              }}
              className="h-11"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirmComplete}
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              完了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
