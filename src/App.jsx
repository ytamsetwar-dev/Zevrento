// =============================================
// Zevrento — App Router & Entry Point
// Role-based routing with protected routes
// =============================================
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store.jsx'

// Pages
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import CustomerHome from './pages/CustomerHome.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import CustomerBookings from './pages/CustomerBookings.jsx'
import CustomerProfile from './pages/CustomerProfile.jsx'
import RiderDashboard from './pages/RiderDashboard.jsx'
import RiderListEV from './pages/RiderListEV.jsx'
import RiderProfile from './pages/RiderProfile.jsx'
import AdminHubPanel from './pages/AdminHubPanel.jsx'

// ---- PROTECTED ROUTE ----
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useApp()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Route to appropriate panel based on role
    if (user?.role === 'ADMIN') return <Navigate to="/admin/hub-panel" replace />
    if (user?.role === 'RIDER') return <Navigate to="/rider/dashboard" replace />
    return <Navigate to="/customer/home" replace />
  }

  return children
}

// ---- PUBLIC ROUTE (redirect if already logged in) ----
function PublicRoute({ children }) {
  const { isAuthenticated, user } = useApp()

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/hub-panel" replace />
    if (user.role === 'RIDER') return <Navigate to="/rider/dashboard" replace />
    return <Navigate to="/customer/home" replace />
  }

  return children
}

// ---- MAIN APP ----
function AppRoutes() {
  return (
    <Routes>
      {/* Login & Signup */}
      <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Customer Routes */}
      <Route path="/customer/home" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerHome /></ProtectedRoute>
      } />
      <Route path="/customer/checkout" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}><CheckoutPage /></ProtectedRoute>
      } />
      <Route path="/customer/bookings" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerBookings /></ProtectedRoute>
      } />
      <Route path="/customer/profile" element={
        <ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerProfile /></ProtectedRoute>
      } />

      {/* Rider Routes */}
      <Route path="/rider/dashboard" element={
        <ProtectedRoute allowedRoles={['RIDER']}><RiderDashboard /></ProtectedRoute>
      } />
      <Route path="/rider/list-ev" element={
        <ProtectedRoute allowedRoles={['RIDER']}><RiderListEV /></ProtectedRoute>
      } />
      <Route path="/rider/profile" element={
        <ProtectedRoute allowedRoles={['RIDER']}><RiderProfile /></ProtectedRoute>
      } />

      {/* Admin Routes (Hidden) */}
      <Route path="/admin/hub-panel" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><AdminHubPanel /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
