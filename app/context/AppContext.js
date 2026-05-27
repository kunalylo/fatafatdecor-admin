'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { api } from '../lib/constants'

export const AppContext = createContext({})
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [loading, setLoading]             = useState(false)
  const [toast, setToast]                 = useState(null)
  const [authForm, setAuthForm]           = useState({ email: '', password: '' })

  // Admin data
  const [items, setItems]                         = useState([])
  const [deliveryPersons, setDeliveryPersons]     = useState([])
  const [orders, setOrders]                       = useState([])
  const [adminTab, setAdminTab]                   = useState('dashboard')

  // AI Scanner state (persisted across tab switches)
  const [scanImage, setScanImage]         = useState(null)
  const [scanName, setScanName]           = useState('')
  const [scanning, setScanning]           = useState(false)
  const [scanAnalysis, setScanAnalysis]   = useState(null)

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // ── Restore session from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fd_admin_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && (parsed.role === 'admin' || parsed.role === 'sub_admin')) {
          setUser(parsed)
        } else {
          localStorage.removeItem('fd_admin_user')
          localStorage.removeItem('admin_token')
        }
      }
    } catch { localStorage.removeItem('fd_admin_user') }
  }, [])

  // ── Persist user to localStorage ──
  useEffect(() => {
    if (user) {
      try { localStorage.setItem('fd_admin_user', JSON.stringify(user)) } catch {}
    } else {
      localStorage.removeItem('fd_admin_user')
    }
  }, [user])

  // ── Listen for auth-expired (401 from api helper) ──
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      showToast('Session expired. Please log in again.', 'error')
    }
    window.addEventListener('fd:auth-expired', onExpired)
    return () => window.removeEventListener('fd:auth-expired', onExpired)
  }, [showToast])

  // ── Load admin data after login ──
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'sub_admin') {
      const perms = user?.permissions || []
      const hasAll = user?.role === 'admin'
      // Legacy permission tokens 'items', 'kits', 'smart' all map to the new 'inventory' nav
      const hasInventory = perms.includes('inventory') || perms.includes('items') || perms.includes('kits') || perms.includes('smart')
      if (hasAll || hasInventory)               api('admin/inventory/items?limit=200').then(d => !d.error && setItems(d.items || []))
      if (hasAll || perms.includes('delivery')) api('delivery-persons').then(d => !d.error && setDeliveryPersons(d))
      if (hasAll || perms.includes('orders'))   api('orders').then(d => !d.error && setOrders(d))
    }
  }, [user])

  const handleAuth = async () => {
    const email = authForm.email?.trim()
    const password = authForm.password
    if (!email) { showToast('Email is required', 'error'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { showToast('Please enter a valid email', 'error'); return }
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return }

    setLoading(true)
    try {
      const data = await api('auth/login', {
        method: 'POST',
        body: { email, password }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      if (data.role !== 'admin' && data.role !== 'sub_admin') {
        showToast('Admin access required', 'error'); return
      }
      // Save JWT token if present
      if (data.token) {
        localStorage.setItem('admin_token', data.token)
      }
      // Strip token from user object before storing
      const { token, ...userData } = data
      setUser(userData)
      showToast(`Welcome back, ${userData.name}!`, 'success')
    } catch (e) { showToast('Login failed', 'error') }
    finally { setLoading(false) }
  }

  const handleLogout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('fd_admin_user')
    setItems([])
    setDeliveryPersons([])
    setOrders([])
    setAdminTab('dashboard')
    showToast('Logged out successfully', 'success')
  }, [showToast])

  const ctxValue = {
    user, setUser,
    loading, setLoading,
    toast, setToast,
    authForm, setAuthForm,
    items, setItems,
    deliveryPersons, setDeliveryPersons,
    orders, setOrders,
    adminTab, setAdminTab,
    scanImage, setScanImage,
    scanName, setScanName,
    scanning, setScanning,
    scanAnalysis, setScanAnalysis,
    showToast,
    handleAuth,
    handleLogout,
  }

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  )
}
