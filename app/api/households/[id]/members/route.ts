import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: householdId } = await params
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 操作者が対象家庭のメンバーであることを確認（認可チェック）
  const { data: authCheck } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!authCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 招待先ユーザーをメールアドレスで検索（RLSバイパス）
  const { data: targetUser } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (!targetUser) {
    return NextResponse.json(
      { error: "このメールアドレスのユーザーが見つかりません" },
      { status: 404 }
    )
  }

  // 重複チェック
  const { data: existing } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", targetUser.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "すでにメンバーです" }, { status: 409 })
  }

  // adminクライアントでINSERT（RLSの再帰評価を回避）
  const { error } = await admin.from("household_members").insert({
    household_id: householdId,
    user_id: targetUser.id,
    role: "member",
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
