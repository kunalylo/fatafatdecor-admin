'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  Gift, Plus, Pencil, Trash2, X, Loader2, AlertTriangle,
  ToggleLeft, ToggleRight, Check, Package, Search, RefreshCw,
  ChevronDown, ChevronUp, MapPin, Clock, User, Upload, ImageIcon, Sparkles,
  Copy, ChevronLeft, ChevronRight, Eye, ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMPTY_FORM = { name: '', description: '', price: '', images: [], stock: '', category: '', colour: '#ff69b4', occasion: '' }

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700',
  assigned:   'bg-blue-100 text-blue-700',
  en_route:   'bg-indigo-100 text-indigo-700',
  arrived:    'bg-cyan-100 text-cyan-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

const fmtStatus = (s) => (s || 'unknown').replace(/_/g, ' ')

// ═══════════ GIFT CATALOG TAB ═══════════
function GiftCatalog() {
  const { showToast } = useApp()
  const [gifts, setGifts]         = useState([])
  const [fetching, setFetching]   = useState(true)
  const [loading, setLoading]     = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editGift, setEditGift]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [search, setSearch]             = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy]             = useState('name')
  const [galleryGift, setGalleryGift]   = useState(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const fileInputRef = useRef(null)
  const aiFileRef = useRef(null)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return }
    if (file.size > 15 * 1024 * 1024) { showToast('Image must be under 15MB', 'error'); return }
    if ((form.images || []).length >= 10) { showToast('Maximum 10 images allowed', 'error'); return }
    setUploadingImage(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const img = new Image()
        const reader = new FileReader()
        reader.onload = (ev) => { img.src = ev.target.result }
        img.onload = () => {
          const MAX = 800
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX }
            else { width = Math.round(width * MAX / height); height = MAX }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }
        img.onerror = reject
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `gift_${Date.now()}.${ext}`
      const d = await api('imagekit/upload', { method: 'POST', body: { file_base64: base64, file_name: fileName, folder: '/gifts' } })
      if (d.error) { showToast('Upload failed: ' + d.error, 'error'); return }
      setForm(f => ({ ...f, images: [...(f.images || []), d.url] }))
      showToast('Image uploaded', 'success')
    } catch {
      showToast('Upload failed. Please try again.', 'error')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAiFill = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image', 'error'); return }
    if (file.size > 20 * 1024 * 1024) { showToast('Image must be under 20MB', 'error'); return }
    setAiLoading(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const img = new Image()
        const reader = new FileReader()
        reader.onload = (ev) => { img.src = ev.target.result }
        img.onload = () => {
          const MAX = 1200
          let { width, height } = img
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX }
            else { width = Math.round(width * MAX / height); height = MAX }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.onerror = reject; reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const d = await api('admin/gifts/ai-fill', { method: 'POST', body: { image_base64: base64 } })
      if (d.error) { showToast('AI fill failed: ' + d.error, 'error'); return }
      setForm({
        name: d.name || '', description: d.description || '',
        price: d.price?.toString() || '', stock: d.stock?.toString() || '100',
        category: d.category || '', colour: d.colour || '#ff69b4',
        occasion: d.occasion || '', images: d.images || []
      })
      showToast('AI filled all details! Review and save.', 'success')
    } catch { showToast('AI fill failed. Try again.', 'error') }
    finally { setAiLoading(false); if (aiFileRef.current) aiFileRef.current.value = '' }
  }

  const fetchGifts = useCallback(async () => {
    setFetching(true)
    const d = await api('admin/gifts')
    if (!d.error) setGifts(Array.isArray(d) ? d : [])
    setFetching(false)
  }, [])

  useEffect(() => { fetchGifts() }, [fetchGifts])

  const openCreate = () => {
    setEditGift(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (gift) => {
    setEditGift(gift)
    setForm({
      name: gift.name || '',
      description: gift.description || '',
      price: gift.price?.toString() || '',
      images: gift.images?.length ? gift.images : (gift.image_url ? [gift.image_url] : []),
      stock: gift.stock?.toString() || '',
      category: gift.category || '',
      colour: gift.colour || '#ff69b4',
      occasion: gift.occasion || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Gift name is required', 'error'); return }
    if (!form.price || Number(form.price) <= 0) { showToast('Price must be greater than 0', 'error'); return }

    setLoading(true)
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      images: form.images || [],
      image_url: (form.images || [])[0] || '',
      stock: Number(form.stock) || 0,
      category: form.category.trim(),
      colour: form.colour || '#ff69b4',
      occasion: form.occasion.trim(),
    }

    if (editGift) {
      const d = await api(`admin/gifts/${editGift.id}`, { method: 'PUT', body })
      setLoading(false)
      if (d.error) { showToast(d.error, 'error'); return }
      showToast('Gift updated', 'success')
      setGifts(prev => prev.map(g => g.id === editGift.id ? { ...g, ...body } : g))
    } else {
      const d = await api('admin/gifts', { method: 'POST', body })
      setLoading(false)
      if (d.error) { showToast(d.error, 'error'); return }
      showToast('Gift added', 'success')
      setGifts(prev => [...prev, d].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setShowForm(false)
  }

  const handleToggleActive = async (gift) => {
    const wasActive = isActive(gift)
    const d = await api(`admin/gifts/${gift.id}`, { method: 'PUT', body: { active: !wasActive } })
    if (d.error) { showToast(d.error, 'error'); return }
    setGifts(prev => prev.map(g => g.id === gift.id ? { ...g, active: !wasActive, is_active: !wasActive } : g))
    showToast(`${gift.name} ${!wasActive ? 'activated' : 'deactivated'}`, 'success')
  }

  const handleDelete = async (id) => {
    setLoading(true)
    const d = await api(`admin/gifts/${id}`, { method: 'DELETE' })
    setLoading(false)
    setDeleteConfirm(null)
    if (d.error) { showToast(d.error, 'error'); return }
    showToast('Gift deleted', 'success')
    setGifts(prev => prev.filter(g => g.id !== id))
  }

  const isActive = (g) => g.active === true || g.is_active === true
  const activeCount = gifts.filter(isActive).length
  const lowStockCount = gifts.filter(g => isActive(g) && (g.stock || 0) < 5).length
  const categories = [...new Set(gifts.map(g => g.category).filter(Boolean))]

  const handleDuplicate = (gift) => {
    setEditGift(null)
    setForm({
      name: gift.name + ' (Copy)', description: gift.description || '',
      price: gift.price?.toString() || '',
      images: gift.images?.length ? [...gift.images] : (gift.image_url ? [gift.image_url] : []),
      stock: '100', category: gift.category || '',
      colour: gift.colour || '#ff69b4', occasion: gift.occasion || '',
    })
    setShowForm(true)
  }

  const openGallery = (gift, index = 0) => {
    setGalleryGift(gift)
    setGalleryIndex(index)
  }

  const filteredGifts = gifts
    .filter(g => {
      const matchSearch = !search || g.name?.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase())
      const matchCat = categoryFilter === 'all' || g.category === categoryFilter
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':  return (a.price || 0) - (b.price || 0)
        case 'price_desc': return (b.price || 0) - (a.price || 0)
        case 'stock_low':  return (a.stock || 0) - (b.stock || 0)
        case 'newest':     return new Date(b.created_at || 0) - new Date(a.created_at || 0)
        default:           return (a.name || '').localeCompare(b.name || '')
      }
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl text-gray-900">Gift Catalog</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="text-green-600 font-semibold">{activeCount} active</span>
            {gifts.length - activeCount > 0 && <span> · {gifts.length - activeCount} inactive</span>}
            {lowStockCount > 0 && <span className="text-red-400"> · {lowStockCount} low stock</span>}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="btn-primary-luxury text-white border-0 rounded-xl h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Gift
        </Button>
      </div>

      {/* Search + Filter + Sort */}
      {gifts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search gifts..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          {categories.length > 0 && (
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
            <option value="name">Sort: Name A-Z</option>
            <option value="price_asc">Sort: Price Low→High</option>
            <option value="price_desc">Sort: Price High→Low</option>
            <option value="stock_low">Sort: Stock Low→High</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockCount > 0 && !fetching && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-600"><span className="font-semibold">{lowStockCount} gift{lowStockCount > 1 ? 's' : ''}</span> with stock below 5 — consider restocking</p>
        </div>
      )}

      {/* Gift Grid */}
      {fetching ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : gifts.length === 0 ? (
        <div className="glass-floating rounded-2xl text-center py-16">
          <Gift className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No gifts added yet</p>
          <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl border-pink-200 text-pink-500">
            <Plus className="w-4 h-4 mr-2" /> Add First Gift
          </Button>
        </div>
      ) : (<>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGifts.map(gift => {
            const imgs = gift.images?.length ? gift.images : (gift.image_url ? [gift.image_url] : [])
            const stockLow = isActive(gift) && (gift.stock || 0) < 5
            return (
            <div
              key={gift.id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all
                ${stockLow ? 'border-red-200' : isActive(gift) ? 'border-green-100' : 'border-gray-100 opacity-60'}`}
            >
              {/* Image — clickable for gallery */}
              {imgs.length > 0 ? (
                <div className="relative cursor-pointer group" onClick={() => openGallery(gift)}>
                  <img src={imgs[0]} alt={gift.name} className="w-full h-40 object-cover group-hover:brightness-90 transition" />
                  {imgs.length > 1 && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      +{imgs.length - 1}
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                    <Eye className="w-3 h-3" /> View
                  </span>
                  {stockLow && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">LOW STOCK</span>}
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                  <Gift className="w-12 h-12 text-pink-200" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-bold text-gray-800 text-sm leading-tight truncate">{gift.name}</p>
                    {gift.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{gift.description}</p>}
                  </div>
                  <button onClick={() => handleToggleActive(gift)} title={isActive(gift) ? 'Deactivate' : 'Activate'} className="shrink-0">
                    {isActive(gift) ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold text-pink-500">₹{gift.price?.toLocaleString('en-IN')}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                    ${stockLow ? 'bg-red-50 text-red-500' : (gift.stock || 0) > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    Stock: {gift.stock || 0}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {gift.category && <span className="text-[10px] bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{gift.category}</span>}
                  {gift.occasion && <span className="text-[10px] bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{gift.occasion}</span>}
                  {gift.colour && (
                    <span className="inline-block w-3.5 h-3.5 rounded-full border border-gray-200" style={{ backgroundColor: gift.colour }} title={gift.colour} />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(gift)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDuplicate(gift)} title="Duplicate"
                    className="flex items-center justify-center w-9 py-2 rounded-xl bg-violet-50 text-violet-500 hover:bg-violet-100 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(gift)} title="Delete"
                    className="flex items-center justify-center w-9 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
        {filteredGifts.length === 0 && gifts.length > 0 && (
          <div className="text-center py-10">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No gifts match your search</p>
            <button onClick={() => { setSearch(''); setCategoryFilter('all') }} className="text-pink-500 text-sm font-semibold mt-2 hover:underline">Clear filters</button>
          </div>
        )}
      </>)}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-pink-500" />
                </div>
                <h3 className="font-bold text-gray-800">{editGift ? 'Edit Gift' : 'Add Gift'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* AI Auto-Fill */}
              <div>
                <input ref={aiFileRef} type="file" accept="image/*" onChange={handleAiFill} className="hidden" />
                <button
                  type="button"
                  onClick={() => aiFileRef.current?.click()}
                  disabled={aiLoading || loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm hover:from-violet-600 hover:to-pink-600 transition-all disabled:opacity-60"
                >
                  {aiLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> AI analyzing &amp; generating images...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> AI Auto-Fill — Upload 1 Image</>
                  )}
                </button>
                {aiLoading && <p className="text-xs text-center text-gray-400 mt-1.5">Analyzing image &amp; generating 10 product photos (~15s)</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Gift Name <span className="text-red-400">*</span></label>
                <Input
                  placeholder="e.g. Chocolate Box, Flower Bouquet"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Description</label>
                <textarea
                  placeholder="Short description of the gift..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full h-20 rounded-xl border border-gray-200 p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Stock</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="h-11 rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Price (₹) <span className="text-red-400">*</span></label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="499"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Category</label>
                  <Input
                    placeholder="e.g. Flowers, Cakes"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="h-11 rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Colour</label>
                  <div className="flex items-center gap-2 h-11 rounded-xl border border-gray-200 px-3 bg-white">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(form.colour) ? form.colour : '#ff69b4'}
                      onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}
                      className="w-7 h-7 rounded-md cursor-pointer border-0 bg-transparent p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={form.colour}
                      onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}
                      placeholder="#ff69b4"
                      maxLength={7}
                      className="flex-1 text-sm font-mono text-gray-700 outline-none bg-transparent placeholder-gray-300"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['#ff69b4','#e91e63','#9c27b0','#3f51b5','#2196f3','#00bcd4','#4caf50','#ff9800','#f44336','#795548','#ffffff','#000000'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, colour: c }))}
                        title={c}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.colour === c ? 'border-gray-500 scale-110' : 'border-gray-200'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Occasion</label>
                <Input
                  placeholder="e.g. Birthday, Wedding, Anniversary"
                  value={form.occasion}
                  onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Gift Images <span className="text-gray-300">({(form.images || []).length}/10)</span></label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="grid grid-cols-5 gap-2">
                  {(form.images || []).map((url, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">MAIN</span>}
                    </div>
                  ))}
                  {(form.images || []).length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-pink-300 hover:bg-pink-50/30 transition-colors disabled:opacity-60"
                    >
                      {uploadingImage
                        ? <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
                        : <><Plus className="w-5 h-5 text-gray-300" /><span className="text-[9px] text-gray-400">Add</span></>
                      }
                    </button>
                  )}
                </div>
                {(form.images || []).length === 0 && !uploadingImage && (
                  <p className="text-xs text-gray-300 mt-1.5">JPG, PNG, WEBP · max 15 MB each</p>
                )}
              </div>
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border-gray-200">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-11 rounded-xl btn-primary-luxury text-white border-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editGift ? 'Save Changes' : 'Add Gift')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Delete Gift?</h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Remove <span className="font-semibold text-gray-800">{deleteConfirm.name}</span> from the gift catalog?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border-gray-200">Cancel</Button>
              <Button onClick={() => handleDelete(deleteConfirm.id)} disabled={loading} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Gallery Modal ── */}
      {galleryGift && (() => {
        const imgs = galleryGift.images?.length ? galleryGift.images : (galleryGift.image_url ? [galleryGift.image_url] : [])
        if (imgs.length === 0) return null
        return (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setGalleryGift(null)}>
            <div className="relative w-full max-w-2xl px-4" onClick={e => e.stopPropagation()}>
              <button onClick={() => setGalleryGift(null)} className="absolute -top-10 right-4 text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              <p className="text-white text-sm font-semibold text-center mb-3">{galleryGift.name} — {galleryIndex + 1} / {imgs.length}</p>
              <img src={imgs[galleryIndex]} alt="" className="w-full max-h-[70vh] object-contain rounded-xl" />
              {imgs.length > 1 && (
                <>
                  <button onClick={() => setGalleryIndex(i => (i - 1 + imgs.length) % imgs.length)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setGalleryIndex(i => (i + 1) % imgs.length)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="flex justify-center gap-2 mt-4">
                    {imgs.map((url, i) => (
                      <button key={i} onClick={() => setGalleryIndex(i)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${i === galleryIndex ? 'border-pink-400 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ═══════════ GIFT ORDERS TAB ═══════════
function GiftOrders() {
  const { showToast } = useApp()
  const [orders, setOrders]     = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [expanded, setExpanded] = useState(null)

  const fetchOrders = useCallback(async () => {
    setFetching(true)
    const d = await api('admin/gift-orders')
    if (!d.error) setOrders(Array.isArray(d) ? d : [])
    setFetching(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const refresh = async () => {
    setFetching(true)
    const d = await api('admin/gift-orders')
    if (!d.error) setOrders(Array.isArray(d) ? d : [])
    setFetching(false)
    showToast('Gift orders refreshed', 'success')
  }

  const [updatingOrder, setUpdatingOrder] = useState(null)

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId)
    const d = await api(`admin/gift-orders/${orderId}`, { method: 'PUT', body: { delivery_status: newStatus } })
    setUpdatingOrder(null)
    if (d.error) { showToast(d.error, 'error'); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: newStatus } : o))
    showToast(`Order status updated to ${fmtStatus(newStatus)}`, 'success')
  }

  const STATUSES = ['pending', 'assigned', 'en_route', 'arrived', 'delivered']

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.delivery_status === filter
    const matchesSearch = !search ||
      o.id?.includes(search) ||
      (o.delivery_address || '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const paidOrders = orders.filter(o => o.payment_status === 'full')
  const paidCount = paidOrders.length
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.gift_total || o.payment_amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{paidCount}</p>
          <p className="text-xs text-gray-500">Paid</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{orders.filter(o => ['assigned', 'en_route', 'arrived'].includes(o.delivery_status)).length}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-pink-500">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or address..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 capitalize"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{fmtStatus(s)}</option>)}
        </select>
        <button
          onClick={refresh}
          disabled={fetching}
          className="flex items-center gap-2 px-4 py-2.5 btn-primary-luxury text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Orders List */}
      <div className="glass-floating rounded-2xl overflow-hidden">
        {fetching ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No gift orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(order => {
              const isOpen = expanded === order.id
              const itemCount = (order.gift_items || []).length
              return (
                <div key={order.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                      <Gift className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-xs text-gray-500">{order.id?.slice(0, 12)}...</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLES[order.delivery_status] || 'bg-gray-100 text-gray-600'}`}>
                          {fmtStatus(order.delivery_status)}
                        </span>
                        {order.payment_status === 'full' && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">Paid</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{itemCount} gift{itemCount !== 1 ? 's' : ''} · {order.delivery_address || 'No address'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">₹{(order.gift_total || order.payment_amount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 bg-gray-50/50 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                          <p className="text-sm font-semibold text-gray-700 capitalize">{order.payment_status}</p>
                        </div>
                        {order.delivery_slot && (
                          <div className="flex items-start gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Delivery Slot</p>
                              <p className="text-sm font-semibold text-gray-700">{order.delivery_slot.date} at {order.delivery_slot.hour}:00</p>
                            </div>
                          </div>
                        )}
                        {order.delivery_address && (
                          <div className="col-span-2 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Address</p>
                              <p className="text-sm text-gray-700">{order.delivery_address}</p>
                              {order.delivery_landmark && <p className="text-xs text-gray-400">{order.delivery_landmark}</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Update Status */}
                      <div className="flex items-center gap-2 pt-1">
                        <p className="text-xs font-semibold text-gray-500 shrink-0">Update Status:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUSES.map(s => (
                            <button key={s} disabled={updatingOrder === order.id || order.delivery_status === s}
                              onClick={() => handleUpdateOrderStatus(order.id, s)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors disabled:opacity-40
                                ${order.delivery_status === s ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500'}`}>
                              {updatingOrder === order.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : fmtStatus(s)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gift Items */}
                      {(order.gift_items || []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Gift Items</p>
                          <div className="space-y-1">
                            {order.gift_items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                                  <span className="truncate">{item.name} x{item.quantity || 1}</span>
                                </div>
                                <span className="font-semibold shrink-0 ml-2">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════ MAIN COMPONENT ═══════════
export default function AdminGifts() {
  const [tab, setTab] = useState('catalog')

  return (
    <div className="p-6 space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('catalog')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'catalog' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><Gift className="w-4 h-4" /> Catalog</span>
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'orders' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Gift Orders</span>
        </button>
      </div>

      {tab === 'catalog' ? <GiftCatalog /> : <GiftOrders />}
    </div>
  )
}
