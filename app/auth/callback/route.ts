import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  // TODO: Supabase接続時にcodeとセッション交換を実装
  // const code = requestUrl.searchParams.get("code")
  // if (code) { await supabase.auth.exchangeCodeForSession(code) }
  return NextResponse.redirect(new URL("/home", requestUrl.origin))
}
