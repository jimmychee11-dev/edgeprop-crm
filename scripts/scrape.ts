/**
 * Singapore commercial RE lead scraper
 *
 * Sources (in order of commercial signal density):
 *   EdgeProp:
 *     1. /property-news/in-depth   — capital markets analysis, ~85 pages, scrape ALL
 *     2. /property-news/showcase   — featured commercial listings, ~27 pages, scrape ALL
 *     3. /property-news/news       — general news, keyword-filter for commercial deals
 *   MingTianDi:      /tag/singapore/feed/ RSS — APAC capital markets, SG-tagged
 *   Business Times:  /rss/property RSS — keyword-filtered for commercial deals
 *
 * Similar news across sources is lumped together: a lead with the same
 * normalized company+property+intent as a recent existing lead is skipped.
 *
 * Usage:
 *   npx tsx scripts/scrape.ts [--source in-depth|showcase|news|mingtiandi|bt|all] [--max-pages N]
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
  source: string // "EdgeProp" | "MingTianDi" | "Business Times"
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

// True unless the headline is clearly residential/editorial noise.
// Looser than isCommercialNews — used for curated feeds (MingTianDi SG tag)
// where most items are commercial but may lack our keyword vocabulary.
function notResidentialNoise(title: string): boolean {
  const t = title.toLowerCase()
  return !SKIP_PATTERNS.some(k => t.includes(k))
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Normalized deal identity — used to lump the same deal reported by multiple
// sources (e.g. EdgeProp + Business Times both covering one shophouse sale).
function dealKey(l: { company: string; property: string; intent: string }): string {
  return (l.company + "|" + l.property + "|" + l.intent).toLowerCase().replace(/[^a-z0-9|]/g, "")
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
  email: string; website: string; address: string; sourceUrl: string; source?: string; notes: string
}

export const leads: Lead[] = ${JSON.stringify(leads, null, 2)}
`
  fs.writeFileSync(path.join(dataDir, "leads.ts"), ts, "utf-8")
  process.stdout.write(`  💾 Saved ${leads.length} leads\n`)
}

// ── Link collection via fetch + __NEXT_DATA__ (bypasses bot detection) ─────────
// EdgeProp is Next.js — every listing page embeds its article list in __NEXT_DATA__
// as server-side JSON. A plain fetch() with a browser UA gets this reliably even
// from GitHub Actions cloud IPs, unlike headless Playwright which gets blocked.

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
}

function extractArticlesFromHtml(html: string, baseUrl: string): { title: string; url: string }[] {
  // Primary: parse __NEXT_DATA__ embedded JSON
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (m) {
    try {
      const data = JSON.parse(m[1])
      // Walk the props tree looking for article arrays
      const articles: { title: string; url: string }[] = []
      const findArticles = (obj: unknown): void => {
        if (!obj || typeof obj !== "object") return
        if (Array.isArray(obj)) { obj.forEach(findArticles); return }
        const o = obj as Record<string, unknown>
        // Article objects typically have slug/title/url fields
        if ((o.slug || o.url || o.href) && o.title && typeof o.title === "string" && o.title.length > 20) {
          const slug = String(o.slug || o.url || o.href || "")
          const url = slug.startsWith("http") ? slug : `${baseUrl}${slug.startsWith("/") ? "" : "/"}${slug}`
          if (url.includes("/property-news/") && !url.match(/\/(news|in-depth|showcase|deal-watch|international|author|search)\/?$/)) {
            articles.push({ title: o.title as string, url })
          }
        }
        Object.values(o).forEach(findArticles)
      }
      findArticles(data)
      if (articles.length > 0) return articles
    } catch { /* fall through to HTML parse */ }
  }

  // Fallback: parse <a href> links from raw HTML
  const links: { title: string; url: string }[] = []
  const re = /<a[^>]+href="(\/property-news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g
  const SKIP = ["news", "in-depth", "showcase", "deal-watch", "international", "author", "search"]
  let match
  while ((match = re.exec(html)) !== null) {
    const href = match[1]
    if (SKIP.some(s => href === `/property-news/${s}` || href === `/property-news/${s}/`)) continue
    const title = match[2].replace(/<[^>]+>/g, "").trim()
    if (title.length > 20) {
      links.push({ title, url: `${baseUrl}${href}` })
    }
  }
  return links
}

async function collectLinks(
  _page: Page,  // kept for API compatibility but not used for listing pages
  startUrl: string,
  maxPages: number,
  filterFn: (title: string) => boolean,
  label: string
): Promise<{ title: string; url: string }[]> {
  const collected: { title: string; url: string }[] = []
  const seen = new Set<string>()

  // EdgeProp listing pages support ?page=N query param for server-side rendering
  // even though the browser ignores it — the Next.js SSR layer respects it
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = pageNum === 1 ? startUrl : `${startUrl}?page=${pageNum}`
    let links: { title: string; url: string }[] = []

    try {
      const res = await fetch(url, { headers: FETCH_HEADERS })
      if (!res.ok) {
        process.stdout.write(`  [${label}] Page ${pageNum}: HTTP ${res.status}, stopping\n`)
        break
      }
      const html = await res.text()
      links = extractArticlesFromHtml(html, BASE_URL)
    } catch (e) {
      process.stdout.write(`  [${label}] Page ${pageNum}: fetch error, stopping\n`)
      break
    }

    let newCount = 0
    for (const { title, url: artUrl } of links) {
      if (!seen.has(artUrl) && filterFn(title)) {
        seen.add(artUrl)
        collected.push({ title, url: artUrl })
        newCount++
      }
    }

    process.stdout.write(`  [${label}] Page ${pageNum}: ${links.length} articles, ${newCount} matched (total: ${collected.length})\n`)

    // Stop early if the page returned 0 results (past end of pagination)
    if (links.length === 0) break
    await sleep(300)
  }

  return collected
}

