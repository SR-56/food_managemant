"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Settings, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

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

  const handleLogout = async () => {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? ""
  const email = user?.email ?? ""

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
        {/* 家庭名は #23 で実装予定 */}
        <span className="max-w-[100px] truncate text-xs">マイホーム</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push("/settings")
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              設定
            </button>
            <button
              type="button"
              onClick={handleLogout}
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
