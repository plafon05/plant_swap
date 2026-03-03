import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import PlantsPage from './pages/PlantsPage'
import MyPlantsPage from './pages/MyPlantsPage'
import OffersPage from './pages/OffersPage'
import HistoryPage from './pages/HistoryPage'
import ReportsPage from './pages/ReportsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  const { token, fetchProfile } = useAuthStore()

  useEffect(() => {
    if (token) fetchProfile()
  }, [token])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout><PlantsPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/my-plants" element={
            <PrivateRoute>
              <Layout><MyPlantsPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/offers" element={
            <PrivateRoute>
              <Layout><OffersPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/history" element={
            <PrivateRoute>
              <Layout><HistoryPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <Layout><ReportsPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}