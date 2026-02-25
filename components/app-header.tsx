"use client"

import React from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

function BreadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="38" rx="24" ry="16" fill="hsl(33, 41%, 59%)" />
      <ellipse cx="32" cy="34" rx="22" ry="14" fill="hsl(33, 50%, 72%)" />
      <path d="M14 34c0-8 8-18 18-18s18 10 18 18" stroke="hsl(33, 41%, 49%)" strokeWidth="2" fill="hsl(33, 55%, 78%)" />
    </svg>
  )
}

interface AppHeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightElement?: React.ReactNode
  showLogo?: boolean
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  rightElement,
  showLogo = false,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-card px-4">
      <div className="flex min-w-[44px] items-center">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg",
              "text-foreground hover:bg-accent"
            )}
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : showLogo ? (
          <BreadIcon className="h-7 w-7" />
        ) : null}
      </div>
      <h1 className="flex-1 text-center text-base font-semibold text-foreground">
        {title}
      </h1>
      <div className="flex min-w-[44px] items-center justify-end">
        {rightElement}
      </div>
    </header>
  )
}