// ── RSS sources (MingTianDi, Business Times) ─────────────────────────────────

type QueueItem = { title: string; url: string; source: string; date?: string }

function decodeEntities(s: string): string {
  return s
    .replace(/&#0?39;|&#8217;|&apos;/g, "'").replace(/&#8216;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;|&#8212;/g, "–")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
}

function parseRss(xml: string): { title: string; url: string; date: string }[] {
  const items: { title: string; url: string; date: string }[] = []
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1]
    const title = decodeEntities(
      (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] || "").trim())
    const url = (block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1] || "").trim()
    const pub = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]
    let date = new Date().toISOString().slice(0, 10)
    if (pub) { const d = new Date(pub); if (!isNaN(d.getTime())) date = d.toISOString().slice(0, 10) }
    if (title && url.startsWith("http")) items.push({ title, url, date })
  }
  return items
}

const RSS_SOURCES: { name: string; feeds: (maxPages: number) => string[]; filter: (t: string) => boolean }[] = [
  {
    name: "MingTianDi",
    // WordPress feed pagination: /feed/?paged=N (~10 items per page)
    feeds: (maxPages) => Array.from({ length: Math.min(maxPages, 3) },
      (_, i) => i === 0 ? "https://www.mingtiandi.com/tag/singapore/feed/"
                        : `https://www.mingtiandi.com/tag/singapore/feed/?paged=${i + 1}`),
    filter: notResidentialNoise, // SG tag is already curated capital markets
  },
  {
    name: "Business Times",
    feeds: () => ["https://www.businesstimes.com.sg/rss/property"],
    filter: isCommercialNews, // property feed mixes in residential — keyword filter
  },
]

async function collectRssLinks(maxPages: number): Promise<QueueItem[]> {
  const out: QueueItem[] = []
  for (const src of RSS_SOURCES) {
    console.log(`\n── ${src.name} (RSS) ─────────────────────────────────────`)
    for (const feedUrl of src.feeds(maxPages)) {
      try {
        const res = await fetch(feedUrl, { headers: FETCH_HEADERS })
        if (!res.ok) { console.log(`  [${src.name}] ${feedUrl}: HTTP ${res.status}`); continue }
        const items = parseRss(await res.text())
        const matched = items.filter(i => src.filter(i.title))
        matched.forEach(i => out.push({ ...i, source: src.name }))
        console.log(`  [${src.name}] ${items.length} items, ${matched.length} matched`)
        if (items.length === 0) break
      } catch {
        console.log(`  [${src.name}] ${feedUrl}: fetch error`)
      }
      await sleep(300)
    }
  }
  return out
}

// Plain-fetch article text for RSS sources (no Playwright needed — both
// MingTianDi and BT serve full article HTML to a browser-UA fetch).
async function fetchArticleText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS })
    if (!res.ok) return ""
    const html = await res.text()
    // Prefer <article> content; fall back to whole body
    const scoped = html.match(/<article[\s\S]*?<\/article>/)?.[0] || html
    const text = scoped
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return decodeEntities(text).slice(0, 5000)
  } catch {
    return ""
  }
}

// ── Article content extraction ────────────────────────────────────────────────

async function getArticleContent(page: Page, url: string): Promise<{ text: string; date: string }> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    await sleep(2000)

    const text = await page.evaluate(() => document.body.innerText.slice(0, 3000))

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

// Extra title-level filter applied before calling Claude (saves API cost)
const SKIP_TITLE_PATTERNS = [
  "bto","hdb flat","resale flat","million-dollar flat","executive condo ec",
  "private home sales","developer sales flash","ura flash","price index",
  "mortgage","cpf","home loan","rental tips","buying guide","how to",
  "first-time buyer","property agent tips","top agent","awards","rankings",
  "market outlook","property outlook","market review","property review",
]
function worthCallingClaude(title: string): boolean {
  const t = title.toLowerCase()
  return !SKIP_TITLE_PATTERNS.some(k => t.includes(k))
}

