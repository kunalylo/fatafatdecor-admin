'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Users, Box, Package, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '../lib/constants'
import { useApp } from '../context/AppContext'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
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
  decorating: 'bg-purple-100 text-purple-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const { orders, items, deliveryPersons } = useApp()
  const [kitsCount, setKitsCount] = useState(0)

  useEffect(() => {
    api('kits').then(d => { if (Array.isArray(d)) setKitsCount(d.length) })
  }, [])

  const totalRevenue    = orders.reduce((s, o) => s + (o.payment_amount || 0), 0)
  const pendingOrders   = orders.filter(o => o.delivery_status === 'pending').length
  const activeOrders    = orders.filter(o => ['assigned','decorating'].includes(o.delivery_status)).length
  const completedOrders = orders.filter(o => o.delivery_status === 'completed').length
  const recentOrders    = orders.slice(0, 8)

  return (
    <div className="p-6 space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders"      value={orders.length}         sub={`${pendingOrders} pending`}   color="bg-pink-500" />
        <StatCard icon={TrendingUp}  label="Revenue Collected" value={`₹${totalRevenue.toLocaleString()}`} sub="partial payments"  color="bg-emerald-500" />
        <StatCard icon={Users}       label="Team Members"      value={deliveryPersons.length} sub="decorators"                   color="bg-blue-500" />
        <StatCard icon={Box}         label="Inventory Items"   value={items.length}           sub={`${kitsCount} kits`}          color="bg-violet-500" />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
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
          <p className="text-2xl font-bold text-gray-800">{completedOrders}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No orders yet</td></tr>
              )}
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-700 font-mono text-xs">{order.id.slice(0, 8)}…</p>
                    <p className="text-xs text-gray-400">{(order.items || []).length} item(s)</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs max-w-[140px] truncate">{order.delivery_address || '—'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">
                    ₹{(order.payment_amount || 0).toLocaleString()}
                    <p className="text-xs text-gray-400 font-normal capitalize">{order.payment_status}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.delivery_status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.delivery_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
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
