'use client'

// ── Private (Velvet Collection) editor ───────────────────────────────
// velvet_items (vault prices visible only here — never sent to
// customers), velvet_codes (invite codes: add / deactivate / delete),
// and private_types (the category tiles on the Private page).

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CatalogSection, useCollection, ConfirmDelete, isActiveDoc } from '../components/CatalogKit'
import {
  Lock, KeyRound, Layers, Plus, Trash2, Loader2,
  ToggleLeft, ToggleRight, ImageIcon, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ── Invite codes (key field is `code`, not `id`) ─────────────────────
function VelvetCodes() {
  const { showToast } = useApp()
  const { docs, fetching, saveDoc, removeDoc } = useCollection('velvet_codes', 'code')
  const [newCode, setNewCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)

  const addCode = async () => {
    const code = newCode.trim().toUpperCase().replace(/\s+/g, '')
    if (!code) { showToast('Enter a code first', 'error'); return }
    if (!/^[A-Z0-9]{3,24}$/.test(code)) { showToast('Codes are 3–24 letters/numbers', 'error'); return }
    if (docs.some(c => c.code === code)) { showToast('That code already exists', 'error'); return }
    setAdding(true)
    const saved = await saveDoc({ code, active: true })
    setAdding(false)
    if (saved) { showToast(`Code ${code} added`, 'success'); setNewCode('') }
  }

  const toggleCode = async (c) => {
    const next = !isActiveDoc(c)
    const saved = await saveDoc({ ...c, active: next })
    if (saved) showToast(next ? `${c.code} reactivated` : `${c.code} deactivated`, 'success')
  }

  const handleDelete = async () => {
    setRemoving(true)
    const okDel = await removeDoc(deleting.code)
    setRemoving(false)
    if (okDel) { showToast('Code deleted', 'success'); setDeleting(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h3 className="font-display text-xl text-gray-900 leading-tight">Invite Codes</h3>
          <p className="text-xs text-gray-400">Unlock codes for the Velvet Collection · {docs.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 space-y-4">
        {/* Add row */}
        <div className="flex gap-2">
          <Input
            value={newCode}
            onChange={e => setNewCode(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter' && !adding) addCode() }}
            placeholder="NEWCODE2026"
            className="h-11 rounded-xl border-gray-200 uppercase tracking-wide"
          />
          <Button onClick={addCode} disabled={adding} className="btn-primary-luxury text-white border-0 rounded-xl h-11 px-4 flex items-center gap-1.5 text-sm shrink-0">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Code</>}
          </Button>
        </div>

        {/* Code list */}
        {fetching ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
          </div>
        ) : docs.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4">No invite codes yet</p>
        ) : (
          <div className="space-y-2">
            {docs.map(c => {
              const active = isActiveDoc(c)
              return (
                <div key={c.code} className={`flex items-center gap-3 rounded-xl p-3 ${active ? 'bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${active ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="flex-1 font-mono font-bold text-sm text-gray-800 tracking-wide truncate">{c.code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button
                    onClick={() => toggleCode(c)}
                    title={active ? 'Deactivate' : 'Reactivate'}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-100 hover:bg-gray-100 transition-colors shrink-0"
                  >
                    {active
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    title="Delete"
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {deleting && (
        <ConfirmDelete
          name={deleting.code}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          loading={removing}
        />
      )}
    </div>
  )
}

export default function AdminPrivate() {
  return (
    <div className="p-6 space-y-8">
      <CatalogSection
        collection="velvet_items"
        title="Velvet Items"
        subtitle="Members-only catalog · vault prices are never shown to customers"
        icon={Lock}
        addLabel="Add Item"
        uploadFolder="/content/private"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Maison Champagne Soirée' },
          { key: 'price', label: 'Vault Price (₹)', type: 'number', placeholder: '18999' },
          { key: 'edition', label: 'Edition Label', type: 'text', placeholder: 'Private edition · 12 of 50' },
          { key: 'desc', label: 'Description', type: 'textarea', placeholder: 'A privately-curated dinner setup...' },
          { key: 'image', label: 'Image', type: 'image' },
        ]}
        card={(d) => (
          <div>
            <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-3 flex items-center justify-center">
              {d.image
                ? <img src={d.image} alt="" className="w-full h-full object-cover" />
                : <ImageIcon className="w-5 h-5 text-gray-300" />}
              <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/55 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Lock className="w-2.5 h-2.5" /> PRIVATE
              </span>
            </div>
            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">{d.name}</h4>
            <p className="text-xs text-gray-400 truncate">{d.edition || '—'}</p>
            <p className="text-sm font-bold text-gray-800 mt-1">₹{(Number(d.price) || 0).toLocaleString('en-IN')} <span className="text-[10px] font-semibold text-purple-400 uppercase">vault</span></p>
          </div>
        )}
      />

      <VelvetCodes />

      <CatalogSection
        collection="private_types"
        title="Private Types"
        subtitle="Category tiles on the Private page"
        icon={Layers}
        addLabel="Add Type"
        fields={[
          { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Wedding / Engagement' },
          { key: 'icon', label: 'Icon (lucide name)', type: 'text', placeholder: 'Heart' },
          { key: 'tint', label: 'Tint (CSS colour)', type: 'text', placeholder: 'rgba(255,136,180,0.18)' },
        ]}
        card={(d) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl shrink-0 border border-gray-100" style={{ background: d.tint || '#f9fafb' }} />
            <div className="min-w-0">
              <h4 className="font-bold text-gray-800 text-sm truncate">{d.name}</h4>
              <p className="text-xs text-gray-400 truncate">{d.icon || '—'}</p>
            </div>
          </div>
        )}
      />
    </div>
  )
}
