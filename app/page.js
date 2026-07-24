'use client'

import { Component, useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Toast from './components/Toast'
import AdminScreen from './screens/AdminScreen'
import AdminOrders from './screens/AdminOrders'
import AdminDashboard from './screens/AdminDashboard'
import AdminSubAdmins from './screens/AdminSubAdmins'
import AdminUsers from './screens/AdminUsers'
import AdminCities from './screens/AdminCities'
import AdminGifts from './screens/AdminGifts'
import InventoryScreen from './screens/InventoryScreen'
import AdminFestivals from './screens/AdminFestivals'
import AdminTrending from './screens/AdminTrending'
import AdminBulkCorp from './screens/AdminBulkCorp'
import AdminPrivate from './screens/AdminPrivate'
import AdminLeads from './screens/AdminLeads'
import {
  LayoutDashboard, Sparkles, Package, Box, Users, Clock, Gift,
  ShoppingBag, LogOut, Menu, X, ChevronRight, UserCog, UserCheck, Shield, MapPin,
  Image as ImageIcon, Flame, Boxes, Lock, Inbox, TrendingUp
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('[FatafatDecor Admin] Crash:', error, info?.componentStack) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-aurora flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 iridescent rounded-2xl flex items-center justify-center mb-4 border border-white/60">
            <span className="text-3xl text-white">!</span>
          </div>
          <h2 className="font-display text-2xl text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6">The admin panel encountered an unexpected error.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            className="px-6 py-3 btn-primary-luxury text-white font-bold rounded-2xl">
            Reload Panel
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// All nav items — sub-admins tab is admin-only
// Old "kits", "items" and "AI Scanner" removed — replaced by new unified "Inventory"
// which has two tabs: All Items (Excel) + Reference Designs (AI-cured uploads)
const ALL_NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard, adminOnly: false },
  { id: 'orders',      label: 'Orders',       icon: ShoppingBag,    adminOnly: false },
  { id: 'inventory',   label: 'Inventory',    icon: Package,        adminOnly: false },
  { id: 'delivery',    label: 'Team',         icon: Users,          adminOnly: false },
  { id: 'slots',       label: 'Slots',        icon: Clock,          adminOnly: false },
  { id: 'users',       label: 'Customers',    icon: UserCheck,      adminOnly: false },
  { id: 'gifts',       label: 'Gifts',        icon: Gift,           adminOnly: false },
  { id: 'trending',    label: 'Trending',     icon: TrendingUp,     adminOnly: false },
  { id: 'festivals',   label: 'Festivals',    icon: Flame,          adminOnly: false },
  { id: 'bulkcorp',    label: 'Bulk & Corp',  icon: Boxes,          adminOnly: false },
  { id: 'private',     label: 'Private',      icon: Lock,           adminOnly: false },
  { id: 'leads',       label: 'Leads',        icon: Inbox,          adminOnly: false },
  { id: 'cities',      label: 'Cities',       icon: MapPin,         adminOnly: false },
  { id: 'sub-admins',  label: 'Sub-Admins',   icon: UserCog,        adminOnly: true  },
]

function AdminLogin() {
  const { loading, authForm, setAuthForm, handleAuth } = useApp()

  const onKeyDown = (e) => { if (e.key === 'Enter' && !loading) handleAuth() }

  return (
    <div className="min-h-screen bg-aurora flex items-center justify-center px-4 relative overflow-hidden">
      <div className="iridescent-orb absolute -top-10 -left-10 w-44 h-44 rounded-full pointer-events-none" />
      <div className="iridescent-orb absolute bottom-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ animationDelay: '2s' }} />
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 iridescent aurora-shimmer rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/60">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="eyebrow text-gray-400 mb-1">Control Center</p>
          <h1 className="font-display text-3xl text-gray-900 leading-tight">Fatafat <span className="italic iridescent-text">Decor</span></h1>
          <p className="text-gray-500 text-sm mt-1">Admin Panel</p>
        </div>
        {/* Card */}
        <div className="glass-floating rounded-[28px] p-6 space-y-4">
          <h2 className="font-display text-xl text-gray-900 mb-2">Sign In</h2>
          <Input
            placeholder="Email"
            type="email"
            value={authForm.email}
            onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
            onKeyDown={onKeyDown}
            className="bg-white/70 border-white/80 text-gray-800 placeholder:text-gray-400 h-12 rounded-2xl"
          />
          <Input
            placeholder="Password"
            type="password"
            value={authForm.password}
            onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={onKeyDown}
            className="bg-white/70 border-white/80 text-gray-800 placeholder:text-gray-400 h-12 rounded-2xl"
          />
          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full h-12 btn-primary-luxury text-white font-bold rounded-2xl border-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </Button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4">FatafatDecor Admin v2.1</p>
      </div>
    </div>
  )
}

