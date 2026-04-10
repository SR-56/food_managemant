import { BottomNav } from "@/components/bottom-nav"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Supabase接続後にセッションチェックを実装し、未ログインなら/loginへリダイレクト
  return (
    <div className="flex min-h-dvh flex-col bg-background pb-16">
      {children}
      <BottomNav />
    </div>
  )
}
