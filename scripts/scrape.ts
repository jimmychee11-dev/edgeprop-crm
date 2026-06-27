/**
 * EdgeProp commercial RE lead scraper
 *
 * Sources (in order of commercial signal density):
 *   1. /property-news/in-depth   — capital markets analysis, ~85 pages, scrape ALL
 *   2. /property-news/showcase   — featured commercial listings, ~27 pages, scrape ALL
 *   3. /property-news/news       — general news, keyword-filter for commercial deals
 *
 * Usage:
 *   npx tsx scripts/scrape.ts [--source in-depth|showcase|news|all] [--max-pages N]
 *
 * Env: ANTHROPIC_API_KEY
 */

import { chromium, Browser, Page } from "playwright"
import Anthropic from "@anthropic-ai/sdk"
import * as fs from "fs"
import * as path from "path"

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = "https://www.edgeprop.sg"
const WORKERS = 5

// Keywords that indicate a COMMERCIAL deal in a news headline
// Used only to pre-filter the general /news listing (in-depth + showcase are scraped wholesale)
const COMMERCIAL_KEYWORDS = [
  // asset classes
  "industrial","warehouse","factory","logistics","logistic","b1","b2",
  "data centre","data center","cold storage","self storage",
  "hotel","hospitality","serviced apartment","resort","hostel",
  "office","cbd office","grade a","strata office","business park",
  "shophouse","conservation shophouse","heritage",
  "mall","retail","shopping centre","shopping center",
  "car park","petrol station","petrol kiosk",
  "healthcare","student accommodation","purpose-built",
  // transaction types
  "en bloc","enbloc","collective sale",
  "gls","government land sale","land parcel","white site",
  "tender","expression of interest","eoi","reserve list",
  "acquisition","acquires","acquired","acqui",
  "divest","divestment","disposed","disposal",
  "investment sale","capital markets","portfolio sale",
  "jv","joint venture","tie-up",
  "reit","real estate investment trust","property trust",
  "fund","private equity","asset management",
  "sale and leaseback","leaseback",
  "record price","record transaction","record deal",
  "psf","per sq ft","per square foot",
  "million dollar","$\\d+m ","\\$\\d+ mil",
  // companies
  "capitaland","mapletree","keppel","frasers","ascendas",
  "cbre","jll","colliers","savills","knight frank","cushman",
  "esrgroup","esr","prologis","link reit","capitaland integrated",
]

// Headlines that are definitely NOT commercial deals — skip them
const SKIP_PATTERNS = [
  "hdb bto","bto launch","bto exercise","bto flat",
  "private home sales","new home sales","developer sales",
  "condo price","property price index","ura flash",
  "mortgage","home loan","interest rate","cpf housing",
  "rental tips","buying guide","how to buy","first-time buyer",
  "property agent","agent commission",
  "what is ","explainer","explainers","rankings","awards",
  "market outlook","market review","market report",
  "residential transaction","hdb resale transaction",
  "five-room flat","four-room flat","three-room flat","two-room flat",
  "maisonette","executive apartment","terrace house","semi-detached",
]

// ── Types ─────────────────────────────────────────────────────────────────────

export type Lead = {
  id: number
  date: string
  articleTitle: string
  company: string
  person: string
  role: string
  intent: string
  property: string
  sector: string
  valueNum: number
  value: string
  phone: string
  email: string
  website: string
  address: string
  sourceUrl: string
  notes: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCommercialNews(title: string): boolean {
  const t = title.toLowerCase()
  if (SKIP_PATTERNS.some(k => t.includes(k))) return false
  return COMMERCIAL_KEYWORDS.some(k => {
    // Handle regex patterns embedded in COMMERCIAL_KEYWORDS
    if (k.includes("\\d")) return new RegExp(k).test(t)
    return t.includes(k)
  })
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function saveProgress(leads: Lead[], dataDir: string) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, "leads.json"), JSON.stringify(leads, null, 2), "utf-8")
  const ts = `// Auto-generated — do not edit manually
// Updated: ${new Date().toISOString()} | Leads: ${leads.length}

export type Lead = {
  id: number; date: string; articleTitle: string; company: string
  person: string; role: string; intent: string; property: string
  sector: string; valueNum: number; value: string; phone: string
  email: string; website: string; address: string; sourceUrl: string; notes: string
}

export const leads: Lead[] = ${JSON.stringify(leads, null, 2)}
`
  fs.writeFileSync(path.join(dataDir, "leads.ts"), ts, "utf-8")
  process.stdout.write(`  💾 Saved ${leads.length} leads\n`)
}

