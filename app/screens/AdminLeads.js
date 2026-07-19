'use client'

// ── Leads inbox ──────────────────────────────────────────────────────
// Enquiries from the Bulk / Corporate / Private / Gift flows.
// GET  admin/leads?type&status → { leads, statuses }
// PATCH admin/leads/:id { status }

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  Inbox, Loader2, RefreshCw, Phone, MessageCircle,
  Boxes, Building2, Lock, Gift, User, MapPin, CalendarDays,
} from 'lucide-react'

const TYPE_META = {
  bulk:      { label: 'Bulk',      icon: Boxes },
  corporate: { label: 'Corporate', icon: Building2 },
  private:   { label: 'Private',   icon: Lock },
  gift:      { label: 'Gift',      icon: Gift },
}

const TONE_CLASS = {
  amber:    'bg-amber-100 text-amber-700',
  pink:     'bg-pink-100 text-pink-700',
  lavender: 'bg-purple-100 text-purple-700',
  green:    'bg-green-100 text-green-700',
  gray:     'bg-gray-100 text-gray-700',
}
const toneClass = (tone) => TONE_CLASS[tone] || TONE_CLASS.gray

const fmtDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
    })
  } catch { return '—' }
}

const waLink = (lead) => {
  let digits = String(lead.contactPhone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) digits = `91${digits}`
  const text = `Hi${lead.contactName ? ' ' + lead.contactName : ''}, this is Fatafat Decor regarding your enquiry ${lead.leadId || ''}`.trim()
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export default function AdminLeads() {
  const { showToast } = useApp()
  const [leads, setLeads]           = useState([])
  const [statuses, setStatuses]     = useState([])
  const [fetching, setFetching]     = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating]     = useState(null)

  const load = useCallback(async () => {
    setFetching(true)
    const params = new URLSearchParams()
    if (typeFilter !== 'all')   params.set('type', typeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const qs = params.toString()
    const d = await api(`admin/leads${qs ? `?${qs}` : ''}`)
    if (!d.error) {
      setLeads(Array.isArray(d.leads) ? d.leads : [])
      setStatuses(Array.isArray(d.statuses) ? d.statuses : [])
    } else showToast(d.error, 'error')
    setFetching(false)
  }, [typeFilter, statusFilter, showToast])

  useEffect(() => { load() }, [load])

  const setStatus = async (lead, s) => {
    if (lead.status === s.id || updating) return
    setUpdating(lead.id)
    const d = await api(`admin/leads/${lead.id}`, { method: 'PATCH', body: { status: s.id } })
    setUpdating(null)
    if (d.error) { showToast(d.error, 'error'); return }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: s.id } : l))
    showToast(`Marked as ${s.label}`, 'success')
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
            <Inbox className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-display text-xl text-gray-900 leading-tight">Leads Inbox</h3>
            <p className="text-xs text-gray-400">Bulk · Corporate · Private · Gift enquiries · {leads.length} shown</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-pink-300'}`}
        >
          All Types
        </button>
        {Object.entries(TYPE_META).map(([id, meta]) => {
          const Icon = meta.icon
          return (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${typeFilter === id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-pink-300'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {meta.label}
            </button>
          )
        })}
      </div>

      {/* Status filter */}
      {statuses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-pink-300'}`}
          >
            All Statuses
          </button>
          {statuses.map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${statusFilter === s.id ? `${toneClass(s.tone)} ring-2 ring-pink-300` : 'bg-white border border-gray-200 text-gray-500 hover:border-pink-300'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {fetching ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-floating rounded-2xl text-center py-10">
          <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No leads match these filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {leads.map(lead => {
            const meta = TYPE_META[lead.type] || { label: lead.type, icon: Inbox }
            const current = statuses.find(s => s.id === lead.status)
            const wa = waLink(lead)
            return (
              <div key={lead.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                      {lead.leadId || lead.id?.slice(0, 8)} · {meta.label}
                    </p>
                    <h4 className="font-bold text-gray-800 leading-tight truncate">
                      {lead.occasion || lead.company || 'Enquiry'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 min-w-0">
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {lead.contactName || '—'}{lead.contactPhone ? ` · ${lead.contactPhone}` : ''}
                      </span>
                    </div>
                    {(lead.company || lead.city) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 min-w-0">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {[lead.company, lead.city].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${toneClass(current?.tone)}`}>
                    {current?.label || lead.status}
                  </span>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Qty</p>
                    <p className="text-sm font-semibold text-gray-800">{lead.quantity || '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Budget</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{lead.budget || '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Date</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{lead.deliveryDate || '—'}</p>
                  </div>
                </div>

                {lead.notes && (
                  <p className="text-xs text-gray-500 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
                    {lead.notes}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <CalendarDays className="w-3 h-3" /> Received {fmtDate(lead.created_at)}
                </div>

                {/* Status workflow */}
                <div className="flex gap-1.5 flex-wrap">
                  {statuses.map(s => (
                    <button
                      key={s.id}
                      disabled={updating === lead.id}
                      onClick={() => setStatus(lead, s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                        lead.status === s.id
                          ? `${toneClass(s.tone)} ring-2 ring-pink-300`
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500'
                      }`}
                    >
                      {updating === lead.id && lead.status !== s.id
                        ? <Loader2 className="w-3 h-3 animate-spin inline" />
                        : s.label}
                    </button>
                  ))}
                </div>

                {/* Quick actions */}
                {lead.contactPhone && (
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${lead.contactPhone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
