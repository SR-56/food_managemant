import { redirect } from "next/navigation"

export default function MarketingPage() {
  // TODO: Supabase接続後にセッションチェックを実装し、未ログインならLPを表示、ログイン済みなら/homeへ
  redirect("/login")
}