// ── Link collection via click-pagination ─────────────────────────────────────

async function collectLinks(
  page: Page,
  startUrl: string,
  maxPages: number,
  filterFn: (title: string) => boolean,
  label: string
): Promise<{ title: string; url: string }[]> {
  const collected: { title: string; url: string }[] = []
  const seen = new Set<string>()

  const BLOCKED_HREFS = [
    "/property-news/news", "/property-news/in-depth", "/property-news/deal-watch",
    "/property-news/showcase", "/property-news/international", "/property-news-author",
    "/property-news-search", "/living/",
  ]

  await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 })
  await sleep(2000)

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const links: { title: string; url: string }[] = await page.evaluate((blocked) => {
      return Array.from(document.querySelectorAll("a[href*='/property-news/']"))
        .filter(a => {
          const href = (a as HTMLAnchorElement).href
          const text = (a.textContent || "").trim()
          if (text.length < 20) return false
          return !blocked.some((b: string) => href.includes(b))
        })
        .map(a => ({ title: (a.textContent || "").trim(), url: (a as HTMLAnchorElement).href }))
    }, BLOCKED_HREFS)

    let newCount = 0
    for (const { title, url } of links) {
      if (!seen.has(url) && filterFn(title)) {
        seen.add(url)
        collected.push({ title, url })
        newCount++
      }
    }

    process.stdout.write(`  [${label}] Page ${pageNum}: ${links.length} articles, ${newCount} matched (total: ${collected.length})\n`)

    if (pageNum >= maxPages) break

    // Click next page
    const moved = await page.evaluate((cur: number) => {
      // Try "Next" text first
      const btns = Array.from(document.querySelectorAll("button, a, li"))
      const next = btns.find(el => {
        const t = (el.textContent || "").trim().toLowerCase()
        return t === "next" || t === "›" || t === ">"
      })
      if (next) {
        const clickable = (next.tagName === "LI" ? next.querySelector("a,button") : next) as HTMLElement | null
        if (clickable && !clickable.hasAttribute("disabled")) { clickable.click(); return true }
      }
      // Try page number
      const num = Array.from(document.querySelectorAll("a,button"))
        .find(el => (el.textContent || "").trim() === String(cur + 1))
      if (num) { (num as HTMLElement).click(); return true }
      return false
    }, pageNum)

    if (!moved) { process.stdout.write(`  [${label}] No more pages after ${pageNum}\n`); break }
    await sleep(1500)
  }

  return collected
}

// ── Article content extraction ────────────────────────────────────────────────

async function getArticleContent(page: Page, url: string): Promise<{ text: string; date: string }> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    await sleep(2000)

    const text = await page.evaluate(() => document.body.innerText.slice(0, 10000))

    // Parse date
    const rawDate = await page.evaluate(() => {
      const t = document.querySelector("time")
      if (t) return t.getAttribute("datetime") || t.textContent?.trim() || ""
      return document.querySelector("[class*='date'],[class*='time'],[class*='posted']")?.textContent?.trim() || ""
    })

    let date = new Date().toISOString().split("T")[0]
    if (rawDate) {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split("T")[0]
      } else {
        const m = rawDate.match(/(\w+ \d+,?\s*\d{4})/)
        if (m) { const d2 = new Date(m[1]); if (!isNaN(d2.getTime())) date = d2.toISOString().split("T")[0] }
      }
    }

    return { text, date }
  } catch {
    return { text: "", date: new Date().toISOString().split("T")[0] }
  }
}

