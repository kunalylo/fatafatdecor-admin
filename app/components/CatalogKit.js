'use client'

// ── Shared building blocks for the catalog admin editors ─────────────
// Generic CRUD over the backend's /admin/catalog/:collection endpoints:
//   GET    admin/catalog/:collection            → raw list (incl. inactive)
//   PUT    admin/catalog/:collection            → upsert one doc by id/code
//   DELETE admin/catalog/:collection/:id        → remove one doc
// Used by AdminFestivals, AdminBulkCorp and AdminPrivate.

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  Plus, Pencil, Trash2, X, Loader2, AlertTriangle,
  ToggleLeft, ToggleRight, Upload, ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const ACCENTS = ['accent-peach', 'accent-pink', 'accent-lavender', 'accent-mint']

export const isActiveDoc = (d) => d?.active !== false

// ── Data hook ────────────────────────────────────────────────────────
export function useCollection(collection, keyField = 'id') {
  const { showToast } = useApp()
  const [docs, setDocs] = useState([])
  const [fetching, setFetching] = useState(true)

  const reload = useCallback(async () => {
    setFetching(true)
    const d = await api(`admin/catalog/${collection}`)
    if (!d.error) setDocs(Array.isArray(d) ? d : [])
    else showToast(d.error, 'error')
    setFetching(false)
  }, [collection, showToast])

  useEffect(() => { reload() }, [reload])

  const saveDoc = useCallback(async (doc) => {
    const d = await api(`admin/catalog/${collection}`, { method: 'PUT', body: doc })
    if (d.error) { showToast(d.error, 'error'); return null }
    const keyVal = doc[keyField] || d[keyField]
    const saved = { ...doc, [keyField]: keyVal }
    setDocs(prev => prev.some(x => x[keyField] === keyVal)
      ? prev.map(x => x[keyField] === keyVal ? { ...x, ...saved } : x)
      : [...prev, saved])
    return saved
  }, [collection, keyField, showToast])

  const removeDoc = useCallback(async (keyVal) => {
    const d = await api(`admin/catalog/${collection}/${encodeURIComponent(keyVal)}`, { method: 'DELETE' })
    if (d.error) { showToast(d.error, 'error'); return false }
    setDocs(prev => prev.filter(x => x[keyField] !== keyVal))
    return true
  }, [collection, keyField, showToast])

  return { docs, setDocs, fetching, reload, saveDoc, removeDoc }
}

