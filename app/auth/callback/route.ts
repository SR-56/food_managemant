import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/home"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      await supabase.from("users").upsert(
        {
          id: data.user.id,
          display_name: data.user.user_metadata?.full_name ?? data.user.email ?? "",
          profile_image_url: data.user.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "id" }
      )
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
