/**
 * Contact enrichment — fills in website, phone, email, address for each company
 * by searching DuckDuckGo and scraping the company's own site.
 *
 * Run standalone:  npx tsx scripts/enrich-contacts.ts [--limit 30]
 * Called daily by: run-digest.ps1 after daily-digest.ts
 *
 * Results are cached in data/contact-cache.json so each company is only
 * looked up once. To re-enrich a company, delete its entry from the cache.
 */

import * as fs from "fs"
import * as path from "path"

const DATA_DIR   = path.join(__dirname, "../data")
const LEADS_FILE = path.join(DATA_DIR, "leads.json")
const CACHE_FILE = path.join(DATA_DIR, "contact-cache.json")

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-SG,en;q=0.9",
}

type Lead = {
  id: number; date: string; articleTitle: string; company: string
  person: string; role: string; intent: string; property: string
  sector: string; valueNum: number; value: string; phone: string
  email: string; website: string; address: string; sourceUrl: string; source?: string
  altSources?: { source: string; url: string; title: string }[]; notes: string
}

type ContactInfo = {
  website: string; phone: string; email: string; address: string
  linkedinCompany: string; enrichedAt: string
}

type Cache = Record<string, ContactInfo>

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function loadCache(): Cache {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) } catch { return {} }
}

function saveCache(cache: Cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

function linkedinSlug(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-")
}

/** Strip to base URL: https://domain.com */
function baseUrl(raw: string): string {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    return `${u.protocol}//${u.hostname}`
  } catch { return "" }
}

// ── DuckDuckGo HTML search ────────────────────────────────────────────────────

async function searchWebsite(company: string): Promise<string> {
  const query = `"${company}" Singapore official site`
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

  // Blocklist — skip domains that are news/directories, not the company itself
  const skip = [
    "duckduckgo","google","linkedin","facebook","twitter","instagram","youtube",
    "wikipedia","businesstimes","straitstimes","channelnewsasia","edgeprop",
    "propertyguru","99.co","stproperty","sgx","acra","bizfile","yellowpages",
    "gobusiness","iras","mom.gov","cpf.gov","ura.gov","jld.gov","mpa.gov",
    "bloomberg","reuters","crunchbase","pitchbook","glassdoor","indeed",
  ]

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal })
    clearTimeout(timer)
    const html = await res.text()

    // DDG HTML results: anchors with class "result__a"
    const hrefs = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1])
    for (const href of hrefs) {
      try {
        const domain = new URL(href).hostname.toLowerCase()
        if (!skip.some(s => domain.includes(s))) {
          return baseUrl(href)
        }
      } catch { continue }
    }
  } catch (e) {
    console.error(`  [DDG] search failed for "${company}":`, e instanceof Error ? e.message : e)
  }
  return ""
}

// ── Scrape contact page ───────────────────────────────────────────────────────

