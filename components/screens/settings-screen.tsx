"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Users, ChevronRight, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppHeader } from "@/components/app-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createClient } from "@/lib/supabase/client"

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

interface Member {
  id: string
  name: string
  email: string
  role: string
  isCurrentUser: boolean
}

interface Household {
  id: string
  name: string
  shopping_day: number
}

interface SettingsScreenProps {
  onBack: () => void
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const router = useRouter()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState("")
  const [editingShoppingDay, setEditingShoppingDay] = useState(false)
  const [tempShoppingDay, setTempShoppingDay] = useState(6)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [addMemberError, setAddMemberError] = useState("")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    fetch("/api/households/me")
      .then((r) => r.json())
      .then(({ household, members }) => {
        if (household) {
          setHousehold(household)
          setMembers(members ?? [])
        }
      })
  }, [])

  const currentUser = members.find((m) => m.isCurrentUser)

  const handleSaveName = async () => {
    if (!household || !tempName.trim()) return
    const res = await fetch(`/api/households/${household.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tempName.trim() }),
    })
    if (res.ok) {
      setHousehold((prev) => prev ? { ...prev, name: tempName.trim() } : prev)
    }
    setEditingName(false)
  }

  const handleSaveShoppingDay = async () => {
    if (!household) return
    const res = await fetch(`/api/households/${household.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopping_day: tempShoppingDay }),
    })
    if (res.ok) {
      setHousehold((prev) => prev ? { ...prev, shopping_day: tempShoppingDay } : prev)
    }
    setEditingShoppingDay(false)
  }

  const handleAddMember = async () => {
    if (!household || !newMemberEmail.trim()) return
    setAddMemberError("")
    const res = await fetch(`/api/households/${household.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newMemberEmail.trim() }),
    })
    if (res.ok) {
      const refreshed = await fetch("/api/households/me").then((r) => r.json())
      setMembers(refreshed.members ?? [])
      setNewMemberEmail("")
      setShowAddMember(false)
    } else {
      const { error } = await res.json()
      setAddMemberError(error ?? "追加に失敗しました")
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader title="設定" showBack onBack={onBack} />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Account Section */}
        <div className="px-4 py-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            アカウント
          </h2>
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {currentUser?.name ?? "ユーザー"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Household Info Section */}
        <div className="px-4 py-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            家庭情報
          </h2>
          <div className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => {
                setTempName(household?.name ?? "")
                setEditingName(true)
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-xs text-muted-foreground">家庭名</p>
                <p className="text-sm font-medium text-foreground">
                  {household?.name ?? "読み込み中..."}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTempShoppingDay(household?.shopping_day ?? 6)
                setEditingShoppingDay(true)
              }}
              className="flex w-full items-center justify-between border-t border-border px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-xs text-muted-foreground">買い物日</p>
                <p className="text-sm font-medium text-foreground">
                  毎週{WEEKDAYS[household?.shopping_day ?? 6]}曜日
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Household Members Section */}
        <div className="px-4 py-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            家庭メンバー
          </h2>
          <div className="rounded-xl border border-border bg-card">
            {members.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  index < members.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                {member.isCurrentUser && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    あなた
                  </span>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setAddMemberError("")
                setShowAddMember(true)
              }}
              className="flex w-full items-center justify-center border-t border-border px-4 py-3 text-sm font-medium text-primary hover:bg-accent"
            >
              + メンバーを追加
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 py-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            その他
          </h2>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5"
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </button>
        </div>
      </main>

      {/* Edit Household Name Dialog */}
      <Dialog open={editingName} onOpenChange={setEditingName}>
        <DialogContent className="max-w-[90vw] rounded-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">家庭名を編集</DialogTitle>
          </DialogHeader>
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="h-12 text-foreground"
            placeholder="家庭名を入力"
          />
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingName(false)}
              className="h-11 flex-1 bg-transparent"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveName}
              className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shopping Day Dialog */}
      <Dialog open={editingShoppingDay} onOpenChange={setEditingShoppingDay}>
        <DialogContent className="max-w-[90vw] rounded-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">買い物日を設定</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => setTempShoppingDay(i)}
                className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  tempShoppingDay === i
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:bg-accent"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingShoppingDay(false)}
              className="h-11 flex-1 bg-transparent"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveShoppingDay}
              className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-[90vw] rounded-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">メンバーを追加</DialogTitle>
            <DialogDescription>
              Google アカウントのメールアドレスを入力してください
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="h-12 text-foreground"
            placeholder="member@gmail.com"
          />
          {addMemberError && (
            <p className="text-sm text-destructive">{addMemberError}</p>
          )}
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMember(false)
                setNewMemberEmail("")
                setAddMemberError("")
              }}
              className="h-11 flex-1 bg-transparent"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!newMemberEmail.trim()}
              className="h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              ログアウトしますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              再度ログインするにはGoogleアカウントで認証が必要です。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ログアウト
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
