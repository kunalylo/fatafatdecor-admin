'use client'

import { useEffect, useState } from 'react'
import { Upload, Image as ImageIcon, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'
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
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [occasion, setOccasion] = useState('')
  const [status, setStatus] = useState('')
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

    const res = await api(`admin/references?${params.toString()}`)
    setLoading(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRefs(res.references || [])
    setPages(res.pages || 1)
  }

  const loadStats = async () => {
    const res = await api('admin/references-stats')
    if (!res.error) setStats(res)
  }

  useEffect(() => { load() }, [page, occasion, status, sort])
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
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Reference
        </button>

        <div className="flex gap-2 ml-auto">
          <select value={occasion} onChange={e => { setOccasion(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
            <option value="">All occasions</option>
            {OCCASIONS.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
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

      {/* Grid */}
      {loading && refs.length === 0 ? (
        <div className="p-12 text-center text-gray-500">Loading references...</div>
      ) : refs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold mb-1">No references yet</p>
          <p className="text-sm text-gray-500 mb-4">Upload decoration photos to start building your library.</p>
          <button onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2">
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
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded text-sm">
            Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded text-sm">
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
    <div className="bg-white p-4 rounded-lg border border-gray-200">
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
      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-pink-400 hover:shadow-lg transition-all text-left group"
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
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded">
          Rs {r.base_price?.toLocaleString()}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-xs text-gray-500 capitalize">{(r.occasion || '').replace(/_/g, ' ')}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{r.theme || 'Untitled'}</p>
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