// ── Claude extraction ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Singapore commercial real estate capital markets analyst.

Extract investment leads from the article. A lead is any COMMERCIAL entity with a clear transaction signal:
- Buyer, seller, or joint-venture partner in a commercial deal
- Developer launching or tendering a commercial/mixed project
- Fund, REIT, or asset manager acquiring/divesting commercial property
- Marketing agent handling commercial sale/EOI/tender

SECTORS (pick the most specific):
- Industrial: factory, warehouse, logistics, data centre, cold storage, B1/B2, business park
- Hotel: hotel, resort, serviced apartment, hostel
- Office: CBD office, Grade A, strata office, co-working
- Shophouse: conservation/heritage shophouse
- Commercial: retail mall, shopping centre, strata retail, F&B
- Retail: stand-alone retail unit/cluster
- Mixed: mixed-use integrated development
- International: overseas property deal
- Residential: ONLY if it is specifically a residential deal (condo, HDB, GCB, landed)

INTENT:
BUY=acquiring | SELL=divesting | BROKER=marketing agent for a deal | JV=joint venture partner
BID=bidding in GLS/tender | ADVISORY=financial/legal advisor | REDEVELOP=collective/en-bloc/redevelopment
LEASE=leasing transaction | LAUNCH=new project launch

IMPORTANT RULES:
1. One entry per distinct party (buyer + seller + broker = 3 entries if all named)
2. For GLS tenders: include winning bidder, all named bidders, and their JV structure
3. For en-bloc/collective sales: seller (MC/owners), buyer, and marketing agent
4. For EOI/private treaty: seller + marketing agent at minimum
5. Include valueNum in SGD millions (0 if unknown). Convert — e.g. $1.2B = 1200
6. phone/email from the article only — do NOT fabricate
7. If the article has NO commercial transactions (pure editorial, residential only, market statistics), return []
8. Do NOT classify clearly commercial properties as Residential