function AdminPanel() {
  const { user, adminTab, setAdminTab, handleLogout } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isFullAdmin = user?.role === 'admin'
  const rawPerms    = user?.permissions || []

  // Migrate legacy permissions so existing sub-admins keep access without re-saving:
  //   'kits' / 'items' / 'smart' → 'inventory'   (the new unified tab)
  const userPerms = (() => {
    const out = new Set(rawPerms)
    if (out.has('kits') || out.has('items') || out.has('smart')) out.add('inventory')
    out.delete('kits')
    out.delete('items')
    out.delete('smart')
    return [...out]
  })()

  // Filter nav: full admin sees all; sub-admin sees only permitted + dashboard
  const visibleNav = ALL_NAV_ITEMS.filter(item => {
    if (item.adminOnly) return isFullAdmin
    if (isFullAdmin)    return true
    return item.id === 'dashboard' || userPerms.includes(item.id)
  })

  const activeNav = visibleNav.find(n => n.id === adminTab) || visibleNav[0]

  return (
    <div className="flex h-screen bg-aurora overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 glass-sidebar flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/50">
          <div className="w-9 h-9 iridescent rounded-xl flex items-center justify-center shrink-0 border border-white/60">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base text-gray-900 truncate leading-tight">FatafatDecor</h1>
            <p className="text-gray-400 text-xs">{isFullAdmin ? 'Admin Panel' : 'Sub-Admin Panel'}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 lg:hidden">
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
                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all
                  ${isActive
                    ? 'btn-primary-luxury text-white'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-900'}
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
        <div className="p-4 border-t border-white/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 iridescent rounded-full flex items-center justify-center shrink-0 border border-white/60">
              <span className="text-white text-xs font-bold">{(user?.name?.[0] || 'A').toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
              <p className="text-gray-400 text-[10px] truncate">{user?.email}</p>
            </div>
            {!isFullAdmin && (
              <div className="shrink-0 flex items-center gap-1 bg-orange-500/15 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3 text-orange-500" />
                <span className="text-orange-500 text-[9px] font-bold">SUB</span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-500 hover:text-red-500 rounded-2xl hover:bg-white/60 text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="glass-overlay px-6 py-4 flex items-center gap-4 shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            {activeNav && (() => { const Icon = activeNav.icon; return <Icon className="w-5 h-5 text-pink-500" /> })()}
            <div>
              <h2 className="font-display text-xl text-gray-900 leading-tight">{activeNav?.label}</h2>
              <p className="text-gray-400 text-xs">FatafatDecor {isFullAdmin ? 'Admin' : 'Sub-Admin'}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-sm text-gray-500">Welcome, {user?.name?.split(' ')[0]}</span>
            <div className="w-8 h-8 iridescent rounded-full flex items-center justify-center border border-white/60">
              <span className="text-white text-xs font-bold">{(user?.name?.[0] || 'A').toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {adminTab === 'dashboard'  && <AdminDashboard />}
          {adminTab === 'orders'     && <AdminOrders />}
          {adminTab === 'sub-admins' && <AdminSubAdmins />}
          {adminTab === 'users'      && <AdminUsers />}
          {adminTab === 'cities'     && <AdminCities />}
          {adminTab === 'gifts'      && <AdminGifts />}
          {adminTab === 'inventory'  && <InventoryScreen />}
          {adminTab === 'trending'   && <AdminTrending />}
          {adminTab === 'festivals'  && <AdminFestivals />}
          {adminTab === 'bulkcorp'   && <AdminBulkCorp />}
          {adminTab === 'private'    && <AdminPrivate />}
          {adminTab === 'leads'      && <AdminLeads />}
          {!['dashboard', 'orders', 'sub-admins', 'users', 'cities', 'gifts', 'inventory', 'trending', 'festivals', 'bulkcorp', 'private', 'leads'].includes(adminTab) && <AdminScreen />}
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
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  )
}