const SG_PHONE_RE  = /(\+65[\s\-.]?[3689]\d{3}[\s\-.]?\d{4}|[3689]\d{3}[\s\-.]?\d{4})/
const EMAIL_RE     = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/
const ADDRESS_RE   = /(\d+[A-Z]?\s+[A-Za-z\s]+(?:Road|Street|Avenue|Drive|Lane|Place|Way|Crescent|Boulevard|Close|Walk|Link|View|Rise|Hill|Garden|Park|Terrace|Square)\b[^<"\n]{0,60}Singapore\s*\d{6})/i

async function scrapeContact(website: string): Promise<Partial<ContactInfo>> {
  const info: Partial<ContactInfo> = {}
  const candidates = [
    website,
    `${website}/contact`,
    `${website}/contact-us`,
    `${website}/contactus`,
    `${website}/about`,
    `${website}/about-us`,
  ]

  for (const url of candidates) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(url, { headers: HEADERS, signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) continue
      const html = await res.text()

      // Strip tags for regex matching
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")

      if (!info.phone) {
        const m = text.match(SG_PHONE_RE)
        if (m) info.phone = m[1].replace(/[\s\-.]/g, "").replace(/^\+65/, "+65 ")
      }
      if (!info.email) {
        const m = text.match(EMAIL_RE)
        if (m && !m[1].includes("example") && !m[1].includes("sentry") && !m[1].includes("noreply")) {
          info.email = m[1]
        }
      }
      if (!info.address) {
        const m = text.match(ADDRESS_RE)
        if (m) info.address = m[1].replace(/\s+/g, " ").trim()
      }

      if (info.phone && info.email) break
      await sleep(1500)
    } catch { continue }
  }

  return info
}

// ── Write leads.ts ────────────────────────────────────────────────────────────

function writeLeadsTs(leads: Lead[]) {
  const ts = `// Auto-generated — do not edit manually
// Updated: ${new Date().toISOString()} | Leads: ${leads.length}

export type Lead = {
  id: number; date: string; articleTitle: string; company: string
  person: string; role: string; intent: string; property: string
  sector: string; valueNum: number; value: string; phone: string
  email: string; website: string; address: string; sourceUrl: string; source?: string
  altSources?: { source: string; url: string; title: string }[]; notes: string
}

export const leads: Lead[] = ${JSON.stringify(leads, null, 2)}
`
  fs.writeFileSync(path.join(DATA_DIR, "leads.ts"), ts)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const limitIdx = process.argv.indexOf("--limit")
  const limit = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1]) : 25

  const leads: Lead[] = JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"))
  const cache = loadCache()

  // Unique companies that need enrichment (no website cached yet)
  const seen = new Set<string>()
  const toEnrich: string[] = []
  for (const l of leads) {
    if (!l.company || seen.has(l.company)) continue
    seen.add(l.company)
    const cached = cache[l.company]
    if (!cached || (!cached.website && !cached.phone && !cached.email)) {
      toEnrich.push(l.company)
    }
  }

  console.log(`\n=== Contact Enrichment ===`)
  console.log(`${toEnrich.length} companies need enrichment (processing up to ${limit})`)

  let enriched = 0
  let updated = 0

  for (const company of toEnrich.slice(0, limit)) {
    console.log(`\n[${enriched + 1}/${Math.min(toEnrich.length, limit)}] ${company}`)

    // Step 1: find website
    let website = ""
    console.log(`  Searching website...`)
    website = await searchWebsite(company)
    if (website) console.log(`  Found: ${website}`)
    await sleep(2000) // be polite to DDG

    // Step 2: scrape contact page
    let contactInfo: Partial<ContactInfo> = {}
    if (website) {
      console.log(`  Scraping contact page...`)
      contactInfo = await scrapeContact(website)
      if (contactInfo.phone) console.log(`  Phone: ${contactInfo.phone}`)
      if (contactInfo.email) console.log(`  Email: ${contactInfo.email}`)
      if (contactInfo.address) console.log(`  Address: ${contactInfo.address}`)
    }

    // Step 3: LinkedIn company URL
    const linkedinCompany = `https://www.linkedin.com/company/${linkedinSlug(company)}`

    // Step 4: cache result
    cache[company] = {
      website,
      phone: contactInfo.phone || "",
      email: contactInfo.email || "",
      address: contactInfo.address || "",
      linkedinCompany,
      enrichedAt: new Date().toISOString(),
    }
    saveCache(cache)
    enriched++
  }

  // Apply cache to all leads
  for (const l of leads) {
    const info = cache[l.company]
    if (!info) continue
    let changed = false
    if (!l.website && info.website)   { l.website = info.website;   changed = true }
    if (!l.phone   && info.phone)     { l.phone   = info.phone;     changed = true }
    if (!l.email   && info.email)     { l.email   = info.email;     changed = true }
    if (!l.address && info.address)   { l.address = info.address;   changed = true }
    if (changed) updated++
  }

  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2))
  writeLeadsTs(leads)

  console.log(`\n=== Enrichment complete: ${enriched} companies looked up, ${updated} lead records updated ===`)
}

main().catch(e => { console.error("Enrichment failed:", e); process.exit(1) })
