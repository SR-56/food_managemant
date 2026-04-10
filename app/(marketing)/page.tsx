import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Calendar, Package } from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "献立管理",
    description: "週の献立を計画して、食事の準備をスムーズに。",
  },
  {
    icon: ShoppingCart,
    title: "買い物リスト自動生成",
    description: "献立から必要な食材を自動でリストアップ。買い忘れゼロへ。",
  },
  {
    icon: Package,
    title: "在庫管理",
    description: "冷蔵庫の中身を把握して、食材の無駄を減らす。",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <Image
          src="/logo-login.png"
          width={96}
          height={96}
          alt="FooCo ロゴ"
          priority
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            FooCo
          </h1>
          <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
            献立に基づいた買い物リストで、
            <br />
            無駄のない食材管理を。
          </p>
        </div>

        <Link
          href="/login"
          className="flex h-12 min-w-[200px] items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90"
        >
          はじめる
        </Link>
      </main>

      {/* Features */}
      <section className="border-t border-border bg-card px-6 py-12">
        <div className="mx-auto flex max-w-sm flex-col gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {feature.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FooCo
        </p>
      </footer>
    </div>
  )
}