async function extractLeads(
  client: Anthropic,
  text: string,
  title: string,
  url: string,
  date: string
): Promise<Omit<Lead, "id" | "articleTitle" | "sourceUrl" | "date">[]> {
  if (!text || text.length < 200) return []
  if (!worthCallingClaude(title)) return []
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }] as Parameters<typeof client.messages.create>[0]["system"],
      messages: [{ role: "user", content: `Title: ${title}\nDate: ${date}\n\n${text}` }],
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
    // Keep only non-residential commercial leads; backfill source for pre-multi-source leads
    const commercial = existing.filter(l => l.sector !== "Residential")
    commercial.forEach(l => {
      if (!l.source) l.source = "EdgeProp"
      allLeads.push(l); existingUrls.add(l.sourceUrl)
    })
    console.log(`Loaded ${commercial.length} existing commercial leads (dropped ${existing.length - commercial.length} residential)`)
  }

  // Deal identity map for lumping the same deal across sources:
  // dealKey → most recent article date seen for that deal
  const seenDeals = new Map<string, string>()
  for (const l of allLeads) {
    const k = dealKey(l)
    const prev = seenDeals.get(k)
    if (!prev || l.date > prev) seenDeals.set(k, l.date)
  }
  const DEDUPE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
  function isDuplicateDeal(lead: { company: string; property: string; intent: string }, date: string): boolean {
    const prev = seenDeals.get(dealKey(lead))
    if (!prev) return false
    return Math.abs(Date.parse(date) - Date.parse(prev)) <= DEDUPE_WINDOW_MS
  }

  let nextId = allLeads.length > 0 ? Math.max(...allLeads.map(l => l.id)) + 1 : 1

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"],
  })
  const listPage: Page = await browser.newPage()

  try {
    const queue: QueueItem[] = []
    const asEdgeProp = (links: { title: string; url: string }[]): QueueItem[] =>
      links.map(l => ({ ...l, source: "EdgeProp" }))

    if (sourceArg === "in-depth" || sourceArg === "all") {
      console.log("\n── In-Depth (capital markets) ───────────────────────────")
      const links = await collectLinks(listPage, `${BASE_URL}/property-news/in-depth`, maxInDepthPages, () => true, "in-depth")
      queue.push(...asEdgeProp(links))
      console.log(`In-Depth: ${links.length} articles`)
    }

    if (sourceArg === "showcase" || sourceArg === "all") {
      console.log("\n── Showcase (commercial listings) ───────────────────────")
      const links = await collectLinks(listPage, `${BASE_URL}/property-news/showcase`, maxShowcasePages, () => true, "showcase")
      queue.push(...asEdgeProp(links))
      console.log(`Showcase: ${links.length} articles`)
    }

    if (sourceArg === "news" || sourceArg === "all") {
      console.log(`\n── News (commercial filter, ${maxNewsPages} pages) ───────────────────────`)
      const links = await collectLinks(listPage, `${BASE_URL}/property-news/news`, maxNewsPages, isCommercialNews, "news")
      queue.push(...asEdgeProp(links))
      console.log(`News: ${links.length} commercial articles`)
    }

    if (sourceArg === "mingtiandi" || sourceArg === "bt" || sourceArg === "rss" || sourceArg === "all") {
      const rssLinks = await collectRssLinks(maxAllPages ?? 3)
      const wanted = sourceArg === "mingtiandi" ? rssLinks.filter(l => l.source === "MingTianDi")
        : sourceArg === "bt" ? rssLinks.filter(l => l.source === "Business Times")
        : rssLinks
      queue.push(...wanted)
      console.log(`RSS sources: ${wanted.length} articles`)
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
        const item = deduped[idx]
        const { title, url, source } = item

        process.stdout.write(`[W${id}][${idx + 1}/${deduped.length}][${source}] ${title.slice(0, 60)}\n`)

        // RSS sources: plain fetch + RSS pubDate. EdgeProp: Playwright.
        let text: string, date: string
        if (source !== "EdgeProp") {
          text = await fetchArticleText(url)
          date = item.date || new Date().toISOString().slice(0, 10)
        } else {
          ({ text, date } = await getArticleContent(page, url))
        }
        if (!text || text.length < 200) { process.stdout.write(`  W${id} ✗ empty\n`); continue }

        const extracted = await extractLeads(client, text, title, url, date)

        if (extracted.length > 0) {
          // Filter out residential from Claude output, then lump duplicates:
          // skip leads whose company+property+intent matches a deal already
          // captured (from any source) within the last 30 days
          const commercial = extracted.filter(l => l.sector !== "Residential")
          let added = 0, lumped = 0
          for (const lead of commercial) {
            const norm = { company: lead.company || "", property: lead.property || "", intent: lead.intent || "" }
            if (isDuplicateDeal(norm, date)) { lumped++; continue }
            seenDeals.set(dealKey(norm), date)
            allLeads.push({
              id: nextId++, date, articleTitle: title, sourceUrl: url, source,
              company: norm.company, person: lead.person || "", role: lead.role || "",
              intent: norm.intent, property: norm.property, sector: lead.sector || "",
              valueNum: lead.valueNum || 0, value: lead.value || "", phone: lead.phone || "",
              email: lead.email || "", website: lead.website || "", address: lead.address || "",
              notes: lead.notes || "",
            })
            added++
          }
          existingUrls.add(url)
          process.stdout.write(`  W${id} → ${added} leads${lumped ? ` (${lumped} lumped as duplicates)` : ""} (total: ${allLeads.length})\n`)
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
