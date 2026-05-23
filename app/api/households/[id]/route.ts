import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const updates: { name?: string; shopping_day?: number } = {}

  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim()
  }
  if (typeof body.shopping_day === "number") {
    updates.shopping_day = body.shopping_day
  }

  const { data, error } = await supabase
    .from("households")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
