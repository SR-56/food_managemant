import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/recipes - レシピ一覧（削除済み除く）
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, url, recipe_ingredients(ingredient_id)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const recipes = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url ?? undefined,
    ingredients: (r.recipe_ingredients as { ingredient_id: string }[]).map(
      (ri) => ri.ingredient_id
    ),
  }))

  return NextResponse.json(recipes)
}

// POST /api/recipes - レシピ作成
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, url, ingredients } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (!member) return NextResponse.json({ error: "No household" }, { status: 404 })

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({ name: name.trim(), url: url?.trim() || null, household_id: member.household_id })
    .select("id, name, url")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const ingredientIds: string[] = ingredients ?? []
  if (ingredientIds.length > 0) {
    const { error: riError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientIds.map((id) => ({ recipe_id: recipe.id, ingredient_id: id })))
    if (riError) return NextResponse.json({ error: riError.message }, { status: 400 })
  }

  return NextResponse.json({
    id: recipe.id,
    name: recipe.name,
    url: recipe.url ?? undefined,
    ingredients: ingredientIds,
  })
}
