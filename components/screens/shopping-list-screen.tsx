"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { getShoppingList, type ShoppingItem, type IngredientCategory } from "@/lib/mock-data"

interface ShoppingListScreenProps {
  onBack: () => void
}

const categoryOrder: IngredientCategory[] = ["野菜", "肉類", "魚類", "調味料", "その他"]

export function ShoppingListScreen({ onBack }: ShoppingListScreenProps) {
  const [items, setItems] = useState<ShoppingItem[]>(() => getShoppingList())
  const [completed, setCompleted] = useState(false)

  const groupedItems = useMemo(() => {
    const groups = new Map<IngredientCategory, ShoppingItem[]>()
    for (const item of items) {
      const existing = groups.get(item.category) ?? []
      existing.push(item)
      groups.set(item.category, existing)
    }
    return categoryOrder
      .filter((cat) => groups.has(cat))
      .map((cat) => ({ category: cat, items: groups.get(cat)! }))
  }, [items])

  const checkedCount = items.filter((i) => i.checked).length

  const toggleItem = (ingredientId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId
          ? { ...item, checked: !item.checked }
          : item
      )
    )
  }

  const handleComplete = () => {
    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader title="買い物リスト" showBack onBack={onBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">買い物完了!</h2>
          <p className="text-center text-sm text-muted-foreground">
            {checkedCount}品目の在庫を更新しました
          </p>
          <Button
            onClick={onBack}
            className="mt-4 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="買い物リスト"
        showBack
        onBack={onBack}
        rightElement={
          <span className="text-xs text-muted-foreground">2026/02/08 土</span>
        }
      />

      {/* Period Display */}
      <div className="bg-card px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          今週の買い物（2/8 - 2/14）
        </p>
        <p className="text-xs text-muted-foreground">
          {checkedCount}/{items.length} 品目チェック済み
        </p>
      </div>

      {/* Shopping List */}
      <main className="flex-1 overflow-y-auto pb-24">
        {groupedItems.map((group) => (
          <div key={group.category}>
            <div className="sticky top-0 z-10 bg-background px-4 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </h2>
            </div>
            <div className="flex flex-col">
              {group.items.map((item) => (
                <label
                  key={item.ingredientId}
                  className="flex cursor-pointer items-center gap-4 bg-card px-4 py-3.5 transition-colors hover:bg-accent"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item.ingredientId)}
                    className="h-6 w-6 rounded-md border-2"
                    aria-label={`${item.ingredientName}をチェック`}
                  />
                  <div className="flex-1">
                    <p
                      className={
                        item.checked
                          ? "text-sm font-medium text-muted-foreground line-through"
                          : "text-sm font-medium text-foreground"
                      }
                    >
                      {item.ingredientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.reason} で使用
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Fixed Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="h-14 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
              disabled={checkedCount === 0}
            >
              買い物完了 ({checkedCount}品目)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">買い物を完了しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                チェックした {checkedCount} 品目の食材の在庫を更新します。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11">キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleComplete}
                className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                完了
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
