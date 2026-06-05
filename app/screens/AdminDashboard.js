'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingBag, Users, Box, Package, TrendingUp, Clock,
  CheckCircle2, AlertCircle, Truck, XCircle, RefreshCw
} from 'lucide-react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  assigned:   'bg-blue-100 text-blue-700',
  en_route:   'bg-indigo-100 text-indigo-700',
  arrived:    'bg-cyan-100 text-cyan-700',
  decorating: 'bg-purple-100 text-purple-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const { orders, setOrders, items, deliveryPersons, showToast } = useApp()
  const [referencesCount, setReferencesCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    api('admin/references-stats').then(d => { if (!d.error) setReferencesCount(d.active || 0) })
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    const [ordersData, refStats] = await Promise.all([api('orders'), api('admin/references-stats')])
    if (!ordersData.error) setOrders(ordersData)
    if (!refStats.error)   setReferencesCount(refStats.active || 0)
    setRefreshing(false)
    showToast('Dashboard refreshed', 'success')
  }

  // Exclude unpaid draft orders (customer cancelled Razorpay before paying) — not real orders
  const realOrders      = orders.filter(o => o.payment_status !== 'pending')
  const totalRevenue    = realOrders.reduce((s, o) => s + (o.payment_amount || 0), 0)
  const pendingOrders   = realOrders.filter(o => o.delivery_status === 'pending').length
  const activeOrders    = realOrders.filter(o => ['assigned', 'en_route', 'arrived', 'decorating'].includes(o.delivery_status)).length
  const deliveredOrders = realOrders.filter(o => o.delivery_status === 'delivered' || o.delivery_status === 'completed').length
  const cancelledOrders = realOrders.filter(o => o.delivery_status === 'cancelled').length
  const activeTeam      = deliveryPersons.filter(dp => dp.is_active).length
  const recentOrders    = [...realOrders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10)

  return (
    <div className="p-6 space-y-6">

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-sm text-gray-400 mt-0.5">Overview of your business</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders" value={realOrders.length} sub={`${pendingOrders} pending`} color="bg-pink-500" />
        <StatCard icon={TrendingUp} label="Revenue Collected" value={`₹${totalRevenue.toLocaleString('en-IN')}`} sub={`${realOrders.filter(o => o.payment_status === 'partial').length} partial payments`} color="bg-emerald-500" />
        <StatCard icon={Users} label="Team Members" value={deliveryPersons.length} sub={`${activeTeam} active`} color="bg-blue-500" />
        <StatCard icon={Box} label="Inventory" value={items.length.toLocaleString()} sub={`${referencesCount} live references`} color="bg-violet-500" />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{pendingOrders}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <AlertCircle className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{activeOrders}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{deliveredOrders}</p>
          <p className="text-xs text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <XCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{cancelledOrders}</p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-base">Recent Orders</h3>
          <span className="text-xs text-gray-400">{realOrders.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No orders yet</td></tr>
              )}
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-700 font-mono text-xs">{order.id.slice(0, 8)}...</p>
                    <p className="text-xs text-gray-400">{(order.items || []).length} item(s)</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 truncate max-w-[160px]">{order.delivery_address || '—'}</p>
                    {order.delivery_slot && (
                      <p className="text-[10px] text-gray-400">{order.delivery_slot.date} {order.delivery_slot.time_label}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-700">₹{(order.payment_amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 capitalize">{order.payment_status}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.delivery_status] || 'bg-gray-100 text-gray-600'}`}>
                      {(order.delivery_status || 'unknown').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
