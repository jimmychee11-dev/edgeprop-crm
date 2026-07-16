"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { leads, Lead } from "@/data/leads"

const ALL_SECTORS = ["Industrial","Hotel","Office","Shophouse","Commercial","Retail","Mixed","International"] as const
const ALL_INTENTS = ["BUY","SELL","BID","JV","BROKER","ADVISORY","REDEVELOP","LEASE","LAUNCH"] as const
const ALL_SOURCES = ["EdgeProp","Business Times","MingTianDi","SBR"] as const
const ALL_STATUSES = ["New","To Contact","Contacted","In Talks","Won","Dead"] as const
type Status = typeof ALL_STATUSES[number]

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

// Source shown as short badge: EP (EdgeProp), BT (Business Times), MTD (MingTianDi)
const SOURCE_BADGE: Record<string, { abbr: string; cls: string }> = {
  "EdgeProp":       { abbr: "EP",  cls: "bg-sky-100 text-sky-800" },
  "Business Times": { abbr: "BT",  cls: "bg-rose-100 text-rose-800" },
  "MingTianDi":     { abbr: "MTD", cls: "bg-fuchsia-100 text-fuchsia-800" },
  "SBR":            { abbr: "SBR", cls: "bg-emerald-100 text-emerald-800" },
}

const STATUS_STYLE: Record<Status, string> = {
  "New":        "bg-gray-100 text-gray-600",
  "To Contact": "bg-amber-100 text-amber-800",
  "Contacted":  "bg-blue-100 text-blue-800",
  "In Talks":   "bg-purple-100 text-purple-800",
  "Won":        "bg-emerald-100 text-emerald-800",
  "Dead":       "bg-gray-200 text-gray-400 line-through",
}

// Leads from the last 7 days are "new"
const WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0,10)

const sourceOf = (l: Lead) => l.source || "EdgeProp"

type SortKey = "id" | "date" | "company" | "sector" | "intent" | "valueNum" | "property" | "source" | "status"

const STORAGE_KEY = "crm-lead-status"