// ── Image upload (canvas resize → ImageKit, same idiom as AdminGifts) ─
function fileToResizedBase64(file, max = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (ev) => { img.src = ev.target.result }
    img.onload = () => {
      let { width, height } = img
      if (width > max || height > max) {
        if (width > height) { height = Math.round(height * max / width); width = max }
        else { width = Math.round(width * max / height); height = max }
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadImageFile(file, folder = '/content/admin') {
  const base64 = await fileToResizedBase64(file)
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const d = await api('imagekit/upload', {
    method: 'POST',
    body: { file_base64: base64, file_name: `content_${Date.now()}.${ext}`, folder },
  })
  if (d.error || !d.url) throw new Error(d.error || 'Upload failed')
  return d.url
}

export const validImageFile = (file, showToast) => {
  if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return false }
  if (file.size > 15 * 1024 * 1024) { showToast('Image must be under 15MB', 'error'); return false }
  return true
}

// ── Small form atoms ─────────────────────────────────────────────────
export const FieldLabel = ({ children, required }) => (
  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
    {children}{required && <span className="text-red-400"> *</span>}
  </label>
)

export function AccentPicker({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {ACCENTS.map(a => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          title={a.replace('accent-', '')}
          className={`w-9 h-9 rounded-xl ${a} border-2 transition-transform hover:scale-105 ${value === a ? 'border-gray-600 scale-105' : 'border-white'}`}
        />
      ))}
    </div>
  )
}

export function ImagePicker({ label = 'Image', value, onChange, folder = '/content/admin' }) {
  const { showToast } = useApp()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !validImageFile(file, showToast)) return
    setUploading(true)
    try {
      onChange(await uploadImageFile(file, folder))
      showToast('Image uploaded', 'success')
    } catch {
      showToast('Upload failed. Please try again.', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
          {value
            ? <img src={value} alt="" className="w-full h-full object-cover" />
            : <ImageIcon className="w-5 h-5 text-gray-300" />}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-500 text-xs font-semibold hover:bg-pink-100 transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Upload image'}
          </button>
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="or paste an image URL"
            className="h-9 rounded-xl border-gray-200 text-xs"
          />
        </div>
      </div>
    </div>
  )
}

// ── Modal + delete confirm shells ────────────────────────────────────
export function ModalShell({ icon: Icon, title, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="font-bold text-gray-800">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        {footer && <div className="p-5 pt-0 flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDelete({ name, onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Delete this entry?</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Remove <span className="font-semibold text-gray-800">{name}</span>?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 h-11 rounded-xl border-gray-200">Cancel</Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Generic catalog section: header + card grid + field-driven modal ─
// fields: [{ key, label, type: 'text'|'number'|'textarea'|'image'|'accent'|'list'|'check', required?, placeholder?, default? }]
export function CatalogSection({
  collection,
  keyField = 'id',
  title,
  subtitle,
  icon: Icon,
  addLabel = 'Add',
  fields,
  card,
  grid = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4',
  uploadFolder = '/content/admin',
}) {
  const { showToast } = useApp()
  const { docs, fetching, saveDoc, removeDoc } = useCollection(collection, keyField)
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)

  const openCreate = () => {
    const blank = { active: true, sortOrder: docs.length }
    fields.forEach(f => {
      blank[f.key] = f.default !== undefined
        ? f.default
        : (f.type === 'number' ? 0 : f.type === 'list' ? [] : f.type === 'check' ? false : '')
    })
    setEditing(blank)
    setIsNew(true)
  }

  const openEdit = (doc) => { setEditing({ ...doc }); setIsNew(false) }

  const handleSave = async () => {
    for (const f of fields) {
      if (f.required && !String(editing[f.key] ?? '').trim()) {
        showToast(`${f.label} is required`, 'error')
        return
      }
    }
    const doc = { ...editing }
    fields.forEach(f => {
      if (f.type === 'number') doc[f.key] = Number(doc[f.key]) || 0
      if (f.type === 'list' && typeof doc[f.key] === 'string') {
        doc[f.key] = doc[f.key].split(',').map(s => s.trim()).filter(Boolean)
      }
    })
    setSaving(true)
    const saved = await saveDoc(doc)
    setSaving(false)
    if (saved) {
      showToast(isNew ? 'Added' : 'Saved', 'success')
      setEditing(null)
    }
  }

  const handleToggle = async (doc) => {
    const next = !isActiveDoc(doc)
    const saved = await saveDoc({ ...doc, active: next })
    if (saved) showToast(next ? 'Now visible to customers' : 'Hidden from customers', 'success')
  }

  const handleDelete = async () => {
    setRemoving(true)
    const okDel = await removeDoc(deleting[keyField])
    setRemoving(false)
    if (okDel) { showToast('Deleted', 'success'); setDeleting(null) }
  }

  const setField = (key, value) => setEditing(p => ({ ...p, [key]: value }))

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h3 className="font-display text-xl text-gray-900 leading-tight">{title}</h3>
            <p className="text-xs text-gray-400">{subtitle} · {docs.length} total</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="btn-primary-luxury text-white border-0 rounded-xl h-9 px-3 flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> {addLabel}
        </Button>
      </div>

      {/* List */}
      {fetching ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : docs.length === 0 ? (
        <div className="glass-floating rounded-2xl text-center py-10">
          <Icon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Nothing here yet</p>
        </div>
      ) : (
        <div className={grid}>
          {docs.map(doc => (
            <div
              key={doc[keyField]}
              className={`bg-white rounded-2xl border-2 shadow-sm p-4 transition-all ${isActiveDoc(doc) ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
            >
              {card(doc)}
              <div className="flex gap-1.5 mt-3">
                <button
                  onClick={() => openEdit(doc)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleToggle(doc)}
                  title={isActiveDoc(doc) ? 'Hide from customers' : 'Show to customers'}
                  className="flex items-center justify-center w-10 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {isActiveDoc(doc)
                    ? <ToggleRight className="w-5 h-5 text-green-500" />
                    : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                </button>
                <button
                  onClick={() => setDeleting(doc)}
                  title="Delete"
                  className="flex items-center justify-center w-10 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Field-driven editor modal */}
      {editing && (
        <ModalShell
          icon={Icon}
          title={isNew ? `Add ${title}` : `Edit ${title}`}
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="outline" onClick={() => setEditing(null)} className="flex-1 h-11 rounded-xl border-gray-200">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl btn-primary-luxury text-white border-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isNew ? 'Add' : 'Save Changes')}
            </Button>
          </>}
        >
          {fields.map(f => {
            const v = editing[f.key]
            if (f.type === 'image') {
              return <ImagePicker key={f.key} label={f.label} value={v} onChange={url => setField(f.key, url)} folder={uploadFolder} />
            }
            if (f.type === 'accent') {
              return (
                <div key={f.key}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <AccentPicker value={v} onChange={a => setField(f.key, a)} />
                </div>
              )
            }
            if (f.type === 'textarea') {
              return (
                <div key={f.key}>
                  <FieldLabel required={f.required}>{f.label}</FieldLabel>
                  <textarea
                    value={v ?? ''}
                    onChange={e => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full h-20 rounded-xl border border-gray-200 p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              )
            }
            if (f.type === 'check') {
              const on = !!v
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setField(f.key, !on)}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors ${on ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
                >
                  <span className="text-sm font-semibold text-gray-700">{f.label}</span>
                  {on ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                </button>
              )
            }
            return (
              <div key={f.key}>
                <FieldLabel required={f.required}>{f.label}</FieldLabel>
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={f.type === 'list' && Array.isArray(v) ? v.join(', ') : (v ?? '')}
                  onChange={e => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="h-11 rounded-xl border-gray-200"
                />
              </div>
            )
          })}
        </ModalShell>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDelete
          name={deleting.name || deleting.label || deleting.title || deleting[keyField]}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={removing}
        />
      )}
    </div>
  )
}
