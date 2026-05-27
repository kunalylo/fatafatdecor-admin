'use client'

import { useEffect, useState, useRef } from 'react'
import { Upload, Search, Edit2, X, Package, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'
import CreateItemModal from './CreateItemModal'

export default function InventoryItemsTab() {
  const { showToast } = useApp()
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('')
  const [finish, setFinish] = useState('')
  const [importing, setImporting] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [autoOnly, setAutoOnly] = useState(false)
  const [usedOnly, setUsedOnly] = useState(false)
  const fileInputRef = useRef(null)

  const loadItems = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
    })
    if (search)   params.set('search', search)
    if (category) params.set('category', category)
    if (color)    params.set('color', color)
    if (finish)   params.set('finish', finish)
    if (autoOnly) params.set('auto_only', 'true')
    if (usedOnly) params.set('used_only', 'true')

    const res = await api(`admin/inventory/items?${params.toString()}`)
    setLoading(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setItems(res.items || [])
    setTotalPages(res.pages || 1)
  }

  const loadStats = async () => {
    const res = await api('admin/inventory/stats')
    if (!res.error) setStats(res)
  }

  useEffect(() => { loadItems() }, [page, search, category, color, finish, autoOnly, usedOnly])
  useEffect(() => { loadStats() }, [])

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const fd = new FormData()
    fd.append('file', file)

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    const url = apiBase ? `${apiBase}/api/admin/inventory/import-excel` : '/api/admin/inventory/import-excel'

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      setImporting(false)
      if (data.error) { showToast(data.error, 'error'); return }
      showToast(`Imported ${data.imported}, updated ${data.updated} (${data.errors} errors)`, 'success')
      e.target.value = ''
      loadItems()
      loadStats()
    } catch (e) {
      setImporting(false)
      showToast('Import failed: ' + e.message, 'error')
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search SKU, color, category..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
          />
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {importing ? 'Importing...' : 'Import Excel'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total SKUs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
          </div>
          <button
            onClick={() => { setUsedOnly(true); setAutoOnly(false); setPage(1) }}
            className={`p-4 rounded-lg border text-left transition ${usedOnly ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200 hover:border-green-300'}`}
            title="Click to filter to SKUs used in approved references"
          >
            <p className="text-xs text-green-700">🤖 Used in References</p>
            <p className="text-2xl font-bold text-green-700">{(stats.used_in_references || 0).toLocaleString()}</p>
          </button>
          <button
            onClick={() => { setAutoOnly(true); setUsedOnly(false); setPage(1) }}
            className={`p-4 rounded-lg border text-left transition ${autoOnly ? 'bg-purple-100 border-purple-400' : 'bg-white border-gray-200 hover:border-purple-300'}`}
            title="Click to filter to auto-created SKUs"
          >
            <p className="text-xs text-purple-700">⚡ Auto-created</p>
            <p className="text-2xl font-bold text-purple-700">{(stats.auto_created || 0).toLocaleString()}</p>
          </button>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{stats.categories?.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Colors</p>
            <p className="text-2xl font-bold text-gray-900">{stats.colors?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="">All categories</option>
            {stats.categories.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
          <select
            value={color}
            onChange={e => { setColor(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="">All colors</option>
            {stats.colors.slice(0, 30).map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
            ))}
          </select>
          <select
            value={finish}
            onChange={e => { setFinish(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none"
          >
            <option value="">All finishes</option>
            {stats.finishes.map(f => (
              <option key={f.name} value={f.name}>{f.name} ({f.count})</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-green-300">
            <input
              type="checkbox"
              checked={usedOnly}
              onChange={e => { setUsedOnly(e.target.checked); setPage(1) }}
            />
            <span className="text-green-700 font-semibold">🤖 Used in refs only</span>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-purple-300">
            <input
              type="checkbox"
              checked={autoOnly}
              onChange={e => { setAutoOnly(e.target.checked); setPage(1) }}
            />
            <span className="text-purple-700 font-semibold">⚡ Auto-created only</span>
          </label>
          {(category || color || finish || search || autoOnly || usedOnly) && (
            <button
              onClick={() => { setCategory(''); setColor(''); setFinish(''); setSearch(''); setAutoOnly(false); setUsedOnly(false); setPage(1) }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No items found.</p>
            <p className="text-xs text-gray-400">Import your Excel file to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-left">Finish</th>
                  <th className="px-4 py-3 text-right">Size</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Sell (2x)</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.sku_code} className={`border-t border-gray-100 hover:bg-pink-50/30 ${
                    item.auto_created ? 'bg-purple-50/40' :
                    item.used_in_references_count > 0 ? 'bg-green-50/30' : ''
                  }`}>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs text-gray-700 truncate">{item.sku_code}</span>
                        {item.auto_created && (
                          <span className="text-[9px] uppercase font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                            ⚡ Auto-SKU
                          </span>
                        )}
                        {item.used_in_references_count > 0 && (
                          <span className="text-[9px] uppercase font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 shrink-0">
                            🤖 Used ×{item.used_in_references_count}
                          </span>
                        )}
                        {item.needs_review && (
                          <span className="text-[9px] uppercase font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{item.subcategory || item.category}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs">{item.color}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{item.finish}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.size_inches}"</td>
                    <td className="px-4 py-3 text-right text-gray-500">Rs {item.per_unit_cost?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-pink-600">Rs {item.selling_price_per_unit?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-pink-500 hover:text-pink-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded"
            >
              Prev
            </button>
            <span className="text-gray-600">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedItem && (
        <ItemEditModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSaved={() => { setSelectedItem(null); loadItems() }}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateItemModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); loadItems(); loadStats() }}
        />
      )}
    </div>
  )
}

function ItemEditModal({ item, onClose, onSaved }) {
  const { showToast } = useApp()
  const [form, setForm] = useState({
    color: item.color || '',
    finish: item.finish || '',
    size_inches: item.size_inches || 0,
    pack_quantity: item.pack_quantity || 0,
    cost_price_pack: item.cost_price_pack || 0,
    per_unit_cost: item.per_unit_cost || 0,
    selling_price_per_unit: item.selling_price_per_unit || 0,
    source_url: item.source_url || '',
    active: item.active !== false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await api(`admin/inventory/items/${item.sku_code}`, {
      method: 'PUT',
      body: form,
    })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('Item updated', 'success')
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-mono">{item.sku_code}</p>
            <h3 className="text-lg font-bold text-gray-900">{item.subcategory || item.category}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Color" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} />
            <Field label="Finish" value={form.finish} onChange={v => setForm(f => ({ ...f, finish: v }))} />
            <Field label="Size (inches)" type="number" value={form.size_inches} onChange={v => setForm(f => ({ ...f, size_inches: Number(v) }))} />
            <Field label="Pack Qty" type="number" value={form.pack_quantity} onChange={v => setForm(f => ({ ...f, pack_quantity: Number(v) }))} />
            <Field label="Cost (per unit)" type="number" step="0.01" value={form.per_unit_cost}
              onChange={v => {
                const n = Number(v)
                setForm(f => ({ ...f, per_unit_cost: n, selling_price_per_unit: Math.round(n * 2 * 100) / 100 }))
              }} />
            <Field label="Sell (per unit, 2x auto)" type="number" step="0.01" value={form.selling_price_per_unit} onChange={v => setForm(f => ({ ...f, selling_price_per_unit: Number(v) }))} />
          </div>
          <Field label="Source URL" value={form.source_url} onChange={v => setForm(f => ({ ...f, source_url: v }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            Active
          </label>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white text-sm font-semibold rounded-lg">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', step }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 font-semibold mb-1">{label}</label>
      <input
        type={type}
        step={step}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
      />
    </div>
  )
}
