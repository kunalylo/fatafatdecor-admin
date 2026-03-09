'use client'

import { ShoppingBag, Package, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function OrdersScreen() {
  const { orders, setSelectedOrder, navigate } = useApp()
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="p-4"><h1 className="font-bold text-lg text-gray-800">My Orders</h1></div>
      <div className="px-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-pink-200 mx-auto mb-3" />
            <p className="text-gray-400">No orders yet</p>
            <Button onClick={() => navigate(SCREENS.UPLOAD)} className="mt-3 gradient-pink border-0 text-white shadow-pink">Create Design</Button>
          </div>
        ) : orders.map(o => (
          <Card key={o.id} className="border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedOrder(o)
              if (o.delivery_status === 'assigned' || o.delivery_status === 'in_transit') navigate(SCREENS.TRACKING)
              else if (o.payment_status === 'pending') navigate(SCREENS.BOOKING)
              else navigate(SCREENS.ORDER_DETAIL)
            }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center"><Package className="w-5 h-5 text-pink-500" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-pink-500 flex items-center justify-end"><IndianRupee className="w-3 h-3" />{o.total_cost}</p>
                  <Badge className={`text-[10px] ${o.delivery_status === 'delivered' ? 'bg-green-100 text-green-600' : o.delivery_status === 'in_transit' ? 'bg-blue-100 text-blue-600' : o.delivery_status === 'assigned' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{o.delivery_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
