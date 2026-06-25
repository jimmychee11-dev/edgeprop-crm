"use client"

import { useState, useMemo } from "react"
import { leads, Lead } from "@/data/leads"

const ALL_SECTORS = ["Industrial","Hotel","Office","Shophouse","Commercial","Retail","Mixed","International","Residential"] as const
const ALL_INTENTS = ["BUY","SELL","BROKER","JV","BID","ADVISORY","REDEVELOP","LEASE","LAUNCH"] as const

const COMMERCIAL_SECTORS = new Set(["Industrial","Hotel","Office","Shophouse","Commercial","Retail","Mixed","International"])

const INTENT_STYLE: Record<string, string> = {
  BUY:      "bg-green-100 text-green-800",
  SELL:     "bg-red-100 text-red-800",
  BROKER:   "bg-blue-100 text-blue-800",
  JV:       "bg-purple-100 text-purple-800",
  BID:      "bg-yellow-100 text-yellow-800",
  ADVISORY: "bg-gray-100 text-gray-700",
  REDEVELOP:"bg-orange-100 text-orange-800",
  LEASE:    "bg-teal-100 text-teal-800",
  LAUNCH:   "bg-pink-100 text-pink-800",
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
  Residential:  "bg-cyan-100 text-cyan-800",
}

type SortKey = keyof Lead

function MultiSelect<T extends string>({
  options, selected, onChange, placeholder,
}: { options: readonly T[]; selected: Set<T>; onChange: (s: Set<T>) => void; placeholder: string }) {
  const [open, setOpen] = useState(false)
  const label = selected.size === 0 ? placeholder : selected.size === 1 ? [...selected][0] : `${selected.size} selected`
  return (
    <div className="relative">
      <button
        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-w-36 text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected.size === 0 ? "text-gray-400" : "text-gray-800"}>{label}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-40 py-1">
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
            onClick={() => { onChange(new Set()); setOpen(false) }}
          >Clear all</button>
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-blue-50">
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => {
                  const next = new Set(selected)
                  next.has(opt) ? next.delete(opt) : next.add(opt)
                  onChange(next)
                }}
                className="rounded"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [q, setQ] = useState("")
  const [sectors, setSectors] = useState<Set<typeof ALL_SECTORS[number]>>(new Set(COMMERCIAL_SECTORS as Set<typeof ALL_SECTORS[number]>))
  const [intents, setIntents] = useState<Set<typeof ALL_INTENTS[number]>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc")
  const [open, setOpen] = useState<{ sector: boolean; intent: boolean }>({ sector: false, intent: false })

  const filtered = useMemo(() => {
    const rows = leads.filter(l => {
      const text = `${l.company} ${l.person} ${l.property} ${l.notes} ${l.articleTitle}`.toLowerCase()
      return (
        (!q || text.includes(q.toLowerCase())) &&
        (sectors.size === 0 || sectors.has(l.sector as typeof ALL_SECTORS[number])) &&
        (intents.size === 0 || intents.has(l.intent as typeof ALL_INTENTS[number]))
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
  }, [q, sectors, intents, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  // Close dropdowns on outside click
  const handleOverlayClick = () => setOpen({ sector: false, intent: false })

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"
  const totalValue = filtered.reduce((s, l) => s + (l.valueNum || 0), 0)
  const buyers = filtered.filter(l => l.intent === "BUY" || l.intent === "JV" || l.intent === "BID").length
  const sectorCounts = filtered.reduce<Record<string,number>>((acc, l) => { acc[l.sector] = (acc[l.sector]||0)+1; return acc }, {})

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      {open.sector || open.intent ? <div className="fixed inset-0 z-40" onClick={handleOverlayClick}/> : null}
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-5 flex items-start justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">EdgeProp Capital Markets CRM</h1>
            <p className="text-sm text-gray-500 mt-0.5">Singapore commercial RE intelligence — {leads.length.toLocaleString()} leads extracted from EdgeProp</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Showing", val: filtered.length.toLocaleString() },
            { label: "Deal value", val: `$${totalValue >= 1000 ? (totalValue/1000).toFixed(1)+"B" : totalValue.toFixed(0)+"M"}+` },
            { label: "Buyers / Bidders", val: buyers },
            { label: "Top sector", val: Object.entries(sectorCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-medium text-gray-900">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 min-w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search company, person, property, notes…"
            value={q} onChange={e => setQ(e.target.value)}
          />
          <div className="relative z-50">
            <MultiSelect options={ALL_SECTORS} selected={sectors} onChange={setSectors} placeholder="All sectors" />
          </div>
          <div className="relative z-50">
            <MultiSelect options={ALL_INTENTS} selected={intents} onChange={setIntents} placeholder="All intents" />
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-800 px-2 py-2 border border-gray-200 rounded-md"
            onClick={() => { setSectors(new Set(COMMERCIAL_SECTORS as Set<typeof ALL_SECTORS[number]>)); setIntents(new Set()); setQ("") }}
          >Reset</button>
          {/* Sector pills showing active selections */}
          {sectors.size > 0 && [...sectors].map(s => (
            <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${SECTOR_STYLE[s] || "bg-gray-100 text-gray-700"}`}>
              {s}
              <button className="ml-1 opacity-60 hover:opacity-100" onClick={() => { const n=new Set(sectors); n.delete(s); setSectors(n) }}>×</button>
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {([
                  ["id","#"],["date","Date"],["company","Company"],["person","Contact"],
                  ["intent","Intent"],["property","Property"],["sector","Sector"],
                  ["valueNum","Value"],["phone","Phone"],["email","Email"],
                  ["sourceUrl","Article"],["notes","Notes"],
                ] as [SortKey,string][]).map(([key,label]) => (
                  <th
                    key={key}
                    className="text-left text-xs font-medium text-gray-500 px-3 py-3 cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
                    onClick={() => toggleSort(key)}
                  >
                    {label}{arrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-12 text-gray-400">No leads match your filters.</td></tr>
              )}
              {filtered.map((l, i) => (
                <tr key={l.id} className={`border-b border-gray-100 hover:bg-blue-50/30 ${i % 2 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-3 py-2.5 text-gray-400 text-xs">{l.id}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{l.date}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[180px]">
                    <span title={l.company}>{l.company || "—"}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {l.person || "—"}
                    {l.role && <div className="text-xs text-gray-400">{l.role}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${INTENT_STYLE[l.intent] || "bg-gray-100 text-gray-700"}`}>{l.intent}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 max-w-[220px]">
                    <span title={l.property}>{l.property}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SECTOR_STYLE[l.sector] || "bg-gray-100 text-gray-700"}`}>{l.sector}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap text-xs">{l.value || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{l.phone || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                    {l.email ? <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline">{l.email}</a> : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {l.sourceUrl
                      ? <a href={l.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline whitespace-nowrap font-medium">↗</a>
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[250px]">
                    <span title={l.notes}>{l.notes}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Source: <a href="https://www.edgeprop.sg" target="_blank" rel="noreferrer" className="underline">EdgeProp Singapore</a> · Updated daily
        </p>
      </div>
    </main>
  )
}
