'use client'

import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Toast from './components/Toast'
import AdminScreen from './screens/AdminScreen'
import AdminOrders from './screens/AdminOrders'
import AdminDashboard from './screens/AdminDashboard'
import AdminSubAdmins from './screens/AdminSubAdmins'
import AdminUsers from './screens/AdminUsers'
import AdminCities from './screens/AdminCities'
import {
  LayoutDashboard, Sparkles, Package, Box, Users, Clock,
  ShoppingBag, LogOut, Menu, X, ChevronRight, UserCog, UserCheck, Shield, MapPin
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// All nav items — sub-admins tab is admin-only
const ALL_NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard, adminOnly: false },
  { id: 'orders',      label: 'Orders',       icon: ShoppingBag,    adminOnly: false },
  { id: 'smart',       label: 'AI Scanner',   icon: Sparkles,       adminOnly: false },
  { id: 'kits',        label: 'Kits',         icon: Package,        adminOnly: false },
  { id: 'items',       label: 'Inventory',    icon: Box,            adminOnly: false },
  { id: 'delivery',    label: 'Team',         icon: Users,          adminOnly: false },
  { id: 'slots',       label: 'Slots',        icon: Clock,          adminOnly: false },
  { id: 'users',       label: 'Customers',    icon: UserCheck,      adminOnly: false },
  { id: 'cities',      label: 'Cities',       icon: MapPin,         adminOnly: false },
  { id: 'sub-admins',  label: 'Sub-Admins',   icon: UserCog,        adminOnly: true  },
]

function AdminLogin() {
  const { loading, authForm, setAuthForm, handleAuth } = useApp()
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">FatafatDecor</h1>
          <p className="text-slate-400 text-sm">Admin Panel</p>
        </div>
        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-4">
          <h2 className="text-white font-bold text-lg mb-2">Sign In</h2>
          <Input
            placeholder="Email"
            type="email"
            value={authForm.email}
            onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-12 rounded-xl"
          />
          <Input
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-12 rounded-xl"
          />
          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl border-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AdminPanel() {
  const { user, setUser, adminTab, setAdminTab, showToast } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isFullAdmin = user?.role === 'admin'
  const userPerms   = user?.permissions || []

  // Filter nav: full admin sees all; sub-admin sees only permitted + dashboard
  const visibleNav = ALL_NAV_ITEMS.filter(item => {
    if (item.adminOnly) return isFullAdmin
    if (isFullAdmin)    return true
    return item.id === 'dashboard' || userPerms.includes(item.id)
  })

  const activeNav = visibleNav.find(n => n.id === adminTab) || visibleNav[0]

  const handleLogout = () => {
    setUser(null)
    showToast('Logged out successfully', 'success')
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
          <div className="w-9 h-9 bg-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm truncate">FatafatDecor</h1>
            <p className="text-slate-400 text-xs">{isFullAdmin ? 'Admin Panel' : 'Sub-Admin Panel'}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNav.map(item => {
            const Icon = item.icon
            const isActive = adminTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setAdminTab(item.id); setSidebarOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-700/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{(user?.name?.[0] || 'A').toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
              <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
            </div>
            {!isFullAdmin && (
              <div className="shrink-0 flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3 text-orange-400" />
                <span className="text-orange-400 text-[9px] font-bold">SUB</span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800/80 text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            {activeNav && (() => { const Icon = activeNav.icon; return <Icon className="w-5 h-5 text-pink-500" /> })()}
            <div>
              <h2 className="text-gray-800 font-bold text-lg leading-tight">{activeNav?.label}</h2>
              <p className="text-gray-400 text-xs">FatafatDecor {isFullAdmin ? 'Admin' : 'Sub-Admin'}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-sm text-gray-500">Welcome, {user?.name?.split(' ')[0]}</span>
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 text-xs font-bold">{(user?.name?.[0] || 'A').toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {adminTab === 'dashboard'  && <AdminDashboard />}
          {adminTab === 'orders'     && <AdminOrders />}
          {adminTab === 'sub-admins' && <AdminSubAdmins />}
          {adminTab === 'users'      && <AdminUsers />}
          {adminTab === 'cities'     && <AdminCities />}
          {!['dashboard', 'orders', 'sub-admins', 'users', 'cities'].includes(adminTab) && <AdminScreen />}
        </main>
      </div>
    </div>
  )
}

function AppContent() {
  const { user } = useApp()
  return (
    <>
      <Toast />
      {!user ? <AdminLogin /> : <AdminPanel />}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
