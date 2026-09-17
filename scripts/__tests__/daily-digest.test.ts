import { describe, it, expect, beforeEach, afterEach } from "vitest"
import * as fs from "fs"
import * as path from "path"
import {
  badge,
  buildEmailHtml,
  loadEnv,
  getNewLeads,
  SECTOR_COLOR,
  INTENT_COLOR,
} from "../daily-digest"

// ── badge() ───────────────────────────────────────────────────────────────────

describe("badge", () => {
  it("wraps text in a styled span with the given color", () => {
    const result = badge("BUY", "#16a34a")
    expect(result).toContain("BUY")
    expect(result).toContain("#16a34a")
    expect(result).toMatch(/^<span /)
    expect(result).toMatch(/<\/span>$/)
  })

  it("applies color to both background (with alpha) and text", () => {
    const result = badge("SELL", "#dc2626")
    expect(result).toContain("background:#dc262622")
    expect(result).toContain("color:#dc2626")
  })

  it("handles empty text", () => {
    const result = badge("", "#000000")
    expect(result).toContain("></span>")
  })

  it("includes pill styling (border-radius)", () => {
    const result = badge("Test", "#333")
    expect(result).toContain("border-radius:9999px")
  })
})

// ── SECTOR_COLOR / INTENT_COLOR ───────────────────────────────────────────────

