'use client'

// ── Festivals editor ─────────────────────────────────────────────────
// Full CRUD over admin/catalog/festivals, including the embedded
// hampers array (add / edit / delete inside the festival sheet).

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  useCollection, isActiveDoc, ModalShell, ConfirmDelete,
  ImagePicker, AccentPicker, FieldLabel,
} from '../components/CatalogKit'
import {
  Flame, Plus, Pencil, Trash2, Loader2, Star,
  ToggleLeft, ToggleRight, Package, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Days until the next occurrence of {month(1-12), day} — mirrors backend
function daysToGo(month, day) {
  const now = new Date()
  const m = Number(month) || 1
  const d = Number(day) || 1
  let next = new Date(now.getFullYear(), m - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d)
  return Math.max(0, Math.round((next - now) / 86400000))
}

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const BLANK_FESTIVAL = {
  name: '', tagline: '', month: 1, day: 1,
  accent: 'accent-peach', color: '#FFB088', eyebrow: '', description: '',
  hero: '', featured: false, active: true, hampers: [],
}
const BLANK_HAMPER = { name: '', price: '', image: '', category: '' }

export default function AdminFestivals() {
  const { showToast } = useApp()
  const { docs, fetching, saveDoc, removeDoc } = useCollection('festivals')

  const [editing, setEditing]   = useState(null)   // festival being edited
  const [isNew, setIsNew]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [hamperEdit, setHamperEdit] = useState(null) // { idx: -1 for new, data }

  const setField = (key, value) => setEditing(p => ({ ...p, [key]: value }))

  const openCreate = () => {
    setEditing({ ...BLANK_FESTIVAL, sortOrder: docs.length })
    setIsNew(true)
  }
  const openEdit = (f) => {
    setEditing({ ...f, hampers: (f.hampers || []).map(h => ({ ...h })) })
    setIsNew(false)
  }

  const handleSave = async () => {
    if (!String(editing.name || '').trim()) { showToast('Festival name is required', 'error'); return }
    const month = Math.min(12, Math.max(1, Number(editing.month) || 1))
    const day   = Math.min(31, Math.max(1, Number(editing.day) || 1))
    const doc = {
      ...editing,
      name: editing.name.trim(),
      month, day,
      sortOrder: Number(editing.sortOrder) || 0,
      hampers: (editing.hampers || []).map(h => ({ ...h, price: Number(h.price) || 0 })),
    }
    if (isNew && !doc.id) {
      let slug = slugify(doc.name)
      if (!slug || docs.some(x => x.id === slug)) slug = `${slug || 'festival'}-${Date.now().toString(36).slice(-4)}`
      doc.id = slug
    }
    setSaving(true)
    const saved = await saveDoc(doc)
    setSaving(false)
    if (saved) { showToast(isNew ? 'Festival added' : 'Festival saved', 'success'); setEditing(null) }
  }

  const handleToggleActive = async (f) => {
    const next = !isActiveDoc(f)
    const saved = await saveDoc({ ...f, active: next })
    if (saved) showToast(next ? 'Now visible to customers' : 'Hidden from customers', 'success')
  }

  const handleToggleFeatured = async (f) => {
    const next = !f.featured
    const saved = await saveDoc({ ...f, featured: next })
    if (saved) showToast(next ? 'Added to home carousel' : 'Removed from home carousel', 'success')
  }

  const handleDelete = async () => {
    setRemoving(true)
    const okDel = await removeDoc(deleting.id)
    setRemoving(false)
    if (okDel) { showToast('Festival deleted', 'success'); setDeleting(null) }
  }

  // ── Embedded hamper editing (persists on festival Save) ────────────
  const openHamperCreate = () => setHamperEdit({ idx: -1, data: { ...BLANK_HAMPER } })
  const openHamperEdit = (h, idx) => setHamperEdit({ idx, data: { ...h } })
  const setHamperField = (key, value) => setHamperEdit(p => ({ ...p, data: { ...p.data, [key]: value } }))

  const saveHamper = () => {
    const { idx, data } = hamperEdit
    if (!String(data.name || '').trim()) { showToast('Hamper name is required', 'error'); return }
    const clean = { ...data, name: data.name.trim(), price: Number(data.price) || 0 }
    setEditing(p => {
      const hampers = [...(p.hampers || [])]
      if (idx === -1) hampers.push({ ...clean, id: `h_${Date.now().toString(36)}` })
      else hampers[idx] = clean
      return { ...p, hampers }
    })
    setHamperEdit(null)
  }

  const deleteHamper = (idx) => {
    setEditing(p => ({ ...p, hampers: (p.hampers || []).filter((_, i) => i !== idx) }))
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-display text-xl text-gray-900 leading-tight">Festivals</h3>
            <p className="text-xs text-gray-400">Landing pages + home carousel · {docs.length} total</p>
          </div>
        </div>
        <Button onClick={openCreate} className="btn-primary-luxury text-white border-0 rounded-xl h-9 px-3 flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Add Festival
        </Button>
      </div>

      {/* List */}
      {fetching ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : docs.length === 0 ? (
        <div className="glass-floating rounded-2xl text-center py-10">
          <Flame className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No festivals yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map(f => {
            const active = isActiveDoc(f)
            return (
              <div key={f.id} className={`bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden transition-all ${active ? '' : 'opacity-60'}`}>
                <div className="relative h-28 bg-gray-100">
                  {f.hero
                    ? <img src={f.hero} alt="" className={`w-full h-full object-cover ${active ? '' : 'grayscale'}`} />
                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
                  {f.featured && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current" /> FEATURED
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {f.eyebrow && <p className="text-[10px] uppercase tracking-wide text-pink-400 font-bold mb-0.5">{f.eyebrow}</p>}
                  <h4 className="font-bold text-gray-800 leading-tight">{f.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.tagline ? `${f.tagline} · ` : ''}{Number(f.day) || 1} {MONTHS_SHORT[(Number(f.month) || 1) - 1]} · {(f.hampers || []).length} hampers
                  </p>
                  <div className="flex gap-1.5 mt-3">
                    <button
                      onClick={() => openEdit(f)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(f)}
                      title={f.featured ? 'Remove from home carousel' : 'Feature on home carousel'}
                      className={`flex items-center justify-center w-10 py-2 rounded-xl transition-colors ${f.featured ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <Star className={`w-4 h-4 ${f.featured ? 'text-amber-400 fill-current' : 'text-gray-300'}`} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(f)}
                      title={active ? 'Hide from customers' : 'Show to customers'}
                      className="flex items-center justify-center w-10 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                    </button>
                    <button
                      onClick={() => setDeleting(f)}
                      title="Delete"
                      className="flex items-center justify-center w-10 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Festival edit sheet */}
      {editing && (
        <ModalShell
          icon={Flame}
          title={isNew ? 'Add Festival' : `Edit ${editing.name || 'Festival'}`}
          onClose={() => setEditing(null)}
          wide
          footer={<>
            <Button variant="outline" onClick={() => setEditing(null)} className="flex-1 h-11 rounded-xl border-gray-200">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl btn-primary-luxury text-white border-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isNew ? 'Add Festival' : 'Save Changes')}
            </Button>
          </>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Name</FieldLabel>
              <Input value={editing.name || ''} onChange={e => setField('name', e.target.value)} placeholder="Diwali" className="h-11 rounded-xl border-gray-200" />
            </div>
            <div>
              <FieldLabel>Tagline</FieldLabel>
              <Input value={editing.tagline || ''} onChange={e => setField('tagline', e.target.value)} placeholder="Festival of lights" className="h-11 rounded-xl border-gray-200" />
            </div>
            <div>
              <FieldLabel>Month</FieldLabel>
              <select
                value={Number(editing.month) || 1}
                onChange={e => setField('month', Number(e.target.value))}
                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white outline-none focus:ring-2 focus:ring-pink-300"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Day</FieldLabel>
              <Input type="number" min={1} max={31} value={editing.day ?? 1} onChange={e => setField('day', e.target.value)} className="h-11 rounded-xl border-gray-200" />
            </div>
            <div>
              <FieldLabel>Eyebrow</FieldLabel>
              <Input value={editing.eyebrow || ''} onChange={e => setField('eyebrow', e.target.value)} placeholder="Roshni Collection" className="h-11 rounded-xl border-gray-200" />
            </div>
            <div>
              <FieldLabel>Theme Colour</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(editing.color || '') ? editing.color : '#FFB088'}
                  onChange={e => setField('color', e.target.value)}
                  className="w-11 h-11 rounded-xl border border-gray-200 bg-white cursor-pointer shrink-0"
                />
                <Input value={editing.color || ''} onChange={e => setField('color', e.target.value)} placeholder="#FFB088" className="h-11 rounded-xl border-gray-200" />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Accent</FieldLabel>
            <AccentPicker value={editing.accent} onChange={a => setField('accent', a)} />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={editing.description || ''}
              onChange={e => setField('description', e.target.value)}
              placeholder="Hand-picked diyas, mithai boxes and gilded hampers..."
              className="w-full h-20 rounded-xl border border-gray-200 p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-pink-300"
            />
          </div>

          <ImagePicker label="Hero Image" value={editing.hero} onChange={url => setField('hero', url)} folder="/content/festivals" />

          <button
            type="button"
            onClick={() => setField('featured', !editing.featured)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors ${editing.featured ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}
          >
            <span className="text-sm font-semibold text-gray-700">Featured on home carousel</span>
            {editing.featured ? <ToggleRight className="w-6 h-6 text-amber-400" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
          </button>

          {/* Embedded hampers */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <FieldLabel>Hampers · {(editing.hampers || []).length}</FieldLabel>
                <p className="text-[11px] text-gray-400 -mt-1">Hamper changes are saved when you save the festival</p>
              </div>
              <button
                type="button"
                onClick={openHamperCreate}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-pink-50 text-pink-500 text-xs font-semibold hover:bg-pink-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add hamper
              </button>
            </div>
            {(editing.hampers || []).length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <Package className="w-6 h-6 text-gray-200 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No hampers yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {editing.hampers.map((h, idx) => (
                  <div key={h.id || idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0 flex items-center justify-center">
                      {h.image
                        ? <img src={h.image} alt="" className="w-full h-full object-cover" />
                        : <ImageIcon className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{h.name}</p>
                      <p className="text-xs text-gray-400">
                        ₹{(Number(h.price) || 0).toLocaleString('en-IN')}{h.category ? ` · ${h.category}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openHamperEdit(h, idx)}
                      className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHamper(idx)}
                      className="w-9 h-9 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalShell>
      )}

      {/* Hamper sub-sheet (renders above the festival sheet) */}
      {hamperEdit && (
        <ModalShell
          icon={Package}
          title={hamperEdit.idx === -1 ? 'Add Hamper' : 'Edit Hamper'}
          onClose={() => setHamperEdit(null)}
          footer={<>
            <Button variant="outline" onClick={() => setHamperEdit(null)} className="flex-1 h-11 rounded-xl border-gray-200">Cancel</Button>
            <Button onClick={saveHamper} className="flex-1 h-11 rounded-xl btn-primary-luxury text-white border-0">
              {hamperEdit.idx === -1 ? 'Add' : 'Done'}
            </Button>
          </>}
        >
          <div>
            <FieldLabel required>Name</FieldLabel>
            <Input value={hamperEdit.data.name || ''} onChange={e => setHamperField('name', e.target.value)} placeholder="Roshni Signature Box" className="h-11 rounded-xl border-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Price (₹)</FieldLabel>
              <Input type="number" min={0} value={hamperEdit.data.price ?? ''} onChange={e => setHamperField('price', e.target.value)} placeholder="2999" className="h-11 rounded-xl border-gray-200" />
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <Input value={hamperEdit.data.category || ''} onChange={e => setHamperField('category', e.target.value)} placeholder="Premium" className="h-11 rounded-xl border-gray-200" />
            </div>
          </div>
          <ImagePicker label="Image" value={hamperEdit.data.image} onChange={url => setHamperField('image', url)} folder="/content/festivals" />
        </ModalShell>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDelete
          name={deleting.name || deleting.id}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={removing}
        />
      )}
    </div>
  )
}
