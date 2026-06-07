'use client'

import { useEffect, useState } from 'react'
import { X, Save, Loader2, Lock, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'

const CATEGORIES = [
  'Latex Balloons',
  'Foil Balloons',
  'Foil Balloon Backdrop Units',
  '4D / Orbz Balloons',
  'BOBO / Bubble Balloons',
  'Linking Balloons',
  'Modelling / Twisting Balloons',
  'Lights',
  'Flowers',
  'Props',
  'Other',
]

const FINISHES = [
  'Matte', 'Chrome', 'Metallic', 'Pearl', 'Pastel / Macaron',
  'Confetti', 'Foil / Mylar', 'Holographic / Iridescent', 'Printed',
  'Mirror / Disco', 'Transparent / Clear',
]

const SHAPES = ['Round', 'Heart', 'Star', 'Number', 'Letter', 'Bottle', 'Other']

// Build a stable SKU code from form values matching the Excel naming convention.
function buildSkuCode(form) {
  const abbreviation = (s, n = 8) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, n)
  const catShort = {
    'Latex Balloons':                'LATEXBAL',
    'Foil Balloons':                 'FOIL',
    'Foil Balloon Backdrop Units':   'FOILBD',
    '4D / Orbz Balloons':            'ORBZ',
    'BOBO / Bubble Balloons':        'BOBO',
    'Linking Balloons':              'LINK',
    'Modelling / Twisting Balloons': 'MODEL',
    'Lights':                        'LIGHT',
    'Flowers':                       'FLOWER',
    'Props':                         'PROP',
    'Other':                         'OTHER',
  }[form.category] || abbreviation(form.category)

  const parts = [
    'FD',
    'BAL',
    catShort,
    abbreviation(form.subcategory || form.finish, 10),
    form.size_inches ? `${form.size_inches}IN` : '',
    abbreviation(form.color),
    abbreviation(form.finish),
  ].filter(Boolean)

  return parts.join('-')
}

