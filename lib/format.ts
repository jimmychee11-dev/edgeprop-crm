import type { Lead } from "./types"

export function formatDealValue(totalMillions: number): string {
  if (totalMillions >= 1000) return `$${(totalMillions / 1000).toFixed(1)}B`
  return `$${totalMillions.toFixed(0)}M`
}

export function countBySector(leads: Lead[]): Record<string, number> {
  return leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.sector] = (acc[l.sector] || 0) + 1
    return acc
  }, {})
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}
