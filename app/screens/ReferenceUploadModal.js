'use client'

import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { bracketForPrice } from '../lib/budget-brackets'
import { customerBreakdown } from '../lib/pricing-calc'

// Filename pattern preview — replicates the backend parser briefly for UX feedback
function previewParse(filename) {
  if (!filename) return {}
  const base = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '')
  const parts = base.split(/\s*[;|]\s*|\s+-\s+/).map(s => s.trim()).filter(Boolean)

  // Price
  let price = null
  for (const p of parts) {
    const m = p.match(/(?:rs[\s.]*)?\s*([0-9][\d,]*)/i)
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ''), 10)
      if (n >= 500 && n <= 200000) { price = n; break }
    }
  }

  const lower = base.toLowerCase()
  const occasions = ['birthday','anniversary','wedding','baby shower','engagement','corporate','festival','housewarming','new year','store opening','party']
  const occasion = occasions.find(o => lower.includes(o)) || null

  const setups = ['indoor','outdoor','private','venue','corporate','store']
  const setup = setups.find(s => lower.includes(s)) || null

  const colors = ['pink','gold','silver','rose gold','black','white','red','blue','pastel','chrome','champagne']
  const found = colors.filter(c => lower.includes(c))

  // Build theme like the backend does:
  // 1. colors > 2. first descriptive segment (strip "theme " prefix) > 3. occasion fallback
  const stopWords = new Set(['decoration','decorations','decor','event','celebration','celebrations','happy','beautiful','lovely','amazing','a','an','the','and','with','for','of'])
  const pieces = []
  if (found.length > 0) pieces.push(found.join(' and '))

  for (const p of parts) {
    const isPureRs = p.replace(/[^a-z0-9]/gi, '').match(/^rs?\d+$/i)
    if (isPureRs) continue
    const cleaned = p.toLowerCase()
      .replace(/^\s*theme\s+/, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const words = cleaned.split(' ').filter(w => w.length >= 3 && !stopWords.has(w))
    if (words.length > 0) {
      const phrase = words.join(' ')
      if (!pieces.some(x => x.includes(phrase))) {
        pieces.push(phrase)
        break
      }
    }
  }

  if (pieces.length === 0) {
    pieces.push(occasion ? (setup ? `${setup} ${occasion}` : occasion) : 'decoration')
  }

  return {
    price,
    occasion,
    setup_type: setup,
    theme: pieces.join(' — ').trim(),
  }
}

