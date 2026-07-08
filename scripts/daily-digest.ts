/**
 * Daily EdgeProp commercial RE digest
 *
 * 1. Runs the scraper to pick up new articles
 * 2. Diffs against last checkpoint to find NEW leads since yesterday
 * 3. Sends HTML email digest via Gmail SMTP
 * 4. Sends WhatsApp summary via CallMeBot (free, no account needed)
 *
 * Env vars required (set in .env.local):
 *   ANTHROPIC_API_KEY      — for Claude lead extraction
 *   GMAIL_USER             — your Gmail address
 *   GMAIL_APP_PASSWORD     — 16-char app password from Google Account → Security → App passwords
 *   WHATSAPP_PHONE         — recipient phone with country code, no + (e.g. 6500000000)
 *   WHATSAPP_APIKEY        — from callmebot.com (free)
 *   DIGEST_TO              — recipient email (defaults to GMAIL_USER)
 */

import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import nodemailer from "nodemailer"

const DATA_DIR = path.join(__dirname, "../data")
const LEADS_FILE = path.join(DATA_DIR, "leads.json")
const CHECKPOINT_FILE = path.join(DATA_DIR, "checkpoint.json")

type Lead = {
  id: number; date: string; articleTitle: string; company: string
  person: string; role: string; intent: string; property: string
  sector: string; valueNum: number; value: string; phone: string
  email: string; sourceUrl: string; notes: string
}

// ── Load env from .env.local ──────────────────────────────────────────────────

const ALLOWED_ENV_VARS = new Set([
  "ANTHROPIC_API_KEY", "GMAIL_USER", "GMAIL_APP_PASSWORD",
  "WHATSAPP_PHONE", "WHATSAPP_APIKEY", "WHATSAPP_TO",
  "DIGEST_TO", "GREEN_API_INSTANCE", "GREEN_API_TOKEN",
])

function loadEnv() {
  const envFile = path.join(__dirname, "../.env.local")
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, "utf-8").split("\n").forEach(line => {
      const m = line.match(/^([A-Z_]+)=(.+)$/)
      if (m && ALLOWED_ENV_VARS.has(m[1]) && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "")
      }
    })
  }
}

// ── Run scraper ───────────────────────────────────────────────────────────────

function runScraper(maxPages: number) {
  console.log(`Running scraper (last ${maxPages} pages per source)...`)
  try {
    execSync(`npx tsx ${path.join(__dirname, "scrape.ts")} --source all --max-pages ${maxPages}`, {
      cwd: path.join(__dirname, ".."),
      env: process.env,
      stdio: "inherit",
      timeout: 30 * 60 * 1000, // 30 min max for daily run
    })
  } catch (e) {
    console.error("Scraper error:", e)
  }
}

// ── Diff against checkpoint ───────────────────────────────────────────────────

function getNewLeads(): Lead[] {
  if (!fs.existsSync(LEADS_FILE)) return []
  const all: Lead[] = JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"))

  let lastId = 0
  let lastRun = 0 // epoch ms of last successful digest
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"))
    lastId = cp.lastId || 0
    lastRun = cp.updatedAt ? Date.parse(cp.updatedAt) : 0
  }

  // A lead is "new" if it wasn't in the DB at last run (id > lastId) AND its
  // article date is on/after the last run (minus 2-day buffer for late-indexed
  // articles). If the machine was off for a month, the cutoff is a month ago —
  // nothing published in the gap is lost. Falls back to 7 days on first run.
  const anchor = lastRun > 0 ? lastRun : Date.now() - 7 * 24 * 60 * 60 * 1000
  const cutoff = new Date(anchor - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const newLeads = all.filter(l => l.id > lastId && l.date >= cutoff)

  // Save new checkpoint
  const maxId = all.length > 0 ? Math.max(...all.map(l => l.id)) : 0
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastId: maxId, updatedAt: new Date().toISOString() }))

  return newLeads
}

// ── Format email HTML ─────────────────────────────────────────────────────────

