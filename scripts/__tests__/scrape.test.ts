import { describe, it, expect } from "vitest"
import {
  isCommercialNews,
  worthCallingClaude,
  COMMERCIAL_KEYWORDS,
  SKIP_PATTERNS,
  SKIP_TITLE_PATTERNS,
} from "../scrape"

describe("isCommercialNews", () => {
  it("matches titles containing commercial asset-class keywords", () => {
    expect(isCommercialNews("New industrial park opens in Tuas")).toBe(true)
    expect(isCommercialNews("Hotel chain acquires resort in Sentosa")).toBe(true)
    expect(isCommercialNews("Grade A office tower sold for $500M")).toBe(true)
    expect(isCommercialNews("Conservation shophouse in Chinatown on the market")).toBe(true)
    expect(isCommercialNews("Retail mall in Orchard Road changes hands")).toBe(true)
    expect(isCommercialNews("Warehouse logistics hub launched")).toBe(true)
    expect(isCommercialNews("Data centre deal closed in Jurong")).toBe(true)
  })

  it("matches titles containing transaction-type keywords", () => {
    expect(isCommercialNews("En bloc sale of Horizon Towers approved")).toBe(true)
    expect(isCommercialNews("GLS tender for Marina Bay site")).toBe(true)
    expect(isCommercialNews("CapitaLand acquires office building")).toBe(true)
    expect(isCommercialNews("REIT announces new acquisition")).toBe(true)
    expect(isCommercialNews("Expression of interest for Telok Ayer property")).toBe(true)
    expect(isCommercialNews("Joint venture formed for mixed-use development")).toBe(true)
    expect(isCommercialNews("Record price achieved for Tanjong Pagar shophouse")).toBe(true)
  })

  it("matches titles containing major company names", () => {
    expect(isCommercialNews("CapitaLand reports strong Q3 earnings")).toBe(true)
    expect(isCommercialNews("Mapletree divests industrial assets")).toBe(true)
    expect(isCommercialNews("CBRE appointed as marketing agent")).toBe(true)
    expect(isCommercialNews("JLL brokers landmark deal")).toBe(true)
    expect(isCommercialNews("Knight Frank wins mandate")).toBe(true)
  })

  it("rejects titles matching skip patterns (residential/editorial)", () => {
    expect(isCommercialNews("HDB BTO launch in Tampines")).toBe(false)
    expect(isCommercialNews("BTO flat application guide for first-time buyers")).toBe(false)
    expect(isCommercialNews("Private home sales surge in Q2")).toBe(false)
    expect(isCommercialNews("Mortgage rates expected to rise")).toBe(false)
    expect(isCommercialNews("Property price index hits new high")).toBe(false)
    expect(isCommercialNews("What is stamp duty and how does it work")).toBe(false)
    expect(isCommercialNews("Market outlook for 2026")).toBe(false)
    expect(isCommercialNews("Five-room flat sells for $1M")).toBe(false)
  })

  it("skip patterns take priority over commercial keywords", () => {
    // Contains both "hotel" (commercial) and "market outlook" (skip)
    expect(isCommercialNews("Hotel market outlook for 2026")).toBe(false)
    // Contains "shophouse" but also "rankings"
    expect(isCommercialNews("Shophouse rankings and awards ceremony")).toBe(false)
  })

  it("rejects titles with no commercial keywords", () => {
    expect(isCommercialNews("Family moves to new neighborhood")).toBe(false)
    expect(isCommercialNews("Best restaurants in Singapore")).toBe(false)
    expect(isCommercialNews("Weather update for the week")).toBe(false)
  })

  it("is case-insensitive", () => {
    expect(isCommercialNews("INDUSTRIAL PARK OPENS IN TUAS")).toBe(true)
    expect(isCommercialNews("Shophouse In Chinatown")).toBe(true)
    expect(isCommercialNews("CAPITALAND Reports Earnings")).toBe(true)
  })

  it("handles regex-based keywords (dollar amounts)", () => {
    expect(isCommercialNews("Property sold for $50m in record deal")).toBe(true)
    expect(isCommercialNews("Asset worth $120 mil changes hands")).toBe(true)
  })

  it("handles empty and short strings", () => {
    expect(isCommercialNews("")).toBe(false)
    expect(isCommercialNews("Hi")).toBe(false)
  })
})

describe("worthCallingClaude", () => {
  it("returns true for commercial article titles", () => {
    expect(worthCallingClaude("Shophouse on Telok Ayer for sale at $22.8 mil")).toBe(true)
    expect(worthCallingClaude("Industrial REIT acquires logistics hub")).toBe(true)
    expect(worthCallingClaude("En bloc sale of commercial complex approved")).toBe(true)
  })

  it("returns false for titles matching skip-title patterns", () => {
    expect(worthCallingClaude("HDB BTO launch in November")).toBe(false)
    expect(worthCallingClaude("Five-room HDB flat sold for record price")).toBe(false)
    expect(worthCallingClaude("Resale flat prices surge again")).toBe(false)
    expect(worthCallingClaude("Mortgage rates to increase next quarter")).toBe(false)
    expect(worthCallingClaude("CPF housing policy changes")).toBe(false)
    expect(worthCallingClaude("How to buy your first property")).toBe(false)
    expect(worthCallingClaude("Property outlook for 2026")).toBe(false)
    expect(worthCallingClaude("First-time buyer guide to HDB")).toBe(false)
    expect(worthCallingClaude("Developer sales flash: July 2026")).toBe(false)
    expect(worthCallingClaude("URA flash estimate shows growth")).toBe(false)
    expect(worthCallingClaude("Top agent awards 2026")).toBe(false)
    expect(worthCallingClaude("Property market review Q2")).toBe(false)
  })

  it("is case-insensitive", () => {
    expect(worthCallingClaude("BTO LAUNCH IN TAMPINES")).toBe(false)
    expect(worthCallingClaude("MORTGAGE RATES CHANGE")).toBe(false)
  })

  it("handles empty and short strings", () => {
    expect(worthCallingClaude("")).toBe(true)
    expect(worthCallingClaude("News")).toBe(true)
  })
})

describe("keyword/pattern arrays", () => {
  it("COMMERCIAL_KEYWORDS is non-empty", () => {
    expect(COMMERCIAL_KEYWORDS.length).toBeGreaterThan(0)
  })

  it("SKIP_PATTERNS is non-empty", () => {
    expect(SKIP_PATTERNS.length).toBeGreaterThan(0)
  })

  it("SKIP_TITLE_PATTERNS is non-empty", () => {
    expect(SKIP_TITLE_PATTERNS.length).toBeGreaterThan(0)
  })

  it("COMMERCIAL_KEYWORDS contains expected asset classes", () => {
    expect(COMMERCIAL_KEYWORDS).toContain("industrial")
    expect(COMMERCIAL_KEYWORDS).toContain("hotel")
    expect(COMMERCIAL_KEYWORDS).toContain("office")
    expect(COMMERCIAL_KEYWORDS).toContain("shophouse")
    expect(COMMERCIAL_KEYWORDS).toContain("retail")
  })

  it("SKIP_PATTERNS contains residential-related terms", () => {
    expect(SKIP_PATTERNS).toContain("hdb bto")
    expect(SKIP_PATTERNS).toContain("mortgage")
    expect(SKIP_PATTERNS).toContain("five-room flat")
  })

  it("no overlap between COMMERCIAL_KEYWORDS and SKIP_PATTERNS", () => {
    for (const kw of COMMERCIAL_KEYWORDS) {
      expect(SKIP_PATTERNS).not.toContain(kw)
    }
  })
})
