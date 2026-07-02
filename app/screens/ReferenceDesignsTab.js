'use client'

import { useEffect, useState } from 'react'
import { Upload, Image as ImageIcon, CheckCircle, Clock, XCircle, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'
import { BUDGET_BRACKETS, bracketForPrice } from '../lib/budget-brackets'
import { customerBreakdown } from '../lib/pricing-calc'
import ReferenceUploadModal from './ReferenceUploadModal'
import ReferenceDetailScreen from './ReferenceDetailScreen'

const OCCASIONS = ['birthday','anniversary','wedding','baby_shower','engagement','corporate','festival','housewarming','new_year','store_opening','party','dinner']
const STATUSES  = [
  { value: '',                label: 'All statuses' },
  { value: 'pending_review',  label: 'Pending Review' },
  { value: 'approved',        label: 'Approved' },
  { value: 'rejected',        label: 'Rejected' },
  { value: 'processing',      label: 'Processing' },
  { value: 'error',           label: 'Error' },
]
const SORTS = [
  { value: 'recent',    label: 'Most recent' },
  { value: 'popular',   label: 'Most used' },
  { value: 'price_asc', label: 'Price low → high' },
  { value: 'price_desc',label: 'Price high → low' },
  { value: 'margin',    label: 'Best margin' },
]

export default function ReferenceDesignsTab() {
  const { showToast } = useApp()
  const [refs, setRefs] = useState([])
  const [stats, setStats] = useState(null)
  const [coverage, setCoverage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [occasion, setOccasion] = useState('')
  const [status, setStatus] = useState('')
  const [bracket, setBracket] = useState('')
  const [sort, setSort] = useState('recent')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedRef, setSelectedRef] = useState(null)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '30',
      sort,
    })
    if (occasion) params.set('occasion', occasion)
    if (status)   params.set('status', status)
    if (bracket)  params.set('bracket', bracket)

    const res = await api(`admin/references?${params.toString()}`)
    setLoading(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRefs(res.references || [])
    setPages(res.pages || 1)
  }

  const loadStats = async () => {
    const [s, c] = await Promise.all([
      api('admin/references-stats'),
      api('admin/references/budget-coverage'),
    ])
    if (!s.error) setStats(s)
    if (!c.error) setCoverage(c)
  }

  useEffect(() => { load() }, [page, occasion, status, bracket, sort])
  useEffect(() => { loadStats() }, [])

  // Poll while any reference is processing
  useEffect(() => {
    const hasProcessing = refs.some(r => r.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [refs])

  if (selectedRef) {
    return (
      <ReferenceDetailScreen
        referenceId={selectedRef}
        onBack={() => { setSelectedRef(null); load() }}
      />
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 btn-primary-luxury text-white text-sm font-semibold rounded-lg flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Reference
        </button>

        <div className="flex gap-2 ml-auto flex-wrap">
          <select value={bracket} onChange={e => { setBracket(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm">
            <option value="">All budgets</option>
            {BUDGET_BRACKETS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <select value={occasion} onChange={e => { setOccasion(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm">
            <option value="">All occasions</option>
            {OCCASIONS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total References" value={stats.total} />
          <StatCard label="Active (Live)" value={stats.active} accent="green" />
          <StatCard label="Pending Review" value={stats.pending_review} accent="amber" />
          <StatCard label="Avg Margin" value={`${(stats.avg_margin_percent || 0).toFixed(1)}%`} accent="pink" />
        </div>
      )}

      {/* Budget Coverage — which brackets have references, click to filter */}
      {coverage && (
        <div className="glass-floating rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-pink-500" />
            <h4 className="font-display text-xl text-gray-900">Budget Coverage</h4>
            <span className="text-xs text-gray-500">click a bracket to filter</span>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {coverage.brackets.map(b => {
              const isActive = bracket === b.id
              const empty    = b.count === 0
              return (
                <button
                  key={b.id}
                  onClick={() => { setBracket(isActive ? '' : b.id); setPage(1) }}
                  className={`
                    px-2 py-2 rounded-lg border text-center transition
                    ${isActive ? 'btn-primary-luxury border-transparent text-white' :
                     empty ? 'bg-white/50 border-white/70 text-gray-400 hover:border-pink-300' :
                     'bg-white/70 border-white/80 text-gray-800 hover:border-pink-300'}
                  `}
                  title={empty ? 'No references in this bracket — gap to fill' : `${b.count} references, ${b.avg_margin?.toFixed(1)}% avg margin`}
                >
                  <div className="text-[10px] font-mono">{b.short}</div>
                  <div className="text-lg font-bold leading-none mt-0.5">{b.count}</div>
                  {!empty && !isActive && (
                    <div className={`text-[9px] mt-0.5 ${b.avg_margin >= 60 ? 'text-green-600' : b.avg_margin >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {b.avg_margin?.toFixed(0)}%
                    </div>
                  )}
                  {empty && <div className="text-[9px] text-gray-400 mt-0.5">empty</div>}
                </button>
              )
            })}
          </div>
          {coverage.gaps?.length > 0 && (
            <div className="mt-3 text-[11px] text-amber-700 bg-amber-50/80 border border-amber-200/70 rounded px-3 py-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{coverage.gaps.length} bracket × occasion gap{coverage.gaps.length === 1 ? '' : 's'} — upload references to cover popular occasions in empty brackets</span>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {loading && refs.length === 0 ? (
        <div className="p-12 text-center text-gray-500">Loading references...</div>
      ) : refs.length === 0 ? (
        <div className="glass-floating rounded-2xl p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-1">No references yet</p>
          <p className="text-sm text-gray-500 mb-4">Upload decoration photos to start building your library.</p>
          <button onClick={() => setShowUpload(true)}
            className="px-4 py-2 btn-primary-luxury text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload First Reference
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {refs.map(r => (
            <ReferenceCard key={r.id} reference={r} onClick={() => setSelectedRef(r.id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1 glass-card hover:bg-white/80 disabled:opacity-50 rounded-lg text-sm">
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1 glass-card hover:bg-white/80 disabled:opacity-50 rounded-lg text-sm">
            Next
          </button>
        </div>
      )}

      {showUpload && (
        <ReferenceUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(id) => { setShowUpload(false); load(); loadStats(); setSelectedRef(id) }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  const accentClass = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    pink:  'text-pink-600',
  }[accent] || 'text-gray-900'
  return (
    <div className="glass-floating p-4 rounded-2xl">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  )
}

function ReferenceCard({ reference: r, onClick }) {
  const StatusBadge = ({ status }) => {
    if (status === 'processing') return (
      <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/90 text-white text-[10px] font-semibold rounded flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Processing
      </div>
    )
    if (status === 'pending_review') return (
      <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500/90 text-white text-[10px] font-semibold rounded flex items-center gap-1">
        <Clock className="w-3 h-3" /> Review
      </div>
    )
    if (status === 'approved') return (
      <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/90 text-white text-[10px] font-semibold rounded flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> {r.active ? 'Live' : 'Paused'}
      </div>
    )
    if (status === 'rejected') return (
      <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/90 text-white text-[10px] font-semibold rounded flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Rejected
      </div>
    )
    if (status === 'error') return (
      <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/90 text-white text-[10px] font-semibold rounded flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Error
      </div>
    )
    return null
  }

  return (
    <button
      onClick={onClick}
      className="glass-floating rounded-2xl overflow-hidden hover:border-pink-400 hover:shadow-lg transition-all text-left group"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {r.thumbnail_url || r.image_url ? (
          <img
            src={r.thumbnail_url || r.image_url}
            alt={r.theme || 'reference'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <StatusBadge status={r.status} />
        {/* Customer-total price chip — always recomputed with the CURRENT pricing
            formula (stored breakdowns may predate a pricing change) */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/75 text-white text-xs font-bold rounded shadow">
          Rs {customerBreakdown(r.base_price || r.customer_breakdown?.decoration_total || 0).total.toLocaleString()}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-gray-500 capitalize truncate">{(r.occasion || '').replace(/_/g, ' ')}</p>
          {r.budget_bracket && (
            <span className="text-[9px] font-mono bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded shrink-0">
              {bracketForPrice(r.base_price)?.short || ''}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{r.theme || 'Untitled'}</p>
        <p className="text-[10px] text-gray-400">
          Decoration Rs {r.base_price?.toLocaleString()} <span className="text-gray-300">·</span> all-inclusive
        </p>
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
          <span>{r.use_count || 0} uses</span>
          {r.margin_percent != null && (
            <span className={`font-semibold ${r.margin_percent >= 60 ? 'text-green-600' : r.margin_percent >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
              Margin {r.margin_percent.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