export default function Home() {
  const [q, setQ] = useState("")
  const [sectors, setSectors] = useState<Set<string>>(new Set(ALL_SECTORS))
  const [intents, setIntents] = useState<Set<string>>(new Set())
  const [sources, setSources] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc")
  const [expandedId, setExpandedId] = useState<number|null>(null)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 100

  // Lead status lives in the browser (localStorage) — survives visits, per device
  useEffect(() => {
    try { setStatuses(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) } catch {}
  }, [])
  function setLeadStatus(id: number, status: Status) {
    setStatuses(prev => {
      const next = { ...prev, [id]: status }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }
  const statusOf = (l: Lead): Status => statuses[l.id] || "New"

  const filtered = useMemo(() => {
    const rows = leads.filter(l => {
      const text = `${l.company} ${l.person} ${l.property} ${l.notes} ${l.articleTitle}`.toLowerCase()
      return (
        (!q || text.includes(q.toLowerCase())) &&
        (sectors.size === 0 || sectors.has(l.sector)) &&
        (intents.size === 0 || intents.has(l.intent)) &&
        (sources.size === 0 || sources.has(sourceOf(l))) &&
        (statusFilter.size === 0 || statusFilter.has(statuses[l.id] || "New")) &&
        (!showNewOnly || l.date >= WEEK_AGO)
      )
    })
    return [...rows].sort((a, b) => {
      const va = sortKey === "source" ? sourceOf(a) : sortKey === "status" ? (statuses[a.id] || "New") : a[sortKey] ?? ""
      const vb = sortKey === "source" ? sourceOf(b) : sortKey === "status" ? (statuses[b.id] || "New") : b[sortKey] ?? ""
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [q, sectors, intents, sources, statusFilter, statuses, sortKey, sortDir, showNewOnly])

  // Reset to page 1 whenever the filter set changes
  useEffect(() => { setPage(1) }, [q, sectors, intents, sources, statusFilter, sortKey, sortDir, showNewOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir(key === "id" ? "asc" : "desc") }
  }

  function toggleIn(set: Set<string>, setter: (s: Set<string>) => void, v: string) {
    const n = new Set(set)
    if (n.has(v)) n.delete(v); else n.add(v)
    setter(n)
  }

  const totalValue = filtered.reduce((s, l) => s + (l.valueNum || 0), 0)
  const buyers = filtered.filter(l => ["BUY","BID","JV"].includes(l.intent)).length
  const newCount = filtered.filter(l => l.date >= WEEK_AGO).length
  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""

  const linkedinUrl = (name: string) => `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`
  const googleUrl = (name: string) => `https://www.google.com/search?q=${encodeURIComponent(name + " Singapore contact")}`

  const SORTABLE: SortKey[] = ["id","date","source","sector","intent","company","property","valueNum","status"]

  return (
    <main className="min-h-screen bg-[#f5f6fa]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">SG Capital Markets CRM</h1>
            <p className="text-xs text-gray-400">{leads.length.toLocaleString()} leads · EdgeProp · Business Times · MingTianDi · SBR</p>
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
            { label: "Est. deal value",  val: `$${totalValue >= 1000 ? (totalValue/1000).toFixed(1)+"B" : totalValue.toFixed(0)+"M"}+`, sub: "aggregate" },
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
                onClick={() => toggleIn(sectors, setSectors, s)}
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
                onClick={() => toggleIn(intents, setIntents, i)}
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

          {/* Source + Status toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">Source</span>
            {ALL_SOURCES.map(s => (
              <button
                key={s}
                onClick={() => toggleIn(sources, setSources, s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  sources.has(s)
                    ? SOURCE_BADGE[s].cls + " ring-1 ring-offset-1 ring-current"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {SOURCE_BADGE[s].abbr} · {s}
              </button>
            ))}
            {sources.size > 0 && (
              <button onClick={() => setSources(new Set())} className="ml-1 text-[11px] text-gray-400 hover:text-gray-700 underline">clear</button>
            )}
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide ml-4 shrink-0">Status</span>
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => toggleIn(statusFilter, setStatusFilter, s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  statusFilter.has(s)
                    ? STATUS_STYLE[s] + " ring-1 ring-offset-1 ring-current"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
            {statusFilter.size > 0 && (
              <button onClick={() => setStatusFilter(new Set())} className="ml-1 text-[11px] text-gray-400 hover:text-gray-700 underline">clear</button>
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
              onClick={() => { setSectors(new Set(ALL_SECTORS)); setIntents(new Set()); setSources(new Set()); setStatusFilter(new Set()); setQ(""); setShowNewOnly(false) }}
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
              <col style={{ width: "4%" }}  />  {/* # */}
              <col style={{ width: "7%" }}  />  {/* Date */}
              <col style={{ width: "4%" }}  />  {/* Source */}
              <col style={{ width: "7%" }}  />  {/* Sector */}
              <col style={{ width: "6%" }}  />  {/* Intent */}
              <col style={{ width: "12%" }} />  {/* Company */}
              <col style={{ width: "13%" }} />  {/* Property */}
              <col style={{ width: "6%" }}  />  {/* Value */}
              <col style={{ width: "9%" }}  />  {/* Status */}
              <col style={{ width: "27%" }} />  {/* Notes */}
              <col style={{ width: "5%" }}  />  {/* Link */}
            </colgroup>
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/80">
                {([
                  ["id","#"],
                  ["date","Date"],
                  ["source","Src"],
                  ["sector","Sector"],
                  ["intent","Intent"],
                  ["company","Company"],
                  ["property","Property"],
                  ["valueNum","Value"],
                  ["status","Status"],
                  ["notes","Intelligence / Notes"],
                  ["sourceUrl","↗ Link"],
                ] as [SortKey|"sourceUrl"|"notes", string][]).map(([key, label]) => (
                  <th
                    key={key}
                    className={`text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-2 py-3 ${SORTABLE.includes(key as SortKey) ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                    onClick={() => SORTABLE.includes(key as SortKey) && toggleSort(key as SortKey)}
                  >
                    {label}{SORTABLE.includes(key as SortKey) ? arrow(key as SortKey) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="text-center py-16 text-gray-400">No leads match your filters.</td></tr>
              )}
              {pageRows.map((l, i) => {
                const rowIdx = (safePage - 1) * PAGE_SIZE + i
                const isExpanded = expandedId === l.id
                const isNew = l.date >= WEEK_AGO
                const intentStyle = INTENT_STYLE[l.intent] || { badge: "bg-gray-100 text-gray-600", row: "border-l-[3px] border-l-gray-200" }
                const src = sourceOf(l)
                const badge = SOURCE_BADGE[src] || { abbr: src.slice(0,3).toUpperCase(), cls: "bg-gray-100 text-gray-600" }
                const status = statusOf(l)

                return (
                  <Fragment key={l.id}>
                    <tr
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${intentStyle.row} ${isExpanded ? "bg-blue-50/60" : "hover:bg-gray-50/80"}`}
                      onClick={() => setExpandedId(isExpanded ? null : l.id)}
                    >
                      {/* Serial number */}
                      <td className="px-2 py-2.5 text-[11px] text-gray-400 tabular-nums">{rowIdx + 1}</td>

                      {/* Date */}
                      <td className="px-2 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {isNew && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 mb-0.5" title="New this week"/>}
                        {l.date}
                      </td>

                      {/* Source */}
                      <td className="px-2 py-2.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.cls}`} title={src}>
                          {badge.abbr}
                        </span>
                        {(l.altSources?.length ?? 0) > 0 && (
                          <span className="text-[10px] text-gray-400 ml-0.5" title={l.altSources!.map(s => s.source).join(", ")}>
                            +{l.altSources!.length}
                          </span>
                        )}
                      </td>

                      {/* Sector */}
                      <td className="px-2 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${SECTOR_STYLE[l.sector] || "bg-gray-100 text-gray-700"}`}>
                          {l.sector}
                        </span>
                      </td>

                      {/* Intent */}
                      <td className="px-2 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${intentStyle.badge}`}>
                          {l.intent}
                        </span>
                      </td>

                      {/* Company */}
                      <td className="px-2 py-2.5 font-semibold text-gray-900">
                        <span className="truncate block" title={l.company}>{l.company || "—"}</span>
                      </td>

                      {/* Property */}
                      <td className="px-2 py-2.5 text-gray-700">
                        <span className="truncate block" title={l.property}>{l.property || "—"}</span>
                      </td>

                      {/* Value */}
                      <td className="px-2 py-2.5 font-semibold text-gray-900 text-xs">
                        {l.value || "—"}
                      </td>

                      {/* Status — editable, saved in this browser */}
                      <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                        <select
                          value={status}
                          onChange={e => setLeadStatus(l.id, e.target.value as Status)}
                          className={`w-full text-[11px] font-semibold rounded-md px-1.5 py-1 border-0 cursor-pointer appearance-none ${STATUS_STYLE[status]}`}
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Notes — the intelligence */}
                      <td className="px-2 py-2.5 text-gray-600">
                        <span className="block text-xs leading-relaxed line-clamp-3" title={l.notes}>
                          {l.notes || <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Article link */}
                      <td className="px-2 py-2.5 text-center">
                        {l.sourceUrl
                          ? <a
                              href={l.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition-colors"
                              title={`Open article — ${src}`}
                            >↗</a>
                          : "—"}
                      </td>
                    </tr>

                    {/* Expanded contact panel */}
                    {isExpanded && (
                      <tr className="border-b border-gray-100 bg-blue-50/40">
                        <td colSpan={11} className="px-6 py-4">
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
                            {/* Website */}
                            {l.website && (
                              <div className="min-w-[180px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Website</p>
                                <a href={l.website.startsWith("http") ? l.website : `https://${l.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{l.website}</a>
                              </div>
                            )}
                            {/* Lookup links — company + person */}
                            <div className="min-w-[220px]">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Find Contact</p>
                              <div className="flex flex-wrap gap-2">
                                {l.company && (
                                  <>
                                    <a href={linkedinUrl(l.company)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                      className="text-[11px] px-2 py-1 rounded-md bg-[#0a66c2]/10 text-[#0a66c2] font-semibold hover:bg-[#0a66c2]/20">in · {l.company.slice(0,20)}</a>
                                    <a href={googleUrl(l.company)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                      className="text-[11px] px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200">G · {l.company.slice(0,20)}</a>
                                  </>
                                )}
                                {l.person && (
                                  <a href={linkedinUrl(`${l.person} ${l.company}`)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                    className="text-[11px] px-2 py-1 rounded-md bg-[#0a66c2]/10 text-[#0a66c2] font-semibold hover:bg-[#0a66c2]/20">in · {l.person}</a>
                                )}
                              </div>
                            </div>
                            {/* Source articles — primary + lumped duplicates */}
                            {l.sourceUrl && (
                              <div className="min-w-[240px]">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Source Articles</p>
                                <p>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${badge.cls}`}>{badge.abbr}</span>
                                  <a href={l.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{l.articleTitle || "Open article ↗"}</a>
                                </p>
                                {(l.altSources || []).map(s => {
                                  const b = SOURCE_BADGE[s.source] || { abbr: s.source.slice(0,3).toUpperCase(), cls: "bg-gray-100 text-gray-600" }
                                  return (
                                    <p key={s.url} className="mt-1">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${b.cls}`}>{b.abbr}</span>
                                      <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">{s.title}</a>
                                    </p>
                                  )
                                })}
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
                  </Fragment>
                )
              })}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="px-3 py-2.5 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between flex-wrap gap-2">
              <span>
                Rows {((safePage - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(safePage * PAGE_SIZE, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()} · Click a row for contacts &amp; lookup links · Status saves in this browser
              </span>
              <span className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={safePage === 1}
                  className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">«</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">‹ Prev</button>
                <span className="px-2 tabular-nums">Page {safePage} / {pageCount}</span>
                <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount}
                  className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">Next ›</button>
                <button onClick={() => setPage(pageCount)} disabled={safePage === pageCount}
                  className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">»</button>
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
