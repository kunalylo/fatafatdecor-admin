'use client'

import { useEffect } from 'react'
import { ChevronLeft, MapPin, Truck, User, Phone, Star, CheckCircle2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function TrackingScreen() {
  const { orders, selectedOrder, setSelectedOrder, trackingData, navigate, mapRef, mapInstance } = useApp()
  const trackableOrders = orders.filter(o => o.delivery_status === 'assigned' || o.delivery_status === 'in_transit')
  useEffect(() => {
    if (trackingData && mapRef.current && typeof window !== 'undefined' && window.L) {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
      const dloc = trackingData.delivery_location, uloc = trackingData.user_location
      const map = window.L.map(mapRef.current).setView([dloc?.lat || uloc?.lat || 28.6139, dloc?.lng || uloc?.lng || 77.2090], 14)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      if (dloc?.lat) window.L.marker([dloc.lat, dloc.lng]).addTo(map).bindPopup(`<b>${trackingData.delivery_person?.name}</b>`).openPopup()
      if (uloc?.lat) window.L.marker([uloc.lat, uloc.lng]).addTo(map).bindPopup('<b>You</b>')
      mapInstance.current = map
      return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
    }
  }, [trackingData])
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.ORDERS)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h1 className="font-bold text-lg text-gray-800">Live Tracking</h1>
      </div>
      <div className="px-4 space-y-4">
        {!selectedOrder && trackableOrders.length === 0 && (
          <div className="text-center py-12"><MapPin className="w-12 h-12 text-pink-200 mx-auto mb-3" /><p className="text-gray-400">No active deliveries</p></div>
        )}
        {!selectedOrder && trackableOrders.length > 0 && trackableOrders.map(o => (
          <Card key={o.id} className="border border-gray-100 cursor-pointer" onClick={() => setSelectedOrder(o)}>
            <CardContent className="p-3 flex items-center gap-3">
              <Truck className="w-5 h-5 text-pink-500" />
              <div><p className="text-sm font-semibold text-gray-700">Order #{o.id.slice(0, 8)}</p><p className="text-xs text-gray-400 capitalize">{o.delivery_status}</p></div>
              <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
            </CardContent>
          </Card>
        ))}
        {selectedOrder && trackingData && (
          <>
            <div ref={mapRef} style={{ width: '100%', height: '250px', borderRadius: '16px' }} className="bg-pink-50 border border-pink-100" />
            <Card className="border border-gray-100">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Status</h3>
                <div className="space-y-3">
                  {[
                    { key: 'assigned', label: 'Decorator Assigned', icon: <CheckCircle2 className="w-4 h-4 text-white" /> },
                    { key: 'en_route', label: 'On the Way', icon: <Truck className="w-4 h-4 text-white" /> },
                    { key: 'arrived', label: 'Arrived at Your Place', icon: <MapPin className="w-4 h-4 text-white" /> },
                    { key: 'decorating', label: 'Decorating in Progress', icon: <Star className="w-4 h-4 text-white" /> },
                    { key: 'delivered', label: 'Decoration Complete 🎉', icon: <CheckCircle2 className="w-4 h-4 text-white" /> },
                  ].map(({ key, label, icon }, i) => {
                    const order = ['assigned','en_route','arrived','decorating','delivered']
                    const isActive = order.indexOf(trackingData.delivery_status) >= i
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'gradient-pink' : 'bg-gray-100'}`}>
                          {icon}
                        </div>
                        <p className={`text-sm font-semibold ${isActive ? 'text-gray-700' : 'text-gray-300'}`}>{label}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            {trackingData.delivery_person && (
              <Card className="border border-gray-100">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-pink flex items-center justify-center"><User className="w-6 h-6 text-white" /></div>
                  <div><p className="font-bold text-sm text-gray-700">{trackingData.delivery_person.name}</p><p className="text-xs text-gray-400">Delivery Partner</p></div>
                  <a href={`tel:${trackingData.delivery_person.phone}`} className="ml-auto w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg"><Phone className="w-5 h-5 text-white" /></a>
                </CardContent>
              </Card>
            )}
            {trackingData.verification_otp && !trackingData.otp_verified && (
              <Card className="border-2 border-pink-300 bg-pink-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full gradient-pink flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🔐</span>
                    </div>
                    <h3 className="font-bold text-sm text-pink-700">Your Verification OTP</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Your decorator has arrived! Share this code with them to start the decoration.</p>
                  <div className="flex items-center justify-center gap-2 bg-white rounded-2xl py-4 border-2 border-pink-200">
                    {trackingData.verification_otp.split('').map((digit, i) => (
                      <div key={i} className="w-14 h-16 rounded-xl gradient-pink flex items-center justify-center shadow-pink">
                        <span className="text-white text-3xl font-black">{digit}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-center text-pink-400 mt-2 font-medium">Show this to your decorator — do not share with anyone else</p>
                </CardContent>
              </Card>
            )}
            {trackingData.otp_verified && (
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-bold text-sm text-green-700">Decoration in Progress!</p>
                    <p className="text-xs text-green-500">OTP verified — your decorator is at work 🎉</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
