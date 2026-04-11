import { getShoppingList as _getShoppingList } from "@/lib/mock-data"
import type { ShoppingItem } from "@/lib/types"

export function getShoppingList(): ShoppingItem[] {
  return _getShoppingList()
}
