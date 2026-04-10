"use client"

import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { HomeScreen } from "@/components/screens/home-screen"
import { UserMenu } from "@/components/user-menu"

const TAB_TO_PATH: Record<string, string> = {
  shopping: "/shopping-list",
  "meal-plan": "/meal-plan",
  recipes: "/recipe",
  inventory: "/inventory",
}

export default function HomePage() {
  const router = useRouter()
  return (
    <>
      <AppHeader
        title="FooCo"
        showLogo
        rightElement={<UserMenu />}
      />
      <HomeScreen onNavigate={(tab) => router.push(TAB_TO_PATH[tab] ?? `/${tab}`)} />
    </>
  )
}