describe("color maps", () => {
  it("SECTOR_COLOR has entries for all major sectors", () => {
    expect(SECTOR_COLOR).toHaveProperty("Industrial")
    expect(SECTOR_COLOR).toHaveProperty("Hotel")
    expect(SECTOR_COLOR).toHaveProperty("Office")
    expect(SECTOR_COLOR).toHaveProperty("Shophouse")
    expect(SECTOR_COLOR).toHaveProperty("Commercial")
    expect(SECTOR_COLOR).toHaveProperty("Retail")
    expect(SECTOR_COLOR).toHaveProperty("Mixed")
    expect(SECTOR_COLOR).toHaveProperty("International")
  })

  it("INTENT_COLOR has entries for all intents", () => {
    expect(INTENT_COLOR).toHaveProperty("BUY")
    expect(INTENT_COLOR).toHaveProperty("SELL")
    expect(INTENT_COLOR).toHaveProperty("BROKER")
    expect(INTENT_COLOR).toHaveProperty("JV")
    expect(INTENT_COLOR).toHaveProperty("BID")
    expect(INTENT_COLOR).toHaveProperty("ADVISORY")
    expect(INTENT_COLOR).toHaveProperty("REDEVELOP")
    expect(INTENT_COLOR).toHaveProperty("LEASE")
    expect(INTENT_COLOR).toHaveProperty("LAUNCH")
  })

  it("all color values are valid hex colors", () => {
    for (const color of Object.values(SECTOR_COLOR)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
    for (const color of Object.values(INTENT_COLOR)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

// ── buildEmailHtml() ──────────────────────────────────────────────────────────

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 1,
    date: "2026-07-01",
    articleTitle: "Test Article",
    company: "Test Corp",
    person: "John Doe",
    role: "Marketing Agent",
    intent: "BROKER",
    property: "123 Test Street",
    sector: "Shophouse",
    valueNum: 10,
    value: "$10M",
    phone: "91234567",
    email: "john@test.com",
    sourceUrl: "https://example.com/article",
    notes: "A test lead",
    ...overrides,
  }
}

type Lead = {
  id: number; date: string; articleTitle: string; company: string
  person: string; role: string; intent: string; property: string
  sector: string; valueNum: number; value: string; phone: string
  email: string; sourceUrl: string; notes: string
}

describe("buildEmailHtml", () => {
  it("returns valid HTML with DOCTYPE", () => {
    const html = buildEmailHtml([], 0)
    expect(html).toContain("<!DOCTYPE html>")
    expect(html).toContain("</html>")
  })

  it("shows 'No new commercial leads today' when empty", () => {
    const html = buildEmailHtml([], 100)
    expect(html).toContain("No new commercial leads today")
  })

  it("displays lead data in table rows", () => {
    const lead = makeLead()
    const html = buildEmailHtml([lead], 500)
    expect(html).toContain("Test Corp")
    expect(html).toContain("John Doe")
    expect(html).toContain("BROKER")
    expect(html).toContain("$10M")
    expect(html).toContain("91234567")
    expect(html).toContain("123 Test Street")
  })

  it("includes sector breakdown pills", () => {
    const leads = [
      makeLead({ sector: "Shophouse" }),
      makeLead({ id: 2, sector: "Shophouse" }),
      makeLead({ id: 3, sector: "Hotel" }),
    ]
    const html = buildEmailHtml(leads, 1000)
    expect(html).toContain("Shophouse")
    expect(html).toContain("Hotel")
  })

  it("calculates aggregate deal value correctly", () => {
    const leads = [
      makeLead({ valueNum: 100 }),
      makeLead({ id: 2, valueNum: 200 }),
      makeLead({ id: 3, valueNum: 300 }),
    ]
    const html = buildEmailHtml(leads, 1000)
    // Total = 600M, displayed as $600M+
    expect(html).toContain("$600M+")
  })

  it("formats values >= 1000M as billions", () => {
    const leads = [
      makeLead({ valueNum: 500 }),
      makeLead({ id: 2, valueNum: 700 }),
    ]
    const html = buildEmailHtml(leads, 1000)
    // Total = 1200M = $1.2B+
    expect(html).toContain("$1.2B+")
  })

  it("includes totalLeads count in the stats", () => {
    const html = buildEmailHtml([makeLead()], 4327)
    expect(html).toContain("4,327")
  })

  it("includes article link for leads with sourceUrl", () => {
    const lead = makeLead({ sourceUrl: "https://example.com/article-1" })
    const html = buildEmailHtml([lead], 100)
    expect(html).toContain('href="https://example.com/article-1"')
    expect(html).toContain("Article")
  })

  it("shows dash for leads without company", () => {
    const lead = makeLead({ company: "" })
    const html = buildEmailHtml([lead], 100)
    // The table cell should contain a dash for missing company
    expect(html).toContain("—")
  })

  it("limits table to 50 rows and shows overflow message", () => {
    const leads = Array.from({ length: 55 }, (_, i) =>
      makeLead({ id: i + 1, company: `Company ${i + 1}` })
    )
    const html = buildEmailHtml(leads, 1000)
    expect(html).toContain("+ 5 more leads in the CRM")
    // Should not contain company 55 in the table rows
    expect(html).not.toContain("Company 55")
  })

  it("includes CRM link", () => {
    const html = buildEmailHtml([], 0)
    expect(html).toContain("https://edgeprop-crm.vercel.app")
    expect(html).toContain("Open CRM →")
  })

  it("displays intent badges with correct colors", () => {
    const buyLead = makeLead({ intent: "BUY" })
    const html = buildEmailHtml([buyLead], 100)
    expect(html).toContain(INTENT_COLOR["BUY"])
  })

  it("displays sector badges with correct colors", () => {
    const lead = makeLead({ sector: "Hotel" })
    const html = buildEmailHtml([lead], 100)
    expect(html).toContain(SECTOR_COLOR["Hotel"])
  })
})

// ── loadEnv() ─────────────────────────────────────────────────────────────────

describe("loadEnv", () => {
  const envPath = path.join(__dirname, "../../.env.local")
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clean up any test env vars
    delete process.env.TEST_VAR_A
    delete process.env.TEST_VAR_B
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
    // Clean up test .env.local if created
    if (fs.existsSync(envPath)) {
      try { fs.unlinkSync(envPath) } catch {}
    }
  })

  it("loads KEY=VALUE pairs from .env.local", () => {
    fs.writeFileSync(envPath, "TEST_VAR_A=hello\nTEST_VAR_B=world\n", "utf-8")
    loadEnv()
    expect(process.env.TEST_VAR_A).toBe("hello")
    expect(process.env.TEST_VAR_B).toBe("world")
  })

  it("does not overwrite existing env vars", () => {
    process.env.TEST_VAR_A = "original"
    fs.writeFileSync(envPath, "TEST_VAR_A=overwritten\n", "utf-8")
    loadEnv()
    expect(process.env.TEST_VAR_A).toBe("original")
  })

  it("strips quotes from values", () => {
    fs.writeFileSync(envPath, 'TEST_VAR_A="quoted"\nTEST_VAR_B=\'single\'\n', "utf-8")
    loadEnv()
    expect(process.env.TEST_VAR_A).toBe("quoted")
    expect(process.env.TEST_VAR_B).toBe("single")
  })

  it("handles missing .env.local without error", () => {
    if (fs.existsSync(envPath)) fs.unlinkSync(envPath)
    expect(() => loadEnv()).not.toThrow()
  })

  it("ignores comment lines and blank lines", () => {
    fs.writeFileSync(envPath, "# comment\n\nTEST_VAR_A=value\n", "utf-8")
    loadEnv()
    expect(process.env.TEST_VAR_A).toBe("value")
  })
})

// ── getNewLeads() ─────────────────────────────────────────────────────────────

describe("getNewLeads", () => {
  const dataDir = path.join(__dirname, "../../data")
  const leadsFile = path.join(dataDir, "leads.json")
  const checkpointFile = path.join(dataDir, "checkpoint.json")

  let originalLeadsContent: string | null = null
  let originalCheckpointContent: string | null = null

  beforeEach(() => {
    // Save originals
    originalLeadsContent = fs.existsSync(leadsFile) ? fs.readFileSync(leadsFile, "utf-8") : null
    originalCheckpointContent = fs.existsSync(checkpointFile) ? fs.readFileSync(checkpointFile, "utf-8") : null
  })

  afterEach(() => {
    // Restore originals
    if (originalLeadsContent !== null) {
      fs.writeFileSync(leadsFile, originalLeadsContent, "utf-8")
    }
    if (originalCheckpointContent !== null) {
      fs.writeFileSync(checkpointFile, originalCheckpointContent, "utf-8")
    } else if (fs.existsSync(checkpointFile)) {
      fs.unlinkSync(checkpointFile)
    }
  })

  it("returns all leads when no checkpoint exists", () => {
    const testLeads = [
      { id: 1, date: "2026-07-01", articleTitle: "A", company: "C1", person: "", role: "", intent: "BUY", property: "P1", sector: "Hotel", valueNum: 10, value: "$10M", phone: "", email: "", sourceUrl: "", notes: "" },
      { id: 2, date: "2026-07-01", articleTitle: "B", company: "C2", person: "", role: "", intent: "SELL", property: "P2", sector: "Office", valueNum: 20, value: "$20M", phone: "", email: "", sourceUrl: "", notes: "" },
    ]
    fs.writeFileSync(leadsFile, JSON.stringify(testLeads), "utf-8")
    if (fs.existsSync(checkpointFile)) fs.unlinkSync(checkpointFile)

    const result = getNewLeads()
    expect(result).toHaveLength(2)
  })

  it("returns only leads with id > lastId from checkpoint", () => {
    const testLeads = [
      { id: 1, date: "2026-07-01", articleTitle: "A", company: "C1", person: "", role: "", intent: "BUY", property: "P1", sector: "Hotel", valueNum: 10, value: "$10M", phone: "", email: "", sourceUrl: "", notes: "" },
      { id: 2, date: "2026-07-01", articleTitle: "B", company: "C2", person: "", role: "", intent: "SELL", property: "P2", sector: "Office", valueNum: 20, value: "$20M", phone: "", email: "", sourceUrl: "", notes: "" },
      { id: 3, date: "2026-07-01", articleTitle: "C", company: "C3", person: "", role: "", intent: "BID", property: "P3", sector: "Shophouse", valueNum: 30, value: "$30M", phone: "", email: "", sourceUrl: "", notes: "" },
    ]
    fs.writeFileSync(leadsFile, JSON.stringify(testLeads), "utf-8")
    fs.writeFileSync(checkpointFile, JSON.stringify({ lastId: 1 }), "utf-8")

    const result = getNewLeads()
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(2)
    expect(result[1].id).toBe(3)
  })

  it("returns empty array when all leads are already checkpointed", () => {
    const testLeads = [
      { id: 1, date: "2026-07-01", articleTitle: "A", company: "C1", person: "", role: "", intent: "BUY", property: "P1", sector: "Hotel", valueNum: 10, value: "$10M", phone: "", email: "", sourceUrl: "", notes: "" },
    ]
    fs.writeFileSync(leadsFile, JSON.stringify(testLeads), "utf-8")
    fs.writeFileSync(checkpointFile, JSON.stringify({ lastId: 1 }), "utf-8")

    const result = getNewLeads()
    expect(result).toHaveLength(0)
  })

  it("updates checkpoint after running", () => {
    const testLeads = [
      { id: 5, date: "2026-07-01", articleTitle: "A", company: "C1", person: "", role: "", intent: "BUY", property: "P1", sector: "Hotel", valueNum: 10, value: "$10M", phone: "", email: "", sourceUrl: "", notes: "" },
      { id: 10, date: "2026-07-01", articleTitle: "B", company: "C2", person: "", role: "", intent: "SELL", property: "P2", sector: "Office", valueNum: 20, value: "$20M", phone: "", email: "", sourceUrl: "", notes: "" },
    ]
    fs.writeFileSync(leadsFile, JSON.stringify(testLeads), "utf-8")
    if (fs.existsSync(checkpointFile)) fs.unlinkSync(checkpointFile)

    getNewLeads()

    const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, "utf-8"))
    expect(checkpoint.lastId).toBe(10)
    expect(checkpoint.updatedAt).toBeDefined()
  })

  it("returns empty when leads file does not exist", () => {
    // Temporarily rename the leads file
    const backupPath = leadsFile + ".bak"
    if (fs.existsSync(leadsFile)) fs.renameSync(leadsFile, backupPath)
    try {
      const result = getNewLeads()
      expect(result).toHaveLength(0)
    } finally {
      if (fs.existsSync(backupPath)) fs.renameSync(backupPath, leadsFile)
    }
  })
})
