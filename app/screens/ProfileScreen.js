'use client'

import { User, Zap, ShoppingBag, Settings, ChevronRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function ProfileScreen() {
  const { user, setUser, setDesigns, setOrders, setScreen, navigate } = useApp()
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="p-4"><h1 className="font-bold text-lg text-gray-800">Profile</h1></div>
      <div className="px-4 space-y-4">
        <Card className="border border-pink-100 bg-pink-50/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-pink flex items-center justify-center shadow-pink"><User className="w-8 h-8 text-white" /></div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{user?.name}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
              {user?.phone && <p className="text-xs text-gray-400">{user?.phone}</p>}
              <Badge className="mt-1 capitalize gradient-pink border-0 text-white">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardContent className="p-4 space-y-1">
            <button onClick={() => navigate(SCREENS.CREDITS)} className="w-full flex items-center gap-3 py-3 border-b border-gray-50">
              <Zap className="w-5 h-5 text-yellow-500" /><span className="flex-1 text-left text-sm text-gray-700">Credits: {user?.credits || 0}</span><ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            <button onClick={() => navigate(SCREENS.ORDERS)} className="w-full flex items-center gap-3 py-3 border-b border-gray-50">
              <ShoppingBag className="w-5 h-5 text-pink-500" /><span className="flex-1 text-left text-sm text-gray-700">My Orders</span><ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate(SCREENS.ADMIN)} className="w-full flex items-center gap-3 py-3">
                <Settings className="w-5 h-5 text-purple-500" /><span className="flex-1 text-left text-sm text-gray-700">Admin Panel</span><ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            )}
          </CardContent>
        </Card>
        <Button onClick={() => { setUser(null); setScreen(SCREENS.AUTH); setDesigns([]); setOrders([]) }}
          variant="outline" className="w-full h-12 border-red-200 text-red-400 font-semibold rounded-2xl hover:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  )
}