Return ONLY a JSON array — no markdown, no explanation.
Schema per lead:
{"company","person","role","intent","property","sector","valueNum","value","phone","email","website","address","notes"}`

async function extractLeads(
  client: Anthropic,
  text: string,
  title: string,
  url: string,
  date: string
): Promise<Omit<Lead, "id" | "articleTitle" | "sourceUrl" | "date">[]> {
  if (!text || text.length < 200) return []
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Title: ${title}\nDate: ${date}\nURL: ${url}\n\n---\n${text}` }],
    })
    const raw = ((msg.content[0] as { type: string; text: string }).text || "").trim()
    const start = raw.indexOf("["), end = raw.lastIndexOf("]")
    if (start === -1 || end === -1) return []
    return JSON.parse(raw.slice(start, end + 1))
  } catch (e) {
    process.stdout.write(`  ✗ ${e}\n`)
    return []
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const sourceArg = (args[args.indexOf("--source") + 1] || "all").toLowerCase()
  const maxPagesIdx = args.indexOf("--max-pages")
  // --max-pages limits ALL sections (for daily runs use 5; for full scrape omit)
  const maxAllPages = maxPagesIdx !== -1 ? parseInt(args[maxPagesIdx + 1]) : null
  const maxInDepthPages = maxAllPages ?? 85
  const maxShowcasePages = maxAllPages ?? 27
  const maxNewsPages = maxAllPages ?? 534

  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1) }

  const client = new Anthropic()
  const dataDir = path.join(__dirname, "../data")

  // Load existing leads (skip already-scraped URLs)
  const existingFile = path.join(dataDir, "leads.json")
  const existingUrls = new Set<string>()
  const allLeads: Lead[] = []

  if (fs.existsSync(existingFile)) {
    const existing: Lead[] = JSON.parse(fs.readFileSync(existingFile, "utf-8"))
    // Keep only non-residential commercial leads
    const commercial = existing.filter(l => l.sector !== "Residential")
    commercial.forEach(l => { allLeads.push(l); existingUrls.add(l.sourceUrl) })
    console.log(`Loaded ${commercial.length} existing commercial leads (dropped ${existing.length - commercial.length} residential)`)
  }

  let nextId = allLeads.length > 0 ? Math.max(...allLeads.map(l => l.id)) + 1 : 1

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"],
  })
  const listPage: Page = await browser.newPage()

  try {
    const queue: { title: string; url: string }[] = []

    if (sourceArg === "in-depth" || sourceArg === "all") {
      console.log("\n── In-Depth (capital markets) ───────────────────────────")
      const links = await collectLinks(listPage, `${BASE_URL}/property-news/in-depth`, maxInDepthPages, () => true, "in-depth")
      queue.push(...links)
      console.log(`In-Depth: ${links.length} articles`)
    }

    if (sourceArg === "showcase" || sourceArg === "all") {
      console.log("\n── Showcase (commercial listings) ───────────────────────")
      const links = await collectLinks(listPage, `${BASE_URL}/property-news/showcase`, maxShowcasePages, () => true, "showcase")
      queue.push(...links)
      console.log(`Showcase: ${links.length} articles`)
    }

    if (sourceArg === "news" || sourceArg === "all") {
      console.log(`\n── News (commercial filter, ${maxNewsPages} pages) ───────────────────────`)
      const links = await collectLinks(listPage, `${BASE_URL}/property-news/news`, maxNewsPages, isCommercialNews, "news")
      queue.push(...links)
      console.log(`News: ${links.length} commercial articles`)
    }

    await listPage.close()

    // Dedup + skip already processed
    const deduped = [...new Map(queue.map(a => [a.url, a])).values()]
      .filter(a => !existingUrls.has(a.url))
    console.log(`\n${deduped.length} new articles to scrape (${queue.length - deduped.length} already done)`)
    console.log(`Running ${WORKERS} parallel workers...\n`)

    // ── Parallel workers ─────────────────────────────────────────────────────
    let cursor = 0

    async function worker(id: number) {
      const page = await browser.newPage()
      while (true) {
        const idx = cursor++
        if (idx >= deduped.length) break
        const { title, url } = deduped[idx]

        process.stdout.write(`[W${id}][${idx + 1}/${deduped.length}] ${title.slice(0, 60)}\n`)

        const { text, date } = await getArticleContent(page, url)
        if (!text || text.length < 200) { process.stdout.write(`  W${id} ✗ empty\n`); continue }

        const extracted = await extractLeads(client, text, title, url, date)

        if (extracted.length > 0) {
          // Filter out residential from Claude output
          const commercial = extracted.filter(l => l.sector !== "Residential")
          for (const lead of commercial) {
            allLeads.push({
              id: nextId++, date, articleTitle: title, sourceUrl: url,
              company: lead.company || "", person: lead.person || "", role: lead.role || "",
              intent: lead.intent || "", property: lead.property || "", sector: lead.sector || "",
              valueNum: lead.valueNum || 0, value: lead.value || "", phone: lead.phone || "",
              email: lead.email || "", website: lead.website || "", address: lead.address || "",
              notes: lead.notes || "",
            })
          }
          existingUrls.add(url)
          process.stdout.write(`  W${id} → ${commercial.length} commercial leads (total: ${allLeads.length})\n`)
        }

        if (allLeads.length % 20 === 0) saveProgress(allLeads, dataDir)
      }
      await page.close()
    }

    await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i + 1)))

  } finally {
    saveProgress(allLeads, dataDir)
    await browser.close().catch(() => {})
  }

  console.log(`\n✓ Done! ${allLeads.length} commercial leads`)
}

main().catch(console.error)
