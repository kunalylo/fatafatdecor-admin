'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeft, CheckCircle, XCircle, RefreshCw, Loader2, Trash2,
  Edit2, Save, AlertTriangle, Eye, EyeOff, Plus, Bot, Zap, ArrowUp, Check,
  Image as ImageIcon,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'
import { bracketForPrice } from '../lib/budget-brackets'
import { customerBreakdown, adminMargin } from '../lib/pricing-calc'
import SkuPickerModal from './SkuPickerModal'

export default function ReferenceDetailScreen({ referenceId, onBack }) {
  const { showToast } = useApp()
  const [ref, setRef] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingMeta, setEditingMeta] = useState(false)
  const [editingItems, setEditingItems] = useState(false)
  const [meta, setMeta] = useState({})
  const [items, setItems] = useState([])
  const [showSkuPicker, setShowSkuPicker] = useState(false)

  const load = async () => {
    setLoading(true)
    const r = await api(`admin/references/${referenceId}`)
    setLoading(false)
    if (r.error) { showToast(r.error, 'error'); return }
    setRef(r)
    setMeta({
      base_price:  r.base_price,
      occasions:   r.occasions   && r.occasions.length   ? r.occasions   : (r.occasion   ? [r.occasion]   : []),
      setup_types: r.setup_types && r.setup_types.length ? r.setup_types : (r.setup_type ? [r.setup_type] : []),
      theme:       r.theme,
      ai_tags:     (r.ai_tags || []).join(', '),
    })
    setItems(r.detected_items || [])
  }

  useEffect(() => { load() }, [referenceId])

  // Poll while processing
  useEffect(() => {
    if (ref?.status !== 'processing') return
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [ref?.status])

  if (loading && !ref) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" />
        <p className="text-gray-600">Loading reference...</p>
      </div>
    )
  }
  if (!ref) return null

  const handleSaveMeta = async () => {
    setSaving(true)
    const tags = String(meta.ai_tags || '').split(',').map(t => t.trim()).filter(Boolean)
    const res = await api(`admin/references/${referenceId}`, {
      method: 'PUT',
      body: {
        base_price: Number(meta.base_price),
        occasions:   meta.occasions   || [],
        setup_types: meta.setup_types || [],
        theme: meta.theme,
        ai_tags: tags,
      },
    })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRef(res)
    setEditingMeta(false)
    showToast('Saved', 'success')
  }

  const handleSaveItems = async () => {
    setSaving(true)
    const res = await api(`admin/references/${referenceId}`, {
      method: 'PUT',
      body: { detected_items: items },
    })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRef(res)
    setItems(res.detected_items || [])
    setEditingItems(false)
    showToast('Items updated — pricing recalculated', 'success')
  }

  const handleApprove = async () => {
    if (!confirm('Approve and publish this reference for customers?')) return
    setSaving(true)
    const res = await api(`admin/references/${referenceId}/approve`, { method: 'POST' })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRef(res)
    showToast('Reference is now LIVE', 'success')
  }

  const handleReject = async () => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    setSaving(true)
    const res = await api(`admin/references/${referenceId}/reject`, { method: 'POST', body: { reason } })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRef(res)
    showToast('Reference rejected', 'success')
  }

  const handleToggleActive = async () => {
    setSaving(true)
    const endpoint = ref.active ? 'deactivate' : 'activate'
    const res = await api(`admin/references/${referenceId}/${endpoint}`, { method: 'POST' })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    setRef(res)
    showToast(ref.active ? 'Paused' : 'Activated', 'success')
  }

  const handleRerun = async () => {
    if (!confirm('Re-run AI detection? This will overwrite the current items list.')) return
    setSaving(true)
    const res = await api(`admin/references/${referenceId}/rerun`, { method: 'POST' })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('AI pipeline restarted', 'success')
    load()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this reference permanently?')) return
    const res = await api(`admin/references/${referenceId}`, { method: 'DELETE' })
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('Deleted', 'success')
    onBack()
  }

  // Quick action: scale all item quantities proportionally so items_price_total ≈ base_price.
  // Useful when AI undercounted but base_price is the source of truth.
  const handleScaleToBase = () => {
    if (totalItemsPrice <= 0) return
    const factor = basePrice / totalItemsPrice
    setItems(prev => prev.map(it => {
      const newQty = Math.max(1, Math.round((Number(it.quantity) || 1) * factor))
      return {
        ...it,
        quantity:   newQty,
        line_cost:  Math.round((Number(it.unit_cost)  || 0) * newQty * 100) / 100,
        line_price: Math.round((Number(it.unit_price) || 0) * newQty * 100) / 100,
      }
    }))
    setEditingItems(true)
    showToast(`Scaled quantities ×${factor.toFixed(2)} — remember to Save Items`, 'success')
  }

  const totalItemsCost  = items.reduce((s, i) => s + (Number(i.unit_cost)  || 0) * (Number(i.quantity) || 1), 0)
  const totalItemsPrice = items.reduce((s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 1), 0)
  const basePrice       = Number(meta.base_price || ref.base_price || 0)
  const breakdown       = customerBreakdown(basePrice)
  const margin          = adminMargin(basePrice, totalItemsCost)
  const itemsGap        = Math.max(0, basePrice - totalItemsPrice)
  const itemsGapPct     = basePrice > 0 ? (itemsGap / basePrice) * 100 : 0
  const itemsCoverPct   = basePrice > 0 ? Math.min(100, (totalItemsPrice / basePrice) * 100) : 0

  const StatusBadge = () => {
    const map = {
      processing:     { bg: 'bg-blue-500',   text: 'Processing', icon: Loader2, spin: true },
      pending_review: { bg: 'bg-amber-500',  text: 'Pending Review' },
      approved:       { bg: 'bg-green-500',  text: ref.active ? 'Live' : 'Approved (Paused)' },
      rejected:       { bg: 'bg-red-500',    text: 'Rejected' },
      error:          { bg: 'bg-red-500',    text: 'Error' },
    }
    const s = map[ref.status] || { bg: 'bg-gray-500', text: ref.status }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 ${s.bg} text-white text-xs font-semibold rounded-full`}>
        {Icon && <Icon className={`w-3 h-3 ${s.spin ? 'animate-spin' : ''}`} />}
        {s.text}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to References
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Customer Pays</p>
            <p className="text-xl font-bold text-pink-600 leading-none">Rs {breakdown.total.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">incl. decoration Rs {breakdown.decoration_total.toLocaleString()}</p>
          </div>
          <StatusBadge />
        </div>
      </div>

      {/* Image */}
      <div className="glass-floating rounded-2xl overflow-hidden">
        <img src={ref.image_url} alt="" className="w-full max-h-[500px] object-contain bg-gray-50" />
      </div>

      {/* Metadata */}
      <div className="glass-floating rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-gray-900">Parsed Metadata</h3>
          {!editingMeta ? (
            <button onClick={() => setEditingMeta(true)} className="flex items-center gap-1 text-pink-600 hover:text-pink-700 text-sm font-semibold">
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditingMeta(false); setMeta({ base_price: ref.base_price, occasions: ref.occasions && ref.occasions.length ? ref.occasions : (ref.occasion ? [ref.occasion] : []), setup_types: ref.setup_types && ref.setup_types.length ? ref.setup_types : (ref.setup_type ? [ref.setup_type] : []), theme: ref.theme, ai_tags: (ref.ai_tags || []).join(', ') }) }} className="text-sm text-gray-600">Cancel</button>
              <button onClick={handleSaveMeta} disabled={saving} className="flex items-center gap-1 px-3 py-1 btn-primary-luxury text-white text-sm rounded">
                <Save className="w-3 h-3" /> Save
              </button>
            </div>
          )}
        </div>

        {!editingMeta ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Stat label="Base Price" value={`Rs ${ref.base_price?.toLocaleString()}`} />
              <Stat label="Bracket"    value={bracketForPrice(ref.base_price)?.label || '—'} accent="pink" />
              <Stat label="Theme"      value={ref.theme || '—'} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Occasions</p>
              <div className="flex flex-wrap gap-1.5">
                {(ref.occasions && ref.occasions.length > 0 ? ref.occasions : (ref.occasion ? [ref.occasion] : [])).map(o => (
                  <span key={o} className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded-full font-semibold">
                    {o.replace(/_/g, ' ')}
                  </span>
                ))}
                {((ref.occasions || []).length === 0 && !ref.occasion) && <span className="text-gray-400 text-xs">—</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Setup Types</p>
              <div className="flex flex-wrap gap-1.5">
                {(ref.setup_types && ref.setup_types.length > 0 ? ref.setup_types : (ref.setup_type ? [ref.setup_type] : [])).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-semibold">
                    {s}
                  </span>
                ))}
                {((ref.setup_types || []).length === 0 && !ref.setup_type) && <span className="text-gray-400 text-xs">—</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MetaInput label="Base Price (Rs)" type="number" value={meta.base_price} onChange={v => setMeta(m => ({ ...m, base_price: v }))} />
              <MetaInput label="Theme" value={meta.theme} onChange={v => setMeta(m => ({ ...m, theme: v }))} />
            </div>
            <DetailChipGroup
              label="Occasions"
              options={[
                ['birthday','birthday'], ['anniversary','anniversary'], ['wedding','wedding'],
                ['baby_shower','baby shower'], ['engagement','engagement'], ['corporate','corporate'],
                ['festival','festival'], ['housewarming','housewarming'], ['new_year','new year'],
                ['store_opening','store opening'], ['party','party'], ['dinner','dinner'],
              ]}
              value={meta.occasions || []}
              onChange={(arr) => setMeta(m => ({ ...m, occasions: arr }))}
            />
            <DetailChipGroup
              label="Setup Types"
              options={[
                ['indoor','indoor'], ['outdoor','outdoor'], ['private','private'],
                ['venue','venue'], ['corporate','corporate'], ['store','store'],
              ]}
              value={meta.setup_types || []}
              onChange={(arr) => setMeta(m => ({ ...m, setup_types: arr }))}
            />
            <MetaInput label="Tags (comma separated)" value={meta.ai_tags} onChange={v => setMeta(m => ({ ...m, ai_tags: v }))} />
          </div>
        )}

        {(ref.ai_tags || []).length > 0 && !editingMeta && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {ref.ai_tags.map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-700 text-xs rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Processing State */}
      {ref.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-blue-900">AI is analyzing this reference...</p>
          <p className="text-xs text-blue-700 mt-1">gpt-4o vision detection + SKU matching. Usually 30-60 seconds.</p>
        </div>
      )}

      {ref.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Pipeline Error</p>
              <p className="text-xs text-red-700 mt-1">{ref.rejection_reason || 'Unknown error'}</p>
              <button onClick={handleRerun} className="mt-2 flex items-center gap-1 text-sm font-semibold text-red-700 hover:text-red-900">
                <RefreshCw className="w-3 h-3" /> Re-run AI Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state — let admin add items manually if AI found nothing */}
      {items.length === 0 && ref.status !== 'processing' && ref.status !== 'error' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-amber-900 mb-1">No items detected yet</p>
          <p className="text-xs text-amber-700 mb-3">Re-run the AI pipeline or add items manually.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleRerun} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-700 text-sm rounded font-semibold">
              <RefreshCw className="w-3 h-3" /> Re-run AI
            </button>
            <button onClick={() => { setEditingItems(true); setShowSkuPicker(true) }} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded font-semibold">
              <Plus className="w-3 h-3" /> Add Item Manually
            </button>
          </div>
        </div>
      )}

      {/* Detected Items */}
      {items.length > 0 && (
        <div className="glass-floating rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl text-gray-900">Detected Items ({items.length})</h3>
              {/* Item source legend */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"><Bot className="w-3 h-3" /> AI</span>
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">+ Manual</span>
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"><Zap className="w-3 h-3" /> Auto-SKU</span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => { setEditingItems(true); setShowSkuPicker(true) }}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Add Item Manually
              </button>
              <button onClick={handleRerun} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                <RefreshCw className="w-3 h-3" /> Re-run AI
              </button>
              {!editingItems ? (
                <button onClick={() => setEditingItems(true)} className="flex items-center gap-1 text-pink-600 hover:text-pink-700 text-sm font-semibold">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <>
                  <button onClick={() => { setEditingItems(false); setItems(ref.detected_items || []) }} className="text-sm text-gray-600">Cancel</button>
                  <button onClick={handleSaveItems} disabled={saving} className="flex items-center gap-1 px-3 py-1 btn-primary-luxury text-white text-sm rounded">
                    <Save className="w-3 h-3" /> Save Items
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-2">SKU / Item</th>
                  <th className="text-center py-2 px-2 w-20">Qty</th>
                  <th className="text-right py-2 px-2">Cost</th>
                  <th className="text-right py-2 px-2">Sell (2x)</th>
                  <th className="text-right py-2 pl-2">Conf.</th>
                  {editingItems && <th className="w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${
                    it.confidence === 'manual' ? 'bg-blue-50/30' :
                    it.confidence === 'auto_created' ? 'bg-purple-50/30' : ''
                  }`}>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2.5">
                        {it.item_image_url ? (
                          <img
                            src={`${it.item_image_url}?tr=w-80,h-80,c-maintain_ratio`}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center shrink-0" title="No item image yet — add one in Inventory → All Items">
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm flex items-center gap-2 flex-wrap">
                            <span>{it.sku_name || it.raw_detection}</span>
                            {it.confidence === 'manual' ? (
                              <span className="text-[9px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">+ Manual</span>
                            ) : it.confidence === 'auto_created' ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"><Zap className="w-2.5 h-2.5" /> Auto-SKU</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"><Bot className="w-2.5 h-2.5" /> AI</span>
                            )}
                          </p>
                          {it.matched_sku_code ? (
                            <p className="text-[10px] text-gray-500 font-mono">{it.matched_sku_code}</p>
                          ) : (
                            <p className="inline-flex items-center gap-0.5 text-[10px] text-red-500 font-semibold"><AlertTriangle className="w-2.5 h-2.5" /> UNMATCHED</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-2">
                      {editingItems ? (
                        <input
                          type="number"
                          value={it.quantity || 0}
                          onChange={e => {
                            const q = Number(e.target.value) || 0
                            setItems(prev => prev.map((p, i) => i === idx ? { ...p, quantity: q, line_cost: q * (p.unit_cost || 0), line_price: q * (p.unit_price || 0) } : p))
                          }}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                        />
                      ) : (
                        <span className="font-semibold">{it.quantity}</span>
                      )}
                    </td>
                    <td className="text-right px-2 text-gray-500">Rs {((it.unit_cost || 0) * (it.quantity || 1)).toFixed(2)}</td>
                    <td className="text-right px-2 font-semibold text-pink-600">Rs {((it.unit_price || 0) * (it.quantity || 1)).toFixed(2)}</td>
                    <td className="text-right pl-2">
                      <span className={`text-[10px] uppercase font-semibold ${
                        it.confidence === 'high' ? 'text-green-600' :
                        it.confidence === 'medium' ? 'text-amber-600' :
                        'text-red-500'
                      }`}>{it.confidence}</span>
                    </td>
                    {editingItems && (
                      <td>
                        <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-sm">
                  <td className="py-3 pr-2">Subtotal</td>
                  <td></td>
                  <td className="text-right px-2 text-gray-700">Rs {totalItemsCost.toFixed(2)}</td>
                  <td className="text-right px-2 text-pink-700">Rs {totalItemsPrice.toFixed(2)}</td>
                  <td colSpan={editingItems ? 2 : 1}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Items vs Base Price — gap indicator */}
      {basePrice > 0 && (
        <div className={`rounded-2xl p-4 border ${itemsGap > 0.05 * basePrice ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'}`}>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${itemsGap > 0.05 * basePrice ? 'text-amber-600' : 'text-green-600'}`} />
              <h4 className="font-bold text-gray-900 text-sm">
                {itemsGap > 0.05 * basePrice
                  ? `Items below decoration price — Rs ${itemsGap.toFixed(0)} short`
                  : 'Items match decoration price'}
              </h4>
            </div>
            {itemsGap > 0.05 * basePrice && totalItemsPrice > 0 && (
              <button
                onClick={handleScaleToBase}
                className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-white border border-amber-400 hover:bg-amber-100 text-amber-800 rounded font-semibold"
              >
                <ArrowUp className="w-3 h-3" /> Scale qty &times;{(basePrice / totalItemsPrice).toFixed(2)} to match
              </button>
            )}
          </div>
          <div className="text-xs text-gray-700 mb-2">
            Items at 2x = <strong>Rs {totalItemsPrice.toFixed(0)}</strong> of target <strong>Rs {basePrice.toFixed(0)}</strong>
            {itemsGap > 0 && <> &middot; gap <strong>Rs {itemsGap.toFixed(0)}</strong> ({itemsGapPct.toFixed(1)}%)</>}
          </div>
          {/* Coverage bar */}
          <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full rounded-full transition-all ${itemsGap > 0.05 * basePrice ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${itemsCoverPct}%` }}
            />
          </div>
          {itemsGap > 0.05 * basePrice && (
            <p className="text-[11px] text-gray-600 mt-2">
              Add more items via <strong>Edit &rarr; + Add Item</strong>, or click <strong>Scale qty</strong> above
              to bump existing quantities proportionally.
            </p>
          )}
        </div>
      )}

      {/* Customer Pricing Breakdown */}
      <div className="glass-floating rounded-2xl p-5">
        <h3 className="font-display text-xl text-gray-900 mb-3">Customer View — What <span className="italic iridescent-text">Customer</span> Pays</h3>
        <div className="space-y-2 text-sm">
          <Row label="Decoration & Material (items at 2x)" value={`Rs ${breakdown.decoration_total.toLocaleString()}`} />
          <Row label={`GST (${(breakdown.gst_rate * 100).toFixed(0)}% on decoration)`} value={`Rs ${breakdown.gst.toLocaleString()}`} muted />
          <div className="border-t border-gray-200 my-2"></div>
          <Row label="Setup & Transportation" value={`Rs ${breakdown.setup_transport.toLocaleString()}`} sub />
          <Row label="Platform Fee" value={`Rs ${breakdown.platform_fee}`} sub />
          <Row label="Convenience Fee" value={`Rs ${breakdown.convenience_fee}`} sub />
          <div className="border-t border-gray-200 my-2"></div>
          <Row
            label={<strong>Customer Total</strong>}
            value={<strong className="text-pink-600 text-lg">Rs {breakdown.total.toLocaleString()}</strong>}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-3">
          Setup &amp; transport tiered: &le;10K&rarr;Rs 625 &bull; 10K-20K&rarr;Rs 1,025 &bull; &gt;20K&rarr;Rs 1,325
        </p>
      </div>

      {/* Admin Internal — margins */}
      <div className="glass-floating rounded-2xl p-5">
        <h3 className="font-display text-xl text-gray-900 mb-3">Admin Internal — <span className="italic iridescent-text">Margins</span></h3>
        <div className="space-y-2 text-sm">
          <Row label="Decoration Value (selling, 2x)"  value={`Rs ${margin.decoration_total.toLocaleString()}`} />
          <Row label="Item Procurement Cost (1x)"       value={`Rs ${margin.items_cost.toLocaleString()}`} />
          <div className="border-t border-gray-200 my-2"></div>
          <Row
            label="Material Margin"
            value={`Rs ${margin.operating_margin.toLocaleString()} (${margin.margin_percent}%)`}
            accent={margin.margin_percent >= 60 ? 'green' : margin.margin_percent >= 40 ? 'amber' : 'red'}
          />
          <div className="border-t border-gray-200 my-2"></div>
          <Row label="Setup Fee Collected"     value={`Rs ${breakdown.setup_transport}`} sub />
          <Row label="Platform + Convenience"  value={`Rs ${breakdown.platform_fee + breakdown.convenience_fee}`} sub />
          <Row label="GST Collected (pass-through)" value={`Rs ${breakdown.gst.toLocaleString()}`} sub />
        </div>
      </div>

      {/* Stats */}
      <div className="glass-floating rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Views</p>
          <p className="text-xl font-bold text-gray-900">{ref.view_count || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Orders</p>
          <p className="text-xl font-bold text-gray-900">{ref.use_count || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Conversion</p>
          <p className="text-xl font-bold text-gray-900">{((ref.conversion_rate || 0) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass-overlay rounded-2xl p-4 flex flex-wrap gap-2 justify-end">
        <button onClick={handleDelete} className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold">
          <Trash2 className="w-4 h-4" /> Delete
        </button>

        {ref.status === 'approved' && (
          <button onClick={handleToggleActive} className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">
            {ref.active ? <><EyeOff className="w-4 h-4" /> Pause</> : <><Eye className="w-4 h-4" /> Reactivate</>}
          </button>
        )}

        {ref.status === 'pending_review' && (
          <>
            <button onClick={handleReject} disabled={saving} className="flex items-center gap-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button onClick={handleApprove} disabled={saving} className="flex items-center gap-1 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold">
              <CheckCircle className="w-4 h-4" /> Approve &amp; Publish
            </button>
          </>
        )}

        {ref.status === 'rejected' && (
          <button onClick={handleApprove} disabled={saving} className="flex items-center gap-1 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold">
            <CheckCircle className="w-4 h-4" /> Approve Anyway
          </button>
        )}
      </div>

      {showSkuPicker && (
        <SkuPickerModal
          onClose={() => setShowSkuPicker(false)}
          onAdd={(newItem) => {
            setItems(prev => [...prev, newItem])
            showToast('Item added — remember to Save Items', 'success')
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  const accentClass = accent === 'pink' ? 'text-pink-600' : 'text-gray-900'
  return (
    <div>
      <p className="text-xs text-gray-500 capitalize">{label}</p>
      <p className={`text-sm font-semibold capitalize ${accentClass}`}>{value}</p>
    </div>
  )
}

function MetaInput({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
      />
    </div>
  )
}

function Row({ label, value, dark, accent, sub, muted }) {
  const accentClass = accent === 'green' ? (dark ? 'text-green-400' : 'text-green-600')
    : accent === 'amber' ? (dark ? 'text-amber-400' : 'text-amber-600')
    : accent === 'red'   ? (dark ? 'text-red-400'   : 'text-red-600')
    : ''
  const labelClass = sub
    ? (dark ? 'text-gray-400 text-xs pl-3' : 'text-gray-500 text-xs pl-3')
    : muted
      ? (dark ? 'text-gray-400' : 'text-gray-500')
      : (dark ? 'text-gray-300' : 'text-gray-600')
  return (
    <div className="flex justify-between items-center">
      <span className={labelClass}>{label}</span>
      <span className={`font-semibold ${accentClass || (sub || muted ? (dark ? 'text-gray-300' : 'text-gray-700') : (dark ? 'text-white' : 'text-gray-900'))}`}>{value}</span>
    </div>
  )
}

function DetailChipGroup({ label, options, value = [], onChange }) {
  const toggle = (key) => {
    const set = new Set(value)
    if (set.has(key)) set.delete(key); else set.add(key)
    onChange([...set])
  }
  return (
    <div>
      <label className="block text-xs text-gray-600 font-semibold mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([key, displayLabel]) => {
          const active = value.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                active
                  ? 'btn-primary-luxury border-transparent text-white'
                  : 'bg-white/70 border-white/80 text-gray-700 hover:border-pink-300'
              }`}
            >
              {active && <Check className="w-3 h-3" />}{displayLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}