export default function ReferenceUploadModal({ onClose, onUploaded }) {
  const { showToast } = useApp()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [parsed, setParsed] = useState({})
  const [overrides, setOverrides] = useState({ base_price: '', occasion: '', theme: '', setup_type: '' })
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }
    if (f.size > 25 * 1024 * 1024) {
      showToast('Image too large (max 25MB)', 'error')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
    const p = previewParse(f.name)
    setParsed(p)
    setOverrides({
      base_price: p.price || '',
      occasion: p.occasion || '',
      theme: p.theme || '',
      setup_type: p.setup_type || '',
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!file) return
    if (!overrides.base_price) {
      showToast('Base price required (Rs)', 'error')
      return
    }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('filename', file.name)
    if (overrides.base_price) fd.append('base_price', String(overrides.base_price))
    if (overrides.occasion)   fd.append('occasion', overrides.occasion)
    if (overrides.theme)      fd.append('theme', overrides.theme)
    if (overrides.setup_type) fd.append('setup_type', overrides.setup_type)

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    const url = apiBase ? `${apiBase}/api/admin/references/upload` : '/api/admin/references/upload'

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd,
      })
      const data = await res.json()
      setUploading(false)
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('Reference uploaded. AI is analyzing...', 'success')
      onUploaded?.(data.id)
    } catch (e) {
      setUploading(false)
      showToast('Upload failed: ' + e.message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Upload Reference Design</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop Zone or Preview */}
          {!preview ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                ${dragOver ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-gray-50 hover:border-pink-400 hover:bg-pink-50/50'}
              `}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Drop image here or click to browse</p>
              <p className="text-xs text-gray-500">Filename should include price + occasion + theme</p>
              <p className="text-[10px] text-gray-400 mt-2 font-mono">Example: "Rs 8500 ; birthday ; pink and gold.jpg"</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img src={preview} alt="preview" className="w-full max-h-80 object-contain" />
                <button
                  onClick={() => { setFile(null); setPreview(null); setParsed({}); setOverrides({ base_price: '', occasion: '', theme: '', setup_type: '' }) }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 text-white text-xs rounded"
                >
                  Change
                </button>
              </div>
              <p className="text-xs text-gray-500 font-mono break-all">{file.name}</p>
            </div>
          )}

          {/* Parsed Preview */}
          {preview && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-pink-700 uppercase mb-2 tracking-wide">Auto-detected from filename</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Price:</span> <span className="font-semibold text-gray-900">{parsed.price ? `Rs ${parsed.price.toLocaleString()}` : '—'}</span></div>
                <div><span className="text-gray-500">Occasion:</span> <span className="font-semibold text-gray-900">{parsed.occasion || '—'}</span></div>
                <div><span className="text-gray-500">Setup:</span> <span className="font-semibold text-gray-900">{parsed.setup_type || '—'}</span></div>
                <div>
                  <span className="text-gray-500">Bracket:</span>{' '}
                  <span className="font-semibold text-pink-700">
                    {overrides.base_price ? bracketForPrice(overrides.base_price)?.label : '—'}
                  </span>
                </div>
                <div className="col-span-2"><span className="text-gray-500">Theme:</span> <span className="font-semibold text-gray-900">{parsed.theme || '—'}</span></div>
              </div>
              {overrides.base_price && (() => {
                const bp = Number(overrides.base_price) || 0
                const bd = customerBreakdown(bp)
                return (
                  <div className="mt-3 bg-white border border-pink-200 rounded p-2 text-[11px]">
                    <p className="text-pink-700 mb-1">
                      Customers see total <strong className="text-pink-600 text-sm">Rs {bd.total.toLocaleString()}</strong> (decoration Rs {bp.toLocaleString()} + setup Rs {bd.setup_transport} + fees Rs {bd.platform_fee + bd.convenience_fee} + GST Rs {bd.gst.toLocaleString()})
                    </p>
                    <p className="text-gray-500">
                      Falls in <strong>{bracketForPrice(bp)?.label}</strong> bracket.
                    </p>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Manual Overrides */}
          {preview && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Override if needed</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Base Price (Rs) *</label>
                  <input
                    type="number"
                    value={overrides.base_price}
                    onChange={e => setOverrides(o => ({ ...o, base_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., 8500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Occasion</label>
                  <select
                    value={overrides.occasion}
                    onChange={e => setOverrides(o => ({ ...o, occasion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">— pick —</option>
                    <option value="birthday">birthday</option>
                    <option value="anniversary">anniversary</option>
                    <option value="wedding">wedding</option>
                    <option value="baby_shower">baby shower</option>
                    <option value="engagement">engagement</option>
                    <option value="corporate">corporate</option>
                    <option value="festival">festival</option>
                    <option value="housewarming">housewarming</option>
                    <option value="new_year">new year</option>
                    <option value="store_opening">store opening</option>
                    <option value="party">party</option>
                    <option value="dinner">dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Theme</label>
                  <input
                    type="text"
                    value={overrides.theme}
                    onChange={e => setOverrides(o => ({ ...o, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., pink and gold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Setup Type</label>
                  <select
                    value={overrides.setup_type}
                    onChange={e => setOverrides(o => ({ ...o, setup_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">— pick —</option>
                    <option value="indoor">indoor</option>
                    <option value="outdoor">outdoor</option>
                    <option value="private">private</option>
                    <option value="venue">venue</option>
                    <option value="corporate">corporate</option>
                    <option value="store">store</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload & Analyze</>}
          </button>
        </div>
      </div>
    </div>
  )
}
