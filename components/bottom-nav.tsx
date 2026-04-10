"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, ShoppingCart, Calendar, BookOpen, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "home", label: "ホーム", icon: Home, path: "/home" },
  { id: "shopping", label: "買い物", icon: ShoppingCart, path: "/shopping-list" },
  { id: "meal-plan", label: "献立", icon: Calendar, path: "/meal-plan" },
  { id: "recipes", label: "レシピ", icon: BookOpen, path: "/recipe" },
  { id: "inventory", label: "在庫", icon: Package, path: "/inventory" },
]

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card"
      role="navigation"
      aria-label="メインナビゲーション"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.path
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => router.push(item.path)}
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
