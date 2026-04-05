"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface LoginScreenProps {
  onLogin: () => void
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = () => {
    setError("")
    setIsLoading(true)
    // Prototype: simulate a brief loading then log in
    setTimeout(() => {
      setIsLoading(false)
      onLogin()
    }, 800)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-[90%] max-w-[400px] border-border shadow-lg">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8">
          <Image src="/logo-login.png" width={128} height={128} alt="FooCo ロゴ" />
          <h1 className="text-2xl font-bold text-foreground">FooCo</h1>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            献立に基づいた買い物リストで、
            <br />
            無駄のない食材管理
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-6 pb-8 pt-4">
          {error && (
            <div
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent disabled:opacity-60"
          >
            {isLoading ? (
              <span className="text-muted-foreground">ログイン中...</span>
            ) : (
              <>
                <GoogleIcon className="h-5 w-5" />
                <span>Google でログイン</span>
              </>
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
