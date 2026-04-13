"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AppHeader } from "@/components/app-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getIngredients } from "@/lib/api/ingredients"
import type { Ingredient, IngredientCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import { categoryOrder } from "@/lib/constants"

type FilterOption = "all" | "in-stock" | "out-of-stock"

interface InventoryScreenProps {
  onBack: () => void
}

const filterLabels: Record<FilterOption, string> = {
  all: "すべて",
  "in-stock": "在庫あり",
  "out-of-stock": "在庫なし",
}

export function InventoryScreen({ onBack }: InventoryScreenProps) {
  const [items, setItems] = useState<Ingredient[]>(getIngredients)
  const [filter, setFilter] = useState<FilterOption>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState<IngredientCategory>("野菜")
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)

  const filteredItems = useMemo(() => {
    let filtered = items

    if (searchQuery) {
      filtered = filtered.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filter === "in-stock") {
      filtered = filtered.filter((i) => i.inStock)
    } else if (filter === "out-of-stock") {
      filtered = filtered.filter((i) => !i.inStock)
    }

    return filtered
  }, [items, filter, searchQuery])

  const groupedItems = useMemo(() => {
    const groups = new Map<IngredientCategory, Ingredient[]>()
    for (const item of filteredItems) {
      const existing = groups.get(item.category) ?? []
      existing.push(item)
      groups.set(item.category, existing)
    }
    return categoryOrder
      .filter((cat) => groups.has(cat))
      .map((cat) => ({ category: cat, items: groups.get(cat)! }))
  }, [filteredItems])

  const toggleStock = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inStock: !item.inStock } : item
      )
    )
  }

  const handleAddIngredient = () => {
    if (!newName.trim()) return
    const newItem: Ingredient = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      inStock: true,
    }
    setItems((prev) => [...prev, newItem])
    setNewName("")
    setNewCategory("野菜")
    setAddDialogOpen(false)
  }

  const handleDeleteIngredient = () => {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="在庫管理"
        showBack
        onBack={onBack}
        rightElement={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAddDialogOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-accent"
              aria-label="食材を追加"
            >
              <Plus className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-accent",
                    filter !== "all" ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-label="フィルター"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.entries(filterLabels) as [FilterOption, string][]).map(
                  ([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        "text-sm",
                        filter === key && "font-semibold text-primary"
                      )}
                    >
                      {label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="食材名で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10 text-foreground"
          />
        </div>
        {filter !== "all" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {filterLabels[filter]}
            </span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* Inventory List */}
      <main className="flex-1 overflow-y-auto pb-20">
        {groupedItems.map((group) => (
          <div key={group.category}>
            <div className="sticky top-0 z-10 bg-background px-4 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.category}
              </h2>
            </div>
            <div className="flex flex-col">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-card px-4 py-3"
                >
                  <span className="text-sm text-foreground">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs",
                        item.inStock ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.inStock ? "あり" : "なし"}
                    </span>
                    <Switch
                      checked={item.inStock}
                      onCheckedChange={() => toggleStock(item.id)}
                      aria-label={`${item.name}の在庫状態を切り替え`}
                    />
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                      aria-label={`${item.name}を削除`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Add Ingredient Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">食材を追加</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="newIngredientName" className="text-sm font-medium text-foreground">
                食材名
              </Label>
              <Input
                id="newIngredientName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: ブロッコリー"
                className="h-12 text-foreground"
                onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">カテゴリ</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as IngredientCategory)}>
                <SelectTrigger className="h-12 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOrder.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false)
                setNewName("")
                setNewCategory("野菜")
              }}
              className="h-11 flex-1 bg-transparent"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddIngredient}
              disabled={!newName.trim()}
              className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">食材を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteIngredient}
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
