import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/home"

  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (data.user) {
      const { data: existing } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", data.user.id)
        .is("deleted_at", null)
        .maybeSingle()

      if (!existing) {
        const userName =
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          "ユーザー"
        const { data: household } = await supabase
          .from("households")
          .insert({ name: `${userName}の家庭` })
          .select("id")
          .single()

        if (household) {
          await supabase.from("household_members").insert({
            user_id: data.user.id,
            household_id: household.id,
            role: "owner",
          })
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
