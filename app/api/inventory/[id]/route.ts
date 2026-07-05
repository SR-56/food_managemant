import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// PATCH /api/inventory/[id] - in_stock更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { in_stock } = await request.json()
  if (typeof in_stock !== "boolean") {
    return NextResponse.json({ error: "in_stock must be boolean" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("inventory")
    .update({ in_stock, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE /api/inventory/[id] - 在庫から削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // inventoryレコードを取得して家庭専用食材か確認
  const { data: inv } = await supabase
    .from("inventory")
    .select("ingredient_id, ingredients(household_id)")
    .eq("id", id)
    .single()

  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // inventoryを削除
  const { error } = await supabase.from("inventory").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 家庭専用食材ならingredientsも削除
  const ingredient = inv.ingredients as unknown as { household_id: string | null }
  if (ingredient?.household_id !== null) {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from("ingredients").delete().eq("id", inv.ingredient_id)
  }

  return NextResponse.json({ success: true })
}
