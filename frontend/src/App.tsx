import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import RootLayout from './layouts/RootLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ModulesPage from './pages/ModulesPage'
import LessonPage from './pages/LessonPage'
import AchievementsPage from './pages/AchievementsPage'
import ProfilePage from './pages/ProfilePage'
import DailyChallengesPage from './pages/DailyChallengesPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute><AuthLayout><LoginPage /></AuthLayout></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><AuthLayout><RegisterPage /></AuthLayout></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><RootLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="lessons/:lessonId" element={<LessonPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="daily" element={<DailyChallengesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
