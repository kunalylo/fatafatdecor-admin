'use client'

import { ChevronLeft, Zap, IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApp } from '../context/AppContext'
import { CREDIT_PACKAGES, SCREENS } from '../lib/constants'

export default function CreditsScreen() {
  const { user, navigate, handlePayment } = useApp()
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.HOME)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <h1 className="font-bold text-lg text-gray-800">Buy Credits</h1>
      </div>
      <div className="px-4 space-y-4">
        <Card className="border border-pink-100 bg-pink-50/30">
          <CardContent className="p-6 text-center">
            <Zap className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{user?.credits || 0}</p>
            <p className="text-sm text-gray-400">Current Credits</p>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {CREDIT_PACKAGES.map(pkg => (
            <Card key={pkg.credits} className={`border cursor-pointer hover:scale-[1.02] transition-transform ${pkg.popular ? 'border-pink-300 shadow-pink' : 'border-gray-100'}`}
              onClick={() => handlePayment('credits', pkg.price, null, pkg.credits)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl gradient-pink flex items-center justify-center shadow-pink"><Zap className="w-6 h-6 text-white" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700">{pkg.label}</h3>
                    {pkg.popular && <Badge className="gradient-pink border-0 text-white text-[10px]">BEST</Badge>}
                  </div>
                  <p className="text-sm text-gray-400">{pkg.credits} AI Credits</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-500 flex items-center"><IndianRupee className="w-4 h-4" />{pkg.price}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
