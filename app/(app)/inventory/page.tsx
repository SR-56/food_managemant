"use client"

import { useRouter } from "next/navigation"
import { InventoryScreen } from "@/components/screens/inventory-screen"

export default function InventoryPage() {
  const router = useRouter()
  return <InventoryScreen onBack={() => router.push("/home")} />
}
