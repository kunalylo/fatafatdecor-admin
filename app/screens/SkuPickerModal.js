'use client'

import { useEffect, useState } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'

/**
 * Modal that lets admin search master_inventory and pick a SKU + quantity
 * to manually add to a reference's detected_items list.
 *
 * Props:
 *   onClose()
 *   onAdd(item)  — item shape matches ReferenceDetailScreen's `items` entries
 */
export default function SkuPickerModal({ onClose, onAdd }) {
  const { showToast } = useApp()
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [quantity, setQuantity] = useState(20)

  const doSearch = async (q) => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '40' })
    if (q) params.set('q', q)
    const res = await api(`admin/references/sku-search?${params.toString()}`)
    setLoading(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setResults(res.items || [])
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 250)
    return () => clearTimeout(t)
  }, [query])

  const handleAdd = () => {
    if (!selected) { showToast('Pick an item first', 'error'); return }
    const qty = Math.max(1, Number(quantity) || 1)
    const cost = selected.per_unit_cost || 0
    const price = selected.selling_price_per_unit || cost * 2

    onAdd({
      raw_detection: `${qty}x ${selected.name} (manually added)`,
      matched_sku_code: selected.sku_code,
      matched_sku_id: selected.id,
      sku_name: selected.name,
      category: selected.category,
      quantity: qty,
      unit_cost: cost,
      unit_price: price,
      line_cost: cost * qty,
      line_price: price * qty,
      confidence: 'manual',
      reasoning: 'Manually added by admin',
      is_removable: false,
      raw: { manual: true },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="glass-floating rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="glass-overlay border-b border-white/40 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-display text-2xl text-gray-900">Add <span className="italic iridescent-text">Item</span> from Inventory</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search e.g. 'gold chrome 12' or 'pink pearl'..."
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              {query ? 'No matches. Try different keywords.' : 'Type to search.'}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map(item => {
                const isSelected = selected?.sku_code === item.sku_code
                return (
                  <button
                    key={item.sku_code}
                    onClick={() => setSelected(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition
                      ${isSelected ? 'glass-card border border-pink-300' : 'hover:bg-white/40 border border-transparent'}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{item.sku_code}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Cost Rs {item.per_unit_cost?.toFixed(2)}</p>
                      <p className="text-sm font-semibold text-pink-600">Sell Rs {item.selling_price_per_unit?.toFixed(2)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with quantity + add */}
        <div className="glass-overlay border-t border-white/40 px-6 py-4 flex items-center gap-3 rounded-b-2xl">
          <div className="flex-1 min-w-0">
            {selected ? (
              <p className="text-sm text-gray-700 truncate">
                <span className="font-semibold">{selected.name}</span> selected
              </p>
            ) : (
              <p className="text-sm text-gray-400">Pick an item above</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Qty</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-20 px-2 py-1.5 bg-white/70 border border-white/80 rounded text-sm focus:outline-none focus:border-pink-400 text-center"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!selected}
            className="px-4 py-2 btn-primary-luxury disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add to List
          </button>
        </div>
      </div>
    </div>
  )
}
