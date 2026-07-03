import * as fs from "fs"
import * as path from "path"
import type { Lead } from "./types"

export function loadLeadsJson(filePath: string): Lead[] {
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

export function saveLeads(leads: Lead[], dataDir: string): void {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  fs.writeFileSync(
    path.join(dataDir, "leads.json"),
    JSON.stringify(leads, null, 2),
    "utf-8",
  )

  const ts = `// Auto-generated — do not edit manually
// Updated: ${new Date().toISOString()} | Leads: ${leads.length}

import type { Lead } from "@/lib/types"
export type { Lead }

export const leads: Lead[] = ${JSON.stringify(leads, null, 2)}
`
  fs.writeFileSync(path.join(dataDir, "leads.ts"), ts, "utf-8")

  process.stdout.write(`  💾 Saved ${leads.length} leads\n`)
}
