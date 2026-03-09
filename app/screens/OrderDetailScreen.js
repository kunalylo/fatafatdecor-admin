'use client'

import { ChevronLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function OrderDetailScreen() {
  const { selectedOrder, navigate } = useApp()
  if (!selectedOrder) return null
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.ORDERS)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h1 className="font-bold text-lg text-gray-800">Order Details</h1>
      </div>
      <div className="px-4 space-y-4">
        <Card className="border border-gray-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Order ID</span><span className="text-sm font-mono text-gray-700">#{selectedOrder.id.slice(0, 8)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Total</span><span className="text-sm font-bold text-pink-500">Rs {selectedOrder.total_cost}</span></div>
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Payment</span><Badge className={selectedOrder.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}>{selectedOrder.payment_status}</Badge></div>
            <div className="flex justify-between"><span className="text-gray-400 text-sm">Delivery</span><Badge className="capitalize">{selectedOrder.delivery_status}</Badge></div>
          </CardContent>
        </Card>
        <div>
          <h3 className="font-bold text-sm text-gray-700 mb-2">Items</h3>
          {(selectedOrder.items || []).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{item.name} x{item.quantity}</span>
              <span className="text-sm font-semibold text-gray-700">Rs {((item.price || item.selling_price_unit || 0) * (item.quantity || 1)).toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
