import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id, role, households(id, name, shopping_day)")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!memberRecord) {
    return NextResponse.json({ error: "No household" }, { status: 404 })
  }

  const household = memberRecord.households as unknown as { id: string; name: string; shopping_day: number }

  const { data: memberRows } = await supabase
    .from("household_members")
    .select("user_id, role, users(id, name, email)")
    .eq("household_id", household.id)
    .is("deleted_at", null)

  const members = (memberRows ?? []).map((row) => {
    const u = row.users as unknown as { id: string; name: string; email: string }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: row.role,
      isCurrentUser: u.id === user.id,
    }
  })

  return NextResponse.json({ household, members })
}