const SECTOR_COLOR: Record<string, string> = {
  Industrial: "#f59e0b", Hotel: "#ec4899", Office: "#14b8a6",
  Shophouse: "#f97316", Commercial: "#6366f1", Retail: "#84cc16",
  Mixed: "#8b5cf6", International: "#3b82f6",
}
const INTENT_COLOR: Record<string, string> = {
  BUY: "#16a34a", SELL: "#dc2626", BROKER: "#2563eb",
  JV: "#7c3aed", BID: "#ca8a04", ADVISORY: "#6b7280",
  REDEVELOP: "#ea580c", LEASE: "#0891b2", LAUNCH: "#db2777",
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function badge(text: string, color: string) {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${color}22;color:${color}">${escapeHtml(text)}</span>`
}

function buildEmailHtml(leads: Lead[], totalLeads: number): string {
  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const sectorBreakdown = leads.reduce<Record<string, number>>((a, l) => { a[l.sector] = (a[l.sector] || 0) + 1; return a }, {})
  const totalValue = leads.reduce((s, l) => s + (l.valueNum || 0), 0)

  const rows = leads.slice(0, 50).map(l => `
    <tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:10px 12px;font-size:12px;color:#6b7280">${escapeHtml(l.date)}</td>
      <td style="padding:10px 12px;font-weight:600;color:#111827;max-width:160px">${escapeHtml(l.company || "—")}</td>
      <td style="padding:10px 12px;color:#374151;font-size:13px">${escapeHtml(l.person || "—")}<br><span style="color:#9ca3af;font-size:11px">${escapeHtml(l.role)}</span></td>
      <td style="padding:10px 12px">${badge(l.intent, INTENT_COLOR[l.intent] || "#6b7280")}</td>
      <td style="padding:10px 12px;color:#374151;max-width:180px;font-size:13px">${escapeHtml(l.property)}</td>
      <td style="padding:10px 12px">${badge(l.sector, SECTOR_COLOR[l.sector] || "#6b7280")}</td>
      <td style="padding:10px 12px;font-weight:600;color:#111827;white-space:nowrap;font-size:13px">${escapeHtml(l.value || "—")}</td>
      <td style="padding:10px 12px;font-size:12px;color:#374151">${escapeHtml(l.phone || "—")}</td>
      <td style="padding:10px 12px;font-size:12px">${l.sourceUrl ? `<a href="${escapeHtml(l.sourceUrl)}" style="color:#2563eb">↗ Article</a>` : "—"}</td>
    </tr>`).join("")

  const sectorPills = Object.entries(sectorBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `${badge(s, SECTOR_COLOR[s] || "#6b7280")} <span style="color:#6b7280;font-size:12px">${n}</span>`)
    .join(" &nbsp; ")

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>EdgeProp Daily Digest</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:900px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
  <div style="background:#111827;padding:24px 32px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">EdgeProp Capital Markets Daily Digest</h1>
    <p style="margin:4px 0 0;color:#9ca3af;font-size:14px">${today}</p>
  </div>
  <div style="padding:24px 32px;display:flex;gap:24px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
    <div style="text-align:center;flex:1">
      <div style="font-size:28px;font-weight:700;color:#111827">${leads.length}</div>
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">New Leads Today</div>
    </div>
    <div style="text-align:center;flex:1">
      <div style="font-size:28px;font-weight:700;color:#111827">$${totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + "B" : totalValue.toFixed(0) + "M"}+</div>
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Deal Value</div>
    </div>
    <div style="text-align:center;flex:1">
      <div style="font-size:28px;font-weight:700;color:#111827">${totalLeads.toLocaleString()}</div>
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Total Leads in CRM</div>
    </div>
  </div>
  <div style="padding:16px 32px;border-bottom:1px solid #e5e7eb">
    <span style="font-size:12px;color:#6b7280;margin-right:8px">Sectors:</span>${sectorPills}
  </div>
  ${leads.length === 0 ? `<div style="padding:48px;text-align:center;color:#9ca3af">No new commercial leads today.</div>` : `
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;white-space:nowrap">DATE</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">COMPANY</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">CONTACT</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">INTENT</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">PROPERTY</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">SECTOR</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">VALUE</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">PHONE</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600">ARTICLE</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${leads.length > 50 ? `<p style="padding:12px 32px;color:#6b7280;font-size:12px">+ ${leads.length - 50} more leads in the CRM</p>` : ""}
  </div>`}
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
    <a href="https://edgeprop-crm.vercel.app" style="display:inline-block;background:#111827;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">Open CRM →</a>
    <p style="margin:12px 0 0;font-size:11px;color:#9ca3af">Source: EdgeProp Singapore · Unsubscribe by removing this scheduled task</p>
  </div>
</div>
</body>
</html>`
}

// ── Send email ────────────────────────────────────────────────────────────────

async function sendEmail(newLeads: Lead[], totalLeads: number) {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  const to = process.env.DIGEST_TO || user

  if (!user || !pass) {
    console.log("⚠️  Email skipped — GMAIL_USER or GMAIL_APP_PASSWORD not set")
    return
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user, pass },
  })

  const subject = newLeads.length > 0
    ? `🏢 ${newLeads.length} new commercial leads — EdgeProp ${new Date().toLocaleDateString("en-SG")}`
    : `EdgeProp digest — no new leads today`

  await transporter.sendMail({
    from: `"EdgeProp CRM" <${user}>`,
    to,
    subject,
    html: buildEmailHtml(newLeads, totalLeads),
  })

  console.log(`✅ Email sent to ${to} — ${newLeads.length} new leads`)
}

// ── Send WhatsApp via Green API (no sandbox, no expiry) ──────────────────────
// Free tier: 1,000 msgs/month. Set up at green-api.com — scan QR once, done.
// Env vars: GREEN_API_INSTANCE, GREEN_API_TOKEN, WHATSAPP_TO (e.g. +6500000000)

async function sendWhatsApp(newLeads: Lead[]) {
  const instance = process.env.GREEN_API_INSTANCE
  const apiToken = process.env.GREEN_API_TOKEN
  const to = process.env.WHATSAPP_TO

  if (!instance || !apiToken || !to) {
    console.log("⚠️  WhatsApp skipped — GREEN_API_INSTANCE, GREEN_API_TOKEN or WHATSAPP_TO not set")
    return
  }

  // Green API uses chatId format: countrycode+number@c.us (no + prefix)
  const chatId = to.replace(/^\+/, "") + "@c.us"

  const totalValue = newLeads.reduce((s, l) => s + (l.valueNum || 0), 0)
  const sectorSummary = [...new Set(newLeads.map(l => l.sector))].slice(0, 4).join(", ")

  let msg: string
  if (newLeads.length === 0) {
    msg = `EdgeProp CRM: No new commercial leads today.`
  } else {
    const topLeads = newLeads
      .filter(l => l.valueNum > 0)
      .sort((a, b) => b.valueNum - a.valueNum)
      .slice(0, 3)
      .map(l => `• ${l.company || l.person || "Unknown"} — ${l.property} (${l.value}) [${l.sector}]`)
      .join("\n")

    msg = `🏢 *EdgeProp Daily Digest*\n${new Date().toLocaleDateString("en-SG")}\n\n` +
      `📊 *${newLeads.length} new leads* | $${totalValue >= 1000 ? (totalValue/1000).toFixed(1)+"B" : totalValue.toFixed(0)+"M"}+ deal value\n` +
      `Sectors: ${sectorSummary}\n\n` +
      (topLeads ? `*Top deals:*\n${topLeads}\n\n` : "") +
      `🔗 https://edgeprop-crm.vercel.app`
  }

  const url = `https://api.green-api.com/waInstance${instance}/sendMessage/${apiToken}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message: msg }),
  })

  const json = await res.json() as { idMessage?: string; message?: string }
  if (json.idMessage) {
    console.log(`✅ WhatsApp sent to ${to} via Green API (id: ${json.idMessage})`)
  } else {
    console.error(`WhatsApp error: ${JSON.stringify(json)}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv()
  console.log(`\n=== EdgeProp Daily Digest — ${new Date().toISOString()} ===\n`)

  const skipScrape = process.argv.includes("--no-scrape")
  const maxPagesIdx = process.argv.indexOf("--max-pages")
  const parsedPages = maxPagesIdx !== -1 ? parseInt(process.argv[maxPagesIdx + 1], 10) : 5
  const maxPages = Number.isFinite(parsedPages) && parsedPages > 0 ? Math.min(parsedPages, 1000) : 5
  if (!skipScrape) runScraper(maxPages)

  const newLeads = getNewLeads()
  const allLeads: Lead[] = fs.existsSync(LEADS_FILE)
    ? JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"))
    : []

  console.log(`\n${newLeads.length} new leads since last run`)
  if (newLeads.length > 0) {
    const sectors = newLeads.reduce<Record<string, number>>((a, l) => { a[l.sector] = (a[l.sector] || 0) + 1; return a }, {})
    console.log("Breakdown:", JSON.stringify(sectors))
  }

  await Promise.all([
    sendEmail(newLeads, allLeads.length),
    sendWhatsApp(newLeads),
  ])

  console.log("\n✓ Digest complete")
}

main().catch(console.error)
