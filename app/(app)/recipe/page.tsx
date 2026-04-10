"use client"

import { useRouter } from "next/navigation"
import { RecipeScreen } from "@/components/screens/recipe-screen"

export default function RecipePage() {
  const router = useRouter()
  return <RecipeScreen onBack={() => router.push("/home")} />
}
