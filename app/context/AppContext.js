'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { SCREENS, BUDGET_BRACKETS, api } from '../lib/constants'

export const AppContext = createContext({})
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [screen, setScreen] = useState(SCREENS.AUTH)
  const [prevScreen, setPrevScreen] = useState(null)
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [designs, setDesigns] = useState([])
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState([])
  const [deliveryPersons, setDeliveryPersons] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [slots, setSlots] = useState([])
  const [trackingData, setTrackingData] = useState(null)
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [uploadForm, setUploadForm] = useState({ room_type: 'Dining Room', occasion: 'birthday', description: '', budget: null })
  const [originalImage, setOriginalImage] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotHour, setSelectedSlotHour] = useState(null)
  const [seeded, setSeeded] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  // ===== DECORATOR/DELIVERY PERSON STATE =====
  const [dpUser, setDpUser] = useState(null)
  const [dpDashboard, setDpDashboard] = useState(null)
  const [dpOrders, setDpOrders] = useState([])
  const [dpSelectedOrder, setDpSelectedOrder] = useState(null)
  const [dpEarnings, setDpEarnings] = useState(null)
  const [dpCalendarData, setDpCalendarData] = useState(null)
  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [dpAuthForm, setDpAuthForm] = useState({ phone: '', password: '' })
  const [dpActiveTimer, setDpActiveTimer] = useState(null)
  const [dpTimerSeconds, setDpTimerSeconds] = useState(0)
  const [faceScanImage, setFaceScanImage] = useState(null)
  const [otpInput, setOtpInput] = useState('')
  const dpVideoRef = useRef(null)
  const dpTimerRef = useRef(null)
  const [appMode, setAppMode] = useState('user') // 'user' or 'decorator'
  // ===== AI SCANNER STATE (top-level to persist) =====
  const [scanImage, setScanImage] = useState(null)
  const [scanName, setScanName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanAnalysis, setScanAnalysis] = useState(null)
  const [adminTab, setAdminTab] = useState('smart')

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const navigate = useCallback((s) => {
    setPrevScreen(screen)
    setScreen(s)
  }, [screen])

  const goBack = useCallback(() => {
    if (prevScreen) setScreen(prevScreen)
    else setScreen(SCREENS.HOME)
  }, [prevScreen])

  useEffect(() => {
    if (!seeded) {
      api('seed', { method: 'POST' }).then(() => setSeeded(true)).catch(() => {})
    }
  }, [seeded])

  useEffect(() => {
    if (user) {
      api(`designs?user_id=${user.id}`).then(d => !d.error && setDesigns(d))
      api(`orders?user_id=${user.id}`).then(o => !o.error && setOrders(o))
      api('items').then(i => !i.error && setItems(i))
      if (user.role === 'admin') {
        api('delivery-persons').then(dp => !dp.error && setDeliveryPersons(dp))
      }
    }
  }, [user])

  useEffect(() => {
    if (screen === SCREENS.TRACKING && selectedOrder?.id) {
      const poll = setInterval(() => {
        api(`delivery/track/${selectedOrder.id}`).then(d => {
          if (!d.error) setTrackingData(d)
          else if (d.status === 404) clearInterval(poll) // stop polling if order not found
        })
      }, 5000)
      api(`delivery/track/${selectedOrder.id}`).then(d => { if (!d.error) setTrackingData(d) })
      return () => clearInterval(poll)
    }
  }, [screen, selectedOrder])

  useEffect(() => {
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        api('user/location', { method: 'POST', body: { user_id: user.id, lat: pos.coords.latitude, lng: pos.coords.longitude } })
      }, () => {}, { enableHighAccuracy: true })
    }
  }, [user])

  const handleGoogleAuth = async () => {
    setLoading(true)
    try {
      // Google OAuth via Google Identity Services (GSI)
      if (!window.google) {
        showToast('Google Sign-In not loaded. Please refresh.', 'error')
        setLoading(false); return
      }
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-placeholder.apps.googleusercontent.com',
        callback: async (response) => {
          // Decode JWT token from Google
          const base64Url = response.credential.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(window.atob(base64))
          const data = await api('auth/google', {
            method: 'POST',
            body: { google_id: payload.sub, email: payload.email, name: payload.name, photo_url: payload.picture }
          })
          if (data.error) { showToast(data.error, 'error'); return }
          setUser(data)
          showToast(`Welcome, ${data.name}!`, 'success')
          navigate(SCREENS.HOME)
        }
      })
      window.google.accounts.id.prompt()
    } catch (e) { showToast('Google Sign-In failed', 'error') }
    finally { setLoading(false) }
  }

  const handleAuth = async () => {
    setLoading(true)
    try {
      const endpoint = authMode === 'login' ? 'auth/login' : 'auth/register'
      const body = authMode === 'login' ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, phone: authForm.phone, password: authForm.password }
      const data = await api(endpoint, { method: 'POST', body })
      if (data.error) { showToast(data.error, 'error'); return }
      setUser(data)
      showToast(`Welcome${authMode === 'login' ? ' back' : ''}, ${data.name}!`, 'success')
      navigate(SCREENS.HOME)
    } catch (e) { showToast('Something went wrong', 'error') }
    finally { setLoading(false) }
  }

  const handleGenerate = async () => {
    if (!originalImage) { showToast('Please upload or take a photo of your space first!', 'error'); return }
    if (!uploadForm.budget) { showToast('Please select a budget bracket', 'error'); return }
    const budget = BUDGET_BRACKETS.find(b => b.id === uploadForm.budget)
    if (!budget) { showToast('Please select a budget', 'error'); return }
    // Budget is the decoration budget the customer wants — no restrictions
    if (user.credits <= 0) { showToast('No credits! Please purchase credits.', 'error'); navigate(SCREENS.CREDITS); return }
    navigate(SCREENS.GENERATING)
    try {
      const data = await api('designs/generate', {
        method: 'POST',
        body: { user_id: user.id, room_type: uploadForm.room_type, occasion: uploadForm.occasion, description: uploadForm.description, original_image: originalImage, budget_min: budget.min, budget_max: budget.max }
      })
      if (data.error) { showToast(data.error, 'error'); navigate(SCREENS.UPLOAD); return }
      setSelectedDesign(data)
      setUser(prev => ({ ...prev, credits: data.remaining_credits }))
      setDesigns(prev => [data, ...prev])
      navigate(SCREENS.DESIGN)
      showToast('Your space has been decorated!', 'success')
    } catch (e) { showToast('Generation failed. Try again.', 'error'); navigate(SCREENS.UPLOAD) }
  }

  const handleCreateOrder = async () => {
    if (!selectedDesign) return
    setLoading(true)
    try {
      let lat = null, lng = null, detectedCity = null
      try {
        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }))
        lat = pos.coords.latitude; lng = pos.coords.longitude
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          const geoData = await geoRes.json()
          detectedCity = geoData?.address?.city || geoData?.address?.town || geoData?.address?.county || null
        } catch (e) {}
      } catch (e) {}
      if (detectedCity) {
        const cityCheck = await api('city-check', { method: 'POST', body: { city: detectedCity } })
        if (!cityCheck.allowed) {
          showToast('Sorry! We currently serve only: ' + (cityCheck.active_cities?.join(', ') || 'selected cities') + '. You appear to be in ' + detectedCity + '.', 'error')
          setLoading(false); return
        }
      } else {
        const citiesData = await api('cities')
        const cityNames = (citiesData || []).map(c => c.name)
        const userCity = window.prompt('Please enter your city to proceed.\nAvailable cities: ' + cityNames.join(', '))
        if (!userCity) { showToast('City required to place order.', 'error'); setLoading(false); return }
        const cityCheck = await api('city-check', { method: 'POST', body: { city: userCity.trim() } })
        if (!cityCheck.allowed) {
          showToast('Sorry! We currently only serve: ' + (cityCheck.active_cities?.join(', ') || 'selected cities'), 'error')
          setLoading(false); return
        }
        detectedCity = userCity.trim()
      }
      const data = await api('orders', {
        method: 'POST',
        body: { user_id: user.id, design_id: selectedDesign.id, delivery_address: detectedCity || '', delivery_lat: lat, delivery_lng: lng }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedOrder(data)
      setOrders(prev => [data, ...prev])
      showToast('Order created! Now make payment & book delivery.', 'success')
      navigate(SCREENS.BOOKING)
    } catch (e) { showToast('Failed to create order', 'error') }
    finally { setLoading(false) }
  }

  const handlePayment = async (type, amount, orderId = null, creditsCount = 0) => {
    setLoading(true)
    try {
      const orderData = await api('payments/create-order', {
        method: 'POST',
        body: { type, amount, user_id: user.id, order_id: orderId, credits_count: creditsCount }
      })
      if (orderData.error) { showToast(orderData.error, 'error'); setLoading(false); return }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount, currency: 'INR',
        name: 'FatafatDecor', description: type === 'credits' ? `${creditsCount} AI Credits` : 'Decoration Delivery',
        order_id: orderData.razorpay_order_id,
        handler: async (response) => {
          const verify = await api('payments/verify', { method: 'POST', body: { ...response, payment_id: orderData.payment_id } })
          if (verify.success) {
            showToast('Payment successful!', 'success')
            if (type === 'credits') { setUser(prev => ({ ...prev, credits: (prev.credits || 0) + creditsCount })); navigate(SCREENS.HOME) }
            if (type === 'delivery' && orderId) { setSelectedOrder(prev => ({ ...prev, payment_status: 'partial', payment_amount: amount })) }
          } else { showToast('Payment verification failed', 'error') }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: '#EC4899' }
      }
      if (window.Razorpay) { new window.Razorpay(options).open() }
      else { showToast('Payment gateway loading...', 'error') }
    } catch (e) { showToast('Payment failed', 'error') }
    finally { setLoading(false) }
  }

  const handleBookSlot = async () => {
    if (!selectedOrder || !selectedDate || selectedSlotHour === null) { showToast('Please select date and time', 'error'); return }
    setLoading(true)
    try {
      const data = await api('delivery/book', { method: 'POST', body: { order_id: selectedOrder.id, date: selectedDate, hour: selectedSlotHour } })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedOrder(prev => ({ ...prev, delivery_person_id: data.delivery_person.id, delivery_slot: data.slot, delivery_status: 'assigned' }))
      showToast(`Booked! ${data.delivery_person.name} will deliver at ${data.slot.time_label}`, 'success')
    } catch (e) { showToast('Booking failed', 'error') }
    finally { setLoading(false) }
  }

  const loadSlots = async (date) => {
    setSelectedDate(date)
    setSelectedSlotHour(null)
    const data = await api(`delivery/slots?date=${date}`)
    if (!data.error) setSlots(data.slots || [])
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setOriginalImage(ev.target?.result)
      reader.readAsDataURL(file)
    }
  }

  // ===== DECORATOR APP - DATA LOADING =====
  useEffect(() => {
    if (dpUser) {
      api(`dp/dashboard/${dpUser.id}`).then(d => { if (!d.error) setDpDashboard(d) })
      api(`dp/orders/${dpUser.id}`).then(d => { if (!d.error) setDpOrders(d) })
      api(`dp/earnings/${dpUser.id}`).then(d => { if (!d.error) setDpEarnings(d) })
      // Auto update GPS
      if (navigator.geolocation) {
        const gpsInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(pos => {
            api('delivery/update-location', { method: 'POST', body: { delivery_person_id: dpUser.id, lat: pos.coords.latitude, lng: pos.coords.longitude } })
          }, () => {}, { enableHighAccuracy: true })
        }, 10000)
        navigator.geolocation.getCurrentPosition(pos => {
          api('delivery/update-location', { method: 'POST', body: { delivery_person_id: dpUser.id, lat: pos.coords.latitude, lng: pos.coords.longitude } })
        })
        return () => clearInterval(gpsInterval)
      }
    }
  }, [dpUser?.id])

  // Fetch calendar data when month or user changes (must be top-level to avoid infinite re-render)
  useEffect(() => {
    if (dpUser?.id) {
      api(`dp/calendar/${dpUser.id}?month=${calMonth}`).then(d => { if (!d.error) setDpCalendarData(d) })
    }
  }, [calMonth, dpUser?.id])

  // Timer countdown
  useEffect(() => {
    if (dpActiveTimer) {
      dpTimerRef.current = setInterval(() => {
        setDpTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(dpTimerRef.current)
            // ALARM - slot time over
            try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1hZmpvaXB0eH18fX17eXd2dXV2eHp9f4GDhYaIiImIh4WDgX57eHVycW9ub3BydHd6fYCDhomLjI2NjIuJh4WCf3x5dnNxb25ubm9xc3Z5fICDhomMjY+Pj46MioeEgX57eHVycG9ubm5vcXN2eXyAg4aJjI2Pj4+OjIqHhIF+e3h1cnBvbm5ub3Fzdn').play() } catch(e) {}
            showToast('Time is up! Your booked slot has ended.', 'error')
            setDpActiveTimer(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(dpTimerRef.current)
    }
  }, [dpActiveTimer])

  const handleDpLogin = async () => {
    setLoading(true)
    try {
      const data = await api('dp/login', { method: 'POST', body: dpAuthForm })
      if (data.error) { showToast(data.error, 'error'); return }
      setDpUser(data)
      showToast(`Welcome, ${data.name}!`, 'success')
      navigate(SCREENS.DP_HOME)
    } catch (e) { showToast('Login failed', 'error') }
    finally { setLoading(false) }
  }

  const startFaceScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (dpVideoRef.current) {
        dpVideoRef.current.srcObject = stream
        dpVideoRef.current.play()
      }
    } catch (e) { showToast('Camera access denied', 'error') }
  }

  const captureFace = () => {
    if (!dpVideoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = 320; canvas.height = 240
    canvas.getContext('2d').drawImage(dpVideoRef.current, 0, 0, 320, 240)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setFaceScanImage(dataUrl)
    const stream = dpVideoRef.current.srcObject
    if (stream) stream.getTracks().forEach(t => t.stop())
  }

  const submitFaceScan = async (orderId) => {
    if (!faceScanImage) { showToast('Please capture your face first', 'error'); return }
    setLoading(true)
    try {
      const data = await api('dp/face-scan', { method: 'POST', body: { order_id: orderId, dp_id: dpUser.id, face_image: faceScanImage } })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('Face verified! Now enter customer OTP.', 'success')
    } catch (e) { showToast('Face scan failed', 'error') }
    finally { setLoading(false) }
  }

  const verifyOtp = async (orderId) => {
    if (!otpInput || otpInput.length !== 4) { showToast('Enter 4-digit OTP', 'error'); return }
    setLoading(true)
    try {
      const data = await api('dp/verify-otp', { method: 'POST', body: { order_id: orderId, otp: otpInput } })
      if (data.error) { showToast(data.error, 'error'); return }
      showToast('OTP Verified! Decoration started.', 'success')
      // Start 1-hour timer (3600 seconds)
      setDpTimerSeconds(3600)
      setDpActiveTimer(orderId)
      setDpSelectedOrder(prev => ({ ...prev, delivery_status: 'decorating' }))
      navigate(SCREENS.DP_ACTIVE_JOB)
    } catch (e) { showToast('OTP verification failed', 'error') }
    finally { setLoading(false) }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const ctxValue = {
    screen, setScreen, prevScreen, setPrevScreen, user, setUser, authMode, setAuthMode,
    loading, setLoading, toast, setToast, designs, setDesigns, orders, setOrders,
    items, setItems, deliveryPersons, setDeliveryPersons, selectedDesign, setSelectedDesign,
    selectedOrder, setSelectedOrder, slots, setSlots, trackingData, setTrackingData,
    authForm, setAuthForm, uploadForm, setUploadForm, originalImage, setOriginalImage,
    selectedDate, setSelectedDate, selectedSlotHour, setSelectedSlotHour, seeded, setSeeded,
    dpUser, setDpUser, dpDashboard, setDpDashboard, dpOrders, setDpOrders,
    dpSelectedOrder, setDpSelectedOrder, dpEarnings, setDpEarnings,
    dpCalendarData, setDpCalendarData, calMonth, setCalMonth,
    dpAuthForm, setDpAuthForm, dpActiveTimer, setDpActiveTimer,
    dpTimerSeconds, setDpTimerSeconds, faceScanImage, setFaceScanImage,
    otpInput, setOtpInput, appMode, setAppMode,
    scanImage, setScanImage, scanName, setScanName, scanning, setScanning,
    scanAnalysis, setScanAnalysis, adminTab, setAdminTab,
    mapRef, mapInstance, dpVideoRef, dpTimerRef,
    showToast, navigate, goBack,
    handleGoogleAuth, handleAuth, handleGenerate, handleCreateOrder, handlePayment,
    handleBookSlot, loadSlots, handleFileUpload, handleDpLogin,
    startFaceScan, captureFace, submitFaceScan, verifyOtp, formatTimer
  }

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  )
}
