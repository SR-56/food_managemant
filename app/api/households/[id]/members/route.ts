import { createClient } from "@/lib/supabase/server"
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

  const { data: targetUser } = await supabase
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

  const { data: existing } = await supabase
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", targetUser.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: "すでにメンバーです" },
      { status: 409 }
    )
  }

  const { error } = await supabase.from("household_members").insert({
    household_id: householdId,
    user_id: targetUser.id,
    role: "member",
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
