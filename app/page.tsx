"use client"

import { useState, useMemo } from "react"
import { leads } from "@/data/leads"
import { formatDealValue } from "@/lib/format"

const ALL_SECTORS = ["Industrial","Hotel","Office","Shophouse","Commercial","Retail","Mixed","International"] as const
const ALL_INTENTS = ["BUY","SELL","BID","JV","BROKER","ADVISORY","REDEVELOP","LEASE","LAUNCH"] as const

const INTENT_STYLE: Record<string, { badge: string; row: string }> = {
  BUY:      { badge: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300", row: "border-l-[3px] border-l-emerald-400" },
  SELL:     { badge: "bg-red-100 text-red-800 ring-1 ring-red-300",           row: "border-l-[3px] border-l-red-400" },
  BID:      { badge: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",     row: "border-l-[3px] border-l-amber-400" },
  JV:       { badge: "bg-purple-100 text-purple-800 ring-1 ring-purple-300",  row: "border-l-[3px] border-l-purple-400" },
  BROKER:   { badge: "bg-blue-100 text-blue-800 ring-1 ring-blue-300",        row: "border-l-[3px] border-l-blue-400" },
  ADVISORY: { badge: "bg-gray-100 text-gray-600",                             row: "border-l-[3px] border-l-gray-300" },
  REDEVELOP:{ badge: "bg-orange-100 text-orange-800 ring-1 ring-orange-300",  row: "border-l-[3px] border-l-orange-400" },
  LEASE:    { badge: "bg-teal-100 text-teal-800 ring-1 ring-teal-300",        row: "border-l-[3px] border-l-teal-400" },
  LAUNCH:   { badge: "bg-pink-100 text-pink-800 ring-1 ring-pink-300",        row: "border-l-[3px] border-l-pink-400" },
}

const SECTOR_STYLE: Record<string, string> = {
  Industrial:   "bg-amber-100 text-amber-800",
  Hotel:        "bg-pink-100 text-pink-800",
  Office:       "bg-teal-100 text-teal-800",
  Shophouse:    "bg-orange-100 text-orange-800",
  Commercial:   "bg-indigo-100 text-indigo-800",
  Retail:       "bg-lime-100 text-lime-800",
  Mixed:        "bg-violet-100 text-violet-800",
  International:"bg-blue-100 text-blue-800",
}

// Leads from the last 7 days are "new"
const WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10)

type SortKey = "date" | "company" | "sector" | "intent" | "valueNum" | "property"

export default function Home() {
  const [q, setQ] = useState("")
  const [sectors, setSectors] = useState<Set<string>>(new Set(ALL_SECTORS))
  const [intents, setIntents] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc")
  const [expandedId, setExpandedId] = useState<number|null>(null)
  const [showNewOnly, setShowNewOnly] = useState(false)

  const filtered = useMemo(() => {
    const rows = leads.filter(l => {
      const text = `${l.company} ${l.person} ${l.property} ${l.notes} ${l.articleTitle}`.toLowerCase()
      return (
        (!q || text.includes(q.toLowerCase())) &&
        (sectors.size === 0 || sectors.has(l.sector)) &&
        (intents.size === 0 || intents.has(l.intent)) &&
        (!showNewOnly || l.date >= WEEK_AGO)
      )
    })
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "", bv = b[sortKey] ?? ""
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [q, sectors, intents, sortKey, sortDir, showNewOnly])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  function toggleSector(s: string) {
    const n = new Set(sectors)
    n.has(s) ? n.delete(s) : n.add(s)
    setSectors(n)
  }

  function toggleIntent(i: string) {
    const n = new Set(intents)
    n.has(i) ? n.delete(i) : n.add(i)
    setIntents(n)
  }

  const totalValue = filtered.reduce((s, l) => s + (l.valueNum || 0), 0)
  const buyers = filtered.filter(l => ["BUY","BID","JV"].includes(l.intent)).length
  const newCount = filtered.filter(l => l.date >= WEEK_AGO).length
  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""

  return (
    <main className="min-h-screen bg-[#f5f6fa]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">EdgeProp Capital Markets</h1>
            <p className="text-xs text-gray-400">{leads.length.toLocaleString()} leads · Singapore commercial RE</p>
          </div>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            placeholder="🔍  Search company, property, notes…"
            value={q} onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-4 md:px-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Showing leads",    val: filtered.length.toLocaleString(), sub: `of ${leads.length.toLocaleString()} total` },
            { label: "Est. deal value",  val: `${formatDealValue(totalValue)}+`, sub: "aggregate" },
            { label: "Active buyers",    val: buyers.toLocaleString(), sub: "BUY · BID · JV" },
            { label: "New this week",    val: newCount.toLocaleString(), sub: "last 7 days", highlight: newCount > 0 },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl border px-3 py-2.5 ${s.highlight ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200"}`}>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">{s.label}</p>
              <p className={`text-2xl font-semibold mt-0.5 ${s.highlight ? "text-emerald-700" : "text-gray-900"}`}>{s.val}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 mb-4 space-y-3">
          {/* Sector toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">Sector</span>
            {ALL_SECTORS.map(s => (
              <button
                key={s}
                onClick={() => toggleSector(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  sectors.has(s)
                    ? (SECTOR_STYLE[s] || "bg-gray-200 text-gray-700") + " ring-1 ring-offset-1 ring-current"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setSectors(sectors.size === ALL_SECTORS.length ? new Set() : new Set(ALL_SECTORS))}
              className="ml-1 text-[11px] text-gray-400 hover:text-gray-700 underline"
            >
              {sectors.size === ALL_SECTORS.length ? "none" : "all"}
            </button>
          </div>

          {/* Intent toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">Intent</span>
            {ALL_INTENTS.map(i => (
              <button
                key={i}
                onClick={() => toggleIntent(i)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  intents.has(i)
                    ? (INTENT_STYLE[i]?.badge || "bg-gray-200 text-gray-700") + " ring-1 ring-offset-1 ring-current"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {i}
              </button>
            ))}
            {intents.size > 0 && (
              <button onClick={() => setIntents(new Set())} className="ml-1 text-[11px] text-gray-400 hover:text-gray-700 underline">clear</button>
            )}
          </div>

          {/* Quick filters */}
          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">Quick</span>
            <button
              onClick={() => setShowNewOnly(v => !v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${showNewOnly ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"}`}
            >
              🆕 New this week
            </button>
            <button
              onClick={() => { setIntents(new Set(["BUY","BID","JV"])) }}
              className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all"
            >
              💰 Active buyers
            </button>
            <button
              onClick={() => { setIntents(new Set(["SELL"])) }}
              className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-800 hover:border-red-200 transition-all"
            >
              🏷️ Sellers only
            </button>
            <button
              onClick={() => { setSectors(new Set(ALL_SECTORS)); setIntents(new Set()); setQ(""); setShowNewOnly(false) }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1"
            >
              Reset all
            </button>
          </div>
        </div>

        {/* Table — fixed layout, no horizontal scroll */}
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: "8%" }}  />  {/* Date */}
              <col style={{ width: "8%" }}  />  {/* Sector */}
              <col style={{ width: "7%" }}  />  {/* Intent */}
              <col style={{ width: "13%" }} />  {/* Company */}
              <col style={{ width: "15%" }} />  {/* Property */}
              <col style={{ width: "7%" }}  />  {/* Value */}
              <col style={{ width: "36%" }} />  {/* Notes — widest, the gold */}
              <col style={{ width: "6%" }}  />  {/* Article */}
            </colgroup>
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                {([
                  ["date","Date"],
                  ["sector","Sector"],
                  ["intent","Intent"],
                  ["company","Company"],
                  ["property","Property"],
                  ["valueNum","Value"],
                  ["notes","Intelligence / Notes"],
                  ["sourceUrl","↗ Link"],
                ] as [SortKey|"sourceUrl"|"notes", string][]).map(([key, label]) => (
                  <th
                    key={key}
                    className={`text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-3 ${["date","sector","intent","company","property","valueNum"].includes(key as string) ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                    onClick={() => ["date","sector","intent","company","property","valueNum"].includes(key as string) && toggleSort(key as SortKey)}
                  >
                    {label}{["date","sector","intent","company","property","valueNum"].includes(key as string) ? arrow(key as SortKey) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400">No leads match your filters.</td></tr>
              )}
              {filtered.map((l) => {
                const isExpanded = expandedId === l.id
                const isNew = l.date >= WEEK_AGO
                const intentStyle = INTENT_STYLE[l.intent] || { badge: "bg-gray-100 text-gray-600", row: "border-l-[3px] border-l-gray-200" }

                return (
                  <>
                    <tr
                      key={l.id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${intentStyle.row} ${isExpanded ? "bg-blue-50/60" : "hover:bg-gray-50/80"}`}
                      onClick={() => setExpandedId(isExpanded ? null : l.id)}
                    >
                      {/* Date */}
                      <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {isNew && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 mb-0.5" title="New this week"/>}
                        {l.date}
                      </td>

                      {/* Sector */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${SECTOR_STYLE[l.sector] || "bg-gray-100 text-gray-700"}`}>
                          {l.sector}
                        </span>
                      </td>

                      {/* Intent */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${intentStyle.badge}`}>
                          {l.intent}
                        </span>
                      </td>

                      {/* Company */}
                      <td className="px-3 py-2.5 font-semibold text-gray-900">
                        <span className="truncate block" title={l.company}>{l.company || "—"}</span>
                      </td>

                      {/* Property */}
                      <td className="px-3 py-2.5 text-gray-700">
                        <span className="truncate block" title={l.property}>{l.property || "—"}</span>
                      </td>

                      {/* Value */}
                      <td className="px-3 py-2.5 font-semibold text-gray-900 text-xs">
                        {l.value || "—"}
                      </td>

                      {/* Notes — the intelligence */}
                      <td className="px-3 py-2.5 text-gray-600">
                        <span className="block text-xs leading-relaxed line-clamp-3" title={l.notes}>
                          {l.notes || <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Article link */}
                      <td className="px-3 py-2.5 text-center">
                        {l.sourceUrl
                          ? <a
                              href={l.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition-colors"
                              title="Open article"
                            >↗</a>
                          : "—"}
                      </td>
                    </tr>

                    {/* Expanded contact panel */}
                    {isExpanded && (
                      <tr key={`${l.id}-expand`} className="border-b border-gray-100 bg-blue-50/40">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap gap-6 text-sm">
                            {/* Contact */}
                            <div className="min-w-[180px]">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contact</p>
                              <p className="font-semibold text-gray-900">{l.person || "—"}</p>
                              {l.role && <p className="text-xs text-gray-500 mt-0.5">{l.role}</p>}
                            </div>
                            {/* Phone */}
                            {l.phone && (
                              <div className="min-w-[140px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone</p>
                                <a href={`tel:${l.phone}`} className="text-blue-600 hover:underline font-medium">{l.phone}</a>
                              </div>
                            )}
                            {/* Email */}
                            {l.email && (
                              <div className="min-w-[200px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</p>
                                <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline font-medium">{l.email}</a>
                              </div>
                            )}
                            {/* Article */}
                            {l.sourceUrl && (
                              <div className="min-w-[200px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Source Article</p>
                                <a
                                  href={l.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline text-xs"
                                >{l.articleTitle || "Open article ↗"}</a>
                              </div>
                            )}
                            {/* Full notes if long */}
                            {l.notes && l.notes.length > 120 && (
                              <div className="w-full">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Intelligence</p>
                                <p className="text-xs text-gray-700 leading-relaxed max-w-3xl">{l.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-3 py-2.5 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
              <span>Showing {filtered.length.toLocaleString()} leads · Click any row to reveal contact details</span>
              <a href="https://www.edgeprop.sg" target="_blank" rel="noreferrer" className="hover:underline">Source: EdgeProp Singapore</a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
