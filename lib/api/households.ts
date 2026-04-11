import { householdMembers } from "@/lib/mock-data"
import type { HouseholdMember } from "@/lib/types"

export function getHouseholdMembers(): HouseholdMember[] {
  return householdMembers
}
