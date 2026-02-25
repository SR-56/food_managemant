"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Settings, LogOut, User } from "lucide-react"
import { LoginScreen } from "@/components/screens/login-screen"
import { HomeScreen } from "@/components/screens/home-screen"
import { ShoppingListScreen } from "@/components/screens/shopping-list-screen"
import { MealPlanScreen } from "@/components/screens/meal-plan-screen"
import { RecipeScreen } from "@/components/screens/recipe-screen"
import { InventoryScreen } from "@/components/screens/inventory-screen"
import { SettingsScreen } from "@/components/screens/settings-screen"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"

function UserMenu({
  onSettings,
  onLogout,
}: {
  onSettings: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="ユーザーメニュー"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="max-w-[100px] truncate text-xs">田中家</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">田中太郎</p>
            <p className="text-xs text-muted-foreground">taro@example.com</p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSettings()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              設定
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [showSettings, setShowSettings] = useState(false)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  if (showSettings) {
    return (
      <SettingsScreen
        onBack={() => setShowSettings(false)}
        onLogout={() => {
          setIsLoggedIn(false)
          setShowSettings(false)
          setActiveTab("home")
        }}
      />
    )
  }

  // Sub-screens that have their own header and layout
  if (activeTab === "shopping") {
    return <ShoppingListScreen onBack={() => setActiveTab("home")} />
  }

  if (activeTab === "meal-plan") {
    return <MealPlanScreen onBack={() => setActiveTab("home")} />
  }

  if (activeTab === "recipes") {
    return <RecipeScreen onBack={() => setActiveTab("home")} />
  }

  if (activeTab === "inventory") {
    return <InventoryScreen onBack={() => setActiveTab("home")} />
  }

  // Home screen with bottom nav
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader
        title="FooCo"
        showLogo
        rightElement={
          <UserMenu
            onSettings={() => setShowSettings(true)}
            onLogout={() => {
              setIsLoggedIn(false)
              setActiveTab("home")
            }}
          />
        }
      />
      <HomeScreen onNavigate={setActiveTab} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
