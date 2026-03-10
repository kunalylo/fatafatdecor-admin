'use client'

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'
import { Search, RefreshCw, ChevronDown, ChevronUp, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const STATUS_STYLES = {
  pending:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  assigned:   'bg-blue-100 text-blue-700 border-blue-200',
  decorating: 'bg-purple-100 text-purple-700 border-purple-200',
  completed:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
}

const STATUSES = ['pending', 'assigned', 'decorating', 'completed', 'cancelled']

export default function AdminOrders() {
  const { orders, setOrders, showToast } = useApp()
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    const data = await api('orders')
    if (!data.error) setOrders(data)
    setLoading(false)
    showToast('Orders refreshed', 'success')
  }

  const updateStatus = async (orderId, newStatus) => {
    const data = await api(`orders/${orderId}`, { method: 'PUT', body: { delivery_status: newStatus } })
    if (!data.error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_status: newStatus } : o))
      showToast(`Status updated to ${newStatus}`, 'success')
    } else { showToast(data.error, 'error') }
  }

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.delivery_status === filter
    const matchesSearch = !search || o.id.includes(search) || (o.delivery_address || '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="p-6 space-y-4">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or address…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        {/* Status filter */}
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.delivery_status === s).length
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${filter === s ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'}`}>
              {s} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(order => {
              const isOpen = expanded === order.id
              return (
                <div key={order.id}>
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-gray-500">{order.id.slice(0, 12)}…</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${STATUS_STYLES[order.delivery_status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {order.delivery_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{order.delivery_address || 'No address'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-800">₹{(order.payment_amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </button>

                  {/* Expanded Details */}
                  {isOpen && (
                    <div className="px-6 pb-5 bg-gray-50/50 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                          <p className="text-sm font-semibold text-gray-700 capitalize">{order.payment_status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Items</p>
                          <p className="text-sm font-semibold text-gray-700">{(order.items || []).length} item(s)</p>
                        </div>
                        {order.requested_slot && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Requested Slot</p>
                            <p className="text-sm font-semibold text-gray-700">{order.requested_slot.date} at {order.requested_slot.hour}:00</p>
                          </div>
                        )}
                        {order.delivery_slot && (
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Booked Slot</p>
                            <p className="text-sm font-semibold text-gray-700">{order.delivery_slot.date} {order.delivery_slot.time_label}</p>
                          </div>
                        )}
                      </div>

                      {/* Items list */}
                      {(order.items || []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Order Items</p>
                          <div className="space-y-1">
                            {order.items.slice(0, 5).map((item, i) => (
                              <div key={i} className="flex justify-between text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                <span>{item.name} ×{item.quantity || 1}</span>
                                <span className="font-semibold">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                              </div>
                            ))}
                            {order.items.length > 5 && <p className="text-xs text-gray-400 pl-1">+{order.items.length - 5} more</p>}
                          </div>
                        </div>
                      )}

                      {/* Status changer */}
                      <div className="flex items-center gap-3 pt-1">
                        <p className="text-xs font-semibold text-gray-500 shrink-0">Update Status:</p>
                        <div className="flex gap-2 flex-wrap">
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(order.id, s)}
                              disabled={order.delivery_status === s}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                                order.delivery_status === s
                                  ? 'bg-pink-500 text-white border-pink-500 cursor-default'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-pink-400 hover:text-pink-500'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
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
