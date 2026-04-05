"use client"

import React from "react"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

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
          <Image src="/logo-header.png" width={36} height={36} alt="FooCo ロゴ" />
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
