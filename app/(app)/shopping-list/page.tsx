"use client"

import { useRouter } from "next/navigation"
import { ShoppingListScreen } from "@/components/screens/shopping-list-screen"

export default function ShoppingListPage() {
  const router = useRouter()
  return <ShoppingListScreen onBack={() => router.push("/home")} />
}
