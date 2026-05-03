'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'
import {
  Gift, Plus, Pencil, Trash2, X, Loader2, AlertTriangle,
  ToggleLeft, ToggleRight, Check, Package, Search, RefreshCw,
  ChevronDown, ChevronUp, MapPin, Clock, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMPTY_FORM = { name: '', description: '', price: '', image_url: '', sr: '', category: '', colour: '#ff69b4' }

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
      image_url: gift.image_url || '',
      sr: gift.sr?.toString() || '',
      category: gift.category || '',
      colour: gift.colour || '#ff69b4',
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
      image_url: form.image_url.trim(),
      sr: Number(form.sr) || 0,
      category: form.category.trim(),
      colour: form.colour || '#ff69b4',
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
      setGifts(prev => [...prev, d].sort((a, b) => (a.sr || 0) - (b.sr || 0) || a.name.localeCompare(b.name)))
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gift Catalog</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            <span className="text-green-600 font-semibold">{activeCount} active</span>
            {gifts.length - activeCount > 0 && <span> · {gifts.length - activeCount} inactive</span>}
            {' '}— customers can browse and order active gifts
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-pink-500 hover:bg-pink-600 text-white border-0 rounded-xl h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Gift
        </Button>
      </div>

      {/* Gift Grid */}
      {fetching ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : gifts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16">
          <Gift className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No gifts added yet</p>
          <Button onClick={openCreate} variant="outline" className="mt-4 rounded-xl border-pink-200 text-pink-500">
            <Plus className="w-4 h-4 mr-2" /> Add First Gift
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {gifts.map(gift => (
            <div
              key={gift.id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all
                ${isActive(gift) ? 'border-green-100' : 'border-gray-100 opacity-60'}`}
            >
              {/* Image */}
              {gift.image_url ? (
                <img src={gift.image_url} alt={gift.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                  <Gift className="w-12 h-12 text-pink-200" />
                </div>
              )}

              <div className="p-4">
                {/* Name + Toggle */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-bold text-gray-800 text-sm leading-tight truncate">{gift.name}</p>
                    {gift.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{gift.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(gift)}
                    title={isActive(gift) ? 'Deactivate' : 'Activate'}
                    className="shrink-0"
                  >
                    {isActive(gift)
                      ? <ToggleRight className="w-7 h-7 text-green-500" />
                      : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                  </button>
                </div>

                {/* Price + Status */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-lg font-extrabold text-pink-500">₹{gift.price?.toLocaleString('en-IN')}</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold
                    ${isActive(gift) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isActive(gift) ? <><Check className="w-3 h-3" /> Active</> : 'Inactive'}
                  </span>
                </div>

                {/* Category + Colour */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {gift.category && (
                    <span className="text-[11px] bg-purple-50 text-purple-600 font-semibold px-2 py-0.5 rounded-full">{gift.category}</span>
                  )}
                  {gift.colour && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="inline-block w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: gift.colour }} />
                      {gift.colour}
                    </span>
                  )}
                </div>
                {/* Sort order */}
                {gift.sr > 0 && <p className="text-[10px] text-gray-400 mb-3">Sort order: {gift.sr}</p>}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(gift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(gift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-400 text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Sort Order</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 = auto"
                    value={form.sr}
                    onChange={e => setForm(f => ({ ...f, sr: e.target.value }))}
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
                      value={form.colour}
                      onChange={e => setForm(f => ({ ...f, colour: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="text-sm text-gray-600 font-mono">{form.colour}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Image URL</label>
                <Input
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200"
                />
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-gray-200"
                    onError={e => { e.target.style.display = 'none' }} />
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
                className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white border-0"
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

  const STATUSES = ['pending', 'assigned', 'en_route', 'arrived', 'delivered']

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.delivery_status === filter
    const matchesSearch = !search ||
      o.id?.includes(search) ||
      (o.delivery_address || '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const paidCount = orders.filter(o => o.payment_status === 'full').length
  const totalRevenue = orders.reduce((s, o) => s + (o.gift_total || o.payment_amount || 0), 0)

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
          className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
