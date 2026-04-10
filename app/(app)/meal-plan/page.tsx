"use client"

import { useRouter } from "next/navigation"
import { MealPlanScreen } from "@/components/screens/meal-plan-screen"

export default function MealPlanPage() {
  const router = useRouter()
  return <MealPlanScreen onBack={() => router.push("/home")} />
}
