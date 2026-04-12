import type { Ingredient } from "@/lib/types"

export function parseIngredientsFromText(
  text: string,
  master: Ingredient[]
): Array<{ id: string | null; name: string }> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const result: Array<{ id: string | null; name: string }> = []
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()

  for (const line of lines) {
    const cleaned = line
      .replace(/[（(].*?[）)]/g, "")
      .replace(/\d+(\.\d+)?[\s]*(g|kg|ml|L|l|個|本|枚|袋|缶|大さじ|小さじ|カップ|合|切れ|尾|匹|羽|頭|玉|束|房|株)?/g, "")
      .replace(/[：:・…]+/g, "")
      .trim()

    if (!cleaned || cleaned.length < 2) continue

    const matched = master.find(
      (i) => i.name === cleaned || i.name.includes(cleaned) || cleaned.includes(i.name)
    )

    if (matched) {
      if (!seenIds.has(matched.id)) {
        seenIds.add(matched.id)
        result.push({ id: matched.id, name: matched.name })
      }
    } else {
      if (!seenNames.has(cleaned)) {
        seenNames.add(cleaned)
        result.push({ id: null, name: cleaned })
      }
    }
  }

  return result
}