export default function CreateItemModal({ onClose, onSaved }) {
  const { showToast } = useApp()
  const [form, setForm] = useState({
    sku_code: '',
    category: 'Latex Balloons',
    subcategory: '',
    color: '',
    finish: 'Matte',
    shape: 'Round',
    size_inches: 12,
    pack_quantity: 100,
    cost_price_pack: 0,
    per_unit_cost: 0,
    selling_price_per_unit: 0,
    brand_supplier: '',
    source_url: '',
    ai_usage_notes: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)
  const [skuLocked, setSkuLocked] = useState(false)

  // Auto-generate SKU as form changes, unless admin manually edited it
  useEffect(() => {
    if (skuLocked) return
    setForm(f => ({ ...f, sku_code: buildSkuCode(f) }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category, form.subcategory, form.color, form.finish, form.size_inches])

  // Auto-calculate selling price = 2x cost when cost changes
  useEffect(() => {
    setForm(f => ({
      ...f,
      selling_price_per_unit: Math.round((Number(f.per_unit_cost) || 0) * 2 * 100) / 100,
      cost_price_pack: Math.round((Number(f.per_unit_cost) || 0) * (Number(f.pack_quantity) || 1) * 100) / 100,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.per_unit_cost, form.pack_quantity])

  const handleSave = async () => {
    if (!form.sku_code) { showToast('SKU code required', 'error'); return }
    if (!form.color)    { showToast('Color required', 'error'); return }
    if (!form.per_unit_cost || form.per_unit_cost <= 0) {
      showToast('Cost must be greater than 0', 'error'); return
    }

    setSaving(true)
    const res = await api('admin/inventory/items', {
      method: 'POST',
      body: {
        ...form,
        sku_code:               String(form.sku_code).trim().toUpperCase(),
        size_inches:            Number(form.size_inches) || 0,
        pack_quantity:          Number(form.pack_quantity) || 1,
        per_unit_cost:          Number(form.per_unit_cost) || 0,
        cost_price_pack:        Number(form.cost_price_pack) || 0,
        selling_price_per_unit: Number(form.selling_price_per_unit) || 0,
      },
    })
    setSaving(false)
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('Item created', 'success')
    onSaved?.(res)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="glass-floating rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 glass-overlay border-b border-white/40 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="eyebrow text-gray-500">Inventory</p>
            <h3 className="font-display text-2xl text-gray-900">Add New <span className="italic iridescent-text">Item</span></h3>
            <p className="text-xs text-gray-500">Manually create a new SKU in master inventory.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* SKU Code — auto-generated but editable */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-600 font-semibold">SKU Code (auto-generated)</label>
              <button
                onClick={() => setSkuLocked(l => !l)}
                className="text-[10px] text-pink-600 hover:underline flex items-center gap-1"
              >
                {skuLocked ? <><Lock className="w-3 h-3" /> Edit manually</> : <><RefreshCw className="w-3 h-3" /> Auto-sync from fields</>}
              </button>
            </div>
            <input
              type="text"
              value={form.sku_code}
              onChange={e => { setSkuLocked(true); setForm(f => ({ ...f, sku_code: e.target.value })) }}
              className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm font-mono focus:outline-none focus:border-pink-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Subcategory">
              <input
                type="text"
                value={form.subcategory}
                onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                placeholder="e.g. Matte Latex"
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>

            <Field label="Color *">
              <input
                type="text"
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="e.g. Rose Gold"
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>

            <Field label="Finish">
              <select
                value={form.finish}
                onChange={e => setForm(f => ({ ...f, finish: e.target.value }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              >
                {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>

            <Field label="Size (inches)">
              <input
                type="number"
                value={form.size_inches}
                onChange={e => setForm(f => ({ ...f, size_inches: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>

            <Field label="Shape">
              <select
                value={form.shape}
                onChange={e => setForm(f => ({ ...f, shape: e.target.value }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              >
                {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Pack Quantity">
              <input
                type="number"
                value={form.pack_quantity}
                onChange={e => setForm(f => ({ ...f, pack_quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>

            <Field label="Cost per Unit (Rs) *">
              <input
                type="number"
                step="0.01"
                value={form.per_unit_cost}
                onChange={e => setForm(f => ({ ...f, per_unit_cost: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>

            <Field label="Sell per Unit (Rs, auto 2x)">
              <input
                type="number"
                step="0.01"
                value={form.selling_price_per_unit}
                onChange={e => setForm(f => ({ ...f, selling_price_per_unit: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg text-sm font-semibold text-pink-700 focus:outline-none focus:border-pink-400"
              />
            </Field>

            <Field label="Cost per Pack (Rs)">
              <input
                type="number"
                step="0.01"
                value={form.cost_price_pack}
                onChange={e => setForm(f => ({ ...f, cost_price_pack: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </Field>
          </div>

          <Field label="Brand / Supplier">
            <input
              type="text"
              value={form.brand_supplier}
              onChange={e => setForm(f => ({ ...f, brand_supplier: e.target.value }))}
              placeholder="e.g. Wanna Party / Amazon"
              className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <Field label="Source URL">
            <input
              type="url"
              value={form.source_url}
              onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <Field label="AI Usage Notes (optional)">
            <textarea
              value={form.ai_usage_notes}
              onChange={e => setForm(f => ({ ...f, ai_usage_notes: e.target.value }))}
              rows={2}
              placeholder="e.g. Use for ceiling clusters, garlands..."
              className="w-full px-3 py-2 bg-white/70 border border-white/80 rounded-lg text-sm focus:outline-none focus:border-pink-400"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            Active (available for references)
          </label>
        </div>

        <div className="sticky bottom-0 glass-overlay border-t border-white/40 p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-white/50 rounded-lg text-sm">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary-luxury px-5 py-2 disabled:opacity-60 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Create Item</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 font-semibold mb-1">{label}</label>
      {children}
    </div>
  )
}
