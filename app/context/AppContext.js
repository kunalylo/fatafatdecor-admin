'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { SCREENS, api } from '../lib/constants'

export const AppContext = createContext({})
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [authMode, setAuthMode]           = useState('login')
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

  // Load admin data after login
  useEffect(() => {
    if (user?.role === 'admin') {
      api('items').then(d => !d.error && setItems(d))
      api('delivery-persons').then(d => !d.error && setDeliveryPersons(d))
      api('orders').then(d => !d.error && setOrders(d))
    }
  }, [user])

  const handleAuth = async () => {
    setLoading(true)
    try {
      const data = await api('auth/login', {
        method: 'POST',
        body: { email: authForm.email, password: authForm.password }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      if (data.role !== 'admin') { showToast('Admin access required', 'error'); return }
      setUser(data)
      showToast(`Welcome back, ${data.name}!`, 'success')
    } catch (e) { showToast('Login failed', 'error') }
    finally { setLoading(false) }
  }

  const ctxValue = {
    user, setUser,
    authMode, setAuthMode,
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
  }

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  )
}
