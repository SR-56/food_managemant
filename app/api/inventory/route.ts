import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// GET /api/inventory - 家庭の在庫一覧取得
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("inventory")
    .select("id, in_stock, ingredients(id, name, category, household_id)")
    .order("id")

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST /api/inventory - 食材を在庫に追加
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, category } = await request.json()
  if (!name?.trim() || !category) {
    return NextResponse.json({ error: "name and category are required" }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 家庭IDを取得
  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!member) return NextResponse.json({ error: "No household" }, { status: 404 })

  // グローバルマスタを名前検索
  const { data: globalIngredient } = await admin
    .from("ingredients")
    .select("id")
    .eq("name", name.trim())
    .is("household_id", null)
    .maybeSingle()

  let ingredientId: string

  if (globalIngredient) {
    ingredientId = globalIngredient.id
  } else {
    // 家庭専用食材として新規作成
    const { data: newIngredient, error: ingError } = await supabase
      .from("ingredients")
      .insert({ name: name.trim(), category, household_id: member.household_id })
      .select("id")
      .single()
    if (ingError) return NextResponse.json({ error: ingError.message }, { status: 400 })
    ingredientId = newIngredient.id
  }

  // inventoryに追加（重複時はスキップ）
  const { data, error } = await supabase
    .from("inventory")
    .upsert(
      { household_id: member.household_id, ingredient_id: ingredientId, in_stock: true },
      { onConflict: "household_id,ingredient_id" }
    )
    .select("id, in_stock, ingredients(id, name, category, household_id)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
