"use client"

import { ShoppingCart, Calendar, AlertTriangle, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  mealPlans,
  getRecipeById,
  getOutOfStockIngredients,
  getShoppingList,
  dayNames,
} from "@/lib/mock-data"

interface HomeScreenProps {
  onNavigate: (tab: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const shoppingList = getShoppingList()
  const outOfStock = getOutOfStockIngredients()

  const weekDays = mealPlans.map((plan) => {
    const d = new Date(plan.date)
    const recipe = plan.recipeId ? getRecipeById(plan.recipeId) : null
    return {
      day: dayNames[d.getDay()],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      recipeName: recipe?.name ?? null,
    }
  })

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Shopping List Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-foreground">
              今週の買い物リスト（土曜日）
            </CardTitle>
            <p className="text-sm text-muted-foreground">2/8 - 2/14</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-2xl font-bold text-foreground">
            {shoppingList.length}
            <span className="ml-1 text-sm font-normal text-muted-foreground">品目</span>
          </p>
          <Button
            onClick={() => onNavigate("shopping")}
            className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            リストを見る
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Meal Plan Summary Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="flex-1 text-base font-semibold text-foreground">
            今週の献立
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {weekDays.map((day) => (
              <div
                key={day.date}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent"
              >
                <span className="w-16 text-sm font-medium text-muted-foreground">
                  {day.day} {day.date}
                </span>
                <span
                  className={
                    day.recipeName
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {day.recipeName ?? "-"}
                </span>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate("meal-plan")}
            className="mt-3 h-10 w-full text-sm font-medium"
          >
            献立を編集
          </Button>
        </CardContent>
      </Card>

      {/* Out of Stock Alert Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-foreground">
              在庫切れの食材
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {outOfStock.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent"
              >
                <span className="text-sm text-foreground">{item.name}</span>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  在庫なし
                </span>
              </div>
            ))}
          </div>
          {outOfStock.length > 5 && (
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              すべて見る ({outOfStock.length}件)
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
