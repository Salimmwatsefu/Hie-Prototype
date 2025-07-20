import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DoctorDashboard from './pages/DoctorDashboard'
import NurseDashboard from './pages/NurseDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PatientList from './pages/PatientList'
import PatientDetails from './pages/PatientDetails'
import FraudAlerts from './pages/FraudAlerts'
import AuditLogs from './pages/AuditLogs'
import TransferPatient from './pages/TransferPatient'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

// Role-based Dashboard Router
function DashboardRouter() {
  const { user } = useAuth()
  
  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'doctor':
        return <DoctorDashboard />
      case 'nurse':
        return <NurseDashboard />
      case 'admin':
        return <AdminDashboard />
      default:
        return <Navigate to="/login" replace />
    }
  }
  
  return getDashboardComponent()
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardRouter />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardRouter />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}>
                <DashboardLayout>
                  <PatientList />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/patients/:id" element={
              <ProtectedRoute allowedRoles={['doctor', 'nurse', 'admin']}>
                <DashboardLayout>
                  <PatientDetails />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/transfer" element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DashboardLayout>
                  <TransferPatient />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/fraud-alerts" element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DashboardLayout>
                  <FraudAlerts />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/audit-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AuditLogs />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Unauthorized Route */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
                  <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
              </div>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

