import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH /api/recipes/[id] - レシピ更新（名前・URL・食材を全置換）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { name, url, ingredients } = await request.json()

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const { data: recipe, error } = await supabase
    .from("recipes")
    .update({ name: name.trim(), url: url?.trim() || null })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, name, url")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // recipe_ingredients を全削除→再INSERT
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", id)

  const ingredientIds: string[] = ingredients ?? []
  if (ingredientIds.length > 0) {
    const { error: riError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientIds.map((ingId) => ({ recipe_id: id, ingredient_id: ingId })))
    if (riError) return NextResponse.json({ error: riError.message }, { status: 400 })
  }

  return NextResponse.json({
    id: recipe.id,
    name: recipe.name,
    url: recipe.url ?? undefined,
    ingredients: ingredientIds,
  })
}

// DELETE /api/recipes/[id] - ソフトデリート（deleted_at をセット）
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
