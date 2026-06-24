"use client"

import { useState, useMemo } from "react"
import { leads, Lead } from "@/data/leads"

const INTENTS = ["BUY","SELL","BROKER","JV","BID","ADVISORY","REDEVELOP"] as const
const SECTORS = ["Industrial","Hotel","Office","Shophouse","Residential","Commercial","International"] as const

const INTENT_STYLE: Record<string, string> = {
  BUY: "bg-green-100 text-green-800",
  SELL: "bg-red-100 text-red-800",
  BROKER: "bg-blue-100 text-blue-800",
  JV: "bg-purple-100 text-purple-800",
  BID: "bg-yellow-100 text-yellow-800",
  ADVISORY: "bg-gray-100 text-gray-700",
  REDEVELOP: "bg-orange-100 text-orange-800",
}

const SECTOR_STYLE: Record<string, string> = {
  Industrial: "bg-amber-100 text-amber-800",
  Hotel: "bg-pink-100 text-pink-800",
  Office: "bg-teal-100 text-teal-800",
  Shophouse: "bg-orange-100 text-orange-800",
  Residential: "bg-cyan-100 text-cyan-800",
  Commercial: "bg-indigo-100 text-indigo-800",
  International: "bg-violet-100 text-violet-800",
}

type SortKey = keyof Lead

export default function Home() {
  const [q, setQ] = useState("")
  const [sector, setSector] = useState("")
  const [intent, setIntent] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("asc")

  const filtered = useMemo(() => {
    let rows = leads.filter(l => {
      const text = `${l.company} ${l.person} ${l.property} ${l.notes}`.toLowerCase()
      return (!q || text.includes(q.toLowerCase())) &&
        (!sector || l.sector === sector) &&
        (!intent || l.intent === intent)
    })
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? "", bv = b[sortKey] ?? ""
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [q, sector, intent, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"
  const totalValue = filtered.reduce((s, l) => s + (l.valueNum || 0), 0)
  const buyers = filtered.filter(l => l.intent === "BUY" || l.intent === "JV").length

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">EdgeProp Leads CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Singapore commercial property intelligence — extracted from EdgeProp news</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total leads", val: filtered.length },
            { label: "Deal value", val: `$${totalValue.toFixed(0)}M+` },
            { label: "Active buyers", val: buyers },
            { label: "Sectors", val: [...new Set(filtered.map(l => l.sector))].length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-medium text-gray-900">{s.val}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search company, person, property…"
            value={q} onChange={e => setQ(e.target.value)}
          />
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={sector} onChange={e => setSector(e.target.value)}>
            <option value="">All sectors</option>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={intent} onChange={e => setIntent(e.target.value)}>
            <option value="">All intents</option>
            {INTENTS.map(i => <option key={i}>{i}</option>)}
          </select>
          {(q || sector || intent) && (
            <button className="text-sm text-gray-500 hover:text-gray-800 px-2" onClick={() => { setQ(""); setSector(""); setIntent("") }}>Clear</button>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {([["id","#"],["date","Date"],["company","Company"],["person","Contact"],["intent","Intent"],["property","Property"],["sector","Sector"],["valueNum","Value"],["phone","Phone"],["email","Email"],["website","Link"],["notes","Notes"]] as [SortKey,string][]).map(([key,label]) => (
                  <th key={key} className="text-left text-xs font-medium text-gray-500 px-3 py-3 cursor-pointer select-none hover:text-gray-800 whitespace-nowrap" onClick={() => toggleSort(key)}>
                    {label}{arrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-10 text-gray-400">No leads match your filters.</td></tr>
              )}
              {filtered.map((l, i) => (
                <tr key={l.id} className={`border-b border-gray-100 hover:bg-blue-50/30 ${i % 2 ? "bg-gray-50/40" : ""}`}>
                  <td className="px-3 py-3 text-gray-400 text-xs">{l.id}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{l.date}</td>
                  <td className="px-3 py-3 font-medium text-gray-900">
                    <a href={l.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">{l.company}</a>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{l.person}<br/><span className="text-xs text-gray-400">{l.role}</span></td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${INTENT_STYLE[l.intent]}`}>{l.intent}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-700 max-w-xs">{l.property}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SECTOR_STYLE[l.sector]}`}>{l.sector}</span>
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{l.value}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{l.phone || "—"}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {l.email ? <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline">{l.email}</a> : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {l.website ? <a href={l.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Link ↗</a> : "—"}
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs max-w-xs">{l.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Source: <a href="https://www.edgeprop.sg/property-news/news" target="_blank" rel="noreferrer" className="underline">EdgeProp Singapore</a> · {leads.length} leads
        </p>
      </div>
    </main>
  )
}
