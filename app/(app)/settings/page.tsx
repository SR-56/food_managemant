"use client"

import { useRouter } from "next/navigation"
import { SettingsScreen } from "@/components/screens/settings-screen"

export default function SettingsPage() {
  const router = useRouter()
  return (
    <SettingsScreen
      onBack={() => router.push("/home")}
      onLogout={() => router.push("/login")}
    />
  )
}
