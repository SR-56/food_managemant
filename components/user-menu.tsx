"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Settings, LogOut } from "lucide-react"

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
                router.push("/settings")
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
                router.push("/login")
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
