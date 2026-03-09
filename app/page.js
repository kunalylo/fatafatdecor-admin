'use client'

import { AppProvider, useApp } from './context/AppContext'
import { SCREENS } from './lib/constants'
import Toast from './components/Toast'
import { BottomNav, DpBottomNav } from './components/BottomNav'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import UploadScreen from './screens/UploadScreen'
import GeneratingScreen from './screens/GeneratingScreen'
import DesignScreen from './screens/DesignScreen'
import BookingScreen from './screens/BookingScreen'
import TrackingScreen from './screens/TrackingScreen'
import CreditsScreen from './screens/CreditsScreen'
import OrdersScreen from './screens/OrdersScreen'
import OrderDetailScreen from './screens/OrderDetailScreen'
import ProfileScreen from './screens/ProfileScreen'
import AdminScreen from './screens/AdminScreen'
import DpAuthScreen from './screens/DpAuthScreen'
import DpHomeScreen from './screens/DpHomeScreen'
import DpOrderScreen from './screens/DpOrderScreen'
import DpVerifyScreen from './screens/DpVerifyScreen'
import DpActiveJobScreen from './screens/DpActiveJobScreen'
import DpCalendarScreen from './screens/DpCalendarScreen'
import DpEarningsScreen from './screens/DpEarningsScreen'
import DpProfileScreen from './screens/DpProfileScreen'

function AppContent() {
  const { screen, user, dpUser } = useApp()
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative overflow-hidden">
      <Toast />
      {/* User App Screens */}
      {screen === SCREENS.AUTH && <AuthScreen />}
      {screen === SCREENS.HOME && <HomeScreen />}
      {screen === SCREENS.UPLOAD && <UploadScreen />}
      {screen === SCREENS.GENERATING && <GeneratingScreen />}
      {screen === SCREENS.DESIGN && <DesignScreen />}
      {screen === SCREENS.BOOKING && <BookingScreen />}
      {screen === SCREENS.TRACKING && <TrackingScreen />}
      {screen === SCREENS.CREDITS && <CreditsScreen />}
      {screen === SCREENS.ORDERS && <OrdersScreen />}
      {screen === SCREENS.ORDER_DETAIL && <OrderDetailScreen />}
      {screen === SCREENS.PROFILE && <ProfileScreen />}
      {screen === SCREENS.ADMIN && <AdminScreen />}
      {/* Decorator App Screens */}
      {screen === SCREENS.DP_AUTH && <DpAuthScreen />}
      {screen === SCREENS.DP_HOME && <DpHomeScreen />}
      {screen === SCREENS.DP_ORDER && <DpOrderScreen />}
      {screen === SCREENS.DP_VERIFY && <DpVerifyScreen />}
      {screen === SCREENS.DP_ACTIVE_JOB && <DpActiveJobScreen />}
      {screen === SCREENS.DP_CALENDAR && <DpCalendarScreen />}
      {screen === SCREENS.DP_EARNINGS && <DpEarningsScreen />}
      {screen === SCREENS.DP_PROFILE && <DpProfileScreen />}
      {/* Navigation */}
      {user && !screen.startsWith('dp') && screen !== SCREENS.AUTH && screen !== SCREENS.GENERATING && <BottomNav />}
      {dpUser && screen.startsWith('dp') && screen !== SCREENS.DP_AUTH && screen !== SCREENS.DP_VERIFY && screen !== SCREENS.DP_ACTIVE_JOB && <DpBottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
