import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// GET /api/ingredients - 全食材一覧（グローバルマスタ＋家庭専用）と在庫状態
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!member) return NextResponse.json({ error: "No household" }, { status: 404 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [ingredientsRes, inventoryRes] = await Promise.all([
    admin
      .from("ingredients")
      .select("id, name, category")
      .or(`household_id.is.null,household_id.eq.${member.household_id}`)
      .order("name"),
    supabase.from("inventory").select("ingredient_id, in_stock"),
  ])

  if (ingredientsRes.error) {
    return NextResponse.json({ error: ingredientsRes.error.message }, { status: 400 })
  }

  const inventoryMap = new Map(
    (inventoryRes.data ?? []).map((i) => [i.ingredient_id, i.in_stock])
  )

  const result = (ingredientsRes.data ?? []).map((ing) => ({
    id: ing.id,
    name: ing.name,
    category: ing.category,
    inStock: inventoryMap.get(ing.id) ?? false,
  }))

  return NextResponse.json(result)
}
