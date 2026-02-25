"use client"

import { Home, ShoppingCart, Calendar, BookOpen, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "home", label: "ホーム", icon: Home },
  { id: "shopping", label: "買い物", icon: ShoppingCart },
  { id: "meal-plan", label: "献立", icon: Calendar },
  { id: "recipes", label: "レシピ", icon: BookOpen },
  { id: "inventory", label: "在庫", icon: Package },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
