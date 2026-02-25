"use client"

import { useState, useMemo } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AppHeader } from "@/components/app-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ingredients as initialIngredients,
  type Ingredient,
  type IngredientCategory,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

type FilterOption = "all" | "in-stock" | "out-of-stock"

interface InventoryScreenProps {
  onBack: () => void
}

const categoryOrder: IngredientCategory[] = ["野菜", "肉類", "魚類", "調味料", "その他"]

const filterLabels: Record<FilterOption, string> = {
  all: "すべて",
  "in-stock": "在庫あり",
  "out-of-stock": "在庫なし",
}

export function InventoryScreen({ onBack }: InventoryScreenProps) {
  const [items, setItems] = useState<Ingredient[]>(initialIngredients)
  const [filter, setFilter] = useState<FilterOption>("all")
  const [searchQuery, setSearchQuery] = useState("")

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

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="在庫管理"
        showBack
        onBack={onBack}
        rightElement={
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
